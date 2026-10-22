let inventarioData = [];
let inventarioError = null;
let chatMode = "auto";
let chatHistory = [];

const MAX_PREGUNTA = 500;
const MAX_HISTORIAL = 6;

const PALABRAS_IGNORADAS = new Set([
    "a", "al", "algo", "algun", "alguna", "algunas", "alguno", "algunos", "ante", "antes",
    "como", "con", "contra", "cual", "cuales", "cuando", "cuanto", "cuanta", "cuantos",
    "cuantas", "de", "del", "desde", "donde", "dos", "el", "ella", "ellas", "ellos", "en",
    "entre", "era", "es", "esa", "esas", "ese", "eso", "esos", "esta", "estas", "este",
    "esto", "estos", "fue", "ha", "hasta", "hay", "la", "las", "le", "les", "lo", "los",
    "mas", "me", "mi", "mis", "mucho", "muy", "necesito", "nos", "o", "para", "pero", "por",
    "precio", "precios", "producto", "productos", "que", "quien", "quiero", "se", "sin",
    "sobre", "su", "sus", "te", "tiene", "tienen", "tu", "tus", "un", "una", "uno", "unos",
    "unas", "vende", "venden", "y", "ya", "yo", "dame", "muestra", "buscar", "busca",
    "inventario", "cuesta", "cuestan", "vale", "valen", "disponible", "disponibles",
    "stock", "cantidad", "hola", "buenas", "buenos", "dias", "tardes", "noches", "favor",
]);

const SINONIMOS = {
    fuente: ["fuente", "poder", "psu"],
    fuentes: ["fuente", "poder", "psu"],
    psu: ["fuente", "poder", "psu"],
    grafica: ["tarjeta", "grafica", "gpu"],
    graficas: ["tarjeta", "grafica", "gpu"],
    tarjeta: ["tarjeta", "grafica", "gpu"],
    gpu: ["tarjeta", "grafica", "gpu"],
    ram: ["memoria", "ram"],
    memoria: ["memoria", "ram"],
    disco: ["disco", "ssd", "hdd", "unidad", "datos"],
    discos: ["disco", "ssd", "hdd", "unidad", "datos"],
    almacenamiento: ["disco", "ssd", "hdd", "almacenamiento"],
    ssd: ["disco", "ssd", "unidad", "datos"],
    hdd: ["disco", "hdd", "unidad", "datos"],
    procesador: ["procesador", "cpu"],
    procesadores: ["procesador", "cpu"],
    cpu: ["procesador", "cpu"],
    board: ["placa", "base", "motherboard"],
    motherboard: ["placa", "base", "motherboard"],
    placa: ["placa", "base", "motherboard"],
    monitor: ["monitor", "pantalla"],
    monitores: ["monitor", "pantalla"],
    pantalla: ["monitor", "pantalla"],
    laptop: ["laptop", "notebook", "portatil"],
    laptops: ["laptop", "notebook", "portatil"],
    notebook: ["laptop", "notebook", "portatil"],
    portatil: ["laptop", "notebook", "portatil"],
    cooler: ["cooler", "ventilador", "refrigeracion"],
    coolers: ["cooler", "ventilador", "refrigeracion"],
    ventilador: ["ventilador", "cooler"],
    ventiladores: ["ventilador", "cooler"],
    teclado: ["teclado"],
    teclados: ["teclado"],
    mouse: ["mouse", "raton"],
    raton: ["mouse", "raton"],
    audifonos: ["audifonos", "audio", "headset"],
    headset: ["audifonos", "audio", "headset"],
    bocina: ["bocina", "parlante", "audio"],
    bocinas: ["bocina", "parlante", "audio"],
    parlante: ["bocina", "parlante", "audio"],
    impresora: ["impresora"],
    impresoras: ["impresora"],
    ups: ["ups", "bateria"],
    case: ["case", "gabinete", "chasis"],
    gabinete: ["case", "gabinete", "chasis"],
    silla: ["silla", "mueble"],
    sillas: ["silla", "mueble"],
    escritorio: ["escritorio", "mueble"],
    mesa: ["mesa", "mueble"],
};

