import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos de la carpeta dist (generada por Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Redirigir todas las demás peticiones a index.html para que el routing de React funcione
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`ATLAS Admin V2 server is running on port ${port}`);
});
