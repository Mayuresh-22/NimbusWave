import { useState, useEffect } from "react";
import supabase from "../services/supabase";
import AppNavigator from "./appNavigator";
import AuthNavigator from "./authNavigator";
import { useDispatch, useSelector } from "react-redux";
import store, { RootState } from "../store/store";
import { setIsAuthenticated, setUser } from "../store/userSlice";

export default function Navigator() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const userState = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      if (userState) return;
      const user = await supabase.getUser();
      dispatch(setUser(user));
      dispatch(setIsAuthenticated(user ? true : false));

      if (user) {
        console.log(user);
        setUserLoggedIn(true);
      }
    })()
  }, [userState, dispatch]);

  return (
    <>
      {userLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </>
  )
}