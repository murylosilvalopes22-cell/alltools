import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'outros', 'CST_cClassTrib_2025-10-03_Public_verde.xlsx');
const workbook = xlsx.readFile(file);
const sheet = workbook.Sheets['CST'];
const data = xlsx.utils.sheet_to_json(sheet);

const parsedData = data.map(row => {
  const codigo = String(row['CST-IBS/CBS'] || '').padStart(3, '0');
  const descricao = row['Descrição CST-IBS/CBS'] || 'Sem descrição';
  return { codigo, descricao };
}).filter(item => item.codigo && item.codigo !== 'undefined');

fs.writeFileSync(path.join(process.cwd(), 'src', 'components', 'cst_data.json'), JSON.stringify(parsedData, null, 2));
console.log(`Gerado cst_data.json com ${parsedData.length} registros.`);
