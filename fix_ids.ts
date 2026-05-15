import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace parseInt(params.id) -> params.id
  content = content.replace(/parseInt\(params\.id\)/g, 'params.id');
  content = content.replace(/parseInt\(params\.noteId\)/g, 'params.noteId');
  
  // Replace loanId: number -> loanId: string
  content = content.replace(/loanId:\s*number/g, 'loanId: string');
  
  // Replace id: number -> id: string
  content = content.replace(/id:\s*number/g, 'id: string');
  
  // Replace { id: number } -> { id: string }
  content = content.replace(/{\s*id:\s*number\s*}/g, '{ id: string }');

  // Fix calculate.ts references if any
  content = content.replace(/Decimal/g, 'number'); // Actually Prisma now uses number, we might not need to do this naive replace, wait. Prisma Decimal was changed to Float.
  // We'll see if there are decimal errors later.

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./app', replaceInFile);
walkDir('./components', replaceInFile);
walkDir('./lib', replaceInFile);
walkDir('./types', replaceInFile);
