"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
// 1. CORREÇÃO: Importando o supabase corretamente
import { supabase } from "@/lib/supabase"

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032'
const logDebug = (location: string, message: string, data: any = {}) => {
  if (typeof window === 'undefined') return
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data: { ...data, userAgent: navigator.userAgent, platform: typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'web' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    })
  }).catch(() => {})
}
// #endregion

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // #region agent log
    logDebug('components/pages/login-page.tsx:useEffect', 'Initializing GoogleAuth', { hasWindow: typeof window !== 'undefined', hasCapacitor: typeof Capacitor !== 'undefined' })
    // #endregion
    try {
      const platform = typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'web';
      
      if (platform === 'android') {
        // Android: Forçando o Client ID para garantir o token correto mesmo com google-services.json incompleto
        GoogleAuth.initialize({
          clientId: '728215447744-ukodpj33kdcsa3tqhek374u9nvkqnbiv.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      } else {
        // Web: usa o Web Client ID
        GoogleAuth.initialize({
          clientId: '728215447744-ukodpj33kdcsa3tqhek374u9nvkqnbiv.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
        });
      }
      // #region agent log
      logDebug('components/pages/login-page.tsx:useEffect', 'GoogleAuth initialized successfully', { platform })
      // #endregion
    } catch (error: any) {
      // #region agent log
      logDebug('components/pages/login-page.tsx:useEffect', 'GoogleAuth initialization error', { error: error?.message, errorStack: error?.stack })
      // #endregion
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        // Login with existing account
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          throw error
        }
        if (data.user) {
          const userFormatted = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || email.split("@")[0],
          }
          onLoginSuccess(userFormatted)
        }
      } else {
        // Register new account
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) {
          throw error
        }
        if (data.user && !data.user.email_confirmed_at) {
          alert("Check your email for confirmation link")
        } else if (data.user) {
          const userFormatted = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || name,
          }
          onLoginSuccess(userFormatted)
        }
      }
    } catch (error: any) {
      console.error("Email login error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert("Por favor, digite seu e-mail para recuperar a senha.")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) throw error
      alert("Enviamos um link de recuperação para o seu e-mail!")
      setIsResettingPassword(false)
    } catch (error: any) {
      console.error("Password reset error:", error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    // #region agent log
    logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Starting Google login')
    // #endregion
    try {
      console.log("Iniciando login Google...");
      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Signing out first')
      // #endregion
      await GoogleAuth.signOut(); 
      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Sign out completed, signing in')
      // #endregion

      const googleUser = await GoogleAuth.signIn();
      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Google sign in completed', { hasGoogleUser: !!googleUser, hasIdToken: !!(googleUser as any)?.authentication?.idToken })
      // #endregion
      console.log('Google Native User:', JSON.stringify(googleUser)); 

      const idToken = (googleUser as any).authentication?.idToken;

      if (!idToken) {
        throw new Error("O Google não retornou um ID Token!");
      }

      console.log("Enviando token para Supabase...");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      if (error) {
        // 2. CORREÇÃO: Simplificamos o log de erro para não quebrar o código
        // #region agent log
        logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Supabase error', { error: error.message, errorCode: error.status })
        // #endregion
        console.error("Erro Supabase:", error.message);
        throw error;
      }

      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Supabase login success', { userId: data.user?.id })
      // #endregion
      console.log("Login Supabase Sucesso!", data);

      const userFormatted = {
        id: data.user.id,
        email: googleUser.email,
        name: googleUser.familyName ? `${googleUser.givenName} ${googleUser.familyName}` : googleUser.givenName,
        imageUrl: googleUser.imageUrl
      }
      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Calling onLoginSuccess', { userId: userFormatted.id, userEmail: userFormatted.email })
      // #endregion
      onLoginSuccess(userFormatted)
    } catch (error: any) {
      // 3. CORREÇÃO: Log simplificado que funciona sempre
      // #region agent log
      logDebug('components/pages/login-page.tsx:handleGoogleLogin', 'Login failed', { error: error?.message, errorStack: error?.stack })
      // #endregion
      console.error("FALHA LOGIN:", error);
      alert(`Erro: ${error.message || "Falha desconhecida"}`);
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
              <h1 className="text-3xl font-bold text-black mb-2">
                {isResettingPassword ? "Recuperar Senha" : isLogin ? "Login" : "Register"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isResettingPassword 
                  ? "Digite seu e-mail para receber um link de redefinição."
                  : isLogin
                  ? "Enter your credentials to access your account"
                  : "Create a new account to get started"}
              </p>
            </div>

            {isResettingPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-slate-300">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-white font-semibold mt-6"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsResettingPassword(false)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </form>
            ) : (
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
                        onClick={() => setIsResettingPassword(true)}
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
            )}

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

            {!isResettingPassword && (
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
            )}
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
