# useragent-scraper

Project scraper **User-Agent** berbasis Node.js yang dapat berjalan sebagai:

1. **CLI** (Termux / terminal apa pun)
2. **REST API**
3. **Web Interface** (HTML + CSS + JS, dark mode, terminal-style)

Ketiganya memakai **source code yang sama** — logic inti (validasi parameter & request ke API source) ada satu-satunya di `utils/request.js`, dipakai bersama oleh CLI, Express router, dan Vercel serverless function. Tidak perlu mengubah kode apa pun untuk pindah dari Termux ke Vercel/Railway/Render.

Data diambil dari API source: **Synhs API** — `https://api-synhs.my.id/api/tools/useragent`

---

## Daftar Isi

- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Menjalankan di Termux (CLI)](#menjalankan-di-termux-cli)
- [Menjalankan di Localhost (Server + Web)](#menjalankan-di-localhost-server--web)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Deploy ke Railway](#deploy-ke-railway)
- [Deploy ke Render](#deploy-ke-render)
- [Dokumentasi REST API](#dokumentasi-rest-api)
- [Contoh Response](#contoh-response)
- [Troubleshooting](#troubleshooting)

---

## Struktur Folder

```
useragent-scraper/
│
├── api/
│   └── useragent.js        # Serverless function untuk Vercel (auto-detect oleh Vercel)
│
├── public/                 # Web Interface (statis)
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── routes/
│   └── useragent.js        # Express router untuk REST API (dipakai server.js)
│
├── utils/
│   └── request.js          # Logic inti: validasi + request ke API source (dipakai bersama)
│
├── server.js                # Entry point Express: serve Web Interface + REST API
├── index.js                  # Entry point CLI interaktif (Termux/terminal)
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Instalasi

Pastikan **Node.js 18+** sudah terinstall.

```bash
# masuk ke folder project
cd useragent-scraper

# install dependencies
npm install
```

Dependencies yang digunakan: `express`, `axios`, `cors`, `chalk`, `inquirer`, `ora`, `dotenv`. Versi-versi paket ini sengaja dikunci ke major version yang masih mendukung CommonJS (`require`), supaya kompatibel di Termux maupun di platform serverless tanpa konfigurasi tambahan.

---

## Menjalankan di Termux (CLI)

1. Install Node.js di Termux:

   ```bash
   pkg update && pkg upgrade
   pkg install nodejs
   ```

2. Clone / pindahkan project ke Termux, lalu install dependencies:

   ```bash
   cd useragent-scraper
   npm install
   ```

3. Jalankan CLI:

   ```bash
   node index.js
   ```

   atau:

   ```bash
   npm run cli
   ```

4. Ikuti menu interaktif:

   ```
   === USER AGENT SCRAPER ===
   Source: Synhs API (api-synhs.my.id)

   ? Masukkan jumlah (1-200): 20
   ? Pilih OS: Linux
   ? Pilih Browser: Firefox
   ? Pilih Format: JSON
   ```

5. Setelah hasil tampil, kamu akan diberi pilihan:
   - **Simpan ke file** — hasil disimpan ke folder `output/` di direktori kerja.
   - **Copy ke clipboard** — otomatis mendeteksi `termux-clipboard-set` (perlu paket `termux-api` terinstall di Termux: `pkg install termux-api`), atau `pbcopy`/`clip`/`xclip` di platform lain.
   - **Generate ulang** — kembali ke awal menu.
   - **Exit** — keluar dari CLI.

---

## Menjalankan di Localhost (Server + Web)

```bash
npm install
npm start
```

Server berjalan di `http://localhost:3000` dengan:

- **Web Interface** → `http://localhost:3000/`
- **REST API** → `http://localhost:3000/api/useragent`
- **Health check** → `http://localhost:3000/health`

Untuk mengganti port, set environment variable `PORT` (lihat `.env.example`):

```bash
PORT=8080 npm start
```

---

## Deploy ke Vercel

Project ini **zero-config** untuk Vercel:

- File apa pun di folder `api/` otomatis dijadikan serverless function oleh Vercel, jadi `api/useragent.js` langsung aktif sebagai `GET /api/useragent`.
- Folder `public/` otomatis disajikan sebagai static site (Web Interface).

Langkah deploy:

```bash
npm install -g vercel
vercel login
vercel
```

Ikuti prompt (pilih scope, nama project, dsb), lalu untuk deploy production:

```bash
vercel --prod
```

Tidak ada environment variable wajib untuk Vercel. File `vercel.json` hanya menetapkan runtime Node.js untuk folder `api/`.

---

## Deploy ke Railway

Railway menjalankan project sebagai proses Node.js biasa (long-running server), jadi yang dipakai adalah `server.js`.

1. Buat project baru di [Railway](https://railway.app) dan hubungkan ke repository ini (atau upload langsung).
2. Railway otomatis mendeteksi `package.json` dan menjalankan:
   ```bash
   npm install
   npm start
   ```
3. Railway otomatis menyediakan environment variable `PORT` — `server.js` sudah membaca `process.env.PORT` secara otomatis, **tidak perlu diatur manual**.
4. Setelah deploy selesai, Web Interface dan REST API tersedia di domain yang diberikan Railway, misalnya:
   - `https://<project>.up.railway.app/`
   - `https://<project>.up.railway.app/api/useragent`

---

## Deploy ke Render

1. Buat **Web Service** baru di [Render](https://render.com), hubungkan ke repository ini.
2. Atur konfigurasi build & start:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
3. Render otomatis menetapkan `PORT` melalui environment variable, dan `server.js` sudah menyesuaikan diri secara otomatis.
4. Setelah deploy, Web Interface & REST API tersedia di domain Render, misalnya:
   - `https://<service-name>.onrender.com/`
   - `https://<service-name>.onrender.com/api/useragent`

---

## Dokumentasi REST API

### `GET /api/useragent`

Mengambil daftar User-Agent dari API source berdasarkan filter yang diberikan.

| Parameter | Tipe   | Wajib | Nilai yang diterima                              |
|-----------|--------|-------|---------------------------------------------------|
| `jumlah`  | number | ya    | `1` – `200`                                        |
| `os`      | string | ya    | `windows`, `mac`, `linux`, `android`, `iphone`     |
| `browser` | string | ya    | `chrome`, `firefox`, `safari`, `edge`, `opera`     |
| `format`  | string | ya    | `json`, `array`, `txt`                             |

Contoh request:

```
GET /api/useragent?jumlah=20&os=linux&browser=firefox&format=json
```

Contoh dengan `curl`:

```bash
curl "http://localhost:3000/api/useragent?jumlah=5&os=android&browser=chrome&format=json"
```

Response error (parameter tidak valid) — HTTP 400:

```json
{
  "status": false,
  "code": 400,
  "message": "Parameter tidak valid",
  "errors": [
    "Parameter \"jumlah\" harus berada di antara 1-200."
  ]
}
```

Response error (API source gagal dihubungi) — HTTP 502 (atau status code dari API source):

```json
{
  "status": false,
  "code": 502,
  "message": "Gagal mengambil data dari API source",
  "error": "timeout of 15000ms exceeded"
}
```

---

## Contoh Response

Request:

```
GET /api/useragent?jumlah=2&os=linux&browser=firefox&format=json
```

Response (diteruskan langsung dari API source):

```json
{
  "status": true,
  "code": 200,
  "message": "Berhasil",
  "source": "Synhs API",
  "data": {
    "creator": "Synhs",
    "total_available": 112,
    "limit": 2,
    "filters": {
      "os": "linux",
      "browser": "firefox"
    },
    "user_agents": [
      {
        "ua": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "os": "linux",
        "browser": "firefox"
      },
      {
        "ua": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "os": "linux",
        "browser": "firefox"
      }
    ]
  }
}
```

> Catatan: bila `format=txt`, API source dapat mengembalikan teks polos (bukan JSON). Server kita mendeteksi ini secara otomatis dan akan meneruskannya sebagai `text/plain`, sehingga REST API, CLI, dan Web Interface tetap menampilkannya dengan benar tanpa error parsing.

---

## Troubleshooting

**1. `npm install` gagal di Termux karena modul native**
Pastikan paket dasar Termux sudah terpasang sebelum install:
```bash
pkg install python make clang
npm install
```

**2. CLI macet / tidak merespon di Termux**
Pastikan kamu menjalankan dengan `node index.js`, bukan `npm start` (yang menjalankan server, bukan CLI).

**3. "Copy ke clipboard" gagal di Termux**
Install Termux:API (baik paket Termux maupun aplikasi pendampingnya dari F-Droid/Play Store):
```bash
pkg install termux-api
```

**4. Error `ECONNABORTED` / timeout saat request**
API source (`api-synhs.my.id`) mungkin sedang lambat atau tidak dapat dijangkau dari jaringanmu. Coba kurangi nilai `jumlah`, atau coba lagi beberapa saat kemudian.

**5. Web Interface menampilkan halaman tapi tombol "generate" tidak merespon**
Pastikan server berjalan lewat `npm start` (bukan hanya membuka file `index.html` langsung di browser), karena Web Interface memanggil endpoint relatif `/api/useragent` yang hanya tersedia saat disajikan oleh `server.js` atau Vercel.

**6. Deploy ke Vercel tapi `/api/useragent` mengembalikan 404**
Pastikan struktur folder `api/useragent.js` tidak diubah namanya atau dipindahkan, karena Vercel mendeteksi serverless function berdasarkan path file di folder `api/`.

**7. Format `array`/`txt` mengembalikan data yang terlihat seperti JSON mentah di Web Interface**
Itu normal — beberapa format dari API source berupa teks biasa. Hasil tetap ditampilkan apa adanya di terminal output, dan tombol **download** akan menyimpannya sebagai `.txt`.

**8. Ingin mengganti API source**
Cukup ubah `BASE_URL` di `utils/request.js` — seluruh CLI, REST API, dan Web Interface otomatis ikut menyesuaikan karena semuanya memakai modul ini.

---

## Lisensi

MIT — bebas dipakai, dimodifikasi, dan dikembangkan lebih lanjut.
