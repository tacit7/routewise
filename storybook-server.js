import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6006;

// Serve static files from the storybook build
app.use(express.static(path.join(__dirname, 'storybook-static')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'storybook-static', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Storybook server running on http://localhost:${PORT}`);
});