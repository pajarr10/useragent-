/**
 * api/useragent.js
 * -----------------
 * Serverless Function untuk Vercel. Vercel secara otomatis mendeteksi
 * setiap file di folder /api sebagai endpoint serverless tanpa konfigurasi
 * tambahan, jadi GET /api/useragent akan langsung berfungsi setelah deploy.
 *
 * Logic-nya sama persis dengan routes/useragent.js (Express), hanya saja
 * ditulis dalam bentuk handler (req, res) polos sesuai konvensi Vercel.
 */

const { validateParams, fetchUserAgents } = require('../utils/request');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({
      status: false,
      code: 405,
      message: 'Method tidak diizinkan. Gunakan GET.',
    });
    return;
  }

  const { jumlah, os, browser, format } = req.query;

  const errors = validateParams({ jumlah, os, browser, format });

  if (errors.length > 0) {
    res.status(400).json({
      status: false,
      code: 400,
      message: 'Parameter tidak valid',
      errors,
    });
    return;
  }

  try {
    const result = await fetchUserAgents({ jumlah, os, browser, format });

    if (result.isJson) {
      res.status(200).json(result.data);
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(result.data);
  } catch (error) {
    const statusCode = error.response ? error.response.status : 502;
    res.status(statusCode).json({
      status: false,
      code: statusCode,
      message: 'Gagal mengambil data dari API source',
      error: error.message,
    });
  }
};
