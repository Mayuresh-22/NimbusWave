import { createSlice } from "@reduxjs/toolkit";

export interface Project {
  projectID: string;
  chatId: string;
}

export interface ProjectState {
  project: Project | null;
  projects: Project[];
}

const initialState: ProjectState = {
  project: null,
  projects: [],
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProject(state, action: { payload: Project; type: string }) {
      state.project = action.payload;
    },
    addProject(state, action: { payload: Project; type: string }) {
      state.projects = [...state.projects, action.payload];
    },
  },
});

export const { setProject, addProject } = projectSlice.actions;
export default projectSlice.reducer;
