import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

interface WorkspaceState {
  activeWorkspaceId: string | null;
  workspaces: WorkspaceInfo[];
  members: any[];
  isLoading: boolean;
}

const initialState: WorkspaceState = {
  activeWorkspaceId: localStorage.getItem('active_workspace_id'),
  workspaces: [],
  members: [],
  isLoading: false,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspaceId: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload;
      if (action.payload) {
        localStorage.setItem('active_workspace_id', action.payload);
      } else {
        localStorage.removeItem('active_workspace_id');
      }
    },
    setWorkspaces: (state, action: PayloadAction<WorkspaceInfo[]>) => {
      state.workspaces = action.payload;
      if (action.payload.length > 0 && !state.activeWorkspaceId) {
        state.activeWorkspaceId = action.payload[0].id;
        localStorage.setItem('active_workspace_id', action.payload[0].id);
      }
    },
    setMembers: (state, action: PayloadAction<any[]>) => {
      state.members = action.payload;
    },
    clearWorkspaceState: (state) => {
      state.activeWorkspaceId = null;
      state.workspaces = [];
      state.members = [];
    },
  },
});

export const { setActiveWorkspaceId, setWorkspaces, setMembers, clearWorkspaceState } = workspaceSlice.actions;
export default workspaceSlice.reducer;
export type { WorkspaceState };
