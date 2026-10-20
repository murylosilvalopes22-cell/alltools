# Compila o projeto com a última versão
npm run build

# Entra na pasta dist
cd dist

# Inicializa o repositório git do zero apenas dentro da dist
git init
git checkout -B main
git add -A
git config user.email "bot@antigravity.ai"
git config user.name "Antigravity"
git commit -m "Deploy automatico da pasta dist"

# Força o envio (substitui tudo no GitHub apenas por esses arquivos)
git push -f https://github.com/murylosilvalopes22-cell/alltools.git main

# Retorna para a pasta raiz
cd ..
