/**
 * server.js
 * ----------
 * Entry point untuk:
 *   - Menjalankan di Termux (node server.js)
 *   - Menjalankan di localhost untuk development
 *   - Deploy ke Railway / Render (long-running Node process)
 *   - Deploy ke Vercel (module.exports = app dipakai sebagai serverless
 *     function oleh runtime @vercel/node bila vercel.json mengarah ke file ini;
 *     namun secara default project ini memakai api/useragent.js untuk Vercel)
 *
 * Server ini menyajikan:
 *   - Web Interface statis dari folder public/
 *   - REST API di /api/useragent (lihat routes/useragent.js)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const useragentRouter = require('./routes/useragent');

const app = express();

app.use(cors());
app.use(express.json());

// Sajikan Web Interface (HTML + CSS + JS) dari folder public/
app.use(express.static(path.join(__dirname, 'public')));

// REST API
app.use('/api/useragent', useragentRouter);

// Health check, berguna untuk Railway/Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: true, message: 'Server berjalan dengan baik' });
});

// 404 handler untuk endpoint API yang tidak dikenal
app.use('/api', (req, res) => {
  res.status(404).json({
    status: false,
    code: 404,
    message: 'Endpoint API tidak ditemukan',
  });
});

const PORT = process.env.PORT || 3000;

// Jangan panggil listen() saat berjalan di lingkungan serverless Vercel,
// cukup export app-nya saja.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log('  USER-AGENT SCRAPER SERVER');
    console.log('==================================================');
    console.log(`  Local:        http://localhost:${PORT}`);
    console.log(`  REST API:     http://localhost:${PORT}/api/useragent`);
    console.log(`  Health check: http://localhost:${PORT}/health`);
    console.log('==================================================');
  });
}

module.exports = app;
