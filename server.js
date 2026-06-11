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
        const raw = fs.readFileSync(inventoryPath, "utf8");
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
            return data;
        }
    } catch (error) {
        console.warn("No se pudo cargar inventario.json:", error.message);
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

app.post("/api/chat", async (req, res) => {
    const question = String(req.body?.question || "").trim();
    if (!question) {
        return res.status(400).json({ error: "Pregunta requerida." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY no está configurada en las variables de entorno." });
    }

    const inventario = cargarInventario();
    const contexto = construirContextoInventario(inventario);

    const prompt = `Eres un asistente experto en cotizaciones y productos. Responde en español usando solo la información disponible en el inventario. No inventes precios, marcas, modelos ni stock. Si la pregunta no puede responderse con los datos proporcionados, di claramente que no hay información suficiente.

Inventario:
${contexto || "(Inventario vacío)"}

Pregunta: ${question}

Respuesta:`;

    try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: prompt,
            max_output_tokens: 400,
        });

        const answer = response.output?.[0]?.content?.[0]?.text || "No se obtuvo respuesta del modelo.";
        return res.json({ answer: answer.trim() });
    } catch (error) {
        console.error("Error al llamar a OpenAI:", error);
        return res.status(500).json({ error: "Error interno al generar la respuesta. Revisa el servidor y la variable OPENAI_API_KEY." });
    }
});

app.get("/api/inventory", (req, res) => {
    const inventario = cargarInventario();
    res.json(inventario);
});

app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
    console.log("Asegúrate de definir OPENAI_API_KEY antes de iniciar el servidor.");
});
