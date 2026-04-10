"use client"

import { Button } from "@/components/ui/button"

interface Face9ResultTypeProps {
  onSelect: (value: string) => void
}

export default function Face9ResultType({ onSelect }: Face9ResultTypeProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Resultado da Ação</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => onSelect("#")} className="h-12 text-lg" variant="default">
          # Ponto de Ataque
        </Button>
        <Button onClick={() => onSelect("!")} className="h-12 text-lg" variant="default">
          ! Erro
        </Button>
        <Button onClick={() => onSelect("+")} className="h-12 text-lg" variant="default">
          + Bloqueio Adversário
        </Button>
        <Button onClick={() => onSelect("D")} className="h-12 text-lg" variant="default">
          D Defesa
        </Button>
      </div>
    </div>
  )
}
