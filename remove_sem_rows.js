const fs = require('fs');
const path = require('path');

const filePath = path.join('frontend', 'public', 'data', 'dashboard-data.csv');

try {
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');
  const filteredLines = lines.filter(line => !line.startsWith('팝업_SEM광고비_'));
  fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
  console.log('Successfully removed SEM popup rows.');
} catch (err) {
  console.error('Error processing file:', err);
}





