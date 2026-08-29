import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { api } from "@/lib/axios";

export interface ApiError {
    status?: number;
    message: string;
}

interface QueryArgs {
    url: string;
    method?: AxiosRequestConfig["method"];
    data?: unknown;
    params?: unknown;
}

export const axiosBaseQuery = (): BaseQueryFn<QueryArgs, unknown, ApiError> => async ({ url, method = "GET", data, params }) => {
    try {
        const result = await api({ url, method, data, params });
        return { data: result.data };
    } catch (error) {
        const axiosError = error as AxiosError<{ error?: string }>;

        return {
            error: {
                status: axiosError.response?.status,
                message: axiosError.response?.data?.error ?? axiosError.message,
            },
        };
    }
};