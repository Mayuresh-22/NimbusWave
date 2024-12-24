import { useState } from 'react'
import { Upload, ArrowRight, Zap, Rocket, Stars } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { AI_CHAT, DASHBOARD, ONBOARD } from '../contants'


export default function HomePage() {
  const [inputValue, setInputValue] = useState<string>('')
  const navigate = useNavigate()
  const isUserLoggedIn = useSelector((state: RootState) => state.user.isAuthenticated)

  const navigateTo = (to?: string) => {
    if (to) return navigate(to)
    navigate(isUserLoggedIn ? AI_CHAT.path : ONBOARD.path)
  }
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <main className="flex-1 pt-16">
        {/* Hero section */}
        <section className="container mx-auto px-4 py-20 text-center bg-gradient-to-r from-black via-gray-900 to-black relative overflow-hidden">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
              Deploy at the Speed of Thought
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto relative z-10">
            Zero-onfig AI-powered edge deployment platform that takes your JS/TS apps from local to global in seconds
          </p>
          <button onClick={() => navigateTo(DASHBOARD.path)} className="inline-flex items-center px-6 py-3 text-base font-medium text-black bg-white rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors relative z-10">
            Get Started Quickly
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </section>

        {/* Process section */}
        <section className="container mx-auto px-4 py-16 border-t border-gray-900 rounded-3xl">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Upload, title: "1. Upload Your Build", description: "Drop your dist folder or select it from your computer" },
                { icon: Stars, title: "2. AI Copilot", description: "Our AI navigate you through the deployment process" },
                { icon: Rocket, title: "3. Global Deployment", description: "Your app is instantly deployed to our global edge network" }
              ].map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center space-y-4 group">
                  <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload section */}
        <section className="container mx-auto px-4 py-16 mb-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-black via-gray-950 rounded-xl p-8 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-gray-800 rounded-full">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold">
                Upload Your Project
              </h2>
              <p className="text-gray-400 text-center">
                Drag and drop your dist folder or click to browse
              </p>
              <button onClick={() => navigateTo()} className="px-6 py-3 text-sm font-medium border border-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                Select Folder
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* AI-powered input */}
      <div className="z-50 fixed bottom-10 left-0 right-0 max-w-md sm:max-w-xl justify-center items-center mx-auto bg-gray-900 border-t border-gray-800 rounded-full p-4">
        <div className="container mx-auto max-w-3xl flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask AI how to deploy your project..."
              className="w-full px-4 py-2 pl-10 text-sm bg-gray-950 rounded-full border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent placeholder-gray-500"
            />
            <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button onClick={() => navigateTo()} className="px-6 py-2 text-sm font-medium text-black bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center">
            <Rocket className="mr-2 h-4 w-4" />
            Deploy with AI
          </button>
        </div>
      </div>
    </div>
  )
}

