import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProjectInfo {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
}

interface ProjectState {
  activeProjectId: string | null;
  projects: ProjectInfo[];
}

const initialState: ProjectState = {
  activeProjectId: null,
  projects: [],
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProjectId: (state, action: PayloadAction<string | null>) => {
      state.activeProjectId = action.payload;
    },
    setProjects: (state, action: PayloadAction<ProjectInfo[]>) => {
      state.projects = action.payload;
    },
    clearProjectState: (state) => {
      state.activeProjectId = null;
      state.projects = [];
    },
  },
});

export const { setActiveProjectId, setProjects, clearProjectState } = projectSlice.actions;
export default projectSlice.reducer;
export type { ProjectState };
