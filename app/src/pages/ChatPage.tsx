import {
  Send,
  Upload,
  Stars,
  UserRound,
  FileArchive,
  Trash2,
  Pickaxe,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router";
import DeleteConfirmDialog from "../components/common/Dialog";
import { ScreenLoader } from "../components/common/Loader";
import ToastComponent from "../components/common/Toast";
import projectService from "../services/project";
import { setProject } from "../store/projectSlice";
import type { RootState } from "../store/store";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolResult?: string;
}

interface ToolResponse {
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
}

export default function ChatPage() {
  const { projectId } = useParams() as { projectId: string }; // get project id from URL
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const project = useSelector((state: RootState) => state.project.project);
  const [isDragging, setIsDragging] = useState(false);
  const [messageArray, setMessageArray] = useState<Message[]>([
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

  useEffect(() => {
    scrollToBottom();
  }, [messageArray]);

  useEffect(() => {
    // create a new project/fetch project details
    (async () => {
      setScreenLoader(true);
      if (!projectId) {
        const response = await projectService.createNewProject();
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
        const response = await projectService.getProjecrt(projectId);
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
        setMessageArray((prevMessages) => [
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

  const handleSend = async (triggeredByUser: boolean = true) => {
    if (!message.trim()) {
      return;
    }
    if (triggeredByUser) {
      setMessageArray((prevMessages) => [
        ...prevMessages,
        { role: "user", content: message },
      ]);
    }
    setMessage("");

    const responseStream = await projectService.sendMessage(
      message,
      zipProjectFiles as File,
      project?.projectID as string,
      project?.chatId as string,
    );

    if (!responseStream) {
      setAlert({
        type: "error",
        message: "Failed to send message. Please try again later.",
      });
      return;
    }

    const reader = responseStream.getReader();
    const decoder = new TextDecoder();
    let chunk: ReadableStreamReadResult<Uint8Array>;
    let assistantMessage = "";
    let buffer = "";
    let isBuffered = false;

    while (!(chunk = await reader.read()).done) {
      const textChunk = decoder.decode(chunk.value, { stream: true });
      const lines = textChunk.split("\n").filter(Boolean);
      let jsonBuffer: ToolResponse | null = null;
      for (let line of lines) {
        try {
          line = line.replace(/^[a-zA-Z0-9]:/, "").trim();
          // console.log("Step:", line);
          if (line.startsWith("{") && line.endsWith("}")) {
            // console.log("JSON:", JSON.parse(line));
            jsonBuffer = JSON.parse(line);
          } else if (line.startsWith("{") && !line.endsWith("}")) {
            buffer += line;
            isBuffered = true;
            continue;
          } else if (isBuffered && line.endsWith("}")) {
            buffer += line;
            jsonBuffer = JSON.parse(buffer);
            isBuffered = false;
            buffer = "";
          } else {
            assistantMessage += line.replace(/^\"/, "").replace(/\"$/, "");
            setMessageArray((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const lastMessage = updatedMessages[updatedMessages.length - 1];
              if (lastMessage?.role === "assistant") {
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  content: assistantMessage,
                };
              } else {
                updatedMessages.push({
                  role: "assistant",
                  content: assistantMessage,
                });
              }
              return updatedMessages;
            });
            continue;
          }

          // add tool call message to message array
          if (!jsonBuffer) {
            continue;
          }
          if (jsonBuffer?.toolCallId && jsonBuffer?.args) {
            setMessageArray((prevMessages) => [
              ...prevMessages,
              {
                role: "tool",
                toolName: jsonBuffer?.toolName,
                content: `Tool call: ${jsonBuffer?.toolCallId}`,
              },
            ]);
            console.log("Tool call appended");
          } else if (jsonBuffer?.toolCallId && !jsonBuffer?.args) {
            const toolResultStr = JSON.stringify(jsonBuffer?.result);
            // update tool call message with result in the message array
            setMessageArray((prevMessages) =>
              prevMessages.map((msg) =>
                msg.role === "tool" && msg.toolCallId === jsonBuffer?.toolCallId
                  ? { ...msg, toolResult: toolResultStr }
                  : msg,
              ),
            );
            console.log("Tool result appended");
          }
        } catch (error) {
          console.log("Error parsing JSON", error);
        }
      }
    }
    console.log("Stream finished");
  };

  const handleDeleteProject = async () => {
    try {
      setShowDialogBox(false);
      setScreenLoader(true);
      const response = await projectService.deleteProject(projectId);
      if (!response) {
        setAlert({
          type: "error",
          message: "Failed to delete the project. Please try again later.",
        });
        return;
      }
      setAlert({ type: "success", message: "Project deleted successfully!" });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting project:", error);
      setAlert({
        type: "error",
        message: "An error occurred while deleting the project.",
      });
    } finally {
      setScreenLoader(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {alert && (
        <ToastComponent
          title={alert.type === "success" ? "Success" : "Error"}
          message={alert.message}
        />
      )}
      {screenLoader ? (
        <ScreenLoader message="Initializing deployment..." />
      ) : (
        <main className="flex-1 pt-16 bg-gradient-to-r from-black via-gray-950">
          {showDialogBox && (
            <DeleteConfirmDialog
              title="Are you sure?"
              content="Do you really want to delete this project? This action cannot be undone."
              onOk={handleDeleteProject}
              onClose={() => setShowDialogBox(false)}
            />
          )}
          <div className="container max-w-4xl mx-auto px-14 h-[calc(100vh-4rem)] flex flex-col">
            {/* Project name */}
            <div className="flex py-4 justify-between">
              <h1 className="text-xl font-semibold">
                Project Name: {projectName}
              </h1>
              <div
                onClick={() => setShowDialogBox(true)}
                className="bg-red-500 group text-white p-1 rounded-lg cursor-pointer"
              >
                <Trash2 size={16} />
              </div>
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
            <div className="flex-1 overflow-y-scroll no-scrollbar py-4 space-y-4">
              {/* Messages */}
              {messageArray.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === "assistant" || message.role === "tool"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <Stars size={16} />
                    </div>
                  )}
                  {message.role === "tool" && (
                    <div className="w-8 h-8 rounded-full bg-gray-900 border border-blue-900 flex items-center justify-center">
                      <Pickaxe size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 ${
                      message.role === "assistant"
                        ? "bg-gray-900 rounded-xl py-2"
                        : message.role === "tool"
                          ? "py-1 bg-slate-800 rounded-lg group hover:bg-slate-900 border-2 border-blue-900 "
                          : "py-2 bg-gray-300 text-black rounded-xl"
                    }`}
                  >
                    {message.role === "tool" && message.toolName && (
                      <div className="text-sm font-semibold mb-1">
                        {message.toolName}
                        <div className="hidden text-xs  whitespace-pre-line text-gray-500 group-hover:block duration-300">
                          {message.toolResult}
                        </div>
                      </div>
                    )}
                    {(message.role === "assistant" ||
                      message.role === "user") && (
                      <p className="text-sm whitespace-pre-line">
                        {message.content}
                      </p>
                    )}
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Let's start deploying your project..."
                  className="flex-1 px-4 py-3 text-sm bg-gray-900 rounded-full border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!message.trim()}
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
