let inventarioData = [];
let chatMode = "auto";

async function cargarInventario() {
    inventarioData = [];

    const urls = ["/api/inventory", "data/inventario.json"];
    for (const url of urls) {
        try {
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) continue;
            const data = await response.json();
            if (Array.isArray(data)) {
                inventarioData = data;
                return;
            }
        } catch (error) {
            // continue trying fallback sources
        }
    }
}

function actualizarModoChat(value) {
    chatMode = value;
    const label = document.getElementById("chat-mode-label");
    if (!label) return;

    if (chatMode === "ia") {
        label.textContent = "Solo IA";
    } else if (chatMode === "local") {
        label.textContent = "Solo local";
    } else {
        label.textContent = "IA / Local";
    }
}

function normalizarTexto(texto) {
    const str = String(texto || "");
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function appendChatMessage(text, role = "assistant") {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const message = document.createElement("div");
    message.className = `chat-message chat-${role}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function obtenerCoincidenciasInventario(pregunta) {
    const q = normalizarTexto(pregunta);
    if (!q || inventarioData.length === 0) return [];

    return inventarioData
        .map((item) => {
            const texto = normalizarTexto(
                [
                    item.nombre,
                    item.categoria,
                    item.descripcion,
                    item.marca,
                    item.modelo,
                    item.precio,
                    item.stock,
                    item.habilitado,
                ]
                    .filter(Boolean)
                    .join(" "),
            );

            const score = q
                .split(/\s+/)
                .filter(Boolean)
                .reduce((acc, palabra) => acc + (texto.includes(palabra) ? 1 : 0), 0);

            return { item, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((entry) => entry.item);
}

function formatearItem(item) {
    const partes = [];
    if (item.nombre) partes.push(`Nombre: ${item.nombre}`);
    if (item.categoria) partes.push(`Categoría: ${item.categoria}`);
    if (item.marca) partes.push(`Marca: ${item.marca}`);
    if (item.modelo) partes.push(`Modelo: ${item.modelo}`);
    if (item.precio !== undefined && item.precio !== null) partes.push(`Precio: $${Number(item.precio).toFixed(2)}`);
    if (item.stock !== undefined && item.stock !== null) partes.push(`Stock: ${item.stock}`);
    if (item.habilitado !== undefined && item.habilitado !== null) partes.push(`Habilitado: ${item.habilitado}`);
    if (item.descripcion) partes.push(`Descripción: ${item.descripcion}`);
    return partes.join(" \n");
}

function crearRespuestaInventario(pregunta) {
    const q = normalizarTexto(pregunta);
    if (inventarioData.length === 0) {
        return "El inventario está vacío. Agrega datos en `data/inventario.json` para que el chat pueda responder con información real.";
    }

    if ((q.includes("cuantos") || q.includes("cuantas")) && q.includes("producto")) {
        return `Hay ${inventarioData.length} productos en el inventario.`;
    }

    if (q.includes("stock") || q.includes("disponible") || q.includes("cantidad")) {
        const conStock = inventarioData.filter((item) => Number(item.stock) > 0);
        if (conStock.length === 0) {
            return "No hay productos con stock disponible en el inventario.";
        }
        return `Hay ${conStock.length} productos disponibles con stock mayor a 0.`;
    }

    if (q.includes("categor") || q.includes("tipo")) {
        const categorias = [...new Set(inventarioData.map((item) => normalizarTexto(item.categoria)).filter(Boolean))];
        if (categorias.length === 0) {
            return "No hay categorías definidas en el inventario, pero puedes buscar por nombre o precio de producto.";
        }
        return `El inventario contiene ${categorias.length} categorías: ${categorias.slice(0, 6).join(", ")}${categorias.length > 6 ? ", ..." : ""}.`;
    }

    const resultados = obtenerCoincidenciasInventario(pregunta);
    if (resultados.length === 0) {
        return "No encontré coincidencias directas en el inventario. Prueba con otra palabra clave como nombre, categoría, marca o modelo.";
    }

    return resultados
        .map((item, index) => `Resultado ${index + 1}:\n${formatearItem(item)}`)
        .join("\n\n");
}

async function enviarPreguntaChat(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("chat-input");
    if (!input) return;

    const pregunta = input.value.trim();
    if (!pregunta) return;

    appendChatMessage(pregunta, "user");
    input.value = "";

    let respuesta = null;
    let fallbackReason = null;

    if (chatMode !== "local") {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: pregunta }),
            });

            if (response.ok) {
                const data = await response.json();
                respuesta = data.answer || null;
                
                // Si hay resultados de búsqueda web, añadirlos a la respuesta
                if (data.searchResults && Array.isArray(data.searchResults) && data.searchResults.length > 0) {
                    respuesta += "\n\n📱 Resultados de búsqueda web:\n";
                    data.searchResults.forEach((result, index) => {
                        const titulo = result.title || result.snippet || "Sin título";
                        const url = result.url || result.source || "#";
                        respuesta += `${index + 1}. ${titulo}\n   Fuente: ${result.source || url}\n`;
                    });
                }
                
                // Mostrar la fuente de la IA
                if (data.source) {
                    respuesta += `\n🔗 Fuente: ${data.source === 'huggingface' ? 'Hugging Face (IA Gratis)' : data.source === 'openai' ? 'OpenAI (ChatGPT)' : 'Inventario Local'}`;
                }
            } else {
                const errorData = await response.json().catch(() => null);
                fallbackReason = errorData?.error || `No se pudo conectar al servidor (${response.status}).`;
            }
        } catch (error) {
            fallbackReason = "Error de conexión con el servidor IA.";
        }
    }

    if (!respuesta) {
        respuesta = crearRespuestaInventario(pregunta);
        if (chatMode === "ia") {
            respuesta += "\n\n(Respuesta local porque el servidor IA no respondió.)";
        } else if (fallbackReason) {
            respuesta += `\n\n(Respuesta local: ${fallbackReason})`;
        }
    }

    setTimeout(() => {
        appendChatMessage(respuesta, "assistant");
    }, 150);
}
