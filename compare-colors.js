const fs = require('fs');
const path = require('path');

const dir1 = 'c:\\Users\\filip\\Downloads\\scout-volleyball\\components';
const dir2 = 'c:\\Users\\filip\\Downloads\\scout-volleyball\\web version\\components';

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files1 = getFiles(dir1);

const colorRegex = /\b(text|bg|border|ring|from|to|via|fill|stroke)-(white|black|transparent|current|[a-z]+-\d{2,3}(?:\/\d{2})?)\b/g;

function extractColors(text) {
  const matches = [...text.matchAll(colorRegex)];
  return matches.map(m => m[0]);
}

const colorDiffs = {};

for (const file1 of files1) {
  const relPath = path.relative(dir1, file1);
  const file2 = path.join(dir2, relPath);
  
  if (fs.existsSync(file2)) {
    const content1 = fs.readFileSync(file1, 'utf-8');
    const content2 = fs.readFileSync(file2, 'utf-8');
    
    const colors1 = extractColors(content1);
    const colors2 = extractColors(content2);
    
    const counts1 = {};
    for (const c of colors1) counts1[c] = (counts1[c] || 0) + 1;
    
    const counts2 = {};
    for (const c of colors2) counts2[c] = (counts2[c] || 0) + 1;
    
    const diff = [];
    const allColors = new Set([...Object.keys(counts1), ...Object.keys(counts2)]);
    
    for (const c of allColors) {
      const c1 = counts1[c] || 0;
      const c2 = counts2[c] || 0;
      if (c1 !== c2) {
        diff.push(`  - ${c}: App=${c1}, Web=${c2}`);
      }
    }
    
    if (diff.length > 0) {
      colorDiffs[relPath] = diff;
    }
  }
}

let result = "";
if (Object.keys(colorDiffs).length === 0) {
  result = "No color differences found.";
} else {
  result += "Diferenças de cores entre componentes do App e Web Version:\n\n";
  for (const [file, diffs] of Object.entries(colorDiffs)) {
    result += `Arquivo: ${file}\n`;
    result += diffs.join('\n') + "\n\n";
  }
}

fs.writeFileSync('compare-colors-output.txt', result, 'utf8');
console.log('Done');
