const fs = require('fs');
const path = require('path');

const files = ['income-statement.csv', 'balance-sheet.csv', 'cash-flow.csv'];
const dataDir = path.join(__dirname, 'public', 'data');

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // UTF-8 BOM 추가
    fs.writeFileSync(filePath, '\uFEFF' + content, 'utf8');
    console.log(`${file} converted to UTF-8 BOM`);
  } catch (error) {
    console.error(`Error converting ${file}:`, error.message);
  }
});



