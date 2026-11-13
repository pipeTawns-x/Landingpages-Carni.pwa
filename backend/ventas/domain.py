"""The words of the sales pages: what each code means to the staff, in Spanish.

The database speaks in codes (`pending`, `weight`, `insufficient_stock`) and the pages in
sentences. Everything that turns one into the other lives here and nowhere else, so a message is
worded once.
"""

MODE_LABELS = {"money": "Por dinero", "weight": "Por peso", "pieces": "Por piezas"}
UNITS = ("kg", "g", "lb")

STATUSES = ("pending", "confirmed", "preparing", "ready", "delivered", "cancelled")
STATUS_LABELS = {
    "pending": "Pendiente",
    "confirmed": "Confirmado",
    "preparing": "En preparación",
    "ready": "Listo",
    "delivered": "Entregado",
    "cancelled": "Cancelado",
}
CHANNEL_LABELS = {"web": "Tienda en línea", "mostrador": "Mostrador", "whatsapp": "WhatsApp"}
# A sale registered by the staff is never a `web` order: that channel is the store's own.
STAFF_CHANNELS = ("mostrador", "whatsapp")
PAYMENT_LABELS = {"efectivo": "Efectivo", "transferencia": "Transferencia", "tarjeta": "Tarjeta"}
DELIVERY_LABELS = {"pickup": "Recoger en tienda", "delivery": "Envío a domicilio"}
CURRENCY_LABELS = {"MXN": "Pesos (MXN)", "USD": "Dólares (USD)"}
DEFAULT_CURRENCY = "MXN"

# One sentence for each rule the store can refuse a sale with (`RAISE EXCEPTION '<code>: ...'`).
ERROR_MESSAGES = {
    "sale_mode_not_allowed": "Este producto no se vende de esa forma.",
    "invalid_amount": "La cantidad no es válida.",
    "fx_unavailable": "No hay un tipo de cambio vigente para cobrar en dólares.",
    "product_not_found": "Un producto del carrito ya no está disponible.",
    "insufficient_stock": "No hay existencias suficientes para confirmar este pedido.",
    "invalid_transition": "Ese cambio de estado no está permitido.",
    "too_many_lines": "El pedido tiene demasiadas líneas (el máximo es 50).",
    "too_many_pending": "Hay demasiados pedidos pendientes.",
    "not_authenticated": "La sesión terminó: entra de nuevo al panel.",
    "invalid_items": "El carrito no tiene artículos válidos.",
    "invalid_currency": "La moneda no es válida.",
    "invalid_delivery_type": "El tipo de entrega no es válido.",
    "notes_too_long": "Las notas son demasiado largas (el máximo es 500 caracteres).",
    "order_not_found": "El pedido ya no existe.",
    "invalid_status": "El estado no es válido.",
    "below_minimum_order": "El pedido no llega al mínimo para este tipo de entrega.",
}
WARNING_MESSAGES = {"low_stock": "Poco stock: puede que no alcance."}
GENERIC_REFUSAL = "La tienda no pudo registrar esto. Revisa los datos e inténtalo de nuevo."
UNAVAILABLE_MESSAGE = (
    "No se pudo hablar con la base de datos de la tienda. Inténtalo de nuevo en un momento."
)


def message_for(code):
    """Return the sentence for a code of the store, or a generic one for a code it adds later."""
    return ERROR_MESSAGES.get(code, GENERIC_REFUSAL)
