require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;
const inventoryPath = path.join(__dirname, "data", "inventario.json");

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function cargarInventarioDesdeArchivos() {
    const folder = path.join(__dirname, "data");
    const files = fs.readdirSync(folder).filter((name) => /^inventario_.*\.json$/i.test(name));
    const merged = [];

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(folder, file), "utf8");
            const data = JSON.parse(raw);
            const category = file
                .replace(/^inventario_/i, "")
                .replace(/\.json$/i, "")
                .replace(/[_\.]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

            if (!Array.isArray(data)) continue;
            for (const item of data) {
                const nombre = item.producto || item.nombre || item.name || null;
                if (!nombre) continue;

                merged.push({
                    nombre: String(nombre).trim(),
                    categoria: category,
                    marca: item.marca || null,
                    modelo: item.modelo || null,
                    precio: item.precio_efectivo ?? item.precio ?? item.precio_final ?? null,
                    costo_sin_iva: item.costo_sin_iva ?? null,
                    stock: item.stock ?? null,
                    habilitado: item.habilitado ?? null,
                    margen_empresa: item.margen_empresa ?? null,
                    es_kpc: item.es_kpc ?? null,
                    descripcion: String(item.descripcion || item.producto || item.nombre || "").trim(),
                });
            }
        } catch (error) {
            console.warn(`No se pudo leer ${file}:`, error.message);
        }
    }

    return merged;
}

function cargarInventario() {
    try {
        let raw = fs.readFileSync(inventoryPath, "utf8");
        raw = raw.replace(/^\uFEFF/, "");

        let data = null;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            const first = raw.indexOf('[');
            const last = raw.lastIndexOf(']');
            if (first !== -1 && last !== -1 && last > first) {
                const candidate = raw.slice(first, last + 1);
                data = JSON.parse(candidate);
            } else {
                throw e;
            }
        }

        if (Array.isArray(data)) return data;
    } catch (err) {
        console.warn("No se pudo cargar inventario.json:", err.message);
    }

    return cargarInventarioDesdeArchivos();
}

function construirContextoInventario(inventario) {
    return inventario
        .slice(0, 50)
        .map((item) => {
            const linea = [];
            if (item.nombre) linea.push(`Nombre: ${item.nombre}`);
            if (item.categoria) linea.push(`Categoría: ${item.categoria}`);
            if (item.marca) linea.push(`Marca: ${item.marca}`);
            if (item.modelo) linea.push(`Modelo: ${item.modelo}`);
            if (item.precio !== undefined && item.precio !== null) linea.push(`Precio: ${item.precio}`);
            if (item.stock !== undefined && item.stock !== null) linea.push(`Stock: ${item.stock}`);
            if (item.habilitado !== undefined && item.habilitado !== null) linea.push(`Habilitado: ${item.habilitado}`);
            if (item.descripcion) linea.push(`Descripción: ${item.descripcion}`);
            return linea.join(" | ");
        })
        .filter(Boolean)
        .join("\n");
}

const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || "google/flan-t5-large";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function construirPromptCompleto(question, inventoryContext, searchSummary) {
    const basePrompt = `Eres un asistente experto en cotizaciones y componentes de PC. Responde en español aprovechando la información del inventario y los datos relevantes de búsqueda web.
- Prioriza siempre los componentes que están en el inventario.
- No inventes precios, modelos ni disponibilidad. Si no hay información suficiente en el inventario o en la búsqueda web, dilo claramente.
- Si la pregunta puede responderse sólo con el inventario, no agregues información externa innecesaria.

Inventario:
${inventoryContext || "(Inventario vacío)"}
`;

    const webPrompt = searchSummary
        ? `
Información adicional de la web:
${searchSummary}
`
        : "";

    return `${basePrompt}${webPrompt}
Pregunta: ${question}

Respuesta:`;
}

function resumenDeBusquedaWeb(resultados) {
    if (!Array.isArray(resultados) || resultados.length === 0) {
        return "";
    }

    return resultados
        .map((item, index) => {
            const source = item.source || item.url || `Fuente ${index + 1}`;
            const snippet = item.snippet || item.title || "Información relevante disponible.";
            return `- ${source}: ${snippet}`;
        })
        .join("\n");
}

