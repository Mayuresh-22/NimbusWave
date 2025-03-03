import { Send, Upload, Stars, UserRound, FileArchive } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router";
import Alert from "../components/common/Alert";
import { ScreenLoader } from "../components/common/Loader";
import deploy from "../services/deploy";
import { setProject } from "../store/projectSlice";
import type { RootState } from "../store/store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { projectId } = useParams() as { projectId: string };
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const project = useSelector((state: RootState) => state.project.project);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can help you deploy your project. You can start by uploading your project files or asking me questions about deployment.",
    },
  ]);
  const [zipProjectFiles, setZipProjectFiles] = useState<File | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [projectFramework, setProjectFramework] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [projectStatus, setProjectStatus] = useState<0 | 1>(0);
  const [screenLoader, setScreenLoader] = useState(true);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const validateProjectDetails = (): boolean => {
    // validate project details
    try {
      if (!projectName || !projectName.trim()) {
        setAlert({ type: "error", message: "Project name is required." });
        throw new Error("Project name is null or empty");
      }
      if (!projectFramework || !projectFramework.trim()) {
        setAlert({ type: "error", message: "Project framework is required." });
        throw new Error("Project framework is null or empty");
      }
      if (!projectDescription || !projectDescription.trim()) {
        setAlert({
          type: "error",
          message: "Project description is required.",
        });
        throw new Error("Project description is null or empty");
      }
      if (!zipProjectFiles) {
        setAlert({ type: "error", message: "Project files are required." });
        throw new Error("Project files are null or empty");
      }
    } catch (error) {
      console.log("Error in validating project details", error);
      throw error;
    }
    return true;
  };

  const handleSend = async (triggeredByUser: boolean = true) => {
    if (!input.trim()) {
      return;
    }
    if (triggeredByUser) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "user", content: input },
      ]);
    }
    setInput("");

    const response = await deploy.sendMessage(
      project?.projectID as string,
      project?.chatId as string,
      input,
    );
    console.log(response);

    if (!response) {
      setAlert({
        type: "error",
        message: "Failed to send message. Please try again later.",
      });
      return;
    } else if (response.status === "error") {
      setAlert({ type: "error", message: response.message });
      return;
    }
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: response.message },
    ]);
    /*
      start executing the tool
      if response.tool is not null
    */
    if (response.tool) {
      console.log(response.tool);

      try {
        // execute the tool command
        const toolResponse = await tools[response.tool](response.value);
      } catch (error) {
        // send error message to the ai
        setInput("Error >> " + error.message);
      }
    }
  };

  const initDeployment = async () => {
    try {
      validateProjectDetails();
    } catch (error) {
      console.log("Catching error in initDeployment", error);
      throw error;
    }

    // make request to server to start deployment
    const deployResponse = await deploy.deployProject(
      project?.projectID as string,
      projectName,
      projectFramework,
      projectDescription,
      zipProjectFiles as File,
    );

    if (!deployResponse) {
      setAlert({
        type: "error",
        message: "Failed to deploy project. Please try again later.",
      });
      return;
    }
    setProjectStatus(1);
    setAlert({ type: "success", message: "Project deployed successfully!" });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const zipProjectFiles = e.dataTransfer.files?.[0];
    console.log(zipProjectFiles);
    setZipProjectFiles(zipProjectFiles);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipProjectFiles = e.target.files?.[0];
    console.log(zipProjectFiles);
    if (!zipProjectFiles) {
      return;
    }
    setZipProjectFiles(zipProjectFiles);
  };

  const handleFileBrowse = () => {
    fileInputRef.current?.click();
  };

  const tools: { [key: string]: ((value: any) => void) | (() => void) } = {
    saveProjectName: setProjectName,
    saveProjectFramework: setProjectFramework,
    saveProjectDescription: setProjectDescription,
    saveProjectStatus: setProjectStatus,
    initDeployment: initDeployment,
  };

  useEffect(() => {
    // create a new project/fetch project details
    (async () => {
      setScreenLoader(true);
      if (!projectId) {
        const response = await deploy.createNewProject();
        if (!response) {
          setAlert({
            type: "error",
            message: "Failed to create a new project. Please try again later.",
          });
          return;
        } else if (response.status === "error") {
          setAlert({ type: "error", message: response.message });
          return;
        }
        dispatch(
          setProject({
            projectID: response.data.project_id,
            chatId: response.data.chat_id,
          }),
        );
        navigate(`${response.data.project_id}`);
      } else if (projectId) {
        console.log("fetch project");
        const response = await deploy.getProjecrt(projectId);
        if (!response) {
          setAlert({
            type: "error",
            message: "Failed to fetch project details. Please try again later.",
          });
          return;
        } else if (response.status === "error") {
          setAlert({ type: "error", message: response.message });
          return;
        }
        setProjectName(response.data.project_name);
        setProjectFramework(response.data.project_framework);
        setProjectDescription(response.data.project_description);
        setProjectStatus(response.data.project_status);
        setMessages((prevMessages) => [
          ...prevMessages,
          ...(response.data.chat_context
            ? JSON.parse(response.data.chat_context)
            : []),
        ]);
        dispatch(
          setProject({
            projectID: response.data.project_id,
            chatId: response.data.chat_id,
          }),
        );
      }
      setScreenLoader(false);
    })();
  }, [projectId, location.pathname]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // runs on tools error
  useEffect(() => {
    (async () => {
      if (input.startsWith("Error >>")) {
        await handleSend(true);
      }
    })();
  }, [input]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {alert && <Alert type={alert.type} message={alert.message} />}
      {screenLoader ? (
        <ScreenLoader message="Initializing deployment..." />
      ) : (
        <main className="flex-1 pt-16 bg-gradient-to-r from-black via-gray-950">
          <div className="container max-w-4xl mx-auto px-4 h-[calc(100vh-4rem)] flex flex-col">
            {/* Project name */}
            <div className="py-4 border-b border-gray-900">
              <h1 className="text-xl font-semibold">
                Project name: {projectName}
              </h1>
            </div>

            {/* Upload area */}
            <div
              onClick={handleFileBrowse}
              className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-white bg-gray-900"
                  : "border-gray-800 hover:border-gray-700"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".zip"
                className="hidden"
              />
              {!zipProjectFiles ? (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
                  <p className="text-gray-400">
                    Drag and drop your project files here, or{" "}
                    <button
                      onClick={handleFileBrowse}
                      className="text-white underline hover:text-gray-300"
                    >
                      browse
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <FileArchive className="mx-auto h-8 w-8 text-gray-400 mb-4" />
                  <p className="text-gray-400">
                    File uploaded: {zipProjectFiles.name}
                  </p>
                </>
              )}
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <Stars size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 ${
                      message.role === "assistant"
                        ? "bg-gray-900"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <UserRound size={16} className="text-black" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-900 py-4">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Let's start deploying your project..."
                  className="flex-1 px-4 py-3 text-sm bg-gray-900 rounded-full border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="px-4 py-3 text-black bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
