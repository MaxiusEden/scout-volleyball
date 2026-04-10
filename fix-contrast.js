const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\filip\\Downloads\\scout-volleyball\\components';

function getFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) return fileList;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const stat = fs.statSync(path.join(dirPath, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dirPath, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(path.join(dirPath, file));
    }
  }
  return fileList;
}

const files = getFiles(dir);

// Dark backgrounds to check for
const darkBgRegex = /\b(bg-(blue|red|green|orange|amber|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-(500|600|700|800|900|950)|bg-slate-(600|700|800|900|950)|bg-black|bg-destructive|from-(slate|blue|red|green|purple|indigo)-(600|700|800|900)|bg-gradient-to-[a-z]+)\b/;

let updatedFilesCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // We need to look at className strings.
  // Match className="..." or className={`...`}
  // We'll use a replacer function on the whole file that looks for text-black 
  // and checks if the surrounding className contains a dark background.

  // A simpler approach: find all occurrences of 'text-black'. 
  // For each occurrence, look at the text around it (e.g., within the same line or within quotes).
  // Actually, let's match the contents of className="..." or className={`...`}
  
  const classNameRegex = /className=(["'`])(?:(?=(\\?))\2.)*?\1|className=\{`[^`]*`\}/gs;
  
  content = content.replace(classNameRegex, (match) => {
    if (match.includes('text-black')) {
      // Check if this className contains a dark background or dynamic color variables like ${color} or ${bgGradient} or ${headerColor}
      if (darkBgRegex.test(match) || match.includes('${color}') || match.includes('${bgGradient}') || match.includes('${headerColor}') || match.includes('${teamColor}')) {
        return match.replace(/\btext-black\b/g, 'text-white');
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated contrast in: ${path.relative(dir, file)}`);
    updatedFilesCount++;
  }
}

console.log(`Finished fixing contrast. Updated ${updatedFilesCount} files.`);
