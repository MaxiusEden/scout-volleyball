"use client"

import { Button } from "@/components/ui/button"

interface Face7AttackingTeamProps {
  onSelect: (value: string) => void
  teamNames: string[]
}

export default function Face7AttackingTeam({ onSelect, teamNames }: Face7AttackingTeamProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-black">Equipe Atacadora</h2>
      <div className="flex gap-4">
        {teamNames.map((team) => (
          <Button key={team} onClick={() => onSelect(team)} className="flex-1 h-12 text-lg bg-white text-black border border-slate-300 hover:bg-slate-100" variant="outline">
            Equipe {team}
          </Button>
        ))}
      </div>
    </div>
  )
}
