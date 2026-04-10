(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/auth-config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CATEGORIES",
    ()=>CATEGORIES
]);
const CATEGORIES = [
    {
        id: "sub13",
        label: "Sub 13",
        minAge: 0,
        maxAge: 13
    },
    {
        id: "sub15",
        label: "Sub 15",
        minAge: 13,
        maxAge: 15
    },
    {
        id: "sub17",
        label: "Sub 17",
        minAge: 15,
        maxAge: 17
    },
    {
        id: "sub19",
        label: "Sub 19",
        minAge: 17,
        maxAge: 19
    },
    {
        id: "sub21",
        label: "Sub 21",
        minAge: 19,
        maxAge: 21
    },
    {
        id: "adult",
        label: "Adulto",
        minAge: 21,
        maxAge: 120
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/match-parser.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateMatchStats",
    ()=>calculateMatchStats,
    "calculateTeamStats",
    ()=>calculateTeamStats,
    "createEmptyStats",
    ()=>createEmptyStats
]);
function calculateMatchStats(actions) {
    const statsA = createEmptyStats();
    const statsB = createEmptyStats();
    for (const action of actions){
        processAction(action, statsA, statsB);
    }
    return {
        statsA,
        statsB
    };
}
function createEmptyStats() {
    return {
        serves: {
            correct: 0,
            errors: 0,
            aces: 0,
            zones: {
                "7.5": 0,
                "8.6": 0,
                "9.1": 0
            }
        },
        reception: {
            qualityA: 0,
            qualityB: 0,
            qualityC: 0,
            errors: 0
        },
        distribution: {
            O: 0,
            M: 0,
            P: 0,
            F: 0,
            S: 0
        },
        attacks: {
            successful: 0,
            errors: 0,
            blocked: 0,
            defended: 0
        },
        transitions: {
            k1: 0,
            k2: 0,
            k3: 0
        },
        blocks: {
            successful: 0,
            errors: 0,
            positions: {
                O: 0,
                M: 0,
                P: 0,
                FS: 0
            }
        },
        points: 0
    };
}
function calculateTeamStats(actions, team) {
    const stats = createEmptyStats();
    const opposingTeam = team === "A" ? "B" : "A";
    for (const action of actions){
        // Count serves for this team
        if (action.servingTeam === team) {
            if (action.serveQuality === "ka") {
                stats.serves.aces++;
            } else if (action.serveQuality === "-") {
                stats.serves.errors++;
            } else if (action.serveQuality === "+") {
                stats.serves.correct++;
            }
            if (action.serveZone) {
                stats.serves.zones[action.serveZone]++;
            }
        }
        // Count receptions for this team (when opposing team serves)
        if (action.servingTeam === opposingTeam && action.passingQuality) {
            if (action.passingQuality === "A") stats.reception.qualityA++;
            else if (action.passingQuality === "B") stats.reception.qualityB++;
            else if (action.passingQuality === "C") stats.reception.qualityC++;
            else if (action.passingQuality === "D") stats.reception.errors++;
        }
        // Count attacks for this team
        if (action.attackingTeam === team && action.attackPosition) {
            stats.distribution[action.attackPosition]++;
            if (action.resultComplemento === "#") {
                stats.attacks.successful++;
            } else if (action.resultComplemento === "!") {
                stats.attacks.errors++;
            } else if (action.resultComplemento === "+") {
                stats.attacks.blocked++;
            } else if (action.resultComplemento === "D") {
                stats.attacks.defended++;
            }
        }
        if (action.pointScoredBy === team && action.transitionType) {
            const transitionType = action.transitionType.toLowerCase();
            if (transitionType === "k1") stats.transitions.k1++;
            else if (transitionType === "k2") stats.transitions.k2++;
            else if (transitionType === "k3") stats.transitions.k3++;
        }
        // Count blocks for this team (when they block opposing team's attack)
        if (action.attackingTeam === opposingTeam && action.resultComplemento === "+") {
            stats.blocks.successful++;
            if (action.blockingPosition) {
                stats.blocks.positions[action.blockingPosition]++;
            }
        }
        // Count block errors for this team
        if (action.attackingTeam === opposingTeam && action.resultComplemento === "$") {
            stats.blocks.errors++;
        }
        // Count points for this team
        if (action.pointScoredBy === team) {
            stats.points++;
        }
    }
    return stats;
}
function processAction(action, statsA, statsB) {
    const servingStats = action.servingTeam === "A" ? statsA : statsB;
    const receivingStats = action.servingTeam === "A" ? statsB : statsA;
    if (action.serveQuality === "ka") {
        // Ace: serving team scores
        servingStats.serves.aces++;
        servingStats.points++;
        action.pointScoredBy = action.servingTeam;
        return;
    }
    if (action.serveQuality === "-") {
        // Serve error: receiving team scores
        servingStats.serves.errors++;
        receivingStats.points++;
        action.pointScoredBy = action.servingTeam === "A" ? "B" : "A";
        return;
    }
    if (action.serveQuality === "+") {
        servingStats.serves.correct++;
    }
    // Pure attack actions may not have serveZone or passingQuality filled
    if (action.attackPosition && action.resultComplemento) {
        const attackingStats = action.attackingTeam === "A" ? statsA : statsB;
        const defendingStats = action.attackingTeam === "A" ? statsB : statsA;
        attackingStats.distribution[action.attackPosition]++;
        if (action.resultComplemento === "#") {
            // Point to attacking team
            attackingStats.attacks.successful++;
            attackingStats.points++;
            action.pointScoredBy = action.attackingTeam;
            return;
        } else if (action.resultComplemento === "!") {
            // Attack error: defending team scores
            attackingStats.attacks.errors++;
            defendingStats.points++;
            action.pointScoredBy = action.attackingTeam === "A" ? "B" : "A";
            return;
        } else if (action.resultComplemento === "$") {
            // Block by attacking team (impossible, but kept for completeness)
            attackingStats.blocks.successful++;
            attackingStats.points++;
            action.pointScoredBy = action.attackingTeam;
            return;
        } else if (action.resultComplemento === "+") {
            attackingStats.attacks.blocked++;
            defendingStats.blocks.successful++;
            defendingStats.points++;
            // Block statistics are now tracked by blocker position
            if (action.blockingPosition) {
                defendingStats.blocks.positions[action.blockingPosition]++;
            }
            action.pointScoredBy = action.attackingTeam === "A" ? "B" : "A";
            return;
        } else if (action.resultComplemento === "D") {
            attackingStats.attacks.successful++;
            return;
        }
    }
    // If we reach here, this is a serve action with reception data
    if (!action.serveZone || !action.passingQuality) {
        return;
    }
    servingStats.serves.zones[action.serveZone]++;
    if (action.passingQuality === "A") receivingStats.reception.qualityA++;
    else if (action.passingQuality === "B") receivingStats.reception.qualityB++;
    else if (action.passingQuality === "C") receivingStats.reception.qualityC++;
    else if (action.passingQuality === "D") {
        // Reception error: serving team scores
        receivingStats.reception.errors++;
        servingStats.points++;
        action.pointScoredBy = action.servingTeam;
        return;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/set-manager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateMatchWinner",
    ()=>calculateMatchWinner,
    "canStartNewSet",
    ()=>canStartNewSet,
    "getSetWinner",
    ()=>getSetWinner,
    "isSetComplete",
    ()=>isSetComplete
]);
function isSetComplete(teamAScore, teamBScore) {
    const minPoints = 40;
    const minDifference = 2;
    if (teamAScore < minPoints && teamBScore < minPoints) {
        return false;
    }
    return Math.abs(teamAScore - teamBScore) >= minDifference;
}
function getSetWinner(teamAScore, teamBScore) {
    if (!isSetComplete(teamAScore, teamBScore)) {
        return null;
    }
    return teamAScore > teamBScore ? "A" : "B";
}
function calculateMatchWinner(sets) {
    const teamAWins = sets.filter((s)=>s.winner === "A").length;
    const teamBWins = sets.filter((s)=>s.winner === "B").length;
    const maxSetsToWin = 3;
    if (teamAWins >= maxSetsToWin) return "A";
    if (teamBWins >= maxSetsToWin) return "B";
    return null;
}
function canStartNewSet(sets) {
    return sets.length === 0 || sets.length < 5 && calculateMatchWinner(sets) === null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/match-storage.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteMatch",
    ()=>deleteMatch,
    "getMatchById",
    ()=>getMatchById,
    "getMatchStatistics",
    ()=>getMatchStatistics,
    "getMatches",
    ()=>getMatches,
    "getMatchesByCategory",
    ()=>getMatchesByCategory,
    "saveMatch",
    ()=>saveMatch
]);
const STORAGE_KEY = "volleyball_matches_history";
function isStorageAvailable() {
    try {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return typeof localStorage !== "undefined";
    } catch  {
        return false;
    }
}
function saveMatch(match) {
    // Se já tem ID, usar; senão, gerar novo
    const storedMatch = 'id' in match && match.id ? match : {
        ...match,
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    try {
        if (!isStorageAvailable()) {
            console.warn("[v0] localStorage not available, match not persisted");
            return storedMatch;
        }
        const existingMatches = getMatches();
        // Verificar se já existe (evitar duplicatas)
        const existingIndex = existingMatches.findIndex((m)=>m.id === storedMatch.id);
        if (existingIndex >= 0) {
            // Atualizar partida existente
            existingMatches[existingIndex] = storedMatch;
            console.log("[v0] Match updated:", storedMatch.id);
        } else {
            // Adicionar nova partida no início
            existingMatches.unshift(storedMatch);
            console.log("[v0] Match saved successfully:", storedMatch.id);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingMatches));
        return storedMatch;
    } catch (error) {
        console.error("[v0] Error saving match:", error);
        throw error;
    }
}
function getMatches() {
    try {
        if (!isStorageAvailable()) {
            return [];
        }
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error("[v0] Error retrieving matches:", error);
        return [];
    }
}
function getMatchById(id) {
    const matches = getMatches();
    return matches.find((m)=>m.id === id) || null;
}
function deleteMatch(id) {
    try {
        if (!isStorageAvailable()) return;
        const matches = getMatches();
        const filtered = matches.filter((m)=>m.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        console.log("[v0] Match deleted:", id);
    } catch (error) {
        console.error("[v0] Error deleting match:", error);
    }
}
function getMatchesByCategory(category) {
    return getMatches().filter((m)=>m.category === category);
}
function getMatchStatistics(matches = getMatches()) {
    const totalMatches = matches.length;
    const totalGames = matches.reduce((acc, m)=>acc + m.sets.length, 0);
    const averageSetsPerMatch = totalMatches > 0 ? (totalGames / totalMatches).toFixed(1) : "0";
    return {
        totalMatches,
        totalGames,
        averageSetsPerMatch
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/sync-queue.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sistema de fila de sincronização com retry automático
 */ __turbopack_context__.s([
    "syncQueue",
    ()=>syncQueue
]);
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000 // 5 segundos
;
const QUEUE_STORAGE_KEY = 'scout_sync_queue';
const SYNC_STATUS_KEY = 'scout_sync_status';
class SyncQueue {
    queue = [];
    isProcessing = false;
    syncStatus = {
        isOnline: ("TURBOPACK compile-time truthy", 1) ? navigator.onLine : "TURBOPACK unreachable",
        isSyncing: false,
        queueLength: 0,
        lastSyncTime: null,
        failedItems: 0
    };
    listeners = [];
    constructor(){
        // Só inicializar no cliente
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        this.loadQueue();
        this.loadStatus();
        this.setupOnlineListener();
        this.startProcessing();
    }
    setupOnlineListener() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        window.addEventListener('online', ()=>{
            this.syncStatus.isOnline = true;
            this.notifyListeners();
            this.startProcessing();
        });
        window.addEventListener('offline', ()=>{
            this.syncStatus.isOnline = false;
            this.notifyListeners();
        });
    }
    loadQueue() {
        if (("TURBOPACK compile-time value", "object") === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
                this.updateStatus();
            }
        } catch (error) {
            console.error('[SYNC QUEUE] Error loading queue:', error);
            this.queue = [];
        }
    }
    saveQueue() {
        if (("TURBOPACK compile-time value", "object") === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
            this.updateStatus();
        } catch (error) {
            console.error('[SYNC QUEUE] Error saving queue:', error);
        }
    }
    loadStatus() {
        if (("TURBOPACK compile-time value", "object") === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            const stored = localStorage.getItem(SYNC_STATUS_KEY);
            if (stored) {
                this.syncStatus = {
                    ...this.syncStatus,
                    ...JSON.parse(stored)
                };
            }
        } catch (error) {
            console.error('[SYNC QUEUE] Error loading status:', error);
        }
    }
    saveStatus() {
        if (("TURBOPACK compile-time value", "object") === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
        } catch (error) {
            console.error('[SYNC QUEUE] Error saving status:', error);
        }
    }
    updateStatus() {
        this.syncStatus.queueLength = this.queue.filter((q)=>q.status === 'pending' || q.status === 'failed').length;
        this.syncStatus.failedItems = this.queue.filter((q)=>q.status === 'failed').length;
        this.saveStatus();
        this.notifyListeners();
    }
    notifyListeners() {
        this.listeners.forEach((listener)=>listener({
                ...this.syncStatus
            }));
    }
    onStatusChange(listener) {
        this.listeners.push(listener);
        return ()=>{
            const index = this.listeners.indexOf(listener);
            if (index > -1) this.listeners.splice(index, 1);
        };
    }
    getStatus() {
        return {
            ...this.syncStatus
        };
    }
    async enqueue(type, data) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const item = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            retries: 0,
            timestamp: Date.now(),
            status: 'pending'
        };
        this.queue.push(item);
        this.saveQueue();
        this.startProcessing();
        return item.id;
    }
    async processItem(item) {
        try {
            item.status = 'processing';
            this.saveQueue();
            // Importar dinamicamente para evitar dependência circular
            const { saveMatch } = await __turbopack_context__.A("[project]/lib/actions.ts [app-client] (ecmascript, async loader)");
            if (item.type === 'match') {
                const result = await saveMatch(item.data);
                if (result.success) {
                    item.status = 'completed';
                    this.syncStatus.lastSyncTime = Date.now();
                    return true;
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            }
            return false;
        } catch (error) {
            console.error(`[SYNC QUEUE] Error processing item ${item.id}:`, error);
            item.retries++;
            if (item.retries >= MAX_RETRIES) {
                item.status = 'failed';
            } else {
                item.status = 'pending';
            }
            this.saveQueue();
            return false;
        }
    }
    async startProcessing() {
        if (this.isProcessing || !this.syncStatus.isOnline) return;
        this.isProcessing = true;
        this.syncStatus.isSyncing = true;
        this.notifyListeners();
        while(this.queue.length > 0 && this.syncStatus.isOnline){
            const pendingItems = this.queue.filter((item)=>item.status === 'pending' || item.status === 'failed' && item.retries < MAX_RETRIES);
            if (pendingItems.length === 0) break;
            for (const item of pendingItems){
                if (!this.syncStatus.isOnline) break;
                const success = await this.processItem(item);
                if (!success && item.retries < MAX_RETRIES) {
                    // Aguardar antes de tentar novamente
                    await new Promise((resolve)=>setTimeout(resolve, RETRY_DELAY));
                }
            }
            // Remover itens completados
            this.queue = this.queue.filter((item)=>item.status !== 'completed');
            this.saveQueue();
        }
        this.isProcessing = false;
        this.syncStatus.isSyncing = false;
        this.updateStatus();
    }
    clearCompleted() {
        this.queue = this.queue.filter((item)=>item.status !== 'completed');
        this.saveQueue();
    }
    clearFailed() {
        this.queue = this.queue.filter((item)=>item.status !== 'failed');
        this.saveQueue();
    }
    retryFailed() {
        this.queue.forEach((item)=>{
            if (item.status === 'failed') {
                item.status = 'pending';
                item.retries = 0;
            }
        });
        this.saveQueue();
        this.startProcessing();
    }
}
const syncQueue = ("TURBOPACK compile-time truthy", 1) ? new SyncQueue() : "TURBOPACK unreachable";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/subscription.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSubscription",
    ()=>getSubscription,
    "getSubscriptionDaysRemaining",
    ()=>getSubscriptionDaysRemaining,
    "getTrialDaysRemaining",
    ()=>getTrialDaysRemaining,
    "hasAccess",
    ()=>hasAccess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
