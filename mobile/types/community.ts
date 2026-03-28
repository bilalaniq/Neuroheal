export interface User {
    id: string;
    username: string;
    avatar: string;
}

export interface Comment {
    id: string;
    user: User;
    text: string;
    timestamp: Date;
}

export interface Post {
    id: string;
    user: User;
    text: string;
    timestamp: Date;
    category: 'Support' | 'General' | 'Mental Health';
    likes: number;
    comments: Comment[];
}

export type Category = 'All' | 'Support' | 'General' | 'Mental Health';