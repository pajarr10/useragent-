/**
 * routes/useragent.js
 * --------------------
 * Router Express untuk endpoint REST API: GET /api/useragent
 * Dipasang oleh server.js. Logic inti (validasi + request ke API source)
 * diambil dari utils/request.js agar konsisten dengan CLI dan serverless
 * function di api/useragent.js.
 */

const express = require('express');
const { validateParams, fetchUserAgents } = require('../utils/request');

const router = express.Router();

router.get('/', async (req, res) => {
  const { jumlah, os, browser, format } = req.query;

  const errors = validateParams({ jumlah, os, browser, format });

  if (errors.length > 0) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: 'Parameter tidak valid',
      errors,
    });
  }

  try {
    const result = await fetchUserAgents({ jumlah, os, browser, format });

    if (result.isJson) {
      return res.status(200).json(result.data);
    }

    // Format txt/array dari API source bisa berupa plain text
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(result.data);
  } catch (error) {
    const statusCode = error.response ? error.response.status : 502;
    return res.status(statusCode).json({
      status: false,
      code: statusCode,
      message: 'Gagal mengambil data dari API source',
      error: error.message,
    });
  }
});

module.exports = router;
