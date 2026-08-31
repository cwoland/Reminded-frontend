import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import type {
  AuthResponse,
  CreateTaskInput,
  Credentials,
  Task,
  TaskStatus,
  UpdateTaskInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  AddCommentInput,
  DeleteCommentInput,
} from "@/types/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Task", "User", "Project"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: "/auth/register", method: "POST", data: body }),
    }),
    login: builder.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
    }),

    getTasks: builder.query<Task[], { status?: TaskStatus; tag?: string } | void>({
      query: (filters) => ({ url: "/tasks", params: filters ?? undefined }),
      providesTags: ["Task"],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => ({ url: `/tasks/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation<Task, CreateTaskInput>({
      query: (body) => ({ url: "/tasks", method: "POST", data: body }),
      invalidatesTags: ["Task"],
    }),
    updateTask: builder.mutation<Task, { id: string; patch: UpdateTaskInput }>({
      query: ({ id, patch }) => ({ url: `/tasks/${id}`, method: "PATCH", data: patch }),
      invalidatesTags: (_result, _error, { id }) => ["Task", { type: "Task", id }],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["Task"],
    }),
        getProjects: builder.query<Project[], void>({
      query: () => ({ url: "/projects" }),
      providesTags: ["Project"],
    }),
    createProject: builder.mutation<Project, CreateProjectInput>({
      query: (body) => ({ url: "/projects", method: "POST", data: body }),
      invalidatesTags: ["Project", "Task"],
    }),
    updateProject: builder.mutation<Project, { id: string; patch: UpdateProjectInput }>({
      query: ({ id, patch }) => ({ url: `/projects/${id}`, method: "PATCH", data: patch }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Project", "Task"],
    }),
        addComment: builder.mutation<Task, AddCommentInput>({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        data: { body },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
    }),
    deleteComment: builder.mutation<Task, DeleteCommentInput>({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = api;