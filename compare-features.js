const fs = require('fs');
const path = require('path');

const appDir = 'c:\\Users\\filip\\Downloads\\scout-volleyball';
const webDir = 'c:\\Users\\filip\\Downloads\\scout-volleyball\\web version';

function getFiles(dir, baseDir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'web version') continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, baseDir, fileList);
    } else {
      fileList.push(path.relative(baseDir, fullPath));
    }
  }
  return fileList;
}

const appFiles = new Set(getFiles(appDir, appDir));
const webFiles = getFiles(webDir, webDir);

const missingInApp = [];
for (const file of webFiles) {
  if (!appFiles.has(file)) {
    missingInApp.push(file);
  }
}

let result = "Arquivos e Funcionalidades presentes no Web Version, mas AUSENTES no App:\n\n";

const missingComponents = missingInApp.filter(f => f.startsWith('components')).sort();
const missingLib = missingInApp.filter(f => f.startsWith('lib')).sort();
const missingApp = missingInApp.filter(f => f.startsWith('app')).sort();
const missingOther = missingInApp.filter(f => !f.startsWith('components') && !f.startsWith('lib') && !f.startsWith('app')).sort();

if (missingComponents.length > 0) {
  result += "### Componentes (components/)\n" + missingComponents.map(f => `- ${f}`).join('\n') + "\n\n";
}
if (missingLib.length > 0) {
  result += "### Bibliotecas e Lógicas (lib/)\n" + missingLib.map(f => `- ${f}`).join('\n') + "\n\n";
}
if (missingApp.length > 0) {
  result += "### Páginas e Rotas (app/)\n" + missingApp.map(f => `- ${f}`).join('\n') + "\n\n";
}
if (missingOther.length > 0) {
  result += "### Outros\n" + missingOther.map(f => `- ${f}`).join('\n') + "\n\n";
}

if (missingInApp.length === 0) {
  result = "Nenhuma diferença de arquivos encontrada! O app tem todos os arquivos que o Web Version possui.";
}

fs.writeFileSync('missing_features_report.txt', result, 'utf8');
console.log(`Found ${missingInApp.length} missing files.`);
