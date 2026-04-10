"use client"

import { Button } from "@/components/ui/button"

interface Face3ServeProps {
  onSelect: (value: string) => void
}

export default function Face3Serve({ onSelect }: Face3ServeProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Saque</h2>
      <div className="grid grid-cols-3 gap-4">
        <Button onClick={() => onSelect("+")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          + Certo
        </Button>
        <Button onClick={() => onSelect("ka")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          ! Quebrado
        </Button>
        <Button onClick={() => onSelect("-")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          - Erro
        </Button>
      </div>
    </div>
  )
}
