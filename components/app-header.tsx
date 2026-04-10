'use client'

import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg mb-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Scout Volleyball</h1>
        <p className="text-sm text-blue-100">by Lucas Ribeiro da Cunha</p>
      </div>
    </div>
  )
}
