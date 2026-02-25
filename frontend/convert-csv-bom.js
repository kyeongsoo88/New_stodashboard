const fs = require('fs');
const path = require('path');

const files = [
  'income-statement.csv', 
  'balance-sheet.csv', 
  'cash-flow.csv',
  'ste-income-statement-2026.csv',
  'sto-income-statement-2026-v3.csv',
  'ste-balance-sheet.csv',
  'sto-balance-sheet-2026-v2.csv',
  'sto-working-capital-balance-sheet.csv',
  'sto-cash-flow-2026.csv',
  'sto-cash-balance-2026.csv',
  'sto-working-capital-2026.csv'
];
const dataDir = path.join(__dirname, 'public', 'data');

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    // 먼저 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      console.log(`${file} not found, skipping...`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 이미 BOM이 있는지 확인
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log(`${file} already has UTF-8 BOM, skipping...`);
      return;
    }
    
    // UTF-8 BOM 추가
    fs.writeFileSync(filePath, '\uFEFF' + content, 'utf8');
    console.log(`✓ ${file} converted to UTF-8 BOM`);
  } catch (error) {
    console.error(`✗ Error converting ${file}:`, error.message);
  }
});

console.log('\nConversion complete!');

