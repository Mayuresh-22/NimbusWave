import { configureStore } from "@reduxjs/toolkit";
import type { DashboardState } from "./dashboardSlice";
import dashboardReducer from "./dashboardSlice";
import type { ProjectState } from "./projectSlice";
import projectReducer from "./projectSlice";
import type { UserState } from "./userSlice";
import userReducer from "./userSlice";

export interface RootState {
  user: UserState;
  project: ProjectState;
  dashboard: DashboardState;
}

const store = configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