;
;
// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032';
const logDebug = (location, message, data = {})=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    fetch(DEBUG_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location,
            message,
            data: {
                ...data,
                userAgent: navigator.userAgent,
                platform: typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"] !== 'undefined' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].getPlatform() : 'web'
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
        })
    }).catch(()=>{});
};
async function hasAccess() {
    // #region agent log
    logDebug('lib/subscription.ts:hasAccess', 'Checking access');
    // #endregion
    try {
        const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        // #region agent log
        logDebug('lib/subscription.ts:hasAccess', 'User check', {
            hasUser: !!user,
            userId: user?.id
        });
        // #endregion
        if (!user) return false;
        // Consultar backend (Edge Function)
        // O backend é a única fonte de verdade
        // #region agent log
        logDebug('lib/subscription.ts:hasAccess', 'Invoking subscription-status Edge Function');
        // #endregion
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].functions.invoke('subscription-status', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${(await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession()).data.session?.access_token}`
            }
        });
        if (error) {
            // #region agent log
            logDebug('lib/subscription.ts:hasAccess', 'Edge Function error', {
                error: error.message,
                errorStatus: error.status
            });
            // #endregion
            console.error('[SUBSCRIPTION] Erro ao consultar backend:', error);
            return false;
        }
        // #region agent log
        logDebug('lib/subscription.ts:hasAccess', 'Edge Function success', {
            hasAccess: data?.hasAccess
        });
        // #endregion
        return data?.hasAccess ?? false;
    } catch (error) {
        // #region agent log
        logDebug('lib/subscription.ts:hasAccess', 'Exception in hasAccess', {
            error: error?.message,
            errorStack: error?.stack
        });
        // #endregion
        console.error('[SUBSCRIPTION] Erro ao verificar acesso:', error);
        return false;
    }
}
async function getSubscription(userId) {
    try {
        // Consultar backend primeiro (fonte de verdade)
        const { data: statusData, error: statusError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].functions.invoke('subscription-status', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${(await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession()).data.session?.access_token}`
            }
        });
        if (!statusError && statusData?.subscription) {
            return statusData.subscription;
        }
        // Fallback: consultar diretamente (caso Edge Function não esteja disponível)
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('subscriptions').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') {
            console.error('[SUBSCRIPTION] Erro ao buscar assinatura:', error);
            return null;
        }
        return data || null;
    } catch (error) {
        console.error('[SUBSCRIPTION] Erro ao buscar assinatura:', error);
        return null;
    }
}
function getTrialDaysRemaining(subscription) {
    if (!subscription || !subscription.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
}
function getSubscriptionDaysRemaining(subscription) {
    if (!subscription || !subscription.current_period_end) return 0;
    const now = new Date();
    const subEnd = new Date(subscription.current_period_end);
    const diff = subEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/actions.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteMatchFromCloud",
    ()=>deleteMatchFromCloud,
    "fetchMatchesFromCloud",
    ()=>fetchMatchesFromCloud,
    "saveMatch",
    ()=>saveMatch,
    "saveMatchWithQueue",
    ()=>saveMatchWithQueue,
    "syncMatchesFromCloud",
    ()=>syncMatchesFromCloud
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sync-queue.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$subscription$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/subscription.ts [app-client] (ecmascript)");
;
;
;
async function fetchMatchesFromCloud() {
    try {
        // VERIFICAÇÃO: bloquear acesso se o usuário não tiver assinatura
        const userHasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$subscription$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasAccess"])();
        if (!userHasAccess) {
            console.warn('[SYNC] Acesso bloqueado: assinatura necessária para visualizar partidas na nuvem');
            return [];
        }
        const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        if (!user) {
            console.log('[SYNC] Usuário não autenticado, não é possível buscar partidas');
            return [];
        }
        console.log('[SYNC] Buscando partidas do Supabase para usuário:', user.id);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:15',
                    message: 'fetching matches from cloud',
                    data: {
                        userId: user.id
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('matches').select('*').eq('user_id', user.id).order('created_at', {
            ascending: false
        });
        if (error) {
            console.error('[SYNC] Erro ao buscar partidas:', error);
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:25',
                        message: 'error fetching matches',
                        data: {
                            error: error.message
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'SYNC'
                    })
                }).catch(()=>{});
            }
            // #endregion
            throw error;
        }
        if (!data || data.length === 0) {
            console.log('[SYNC] Nenhuma partida encontrada no Supabase');
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:33',
                        message: 'no matches found in cloud',
                        data: {
                            userId: user.id
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'SYNC'
                    })
                }).catch(()=>{});
            }
            // #endregion
            return [];
        }
        console.log(`[SYNC] ${data.length} partida(s) encontrada(s) no Supabase`);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:40',
                    message: 'matches found in cloud',
                    data: {
                        count: data.length,
                        userId: user.id
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        // Converter dados do Supabase para formato StoredMatch
        const matches = data.map((item)=>{
            const matchData = item.data || {};
            // Converter datas corretamente
            let createdAt;
            let completedAt;
            try {
                createdAt = matchData.createdAt ? matchData.createdAt instanceof Date ? matchData.createdAt : new Date(matchData.createdAt) : item.created_at ? new Date(item.created_at) : new Date();
            } catch  {
                createdAt = new Date();
            }
            try {
                completedAt = matchData.completedAt ? matchData.completedAt instanceof Date ? matchData.completedAt : new Date(matchData.completedAt) : item.updated_at ? new Date(item.updated_at) : new Date();
            } catch  {
                completedAt = new Date();
            }
            // Usar ID do Supabase se disponível, senão usar ID do matchData, senão gerar
            const matchId = item.id || matchData.id || `cloud_${item.created_at || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                id: matchId,
                teamAName: matchData.teamAName || 'Time A',
                teamBName: matchData.teamBName || 'Time B',
                category: matchData.category || 'adult',
                sets: matchData.sets || [],
                actions: matchData.actions || [],
                totalDuration: matchData.totalDuration || 0,
                createdAt,
                completedAt,
                winner: matchData.winner || 'A'
            };
        });
        console.log('[SYNC] Partidas convertidas:', matches.length);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:58',
                    message: 'matches converted',
                    data: {
                        count: matches.length
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        return matches;
    } catch (error) {
        console.error('[SYNC] Erro ao buscar partidas do Supabase:', error);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:66',
                    message: 'error in fetchMatchesFromCloud',
                    data: {
                        error: error.message,
                        errorStack: error instanceof Error ? error.stack : undefined
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        return [];
    }
}
/**
 * Gera um hash único para uma partida baseado em seus dados
 */ function generateMatchHash(match) {
    const key = `${match.teamAName}_${match.teamBName}_${match.createdAt}_${match.sets.length}_${match.actions.length}`;
    // Hash simples baseado em string
    let hash = 0;
    for(let i = 0; i < key.length; i++){
        const char = key.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
}
async function syncMatchesFromCloud() {
    const errors = [];
    let synced = 0;
    let uploaded = 0;
    try {
        // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de sincronizar
        const userHasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$subscription$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasAccess"])();
        if (!userHasAccess) {
            const errorMsg = 'Assinatura necessária para sincronizar dados. Faça uma assinatura para usar esta funcionalidade.';
            console.warn('[SYNC] Acesso bloqueado:', errorMsg);
            return {
                synced: 0,
                uploaded: 0,
                errors: [
                    errorMsg
                ]
            };
        }
        // Verificar se está online rapidamente
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        if (!isOnline) {
            console.log('[SYNC] Offline - apenas mostrando partidas locais');
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:130',
                        message: 'offline detected',
                        data: {},
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'OFFLINE'
                    })
                }).catch(()=>{});
            }
            // #endregion
            return {
                synced: 0,
                uploaded: 0,
                errors: []
            };
        }
        console.log('[SYNC] Iniciando sincronização bidirecional...');
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:140',
                    message: 'starting bidirectional sync',
                    data: {
                        isOnline
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        // Buscar partidas locais e da nuvem
        const { getMatches } = await __turbopack_context__.A("[project]/lib/match-storage.ts [app-client] (ecmascript, async loader)");
        const localMatches = getMatches();
        const cloudMatches = await fetchMatchesFromCloud();
        // Criar mapas de hashes para comparação (evita duplicatas)
        const localHashes = new Map();
        const cloudHashes = new Map();
        const localIds = new Set(localMatches.map((m)=>m.id));
        const cloudIds = new Set(cloudMatches.map((m)=>m.id));
        // Indexar partidas locais por hash e ID
        for (const match of localMatches){
            const hash = generateMatchHash(match);
            localHashes.set(hash, match);
        }
        // Indexar partidas da nuvem por hash e ID
        for (const match of cloudMatches){
            const hash = generateMatchHash(match);
            cloudHashes.set(hash, match);
        }
        console.log(`[SYNC] ${localMatches.length} partida(s) local(is), ${cloudMatches.length} partida(s) na nuvem`);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:165',
                    message: 'comparing local and cloud',
                    data: {
                        localCount: localMatches.length,
                        cloudCount: cloudMatches.length
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        // 1. Baixar partidas da nuvem que não existem localmente (por ID ou hash)
        for (const cloudMatch of cloudMatches){
            const hash = generateMatchHash(cloudMatch);
            const existsById = localIds.has(cloudMatch.id);
            const existsByHash = localHashes.has(hash);
            if (!existsById && !existsByHash) {
                try {
                    const { saveMatch: saveLocalMatch } = await __turbopack_context__.A("[project]/lib/match-storage.ts [app-client] (ecmascript, async loader)");
                    saveLocalMatch(cloudMatch);
                    synced++;
                    console.log(`[SYNC] Partida ${cloudMatch.id} baixada da nuvem`);
                    // #region agent log
                    if ("TURBOPACK compile-time truthy", 1) {
                        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                location: 'actions.ts:180',
                                message: 'match downloaded from cloud',
                                data: {
                                    matchId: cloudMatch.id,
                                    hash
                                },
                                timestamp: Date.now(),
                                sessionId: 'debug-session',
                                runId: 'run1',
                                hypothesisId: 'SYNC'
                            })
                        }).catch(()=>{});
                    }
                // #endregion
                } catch (error) {
                    const errorMsg = `Erro ao baixar partida ${cloudMatch.id}: ${error.message}`;
                    errors.push(errorMsg);
                    console.error('[SYNC]', errorMsg, error);
                }
            } else {
                console.log(`[SYNC] Partida ${cloudMatch.id} já existe localmente (ID ou hash), pulando...`);
            }
        }
        // 2. Enviar partidas locais que não existem na nuvem (por ID ou hash)
        for (const localMatch of localMatches){
            const hash = generateMatchHash(localMatch);
            const existsInCloudById = cloudIds.has(localMatch.id);
            const existsInCloudByHash = cloudHashes.has(hash);
            // Verificar se é uma partida local nova (ID começa com "match_")
            const isLocalOnly = localMatch.id.startsWith('match_');
            if (!existsInCloudById && !existsInCloudByHash && isLocalOnly) {
                try {
                    const result = await saveMatch(localMatch);
                    if (result.success && result.data && result.data[0]) {
                        // Atualizar ID local com o ID do Supabase
                        const cloudId = result.data[0].id;
                        const { saveMatch: saveLocalMatch } = await __turbopack_context__.A("[project]/lib/match-storage.ts [app-client] (ecmascript, async loader)");
                        const updatedMatch = {
                            ...localMatch,
                            id: cloudId
                        };
                        saveLocalMatch(updatedMatch);
                        uploaded++;
                        console.log(`[SYNC] Partida ${localMatch.id} enviada para nuvem (novo ID: ${cloudId})`);
                        // #region agent log
                        if ("TURBOPACK compile-time truthy", 1) {
                            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    location: 'actions.ts:210',
                                    message: 'match uploaded to cloud',
                                    data: {
                                        oldId: localMatch.id,
                                        newId: cloudId,
                                        hash
                                    },
                                    timestamp: Date.now(),
                                    sessionId: 'debug-session',
                                    runId: 'run1',
                                    hypothesisId: 'SYNC'
                                })
                            }).catch(()=>{});
                        }
                    // #endregion
                    } else {
                        // Se falhou, adicionar à fila
                        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncQueue"].enqueue('match', localMatch);
                        uploaded++;
                        console.log(`[SYNC] Partida ${localMatch.id} adicionada à fila de sincronização`);
                    }
                } catch (error) {
                    const errorMsg = `Erro ao enviar partida ${localMatch.id}: ${error.message}`;
                    errors.push(errorMsg);
                    console.error('[SYNC]', errorMsg, error);
                    // Tentar adicionar à fila
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncQueue"].enqueue('match', localMatch);
                    } catch (queueError) {
                        console.error('[SYNC] Erro ao adicionar à fila:', queueError);
                    }
                }
            }
        }
        console.log(`[SYNC] Sincronização concluída: ${synced} baixada(s), ${uploaded} enviada(s), ${errors.length} erro(s)`);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:230',
                    message: 'bidirectional sync completed',
                    data: {
                        synced,
                        uploaded,
                        errors: errors.length
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        return {
            synced,
            uploaded,
            errors
        };
    } catch (error) {
        console.error('[SYNC] Erro na sincronização:', error);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:238',
                    message: 'sync failed',
                    data: {
                        error: error.message,
                        errorStack: error instanceof Error ? error.stack : undefined
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'SYNC'
                })
            }).catch(()=>{});
        }
        // #endregion
        return {
            synced,
            uploaded,
            errors: [
                error.message || 'Erro desconhecido'
            ]
        };
    }
}
async function saveMatch(matchData) {
    try {
        // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de salvar na nuvem
        const userHasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$subscription$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasAccess"])();
        if (!userHasAccess) {
            return {
                success: false,
                error: 'Assinatura necessária para sincronizar dados na nuvem. Apenas salvamento local é permitido.'
            };
        }
        const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        if (!user) throw new Error('Faça login para salvar.');
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('matches').insert([
            {
                user_id: user.id,
                data: matchData,
                status: 'finished'
            }
        ]).select();
        if (error) throw error;
        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Erro:', error);
        // Se falhar, adicionar à fila de sincronização
        if (navigator.onLine) {
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncQueue"].enqueue('match', matchData);
                console.log('[SYNC] Partida adicionada à fila de sincronização');
            } catch (queueError) {
                console.error('[SYNC] Erro ao adicionar à fila:', queueError);
            }
        }
        return {
            success: false,
            error: error.message
        };
    }
}
async function saveMatchWithQueue(matchData) {
    try {
        // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de tentar sincronizar
        const userHasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$subscription$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasAccess"])();
        if (!userHasAccess) {
            // Usuário sem assinatura - apenas permitir salvamento local
            console.warn('[SYNC] Usuário sem assinatura. Apenas salvamento local é permitido.');
            return {
                success: false,
                queued: false,
                error: 'Assinatura necessária para sincronizar com a nuvem. Apenas salvamento local está disponível no período de teste.'
            };
        }
        // Usuário com assinatura - tentar salvar na nuvem
        const result = await saveMatch(matchData);
        if (result.success) {
            return result;
        }
        // Se falhar, adicionar à fila
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncQueue"].enqueue('match', matchData);
        return {
            success: true,
            queued: true,
            message: 'Partida adicionada à fila de sincronização'
        };
    } catch (error) {
        // Se tudo falhar, adicionar à fila mesmo assim
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sync$2d$queue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncQueue"].enqueue('match', matchData);
        return {
            success: true,
            queued: true,
            message: 'Partida adicionada à fila de sincronização'
        };
    }
}
async function deleteMatchFromCloud(matchId) {
    try {
        const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        if (!user) {
            console.log('[DELETE] Usuário não autenticado, não é possível deletar da nuvem');
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:340',
                        message: 'user not authenticated for delete',
                        data: {
                            matchId
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'DELETE'
                    })
                }).catch(()=>{});
            }
            // #endregion
            return {
                success: false,
                error: 'Usuário não autenticado'
            };
        }
        console.log('[DELETE] Deletando partida do Supabase:', matchId);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:350',
                    message: 'deleting match from cloud',
                    data: {
                        matchId,
                        userId: user.id
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'DELETE'
                })
            }).catch(()=>{});
        }
        // #endregion
        // Verificar se o ID é um UUID do Supabase (formato UUID)
        const isSupabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId);
        if (!isSupabaseId) {
            console.log('[DELETE] ID não é do Supabase, pulando deleção na nuvem:', matchId);
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:360',
                        message: 'match id not from supabase, skipping cloud delete',
                        data: {
                            matchId
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'DELETE'
                    })
                }).catch(()=>{});
            }
            // #endregion
            return {
                success: true
            } // Partida local apenas, não precisa deletar da nuvem
            ;
        }
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('matches').delete().eq('id', matchId).eq('user_id', user.id) // Garantir que só deleta partidas do próprio usuário
        ;
        if (error) {
            console.error('[DELETE] Erro ao deletar do Supabase:', error);
            // #region agent log
            if ("TURBOPACK compile-time truthy", 1) {
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'actions.ts:375',
                        message: 'error deleting from cloud',
                        data: {
                            matchId,
                            error: error.message
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'DELETE'
                    })
                }).catch(()=>{});
            }
            // #endregion
            throw error;
        }
        console.log('[DELETE] Partida deletada do Supabase com sucesso:', matchId);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:383',
                    message: 'match deleted from cloud successfully',
                    data: {
                        matchId
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'DELETE'
                })
            }).catch(()=>{});
        }
        // #endregion
        return {
            success: true
        };
    } catch (error) {
        console.error('[DELETE] Erro ao deletar partida do Supabase:', error);
        // #region agent log
        if ("TURBOPACK compile-time truthy", 1) {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'actions.ts:390',
                    message: 'delete from cloud failed',
                    data: {
                        matchId,
                        error: error.message,
                        errorStack: error instanceof Error ? error.stack : undefined
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'DELETE'
                })
            }).catch(()=>{});
        }
        // #endregion
        return {
            success: false,
            error: error.message || 'Erro desconhecido'
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/notifications.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sistema de notificações nativas
 */ __turbopack_context__.s([
    "Notifications",
    ()=>Notifications,
    "requestNotificationPermission",
    ()=>requestNotificationPermission,
    "sendNotification",
    ()=>sendNotification
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
;
async function sendNotification(options) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
        // No futuro, usar @capacitor/local-notifications
        // Por enquanto, usar alert nativo
        if (window.alert) {
            window.alert(`${options.title}\n\n${options.body}`);
        }
    } else {
        // No navegador, usar Notifications API se disponível
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(options.title, {
                body: options.body,
                icon: '/icon.svg',
                badge: '/icon.svg',
                data: options.data
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            // Solicitar permissão
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(options.title, {
                    body: options.body,
                    icon: '/icon.svg',
                    badge: '/icon.svg',
                    data: options.data
                });
            }
        }
    }
}
async function requestNotificationPermission() {
    if (("TURBOPACK compile-time value", "object") === 'undefined' || !('Notification' in window)) {
        return false;
    }
    if (Notification.permission === 'granted') {
        return true;
    }
    if (Notification.permission === 'denied') {
        return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}
const Notifications = {
    matchSaved: (teamAName, teamBName)=>sendNotification({
            title: 'Partida salva',
            body: `${teamAName} vs ${teamBName} foi salva com sucesso!`
        }),
    syncSuccess: ()=>sendNotification({
            title: 'Sincronização concluída',
            body: 'Todas as partidas foram sincronizadas com a nuvem.'
        }),
    syncError: (error)=>sendNotification({
            title: 'Erro de sincronização',
            body: `Não foi possível sincronizar: ${error}`
        }),
    backupExported: (count)=>sendNotification({
            title: 'Backup exportado',
            body: `${count} partida${count > 1 ? 's' : ''} exportada${count > 1 ? 's' : ''} com sucesso!`
        }),
    backupImported: (count)=>sendNotification({
            title: 'Backup importado',
            body: `${count} partida${count > 1 ? 's' : ''} importada${count > 1 ? 's' : ''} com sucesso!`
        }),
    matchShared: ()=>sendNotification({
            title: 'Partida compartilhada',
            body: 'A partida foi compartilhada com sucesso!'
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/sync-manager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "syncManager",
    ()=>syncManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
;
class SyncManager {
    channel = null;
    listeners = [];
    // Mudança: Usamos um prefixo fixo para garantir que seja string
    clientId = "user_" + Math.floor(Math.random() * 1000000).toString();
    connectedDevices = [];
    constructor(){
        this.connectedDevices = [
            this.clientId
        ];
    }
    getConnectedDevices() {
        return [
            ...this.connectedDevices
        ];
    }
    getClientId() {
        return this.clientId;
    }
    getDeviceId() {
        return this.clientId;
    }
    async createRoom(roomId) {
        let finalRoomId = "";
        // Sanitização extrema
        try {
            if (roomId && typeof roomId === "string" && roomId.trim().length > 0) {
                finalRoomId = roomId.trim();
            } else {
                // Gera ID numérico convertido para string para evitar erros de substring
                const randomPart = Math.floor(Math.random() * 1000000).toString();
                finalRoomId = "ROOM_" + randomPart;
            }
        } catch (e) {
            finalRoomId = "ROOM_FALLBACK";
        }
        await this.joinRoom(finalRoomId);
        return finalRoomId;
    }
    async joinRoom(roomId) {
        const cleanRoomId = String(roomId || "ROOM_ERROR").trim();
        console.log(`🛡️ Tentando conectar na sala: ${cleanRoomId}`);
        if (this.channel) this.leaveRoom();
        try {
            // Configuração simplificada do canal
            this.channel = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].channel(cleanRoomId, {
                config: {
                    broadcast: {
                        self: false
                    },
                    presence: {
                        key: this.clientId
                    }
                }
            });
            this.channel.on("broadcast", {
                event: "sync-event"
            }, (payload)=>{
                if (payload.payload) {
                    this.notifyListeners(payload.payload);
                }
            }).on("presence", {
                event: "sync"
            }, ()=>{
                const state = this.channel?.presenceState();
                if (state) {
                    this.connectedDevices = Object.keys(state);
                    console.log("👥 Dispositivos atualizados:", this.connectedDevices);
                    this.notifyListeners({
                        type: "presence-change",
                        data: [
                            ...this.connectedDevices
                        ],
                        timestamp: Date.now(),
                        senderId: "system"
                    });
                }
            }).subscribe(async (status)=>{
                if (status === "SUBSCRIBED") {
                    console.log(`✅ SUCESSO: Conectado no canal ${cleanRoomId}`);
                    await this.channel?.track({
                        online_at: new Date().toISOString()
                    });
                }
            });
            return true;
        } catch (error) {
            console.error("Erro fatal no joinRoom:", error);
            return false;
        }
    }
    leaveRoom() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
            this.connectedDevices = [
                this.clientId
            ];
        }
    }
    async broadcast(message) {
        if (!this.channel) return;
        const fullMessage = {
            ...message,
            timestamp: Date.now(),
            senderId: this.clientId
        };
        await this.channel.send({
            type: "broadcast",
            event: "sync-event",
            payload: fullMessage
        });
    }
    onMessage(callback) {
        this.listeners.push(callback);
        return ()=>{
            this.listeners = this.listeners.filter((l)=>l !== callback);
        };
    }
    notifyListeners(message) {
        this.listeners.forEach((listener)=>{
            try {
                listener(message);
            } catch (e) {
                console.error(e);
            }
        });
    }
}
const syncManager = new SyncManager();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/rotation-manager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POSITION_NAMES",
    ()=>POSITION_NAMES,
    "createEmptyRotation",
    ()=>createEmptyRotation,
    "detectServeChangeAndRotate",
    ()=>detectServeChangeAndRotate,
    "handleServeSelection",
    ()=>handleServeSelection,
    "rotatePositions",
    ()=>rotatePositions,
    "updatePlayerAtPosition",
    ()=>updatePlayerAtPosition
]);
const POSITION_NAMES = {
    1: "I - Sacador",
    2: "II - Ponta Direita",
    3: "III - Central",
    4: "IV - Ponta Esquerda",
    5: "V - Fundo Esquerda",
    6: "VI - Oposto"
};
function createEmptyRotation(teamId) {
    return {
        teamId,
        currentRotation: Array.from({
            length: 6
        }, (_, i)=>({
                playerNumber: 0,
                position: i + 1
            })),
        rotationHistory: []
    };
}
function rotatePositions(rotation) {
    // Rotate in order: 1 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1
    const rotationOrder = [
        1,
        6,
        5,
        4,
        3,
        2
    ] // positions in order
    ;
    const newRotation = [
        ...rotation
    ];
    const players = rotationOrder.map((pos)=>newRotation.find((p)=>p.position === pos));
    // Shift players forward in the order
    for(let i = 0; i < rotationOrder.length; i++){
        const nextIndex = (i + 1) % rotationOrder.length;
        const nextPosition = rotationOrder[nextIndex];
        const currentPlayer = players[i];
        if (currentPlayer) {
            newRotation[nextPosition - 1] = {
                playerNumber: currentPlayer.playerNumber,
                position: nextPosition
            };
        }
    }
    return newRotation;
}
function updatePlayerAtPosition(rotation, position, playerNumber) {
    return rotation.map((p)=>p.position === position ? {
            playerNumber,
            position
        } : p);
}
function handleServeSelection(rotation, servingPlayerNumber) {
    let newRotation = [
        ...rotation
    ];
    // Find current position of serving player
    const currentPos = newRotation.findIndex((p)=>p.playerNumber === servingPlayerNumber);
    if (currentPos === -1) return newRotation // Player not in rotation
    ;
    // If player is not at position 1 (index 0), rotate until they are
    while(newRotation[0].playerNumber !== servingPlayerNumber){
        newRotation = rotatePositions(newRotation);
    }
    return newRotation;
}
function detectServeChangeAndRotate(actions, teamARotation, teamBRotation) {
    if (actions.length === 0) {
        return {
            teamARotation,
            teamBRotation
        };
    }
    const lastAction = actions[actions.length - 1];
    // If this is a serve action that changed teams, rotate
    if (lastAction.serveQuality === "-" || lastAction.serveQuality === "ka") {
        // Serve ended or ace - other team will serve next
        const nextServingTeam = lastAction.servingTeam === "A" ? "B" : "A";
        // Find the position to rotate to based on next server
        if (nextServingTeam === "A") {
            // Check if we need to find next server for team A
            return {
                teamARotation: rotatePositions(teamARotation),
                teamBRotation
            };
        } else {
            // Check if we need to find next server for team B
            return {
                teamARotation,
                teamBRotation: rotatePositions(teamBRotation)
            };
        }
    }
    return {
        teamARotation,
        teamBRotation
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/export-utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateExcel",
    ()=>generateExcel,
    "generatePDF",
    ()=>generatePDF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/share/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jspdf/dist/jspdf.es.min.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
;
;
;
;
;
// Função auxiliar para download no navegador
function downloadInBrowser(filename, dataBase64, mimeType) {
    console.log('[DEBUG] Downloading in browser', {
        filename
    });
    const blob = new Blob([
        Uint8Array.from(atob(dataBase64), (c)=>c.charCodeAt(0))
    ], {
        type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Arquivo ${filename} baixado com sucesso!`);
}
// --- FUNÇÃO AUXILIAR: Salva arquivo diretamente (sem compartilhar) ---
async function saveFileDirectly(filename, dataBase64, mimeType) {
    console.log('[DEBUG] saveFileDirectly called', {
        filename,
        dataLength: dataBase64.length,
        mimeType
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: 'export-utils.ts:23',
            message: 'saveFileDirectly called',
            data: {
                filename,
                dataLength: dataBase64.length,
                mimeType
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B'
        })
    }).catch(()=>{});
    // #endregion
    // Tentar usar Capacitor primeiro (funciona em nativo e web com fallback automático)
    try {
        console.log('[DEBUG] Attempting to use Capacitor Filesystem');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:35',
                message: 'using Capacitor native',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'C'
            })
        }).catch(()=>{});
        // #endregion
        console.log('[DEBUG] Checking permissions');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:40',
                message: 'checking permissions',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // Verificar permissões antes de salvar (opcional - se falhar, continua mesmo assim)
        try {
            if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].checkPermissions === 'function') {
                const permStatus = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].checkPermissions();
                console.log('[DEBUG] Permission status', permStatus);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'export-utils.ts:48',
                        message: 'permission check result',
                        data: {
                            filename,
                            publicStorage: permStatus.publicStorage
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'B'
                    })
                }).catch(()=>{});
                // #endregion
                if (permStatus.publicStorage !== 'granted') {
                    console.log('[DEBUG] Requesting permissions');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            location: 'export-utils.ts:52',
                            message: 'requesting permissions',
                            data: {
                                filename
                            },
                            timestamp: Date.now(),
                            sessionId: 'debug-session',
                            runId: 'run1',
                            hypothesisId: 'B'
                        })
                    }).catch(()=>{});
                    // #endregion
                    if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].requestPermissions === 'function') {
                        const request = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].requestPermissions();
                        console.log('[DEBUG] Permission request result', request);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                location: 'export-utils.ts:56',
                                message: 'permission request result',
                                data: {
                                    filename,
                                    publicStorage: request.publicStorage
                                },
                                timestamp: Date.now(),
                                sessionId: 'debug-session',
                                runId: 'run1',
                                hypothesisId: 'B'
                            })
                        }).catch(()=>{});
                        // #endregion
                        if (request.publicStorage !== 'granted') {
                            console.log('[DEBUG] Permission denied, using browser fallback');
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    location: 'export-utils.ts:60',
                                    message: 'permission denied',
                                    data: {
                                        filename
                                    },
                                    timestamp: Date.now(),
                                    sessionId: 'debug-session',
                                    runId: 'run1',
                                    hypothesisId: 'B'
                                })
                            }).catch(()=>{});
                            // #endregion
                            downloadInBrowser(filename, dataBase64, mimeType);
                            return;
                        }
                    }
                }
            } else {
                console.log('[DEBUG] checkPermissions not available, skipping permission check');
            }
        } catch (permError) {
            console.warn('[DEBUG] Permission check error (continuing anyway)', permError);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'export-utils.ts:71',
                    message: 'permission check error',
                    data: {
                        filename,
                        error: String(permError)
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'B'
                })
            }).catch(()=>{});
        // #endregion
        // Continua mesmo se a verificação de permissões falhar
        }
        console.log('[DEBUG] Writing file to Documents directory');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:70',
                message: 'writing file to Documents',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // Salva o arquivo diretamente na pasta Documents (não no cache)
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
            path: filename,
            data: dataBase64,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents,
            recursive: true
        });
        console.log('[DEBUG] File written to Documents', result.uri);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:78',
                message: 'file written successfully to Documents',
                data: {
                    filename,
                    uri: result.uri
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        alert(`Arquivo ${filename} salvo com sucesso na pasta Documentos!`);
    } catch (error) {
        console.error('[DEBUG] saveFileDirectly error', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:82',
                message: 'saveFileDirectly error',
                data: {
                    filename,
                    error: String(error),
                    errorStack: error instanceof Error ? error.stack : undefined
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        console.error("Erro ao salvar arquivo:", error);
        // Se falhar no nativo, tentar fallback do navegador
        console.log('[DEBUG] Falling back to browser download');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:87',
                message: 'using browser fallback',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'C'
            })
        }).catch(()=>{});
        // #endregion
        downloadInBrowser(filename, dataBase64, mimeType);
    }
}
// --- FUNÇÃO AUXILIAR: Salva e Abre o Compartilhamento Nativo (para PDFs que querem compartilhar) ---
async function saveAndShareFile(filename, dataBase64, mimeType) {
    console.log('[DEBUG] saveAndShareFile called', {
        filename,
        dataLength: dataBase64.length,
        mimeType
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: 'export-utils.ts:95',
            message: 'saveAndShareFile called',
            data: {
                filename,
                dataLength: dataBase64.length,
                mimeType
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B'
        })
    }).catch(()=>{});
    // #endregion
    // Tentar usar Capacitor primeiro (funciona em nativo e web com fallback automático)
    try {
        console.log('[DEBUG] Attempting to use Capacitor Filesystem');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:100',
                message: 'using Capacitor native',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'C'
            })
        }).catch(()=>{});
        // #endregion
        console.log('[DEBUG] Checking permissions');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:103',
                message: 'checking permissions',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // Verificar permissões antes de salvar (opcional - se falhar, continua mesmo assim)
        try {
            if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].checkPermissions === 'function') {
                const permStatus = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].checkPermissions();
                console.log('[DEBUG] Permission status', permStatus);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        location: 'export-utils.ts:109',
                        message: 'permission check result',
                        data: {
                            filename,
                            publicStorage: permStatus.publicStorage
                        },
                        timestamp: Date.now(),
                        sessionId: 'debug-session',
                        runId: 'run1',
                        hypothesisId: 'B'
                    })
                }).catch(()=>{});
                // #endregion
                if (permStatus.publicStorage !== 'granted') {
                    console.log('[DEBUG] Requesting permissions');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            location: 'export-utils.ts:113',
                            message: 'requesting permissions',
                            data: {
                                filename
                            },
                            timestamp: Date.now(),
                            sessionId: 'debug-session',
                            runId: 'run1',
                            hypothesisId: 'B'
                        })
                    }).catch(()=>{});
                    // #endregion
                    if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].requestPermissions === 'function') {
                        const request = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].requestPermissions();
                        console.log('[DEBUG] Permission request result', request);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                location: 'export-utils.ts:117',
                                message: 'permission request result',
                                data: {
                                    filename,
                                    publicStorage: request.publicStorage
                                },
                                timestamp: Date.now(),
                                sessionId: 'debug-session',
                                runId: 'run1',
                                hypothesisId: 'B'
                            })
                        }).catch(()=>{});
                        // #endregion
                        if (request.publicStorage !== 'granted') {
                            console.log('[DEBUG] Permission denied, using browser fallback');
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    location: 'export-utils.ts:121',
                                    message: 'permission denied',
                                    data: {
                                        filename
                                    },
                                    timestamp: Date.now(),
                                    sessionId: 'debug-session',
                                    runId: 'run1',
                                    hypothesisId: 'B'
                                })
                            }).catch(()=>{});
                            // #endregion
                            downloadInBrowser(filename, dataBase64, mimeType);
                            return;
                        }
                    }
                }
            } else {
                console.log('[DEBUG] checkPermissions not available, skipping permission check');
            }
        } catch (permError) {
            console.warn('[DEBUG] Permission check error (continuing anyway)', permError);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    location: 'export-utils.ts:132',
                    message: 'permission check error',
                    data: {
                        filename,
                        error: String(permError)
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'B'
                })
            }).catch(()=>{});
        // #endregion
        // Continua mesmo se a verificação de permissões falhar
        }
        console.log('[DEBUG] Writing file to cache for sharing');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:138',
                message: 'writing file to cache',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // 1. Salva o arquivo no cache do celular (para compartilhar)
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
            path: filename,
            data: dataBase64,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Cache
        });
        console.log('[DEBUG] File written to cache', result.uri);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:146',
                message: 'file written successfully to cache',
                data: {
                    filename,
                    uri: result.uri
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        console.log('[DEBUG] Sharing file');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:150',
                message: 'sharing file',
                data: {
                    filename,
                    uri: result.uri
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // 2. Abre o menu de compartilhar (WhatsApp, Email, Drive, etc)
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Share"].share({
            title: `Relatório: ${filename}`,
            url: result.uri,
            dialogTitle: 'Compartilhar Relatório'
        });
        console.log('[DEBUG] Share completed');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:158',
                message: 'share completed',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
    // #endregion
    } catch (error) {
        console.error('[DEBUG] saveAndShareFile error', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:162',
                message: 'saveAndShareFile error',
                data: {
                    filename,
                    error: String(error),
                    errorStack: error instanceof Error ? error.stack : undefined
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
            })
        }).catch(()=>{});
        // #endregion
        // Se o erro for "Share canceled", não fazer fallback (usuário cancelou intencionalmente)
        if (error?.message === 'Share canceled') {
            console.log('[DEBUG] Share was canceled by user, not falling back');
            return;
        }
        console.error("Erro ao exportar:", error);
        // Se falhar no nativo, tentar fallback do navegador
        console.log('[DEBUG] Falling back to browser download');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:171',
                message: 'using browser fallback',
                data: {
                    filename
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'C'
            })
        }).catch(()=>{});
        // #endregion
        downloadInBrowser(filename, dataBase64, mimeType);
    }
}
async function generatePDF(matchData, stats, sets, type) {
    console.log('[DEBUG] generatePDF called', {
        type,
        hasMatchData: !!matchData,
        hasStats: !!stats,
        hasSets: !!sets,
        teamA: matchData?.teamAName,
        teamB: matchData?.teamBName
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            location: 'export-utils.ts:104',
            message: 'generatePDF called',
            data: {
                type,
                hasMatchData: !!matchData,
                hasStats: !!stats,
                hasSets: !!sets,
                teamA: matchData?.teamAName,
                teamB: matchData?.teamBName
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D'
        })
    }).catch(()=>{});
    // #endregion
    try {
        console.log('[DEBUG] Creating jsPDF');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:108',
                message: 'creating jsPDF',
                data: {
                    type
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
            })
        }).catch(()=>{});
        // #endregion
        const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]();
        const teamA = matchData.teamAName;
        const teamB = matchData.teamBName;
        // Cabeçalho
        doc.setFontSize(18);
        doc.text("Relatório de Partida - Scout Volleyball", 14, 15);
        doc.setFontSize(12);
        doc.text(`${teamA} vs ${teamB}`, 14, 25);
        doc.text(`Data: ${new Date(matchData.startTime).toLocaleDateString('pt-BR')}`, 14, 32);
        // Calcular vencedor se não estiver definido
        const winner = matchData.winner || (sets.filter((s)=>s.winner === "A").length >= 3 ? "A" : "B");
        doc.text(`Vencedor: ${winner === 'A' ? teamA : teamB}`, 14, 39);
        // Tabela de Sets
        let setRows = sets.map((s, i)=>[
                `Set ${i + 1}`,
                `${s.teamAScore} x ${s.teamBScore}`,
                s.winner === 'A' ? teamA : teamB
            ]);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(doc, {
            startY: 45,
            head: [
                [
                    'Set',
                    'Placar',
                    'Vencedor'
                ]
            ],
            body: setRows,
            theme: 'striped',
            headStyles: {
                fillColor: [
                    66,
                    66,
                    66
                ]
            }
        });
        // Função para adicionar dados de um time
        const addTeamStats = (teamName, s, startY)=>{
            doc.text(`Estatísticas: ${teamName}`, 14, startY);
            const rows = [
                [
                    'Fundamento',
                    'Total',
                    'Detalhes'
                ],
                [
                    'Saque',
                    s.serves.correct + s.serves.errors + s.serves.aces,
                    `Aces: ${s.serves.aces} | Erros: ${s.serves.errors}`
                ],
                [
                    'Recepção',
                    s.reception.qualityA + s.reception.qualityB + s.reception.qualityC + s.reception.errors,
                    `Perfeita (A): ${s.reception.qualityA} | Erros: ${s.reception.errors}`
                ],
                [
                    'Ataque',
                    s.attacks.successful + s.attacks.errors + s.attacks.blocked,
                    `Pontos: ${s.attacks.successful} | Erros: ${s.attacks.errors} | Bloqueados: ${s.attacks.blocked}`
                ],
                [
                    'Bloqueio',
                    s.blocks.successful,
                    `Pontos de Bloqueio: ${s.blocks.successful}`
                ],
                [
                    'Pontos Totais',
                    s.points,
                    '-'
                ]
            ];
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2d$autotable$2f$dist$2f$jspdf$2e$plugin$2e$autotable$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(doc, {
                startY: startY + 5,
                head: [
                    [
                        'Fundamento',
                        'Qtd',
                        'Detalhes'
                    ]
                ],
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [
                        41,
                        128,
                        185
                    ]
                }
            });
            return doc.lastAutoTable.finalY + 15;
        };
        let currentY = doc.lastAutoTable.finalY + 15;
        if (type === 'A' || type === 'BOTH') {
            currentY = addTeamStats(teamA, stats.statsA, currentY);
        }
        if (type === 'B' || type === 'BOTH') {
            currentY = addTeamStats(teamB, stats.statsB, currentY);
        }
        console.log('[DEBUG] Generating PDF base64');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:169',
                message: 'generating PDF base64',
                data: {
                    type
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
            })
        }).catch(()=>{});
        // #endregion
        // Salvar
        const base64 = doc.output('datauristring').split(',')[1];
        console.log('[DEBUG] PDF base64 generated, length:', base64.length);
        console.log('[DEBUG] Calling saveFileDirectly');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:296',
                message: 'calling saveFileDirectly',
                data: {
                    type,
                    base64Length: base64.length
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
            })
        }).catch(()=>{});
        // #endregion
        await saveFileDirectly(`Relatorio_${type}_${Date.now()}.pdf`, base64, 'application/pdf');
        console.log('[DEBUG] generatePDF completed');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:178',
                message: 'generatePDF completed',
                data: {
                    type
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
            })
        }).catch(()=>{});
    // #endregion
    } catch (error) {
        console.error('[DEBUG] generatePDF error', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: 'export-utils.ts:182',
                message: 'generatePDF error',
                data: {
                    type,
                    error: String(error),
                    errorStack: error instanceof Error ? error.stack : undefined
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
            })
        }).catch(()=>{});
        // #endregion
        console.error('Erro ao gerar PDF:', error);
        throw error;
    }
}
async function generateExcel(matchData, stats, sets) {
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].book_new();
    // Dados Gerais
    const generalData = [
        [
            "Relatório de Partida",
            "",
            "",
            ""
        ],
        [
            "Data",
            new Date(matchData.startTime).toLocaleDateString('pt-BR')
        ],
        [
            "Equipe A",
            matchData.teamAName
        ],
        [
            "Equipe B",
            matchData.teamBName
        ],
        [
            "Vencedor",
            (matchData.winner || (sets.filter((s)=>s.winner === "A").length >= 3 ? "A" : "B")) === 'A' ? matchData.teamAName : matchData.teamBName
        ],
        [],
        [
            "SETS",
            "Placar A",
            "Placar B",
            "Vencedor"
        ],
        ...sets.map((s, i)=>[
                `Set ${i + 1}`,
                s.teamAScore,
                s.teamBScore,
                s.winner === 'A' ? matchData.teamAName : matchData.teamBName
            ]),
        [],
        [
            "ESTATÍSTICAS POR FUNDAMENTO"
        ],
        [
            "Time",
            "Fundamento",
            "Total",
            "Detalhes (Aces/Pontos/Perf)",
            "Erros"
        ],
        [
            matchData.teamAName,
            "Saque",
            stats.statsA.serves.correct + stats.statsA.serves.errors + stats.statsA.serves.aces,
            stats.statsA.serves.aces,
            stats.statsA.serves.errors
        ],
        [
            matchData.teamAName,
            "Recepção",
            stats.statsA.reception.qualityA + stats.statsA.reception.errors,
            stats.statsA.reception.qualityA,
            stats.statsA.reception.errors
        ],
        [
            matchData.teamAName,
            "Ataque",
            stats.statsA.attacks.successful + stats.statsA.attacks.errors,
            stats.statsA.attacks.successful,
            stats.statsA.attacks.errors
        ],
        [
            matchData.teamAName,
            "Bloqueio",
            stats.statsA.blocks.successful,
            stats.statsA.blocks.successful,
            0
        ],
        [],
        [
            matchData.teamBName,
            "Saque",
            stats.statsB.serves.correct + stats.statsB.serves.errors + stats.statsB.serves.aces,
            stats.statsB.serves.aces,
            stats.statsB.serves.errors
        ],
        [
            matchData.teamBName,
            "Recepção",
            stats.statsB.reception.qualityA + stats.statsB.reception.errors,
            stats.statsB.reception.qualityA,
            stats.statsB.reception.errors
        ],
        [
            matchData.teamBName,
            "Ataque",
            stats.statsB.attacks.successful + stats.statsB.attacks.errors,
            stats.statsB.attacks.successful,
            stats.statsB.attacks.errors
        ],
        [
            matchData.teamBName,
            "Bloqueio",
            stats.statsB.blocks.successful,
            stats.statsB.blocks.successful,
            0
        ]
    ];
    const ws = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].aoa_to_sheet(generalData);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].book_append_sheet(wb, ws, "Resumo");
    // Gera base64
    const wbout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["write"](wb, {
        bookType: 'xlsx',
        type: 'base64'
    });
    // Para Excel, salvar diretamente (não compartilhar)
    await saveFileDirectly(`Scout_Excel_${Date.now()}.xlsx`, wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/share-match.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sistema de compartilhamento de partidas
 */ __turbopack_context__.s([
    "generateShareableLink",
    ()=>generateShareableLink,
    "importFromShareableLink",
    ()=>importFromShareableLink,
    "shareMatchAsFile",
    ()=>shareMatchAsFile,
    "shareMatchAsPDF",
    ()=>shareMatchAsPDF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/match-storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/share/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/export-utils.ts [app-client] (ecmascript)");
;
;
;
;
;
async function shareMatchAsFile(matchId) {
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMatchById"])(matchId);
    if (!match) {
        throw new Error('Partida não encontrada');
    }
    const jsonString = JSON.stringify(match, null, 2);
    const filename = `partida_${match.teamAName}_vs_${match.teamBName}_${Date.now()}.json`;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
        // Salvar e compartilhar no dispositivo
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
            path: filename,
            data: base64,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Cache,
            recursive: true
        });
        const fileUri = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].getUri({
            path: filename,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Cache
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Share"].share({
            title: `Partida: ${match.teamAName} vs ${match.teamBName}`,
            text: `Partida de voleibol - ${match.teamAName} vs ${match.teamBName}`,
            url: fileUri.uri,
            dialogTitle: 'Compartilhar partida'
        });
    } else {
        // No navegador, usar Web Share API ou download
        if (navigator.share) {
            const blob = new Blob([
                jsonString
            ], {
                type: 'application/json'
            });
            const file = new File([
                blob
            ], filename, {
                type: 'application/json'
            });
            await navigator.share({
                title: `Partida: ${match.teamAName} vs ${match.teamBName}`,
                text: `Partida de voleibol - ${match.teamAName} vs ${match.teamBName}`,
                files: [
                    file
                ]
            });
        } else {
            // Fallback: download
            const blob = new Blob([
                jsonString
            ], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
}
async function shareMatchAsPDF(matchId) {
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMatchById"])(matchId);
    if (!match) {
        throw new Error('Partida não encontrada');
    }
    // Importar dinamicamente para evitar dependência circular
    const { calculateMatchStats } = await __turbopack_context__.A("[project]/lib/match-parser.ts [app-client] (ecmascript, async loader)");
    const stats = calculateMatchStats(match.actions);
    // Gerar PDF
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePDF"])({
        teamAName: match.teamAName,
        teamBName: match.teamBName,
        category: match.category,
        startTime: match.createdAt,
        winner: match.winner
    }, stats, match.sets, 'BOTH');
}
function generateShareableLink(matchId) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMatchById"])(matchId);
    if (!match) {
        throw new Error('Partida não encontrada');
    }
    const jsonString = JSON.stringify(match);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    const shareUrl = `${window.location.origin}/share/${base64}`;
    return shareUrl;
}
function importFromShareableLink(base64) {
    try {
        const jsonString = decodeURIComponent(escape(atob(base64)));
        const match = JSON.parse(jsonString);
        // Validar estrutura
        if (!match.id || !match.teamAName || !match.teamBName) {
            throw new Error('Formato de partida inválido');
        }
        return match;
    } catch (error) {
        throw new Error(`Erro ao importar partida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/backup-restore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sistema de Backup e Restore de dados
 */ __turbopack_context__.s([
    "exportBackup",
    ()=>exportBackup,
    "importBackup",
    ()=>importBackup,
    "readBackupFile",
    ()=>readBackupFile,
    "saveBackupFile",
    ()=>saveBackupFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/match-storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/share/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/notifications.ts [app-client] (ecmascript)");
;
;
;
;
;
async function exportBackup() {
    const matches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMatches"])();
    const totalSets = matches.reduce((sum, m)=>sum + m.sets.length, 0);
    const backup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        matches,
        metadata: {
            totalMatches: matches.length,
            totalSets
        }
    };
    const jsonString = JSON.stringify(backup, null, 2);
    return jsonString;
}
async function saveBackupFile() {
    try {
        const jsonString = await exportBackup();
        const filename = `scout_backup_${Date.now()}.json`;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
            // Salvar no dispositivo
            const base64 = btoa(unescape(encodeURIComponent(jsonString)));
            await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
                path: filename,
                data: base64,
                directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents,
                recursive: true
            });
            // Compartilhar arquivo
            const fileUri = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].getUri({
                path: filename,
                directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents
            });
            await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Share"].share({
                title: 'Backup Scout Volleyball',
                text: 'Backup das partidas',
                url: fileUri.uri,
                dialogTitle: 'Compartilhar backup'
            });
        } else {
            // Download no navegador
            const blob = new Blob([
                jsonString
            ], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('[BACKUP] Error saving backup:', error);
        throw error;
    }
}
async function importBackup(jsonString) {
    const errors = [];
    let imported = 0;
    try {
        const backup = JSON.parse(jsonString);
        // Validar estrutura
        if (!backup.matches || !Array.isArray(backup.matches)) {
            throw new Error('Formato de backup inválido: matches não encontrado');
        }
        // Validar versão (para compatibilidade futura)
        if (!backup.version) {
            console.warn('[BACKUP] Backup sem versão, assumindo v1.0.0');
        }
        // Importar partidas
        const existingMatches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$match$2d$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMatches"])();
        const existingIds = new Set(existingMatches.map((m)=>m.id));
        for (const match of backup.matches){
            try {
                // Validar estrutura da partida
                if (!match.id || !match.teamAName || !match.teamBName) {
                    errors.push(`Partida inválida: ${match.id || 'sem ID'}`);
                    continue;
                }
                // Se já existe, pular ou atualizar (escolha: pular para evitar duplicatas)
                if (existingIds.has(match.id)) {
                    console.log(`[BACKUP] Partida ${match.id} já existe, pulando...`);
                    continue;
                }
                // Adicionar à lista existente
                existingMatches.push(match);
                imported++;
            } catch (error) {
                errors.push(`Erro ao importar partida ${match.id}: ${error.message}`);
            }
        }
        // Salvar todas as partidas
        if (imported > 0) {
            localStorage.setItem('scout_matches', JSON.stringify(existingMatches));
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notifications"].backupImported(imported);
        }
        return {
            success: errors.length === 0,
            imported,
            errors
        };
    } catch (error) {
        console.error('[BACKUP] Error importing backup:', error);
        throw new Error(`Erro ao importar backup: ${error.message}`);
    }
}
async function readBackupFile() {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
        // No futuro, usar FilePicker do Capacitor
        throw new Error('Importação de arquivo ainda não implementada para mobile. Use a opção de colar JSON.');
    } else {
        // No navegador, usar input file
        return new Promise((resolve, reject)=>{
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e)=>{
                const file = e.target.files?.[0];
                if (!file) {
                    reject(new Error('Nenhum arquivo selecionado'));
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event)=>{
                    const content = event.target?.result;
                    resolve(content);
                };
                reader.onerror = ()=>reject(new Error('Erro ao ler arquivo'));
                reader.readAsText(file);
            };
            input.click();
        });
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/batch-export.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sistema de exportação em lote
 */ __turbopack_context__.s([
    "exportMatchesAsExcel",
    ()=>exportMatchesAsExcel,
    "exportMatchesAsJSON",
    ()=>exportMatchesAsJSON,
    "exportMatchesAsPDFs",
    ()=>exportMatchesAsPDFs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/export-utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/filesystem/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/share/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
;
;
;
;
;
async function exportMatchesAsPDFs(matches) {
    if (matches.length === 0) {
        throw new Error('Nenhuma partida selecionada');
    }
    // Importar dinamicamente
    const { calculateMatchStats } = await __turbopack_context__.A("[project]/lib/match-parser.ts [app-client] (ecmascript, async loader)");
    for (const match of matches){
        const stats = calculateMatchStats(match.actions);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$export$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePDF"])({
            teamAName: match.teamAName,
            teamBName: match.teamBName,
            category: match.category,
            startTime: match.createdAt,
            winner: match.winner
        }, stats, match.sets, 'BOTH');
        // Pequeno delay entre exportações
        await new Promise((resolve)=>setTimeout(resolve, 500));
    }
}
async function exportMatchesAsExcel(matches) {
    if (matches.length === 0) {
        throw new Error('Nenhuma partida selecionada');
    }
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].book_new();
    // Aba de resumo
    const summaryData = matches.map((match)=>({
            'Time A': match.teamAName,
            'Time B': match.teamBName,
            'Categoria': match.category,
            'Vencedor': match.winner === 'A' ? match.teamAName : match.teamBName,
            'Sets': match.sets.map((s)=>`${s.teamAScore}x${s.teamBScore}`).join(' | '),
            'Data': new Date(match.completedAt).toLocaleDateString('pt-BR'),
            'Duração': `${Math.floor(match.totalDuration / 60)}min`
        }));
    const summarySheet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].json_to_sheet(summaryData);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].book_append_sheet(wb, summarySheet, 'Resumo');
    // Aba para cada partida
    for(let i = 0; i < matches.length; i++){
        const match = matches[i];
        const { calculateTeamStats } = await __turbopack_context__.A("[project]/lib/match-parser.ts [app-client] (ecmascript, async loader)");
        const statsA = calculateTeamStats(match.actions, 'A');
        const statsB = calculateTeamStats(match.actions, 'B');
        const matchData = [
            [
                'Time A',
                match.teamAName,
                'Time B',
                match.teamBName
            ],
            [
                'Categoria',
                match.category,
                'Vencedor',
                match.winner === 'A' ? match.teamAName : match.teamBName
            ],
            [],
            [
                'Estatísticas - Time A'
            ],
            [
                'Saque Correto',
                statsA.serves.correct,
                'Saque Erro',
                statsA.serves.errors,
                'Aces',
                statsA.serves.aces
            ],
            [
                'Recepção A',
                statsA.reception.qualityA,
                'Recepção B',
                statsA.reception.qualityB,
                'Recepção C',
                statsA.reception.qualityC
            ],
            [
                'Ataque Ponto',
                statsA.attacks.successful,
                'Ataque Erro',
                statsA.attacks.errors,
                'Bloqueado',
                statsA.attacks.blocked
            ],
            [
                'Pontos',
                statsA.points
            ],
            [],
            [
                'Estatísticas - Time B'
            ],
            [
                'Saque Correto',
                statsB.serves.correct,
                'Saque Erro',
                statsB.serves.errors,
                'Aces',
                statsB.serves.aces
            ],
            [
                'Recepção A',
                statsB.reception.qualityA,
                'Recepção B',
                statsB.reception.qualityB,
                'Recepção C',
                statsB.reception.qualityC
            ],
            [
                'Ataque Ponto',
                statsB.attacks.successful,
                'Ataque Erro',
                statsB.attacks.errors,
                'Bloqueado',
                statsB.attacks.blocked
            ],
            [
                'Pontos',
                statsB.points
            ]
        ];
        const matchSheet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].aoa_to_sheet(matchData);
        const sheetName = `Partida ${i + 1}`.substring(0, 31) // Limite de 31 caracteres
        ;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].book_append_sheet(wb, matchSheet, sheetName);
    }
    // Salvar arquivo
    const filename = `Partidas_Em_Lote_${Date.now()}.xlsx`;
    const wbout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["write"](wb, {
        bookType: 'xlsx',
        type: 'base64'
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
            path: filename,
            data: wbout,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents,
            recursive: true
        });
        const fileUri = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].getUri({
            path: filename,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Share"].share({
            title: 'Partidas em lote',
            text: `${matches.length} partida${matches.length > 1 ? 's' : ''} exportada${matches.length > 1 ? 's' : ''}`,
            url: fileUri.uri,
            dialogTitle: 'Compartilhar arquivo'
        });
    } else {
        // Download no navegador
        const blob = new Blob([
            Uint8Array.from(atob(wbout), (c)=>c.charCodeAt(0))
        ], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
async function exportMatchesAsJSON(matches) {
    if (matches.length === 0) {
        throw new Error('Nenhuma partida selecionada');
    }
    const jsonString = JSON.stringify(matches, null, 2);
    const filename = `partidas_em_lote_${Date.now()}.json`;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capacitor"].isNativePlatform()) {
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].writeFile({
            path: filename,
            data: base64,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents,
            recursive: true
        });
        const fileUri = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Filesystem"].getUri({
            path: filename,
            directory: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$filesystem$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Directory"].Documents
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2f$share$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Share"].share({
            title: 'Partidas em lote',
            text: `${matches.length} partida${matches.length > 1 ? 's' : ''} exportada${matches.length > 1 ? 's' : ''}`,
            url: fileUri.uri,
            dialogTitle: 'Compartilhar arquivo'
        });
    } else {
        const blob = new Blob([
            jsonString
        ], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=lib_086f0a8d._.js.map