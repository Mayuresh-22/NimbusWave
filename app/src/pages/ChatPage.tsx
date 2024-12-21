import { useState, useRef, useEffect } from 'react'
import { Send, Upload, Stars, UserRound } from 'lucide-react'
import deploy from '../services/deploy'
import Alert from '../components/common/Alert'
import { useNavigate, useParams } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { setProject } from '../store/projectSlice'
import { RootState } from '../store/store'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const { projectId } = useParams() as { projectId: string }
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you deploy your project. You can start by uploading your project files or asking me questions about deployment.'
    }
  ])
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [input, setInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const project = useSelector((state: RootState) => state.project.project)
  const [zipProjectFiles, setZipProjectFiles] = useState<File | null>(null)
  const [projectName, setProjectName] = useState<string>('')
  const [projectFramework, setProjectFramework] = useState<string>('')
  const [projectDescription, setProjectDescription] = useState<string>('')

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, { role: 'user', content: input }])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I understand you want to deploy your project. Could you provide more details about your application stack?'
      }])
    }, 1000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const zipProjectFiles = e.dataTransfer.files?.[0]
    console.log(zipProjectFiles);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipProjectFiles = e.target.files?.[0]
    console.log(zipProjectFiles);
    if (!zipProjectFiles) return
  }

  const handleFileBrowse = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    // create a new project record on server   
    (async () => {
      if (!projectId) {
        const response = await deploy.createNewProject();
        if (!response) {
          setAlert({ type: 'error', message: 'Failed to create a new project. Please try again later.' })
          return;
        } else if (response.status === "error") {
          setAlert({ type: 'error', message: response.message })
          return;
        }
        dispatch(setProject({projectID: response.data.project_id, chatId: response.data.chat_id}))
        navigate(`${response.data.project_id}`)
      } else if (projectId && project?.projectID !== projectId) {
        const response = await deploy.getProjecrt(projectId);
        if (!response) {
          setAlert({ type: 'error', message: 'Failed to fetch project details. Please try again later.' })
          return;
        } else if (response.status === "error") {
          setAlert({ type: 'error', message: response.message })
          return;
        }
        setProjectName(response.data.project_name)
        setProjectFramework(response.data.project_framework)
        setProjectDescription(response.data.project_description)
        dispatch(setProject({projectID: response.data.project_id, chatId: response.data.chat_id}))
      }
    })()
  }, [projectId])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {alert && (
        <Alert type={alert.type} message={alert.message} />
      )}
      <main className="flex-1 pt-16 bg-gradient-to-r from-black via-gray-950">
        <div className="container max-w-4xl mx-auto px-4 h-[calc(100vh-4rem)] flex flex-col">
          {/* Project name */}
          <div className="py-4 border-b border-gray-900">
            <h1 className="text-xl font-semibold">Project name: {projectName}</h1>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Upload area */}
            <div
              onClick={handleFileBrowse}
              className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer ${isDragging
                ? 'border-white bg-gray-900'
                : 'border-gray-800 hover:border-gray-700'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept='.zip' className="hidden" />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
              <p className="text-gray-400">
                Drag and drop your project files here, or{' '}
                <button onClick={handleFileBrowse} className="text-white underline hover:text-gray-300">
                  browse
                </button>
              </p>
            </div>

            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                    <Stars size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 ${message.role === 'assistant'
                    ? 'bg-gray-900'
                    : 'bg-gray-300 text-black'
                    }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
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
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Let's start deploying your project..."
                className="flex-1 px-4 py-3 text-sm bg-gray-900 rounded-full border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-3 text-black bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

