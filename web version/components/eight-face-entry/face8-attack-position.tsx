"use client"

import { Button } from "@/components/ui/button"

interface Face8AttackPositionProps {
  onSelect: (value: string) => void
}

export default function Face8AttackPosition({ onSelect }: Face8AttackPositionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Posição de Ataque</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Ponta", value: "P" },
          { label: "Meio", value: "M" },
          { label: "Oposto", value: "O" },
          { label: "Fundo", value: "F" },
          { label: "Segunda", value: "S" },
        ].map(({ label, value }) => (
          <Button key={value} onClick={() => onSelect(value)} className="h-12" variant="default">
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
