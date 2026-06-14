const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const outFile = path.join(dataDir, 'inventario.json');

function readJson(file) {
  try {
    let raw = fs.readFileSync(file, 'utf8');
    // Remover BOM u otros caracteres antes del primer '['
    const firstBracket = raw.indexOf('[');
    if (firstBracket > 0) raw = raw.slice(firstBracket);
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo', file, e.message);
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4), 'utf8');
}

function main() {
  const files = fs.readdirSync(dataDir).filter(f => /^inventario.*\.json$/i.test(f));
  const merged = [];
  const seen = new Set();

  for (const f of files) {
    const full = path.join(dataDir, f);
    const arr = readJson(full);
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const key = `${String(item.nombre||'').trim().toLowerCase()}|${String(item.categoria||'').trim().toLowerCase()}|${String(item.modelo||'')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  console.log('Archivos leídos:', files.length, 'Entradas unidas:', merged.length);
  writeJson(outFile, merged);

  // Move other inventario_*.json files except inventario.json to backup
  const backupDir = path.join(dataDir, 'backup_merged');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  for (const f of files) {
    if (f.toLowerCase() === 'inventario.json') continue;
    try {
      const src = path.join(dataDir, f);
      const dest = path.join(backupDir, f);
      fs.renameSync(src, dest);
      console.log('Movido a backup:', f);
    } catch (e) {
      console.warn('No se pudo mover', f, e.message);
    }
  }

  console.log('Merge complete. Output:', outFile);
}

main();
