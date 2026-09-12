// =============================================================
// Asistente virtual — chatbot flotante (práctica LMS M44)
// -------------------------------------------------------------
// Burbuja fija abajo a la derecha (estilo Kakobuy / Crisp) que
// abre un panel con cabecera, historial y campo de mensaje.
//
// - Respuestas por coincidencia de palabras clave contra el
//   objeto `responses` (requisito base de la práctica).
// - Historial SIEMPRE en localStorage (restaura offline).
// - Envío adicional a Supabase, fire-and-forget, solo si las
//   variables VITE_* están presentes; falla en silencio.
//
// Cargado con <script type="module"> en las tres páginas
// públicas: index.html, products.html y accessweb.html.
// Variables de entorno vía import.meta.env (Vite), igual que
// js/modules/supabase.js. Sin secretos hardcodeados.
// =============================================================

const STORAGE_KEY = 'carni_chat_history';
const SESSION_KEY = 'carni_chat_session';
const MAX_HISTORY = 100;

// ── Datos reales del negocio (los mismos que index.html) ──────
// Tomados del marcado y el schema.org de la landing; si cambian
// allá, cambian aquí.
const BUSINESS = {
  name: 'Carnicería El Señor de La Misericordia',
  phone: '+52 444 271 5470',
  whatsapp: 'https://wa.me/524442715470',
  address: 'Agua Marina 110, Manuel J. Othon, 78150 San Luis Potosí, S.L.P.',
  hours: 'Lunes a sábado de 8:00 a 17:00; domingos y festivos cerrado',
  email: 'contacto@carniceriamisericordia.com'
};

// ── Respuestas predefinidas (requisito M44) ───────────────────
const responses = {
  hola:
    '¡Hola! ¿Cómo estás? 👋 Soy el asistente virtual de Carnicería El Señor de La Misericordia. Pregúntame por productos, horarios, precios, envíos o pedidos: en cuanto pueda te ayudo.',
  productos:
    'Trabajamos cortes premium de res (arrachera, ribeye, T-bone), cerdo, pollo, embutidos, productos preparados y merch de la casa.\n\nMirá el catálogo completo en nuestra tienda: products.html 🥩',
  horarios:
    `Nuestro horario de atención es:\n\n${BUSINESS.hours}.\n\n¿Te esperamos en sucursal o preferís pedir a domicilio?`,
  ubicacion:
    `Estamos en ${BUSINESS.address}.\n\nEn la sección "Sobre Nosotros" de la página de inicio hay un botón para abrir la ubicación en Google Maps.`,
  precios:
    'Los precios varían por corte y gramaje: arrachera $289/kg, ribeye $399/kg, T-bone $349/kg, por ejemplo.\n\nEl precio exacto lo ves en cada producto de la tienda: products.html',
  pedidos:
    `Para pedir, armá tu carrito en la tienda y elegí envío o retiro; también podés escribirnos por WhatsApp y te lo preparamos: ${BUSINESS.whatsapp}\n\nO llamanos al ${BUSINESS.phone} 📞`,
  envios:
    'Hacemos entregas a domicilio en zonas participantes de San Luis Potosí. Agregá tus cortes al carrito y al finalizar elegí la opción de envío para confirmar si tu zona está cubierta. 🚚',
  gracias:
    '¡De nada! 😊 Para eso estoy. Cualquier otra duda, aquí seguimos.',
  despedida:
    '¡Gracias por escribirnos! Que tengas un excelente día. Si necesitás algo más, estoy a un mensaje. 🥩🙌',
  default:
    'No estoy seguro de haber entendido. Puedo ayudarte con:\n\n• Productos y cortes\n• Horarios\n• Ubicación\n• Precios\n• Pedidos y WhatsApp\n• Envíos a domicilio\n\n¿Sobre cuál me preguntás?'
};

// Cada intento escucha varias palabras; la PRIMERA coincidencia
// gana. Los intentos de pregunta van primero para que "hola, ¿hacen
// envíos?" conteste envíos y no un saludo.
const intentKeywords = [
  { intent: 'envios', keywords: ['envio', 'domicilio', 'delivery', 'reparto', 'entrega', 'mandan', 'llevan', 'reparten'] },
  { intent: 'pedidos', keywords: ['pedir', 'pedido', 'orden', 'comprar', 'encargar', 'whatsapp', 'telefono', 'llamar', 'contacto'] },
  { intent: 'precios', keywords: ['precio', 'cuanto', 'costo', 'costar', 'vale', 'cuesta', 'tarifa'] },
  { intent: 'horarios', keywords: ['horario', 'hora', 'abren', 'abierto', 'cierran', 'atienden'] },
  { intent: 'ubicacion', keywords: ['ubicacion', 'donde', 'direccion', 'estan', 'sucursal', 'maps', 'mapa', 'llegar', 'ubican'] },
  { intent: 'productos', keywords: ['producto', 'corte', 'carne', 'res', 'cerdo', 'pollo', 'ribeye', 'arrachera', 't bone', 'tbone', 'embutido', 'chorizo', 'catalogo', 'venden', 'tienen'] },
  { intent: 'gracias', keywords: ['gracias', 'genial', 'perfecto', 'excelente'] },
  { intent: 'despedida', keywords: ['adios', 'hasta luego', 'nos vemos', 'chao', 'bye', 'hasta pronto'] },
  { intent: 'hola', keywords: ['hola', 'buenas', 'saludos', 'que tal', 'hey', 'buen dia', 'buenos dias', 'buenas tardes'] }
];

