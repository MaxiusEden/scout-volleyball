"use client"

import { Button } from "@/components/ui/button"

interface Face11TransitionProps {
  onSelect: (value: string) => void
}

export default function Face11Transition({ onSelect }: Face11TransitionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Transição</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "K1 (Side-out)", value: "K1" },
          { label: "K2 (Transição)", value: "K2" },
          { label: "K3 (Re-transição)", value: "K3" },
          { label: "K4 (Cobertura)", value: "K4" },
        ].map(({ label, value }) => (
          <Button key={value} onClick={() => onSelect(value)} className="h-12 bg-white text-black border border-slate-300 hover:bg-slate-100" variant="outline">
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
