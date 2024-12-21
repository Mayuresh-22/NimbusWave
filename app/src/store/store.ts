import { configureStore } from "@reduxjs/toolkit";
import userReducer, { UserState } from "./userSlice";

export interface RootState {
  user: UserState;
}

const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default store;