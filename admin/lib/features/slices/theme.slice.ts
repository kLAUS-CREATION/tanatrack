import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ITheme {
  isDark: boolean;
}

const initialState: ITheme = {
  isDark: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", JSON.stringify(state.isDark));
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
