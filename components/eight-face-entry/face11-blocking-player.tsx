"use client"

import { Button } from "@/components/ui/button"

interface Face11BlockingPlayerProps {
  onSelect: (value: number | string) => void
  team: { name: string; players: number[] }
  context: string
}

export default function Face11BlockingPlayer({ onSelect, team, context }: Face11BlockingPlayerProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-2">{context}</h2>
        <p className="text-sm text-slate-900 mb-4">Time {team.name}</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {team.players.map((player) => (
          <Button key={player} onClick={() => onSelect(player)} variant="outline" className="h-10 bg-white text-black border-slate-300 hover:bg-slate-100">
            {player}
          </Button>
        ))}
      </div>
    </div>
  )
}
