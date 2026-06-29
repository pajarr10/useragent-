#!/usr/bin/env node
/**
 * index.js
 * ---------
 * CLI interaktif untuk Termux (atau terminal Node.js apa pun).
 * Jalankan dengan: node index.js
 *
 * Memakai logic yang sama dengan REST API & Web Interface lewat
 * utils/request.js, sehingga hasil yang didapat selalu konsisten.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

const { fetchUserAgents } = require('./utils/request');

const ACCENT = chalk.hex('#ffbe3d');

const OS_CHOICES = [
  { name: '1. Windows', value: 'windows' },
  { name: '2. Mac', value: 'mac' },
  { name: '3. Linux', value: 'linux' },
  { name: '4. Android', value: 'android' },
  { name: '5. iPhone', value: 'iphone' },
];

const BROWSER_CHOICES = [
  { name: '1. Chrome', value: 'chrome' },
  { name: '2. Firefox', value: 'firefox' },
  { name: '3. Safari', value: 'safari' },
  { name: '4. Edge', value: 'edge' },
  { name: '5. Opera', value: 'opera' },
];

const FORMAT_CHOICES = [
  { name: '1. JSON', value: 'json' },
  { name: '2. Array', value: 'array' },
  { name: '3. TXT', value: 'txt' },
];

function printBanner() {
  console.clear();
  console.log(ACCENT.bold('=== USER AGENT SCRAPER ==='));
  console.log(chalk.gray('Source: Synhs API (api-synhs.my.id)'));
  console.log();
}

function formatOutputForDisplay(result) {
  if (result.isJson) {
    return JSON.stringify(result.data, null, 2);
  }
  return String(result.data);
}

function fileExtensionFor(format) {
  if (format === 'json') return 'json';
  if (format === 'array') return 'txt';
  return 'txt';
}

/**
 * Mencoba menyalin teks ke clipboard sesuai lingkungan yang terdeteksi:
 * Termux, macOS, Windows, atau Linux desktop (xclip).
 */
function copyToClipboard(text) {
  return new Promise((resolve) => {
    const isTermux = Boolean(process.env.TERMUX_VERSION) || fs.existsSync('/data/data/com.termux');

    let cmd = 'xclip -selection clipboard';
    if (isTermux) cmd = 'termux-clipboard-set';
    else if (process.platform === 'darwin') cmd = 'pbcopy';
    else if (process.platform === 'win32') cmd = 'clip';

    try {
      const child = exec(cmd, (error) => {
        resolve(!error);
      });
      child.on('error', () => resolve(false));
      child.stdin.write(text);
      child.stdin.end();
    } catch (err) {
      resolve(false);
    }
  });
}

async function askJumlah() {
  const { jumlah } = await inquirer.prompt([
    {
      type: 'input',
      name: 'jumlah',
      message: 'Masukkan jumlah (1-200):',
      validate(input) {
        const num = Number(input);
        if (Number.isNaN(num) || num < 1 || num > 200) {
          return 'Masukkan angka antara 1-200';
        }
        return true;
      },
    },
  ]);
  return jumlah;
}

async function askOs() {
  const { os } = await inquirer.prompt([
    { type: 'list', name: 'os', message: 'Pilih OS', choices: OS_CHOICES },
  ]);
  return os;
}

async function askBrowser() {
  const { browser } = await inquirer.prompt([
    { type: 'list', name: 'browser', message: 'Pilih Browser', choices: BROWSER_CHOICES },
  ]);
  return browser;
}

async function askFormat() {
  const { format } = await inquirer.prompt([
    { type: 'list', name: 'format', message: 'Pilih Format', choices: FORMAT_CHOICES },
  ]);
  return format;
}

async function runMenu() {
  printBanner();

  const jumlah = await askJumlah();
  const os = await askOs();
  const browser = await askBrowser();
  const format = await askFormat();

  const spinner = ora('Mengambil data dari API...').start();

  try {
    const result = await fetchUserAgents({ jumlah, os, browser, format });
    spinner.succeed('Data berhasil diambil');

    const output = formatOutputForDisplay(result);
    console.log();
    console.log(chalk.greenBright(output));
    console.log();

    await postActionMenu(output, format);
  } catch (error) {
    spinner.fail('Gagal mengambil data');
    console.log(chalk.red(`Error: ${error.message}`));
    console.log();
    await postActionMenu(null, format, true);
  }
}

async function postActionMenu(output, format, isError = false) {
  const choices = [];

  if (!isError) {
    choices.push({ name: 'Simpan ke file', value: 'save' });
    choices.push({ name: 'Copy ke clipboard', value: 'copy' });
  }

  choices.push({ name: 'Generate ulang', value: 'regenerate' });
  choices.push({ name: 'Exit', value: 'exit' });

  const { action } = await inquirer.prompt([
    { type: 'list', name: 'action', message: 'Pilih aksi selanjutnya', choices },
  ]);

  if (action === 'save') {
    const { filename } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Nama file (tanpa ekstensi):',
        default: 'useragent-result',
      },
    ]);

    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const ext = fileExtensionFor(format);
    const filePath = path.join(outputDir, `${filename}.${ext}`);
    fs.writeFileSync(filePath, output, 'utf-8');
    console.log(chalk.green(`\nTersimpan di: ${filePath}\n`));
    return postActionMenu(output, format);
  }

  if (action === 'copy') {
    const success = await copyToClipboard(output);
    if (success) {
      console.log(chalk.green('\nBerhasil disalin ke clipboard\n'));
    } else {
      console.log(
        chalk.yellow(
          '\nClipboard tidak tersedia di lingkungan ini.\n' +
            'Pastikan termux-api (Termux), pbcopy (Mac), atau xclip (Linux) terinstall.\n'
        )
      );
    }
    return postActionMenu(output, format);
  }

  if (action === 'regenerate') {
    return runMenu();
  }

  console.log(chalk.cyan('\nSampai jumpa!\n'));
  process.exit(0);
}

runMenu().catch((error) => {
  console.error(chalk.red(`Terjadi kesalahan tak terduga: ${error.message}`));
  process.exit(1);
});
