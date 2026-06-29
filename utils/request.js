/**
 * utils/request.js
 * -----------------
 * Modul inti yang menjadi satu-satunya titik komunikasi ke API source
 * (Synhs API). Dipakai bersama oleh:
 *   - CLI (index.js)
 *   - REST API berbasis Express (routes/useragent.js -> server.js)
 *   - Serverless Function Vercel (api/useragent.js)
 *
 * Dengan begitu, logic request & validasi hanya ditulis satu kali,
 * sehingga project tetap konsisten di Termux, Vercel, Railway, maupun Render.
 */

const axios = require('axios');

// Endpoint API source (Synhs API)
const BASE_URL = 'https://api-synhs.my.id/api/tools/useragent';

// Daftar nilai parameter yang valid sesuai dokumentasi API source
const VALID_OS = ['windows', 'mac', 'linux', 'android', 'iphone'];
const VALID_BROWSER = ['chrome', 'firefox', 'safari', 'edge', 'opera'];
const VALID_FORMAT = ['json', 'array', 'txt'];

// API source menggunakan nama parameter "limit" dan nilai format "text"
// (bukan "jumlah" / "txt"). Mapping ini menjaga agar CLI, Web, dan REST API
// kita tetap memakai penamaan dari spesifikasi project tanpa terikat pada
// penamaan internal API source.
const FORMAT_TO_SOURCE = {
  json: 'json',
  array: 'array',
  txt: 'text',
};

/**
 * Validasi parameter input sebelum melakukan request ke API source.
 * @param {object} params
 * @returns {string[]} daftar pesan error (kosong jika valid)
 */
function validateParams({ jumlah, os, browser, format }) {
  const errors = [];

  const jumlahNum = Number(jumlah);
  if (jumlah === undefined || jumlah === null || jumlah === '' || Number.isNaN(jumlahNum)) {
    errors.push('Parameter "jumlah" wajib diisi dan harus berupa angka.');
  } else if (jumlahNum < 1 || jumlahNum > 200) {
    errors.push('Parameter "jumlah" harus berada di antara 1-200.');
  }

  if (!os || !VALID_OS.includes(String(os).toLowerCase())) {
    errors.push(`Parameter "os" harus salah satu dari: ${VALID_OS.join(', ')}.`);
  }

  if (!browser || !VALID_BROWSER.includes(String(browser).toLowerCase())) {
    errors.push(`Parameter "browser" harus salah satu dari: ${VALID_BROWSER.join(', ')}.`);
  }

  if (!format || !VALID_FORMAT.includes(String(format).toLowerCase())) {
    errors.push(`Parameter "format" harus salah satu dari: ${VALID_FORMAT.join(', ')}.`);
  }

  return errors;
}

/**
 * Mengambil data User-Agent dari API source.
 * @param {{jumlah: number|string, os: string, browser: string, format: string}} params
 * @returns {Promise<{isJson: boolean, data: any, raw: string}>}
 */
// Identitas yang ditampilkan ke pengguna di setiap response JSON.
// Ubah dua nilai ini saja kalau suatu saat ingin rebranding lagi.
const BRAND_SOURCE = 'Pajar API';
const BRAND_CREATOR = 'Pajar';

/**
 * Menimpa field "source" (top-level) dan "data.creator" pada response
 * JSON dari API source, supaya selalu tampil sebagai identitas kita
 * sendiri, tanpa mengubah struktur atau isi data lain.
 */
function applyBranding(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;

  if ('source' in parsed) {
    parsed.source = BRAND_SOURCE;
  }

  if (parsed.data && typeof parsed.data === 'object' && 'creator' in parsed.data) {
    parsed.data.creator = BRAND_CREATOR;
  }

  return parsed;
}

async function fetchUserAgents({ jumlah, os, browser, format }) {
  const normalizedFormat = String(format).toLowerCase();
  const sourceFormat = FORMAT_TO_SOURCE[normalizedFormat] || normalizedFormat;

  const response = await axios.get(BASE_URL, {
    params: {
      limit: jumlah,
      os: String(os).toLowerCase(),
      browser: String(browser).toLowerCase(),
      format: sourceFormat,
    },
    timeout: 15000,
    responseType: 'text', // ambil mentah dulu, karena beberapa format bukan JSON murni
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  });

  const raw = response.data;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const branded = applyBranding(parsed);
    return { isJson: true, data: branded, raw: JSON.stringify(branded) };
  } catch (err) {
    // Format txt/array dari API source kadang berupa plain text, bukan JSON
    return { isJson: false, data: raw, raw };
  }
}

module.exports = {
  BASE_URL,
  VALID_OS,
  VALID_BROWSER,
  VALID_FORMAT,
  FORMAT_TO_SOURCE,
  BRAND_SOURCE,
  BRAND_CREATOR,
  validateParams,
  fetchUserAgents,
};
