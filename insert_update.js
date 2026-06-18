const payload = {
  "fields": {
    "osNumber": { "stringValue": "04052026" },
    "company": { "stringValue": "Aplicações Suporte (Update Notas)" },
    "analyst": { "stringValue": "Antigravity AI" },
    "status": { "stringValue": "Finalizado" },
    "date": { "stringValue": "04/05/2026" },
    "time": { "stringValue": "17:55" },
    "obs": { "stringValue": "🚀 Build 04052026\n- Novo Módulo Kanban para Gestão de Solicitações (Firebase nativo)\n- Cores corrigidas para menu de opções em modo escuro/claro\n- Proteção de concorrência em Checklists: Continuar um checklist aberto impede a edição duplicada\n- Proteção de Finalizados: Confirmação e bloqueio após conclusão de Checklists\n- Correção de layout no botão Adicionar OS." },
    "done": { "booleanValue": true }
  }
};

fetch('https://firestore.googleapis.com/v1/projects/thomas-teste-d7a3d/databases/(default)/documents/updateBoard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
