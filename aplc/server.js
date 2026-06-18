const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
app.use(cors());

// Configura o multer para receber a imagem na memória RAM
const upload = multer({ storage: multer.memoryStorage() });

// Autenticação com a Conta de Serviço (Seu Robô)
const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json', // Arquivo JSON baixado do Google Cloud
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// ID da pasta que você compartilhou com o e-mail do robô
const PASTA_ID = '1a8HWoExNqHyYqT8RWQloQ6Zu6fI15wzo';

app.post('/upload', upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        }

        // Transforma o buffer de memória em um Stream (o Google Drive exige esse formato)
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        // Envia o arquivo para o Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: req.file.originalname, // Nome original do arquivo
                parents: [PASTA_ID], // ID da pasta de destino
            },
            media: {
                mimeType: req.file.mimetype,
                body: bufferStream,
            },
            fields: 'id, webViewLink, webContentLink',
            supportsAllDrives: true
        });

        const fileId = response.data.id;

        // Torna o arquivo público (para que qualquer um com o link possa ver/baixar)
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Retorna o link para o Frontend
        res.json({
            sucesso: true,
            linkVisualizar: response.data.webViewLink,
            linkDownload: response.data.webContentLink
        });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ erro: 'Falha ao salvar no Google Drive.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}! 🚀`);
});