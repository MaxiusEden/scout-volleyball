"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CATEGORIES } from "@/lib/auth-config"
import TeamRosterManagement, { type Player } from "@/components/team-roster-management"

interface MatchSetupPageProps {
  onSetup: (teamAName: string, teamBName: string, category: string, teamAPlayers: Player[], teamBPlayers: Player[]) => void
}

export default function MatchSetupPage({ onSetup }: MatchSetupPageProps) {
  const [teamAName, setTeamAName] = useState("Time A")
  const [teamBName, setTeamBName] = useState("Time B")
  const [selectedCategory, setSelectedCategory] = useState("adult")
  const [showRosterSetup, setShowRosterSetup] = useState(false)

  const handleNext = () => {
    if (teamAName.trim() && teamBName.trim() && selectedCategory) {
      setShowRosterSetup(true)
    }
  }

  const handleRosterComplete = (teamAPlayers: Player[], teamBPlayers: Player[]) => {
    onSetup(teamAName.trim(), teamBName.trim(), selectedCategory, teamAPlayers, teamBPlayers)
  }

  if (showRosterSetup) {
    return (
      <TeamRosterManagement
        teamAName={teamAName}
        teamBName={teamBName}
        onRosterComplete={handleRosterComplete}
      />
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Scout Volleyball</h1>
          <p className="text-slate-600">by Lucas Ribeiro da Cunha</p>
          <p className="text-slate-600 text-sm mt-2">Configurar Partida</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Equipe A</label>
            <Input
              type="text"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              placeholder="Digite o nome do Time A"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Equipe B</label>
            <Input
              type="text"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              placeholder="Digite o nome do Time B"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Selecione a Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
            disabled={!teamAName.trim() || !teamBName.trim() || !selectedCategory}
          >
            Próximo: Cadastrar Jogadores
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-slate-700">
            <strong>Dica:</strong> Após configurar os nomes, você poderá cadastrar os jogadores de cada equipe.
          </p>
        </div>
      </Card>
    </div>
  )
}
