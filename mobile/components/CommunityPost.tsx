import React, { useState } from 'react';
import {
    View, Text, Image, TouchableOpacity, TextInput,
    FlatList, StyleSheet
} from 'react-native';
import { Post } from '../types/community';
import CommunityComment from './CommunityComment';

interface CommunityPostProps {
    post: Post;
    isLiked: boolean;
    onLike: (postId: string) => void;
    onAddComment: (postId: string, commentText: string) => void;
}

const CommunityPost: React.FC<CommunityPostProps> = ({ post, isLiked, onLike, onAddComment }) => {
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const handleAddComment = () => {
        if (commentText.trim()) {
            onAddComment(post.id, commentText.trim());
            setCommentText('');
        }
    };

    const formatCount = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return `${n}`;
    };

    const likeCount = post.likes + (isLiked ? 1 : 0);

    return (
        <View style={styles.card}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{post.user.username}</Text>
                    <Text style={styles.handle}>@{post.user.username.toLowerCase().replace(' ', '')}</Text>
                </View>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{post.category}</Text>
                </View>
            </View>

            {/* Post Text */}
            <Text style={styles.postText} numberOfLines={3}>{post.text}</Text>

            {/* Image placeholder if post has image */}
            {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            )}

            {/* Actions Row */}
            <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => onLike(post.id)} style={styles.actionItem}>
                    <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                    <Text style={[styles.actionCount, isLiked && styles.likedCount]}>
                        {formatCount(likeCount)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.actionItem}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionCount}>{formatCount(post.comments.length)}</Text>
                </TouchableOpacity>

                <View style={styles.actionItem}>
                    <Text style={styles.actionIcon}>👁</Text>
                    <Text style={styles.actionCount}>{formatCount(post.likes * 20)}</Text>
                </View>

                <TouchableOpacity style={styles.actionItem}>
                    <Text style={styles.actionIcon}>↑</Text>
                </TouchableOpacity>
            </View>

            {/* Comments Section */}
            {showComments && (
                <View style={styles.commentsSection}>
                    {post.comments.length > 0 && (
                        <FlatList
                            data={post.comments}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <CommunityComment comment={item} />}
                            scrollEnabled={false}
                        />
                    )}
                    <View style={styles.addComment}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add a comment..."
                            placeholderTextColor="#999"
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity onPress={handleAddComment} style={styles.commentButton}>
                            <Text style={styles.commentButtonText}>Post</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        backgroundColor: '#E0E0E0',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontWeight: '700',
        fontSize: 15,
        color: '#111',
    },
    handle: {
        fontSize: 13,
        color: '#999',
        marginTop: 1,
    },
    categoryBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 11,
        color: '#555',
        fontWeight: '600',
    },
    postText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 12,
    },
    postImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#F0F0F0',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
        gap: 20,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionIcon: {
        fontSize: 16,
    },
    actionCount: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    likedCount: {
        color: '#E0245E',
    },
    commentsSection: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
    },
    addComment: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#FAFAFA',
        fontSize: 14,
        color: '#111',
    },
    commentButton: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    commentButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
});

export default CommunityPost;