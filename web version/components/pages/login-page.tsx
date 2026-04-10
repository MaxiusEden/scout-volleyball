"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Simulated authentication - in production, this would call a real API
      const mockUser = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email,
        name: name || email.split("@")[0],
      }
      onLoginSuccess(mockUser)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // Google OAuth will be implemented in production
      const mockUser = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email: "user@gmail.com",
        name: "Google User",
      }
      onLoginSuccess(mockUser)
    } catch (error) {
      console.error("Google login failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-black" />
      
      <div className="w-full max-w-6xl flex items-center justify-between gap-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="border border-slate-800 rounded-2xl p-8 bg-black/40 backdrop-blur-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? "Login" : "Register"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Create a new account to get started"}
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-white font-semibold mt-6"
              >
                {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black text-slate-500 uppercase text-xs">
                  Or continue with social
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-12 border-slate-700 bg-black/40 hover:bg-slate-900 text-white"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  {isLogin ? "Register" : "Login"}
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-11-14%20at%2016.39.42-IP3Ug0szDWVqkqZx6KMGzTSpuSu0Qz.jpeg"
            alt="Scout Volleyball Logo - Lucas Ribeiro"
            className="w-full max-w-2xl h-auto"
          />
        </div>
      </div>
    </div>
  )
}
