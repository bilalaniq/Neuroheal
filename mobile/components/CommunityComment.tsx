import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Comment } from '../types/community';

interface CommunityCommentProps {
    comment: Comment;
}

const CommunityComment: React.FC<CommunityCommentProps> = ({ comment }) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
            <View style={styles.bubble}>
                <Text style={styles.username}>{comment.user.username}</Text>
                <Text style={styles.text}>{comment.text}</Text>
                <Text style={styles.timestamp}>
                    {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        backgroundColor: '#E0E0E0',
    },
    bubble: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 10,
    },
    username: {
        fontWeight: '700',
        fontSize: 13,
        color: '#111',
        marginBottom: 2,
    },
    text: {
        fontSize: 14,
        color: '#333',
        lineHeight: 19,
    },
    timestamp: {
        fontSize: 11,
        color: '#AAA',
        marginTop: 4,
    },
});

export default CommunityComment;