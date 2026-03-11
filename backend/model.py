"""
PyTorch model definition for migraine classification.
This model is used for both initial training (Vertex AI) and online learning (Cloud Run).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class MigraineClassifier(nn.Module):
    """
    Neural network for multi-class migraine classification.

    Architecture:
    - Input layer: 50 features (23 original + 27 expandable fields)
    - Hidden layers: Configurable (default: [64, 32])
    - Output layer: 8 classes (7 migraine types + No migraine)
    - Dropout for regularization

    Note: Extra features beyond the original 23 are zero-padded by default
          and populated through user interaction for online learning.
    """

    def __init__(self, input_dim=50, hidden_dims=[64, 32], num_classes=8, dropout_rate=0.3):
        super(MigraineClassifier, self).__init__()

        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        self.num_classes = num_classes

        # Build layers
        self.fc1 = nn.Linear(input_dim, hidden_dims[0])
        self.bn1 = nn.BatchNorm1d(hidden_dims[0])

        self.fc2 = nn.Linear(hidden_dims[0], hidden_dims[1])
        self.bn2 = nn.BatchNorm1d(hidden_dims[1])

        self.fc3 = nn.Linear(hidden_dims[1], num_classes)

        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x):
        """Forward pass through the network."""
        # Layer 1
        x = self.fc1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout(x)

        # Layer 2
        x = self.fc2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.dropout(x)

        # Output layer
        x = self.fc3(x)

        return x

    def predict_proba(self, x):
        """Get probability predictions."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = F.softmax(logits, dim=1)
        return probs

    def predict(self, x):
        """Get class predictions."""
        probs = self.predict_proba(x)
        return torch.argmax(probs, dim=1)


# Class mapping
CLASS_NAMES = [
    "No migraine",
    "Migraine without aura",
    "Migraine with aura",
    "Typical aura with migraine",
    "Typical aura without migraine",
    "Familial hemiplegic migraine",
    "Basilar-type aura",
    "Other"
]

# Feature names in order (original 23 from dataset)
FEATURE_NAMES = [
    'Age', 'Duration', 'Frequency', 'Location', 'Character', 'Intensity',
    'Nausea', 'Vomit', 'Phonophobia', 'Photophobia', 'Visual', 'Sensory',
    'Dysphasia', 'Dysarthria', 'Vertigo', 'Tinnitus', 'Hypoacusis',
    'Diplopia', 'Defect', 'Ataxia', 'Conscience', 'Paresthesia', 'DPF'
]

# Extended feature names for expandable model (50 total)
# Features 24-50 are reserved for future app-specific fields
EXTENDED_FEATURE_NAMES = FEATURE_NAMES + [
    f'Extended_Feature_{i}' for i in range(1, 28)  # 27 additional features
]
