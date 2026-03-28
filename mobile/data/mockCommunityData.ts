import { Post, User, Comment } from '../types/community';

export const mockUsers: User[] = [
    {
        id: '1',
        username: 'Sarah Miller',
        avatar: 'https://i.pravatar.cc/150?img=47',
    },
    {
        id: '2',
        username: 'John Korkowski',
        avatar: 'https://i.pravatar.cc/150?img=12',
    },
    {
        id: '3',
        username: 'Emma Davis',
        avatar: 'https://i.pravatar.cc/150?img=32',
    },
    {
        id: '4',
        username: 'Alex Chen',
        avatar: 'https://i.pravatar.cc/150?img=68',
    },
];

export const mockComments: Comment[] = [
    {
        id: 'c1',
        user: mockUsers[2],
        text: 'Thanks for sharing this, it really helps!',
        timestamp: new Date('2024-03-01T10:30:00Z'),
    },
    {
        id: 'c2',
        user: mockUsers[3],
        text: 'I feel the same way. You are not alone.',
        timestamp: new Date('2024-03-01T11:15:00Z'),
    },
    {
        id: 'c3',
        user: mockUsers[0],
        text: 'Deep breathing exercises helped me a lot.',
        timestamp: new Date('2024-03-02T09:00:00Z'),
    },
];

export const mockPosts: Post[] = [
    {
        id: 'p1',
        user: mockUsers[1],
        text: 'Please note that some processing of your personal data may not require your consent, but you have a right to object to such processing...',
        timestamp: new Date('2024-03-01T09:00:00Z'),
        category: 'General',
        likes: 23600,
        comments: [mockComments[0], mockComments[1]],
    },
    {
        id: 'p2',
        user: mockUsers[0],
        text: 'Had a really tough week dealing with migraines. Anyone have tips for managing the pain naturally? I have tried everything.',
        timestamp: new Date('2024-03-02T14:00:00Z'),
        category: 'Support',
        likes: 4820,
        comments: [mockComments[2]],
    },
    {
        id: 'p3',
        user: mockUsers[2],
        text: 'Dealing with anxiety alongside chronic pain. Meditation has been a game changer for me. Anyone else tried mindfulness?',
        timestamp: new Date('2024-03-03T16:00:00Z'),
        category: 'Mental Health',
        likes: 7300,
        comments: [],
    },
    {
        id: 'p4',
        user: mockUsers[3],
        text: 'New research shows that regular exercise can significantly reduce migraine frequency. I started 30 min walks daily and it helped!',
        timestamp: new Date('2024-03-04T12:00:00Z'),
        category: 'General',
        likes: 10200,
        comments: [mockComments[0]],
    },
    {
        id: 'p5',
        user: mockUsers[1],
        text: 'Looking for a support buddy to check in with daily. Anyone interested? We can share our wins and struggles together.',
        timestamp: new Date('2024-03-05T08:00:00Z'),
        category: 'Support',
        likes: 3100,
        comments: [],
    },
];