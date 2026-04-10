"use client"

import { Button } from "@/components/ui/button"

interface Face1TeamProps {
  onSelect: (value: string) => void
  teamNames: string[]
}

export default function Face1Team({ onSelect, teamNames }: Face1TeamProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Equipe Sacadora</h2>
      <div className="flex gap-4">
        {teamNames.map((team) => (
          <Button key={team} onClick={() => onSelect(team)} variant="outline" className="flex-1 h-12 text-lg bg-white text-black border-slate-300 hover:bg-slate-100">
            Equipe {team}
          </Button>
        ))}
      </div>
    </div>
  )
}
