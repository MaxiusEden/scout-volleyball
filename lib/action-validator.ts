import type { MatchAction } from "./match-parser"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Valida uma ação de partida antes de processá-la
 */
export function validateMatchAction(action: Partial<MatchAction>): ValidationResult {
  const errors: string[] = []

  // Validação obrigatória: servingTeam
  if (!action.servingTeam || (action.servingTeam !== "A" && action.servingTeam !== "B")) {
    errors.push("Time que saca deve ser 'A' ou 'B'")
  }

  // Validação obrigatória: servingPlayer
  if (action.servingPlayer === undefined || action.servingPlayer === null || action.servingPlayer <= 0) {
    errors.push("Número do jogador que saca deve ser maior que 0")
  }

  // Validação obrigatória: serveQuality
  if (!action.serveQuality || !["+", "-", "ka"].includes(action.serveQuality)) {
    errors.push("Qualidade do saque deve ser '+', '-' ou 'ka'")
  }

  // Se o saque foi bem-sucedido (serveQuality === "+"), deve ter passingQuality
  if (action.serveQuality === "+" && !action.passingQuality) {
    errors.push("Saque bem-sucedido deve ter qualidade de passe")
  }

  // Se há passingQuality, deve ter passingPlayer
  if (action.passingQuality && (!action.passingPlayer || action.passingPlayer <= 0)) {
    errors.push("Se há qualidade de passe, deve haver jogador que passou")
  }

  // Validação: attackingTeam
  if (action.attackingTeam && action.attackingTeam !== "A" && action.attackingTeam !== "B") {
    errors.push("Time que ataca deve ser 'A' ou 'B'")
  }

  // Se há attackPosition, deve ter attackingTeam
  if (action.attackPosition && !action.attackingTeam) {
    errors.push("Posição de ataque requer time que ataca")
  }

  // Se há resultComplemento, deve ter attackingTeam e attackPosition
  if (action.resultComplemento) {
    if (!action.attackingTeam) {
      errors.push("Resultado do ataque requer time que ataca")
    }
    if (!action.attackPosition) {
      errors.push("Resultado do ataque requer posição de ataque")
    }
  }

  // Se há actionPlayer, deve ser maior que 0
  if (action.actionPlayer !== undefined && action.actionPlayer !== null && action.actionPlayer <= 0) {
    errors.push("Jogador da ação deve ser maior que 0")
  }

  // Se há blockingPlayer, deve ser maior que 0
  if (action.blockingPlayer !== undefined && action.blockingPlayer !== null && action.blockingPlayer <= 0) {
    errors.push("Jogador do bloqueio deve ser maior que 0")
  }

  // Se há defensivePlayer, deve ser maior que 0
  if (action.defensivePlayer !== undefined && action.defensivePlayer !== null && action.defensivePlayer <= 0) {
    errors.push("Jogador da defesa deve ser maior que 0")
  }

  // Validação: serveZone deve ser válido se fornecido
  if (action.serveZone && !["7.5", "8.6", "9.1"].includes(action.serveZone)) {
    errors.push("Zona de saque deve ser '7.5', '8.6' ou '9.1'")
  }

  // Validação: attackPosition deve ser válido se fornecido
  if (action.attackPosition && !["O", "M", "P", "F", "S"].includes(action.attackPosition)) {
    errors.push("Posição de ataque deve ser 'O', 'M', 'P', 'F' ou 'S'")
  }

  // Validação: blockingPosition deve ser válido se fornecido
  if (action.blockingPosition && !["O", "M", "P", "FS"].includes(action.blockingPosition)) {
    errors.push("Posição de bloqueio deve ser 'O', 'M', 'P' ou 'FS'")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