// ── Utilidades ────────────────────────────────────────────────

/** Normaliza el texto: minúsculas y sin acentos, para que
 *  "¿Dónde están?" matchee "donde" sin tablas de sinónimos. */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Genera la respuesta del asistente a partir del mensaje. */
function generateResponse(message) {
  const text = normalize(message);
  if (!text) return '';

  for (const { intent, keywords } of intentKeywords) {
    if (keywords.some((keyword) => text.includes(normalize(keyword)))) {
      return responses[intent];
    }
  }

  return responses.default;
}

// ── Sesión e historial (localStorage) ─────────────────────────

function getSessionId() {
  let id = null;
  try {
    id = localStorage.getItem(SESSION_KEY);
  } catch (error) {
    /* almacenamiento no disponible: se genera por sesión de página */
  }

  if (!id) {
    id = `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch (error) {
      /* sin persistencia: la sesión vive solo en memoria */
    }
  }

  return id;
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch (error) {
    /* cuota o modo privado: el chat sigue, sin historial */
  }
}

// ── Persistencia en Supabase (fire-and-forget) ────────────────

/** Inserta un mensaje en public.chat_messages vía REST.
 *  Fire-and-forget: cualquier fallo (red, RLS, config ausente)
 *  se traga en silencio; el chat jamás depende de esto. */
function persistToSupabase(role, message) {
  const env =
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      role,
      message,
      page_url: window.location.pathname || '/',
      session_id: getSessionId()
    })
  }).catch(() => {
    /* silencioso a propósito: la red no debe romper el chat */
  });
}

// ── Render y flujo del chat ───────────────────────────────────

/** Crea el elemento del mensaje, lo agrega al contenedor y lo
 *  persiste (localStorage + Supabase). */
function appendMessage(role, message, { persist = true } = {}) {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${role}`;
  bubble.textContent = message;
  messagesEl.appendChild(bubble);

  if (persist) {
    history.push({ role, message, at: new Date().toISOString() });
    saveHistory(history);
    persistToSupabase(role, message);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/** Captura el input, agrega el mensaje del usuario y responde. */
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = (input && input.value.trim()) || '';
  if (!message) return;

  input.value = '';
  appendMessage('user', message);

  const reply = generateResponse(message);
  if (reply) {
    appendMessage('bot', reply);
  }

  input.focus();
}

/** Historial en memoria de la sesión actual. */
const history = loadHistory();

/** Renderiza el historial guardado (offline / recarga). */
function renderHistory() {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;

  messagesEl.innerHTML = '';
  history.forEach((entry) => {
    if (entry && typeof entry.message === 'string') {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble chat-bubble--${entry.role === 'user' ? 'user' : 'bot'}`;
      bubble.textContent = entry.message;
      messagesEl.appendChild(bubble);
    }
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Abrir / cerrar / inicializar ──────────────────────────────

function setOpen(open) {
  const widget = document.querySelector('[data-carni-chat]');
  if (!widget) return;

  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');

  widget.classList.toggle('chat-widget--open', open);

  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual');
  }
  if (panel) {
    panel.setAttribute('aria-hidden', String(!open));
  }

  if (open) {
    const input = document.getElementById('chatInput');
    if (input) {
      window.setTimeout(() => input.focus(), 250);
    }
  }
}

function initChat() {
  const widget = document.querySelector('[data-carni-chat]');
  if (!widget) return;

  const toggle = document.getElementById('chatToggle');
  const closeBtn = document.getElementById('chatClose');
  const form = document.getElementById('chatForm');

  // Mensaje de bienvenida solo la primera vez.
  if (history.length === 0) {
    appendMessage('bot', responses.hola);
  } else {
    renderHistory();
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = widget.classList.contains('chat-widget--open');
      setOpen(!isOpen);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => setOpen(false));
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage();
    });
  }

  // Esc: cierra el panel.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && widget.classList.contains('chat-widget--open')) {
      setOpen(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}

// Expuesto en window para la evaluación de la práctica (M44) y para
// pruebas manuales desde consola: CarniChat.sendMessage('hola').
export { sendMessage, generateResponse, responses };

window.CarniChat = { sendMessage, generateResponse, responses };