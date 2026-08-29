import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import type {
  AuthResponse,
  CreateTaskInput,
  Credentials,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Task", "User"],
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
} = api;