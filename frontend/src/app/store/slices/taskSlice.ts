import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
}

interface TaskState {
  view: 'list' | 'board' | 'calendar' | 'timeline' | 'table';
  filters: TaskFilters;
  selectedTaskId: string | null;
}

const initialState: TaskState = {
  view: 'board',
  filters: {
    status: undefined,
    priority: undefined,
    assignedTo: undefined,
    search: '',
  },
  selectedTaskId: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<TaskState['view']>) => {
      state.view = action.payload;
    },
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        status: undefined,
        priority: undefined,
        assignedTo: undefined,
        search: '',
      };
    },
    setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
  },
});

export const { setView, setFilters, resetFilters, setSelectedTaskId } = taskSlice.actions;
export default taskSlice.reducer;
export type { TaskState };
