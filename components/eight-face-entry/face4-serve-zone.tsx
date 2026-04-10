"use client"

import { Button } from "@/components/ui/button"

interface Face4ServeZoneProps {
  onSelect: (value: string) => void
}

export default function Face4ServeZone({ onSelect }: Face4ServeZoneProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Zona de Recepção</h2>
      <div className="flex gap-4">
        {["7.5", "8.6", "9.1"].map((zone) => (
          <Button key={zone} onClick={() => onSelect(zone)} className="flex-1 h-12 text-lg bg-white text-black border border-slate-300 hover:bg-slate-100" variant="outline">
            {zone}
          </Button>
        ))}
      </div>
    </div>
  )
}
