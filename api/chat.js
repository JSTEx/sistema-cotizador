const {
    cargarInventario,
    construirContextoInventario,
    buscarEnWeb,
    callHuggingFace,
    construirPromptCompleto,
    obtenerCoincidenciasInventarioServidor,
} = require("./helpers");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const question = String(req.body?.question || "").trim();
    if (!question) {
        return res.status(400).json({ error: "Pregunta requerida." });
    }

    const inventario = cargarInventario();
    const contexto = construirContextoInventario(inventario);
    const resultadosWeb = await buscarEnWeb(question);
    const searchSummary = construirContextoInventario(inventario) ? resultadosWeb.length === 0 ? "" : resultadosWeb.map((item, index) => `- ${item.source || item.url || `Fuente ${index + 1}`}: ${item.snippet || item.title}`).join("\n") : "";
    const prompt = construirPromptCompleto(question, contexto, searchSummary);

    if (process.env.HUGGINGFACE_API_KEY) {
        const hfAnswer = await callHuggingFace(prompt);
        if (hfAnswer) {
            return res.status(200).json({ answer: hfAnswer, searchResults: resultadosWeb, source: "huggingface" });
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
            const openai = new (require("openai").OpenAI)({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.responses.create({
                model: "gpt-4o-mini",
                input: prompt,
                max_output_tokens: 450,
            });

            const answer = response.output?.[0]?.content?.[0]?.text || "No se obtuvo respuesta del modelo.";
            return res.status(200).json({ answer: answer.trim(), searchResults: resultadosWeb, source: "openai" });
        } catch (error) {
            console.error("Error al llamar a OpenAI:", error);
        }
    }

    const coincidencias = obtenerCoincidenciasInventarioServidor(question, inventario);
    if (coincidencias && coincidencias.length > 0) {
        const lines = coincidencias
            .map((it, idx) => {
                const parts = [];
                if (it.nombre) parts.push(`Nombre: ${it.nombre}`);
                if (it.categoria) parts.push(`Categoría: ${it.categoria}`);
                if (it.precio !== undefined && it.precio !== null) parts.push(`Precio: ${it.precio}`);
                if (it.stock !== undefined && it.stock !== null) parts.push(`Stock: ${it.stock}`);
                return `Resultado ${idx + 1}: ${parts.join(" | ")}`;
            })
            .join("\n\n");

        const fallbackAnswer = `Respuesta local gratuita:\n${lines}\n\n(Ninguna IA externa disponible o falló la llamada.)`;
        return res.status(200).json({ answer: fallbackAnswer, searchResults: resultadosWeb, source: "local", fallback: true });
    }

    return res.status(200).json({
        answer: "No se encontró información en el inventario. Configura HUGGINGFACE_API_KEY para usar IA gratuita o agrega más datos al inventario.",
        searchResults: resultadosWeb,
        source: "local",
        fallback: true,
    });
};
