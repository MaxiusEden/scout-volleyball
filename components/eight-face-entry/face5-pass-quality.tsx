"use client"

import { Button } from "@/components/ui/button"

interface Face5PassQualityProps {
  onSelect: (value: string) => void
}

export default function Face5PassQuality({ onSelect }: Face5PassQualityProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Qualidade do Passe</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => onSelect("A")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          A - Bom
        </Button>
        <Button onClick={() => onSelect("B")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          B - Quebrado
        </Button>
        <Button onClick={() => onSelect("C")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          C - Erro
        </Button>
        <Button onClick={() => onSelect("D")} className="h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100" variant="outline">
          D - Ace
        </Button>
      </div>
    </div>
  )
}