function normalizarTextoServidor(texto) {
    const str = String(texto || "");
    return str
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function obtenerCoincidenciasInventarioServidor(pregunta, inventario) {
    const q = normalizarTextoServidor(pregunta);
    if (!q || !Array.isArray(inventario) || inventario.length === 0) return [];

    const palabras = q.split(/\s+/).filter(Boolean);

    const scored = inventario.map((item) => {
        const texto = normalizarTextoServidor([
            item.nombre,
            item.categoria,
            item.descripcion,
            item.marca,
            item.modelo,
        ].filter(Boolean).join(' '));

        const score = palabras.reduce((acc, p) => acc + (texto.includes(p) ? 1 : 0), 0);
        return { item, score };
    }).filter(e => e.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0,5)
      .map(e => e.item);

    return scored;
}

async function buscarEnWeb(query) {
    if (!SEARCH_API_KEY || !SEARCH_ENGINE_ID) {
        return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(SEARCH_API_KEY)}&cx=${encodeURIComponent(SEARCH_ENGINE_ID)}&q=${encodeURIComponent(query)}&num=3`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Error en búsqueda web:", response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        if (!Array.isArray(data.items)) {
            return [];
        }

        return data.items.map((item) => ({
            title: item.title,
            snippet: item.snippet,
            url: item.link,
            source: item.displayLink,
        }));
    } catch (error) {
        console.error("Error fetch búsqueda web:", error.message);
        return [];
    }
}

async function callHuggingFace(prompt) {
    if (!HUGGINGFACE_API_KEY) return null;

    const model = HUGGINGFACE_MODEL;
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true, use_cache: false } }),
        });

        if (!resp.ok) {
            console.error("HuggingFace error:", resp.status, resp.statusText);
            return null;
        }

        const data = await resp.json();
        // HuggingFace returns either [{generated_text: "..."}] or {error: '...'}
        if (Array.isArray(data) && data[0]?.generated_text) {
            return String(data[0].generated_text).trim();
        }
        if (data?.generated_text) return String(data.generated_text).trim();
        // Some models return plain text
        if (typeof data === "string") return data.trim();
        return null;
    } catch (err) {
        console.error("Error calling HuggingFace:", err.message || err);
        return null;
    }
}

app.post("/api/chat", async (req, res) => {
    const question = String(req.body?.question || "").trim();
    if (!question) {
        return res.status(400).json({ error: "Pregunta requerida." });
    }

    const inventario = cargarInventario();
    const contexto = construirContextoInventario(inventario);
    const resultadosWeb = await buscarEnWeb(question);
    const searchSummary = resumenDeBusquedaWeb(resultadosWeb);
    const prompt = construirPromptCompleto(question, contexto, searchSummary);

    // Preferir Hugging Face gratis si está configurado
    if (HUGGINGFACE_API_KEY) {
        const hfAnswer = await callHuggingFace(prompt);
        if (hfAnswer) {
            return res.json({ answer: hfAnswer, searchResults: resultadosWeb, source: 'huggingface' });
        }
        console.warn('Hugging Face no devolvió respuesta. Procediendo a OpenAI o fallback local.');
    }

    if (OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
            const response = await openai.responses.create({
                model: "gpt-4o-mini",
                input: prompt,
                max_output_tokens: 450,
            });

            const answer = response.output?.[0]?.content?.[0]?.text || "No se obtuvo respuesta del modelo.";
            return res.json({ answer: answer.trim(), searchResults: resultadosWeb, source: 'openai' });
        } catch (error) {
            console.error("Error al llamar a OpenAI:", error);
        }
    }

    const coincidencias = obtenerCoincidenciasInventarioServidor(question, inventario);
    if (coincidencias && coincidencias.length > 0) {
        const lines = coincidencias.map((it, idx) => {
            const parts = [];
            if (it.nombre) parts.push(`Nombre: ${it.nombre}`);
            if (it.categoria) parts.push(`Categoría: ${it.categoria}`);
            if (it.precio !== undefined && it.precio !== null) parts.push(`Precio: ${it.precio}`);
            if (it.stock !== undefined && it.stock !== null) parts.push(`Stock: ${it.stock}`);
            return `Resultado ${idx + 1}: ${parts.join(' | ')}`;
        }).join("\n\n");

        const fallbackAnswer = `Respuesta local gratuita:\n${lines}\n\n(Ninguna IA externa disponible o falló la llamada.)`;
        return res.json({ answer: fallbackAnswer, searchResults: resultadosWeb, source: 'local', fallback: true });
    }

    return res.json({
        answer: "No se encontró información en el inventario. Configura HUGGINGFACE_API_KEY para usar IA gratuita o agrega más datos al inventario.",
        searchResults: resultadosWeb,
        source: 'local',
        fallback: true,
    });
});

app.get("/api/inventory", (req, res) => {
    const inventario = cargarInventario();
    res.json(inventario);
});

app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
    console.log("Si tienes HUGGINGFACE_API_KEY configurada, la IA gratuita usará Hugging Face primero.");
    console.log("Si no tienes HUGGINGFACE_API_KEY ni OPENAI_API_KEY, el chat responderá con el inventario local.");
});
