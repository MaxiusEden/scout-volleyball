import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Função auxiliar para download no navegador
function downloadInBrowser(filename: string, dataBase64: string, mimeType: string) {
  console.log('[DEBUG] Downloading in browser', { filename });
  const blob = new Blob([Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0))], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert(`Arquivo ${filename} baixado com sucesso!`);
}

// --- FUNÇÃO AUXILIAR: Salva arquivo diretamente (sem compartilhar) ---
async function saveFileDirectly(filename: string, dataBase64: string, mimeType: string) {
  console.log('[DEBUG] saveFileDirectly called', { filename, dataLength: dataBase64.length, mimeType });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:23',message:'saveFileDirectly called',data:{filename,dataLength:dataBase64.length,mimeType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Tentar usar Capacitor primeiro (funciona em nativo e web com fallback automático)
  try {
    console.log('[DEBUG] Attempting to use Capacitor Filesystem');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:35',message:'using Capacitor native',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.log('[DEBUG] Checking permissions');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:40',message:'checking permissions',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Verificar permissões antes de salvar (opcional - se falhar, continua mesmo assim)
    try {
      if (typeof Filesystem.checkPermissions === 'function') {
        const permStatus = await Filesystem.checkPermissions();
        console.log('[DEBUG] Permission status', permStatus);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:48',message:'permission check result',data:{filename,publicStorage:permStatus.publicStorage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (permStatus.publicStorage !== 'granted') {
          console.log('[DEBUG] Requesting permissions');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:52',message:'requesting permissions',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (typeof Filesystem.requestPermissions === 'function') {
            const request = await Filesystem.requestPermissions();
            console.log('[DEBUG] Permission request result', request);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:56',message:'permission request result',data:{filename,publicStorage:request.publicStorage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (request.publicStorage !== 'granted') {
              console.log('[DEBUG] Permission denied, using browser fallback');
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:60',message:'permission denied',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              downloadInBrowser(filename, dataBase64, mimeType);
              return;
            }
          }
        }
      } else {
        console.log('[DEBUG] checkPermissions not available, skipping permission check');
      }
    } catch (permError) {
      console.warn('[DEBUG] Permission check error (continuing anyway)', permError);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:71',message:'permission check error',data:{filename,error:String(permError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Continua mesmo se a verificação de permissões falhar
    }

    console.log('[DEBUG] Writing file to Documents directory');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:70',message:'writing file to Documents',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Salva o arquivo diretamente na pasta Documents (não no cache)
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataBase64,
      directory: Directory.Documents,
      recursive: true,
    });
    console.log('[DEBUG] File written to Documents', result.uri);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:78',message:'file written successfully to Documents',data:{filename,uri:result.uri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    alert(`Arquivo ${filename} salvo com sucesso na pasta Documentos!`);
  } catch (error) {
    console.error('[DEBUG] saveFileDirectly error', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:82',message:'saveFileDirectly error',data:{filename,error:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error("Erro ao salvar arquivo:", error);
    // Se falhar no nativo, tentar fallback do navegador
    console.log('[DEBUG] Falling back to browser download');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:87',message:'using browser fallback',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    downloadInBrowser(filename, dataBase64, mimeType);
  }
}

