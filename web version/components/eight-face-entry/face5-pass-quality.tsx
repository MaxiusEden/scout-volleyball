"use client"

import { Button } from "@/components/ui/button"

interface Face5PassQualityProps {
  onSelect: (value: string) => void
}

export default function Face5PassQuality({ onSelect }: Face5PassQualityProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Qualidade do Passe</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => onSelect("A")} className="h-12 text-lg" variant="default">
          A - Bom
        </Button>
        <Button onClick={() => onSelect("B")} className="h-12 text-lg" variant="default">
          B - Médio
        </Button>
        <Button onClick={() => onSelect("C")} className="h-12 text-lg" variant="default">
          C - Regular
        </Button>
        <Button onClick={() => onSelect("D")} className="h-12 text-lg" variant="default">
          D - Erro
        </Button>
      </div>
    </div>
  )
}
