import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'outros', 'CST_cClassTrib_2025-10-03_Public_verde.xlsx');
const workbook = xlsx.readFile(file);
const sheet = workbook.Sheets['cClassTrib'];
const data = xlsx.utils.sheet_to_json(sheet);

const parsedData = data.map(row => {
  const codigo = String(row['cClassTrib'] || '').padStart(6, '0');
  const descricao = row['Nome cClassTrib'] || 'Sem descrição';
  const cst = String(row['CST-IBS/CBS'] || '').padStart(3, '0');
  const tipoAliquota = row['Tipo de Alíquota'] || '';
  
  // Taxas teste 2026
  let cbs = 0.9;
  let ibs = 0.1;
  
  if (tipoAliquota === 'Zero') {
    cbs = 0;
    ibs = 0;
  } else {
    const pRedCbs = parseFloat(row['pRedCBS']) || 0;
    const pRedIbs = parseFloat(row['pRedIBS']) || 0;
    
    if (pRedCbs > 0) cbs = Number((cbs * (1 - (pRedCbs / 100))).toFixed(4));
    if (pRedIbs > 0) ibs = Number((ibs * (1 - (pRedIbs / 100))).toFixed(4));
  }
  
  return { codigo, descricao, cst, cbs, ibs };
}).filter(item => item.codigo && item.codigo !== '000000' && item.codigo !== 'undefined');

fs.writeFileSync(path.join(process.cwd(), 'src', 'components', 'cclastrib_data.json'), JSON.stringify(parsedData, null, 2));
console.log(`Gerado cclastrib_data.json com ${parsedData.length} registros.`);
