import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import themeSlice from "./slices/theme.slice";
import { apiSlice } from "./api"; // custom Axios base query file

/**
 * We create a makeStore function to ensure that the store is
 * re-initialized for every request on the server-side,
 * which is a requirement for Next.js App Router.
 */
export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // standard slices
      theme: themeSlice,

      // The API Slice reducer
      // This handles all cached data.
      [apiSlice.reducerPath]: apiSlice.reducer,
    },

    // Adding the api middleware
    // This is required for RTK Query to handle caching, invalidation, and polling.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Often useful when handling complex API responses
      }).concat(apiSlice.middleware),
  });

  // Optional: Enables refetchOnFocus and refetchOnReconnect behaviors
  // This is great for a polished UX in web apps.
  setupListeners(store.dispatch);

  return store;
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
