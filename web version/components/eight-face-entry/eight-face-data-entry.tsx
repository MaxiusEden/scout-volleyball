"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { MatchAction } from "@/lib/match-parser"
import type { Player } from "@/components/team-roster-management"
import Face1Team from "./face1-team"
import Face2Player from "./face2-player"
import Face3Serve from "./face3-serve"
import Face4ServeZone from "./face4-serve-zone"
import Face5PassQuality from "./face5-pass-quality"
import Face6PassingPlayer from "./face6-passing-player"
import Face7AttackingTeam from "./face7-attacking-team"
import Face8AttackPosition from "./face8-attack-position"
import Face9ResultType from "./face9-result-type"
import Face10AttackingPlayer from "./face10-attacking-player"
import Face11BlockingPlayer from "./face11-blocking-player"
import Face12Transition from "./face12-transition"
import Face9DefensePlayer from "./face9-defense-player"

interface EightFaceDataEntryProps {
  onActionComplete: (action: MatchAction) => void
  teamAName: string
  teamBName: string
  teamAScore: number
  teamBScore: number
  teamAPlayers: Player[]
  teamBPlayers: Player[]
}

export default function EightFaceDataEntry({
  onActionComplete,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  teamAPlayers,
  teamBPlayers,
}: EightFaceDataEntryProps) {
  const [currentFace, setCurrentFace] = useState(1)
  const [actionData, setActionData] = useState<Partial<MatchAction>>({
    servingTeam: "",
    servingPlayer: 0,
    serveQuality: "",
    serveZone: "",
    passingQuality: "",
    passingPlayer: 0,
    attackingTeam: "",
    attackPosition: "",
    resultComplemento: "",
    actionPlayer: 0,
    defensivePlayer: 0,
    transitionType: "k1",
    blockingPosition: "",
    blockingPlayer: 0,
  })

  const teamA = { 
    name: teamAName, 
    players: teamAPlayers.length > 0 ? teamAPlayers.map(p => p.number) : Array.from({ length: 14 }, (_, i) => i + 1)
  }
  const teamB = { 
    name: teamBName, 
    players: teamBPlayers.length > 0 ? teamBPlayers.map(p => p.number) : Array.from({ length: 14 }, (_, i) => i + 1)
  }

  const handleFaceComplete = (value: string | number) => {
    const newData = { ...actionData }

    switch (currentFace) {
      case 1:
        newData.servingTeam = value as string
        break
      case 2:
        newData.servingPlayer = value as number
        break
      case 3:
        newData.serveQuality = value as string
        if (value === "-" || value === "ka") {
          const action: MatchAction = {
            id: Math.random().toString(),
            timestamp: Date.now(),
            servingTeam: actionData.servingTeam as "A" | "B",
            servingPlayer: actionData.servingPlayer as number,
            serveQuality: value as "+" | "-" | "ka",
            attackingTeam: actionData.servingTeam === "A" ? "B" : "A",
          }
          console.log("[v0] Serve action:", action, "Quality:", value)
          onActionComplete(action)
          setCurrentFace(1)
          setActionData({
            servingTeam: "",
            servingPlayer: 0,
            serveQuality: "",
            serveZone: "",
            passingQuality: "",
            passingPlayer: 0,
            attackingTeam: "",
            attackPosition: "",
            resultComplemento: "",
            actionPlayer: 0,
            defensivePlayer: 0,
            transitionType: "k1",
            blockingPosition: "",
            blockingPlayer: 0,
          })
          return
        }
        break
      case 4:
        newData.serveZone = value as string
        break
      case 5:
        newData.passingQuality = value as string
        if (value === "D") {
          setActionData(newData)
          setCurrentFace(5.5)
          return
        }
        break
      case 5.5:
        newData.passingPlayer = value as number
        const passErrorAction: MatchAction = {
          id: Math.random().toString(),
          timestamp: Date.now(),
          servingTeam: actionData.servingTeam as "A" | "B",
          servingPlayer: actionData.servingPlayer as number,
          serveQuality: actionData.serveQuality as "+" | "-" | "ka",
          serveZone: actionData.serveZone as "7.5" | "8.6" | "9.1",
          passingQuality: "D",
          passingPlayer: value as number,
          attackingTeam: actionData.servingTeam === "A" ? "B" : "A",
        }
        console.log("[v0] Pass error with player:", passErrorAction)
        onActionComplete(passErrorAction)
        setCurrentFace(1)
        setActionData({
          servingTeam: "",
          servingPlayer: 0,
          serveQuality: "",
          serveZone: "",
          passingQuality: "",
          passingPlayer: 0,
          attackingTeam: "",
          attackPosition: "",
          resultComplemento: "",
          actionPlayer: 0,
          defensivePlayer: 0,
          transitionType: "k1",
          blockingPosition: "",
          blockingPlayer: 0,
        })
        return
      case 6:
        newData.passingPlayer = value as number

        // Criar ação de recepção separada
        const receptionAction: MatchAction = {
          id: Math.random().toString(),
          timestamp: Date.now(),
          servingTeam: actionData.servingTeam as "A" | "B",
          servingPlayer: actionData.servingPlayer as number,
          serveQuality: actionData.serveQuality as "+" | "-" | "ka",
          serveZone: actionData.serveZone as "7.5" | "8.6" | "9.1",
          passingQuality: actionData.passingQuality as "A" | "B" | "C" | "D",
          passingPlayer: value as number,
          attackingTeam: actionData.servingTeam === "A" ? "B" : "A",
        }

        console.log("[v0] Reception completed - Player:", value, "Quality:", actionData.passingQuality)
        onActionComplete(receptionAction)

        setActionData({
          servingTeam: "",
          servingPlayer: 0,
          serveQuality: "",
          serveZone: "",
          passingQuality: "",
          passingPlayer: value as number,
          attackingTeam: "",
          attackPosition: "",
          resultComplemento: "",
          actionPlayer: 0,
          defensivePlayer: 0,
          blockingPlayer: 0,
          blockingPosition: "",
          transitionType: "k1",
        })
        setCurrentFace(7)
        return
      case 7:
        newData.attackingTeam = value as string
        break
      case 8:
        newData.attackPosition = value as string
        break
      case 9:
        newData.resultComplemento = value as string
        if (value === "D") {
          setActionData(newData)
          setCurrentFace(9.1) // Face 9a: select attacker
          return
        } else {
          setActionData(newData)
          setCurrentFace(10)
          return
        }
        break
      case 9.1:
        newData.actionPlayer = value as number
        setActionData(newData)
        setCurrentFace(9.2) // Face 9b: select defender
        return
      case 9.2:
        newData.defensivePlayer = value as number
        const defenseAction: MatchAction = {
          id: Math.random().toString(),
          timestamp: Date.now(),
          servingTeam: actionData.servingTeam as "A" | "B",
          servingPlayer: actionData.servingPlayer as number,
          serveQuality: actionData.serveQuality as "+" | "-" | "ka",
          serveZone: actionData.serveZone as "7.5" | "8.6" | "9.1",
          passingQuality: actionData.passingQuality as "A" | "B" | "C" | "D",
          passingPlayer: actionData.passingPlayer as number,
          attackingTeam: actionData.attackingTeam as "A" | "B",
          attackPosition: actionData.attackPosition as "O" | "M" | "P" | "F" | "S",
          resultComplemento: "D",
          actionPlayer: newData.actionPlayer as number,
          defensivePlayer: value as number,
          blockingPlayer: 0,
          blockingPosition: "",
          transitionType: "k1",
        }
        console.log("[v0] Defense action with player:", defenseAction)
        onActionComplete(defenseAction)
        setCurrentFace(7)
        setActionData({
          servingTeam: actionData.servingTeam,
          servingPlayer: actionData.servingPlayer,
          serveQuality: actionData.serveQuality,
          serveZone: actionData.serveZone,
          passingQuality: actionData.passingQuality,
          passingPlayer: actionData.passingPlayer,
          attackingTeam: "",
          attackPosition: "",
          resultComplemento: "",
          actionPlayer: 0,
          defensivePlayer: 0,
          transitionType: "k1",
          blockingPosition: "",
          blockingPlayer: 0,
        })
        return
      case 10:
        newData.actionPlayer = value as number
        if (actionData.resultComplemento === "+") {
          setActionData(newData)
          setCurrentFace(10.5)
          return
        } else {
          setActionData(newData)
          setCurrentFace(12)
          return
        }
        break
      case 10.5:
        newData.blockingPosition = value as string
        setActionData(newData)
        setCurrentFace(11)
        return
      case 11:
        newData.blockingPlayer = value as number
        setActionData(newData)
        setCurrentFace(12)
        return
      case 12:
        newData.transitionType = value as string
        const action: MatchAction = {
          id: Math.random().toString(),
          timestamp: Date.now(),
          servingTeam: actionData.servingTeam as "A" | "B",
          servingPlayer: actionData.servingPlayer as number,
          serveQuality: actionData.serveQuality as "+" | "-" | "ka",
          serveZone: actionData.serveZone as "7.5" | "8.6" | "9.1",
          passingQuality: actionData.passingQuality as "A" | "B" | "C" | "D",
          passingPlayer: actionData.passingPlayer as number,
          attackingTeam: actionData.attackingTeam as "A" | "B",
          attackPosition: actionData.attackPosition as "O" | "M" | "P" | "F" | "S",
          resultComplemento: actionData.resultComplemento as "#" | "!" | "+",
          actionPlayer: actionData.actionPlayer as number,
          blockingPlayer: actionData.resultComplemento === "+" ? (actionData.blockingPlayer as number) : 0,
          blockingPosition: actionData.resultComplemento === "+" ? (actionData.blockingPosition as string) : "",
          defensivePlayer: actionData.defensivePlayer as number,
          transitionType: value as "k1" | "k2" | "k3",
        }
        console.log("[v0] Complete action:", action)
        onActionComplete(action)
        setCurrentFace(1)
        setActionData({
          servingTeam: "",
          servingPlayer: 0,
          serveQuality: "",
          serveZone: "",
          passingQuality: "",
          passingPlayer: 0,
          attackingTeam: "",
          attackPosition: "",
          resultComplemento: "",
          actionPlayer: 0,
          defensivePlayer: 0,
          transitionType: "k1",
          blockingPosition: "",
          blockingPlayer: 0,
        })
        return
    }

    setActionData(newData)
    setCurrentFace(currentFace + 1)
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-2xl mx-auto mb-4 p-4 bg-gradient-to-r from-red-600 to-blue-600 rounded-lg shadow-lg">
        <div className="flex justify-between items-center text-white">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">{teamAName}</h2>
            <p className="text-4xl font-bold">{teamAScore}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-lg font-bold">
              Face{" "}
              {currentFace === 9.1 ? "9a" : currentFace === 9.2 ? "9b" : currentFace === 10.5 ? "10a" : currentFace} de
              12
            </p>
          </div>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">{teamBName}</h2>
            <p className="text-4xl font-bold">{teamBScore}</p>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-2xl mx-auto p-8 bg-white shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Coleta de Dados - Voleibol</h1>
        </div>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          {currentFace === 1 && <Face1Team onSelect={handleFaceComplete} teamNames={["A", "B"]} />}
          {currentFace === 2 && (
            <Face2Player
              onSelect={handleFaceComplete}
              team={actionData.servingTeam === "A" ? teamA : teamB}
              context="Número do sacador"
            />
          )}
          {currentFace === 3 && <Face3Serve onSelect={handleFaceComplete} />}
          {currentFace === 4 && <Face4ServeZone onSelect={handleFaceComplete} />}
          {currentFace === 5 && <Face5PassQuality onSelect={handleFaceComplete} />}
          {currentFace === 5.5 && (
            <Face6PassingPlayer
              onSelect={handleFaceComplete}
              team={actionData.servingTeam === "A" ? teamB : teamA}
              context="Número do jogador que errou o passe"
            />
          )}
          {currentFace === 6 && (
            <Face6PassingPlayer
              onSelect={handleFaceComplete}
              team={actionData.servingTeam === "A" ? teamB : teamA}
              context="Número do passador"
            />
          )}
          {currentFace === 7 && <Face7AttackingTeam onSelect={handleFaceComplete} teamNames={["A", "B"]} />}
          {currentFace === 8 && <Face8AttackPosition onSelect={handleFaceComplete} />}
          {currentFace === 9 && <Face9ResultType onSelect={handleFaceComplete} />}
          {currentFace === 9.1 && (
            <Face10AttackingPlayer
              onSelect={handleFaceComplete}
              team={actionData.attackingTeam === "A" ? teamA : teamB}
              context="Número do atacante"
            />
          )}
          {currentFace === 9.2 && (
            <Face9DefensePlayer
              onSelect={handleFaceComplete}
              team={actionData.attackingTeam === "A" ? teamB : teamA}
              context="Número do defensor"
            />
          )}
          {currentFace === 10 && (
            <Face10AttackingPlayer
              onSelect={handleFaceComplete}
              team={actionData.attackingTeam === "A" ? teamA : teamB}
              context={actionData.resultComplemento === "+" ? "Número do atacante (bloqueio)" : "Número do atacante"}
            />
          )}
          {currentFace === 10.5 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Posição do Bloqueio</h2>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => handleFaceComplete("P")} className="h-12 text-lg" variant="outline">
                  P - Ponta
                </Button>
                <Button onClick={() => handleFaceComplete("M")} className="h-12 text-lg" variant="outline">
                  M - Meio
                </Button>
                <Button onClick={() => handleFaceComplete("O")} className="h-12 text-lg" variant="outline">
                  O - Oposto
                </Button>
              </div>
            </div>
          )}
          {currentFace === 11 && (
            <Face11BlockingPlayer
              onSelect={handleFaceComplete}
              team={actionData.attackingTeam === "A" ? teamB : teamA}
              context="Número do bloqueador"
            />
          )}
          {currentFace === 12 && <Face12Transition onSelect={handleFaceComplete} />}
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => {
              if (currentFace > 1) setCurrentFace(currentFace - 1)
            }}
            variant="outline"
            disabled={currentFace === 1}
          >
            Anterior
          </Button>
          <Button onClick={() => setCurrentFace(1)} variant="outline">
            Limpar
          </Button>
        </div>
      </Card>
    </div>
  )
}
