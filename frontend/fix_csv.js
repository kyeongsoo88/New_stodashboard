const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'public', 'data', 'dashboard-sample.csv'),
    path.join(__dirname, 'public', 'data', 'dashboard-summary.csv')
];

console.log('Fixing CSV files for build...');

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            // Remove commas inside brackets [ ... ]
            const newContent = content.replace(/\[([^\]]+)\]/g, (match) => match.replace(/,/g, ''));
            
            if (content !== newContent) {
                fs.writeFileSync(file, newContent, 'utf8');
                console.log(`Updated ${file}`);
            } else {
                console.log(`No changes needed for ${file}`);
            }
        } else {
            console.log(`File not found: ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}:`, e);
        // 빌드 중단하지 않음
    }
});
