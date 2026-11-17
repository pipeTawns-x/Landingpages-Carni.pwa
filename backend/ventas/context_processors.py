"""Context every template receives from `ventas`."""

from ventas.negocio import HORARIO, NEGOCIO


def negocio(request):
    """The business data for the header and the footer of the public pages."""
    return {"negocio": NEGOCIO, "horario": HORARIO}
