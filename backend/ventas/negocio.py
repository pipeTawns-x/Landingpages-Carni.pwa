"""The business data every public page shows: name, motto, contact and opening hours.

It is the same data the store kept in src/data/negocio.ts, moved here when the pages moved into
Django, so the header and the footer of the templates read one source. No e-mail: the business
answers by phone and WhatsApp.
"""

from urllib.parse import quote

_ADDRESS = ("Agua Marina 110, Manuel J. Othón", "78150 San Luis Potosí, S.L.P.")

NEGOCIO = {
    "nombre": "Carnicería El Señor de La Misericordia",
    "lema": "Siempre contando con la mejor calidad y frescura",
    "telefono": "+52 444 271 5470",
    "telefono_href": "tel:+524442715470",
    "whatsapp_href": "https://wa.me/524442715470",
    "direccion": _ADDRESS,
    "mapa_href": "https://www.google.com/maps/search/?api=1&query="
    + quote("Agua Marina 110, Manuel J. Othón, 78150 San Luis Potosí"),
    "facebook": "https://www.facebook.com/profile.php?id=100054786668816",
    "instagram": "https://www.instagram.com/carniceria.misericordia/",
}

HORARIO = {
    "dias": "Lunes a sábado",
    "abre": "8:00",
    "cierra": "17:00",
    "cerrado": "Domingos y festivos, cerrado",
}
