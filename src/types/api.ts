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

export interface Project {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectInput {
    title: string;
    description?: string;
    color?: string;
    tasks?: string[];
}

export interface UpdateProjectInput {
    title?: string;
    description?: string;
    color?: string;
}

export interface Task {
    id: string;
    ownerId: string;
    projectId?: string | null;
    title: string;
    description: string;
    status: TaskStatus;
    tags: string[];
    comments: Comment[];
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    spentMinutes: number;
    startedAt?: string | null;
    completedAt: string | null;
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
    dueDate?: string | null;
    projectId?: string | null;
    spentMinutes?: number;
}

export type DueFilter = "any" | "overdue" | "today" | "week";

export interface AddCommentInput {
  taskId: string;
  body: string;
}

export interface DeleteCommentInput {
  taskId: string;
  commentId: string;
}