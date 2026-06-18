import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'outros', 'CST_cClassTrib_2025-10-03_Public_verde.xlsx');
console.log(`Reading file: ${file}`);

const workbook = xlsx.readFile(file);
console.log('Sheets:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\nSheet: ${sheetName}`);
    console.log(`Rows: ${data.length}`);
    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('First 3 rows:');
        console.log(data.slice(1, 4));
    }
}
