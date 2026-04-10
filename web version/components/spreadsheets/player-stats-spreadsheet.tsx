"use client"

import { useState } from "react"
import type { MatchAction } from "@/lib/match-parser"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Printer } from 'lucide-react'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PlayerStatsSpreadsheetProps {
  actions: MatchAction[]
  teamAName: string
  teamBName: string
}

interface PlayerStats {
  number: number
  position: string
  name: string
  reception: { A: number; B: number; C: number; erro: number }
  serve: { certo: number; erro: number; ace: number }
  attack: { ponto: number; certo: number; erro: number; O: number; P: number; M: number; FS: number }
  block: { O: number; P: number; M: number; FS: number }
  defense: number
  tp: number
  te: number
  tgp: number
}

export default function PlayerStatsSpreadsheet({ actions, teamAName, teamBName }: PlayerStatsSpreadsheetProps) {
  const [playerNames, setPlayerNames] = useState<Record<string, Record<number, string>>>({
    A: {},
    B: {},
  })

  const [playerPositions, setPlayerPositions] = useState<Record<string, Record<number, string>>>({
    A: {},
    B: {},
  })

  const [selectedSet, setSelectedSet] = useState<"all" | number>("all")

  const updatePlayerName = (team: "A" | "B", playerNumber: number, name: string) => {
    setPlayerNames((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerNumber]: name,
      },
    }))
  }

  const updatePlayerPosition = (team: "A" | "B", playerNumber: number, position: string) => {
    setPlayerPositions((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerNumber]: position,
      },
    }))
  }

  const calculatePlayerStats = (team: "A" | "B"): PlayerStats[] => {
    const playerStats: Record<number, PlayerStats> = {}
    const processedReceptionIds = new Set<string>()

    let filteredActions = actions
    if (selectedSet !== "all") {
      const setNumber = selectedSet as number
      // Calculate which actions belong to this set by counting points
      let pointCount = 0
      const setStartIndex = 0
      const setEndIndex = actions.length

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i]
        const servingTeam = action.servingTeam
        const attackingTeam = action.attackingTeam

        // Count points
        if (action.serveQuality === "ka" && servingTeam === "A") pointCount++
        else if (action.serveQuality === "ka" && servingTeam === "B") pointCount++
        else if (action.serveQuality === "-" && servingTeam !== "A") pointCount++
        else if (action.passingQuality === "D" && attackingTeam === team) pointCount++
        else if (action.resultComplemento === "#" && attackingTeam === "A") pointCount++
        else if (action.resultComplemento === "#" && attackingTeam === "B") pointCount++
        else if (action.resultComplemento === "!" && attackingTeam !== "A") pointCount++
        else if (action.resultComplemento === "+" && attackingTeam !== "A") pointCount++
      }

      // Simplified: just use all actions for now, sets filtering would need point tracking
      filteredActions = actions
    }

    let teamTotalPoints = 0
    for (const action of filteredActions) {
      const servingTeam = action.servingTeam
      const attackingTeam = action.attackingTeam

      if (action.serveQuality === "ka" && servingTeam === team) {
        teamTotalPoints++
      }
      if (action.serveQuality === "-" && servingTeam !== team) {
        teamTotalPoints++
      }
      if (action.passingQuality === "D" && attackingTeam === team) {
        teamTotalPoints++
      }
      if (action.resultComplemento === "#" && attackingTeam === team) {
        teamTotalPoints++
      }
      if (action.resultComplemento === "!" && attackingTeam !== team) {
        teamTotalPoints++
      }
      if (action.resultComplemento === "+" && attackingTeam !== team) {
        teamTotalPoints++
      }
    }

    for (const action of filteredActions) {
      const receivingTeam = action.servingTeam === "A" ? "B" : "A"

      if (
        action.passingPlayer &&
        action.passingPlayer > 0 &&
        receivingTeam === team &&
        action.serveQuality && // <-- NOVO: Garante que é uma recepção de saque, não de continuação
        !processedReceptionIds.has(action.id)
      ) {
        processedReceptionIds.add(action.id)

        if (!playerStats[action.passingPlayer]) {
          playerStats[action.passingPlayer] = {
            number: action.passingPlayer,
            position: playerPositions[team]?.[action.passingPlayer] || "",
            name: playerNames[team]?.[action.passingPlayer] || "",
            reception: { A: 0, B: 0, C: 0, erro: 0 },
            serve: { certo: 0, erro: 0, ace: 0 },
            attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
            block: { O: 0, P: 0, M: 0, FS: 0 },
            defense: 0,
            tp: 0,
            te: 0,
            tgp: 0,
          }
        }

        if (action.passingQuality === "A") playerStats[action.passingPlayer].reception.A++
        else if (action.passingQuality === "B") playerStats[action.passingPlayer].reception.B++
        else if (action.passingQuality === "C") playerStats[action.passingPlayer].reception.C++
        else if (action.passingQuality === "D") playerStats[action.passingPlayer].reception.erro++
      }

      if (action.servingTeam === team && action.servingPlayer) {
        if (!playerStats[action.servingPlayer]) {
          playerStats[action.servingPlayer] = {
            number: action.servingPlayer,
            position: playerPositions[team]?.[action.servingPlayer] || "",
            name: playerNames[team]?.[action.servingPlayer] || "",
            reception: { A: 0, B: 0, C: 0, erro: 0 },
            serve: { certo: 0, erro: 0, ace: 0 },
            attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
            block: { O: 0, P: 0, M: 0, FS: 0 },
            defense: 0,
            tp: 0,
            te: 0,
            tgp: 0,
          }
        }

        if (action.serveQuality === "+") playerStats[action.servingPlayer].serve.certo++
        else if (action.serveQuality === "-") playerStats[action.servingPlayer].serve.erro++
        else if (action.serveQuality === "ka") playerStats[action.servingPlayer].serve.ace++
      }

      if (action.actionPlayer && action.actionPlayer > 0 && action.attackingTeam === team) {
        if (!playerStats[action.actionPlayer]) {
          playerStats[action.actionPlayer] = {
            number: action.actionPlayer,
            position: playerPositions[team]?.[action.actionPlayer] || "",
            name: playerNames[team]?.[action.actionPlayer] || "",
            reception: { A: 0, B: 0, C: 0, erro: 0 },
            serve: { certo: 0, erro: 0, ace: 0 },
            attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
            block: { O: 0, P: 0, M: 0, FS: 0 },
            defense: 0,
            tp: 0,
            te: 0,
            tgp: 0,
          }
        }

        // Distribuição por posição de ataque
        if (action.attackPosition === "O") playerStats[action.actionPlayer].attack.O++
        else if (action.attackPosition === "P") playerStats[action.actionPlayer].attack.P++
        else if (action.attackPosition === "M") playerStats[action.actionPlayer].attack.M++
        else if (action.attackPosition === "F" || action.attackPosition === "S")
          playerStats[action.actionPlayer].attack.FS++

        console.log(
          "[v0] Processing attack - Player:",
          action.actionPlayer,
          "Team:",
          action.attackingTeam,
          "DefensivePlayer:",
          action.defensivePlayer,
          "ResultComplemento:",
          action.resultComplemento,
        )

        // Ataque Certo: quando há defesa (resultComplemento === "D")
        if (action.resultComplemento === "D") {
          console.log("[v0] Counting attack certo for player", action.actionPlayer, "on team", team)
          playerStats[action.actionPlayer].attack.certo++
        }

        // Ataque Ponto: quando resultComplemento === "#"
        if (action.resultComplemento === "#") {
          console.log("[v0] Counting attack ponto for player", action.actionPlayer, "on team", team)
          playerStats[action.actionPlayer].attack.ponto++
        } else if (action.resultComplemento === "!") {
          playerStats[action.actionPlayer].attack.erro++
        } else if (action.resultComplemento === "+") {
          playerStats[action.actionPlayer].attack.erro++
        }
      }

      if (action.blockingPlayer && action.blockingPlayer > 0) {
        const blockingTeam = action.attackingTeam === "A" ? "B" : "A"
        if (blockingTeam === team) {
          if (!playerStats[action.blockingPlayer]) {
            playerStats[action.blockingPlayer] = {
              number: action.blockingPlayer,
              position: playerPositions[team]?.[action.blockingPlayer] || "",
              name: playerNames[team]?.[action.blockingPlayer] || "",
              reception: { A: 0, B: 0, C: 0, erro: 0 },
              serve: { certo: 0, erro: 0, ace: 0 },
              attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
              block: { O: 0, P: 0, M: 0, FS: 0 },
              defense: 0,
              tp: 0,
              te: 0,
              tgp: 0,
            }
          }

          // Bloqueio na posição do ataque contrário
          if (action.attackPosition === "O") playerStats[action.blockingPlayer].block.O++
          else if (action.attackPosition === "P") playerStats[action.blockingPlayer].block.P++
          else if (action.attackPosition === "M") playerStats[action.blockingPlayer].block.M++
          else if (action.attackPosition === "F" || action.attackPosition === "S")
            playerStats[action.blockingPlayer].block.FS++
        }
      }

      if (action.defensivePlayer && action.defensivePlayer > 0) {
        const defenseTeam = action.attackingTeam === "A" ? "B" : "A"
        if (defenseTeam === team) {
          if (!playerStats[action.defensivePlayer]) {
            playerStats[action.defensivePlayer] = {
              number: action.defensivePlayer,
              position: playerPositions[defenseTeam]?.[action.defensivePlayer] || "",
              name: playerNames[defenseTeam]?.[action.defensivePlayer] || "",
              reception: { A: 0, B: 0, C: 0, erro: 0 },
              serve: { certo: 0, erro: 0, ace: 0 },
              attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
              block: { O: 0, P: 0, M: 0, FS: 0 },
              defense: 0,
              tp: 0,
              te: 0,
              tgp: 0,
            }
          }
          playerStats[action.defensivePlayer].defense++
        }
      }
    }

    const result = Object.values(playerStats).map((stat) => {
      // Reception: A + B + C (but NOT erro)
      const totalReceptionCorrect = stat.reception.A + stat.reception.B + stat.reception.C
      // Serve: certo + ace (but NOT erro)
      const totalServeCorrect = stat.serve.certo + stat.serve.ace
      // Attack: ponto + certo (but NOT erro)
      const totalAttackCorrect = stat.attack.ponto + stat.attack.certo
      // Block: all blocks count (no errors in blocks)
      const totalBlock = stat.block.O + stat.block.P + stat.block.M + stat.block.FS

      stat.tp = totalReceptionCorrect + totalServeCorrect + totalAttackCorrect + totalBlock + stat.defense

      stat.te = stat.reception.erro + stat.serve.erro + stat.attack.erro

      stat.tgp = stat.tp > 0 ? Math.round((stat.tp / teamTotalPoints) * 100) : 0

      return stat
    })

    return result.sort((a, b) => a.number - b.number)
  }

  const exportTeamToPDF = async (team: "A" | "B") => {
    const doc = new jsPDF({ orientation: "landscape" })
    const stats = calculatePlayerStats(team)
    const teamName = team === "A" ? teamAName : teamBName

    doc.setFontSize(16)
    doc.text(`${teamAName} vs ${teamBName}`, 14, 10)
    doc.setFontSize(12)
    doc.text(teamName, 14, 17)

    const tableData = stats.map((stat) => [
      stat.number,
      stat.position,
      stat.name || `Jogador ${stat.number}`,
      stat.reception.A,
      stat.reception.B,
      stat.reception.C,
      stat.reception.erro,
      stat.serve.certo,
      stat.serve.erro,
      stat.serve.ace,
      stat.attack.ponto,
      stat.attack.certo,
      stat.attack.erro,
      stat.attack.O,
      stat.attack.P,
      stat.attack.M,
      stat.attack.FS,
      stat.block.O,
      stat.block.P,
      stat.block.M,
      stat.block.FS,
      stat.defense,
      stat.tp,
      stat.te,
      `${stat.tgp}%`,
    ])

    autoTable(doc, {
      startY: 22,
      head: [
        [
          { content: "Nº", rowSpan: 2 },
          { content: "P#", rowSpan: 2 },
          { content: "NOME", rowSpan: 2 },
          { content: "RECEPÇÃO", colSpan: 4 },
          { content: "SAQUE", colSpan: 3 },
          { content: "ATAQUE", colSpan: 7 },
          { content: "BLOQUEIO", colSpan: 4 },
          { content: "DEFESA", rowSpan: 2 },
          { content: "TP", rowSpan: 2 },
          { content: "TE", rowSpan: 2 },
          { content: "TGP", rowSpan: 2 },
        ],
        ["A", "B", "C", "ERRO", "CERTO", "ERRO", "ACE", "PONTO", "CERTO", "ERRO", "O", "P", "M", "F/S", "O", "P", "M", "F/S"],
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 8,
        halign: 'center',
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
    })

    doc.save(`${teamName}_stats.pdf`)
  }

  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: "landscape" })

    doc.setFontSize(16)
    doc.text(`${teamAName} vs ${teamBName}`, 14, 10)
    
    const statsA = calculatePlayerStats("A")
    doc.setFontSize(12)
    doc.text(teamAName, 14, 17)

    const tableDataA = statsA.map((stat) => [
      stat.number,
      stat.position,
      stat.name || `Jogador ${stat.number}`,
      stat.reception.A,
      stat.reception.B,
      stat.reception.C,
      stat.reception.erro,
      stat.serve.certo,
      stat.serve.erro,
      stat.serve.ace,
      stat.attack.ponto,
      stat.attack.certo,
      stat.attack.erro,
      stat.attack.O,
      stat.attack.P,
      stat.attack.M,
      stat.attack.FS,
      stat.block.O,
      stat.block.P,
      stat.block.M,
      stat.block.FS,
      stat.defense,
      stat.tp,
      stat.te,
      `${stat.tgp}%`,
    ])

    autoTable(doc, {
      startY: 22,
      head: [
        [
          { content: "Nº", rowSpan: 2 },
          { content: "P#", rowSpan: 2 },
          { content: "NOME", rowSpan: 2 },
          { content: "RECEPÇÃO", colSpan: 4 },
          { content: "SAQUE", colSpan: 3 },
          { content: "ATAQUE", colSpan: 7 },
          { content: "BLOQUEIO", colSpan: 4 },
          { content: "DEFESA", rowSpan: 2 },
          { content: "TP", rowSpan: 2 },
          { content: "TE", rowSpan: 2 },
          { content: "TGP", rowSpan: 2 },
        ],
        ["A", "B", "C", "ERRO", "CERTO", "ERRO", "ACE", "PONTO", "CERTO", "ERRO", "O", "P", "M", "F/S", "O", "P", "M", "F/S"],
      ],
      body: tableDataA,
      theme: "grid",
      styles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 8,
        halign: 'center',
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
    })

    const statsB = calculatePlayerStats("B")
    doc.addPage()
    doc.setFontSize(16)
    doc.text(`${teamAName} vs ${teamBName}`, 14, 10)
    doc.setFontSize(12)
    doc.text(teamBName, 14, 17)

    const tableDataB = statsB.map((stat) => [
      stat.number,
      stat.position,
      stat.name || `Jogador ${stat.number}`,
      stat.reception.A,
      stat.reception.B,
      stat.reception.C,
      stat.reception.erro,
      stat.serve.certo,
      stat.serve.erro,
      stat.serve.ace,
      stat.attack.ponto,
      stat.attack.certo,
      stat.attack.erro,
      stat.attack.O,
      stat.attack.P,
      stat.attack.M,
      stat.attack.FS,
      stat.block.O,
      stat.block.P,
      stat.block.M,
      stat.block.FS,
      stat.defense,
      stat.tp,
      stat.te,
      `${stat.tgp}%`,
    ])

    autoTable(doc, {
      startY: 22,
      head: [
        [
          { content: "Nº", rowSpan: 2 },
          { content: "P#", rowSpan: 2 },
          { content: "NOME", rowSpan: 2 },
          { content: "RECEPÇÃO", colSpan: 4 },
          { content: "SAQUE", colSpan: 3 },
          { content: "ATAQUE", colSpan: 7 },
          { content: "BLOQUEIO", colSpan: 4 },
          { content: "DEFESA", rowSpan: 2 },
          { content: "TP", rowSpan: 2 },
          { content: "TE", rowSpan: 2 },
          { content: "TGP", rowSpan: 2 },
        ],
        ["A", "B", "C", "ERRO", "CERTO", "ERRO", "ACE", "PONTO", "CERTO", "ERRO", "O", "P", "M", "F/S", "O", "P", "M", "F/S"],
      ],
      body: tableDataB,
      theme: "grid",
      styles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 8,
        halign: 'center',
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
    })

    doc.save(`${teamAName}_vs_${teamBName}_stats.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  const renderTeamTable = (team: "A" | "B", teamName: string) => {
    const stats = calculatePlayerStats(team)
    const bgColor = team === "A" ? "bg-blue-50" : "bg-red-50"
    const headerColor = team === "A" ? "bg-blue-600" : "bg-red-600"
    const teamClass = team === "B" ? "team-b" : ""

    const totals = stats.reduce(
      (acc, stat) => ({
        reception: {
          A: acc.reception.A + stat.reception.A,
          B: acc.reception.B + stat.reception.B,
          C: acc.reception.C + stat.reception.C,
          erro: acc.reception.erro + stat.reception.erro,
        },
        serve: {
          certo: acc.serve.certo + stat.serve.certo,
          erro: acc.serve.erro + stat.serve.erro,
          ace: acc.serve.ace + stat.serve.ace,
        },
        attack: {
          ponto: acc.attack.ponto + stat.attack.ponto,
          certo: acc.attack.certo + stat.attack.certo,
          erro: acc.attack.erro + stat.attack.erro,
          O: acc.attack.O + stat.attack.O,
          P: acc.attack.P + stat.attack.P,
          M: acc.attack.M + stat.attack.M,
          FS: acc.attack.FS + stat.attack.FS,
        },
        block: {
          O: acc.block.O + stat.block.O,
          P: acc.block.P + stat.block.P,
          M: acc.block.M + stat.block.M,
          FS: acc.block.FS + stat.block.FS,
        },
        defense: acc.defense + stat.defense,
        tp: acc.tp + stat.tp,
        te: acc.te + stat.te,
      }),
      {
        reception: { A: 0, B: 0, C: 0, erro: 0 },
        serve: { certo: 0, erro: 0, ace: 0 },
        attack: { ponto: 0, certo: 0, erro: 0, O: 0, P: 0, M: 0, FS: 0 },
        block: { O: 0, P: 0, M: 0, FS: 0 },
        defense: 0,
        tp: 0,
        te: 0,
      },
    )

    return (
      <Card className={`p-4 ${bgColor}`}>
        <h2 className={`text-xl font-bold mb-3 team-title`}>{teamName}</h2>
        <div className="overflow-x-auto">
          <table className={`w-full text-xs border-collapse ${teamClass}`}>
            <thead>
              <tr className={`${headerColor} text-white`}>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  Nº
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  P#
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  NOME
                </th>
                <th className="border border-gray-300 p-1" colSpan={4}>
                  RECEPÇÃO
                </th>
                <th className="border border-gray-300 p-1" colSpan={3}>
                  SAQUE
                </th>
                <th className="border border-gray-300 p-1" colSpan={7}>
                  ATAQUE
                </th>
                <th className="border border-gray-300 p-1" colSpan={4}>
                  BLOQUEIO
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  DEFESA
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  TP
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  TE
                </th>
                <th className="border border-gray-300 p-1" rowSpan={2}>
                  TGP
                </th>
              </tr>
              <tr className={`${headerColor} text-white`}>
                <th className="border border-gray-300 p-1">A</th>
                <th className="border border-gray-300 p-1">B</th>
                <th className="border border-gray-300 p-1">C</th>
                <th className="border border-gray-300 p-1">ERRO</th>
                <th className="border border-gray-300 p-1">CERTO</th>
                <th className="border border-gray-300 p-1">ERRO</th>
                <th className="border border-gray-300 p-1">ACE</th>
                <th className="border border-gray-300 p-1">PONTO</th>
                <th className="border border-gray-300 p-1">CERTO</th>
                <th className="border border-gray-300 p-1">ERRO</th>
                <th className="border border-gray-300 p-1">O</th>
                <th className="border border-gray-300 p-1">P</th>
                <th className="border border-gray-300 p-1">M</th>
                <th className="border border-gray-300 p-1">F/S</th>
                <th className="border border-gray-300 p-1">O</th>
                <th className="border border-gray-300 p-1">P</th>
                <th className="border border-gray-300 p-1">M</th>
                <th className="border border-gray-300 p-1">F/S</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.number} className="hover:bg-white/50">
                  <td className="border border-gray-300 p-1 text-center font-bold">{stat.number}</td>
                  <td className="border border-gray-300 p-1 text-center">
                    <input
                      type="text"
                      value={playerPositions[team]?.[stat.number] || stat.position || ""}
                      onChange={(e) => updatePlayerPosition(team, stat.number, e.target.value)}
                      className="w-8 text-center border-0 bg-transparent"
                      placeholder="-"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={stat.name}
                      onChange={(e) => updatePlayerName(team, stat.number, e.target.value)}
                      placeholder="Nome do atleta"
                      className="w-full border-0 bg-transparent px-1"
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-center">{stat.reception.A}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.reception.B}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.reception.C}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.reception.erro}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.serve.certo}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.serve.erro}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.serve.ace}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.ponto}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.certo}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.erro}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.O}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.P}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.M}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.attack.FS}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.block.O}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.block.P}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.block.M}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.block.FS}</td>
                  <td className="border border-gray-300 p-1 text-center">{stat.defense}</td>
                  <td className="border border-gray-300 p-1 text-center font-bold">{stat.tp}</td>
                  <td className="border border-gray-300 p-1 text-center font-bold">{stat.te}</td>
                  <td className="border border-gray-300 p-1 text-center font-bold bg-yellow-200">{stat.tgp}%</td>
                </tr>
              ))}
              <tr className="bg-yellow-100 font-bold">
                <td className="border border-gray-300 p-1 text-center" colSpan={3}>
                  RESULTADO GERAL
                </td>
                <td className="border border-gray-300 p-1 text-center">{totals.reception.A}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.reception.B}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.reception.C}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.reception.erro}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.serve.certo}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.serve.erro}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.serve.ace}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.ponto}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.certo}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.erro}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.O}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.P}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.M}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.attack.FS}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.block.O}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.block.P}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.block.M}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.block.FS}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.defense}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.tp}</td>
                <td className="border border-gray-300 p-1 text-center">{totals.te}</td>
                <td className="border border-gray-300 p-1 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex gap-2 px-4 py-2">
        <Button onClick={() => setSelectedSet("all")} variant={selectedSet === "all" ? "default" : "outline"} size="sm">
          Todos os Sets
        </Button>
        {[1, 2, 3, 4, 5].map((setNum) => (
          <Button
            key={setNum}
            onClick={() => setSelectedSet(setNum)}
            variant={selectedSet === setNum ? "default" : "outline"}
            size="sm"
          >
            Set {setNum}
          </Button>
        ))}
      </div>

      <div className="flex justify-end px-4 gap-2 no-print">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Ambos
        </Button>
        <Button onClick={() => exportTeamToPDF("A")} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          PDF {teamAName}
        </Button>
        <Button onClick={() => exportTeamToPDF("B")} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          PDF {teamBName}
        </Button>
        <Button onClick={exportToPDF} className="gap-2">
          <Download className="w-4 h-4" />
          PDF Ambos
        </Button>
      </div>

      <div id="spreadsheet-content">
        {renderTeamTable("A", teamAName)}
        {renderTeamTable("B", teamBName)}
      </div>
    </div>
  )
}
