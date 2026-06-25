import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "light" | "dark" | "system";

export interface InitialStateTypes {
  isSidebarCollapsed: boolean;
  theme: ThemePreference;
  lowStockThreshold: number;
}

const initialState: InitialStateTypes = {
  isSidebarCollapsed: false,
  theme: "system",
  lowStockThreshold: 100,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload;
    },
    setLowStockThreshold: (state, action: PayloadAction<number>) => {
      state.lowStockThreshold = Math.max(0, Math.round(action.payload));
    },
    resetPreferences: (state) => {
      state.isSidebarCollapsed = initialState.isSidebarCollapsed;
      state.theme = initialState.theme;
      state.lowStockThreshold = initialState.lowStockThreshold;
    },
  },
});

export const {
  resetPreferences,
  setIsSidebarCollapsed,
  setLowStockThreshold,
  setTheme,
} = globalSlice.actions;

export default globalSlice.reducer;
