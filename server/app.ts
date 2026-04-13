import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import buildAdsRouter from './routes/buildads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const port = Number(process.env.PORT ?? 3100);

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use('/api/buildads', buildAdsRouter);
app.use(express.static(workspaceRoot));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'carni-buildads-api' });
});

app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(workspaceRoot, 'index.html'));
});

app.listen(port, () => {
  console.log(`Carni BuildAds API listening on http://localhost:${port}`);
});
