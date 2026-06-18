const XLSX = require('xlsx');

const workbook = XLSX.readFile('c:\\Users\\Suporte 06\\.gemini\\antigravity\\scratch\\aplicacoes-suporte\\outros\\Versoes STOR 16-05-2026.xls');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

let cidadeAtual = 'NENHUMA';
for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const linhaTexto = row.map(c => String(c).trim());
    
    const indiceCidade = linhaTexto.findIndex(c => c.toUpperCase().includes('CIDADE:'));

    if (indiceCidade !== -1) {
        const celula = linhaTexto[indiceCidade].trim();
        
        let novaCidade = '';
        if (celula.toUpperCase() === 'CIDADE:') {
            novaCidade = linhaTexto.slice(indiceCidade + 1).find(c => c.trim() !== '');
        } else {
            const idx = celula.toUpperCase().indexOf('CIDADE:');
            novaCidade = celula.substring(idx + 7).trim();
            if (!novaCidade) {
                novaCidade = linhaTexto.slice(indiceCidade + 1).find(c => c.trim() !== '');
            }
        }
        
        if (novaCidade) {
            cidadeAtual = novaCidade.trim();
            console.log(`Linha ${i}: Cidade detectada -> ${cidadeAtual}`);
        }
        continue;
    }
}
