import { useState } from 'react'
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function OnboardPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const [loginEmail, setLoginEmail] = useState<string>('')
  const [loginPassword, setLoginPassword] = useState<string>('')
  const [registerName, setRegisterName] = useState<string>('')
  const [registerEmail, setRegisterEmail] = useState<string>('')
  const [registerPassword, setRegisterPassword] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle form submission
    console.log('Form submitted:', activeTab)
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-black via-gray-900 to-black">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                className={`flex-1 py-4 text-sm font-medium ${
                  activeTab === 'login'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`flex-1 py-4 text-sm font-medium ${
                  activeTab === 'register'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {activeTab === 'login' ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-300">
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
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
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
                    <label htmlFor="register-name" className="block text-sm font-medium text-gray-300">
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
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-300">
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
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
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
                {activeTab === 'login' ? 'Log In' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

