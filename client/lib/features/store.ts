import { configureStore } from "@reduxjs/toolkit";
import themeSlice from "./slices/theme.slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      theme: themeSlice,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export default makeStore;
