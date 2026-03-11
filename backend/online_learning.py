"""
Online learning manager for real-time model updates.
Handles single-sample gradient updates with experience replay to prevent catastrophic forgetting.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import deque
import random
import numpy as np
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class OnlineLearningManager:
    """
    Manages online learning with experience replay and safety mechanisms.

    Features:
    - Single-sample gradient updates
    - Experience replay buffer to prevent catastrophic forgetting
    - Confidence-based update filtering
    - Metrics tracking
    """

    def __init__(
        self,
        model: nn.Module,
        learning_rate: float = 0.0001,
        replay_buffer_size: int = 100,
        replay_frequency: int = 10,
        confidence_threshold: float = 0.8,
        device: str = "cpu"
    ):
        """
        Initialize the online learning manager.

        Args:
            model: PyTorch model
            learning_rate: Learning rate for online updates (lower than batch training)
            replay_buffer_size: Size of experience replay buffer
            replay_frequency: Replay buffer every N updates
            confidence_threshold: Only update if prediction confidence < threshold
            device: Device to run on ('cpu' or 'cuda')
        """
        self.model = model.to(device)
        self.device = device
        self.learning_rate = learning_rate
        self.replay_frequency = replay_frequency
        self.confidence_threshold = confidence_threshold

        # Optimizer with low learning rate
        self.optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=learning_rate,
            weight_decay=1e-5  # L2 regularization
        )

        # Loss function
        self.criterion = nn.CrossEntropyLoss()

        # Experience replay buffer
        self.replay_buffer = deque(maxlen=replay_buffer_size)

        # Metrics
        self.update_count = 0
        self.total_updates = 0
        self.skipped_updates = 0
        self.recent_losses = []

    def predict(self, input_data: torch.Tensor) -> Tuple[int, torch.Tensor, float]:
        """
        Make a prediction.

        Args:
            input_data: Input tensor (batch_size, features)

        Returns:
            Tuple of (predicted_class, probabilities, confidence)
        """
        self.model.eval()

        with torch.no_grad():
            input_data = input_data.to(self.device)
            logits = self.model(input_data)
            probs = F.softmax(logits, dim=1)
            prediction = torch.argmax(probs, dim=1)
            confidence = torch.max(probs, dim=1)[0]

        return prediction.item(), probs.cpu(), confidence.item()

    def should_update(self, confidence: float) -> bool:
        """
        Determine if model should be updated based on confidence.

        Args:
            confidence: Prediction confidence (0-1)

        Returns:
            True if model should be updated
        """
        # Update if confidence is below threshold (model is uncertain)
        return confidence < self.confidence_threshold

    def online_update(
        self,
        input_data: torch.Tensor,
        true_label: int,
        force_update: bool = False
    ) -> dict:
        """
        Perform a single-sample gradient update.

        Args:
            input_data: Input tensor (1, features)
            true_label: True class label (integer)
            force_update: Force update even if confidence is high

        Returns:
            Dictionary with update metrics
        """
        self.model.train()

        # Convert label to tensor
        label_tensor = torch.tensor([true_label], dtype=torch.long).to(self.device)
        input_data = input_data.to(self.device)

        # Get current prediction confidence
        with torch.no_grad():
            logits = self.model(input_data)
            probs = F.softmax(logits, dim=1)
            confidence = torch.max(probs).item()

        # Decide whether to update
        if not force_update and not self.should_update(confidence):
            self.skipped_updates += 1
            logger.info(f"Skipped update (high confidence: {confidence:.3f})")
            return {
                "updated": False,
                "reason": "high_confidence",
                "confidence": confidence,
                "loss": None
            }

        # Forward pass
        logits = self.model(input_data)
        loss = self.criterion(logits, label_tensor)

        # Backward pass
        self.optimizer.zero_grad()
        loss.backward()

        # Gradient clipping to prevent exploding gradients
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

        self.optimizer.step()

        # Store in replay buffer
        self.replay_buffer.append((input_data.cpu(), label_tensor.cpu()))

        # Track metrics
        self.update_count += 1
        self.total_updates += 1
        self.recent_losses.append(loss.item())
        if len(self.recent_losses) > 100:
            self.recent_losses.pop(0)

        logger.info(f"Online update {self.update_count}: loss={loss.item():.4f}, confidence={confidence:.3f}")

        # Periodic replay
        if self.update_count % self.replay_frequency == 0:
            replay_loss = self._replay_experience()
            logger.info(f"Experience replay: avg_loss={replay_loss:.4f}")

        return {
            "updated": True,
            "loss": loss.item(),
            "confidence": confidence,
            "update_count": self.update_count,
            "total_updates": self.total_updates
        }

    def batch_update(self, batch_data: list) -> dict:
        """
        Perform batch gradient update on accumulated session data.

        Args:
            batch_data: List of (input_tensor, label_idx) tuples

        Returns:
            Dictionary with batch update metrics
        """
        if len(batch_data) == 0:
            return {
                "updated": False,
                "reason": "empty_batch",
                "avg_loss": None,
                "total_updates": self.total_updates
            }

        self.model.train()

        # Combine all samples into batches
        all_inputs = torch.cat([data[0] for data in batch_data], dim=0).to(self.device)
        all_labels = torch.tensor([data[1] for data in batch_data], dtype=torch.long).to(self.device)

        # Forward pass on entire batch
        logits = self.model(all_inputs)
        loss = self.criterion(logits, all_labels)

        # Backward pass
        self.optimizer.zero_grad()
        loss.backward()

        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

        self.optimizer.step()

        # Store all samples in replay buffer
        for input_data, label_idx in batch_data:
            label_tensor = torch.tensor([label_idx], dtype=torch.long)
            self.replay_buffer.append((input_data.cpu(), label_tensor.cpu()))

        # Track metrics
        batch_size = len(batch_data)
        self.total_updates += batch_size
        avg_loss = loss.item()
        self.recent_losses.append(avg_loss)
        if len(self.recent_losses) > 100:
            self.recent_losses.pop(0)

        logger.info(f"Batch update complete: {batch_size} samples, avg_loss={avg_loss:.4f}")

        # Perform experience replay
        replay_loss = self._replay_experience(n_samples=min(10, len(self.replay_buffer)))
        logger.info(f"Experience replay after batch: avg_loss={replay_loss:.4f}")

        return {
            "updated": True,
            "avg_loss": avg_loss,
            "batch_size": batch_size,
            "total_updates": self.total_updates,
            "replay_loss": replay_loss
        }

    def _replay_experience(self, n_samples: int = 5) -> float:
        """
        Replay random samples from the buffer to prevent forgetting.

        Args:
            n_samples: Number of samples to replay

        Returns:
            Average replay loss
        """
        if len(self.replay_buffer) < 5:
            return 0.0

        self.model.train()
        total_loss = 0.0

        # Sample from buffer
        samples = random.sample(
            self.replay_buffer,
            min(n_samples, len(self.replay_buffer))
        )

        for data, label in samples:
            data = data.to(self.device)
            label = label.to(self.device)

            # Forward pass
            logits = self.model(data)
            loss = self.criterion(logits, label)

            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item()

        return total_loss / len(samples)

    def get_metrics(self) -> dict:
        """Get current metrics."""
        return {
            "total_updates": self.total_updates,
            "skipped_updates": self.skipped_updates,
            "replay_buffer_size": len(self.replay_buffer),
            "avg_recent_loss": np.mean(self.recent_losses) if self.recent_losses else None,
            "learning_rate": self.learning_rate
        }

    def reset_metrics(self):
        """Reset update counters."""
        self.update_count = 0
        self.recent_losses = []

    def save_checkpoint(self, path: str):
        """Save model and optimizer state."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'update_count': self.update_count,
            'total_updates': self.total_updates,
            'replay_buffer': list(self.replay_buffer)
        }, path)
        logger.info(f"Checkpoint saved to {path}")

    def load_checkpoint(self, path: str):
        """Load model and optimizer state."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.update_count = checkpoint.get('update_count', 0)
        self.total_updates = checkpoint.get('total_updates', 0)

        # Restore replay buffer if available
        if 'replay_buffer' in checkpoint:
            self.replay_buffer = deque(checkpoint['replay_buffer'], maxlen=self.replay_buffer.maxlen)

        logger.info(f"Checkpoint loaded from {path}")
