/**
 * public/script.js
 * ------------------
 * Logic untuk Web Interface. Memanggil REST API yang sama yang dipakai
 * CLI (GET /api/useragent), lalu menampilkan hasil di dalam "terminal"
 * dengan syntax highlighting sederhana untuk JSON.
 */

(function () {
  'use strict';

  const form = document.getElementById('ua-form');
  const jumlahInput = document.getElementById('jumlah');
  const osSelect = document.getElementById('os');
  const browserSelect = document.getElementById('browser');
  const formatSelect = document.getElementById('format');
  const generateBtn = document.getElementById('generate-btn');

  const errorJumlah = document.getElementById('error-jumlah');
  const commandPreviewText = document.getElementById('command-preview-text');

  const placeholder = document.getElementById('placeholder');
  const loading = document.getElementById('loading');
  const output = document.getElementById('output');

  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const clearBtn = document.getElementById('clear-btn');

  const statusLeft = document.getElementById('status-left');
  const statusRight = document.getElementById('status-right');

  const toastStack = document.getElementById('toast-stack');

  let lastResultText = '';
  let lastFormat = 'json';
  let isLoading = false;

  // ---------------------------------------------------------
  // Toast notifications
  // ---------------------------------------------------------
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast--' + type : '');
    toast.textContent = message;
    toastStack.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // ---------------------------------------------------------
  // Command preview — selalu mencerminkan isi form saat ini
  // ---------------------------------------------------------
  function buildQuery() {
    const params = new URLSearchParams({
      jumlah: jumlahInput.value || '0',
      os: osSelect.value,
      browser: browserSelect.value,
      format: formatSelect.value,
    });
    return params.toString();
  }

  function updateCommandPreview() {
    commandPreviewText.textContent = 'GET /api/useragent?' + buildQuery();
  }

  [jumlahInput, osSelect, browserSelect, formatSelect].forEach((el) => {
    el.addEventListener('input', updateCommandPreview);
    el.addEventListener('change', updateCommandPreview);
  });

  // ---------------------------------------------------------
  // Validasi input di sisi client
  // ---------------------------------------------------------
  function validateJumlah() {
    const value = Number(jumlahInput.value);
    if (!jumlahInput.value || Number.isNaN(value) || value < 1 || value > 200) {
      jumlahInput.classList.add('is-invalid');
      errorJumlah.textContent = 'Masukkan angka antara 1-200.';
      return false;
    }
    jumlahInput.classList.remove('is-invalid');
    errorJumlah.textContent = '';
    return true;
  }

  jumlahInput.addEventListener('input', validateJumlah);

  // ---------------------------------------------------------
  // JSON syntax highlighting (tanpa library eksternal)
  // ---------------------------------------------------------
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightJson(jsonString) {
    const escaped = escapeHtml(jsonString);
    const pattern = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

    return escaped.replace(pattern, (match) => {
      let cls = 'tok-number';
      if (/^"/.test(match)) {
        cls = /:\s*$/.test(match) ? 'tok-key' : 'tok-string';
      } else if (/true|false/.test(match)) {
        cls = 'tok-bool';
      } else if (/null/.test(match)) {
        cls = 'tok-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  function renderOutput(text, format) {
    lastResultText = text;
    lastFormat = format;

    if (format === 'json') {
      output.innerHTML = highlightJson(text);
    } else {
      output.textContent = text;
    }

    output.hidden = false;
    placeholder.hidden = true;
    loading.hidden = true;

    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    clearBtn.disabled = false;
  }

  function resetOutput() {
    lastResultText = '';
    output.hidden = true;
    output.innerHTML = '';
    placeholder.hidden = false;
    loading.hidden = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    clearBtn.disabled = true;
    statusLeft.textContent = 'idle';
    statusLeft.className = '';
    statusRight.textContent = '';
  }

  // ---------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------
  function setLoading(state) {
    isLoading = state;
    generateBtn.disabled = state;
    generateBtn.innerHTML = state
      ? '<span class="btn__glyph">▶</span> generating…'
      : '<span class="btn__glyph">▶</span> generate';

    if (state) {
      placeholder.hidden = true;
      output.hidden = true;
      loading.hidden = false;
      statusLeft.textContent = 'fetching…';
      statusLeft.className = 'is-busy';
    }
  }

  // ---------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const jumlahValid = validateJumlah();
    if (!jumlahValid) {
      showToast('Periksa kembali parameter "jumlah".', 'error');
      return;
    }

    const format = formatSelect.value;
    const query = buildQuery();

    setLoading(true);
    const startedAt = performance.now();

    try {
      const response = await fetch('/api/useragent?' + query);
      const contentType = response.headers.get('content-type') || '';
      const elapsedMs = Math.round(performance.now() - startedAt);

      let bodyText;
      if (contentType.includes('application/json')) {
        const json = await response.json();
        bodyText = JSON.stringify(json, null, 2);

        if (!response.ok) {
          throw new Error(json.message || 'Permintaan gagal.');
        }
      } else {
        bodyText = await response.text();
        if (!response.ok) {
          throw new Error(bodyText || 'Permintaan gagal.');
        }
      }

      renderOutput(bodyText, format);
      statusLeft.textContent = 'success';
      statusLeft.className = 'is-ok';
      statusRight.textContent = elapsedMs + 'ms · ' + format.toUpperCase();
      showToast('Data berhasil diambil.', 'ok');
    } catch (error) {
      placeholder.hidden = true;
      loading.hidden = true;
      output.hidden = false;
      output.innerHTML = '<span class="tok-bool">// gagal: ' + escapeHtml(error.message) + '</span>';
      statusLeft.textContent = 'error';
      statusLeft.className = 'is-err';
      statusRight.textContent = '';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      clearBtn.disabled = false;
      showToast(error.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setLoading(false);
    }
  });

  // ---------------------------------------------------------
  // Copy / Download / Clear
  // ---------------------------------------------------------
  copyBtn.addEventListener('click', async () => {
    if (!lastResultText) return;
    try {
      await navigator.clipboard.writeText(lastResultText);
      showToast('Hasil disalin ke clipboard.', 'ok');
    } catch (err) {
      showToast('Gagal menyalin ke clipboard.', 'error');
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastResultText) return;
    const ext = lastFormat === 'json' ? 'json' : 'txt';
    const blob = new Blob([lastResultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'useragent-result.' + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File berhasil diunduh.', 'ok');
  });

  clearBtn.addEventListener('click', () => {
    resetOutput();
    showToast('Hasil dibersihkan.', 'ok');
  });

  // ---------------------------------------------------------
  // Init
  // ---------------------------------------------------------
  updateCommandPreview();
  resetOutput();
})();
