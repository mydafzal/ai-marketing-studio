// This is a regex-based find and replace script for the UserMesssageSubmitter.tsx file
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (\!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Update import paths for the budget setter
content = content.replace(
  /(await import\(['"]@\/components\/stocks\/set-budget\/server['"]\))\.default/g, 
  "(await import('@/components/stocks/set-budget')).default"
);

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