// --- FUNÇÃO AUXILIAR: Salva e Abre o Compartilhamento Nativo (para PDFs que querem compartilhar) ---
async function saveAndShareFile(filename: string, dataBase64: string, mimeType: string) {
  console.log('[DEBUG] saveAndShareFile called', { filename, dataLength: dataBase64.length, mimeType });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:95',message:'saveAndShareFile called',data:{filename,dataLength:dataBase64.length,mimeType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Tentar usar Capacitor primeiro (funciona em nativo e web com fallback automático)
  try {
    console.log('[DEBUG] Attempting to use Capacitor Filesystem');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:100',message:'using Capacitor native',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.log('[DEBUG] Checking permissions');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:103',message:'checking permissions',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Verificar permissões antes de salvar (opcional - se falhar, continua mesmo assim)
    try {
      if (typeof Filesystem.checkPermissions === 'function') {
        const permStatus = await Filesystem.checkPermissions();
        console.log('[DEBUG] Permission status', permStatus);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:109',message:'permission check result',data:{filename,publicStorage:permStatus.publicStorage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (permStatus.publicStorage !== 'granted') {
          console.log('[DEBUG] Requesting permissions');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:113',message:'requesting permissions',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (typeof Filesystem.requestPermissions === 'function') {
            const request = await Filesystem.requestPermissions();
            console.log('[DEBUG] Permission request result', request);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:117',message:'permission request result',data:{filename,publicStorage:request.publicStorage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (request.publicStorage !== 'granted') {
              console.log('[DEBUG] Permission denied, using browser fallback');
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:121',message:'permission denied',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              downloadInBrowser(filename, dataBase64, mimeType);
              return;
            }
          }
        }
      } else {
        console.log('[DEBUG] checkPermissions not available, skipping permission check');
      }
    } catch (permError) {
      console.warn('[DEBUG] Permission check error (continuing anyway)', permError);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:132',message:'permission check error',data:{filename,error:String(permError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Continua mesmo se a verificação de permissões falhar
    }

    console.log('[DEBUG] Writing file to cache for sharing');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:138',message:'writing file to cache',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // 1. Salva o arquivo no cache do celular (para compartilhar)
    const result = await Filesystem.writeFile({
      path: filename,
      data: dataBase64,
      directory: Directory.Cache,
    });
    console.log('[DEBUG] File written to cache', result.uri);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:146',message:'file written successfully to cache',data:{filename,uri:result.uri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    console.log('[DEBUG] Sharing file');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:150',message:'sharing file',data:{filename,uri:result.uri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // 2. Abre o menu de compartilhar (WhatsApp, Email, Drive, etc)
    await Share.share({
      title: `Relatório: ${filename}`,
      url: result.uri,
      dialogTitle: 'Compartilhar Relatório',
    });
    console.log('[DEBUG] Share completed');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:158',message:'share completed',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    console.error('[DEBUG] saveAndShareFile error', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:162',message:'saveAndShareFile error',data:{filename,error:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Se o erro for "Share canceled", não fazer fallback (usuário cancelou intencionalmente)
    if (error?.message === 'Share canceled') {
      console.log('[DEBUG] Share was canceled by user, not falling back');
      return;
    }
    console.error("Erro ao exportar:", error);
    // Se falhar no nativo, tentar fallback do navegador
    console.log('[DEBUG] Falling back to browser download');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:171',message:'using browser fallback',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    downloadInBrowser(filename, dataBase64, mimeType);
  }
}

