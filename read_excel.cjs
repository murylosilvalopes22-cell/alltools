const xlsx = require('xlsx');

const filePath = 'c:/Users/Suporte 06/.gemini/antigravity/scratch/aplicacoes-suporte/outros/Informações trinutarias.xlsx';
const workbook = xlsx.readFile(filePath);

const data = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  data[sheetName] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
});

console.log(JSON.stringify(data, null, 2));
