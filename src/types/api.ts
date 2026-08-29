export type TaskStatus = "planned" | "in_progress" | "done" | "cancelled";

export interface User {
    id: string;
    username: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    authorId: string;
    body: string;
    createdAt: string;
}

export interface Task {
    id: string;
    ownerId: string;
    projectId?: string;
    title: string;
    description: string;
    status: TaskStatus;
    tags: string[];
    comments: Comment[] | null;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Credentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    tags?: string[];
    projectId?: string;
    dueDate?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: TaskStatus;
    tags?: string[];
    dueDate?: string;
}