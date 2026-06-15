import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  notificationDrawerOpen: boolean;
  rightContextPanelOpen: boolean;
  commandPaletteOpen: boolean;
  quickCreateTaskOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  notificationDrawerOpen: false,
  rightContextPanelOpen: false,
  commandPaletteOpen: false,
  quickCreateTaskOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleNotificationDrawer: (state) => {
      state.notificationDrawerOpen = !state.notificationDrawerOpen;
    },
    setNotificationDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationDrawerOpen = action.payload;
    },
    toggleRightContextPanel: (state) => {
      state.rightContextPanelOpen = !state.rightContextPanelOpen;
    },
    setRightContextPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.rightContextPanelOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    toggleQuickCreateTask: (state) => {
      state.quickCreateTaskOpen = !state.quickCreateTaskOpen;
    },
    setQuickCreateTaskOpen: (state, action: PayloadAction<boolean>) => {
      state.quickCreateTaskOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleNotificationDrawer,
  setNotificationDrawerOpen,
  toggleRightContextPanel,
  setRightContextPanelOpen,
  toggleCommandPalette,
  setCommandPaletteOpen,
  toggleQuickCreateTask,
  setQuickCreateTaskOpen,
} = uiSlice.actions;
export default uiSlice.reducer;
export type { UIState };
