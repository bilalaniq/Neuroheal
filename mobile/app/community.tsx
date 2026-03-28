import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, TextInput,
    StyleSheet, SafeAreaView, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Post, Category, Comment } from '../types/community';
import { mockPosts, mockUsers } from '../data/mockCommunityData';
import CommunityPost from '../components/CommunityPost';

type Tab = 'Trending' | 'Following' | 'Events';

const Community: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>(mockPosts);
    const [selectedTab, setSelectedTab] = useState<Tab>('Trending');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostCategory, setNewPostCategory] = useState<'Support' | 'General' | 'Mental Health'>('General');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    const tabs: Tab[] = ['Trending', 'Following', 'Events'];

    const filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter(post => post.category === selectedCategory);

    const handleLike = (postId: string) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) newSet.delete(postId);
            else newSet.add(postId);
            return newSet;
        });
    };

    const handleAddComment = (postId: string, commentText: string) => {
        const newComment: Comment = {
            id: `c${Date.now()}`,
            user: mockUsers[0],
            text: commentText,
            timestamp: new Date(),
        };
        setPosts(prev =>
            prev.map(post =>
                post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
            )
        );
    };

    const handleCreatePost = () => {
        if (newPostText.trim()) {
            const newPost: Post = {
                id: `p${Date.now()}`,
                user: mockUsers[0],
                text: newPostText.trim(),
                timestamp: new Date(),
                category: newPostCategory,
                likes: 0,
                comments: [],
            };
            setPosts(prev => [newPost, ...prev]);
            setNewPostText('');
            setShowCreatePost(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning!!!';
        if (hour < 17) return 'Good afternoon!!!';
        return 'Good evening!!!';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarIcon}>👤</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.searchIcon}>
                            <Text style={styles.searchIconText}>🔍</Text>
                        </View>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.greeting}>{getGreeting()}</Text>
                    <Text style={styles.title}>Community</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            style={[styles.tab, selectedTab === tab && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Posts Feed */}
                <FlatList
                    data={filteredPosts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CommunityPost
                            post={item}
                            isLiked={likedPosts.has(item.id)}
                            onLike={handleLike}
                            onAddComment={handleAddComment}
                        />
                    )}
                    contentContainerStyle={styles.feed}
                    showsVerticalScrollIndicator={false}
                />

                {/* Floating + Button */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowCreatePost(true)}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>

                {/* Create Post Modal */}
                <Modal visible={showCreatePost} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create Post</Text>
                            <TextInput
                                style={styles.postInput}
                                placeholder="What's on your mind?"
                                placeholderTextColor="#999"
                                value={newPostText}
                                onChangeText={setNewPostText}
                                multiline
                                autoFocus
                            />
                            <View style={styles.categoryPicker}>
                                {(['Support', 'General', 'Mental Health'] as const).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setNewPostCategory(cat)}
                                        style={[styles.categoryOption, newPostCategory === cat && styles.selectedCategory]}
                                    >
                                        <Text style={[styles.categoryOptionText, newPostCategory === cat && styles.selectedCategoryText]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setShowCreatePost(false)} style={styles.cancelButton}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCreatePost} style={styles.postButton}>
                                    <Text style={styles.postButtonText}>Post</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4,
    },
    headerLeft: {},
    headerRight: {},
    avatarPlaceholder: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarIcon: { fontSize: 18 },
    searchIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIconText: { fontSize: 16 },
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
        fontWeight: '400',
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.5,
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#E8E8ED',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#1A1A1A',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#FFF',
        fontWeight: '700',
    },
    feed: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '300',
        lineHeight: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
        marginBottom: 16,
    },
    postInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        color: '#111',
        backgroundColor: '#FAFAFA',
    },
    categoryPicker: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    categoryOption: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedCategory: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    categoryOptionText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    selectedCategoryText: {
        color: '#FFF',
        fontWeight: '700',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 25,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#555',
        fontWeight: '700',
        fontSize: 16,
    },
    postButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 25,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    postButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default Community;