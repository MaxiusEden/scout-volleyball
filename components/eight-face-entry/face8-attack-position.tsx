"use client"

import { Button } from "@/components/ui/button"

interface Face8AttackPositionProps {
  onSelect: (value: string) => void
}

export default function Face8AttackPosition({ onSelect }: Face8AttackPositionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Posição de Ataque</h2>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Ponta", value: "P" },
          { label: "Meio", value: "M" },
          { label: "Oposto", value: "O" },
          { label: "Fundo", value: "F" },
        ].map(({ label, value }) => (
          <Button key={value} onClick={() => onSelect(value)} className="h-12 bg-white text-black border border-slate-300 hover:bg-slate-100" variant="outline">
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
