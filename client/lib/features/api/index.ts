import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URI;

if (!serverUrl) {
    throw new Error("server url is missing");
}

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: serverUrl,
        credentials: "include",
    })
});
