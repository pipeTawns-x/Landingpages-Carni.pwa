/*
 * The configuration of a product (ventas/tienda/producto.html), the way the CodePen dPGYMxJ
 * worked (Engram #541): only the fields of the chosen way show, the thickness shows its number,
 * and the summary under the form updates as the customer types. The number of the summary is the
 * one the store gives (ventas:producto_cotizar, JSON); the browser never computes a price.
 * Without this script the form still sends every field and the cart page shows the price.
 */
(() => {
  const form = document.querySelector("[data-configurador]");
  if (!form) return;

  const amount = form.querySelector("[data-cantidad]");
  const label = form.querySelector("[data-etiqueta-cantidad]");
  const help = form.querySelector("[data-ayuda]");
  const groups = form.querySelectorAll("[data-grupo]");
  const thickness = form.querySelector("[data-grosor]");
  const thicknessValue = form.querySelector("[data-grosor-valor]");
  const summaryText = form.querySelector("[data-resumen-texto]");
  const summaryPrice = form.querySelector("[data-resumen-precio]");

  const WAYS = {
    weight: { label: "¿Cuánto quieres?", help: "Elige kilos, gramos o libras.", step: "any", min: "0.001" },
    money: { label: "¿Cuánto quieres gastar?", help: "En pesos: cortamos lo que alcance.", step: "any", min: "1" },
    pieces: { label: "¿Cuántas piezas?", help: "Piezas enteras; el peso final lo da la báscula.", step: "1", min: "1" },
  };
  const mode = () => form.querySelector("[data-modo]:checked")?.value || "weight";
  const unit = () => form.querySelector('[name="unit"]:checked')?.value || "kg";
  const money = (value) =>
    Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const describe = () => {
    const value = amount.value.trim();
    if (!value) return "";
    if (mode() === "money") return `${money(value)} de corte`;
    if (mode() === "weight") return `${value} ${unit()}`;
    const pieces = `${value} ${value === "1" ? "pieza" : "piezas"}`;
    return thickness ? `${pieces} de ${thickness.value}"` : pieces;
  };

  let timer = 0;
  let asked = 0;
  const quote = () => {
    clearTimeout(timer);
    const text = describe();
    if (!text || Number(amount.value) <= 0) {
      summaryText.textContent = "Escribe la cantidad para ver tu subtotal.";
      summaryPrice.textContent = "";
      return;
    }
    summaryText.textContent = text;
    summaryPrice.textContent = "…";
    summaryPrice.setAttribute("aria-busy", "true");
    timer = setTimeout(async () => {
      const ticket = ++asked;
      const params = new URLSearchParams({ mode: mode(), amount: amount.value.trim() });
      if (mode() === "weight") params.set("unit", unit());
      if (mode() === "pieces" && thickness) params.set("thickness_in", thickness.value);
      try {
        const response = await fetch(`${form.dataset.cotizar}?${params}`, {
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (ticket !== asked) return;
        summaryPrice.removeAttribute("aria-busy");
        if (!response.ok) {
          summaryPrice.textContent = "";
          summaryText.textContent = data.error || "No pudimos calcularlo ahora.";
          return;
        }
        const kilos = Number(data.kg).toLocaleString("es-MX", { maximumFractionDigits: 3 });
        summaryText.textContent = mode() === "weight" ? text : `${text} · aprox. ${kilos} kg`;
        summaryPrice.textContent = money(data.total);
      } catch {
        if (ticket === asked) {
          summaryPrice.removeAttribute("aria-busy");
          summaryPrice.textContent = "";
        }
      }
    }, 250);
  };

  const showWay = () => {
    const way = WAYS[mode()];
    groups.forEach((group) => {
      group.hidden = group.dataset.grupo !== mode();
    });
    label.textContent = way.label;
    help.textContent = way.help;
    amount.step = way.step;
    amount.min = way.min;
    amount.inputMode = mode() === "pieces" ? "numeric" : "decimal";
    quote();
  };

  form.addEventListener("change", (event) => {
    if (event.target.matches("[data-modo]")) showWay();
    else quote();
  });
  amount.addEventListener("input", quote);
  if (thickness && thicknessValue) {
    thickness.addEventListener("input", () => {
      thicknessValue.textContent = `${thickness.value}"`;
      thickness.setAttribute("aria-valuetext", `${thickness.value} pulgadas`);
      quote();
    });
  }
  showWay();
})();
