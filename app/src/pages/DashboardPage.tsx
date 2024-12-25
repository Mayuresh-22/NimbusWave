import {
  Menu,
  X,
  Rocket,
  Server,
  Globe,
  Settings,
  Activity,
  Users,
  BarChart,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function DashboardPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = [
    { label: "Total Deployments", value: "234", icon: Rocket },
    { label: "Active Projects", value: "12", icon: Server },
    { label: "Edge Regions", value: "45", icon: Globe },
    { label: "Uptime", value: "99.9%", icon: Activity },
  ];

  const recentDeployments = [
    {
      id: 1,
      name: "E-commerce Frontend",
      status: "success",
      time: "2 minutes ago",
    },
    { id: 2, name: "API Gateway", status: "building", time: "5 minutes ago" },
    { id: 3, name: "Auth Service", status: "success", time: "1 hour ago" },
    {
      id: 4,
      name: "Analytics Dashboard",
      status: "failed",
      time: "2 hours ago",
    },
  ];

  const projects = [
    {
      id: 1,
      name: "E-commerce Frontend",
      status: "active",
      users: 12,
      requests: "2.3M",
    },
    {
      id: 2,
      name: "API Gateway",
      status: "active",
      users: 45,
      requests: "5.1M",
    },
    {
      id: 3,
      name: "Auth Service",
      status: "maintenance",
      users: 8,
      requests: "1.8M",
    },
    {
      id: 4,
      name: "Analytics Dashboard",
      status: "active",
      users: 23,
      requests: "3.2M",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min mb-8">
            {/* Stats Grid */}
            {stats.map((stat, index) => (
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
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-6">
                  <div className="space-y-4">
                    {recentDeployments.map((deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              deployment.status === "success"
                                ? "bg-green-400"
                                : deployment.status === "building"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{deployment.name}</p>
                            <p className="text-sm text-gray-400">
                              {deployment.time}
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
              <h2 className="text-2xl font-semibold mb-4">Active Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">{project.name}</h3>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          project.status === "active"
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2" />
                        {project.users}
                      </div>
                      <div className="flex items-center">
                        <BarChart size={16} className="mr-2" />
                        {project.requests}
                      </div>
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
