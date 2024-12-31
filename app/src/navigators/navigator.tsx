import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import supabase from "../services/supabase";
import userService from "../services/user";
import type { Deployment, Project } from "../store/dashboardSlice";
import {
  setDeployments,
  setNumOfProjects,
  setProjects,
} from "../store/dashboardSlice";
import type { RootState } from "../store/store";
import { setIsAuthenticated, setUser } from "../store/userSlice";
import AppNavigator from "./appNavigator";
import AuthNavigator from "./authNavigator";

export default function Navigator() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const userState = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      if (userState) {
        return;
      }

      console.log("fetch user");
      const user = supabase.getUser().then((user) => {
        dispatch(setUser(user));
        dispatch(setIsAuthenticated(user ? true : false));
        return user;
      });

      console.log("fetch dashboard");
      userService.getUserDashboard().then((dashboard) => {
        if (dashboard?.status !== "success") {
          return;
        }
        const userDeployments: Deployment[] = [];
        const userProjects: Project[] = [];
        (dashboard.data.projects as Project[]).map((project) => {
          (project.deployments as Array<Deployment>).map((deployment) => {
            userDeployments.push({
              ...deployment,
              project_name: project.project_name,
              created_at: new Date(deployment.created_at).toLocaleString(),
            });
          });
          userProjects.push({
            ...project,
            project_name: project.project_name
              ? project.project_name
              : `untitled-${project.project_id.split("-")[0]}`,
            project_url: `${import.meta.env.VITE_SERVER_URL}/app/${project.project_app_name}`,
            deployments: undefined,
            created_at: new Date(project.created_at).toLocaleString(),
          });
        });
        dispatch(setProjects(userProjects));
        dispatch(setDeployments(userDeployments));
        dispatch(setNumOfProjects(dashboard.data.no_of_projects));
      });

      if (user) {
        console.log(await user);
        setUserLoggedIn(true);
      }
    })();
  }, [userState, dispatch]);

  return <>{userLoggedIn ? <AppNavigator /> : <AuthNavigator />}</>;
}
