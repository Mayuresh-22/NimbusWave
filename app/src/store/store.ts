import { configureStore } from "@reduxjs/toolkit";
import type { ProjectState } from "./projectSlice";
import projectReducer from "./projectSlice";
import type { UserState } from "./userSlice";
import userReducer from "./userSlice";

export interface RootState {
  user: UserState;
  project: ProjectState;
}

const store = configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer,
  },
});

export default store;
