"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Check, Crown, Sparkles } from "lucide-react"
import { purchaseSubscription, restorePurchases } from "@/lib/iap"
import { getSubscription, getTrialDaysRemaining } from "@/lib/subscription"
import { useToast } from "@/hooks/use-toast"
import { Capacitor } from "@capacitor/core"

interface SubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function SubscriptionDialog({ open, onOpenChange, onSuccess }: SubscriptionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [trialDays, setTrialDays] = useState(0)
  const { toast } = useToast()
  const platform = typeof window !== 'undefined' ? Capacitor.getPlatform() : 'web'

  useEffect(() => {
    if (open) {
      loadSubscription()
    }
  }, [open])

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser()
      if (user) {
        const sub = await getSubscription(user.id)
        setSubscription(sub)
        if (sub) {
          setTrialDays(getTrialDaysRemaining(sub))
        }
      }
    } catch (error) {
      console.error('[SUBSCRIPTION DIALOG] Erro ao carregar assinatura:', error)
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const result = await purchaseSubscription()
      if (result.success) {
        toast({
          title: "Processando compra...",
          description: "Aguarde a confirmação da loja. Isso pode levar alguns segundos.",
          variant: "default",
        })
        onOpenChange(false)
        // Notificar o SubscriptionGuard para re-checar acesso
        onSuccess?.()
      } else {
        toast({
          title: "Erro ao comprar",
          description: result.error || "Não foi possível processar a compra.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    setLoading(true)
    try {
      const result = await restorePurchases()
      if (result.success && result.restored) {
        toast({
          title: "Compras restauradas!",
          description: "Suas compras anteriores foram restauradas.",
          variant: "default",
        })
        await loadSubscription()
        onOpenChange(false)
        // Notificar o SubscriptionGuard para re-checar acesso
        onSuccess?.()
      } else {
        toast({
          title: "Nenhuma compra encontrada",
          description: "Não foram encontradas compras para restaurar.",
          variant: "default",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao restaurar.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isWeb = platform === 'web'
  const isTrial = subscription?.status === 'trial'
  const isActive = subscription?.status === 'active'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Assinatura Premium
          </DialogTitle>
          <DialogDescription>
            Desbloqueie todas as funcionalidades do Scout Volleyball
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status atual */}
          {isTrial && trialDays > 0 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  Período de Teste Ativo
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {trialDays} dia{trialDays > 1 ? 's' : ''} restante{trialDays > 1 ? 's' : ''} do seu trial gratuito
              </p>
            </Card>
          )}

          {isActive && (
            <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-900 dark:text-green-100">
                  Assinatura Ativa
                </span>
              </div>
            </Card>
          )}

          {/* Plano */}
          <Card className="p-6 border-2 border-primary">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Plano Mensal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesso completo a todas as funcionalidades
                </p>
              </div>
              <Badge variant="secondary">Popular</Badge>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Coleta de dados ilimitada</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Sincronização em tempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Exportação PDF/Excel</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Backup na nuvem</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Suporte prioritário</span>
              </div>
            </div>

            {isWeb ? (
              <Alert className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Para assinar, use o aplicativo no iOS ou Android.
                </p>
              </Alert>
            ) : (
              <>
                <Button
                  className="w-full mb-2"
                  onClick={handlePurchase}
                  disabled={loading || isActive}
                >
                  {isActive ? 'Assinatura Ativa' : 'Assinar Agora'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRestore}
                  disabled={loading}
                >
                  Restaurar Compras
                </Button>
              </>
            )}
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            O pagamento será processado pela {platform === 'ios' ? 'App Store' : 'Google Play'}.
            A assinatura renova automaticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

