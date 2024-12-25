import { createSlice } from "@reduxjs/toolkit";
import type { User } from "@supabase/supabase-js";

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setIsAuthenticated(state, action) {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setUser, setIsAuthenticated } = userSlice.actions;
export default userSlice.reducer;
