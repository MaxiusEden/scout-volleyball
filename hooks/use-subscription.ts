"use client"

import { useState, useEffect } from "react"
import { hasAccess as checkHasAccess, getSubscription, type Subscription } from "@/lib/subscription"
import { supabase } from "@/lib/supabase"

export function useSubscription() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscription()
    
    // Verificar novamente quando o usuário mudar
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription()
    })

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const checkSubscription = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setHasAccess(false)
        setSubscription(null)
        return
      }

      const access = await checkHasAccess()
      setHasAccess(access)
      
      const sub = await getSubscription(user.id)
      setSubscription(sub)
    } catch (error) {
      console.error('[USE SUBSCRIPTION] Erro:', error)
      setHasAccess(false)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  return {
    hasAccess: hasAccess ?? false,
    subscription,
    loading,
    refresh: checkSubscription,
  }
}

