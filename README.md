# Sistema Cotizador

Cotizador con chat de inventario y soporte de IA. Las claves se leen **solo** desde variables de entorno del servidor: nunca se envían al navegador.

## Estructura

- `server.js`: servidor Express local (API + cabeceras de seguridad).
- `lib/ai.js`: lógica compartida de chat, búsqueda y búsqueda web (usada por Express y por Vercel).
- `api/chat.js`, `api/inventory.js`: funciones serverless para Vercel.
- `js/features/chat.js`: chat del frontend con fallback local.
- `data/inventario.json`: inventario unificado.
- `.env.example`: plantilla de configuración sin claves reales.

## Cómo usar

1. Copia `.env.example` a `.env` y completa **tus propias** claves:

```bash
copy .env.example .env
```

2. Instala dependencias (requiere Node.js 18 o superior):

```bash
npm install
```

3. Inicia el servidor:

```bash
npm start
```

4. Abre `http://localhost:3000`.

## Variables de entorno

```text
AI_PROVIDER=auto            # auto | gemini | openai | huggingface | local
GEMINI_API_KEY=             # clave gratis de Google Gemini
GEMINI_MODEL=gemini-3.5-flash
OPENAI_API_KEY=             # clave propia de OpenAI (opcional, de pago)
OPENAI_MODEL=gpt-4o-mini
HUGGINGFACE_API_KEY=        # token de Hugging Face (opcional, requiere créditos)
HUGGINGFACE_MODEL=Qwen/Qwen2.5-7B-Instruct
SEARCH_PROVIDER=auto        # auto | google | brave | duckduckgo | none
SEARCH_API_KEY=             # Google Programmable Search (opcional)
SEARCH_ENGINE_ID=
BRAVE_SEARCH_API_KEY=       # Brave Search (opcional)
WEB_SEARCH_ENABLED=true
WEB_SEARCH_MODE=auto        # auto | always | never
AI_TIMEOUT_MS=20000
SEARCH_TIMEOUT_MS=9000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20
```

En Vercel, define estas variables en **Project Settings → Environment Variables**. No subas `.env`.

## Configuración 100% gratuita (recomendada)

No hay que instalar nada ni ejecutar procesos locales. Solo se necesita una clave gratuita de Gemini:

1. Entra a https://aistudio.google.com/app/apikey y crea una API key (tier gratuito, sin tarjeta).
2. En `.env`:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...tu_clave
SEARCH_PROVIDER=duckduckgo
```

3. Reinicia el servidor. El chat usará Gemini gratis y DuckDuckGo para búsqueda web.

Orden de proveedores en modo `auto`: **Gemini → Hugging Face → OpenAI → inventario local**. Si la IA falla, siempre cae a respuestas del inventario local (funciona sin claves).

> Nota: OpenAI y Hugging Face para chat requieren pago hoy en día. Usa `gemini` para seguir gratis. La búsqueda web con DuckDuckGo es gratis y no necesita clave.

## Seguridad y privacidad

- `AI_PROVIDER=local` desactiva por completo cualquier servicio externo.
- El endpoint `/api/inventory` solo expone campos públicos (nombre, categoría, marca, modelo, precio, stock, habilitado). Los campos internos (`costo_sin_iva`, `margen_empresa`, `es_kpc`) no se envían al navegador.
- Las consultas que contienen datos personales (correo, teléfono, tarjeta, enlaces) se procesan **solo** de forma local y no se envían a la IA ni a la búsqueda web.
- La búsqueda web es opcional, se ejecuta en el servidor y consulta un proveedor permitido (Brave, Google o DuckDuckGo).
- El contenido web se marca como no confiable para evitar inyección de instrucciones en el prompt.
- Límite de solicitudes por IP y límite de longitud de pregunta en `/api/chat`.
- Cabeceras de seguridad: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

## Verificar que no se filtren claves

Antes de subir cambios:

```bash
npm run check:secrets
```

Falla si detecta claves en archivos rastreados por git.

## Cómo funciona el chat

1. El frontend envía la pregunta a `/api/chat` (o usa solo el inventario local en modo "Solo local").
2. El servidor busca coincidencias en el inventario y decide si hace falta búsqueda web.
3. Si hay un proveedor de IA configurado y la consulta no es sensible, se genera la respuesta con IA; si no, se responde con el inventario local.
4. La respuesta incluye la fuente (`OpenAI`, `Hugging Face` o `Inventario local`) y solo las coincidencias públicas.

## Importante

- **Rotar claves:** si una clave estuvo alguna vez en un archivo versionado, revócala y genera una nueva.
- El historial del chat se limita a los últimos 6 mensajes para dar contexto sin enviar datos innecesarios.
- Si cambias `data/inventario_*.json`, regenera el inventario unificado con `scripts/merge_inventory.ps1`.
