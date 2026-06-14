const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '..', 'data', 'inventario.json');

try {
  const raw = fs.readFileSync(inventoryPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    console.error('El inventario no es un array. Abortando.');
    process.exit(1);
  }
  fs.writeFileSync(inventoryPath, JSON.stringify(parsed, null, 2), 'utf8');
  console.log('Inventario normalizado y reescrito correctamente.');
} catch (err) {
  console.error('Error al normalizar inventario.json:', err.message);
  process.exit(1);
}
