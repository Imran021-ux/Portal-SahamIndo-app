const fs = require('fs');
const content = fs.readFileSync('src/components/EmitenDashboardView.tsx', 'utf8');

let curly = 0;
let paren = 0;
let openDivs = 0;
let closeDivs = 0;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // count curly braces
  for (let c of line) {
    if (c === '{') curly++;
    if (c === '}') curly--;
    if (c === '(') paren++;
    if (c === ')') paren--;
  }
  
  // count simple div tags
  const openMatch = line.match(/<div/g);
  if (openMatch) openDivs += openMatch.length;
  const closeMatch = line.match(/<\/div/g);
  if (closeMatch) closeDivs += closeMatch.length;
}

console.log('Bracket & Div analysis of EmitenDashboardView.tsx:');
console.log('curly balance:', curly);
console.log('paren balance:', paren);
console.log('open divs:', openDivs);
console.log('close divs:', closeDivs);
console.log('div balance (open - close):', openDivs - closeDivs);
