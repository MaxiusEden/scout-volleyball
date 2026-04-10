"use client";

import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

/**
 * IDs dos produtos de assinatura
 * IMPORTANTE: Configure estes IDs nas suas lojas (App Store Connect e Google Play Console)
 */
export const SUBSCRIPTION_PRODUCT_IDS = {
  ios: 'com.vscout.app.monthly', // Configure no App Store Connect
  android: 'premium_mensal', // Configure no Google Play Console
};

const platform = Capacitor.getPlatform();
const productId = SUBSCRIPTION_PRODUCT_IDS[platform as 'ios' | 'android'] || SUBSCRIPTION_PRODUCT_IDS.ios;

let store: any;
let isInitialized = false;

/**
 * Manipula uma compra aprovada, enviando o recibo para o backend para validação.
 * @param purchase - O produto comprado.
 */
async function handlePurchase(purchase: any) {
  console.log('[IAP] Compra aprovada:', JSON.stringify(purchase));

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado para validar a compra.');
    }

    let validationResult;

    if (platform === 'android') {
      const transaction = (purchase as any).transaction;
      if (!transaction) throw new Error('Transação não disponível para Android');

      const receiptData = (transaction as any).receipt || (transaction as any).purchaseToken;
      let purchaseToken = '';

      if (typeof receiptData === 'string') {
        try {
          const receipt = JSON.parse(receiptData);
          purchaseToken = receipt.purchaseToken;
        } catch {
          purchaseToken = receiptData;
        }
      } else {
        purchaseToken = (receiptData as any).purchaseToken;
      }

      const { data, error } = await supabase.functions.invoke('validate-android', {
        method: 'POST',
        body: { purchaseToken, productId: purchase.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      validationResult = data;

    } else if (platform === 'ios') {
      const { data, error } = await supabase.functions.invoke('validate-ios', {
        method: 'POST',
        body: {
          transactionId: (purchase as any).transaction?.id,
          productId: purchase.id,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      validationResult = data;
    }

    if (validationResult?.success) {
      console.log('[IAP] Validação no backend bem-sucedida.');
      (purchase as any).finish();
    } else {
      console.error('[IAP] Falha na validação do backend:', validationResult?.error);
      // SE A VALIDAÇÃO FALHOU NO SERVER (Ex: Recibo inválido, reembolso, timeout, erro 500 parseado, etc),
      // PRECISAMOS FINALIZAR A TRANSAÇÃO PARA ELA NÃO FICAR PRESA NA FILA DO DEVICE.
      // O backend agora retorna 200 com { success: false } para erros lógicos, então cairemos aqui.
      console.warn('[IAP] Finalizando transação inválida para limpar a fila.');
      (purchase as any).finish();
    }

  } catch (error: any) {
    console.error('[IAP] Erro ao validar a compra no backend (Exception):', error.message);
    // Erros DE REDE REAIS (offline) ainda cairão aqui e NÃO finalizam a compra, permitindo retry.
    // Mas erros do servidor (500) que não retornam JSON válido cairão aqui.
    // Para resolver o "Stuck Loop", em caso de dúvida extrema, o usuário deve ter um botão "Force Finish".
    // Mas com a mudança para status 200 no validate-android, a maioria dos erros cairá no 'else' acima.
  }
}

/**
 * Inicializa a loja e registra os produtos.
 */
export async function initializeIAP(): Promise<void> {
  if (isInitialized || platform === 'web') return;
  if (typeof window === 'undefined') return;

  console.log('[IAP] Inicializando o plugin de compra...');

  // Importação dinâmica para evitar erros de SSR (Server Side Rendering)
  // @ts-ignore
  await import('cordova-plugin-purchase');
  const CdvPurchase = (window as any).CdvPurchase;
  store = CdvPurchase.store;

  store.verbosity = CdvPurchase.LogLevel.DEBUG; // Use CdvPurchase.LogLevel.INFO para produção

  store.register({
    id: productId,
    type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    platform: platform === 'ios' ? CdvPurchase.Platform.APPLE_APPSTORE : CdvPurchase.Platform.GOOGLE_PLAY,
  });

  // Handler para compras aprovadas
  (store.when() as any)
    .approved((transaction: any) => handlePurchase(transaction));

  // Handler para quando a compra é iniciada
  // Em v13, initiated não é um evento comum de produto dessa forma, mas vamos manter a estrutura
  // Se não existir, o compilador vai reclamar, então removemos ou comentamos se não for crucial
  // store.when(productId).on('initiated', ...); 

  // Handlers de erro
  store.error((err: any) => {
    if (!err) {
      console.error('[IAP] Erro desconhecido (objeto indefinido)');
      return;
    }
    console.error('[IAP] Erro na loja:', {
      code: err.code,
      message: err.message,
      details: err
    });
  });

  store.initialize([platform === 'ios' ? CdvPurchase.Platform.APPLE_APPSTORE : CdvPurchase.Platform.GOOGLE_PLAY]);

  // Aguarda até que a loja esteja pronta
  await new Promise<void>((resolve) => {
    store.ready(() => {
      console.log('[IAP] Loja pronta (ready).');
      resolve();
    });
  });

  isInitialized = true;
  console.log('[IAP] Plugin de compra inicializado.');
}

/**
 * Inicia o fluxo de compra da assinatura.
 */
export async function purchaseSubscription(): Promise<{ success: boolean; error?: string }> {
  return handleSubscriptionFlow('purchase');
}

export async function renewSubscription(): Promise<{ success: boolean; error?: string }> {
  return handleSubscriptionFlow('renew');
}

async function handleSubscriptionFlow(mode: 'purchase' | 'renew'): Promise<{ success: boolean; error?: string }> {
  if (platform === 'web') {
    return { success: false, error: 'Compras não disponíveis na web.' };
  }

  if (!isInitialized) {
    await initializeIAP();
  }

  try {
    console.log(`[IAP] Iniciando fluxo de ${mode}...`);

    if (store) {
      console.log('[IAP] Atualizando loja (update)...');
      // Update é o método correto na v13 para sincronizar produtos e recibos
      await store.update();
    }

    console.log(`[IAP] Buscando produto: ${productId}`);
    const product = store.get(productId);

    // Log detalhado para diagnóstico
    if (product) {
      console.log(`[IAP] Estado do produto: ${product.state}`);
      console.log(`[IAP] Owned: ${product.owned}`);
    } else {
      // Se o produto não for encontrado após o update, tentar recarregar ou alertar
      console.warn(`[IAP] Produto ${productId} não encontrado na loja.`);
    }

    if (product?.offers && product.offers.length > 0) {
      console.log(`[IAP] Ofertas encontradas: ${product.offers.length}`);

      const targetPlanId = 'basico-mensal';
      let offer = product.offers.find((o: any) => o.id === targetPlanId || o.basePlanId === targetPlanId);

      if (!offer) {
        console.warn(`[IAP] Plano específico '${targetPlanId}' não encontrado. Usando a primeira oferta disponível.`);
        offer = product.offers[0];
      }

      console.log(`[IAP] Ordenando oferta: ${offer.id}`);
      offer.order();
      return { success: true };
    } else {
      console.warn('[IAP] Nenhuma oferta encontrada. Tentando fallback para store.order(productId).');
      // Fallback para versões antigas ou comportamento simplificado
      (store as any).order(productId);
      return { success: true };
    }
  } catch (error: any) {
    console.error(`[IAP] Erro no fluxo de ${mode}:`, error);
    return { success: false, error: error.message || 'Erro ao processar.' };
  }
}

/**
 * Abre a tela de gerenciamento de assinaturas da loja.
 * Útil para casos de GRACE_PERIOD ou ON_HOLD.
 */
export async function manageSubscriptions(): Promise<void> {
  if (platform === 'web' || !store) return;
  try {
    await store.manageSubscriptions();
  } catch (error) {
    console.error('[IAP] Erro ao abrir gerenciamento de assinaturas:', error);
  }
}
/**
 * Restaura compras anteriores do usuário.
 */
export async function restorePurchases(): Promise<{ success: boolean, restored: boolean }> {
  if (platform === 'web') {
    return { success: false, restored: false };
  }

  if (!isInitialized) {
    await initializeIAP();
  }

  try {
    console.log('[IAP] Restaurando compras...');

    // 1. Refresh na loja para puxar últimas transações
    // Em v13, store.update() é o método preferido para sincronizar
    if (store) {
      await store.update();
    }

    // 2. BUSCA ATIVA POR TRANSAÇÕES PRESAS
    // Iteramos por todos os produtos registrados para achar qualquer um que esteja "owned" ou "approved"
    // mas que não tenha disparado o evento automaticamente.
    if (store && store.products) {
      store.products.forEach((product: any) => {
        console.log(`[IAP] Inspecionando produto ${product.id}: owned=${product.owned}, state=${product.state}`);

        // Verifica TODAS as transações associadas ao produto
        if (product.transactions && product.transactions.length > 0) {
          product.transactions.forEach((transaction: any) => {
            console.log(`[IAP] Transação encontrada para ${product.id}: ${transaction.id} (state: ${transaction.state})`);
            // Se houver qualquer transação pendente (mesmo que não esteja APPROVED no plugin, mas exista), forçamos o processamento.
            // O Google Play pode estar esperando um finish() nela.
            handlePurchase({ ...product, transaction });
          });
        } else if (product.owned) {
          // Se estiver owned mas sem transação clara, tenta forçar a revalidação com os dados disponíveis
          console.log(`[IAP] Produto owned sem transação clara. Tentando forçar validação em ${product.id}`);

          if (platform === 'android' && product.receipt) {
            // Mock da transaction para que handlePurchase consiga encontrar o purchaseToken
            handlePurchase({ ...product, transaction: { receipt: product.receipt } });
          } else if (platform === 'ios') {
            handlePurchase(product); // No iOS o produto costuma ter a transaction
          } else {
            (product as any).finish();
          }
        }
      });
    }

    return { success: true, restored: true };
  } catch (error) {
    console.error('[IAP] Erro ao restaurar compras:', error);
    return { success: false, restored: false };
  }
}