async function cargarInventario() {
    inventarioData = [];
    inventarioError = null;

    try {
        const response = await fetch("/api/inventory", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Formato de inventario inválido.");
        inventarioData = data;
    } catch (error) {
        inventarioError = error.message;
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
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function truncarTexto(texto, maximo) {
    const limpio = String(texto || "").replace(/\s+/g, " ").trim();
    return limpio.length > maximo ? `${limpio.slice(0, maximo - 1)}…` : limpio;
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

function showLoading(show) {
    const loader = document.getElementById("chat-loading");
    const input = document.getElementById("chat-input");
    const btn = document.getElementById("chat-send-btn");
    if (loader) loader.style.display = show ? "inline-flex" : "none";
    if (input) input.disabled = show;
    if (btn) btn.disabled = show;
}

function tokenizar(texto) {
    const base = normalizarTexto(texto)
        .split(/\s+/)
        .filter((token) => token && !PALABRAS_IGNORADAS.has(token) && (token.length > 1 || /\d/.test(token)));
    const tokens = new Set();

    for (const token of base) {
        tokens.add(token);
        for (const sinonimo of SINONIMOS[token] || []) tokens.add(sinonimo);
        if (token.length > 3) {
            const singular = token.replace(/es$/, "").replace(/s$/, "");
            if (singular.length > 2) tokens.add(singular);
        }
    }

    return [...tokens];
}

function puntuarItem(item, tokens, frase) {
    const campos = {
        nombre: normalizarTexto(item.nombre),
        modelo: normalizarTexto(item.modelo),
        marca: normalizarTexto(item.marca),
        categoria: normalizarTexto(item.categoria),
        descripcion: normalizarTexto(item.descripcion),
    };
    let puntaje = 0;

    if (frase.length >= 3 && campos.nombre.includes(frase)) puntaje += 12;

    for (const token of tokens) {
        if (campos.modelo.includes(token)) puntaje += 6;
        if (campos.nombre.includes(token)) puntaje += 5;
        if (campos.marca.includes(token)) puntaje += 4;
        if (campos.categoria.includes(token)) puntaje += 3;
        if (campos.descripcion.includes(token)) puntaje += 1;
        if (token.length >= 4) {
            if (campos.nombre.split(/\s+/).some((palabra) => palabra.startsWith(token))) puntaje += 2;
            if (campos.modelo.split(/\s+/).some((palabra) => palabra.startsWith(token))) puntaje += 2;
        }
    }

    return puntaje;
}

function obtenerCoincidenciasInventario(pregunta) {
    const palabras = normalizarTexto(pregunta)
        .split(/\s+/)
        .filter((token) => token && !PALABRAS_IGNORADAS.has(token));
    const tokens = tokenizar(pregunta);
    const frase = palabras.join(" ");

    if (!tokens.length && !frase) return [];

    return inventarioData
        .map((item) => ({ item, score: puntuarItem(item, tokens, frase) }))
        .filter((entrada) => entrada.score > 0)
        .sort((a, b) => b.score - a.score || String(a.item.nombre).localeCompare(String(b.item.nombre)))
        .slice(0, 5)
        .map((entrada) => entrada.item);
}

function sugerirModelosCercanos(pregunta) {
    const numerosConsulta = (normalizarTexto(pregunta).match(/\d{3,5}/g) || []).map(Number);
    if (!numerosConsulta.length) return [];

    const disponibles = new Set();
    for (const item of inventarioData) {
        const numeros = `${item.nombre || ""} ${item.modelo || ""}`.match(/\d{3,5}/g) || [];
        for (const numero of numeros) disponibles.add(Number(numero));
    }

    const referencia = numerosConsulta[0];
    return [...disponibles]
        .filter((numero) => Number.isFinite(numero))
        .sort((a, b) => Math.abs(a - referencia) - Math.abs(b - referencia))
        .slice(0, 3)
        .map(String);
}

function formatearPrecio(precio) {
    const numero = Number(precio);
    return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : String(precio ?? "N/D");
}

function formatearItem(item) {
    return [
        item.nombre,
        item.marca,
        item.modelo,
        item.precio !== null && item.precio !== undefined ? formatearPrecio(item.precio) : null,
        item.stock !== null && item.stock !== undefined ? `Stock: ${item.stock}` : null,
        item.categoria ? `Categoría: ${item.categoria}` : null,
    ]
        .filter(Boolean)
        .join(" · ");
}

function crearRespuestaInventario(pregunta) {
    if (inventarioError) {
        return "No pude cargar el inventario desde el servidor. Verifica que /api/inventory esté disponible.";
    }

    if (inventarioData.length === 0) {
        return "El inventario está vacío. Agrega datos en data/inventario.json para que el chat pueda responder con información real.";
    }

    const normalizado = normalizarTexto(pregunta);

    if (/(cuantos|cuantas|total).*(producto|articulo|item|referencia)/.test(normalizado)) {
        return `Hay ${inventarioData.length} productos en el inventario.`;
    }

    if (/\b(stock|disponible|disponibilidad|cantidad)\b/.test(normalizado)) {
        const conStock = inventarioData.filter((item) => Number(item.stock) > 0);
        if (conStock.length === 0) return "No hay productos con stock disponible en el inventario.";
        return `Hay ${conStock.length} productos disponibles con stock mayor a 0.`;
    }

    if (/\b(categoria|categorias|tipo|tipos)\b/.test(normalizado)) {
        const categorias = [
            ...new Set(inventarioData.map((item) => String(item.categoria || "").trim()).filter(Boolean)),
        ];
        if (categorias.length === 0) {
            return "No hay categorías definidas en el inventario, pero puedes buscar por nombre o precio de producto.";
        }
        return `El inventario contiene ${categorias.length} categorías: ${categorias.slice(0, 8).join(", ")}${categorias.length > 8 ? ", ..." : ""}.`;
    }

    const resultados = obtenerCoincidenciasInventario(pregunta);
    if (resultados.length === 0) {
        const sugerencias = sugerirModelosCercanos(pregunta);
        if (sugerencias.length) {
            return `No encontré coincidencias directas para "${pregunta}". ¿Quizás quisiste decir: ${sugerencias.join(", ")}? Prueba con uno de esos números o con el nombre completo del modelo.`;
        }
        return "No encontré coincidencias directas en el inventario. Prueba con otra palabra clave como nombre, categoría, marca o modelo.";
    }

    return resultados
        .slice(0, 3)
        .map((item, index) => `Resultado ${index + 1}:\n${formatearItem(item)}`)
        .join("\n\n");
}

function esSaludo(texto) {
    const normalizado = normalizarTexto(texto).replace(/\s+/g, " ");
    const saludos = new Set([
        "hola",
        "holi",
        "buenas",
        "buenos dias",
        "buen dia",
        "buenas tardes",
        "buenas noches",
        "hey",
        "hi",
        "hello",
        "saludos",
        "que tal",
        "como estas",
    ]);
    return saludos.has(normalizado);
}

function etiquetaProveedor(provider) {
    if (provider === "openai") return "IA con OpenAI";
    if (provider === "huggingface") return "IA con Hugging Face";
    return "Inventario local";
}

function construirFuentesWeb(searchResults) {
    if (!Array.isArray(searchResults) || searchResults.length === 0) return "";
    return searchResults
        .map((result, index) => {
            const titulo = truncarTexto(result.title || result.snippet || "Sin título", 120);
            const fuente = result.source || result.url || "";
            return `${index + 1}. ${titulo}${fuente ? `\n   ${fuente}` : ""}`;
        })
        .join("\n");
}

async function enviarPreguntaChat(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("chat-input");
    if (!input) return;

    const pregunta = input.value.trim();
    if (!pregunta) return;
    if (pregunta.length > MAX_PREGUNTA) {
        appendChatMessage(`La pregunta no puede superar ${MAX_PREGUNTA} caracteres.`, "assistant");
        return;
    }

    appendChatMessage(pregunta, "user");
    input.value = "";

    if (esSaludo(pregunta)) {
        setTimeout(() => {
            appendChatMessage(
                "¡Hola! Soy el asistente del cotizador. Puedes preguntarme por productos, stock, precios, categorías o compatibilidad. ¿En qué te ayudo?",
                "assistant",
            );
        }, 150);
        return;
    }

    let respuesta = null;
    let fallbackReason = null;

    if (chatMode !== "local") {
        try {
            showLoading(true);
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    question: pregunta,
                    history: chatHistory.slice(-MAX_HISTORIAL),
                }),
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data) {
                const provider = data.provider || data.source || "local";
                const aiText = String(data.answer || "").trim();

                if (provider === "local") {
                    const localResp = crearRespuestaInventario(pregunta);
                    const hasLocalUseful = localResp && !/no encontr|no se encontr/i.test(localResp.toLowerCase());
                    respuesta = hasLocalUseful ? localResp : aiText || localResp;
                } else {
                    respuesta = aiText || crearRespuestaInventario(pregunta);

                    const localMatches = obtenerCoincidenciasInventario(pregunta).slice(0, 3);
                    if (localMatches.length > 0) {
                        respuesta += `\n\nCoincidencias en inventario:\n${localMatches
                            .map((item, index) => `${index + 1}. ${formatearItem(item)}`)
                            .join("\n")}`;
                    }
                }

                const fuentesWeb = construirFuentesWeb(data.searchResults);
                if (fuentesWeb) respuesta += `\n\nFuentes web:\n${fuentesWeb}`;

                respuesta += `\n\nFuente: ${etiquetaProveedor(provider)}`;
                if (data.privacy === "local") respuesta += " · procesado localmente por privacidad";
                if (data.usedWeb) respuesta += " · búsqueda web segura";
            } else {
                fallbackReason = data?.error || `No se pudo conectar al servidor (${response.status}).`;
            }
        } catch (error) {
            fallbackReason = "Error de conexión con el servidor IA.";
        } finally {
            showLoading(false);
        }
    }

    if (!respuesta) {
        respuesta = crearRespuestaInventario(pregunta);
        if (fallbackReason) {
            respuesta += `\n\n(Respuesta local: ${fallbackReason})`;
        } else if (chatMode === "ia") {
            respuesta += "\n\n(Respuesta local porque el servidor IA no respondió.)";
        }
    }

    chatHistory.push({ role: "user", content: pregunta });
    chatHistory.push({ role: "assistant", content: respuesta });
    chatHistory = chatHistory.slice(-MAX_HISTORIAL);

    setTimeout(() => {
        appendChatMessage(respuesta, "assistant");
    }, 150);
}