// --- GERADOR DE PDF ---
export async function generatePDF(matchData: any, stats: any, sets: any[], type: 'A' | 'B' | 'BOTH') {
  console.log('[DEBUG] generatePDF called', { type, hasMatchData: !!matchData, hasStats: !!stats, hasSets: !!sets, teamA: matchData?.teamAName, teamB: matchData?.teamBName });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:104',message:'generatePDF called',data:{type,hasMatchData:!!matchData,hasStats:!!stats,hasSets:!!sets,teamA:matchData?.teamAName,teamB:matchData?.teamBName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    console.log('[DEBUG] Creating jsPDF');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:108',message:'creating jsPDF',data:{type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const doc = new jsPDF();
    const teamA = matchData.teamAName;
    const teamB = matchData.teamBName;
  
  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Relatório de Partida - Scout Volleyball", 14, 15);
  
  doc.setFontSize(12);
  doc.text(`${teamA} vs ${teamB}`, 14, 25);
  doc.text(`Data: ${new Date(matchData.startTime).toLocaleDateString('pt-BR')}`, 14, 32);
  // Calcular vencedor se não estiver definido
  const winner = matchData.winner || (sets.filter((s) => s.winner === "A").length >= 3 ? "A" : "B");
  doc.text(`Vencedor: ${winner === 'A' ? teamA : teamB}`, 14, 39);

  // Tabela de Sets
  let setRows = sets.map((s, i) => [`Set ${i+1}`, `${s.teamAScore} x ${s.teamBScore}`, s.winner === 'A' ? teamA : teamB]);
  autoTable(doc, {
    startY: 45,
    head: [['Set', 'Placar', 'Vencedor']],
    body: setRows,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] }
  });

  // Função para adicionar dados de um time
  const addTeamStats = (teamName: string, s: any, startY: number) => {
    doc.text(`Estatísticas: ${teamName}`, 14, startY);
    
    const rows = [
        ['Fundamento', 'Total', 'Detalhes'],
        ['Saque', s.serves.correct + s.serves.errors + s.serves.aces, `Aces: ${s.serves.aces} | Erros: ${s.serves.errors}`],
        ['Recepção', s.reception.qualityA + s.reception.qualityB + s.reception.qualityC + s.reception.errors, `Perfeita (A): ${s.reception.qualityA} | Erros: ${s.reception.errors}`],
        ['Ataque', s.attacks.successful + s.attacks.errors + s.attacks.blocked, `Pontos: ${s.attacks.successful} | Erros: ${s.attacks.errors} | Bloqueados: ${s.attacks.blocked}`],
        ['Bloqueio', s.blocks.successful, `Pontos de Bloqueio: ${s.blocks.successful}`],
        ['Pontos Totais', s.points, '-']
    ];

    autoTable(doc, {
        startY: startY + 5,
        head: [['Fundamento', 'Qtd', 'Detalhes']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    return (doc as any).lastAutoTable.finalY + 15;
  };

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  if (type === 'A' || type === 'BOTH') {
      currentY = addTeamStats(teamA, stats.statsA, currentY);
  }
  if (type === 'B' || type === 'BOTH') {
      currentY = addTeamStats(teamB, stats.statsB, currentY);
  }

    console.log('[DEBUG] Generating PDF base64');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:169',message:'generating PDF base64',data:{type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Salvar
    const base64 = doc.output('datauristring').split(',')[1];
    console.log('[DEBUG] PDF base64 generated, length:', base64.length);
    console.log('[DEBUG] Calling saveFileDirectly');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:296',message:'calling saveFileDirectly',data:{type,base64Length:base64.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await saveFileDirectly(`Relatorio_${type}_${Date.now()}.pdf`, base64, 'application/pdf');
    console.log('[DEBUG] generatePDF completed');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:178',message:'generatePDF completed',data:{type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    console.error('[DEBUG] generatePDF error', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export-utils.ts:182',message:'generatePDF error',data:{type,error:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}

// --- GERADOR DE EXCEL ---
export async function generateExcel(matchData: any, stats: any, sets: any[]) {
  const wb = XLSX.utils.book_new();
  
  // Dados Gerais
  const generalData = [
    ["Relatório de Partida", "", "", ""],
    ["Data", new Date(matchData.startTime).toLocaleDateString('pt-BR')],
    ["Equipe A", matchData.teamAName],
    ["Equipe B", matchData.teamBName],
    ["Vencedor", (matchData.winner || (sets.filter((s) => s.winner === "A").length >= 3 ? "A" : "B")) === 'A' ? matchData.teamAName : matchData.teamBName],
    [],
    ["SETS", "Placar A", "Placar B", "Vencedor"],
    ...sets.map((s, i) => [`Set ${i+1}`, s.teamAScore, s.teamBScore, s.winner === 'A' ? matchData.teamAName : matchData.teamBName]),
    [],
    ["ESTATÍSTICAS POR FUNDAMENTO"],
    ["Time", "Fundamento", "Total", "Detalhes (Aces/Pontos/Perf)", "Erros"],
    [matchData.teamAName, "Saque", stats.statsA.serves.correct + stats.statsA.serves.errors + stats.statsA.serves.aces, stats.statsA.serves.aces, stats.statsA.serves.errors],
    [matchData.teamAName, "Recepção", stats.statsA.reception.qualityA + stats.statsA.reception.errors, stats.statsA.reception.qualityA, stats.statsA.reception.errors],
    [matchData.teamAName, "Ataque", stats.statsA.attacks.successful + stats.statsA.attacks.errors, stats.statsA.attacks.successful, stats.statsA.attacks.errors],
    [matchData.teamAName, "Bloqueio", stats.statsA.blocks.successful, stats.statsA.blocks.successful, 0],
    [],
    [matchData.teamBName, "Saque", stats.statsB.serves.correct + stats.statsB.serves.errors + stats.statsB.serves.aces, stats.statsB.serves.aces, stats.statsB.serves.errors],
    [matchData.teamBName, "Recepção", stats.statsB.reception.qualityA + stats.statsB.reception.errors, stats.statsB.reception.qualityA, stats.statsB.reception.errors],
    [matchData.teamBName, "Ataque", stats.statsB.attacks.successful + stats.statsB.attacks.errors, stats.statsB.attacks.successful, stats.statsB.attacks.errors],
    [matchData.teamBName, "Bloqueio", stats.statsB.blocks.successful, stats.statsB.blocks.successful, 0],
  ];

  const ws = XLSX.utils.aoa_to_sheet(generalData);
  XLSX.utils.book_append_sheet(wb, ws, "Resumo");

  // Gera base64
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  
  // Para Excel, salvar diretamente (não compartilhar)
  await saveFileDirectly(`Scout_Excel_${Date.now()}.xlsx`, wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}