import { configureStore } from "@reduxjs/toolkit";
import userReducer, { UserState } from "./userSlice";
import projectReducer from "./projectSlice";
import { ProjectState } from "./projectSlice";

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