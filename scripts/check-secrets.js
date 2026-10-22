const { execFileSync } = require("child_process");
const fs = require("fs");

const patrones = [
    { nombre: "OpenAI API key", regex: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
    { nombre: "Google API key", regex: /AIza[0-9A-Za-z_-]{20,}/g },
    { nombre: "Hugging Face token", regex: /hf_[A-Za-z0-9]{20,}/g },
    { nombre: "Brave Search key", regex: /BSA[A-Za-z0-9_-]{20,}/g },
];

const extensionesIgnoradas = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf", ".eot",
    ".pdf", ".zip", ".gz", ".exe", ".dll", ".node", ".map",
]);

function esPlaceholder(valor) {
    return /x{3,}|yours|your_|tu_|example|placeholder|cambiar|reemplazar/i.test(valor);
}

let archivos = [];
try {
    archivos = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
        .split("\0")
        .filter(Boolean);
} catch {
    console.error("No se pudo obtener la lista de archivos de git.");
    process.exit(2);
}

const hallazgos = [];

for (const archivo of archivos) {
    if (!fs.existsSync(archivo)) continue;
    const extension = archivo.slice(archivo.lastIndexOf(".")).toLowerCase();
    if (extensionesIgnoradas.has(extension)) continue;

    let contenido = "";
    try {
        contenido = fs.readFileSync(archivo, "utf8");
    } catch {
        continue;
    }

    const lineas = contenido.split(/\r?\n/);
    for (let indice = 0; indice < lineas.length; indice += 1) {
        for (const patron of patrones) {
            patron.regex.lastIndex = 0;
            let coincidencia = patron.regex.exec(lineas[indice]);
            while (coincidencia) {
                if (!esPlaceholder(coincidencia[0])) {
                    hallazgos.push({
                        archivo,
                        linea: indice + 1,
                        tipo: patron.nombre,
                    });
                }
                coincidencia = patron.regex.exec(lineas[indice]);
            }
        }
    }
}

if (hallazgos.length === 0) {
    console.log("OK: no se encontraron claves en archivos rastreados por git.");
    process.exit(0);
}

console.error("Se encontraron posibles claves en archivos que git podría publicar:");
for (const hallazgo of hallazgos) {
    console.error(`- ${hallazgo.archivo}:${hallazgo.linea} (${hallazgo.tipo})`);
}
console.error("Elimina la clave del archivo, revócala y genera una nueva antes de publicar.");
process.exit(1);
