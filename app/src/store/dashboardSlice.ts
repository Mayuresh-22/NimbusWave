import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface Project {
  project_id: string;
  user_id: string;
  project_name: string;
  project_app_name: string;
  project_description: string;
  project_status: number;
  project_framework: string;
  project_type: string;
  project_url: string;
  deployments?: Deployment[];
  created_at: string;
  updated_at: string;
}

export interface Deployment {
  deployment_id: string;
  project_id: string;
  project_name: string;
  deployment_name: string;
  deployment_logs: string;
  deployment_status: number;
  deployment_size: number;
  tike_take: number;
  created_at: string;
}

export interface DashboardState {
  projects: Project[];
  deployments: Deployment[];
  numOfProjects: number;
}

const initialState: DashboardState = {
  projects: [],
  deployments: [],
  numOfProjects: 0,
};

const dashboardSlice = createSlice({
  name: "dashboardSlice",
  initialState: initialState,
  reducers: {
    setProjects(state: DashboardState, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
    },
    setDeployments(state: DashboardState, action: PayloadAction<Deployment[]>) {
      state.deployments = action.payload;
    },
    setNumOfProjects(state: DashboardState, action: PayloadAction<number>) {
      state.numOfProjects = action.payload;
    },
  },
});

export default dashboardSlice.reducer;
export const { setProjects, setDeployments, setNumOfProjects } =
  dashboardSlice.actions;
