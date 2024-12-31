import type { LucideProps } from "lucide-react";
import {
  Rocket,
  ChevronRight,
  LockIcon,
  LockKeyholeOpen,
  ExternalLink,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { Link } from "react-router";
import { Deployment, Project } from "../store/dashboardSlice";
import type { RootState } from "../store/store";

export default function DashboardPage() {
  const dashboardVars = useSelector((state: RootState) => state.dashboard);
  const recentDeployments = dashboardVars.deployments.slice(0, 5);
  const projects = dashboardVars.projects;
  const [stats, setStats] = useState<
    | {
        label: string;
        value: number;
        icon: React.ForwardRefExoticComponent<
          Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
        >;
      }[]
    | null
  >(null);

  // useEffect(() => {
  //   setRecentDeployments(dashboardVars.deployments);
  //   setProjects(dashboardVars.projects);
  //   setStats([
  //     {
  //       label: "Total Projects",
  //       value: dashboardVars.numOfProjects,
  //       icon: Rocket,
  //     },
  //   ]);
  // }, [location.pathname]);
  console.log("Projects", recentDeployments);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min mb-8">
            {/* Stats Grid */}
            {stats?.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
            {/* Recent Deployments */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Recent Deployments
              </h2>
              <div className="rounded-lg border border-gray-800">
                <div className="p-6">
                  <div className="space-y-5">
                    {recentDeployments?.map((deployment) => (
                      <div
                        key={deployment.deployment_id}
                        className="flex items-center justify-between hover:bg-gray-900 transition-all p-4 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              deployment.deployment_status == 1
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                          />
                          <div>
                            <p className="font-normal text-gray-400">
                              {deployment.project_name}
                            </p>
                            <p className="font-medium">
                              {deployment.deployment_id}
                            </p>
                            <p className="text-sm text-gray-400">
                              {deployment.created_at}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {projects?.map((project) => (
                  <div
                    key={project.project_id}
                    className="rounded-lg p-6 border border-gray-800 hover:border-gray-700 hover:bg-gray-900  transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Link
                        to={`${import.meta.env.VITE_APP_URL}/deploy/${project.project_id}`}
                        className="font-medium text-lg hover:underline"
                      >
                        {project.project_name}
                      </Link>
                      <div className="w-6 h-6 group">
                        <span className="z-50 group-hover:opacity-100 delay-150 transition-opacity opacity-0 bg-gray-700 text-white rounded-lg px-2 py-1 text-sm mb-4 relative">
                          {project.project_status === 1 ? "Active" : "Inactive"}
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            project.project_status === 1
                              ? "bg-green-400"
                              : "bg-yellow-400"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-normal space-x-3 text-sm text-gray-400">
                      <div className="flex items-center">
                        {project.project_type === "private" ? (
                          <>
                            <LockIcon size={16} className="mr-1" />
                            {project.project_type}
                          </>
                        ) : (
                          <LockKeyholeOpen size={16} />
                        )}
                      </div>
                      {project.project_status == 1 && (
                        <Link
                          to={project.project_url}
                          target="_blank"
                          className="flex items-center space-x-1 p-1 cursor-pointer group"
                        >
                          <ExternalLink size={16} />
                          <span>Visit</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
