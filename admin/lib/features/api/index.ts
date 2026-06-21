import { createApi } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, AxiosError } from "axios";
import apiClient from "@/lib/config/axios";

const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method: AxiosRequestConfig["method"];
      body?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
      headers?: AxiosRequestConfig["headers"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, body, params, headers }) => {
    try {
      const result = await apiClient({
        url,
        method,
        data: body,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Auth", "User", "Features", "Plans"],
  endpoints: () => ({}),
});
