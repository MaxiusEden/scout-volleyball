"use client"

import { Button } from "@/components/ui/button"

interface Face9ResultTypeProps {
  onSelect: (value: string) => void
}

export default function Face9ResultType({ onSelect }: Face9ResultTypeProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Resultado da Ação</h2>
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => onSelect("#")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          # Ponto de Ataque
        </Button>
        <Button onClick={() => onSelect("!")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          ! Erro de Ataque
        </Button>
        <Button onClick={() => onSelect("+")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          + Ponto de Bloqueio
        </Button>
        <Button onClick={() => onSelect("D")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          D Defesa
        </Button>
      </div>
    </div>
  )
}
