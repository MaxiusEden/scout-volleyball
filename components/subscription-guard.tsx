"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { hasAccess, getSubscription, SubscriptionStatus } from "@/lib/subscription"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock, Clock, CheckCircle, Menu } from "lucide-react"
import SubscriptionDialog from "./subscription-dialog"

interface SubscriptionGuardProps {
  children: ReactNode
  feature?: string
  disablePeriodic?: boolean
}

export function SubscriptionGuard({ children, feature, disablePeriodic }: SubscriptionGuardProps) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess(true)

    // VERIFICAÇÃO PERIÓDICA: Re-verificar acesso a cada 30 segundos
    // Assim, se a assinatura expirar enquanto o usuário está na coleta, detectamos
    // Desabilitar verificação periódica durante coleta ativa (match entry) para evitar chamadas desnecessárias
    let interval: NodeJS.Timeout | undefined
    if (!disablePeriodic) {
      interval = setInterval(() => {
        checkAccess(false)
      }, 30000) // 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [disablePeriodic])

  const checkAccess = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const access = await hasAccess()
      setHasSubscription(access)

      if (access) {
        const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser()
        if (user) {
          const sub = await getSubscription(user.id)
          setSubscription(sub)
        }
      }
    } catch (error) {
      console.error('[SUBSCRIPTION GUARD] Erro:', error)
      setHasSubscription(false)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  // Handle Android Hardware Back Button
  useEffect(() => {
    let backListener: any;

    const setupBackListener = async () => {
      // Import dinâmico para evitar erros em SSR/Web
      const { App } = await import('@capacitor/app');

      if (hasSubscription === false) {
        backListener = await App.addListener('backButton', () => {
          // Se estiver bloqueado, o botão voltar leva para home (reset total)
          window.location.href = "/"
        });
      }
    };

    setupBackListener();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [hasSubscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-muted-foreground">Verificando assinatura...</div>
        </div>
      </div>
    )
  }

  if (!hasSubscription) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Assinatura Necessária</h3>
                <p className="text-muted-foreground mb-6">
                  {feature
                    ? `A funcionalidade "${feature}" é exclusiva para assinantes.`
                    : `Seu período de teste expirou. Assine para continuar tendo acesso total.`
                  }
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Button onClick={() => setShowDialog(true)} className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Assinar Agora
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Forçar reload da página para limpar estados do React (view=match -> view=mode-select)
                      window.location.href = "/"
                    }}
                    className="w-full"
                  >
                    <Menu className="mr-2 h-4 w-4" />
                    Menu Principal
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} onSuccess={() => checkAccess(true)} />
      </>
    )
  }

  // Mostrar aviso se estiver no trial
  if (subscription?.status === 'trial') {
    const trialDays = subscription.trial_end_date
      ? Math.ceil((new Date(subscription.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    if (trialDays > 0 && trialDays <= 3) {
      return (
        <>
          <Alert className="m-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Atenção: Trial expirando</AlertTitle>
            <AlertDescription>
              Seu período de teste expira em {trialDays} dia{trialDays > 1 ? 's' : ''}.
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={() => setShowDialog(true)}
              >
                Assine agora
              </Button>
            </AlertDescription>
          </Alert>
          {children}
          <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} onSuccess={() => checkAccess(true)} />
        </>
      )
    }
  }

  return <>{children}</>
}

