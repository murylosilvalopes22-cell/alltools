const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\Suporte 06\\.gemini\\antigravity\\scratch\\aplicacoes-suporte\\outros\\ZEBRA\\Zebra_EPL__331503_3 carreiras individual.Etq', 'utf-8');

const mapField = (text) => {
  return { text };
};

try {
  if (content.trim().startsWith('{')) {
     console.log('Caught as JSON');
  }

  if (content.split('\n').some(l => l.trim().startsWith('A') && l.includes(','))) {
    console.log('Caught as EPL');
    const newElements = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if ((line.startsWith('A') && !line.startsWith('AUTO')) || line.startsWith('B')) {
        const parts = line.split(',');
        if (parts.length >= 8) {
          const x = parseInt(parts[0].substring(1), 10);
          const y = parseInt(parts[1], 10);
          let text = (line.startsWith('A') ? parts.slice(7) : parts.slice(8)).join(',').replace(/"/g, '');
          
          const type = line.startsWith('B') ? 'barcode' : 'text';
          const mapped = mapField(text.replace(/<[^>]*>?/gm, ''));

          newElements.push({
            type, text, x, y
          });
        }
      }
    });
    console.log('Parsed:', newElements);
  } else {
    console.log('Not caught as EPL');
  }
} catch (e) {
  console.error(e);
}
