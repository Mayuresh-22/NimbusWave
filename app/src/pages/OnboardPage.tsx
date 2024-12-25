import { AuthError } from "@supabase/supabase-js";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Alert from "../components/common/Alert";
import supabase from "../services/supabase";
import user from "../services/user";

export default function OnboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [registerName, setRegisterName] = useState<string>("");
  const [registerEmail, setRegisterEmail] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    // call supabase login service
    const loginResponse = await supabase.signIn(loginEmail, loginPassword);
    if (!loginResponse) {
      setAlert({
        message: "Error occurred while logging in",
        type: "error",
      });
      return;
    } else if (loginResponse instanceof AuthError) {
      setAlert({
        message: loginResponse.message,
        type: "error",
      });
      return;
    }
    // redirect to dashboard
    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    // call supabase register service
    const registerResponse = await supabase.signUp(
      registerEmail,
      registerPassword,
      {
        name: registerName,
      },
    );
    if (!registerResponse) {
      setAlert({
        message: "Error occurred while creating account",
        type: "error",
      });
      return;
    } else if (registerResponse instanceof AuthError) {
      setAlert({
        message: registerResponse.message,
        type: "error",
      });
      return;
    }
    navigate("?confirm_signup=true");
  };

  useEffect(() => {
    if (location.search === "?confirm_signup=true") {
      setAlert({
        message:
          "Account created successfully, please check your email to verify your account.",
        type: "success",
      });
    } else if (location.search === "?complete_signup=true") {
      (async () => {
        const userObj = await supabase.getUser();
        const userResponse = await user.createUser(
          userObj?.id as string,
          userObj?.email as string,
          {
            name: userObj?.user_metadata?.name,
          },
        );
        await supabase.signOut();
        navigate("?onboard_complete=true");
      })();
    } else if (location.search == "?onboard_complete=true") {
      setAlert({
        message: "Account setup complete, you can now login.",
        type: "success",
      });
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col text-white">
      {alert && <Alert type={alert.type} message={alert.message} />}
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-black via-gray-900 to-black">
        <div className="w-full max-w-md">
          {location.search !== "?complete_signup=true" ? (
            <>
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-800">
                  <button
                    className={`flex-1 py-4 text-sm font-medium ${
                      activeTab === "login"
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("login")}
                  >
                    Login
                  </button>
                  <button
                    className={`flex-1 py-4 text-sm font-medium ${
                      activeTab === "register"
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("register")}
                  >
                    Register
                  </button>
                </div>
                <form
                  onSubmit={
                    activeTab === "login" ? handleLogin : handleRegister
                  }
                  className="p-6 space-y-6"
                >
                  {activeTab === "login" ? (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="login-email"
                          className="block text-sm font-medium text-gray-300"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <input
                            id="login-email"
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full px-4 py-2 pl-10 text-sm bg-gray-900/60 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            placeholder="Enter your email"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="login-password"
                          className="block text-sm font-medium text-gray-300"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full px-4 py-2 pl-10 pr-10 text-sm bg-gray-900/60 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            placeholder="Enter your password"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="register-name"
                          className="block text-sm font-medium text-gray-300"
                        >
                          Name
                        </label>
                        <div className="relative">
                          <input
                            id="register-name"
                            type="text"
                            required
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            className="w-full px-4 py-2 pl-10 text-sm bg-gray-900/60 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            placeholder="Enter your name"
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="register-email"
                          className="block text-sm font-medium text-gray-300"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <input
                            id="register-email"
                            type="email"
                            required
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className="w-full px-4 py-2 pl-10 text-sm bg-gray-900/60 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            placeholder="Enter your email"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="register-password"
                          className="block text-sm font-medium text-gray-300"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={registerPassword}
                            onChange={(e) =>
                              setRegisterPassword(e.target.value)
                            }
                            className="w-full px-4 py-2 pl-10 pr-10 text-sm bg-gray-900/60 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            placeholder="Create a password"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <button
                    type="submit"
                    className="w-full px-6 py-3 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center justify-center"
                  >
                    {activeTab === "login" ? "Log In" : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-col space-y-3 justify-center items-center p-6">
              {/* Loader */}
              <svg
                className="animate-spin h-10 w-10 text-white mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <p className="text-lg font-medium text-center">
                Setting up your account...
              </p>
              <p className="text-sm text-gray-200 text-center">
                Please wait while we complete the setup process.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
