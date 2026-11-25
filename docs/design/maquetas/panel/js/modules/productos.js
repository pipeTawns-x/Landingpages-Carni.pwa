// Productos: admin table over the real catalog plus the product editor dialog.
// Edits live only in memory for the mockup; nothing is saved anywhere.
(function () {
  "use strict";
  var D = window.CARNI_DATA, UI = window.CARNI_UI;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = UI.el, icon = UI.icon, num = UI.num;
  var mxn2 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });
  var usd = new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  var UNIT = { kg: "kg", piece: "pieza", package: "paquete" };
  var MODE = { weight: "Por peso", money: "Por precio", pieces: "Por pieza" };
  var MODE_SHORT = { weight: "Peso", money: "Precio", pieces: "Pieza" };
  var state = { q: "", cat: "", low: false, sort: { key: "", dir: "ascending" } };
  var collator = new Intl.Collator("es-MX", { numeric: true, sensitivity: "base" });
  var nextId = 1000;

  function unitWord(p, n) { return p.unit === "kg" ? "kg" : p.unit === "package" ? (n === 1 ? "paquete" : "paquetes") : (n === 1 ? "pieza" : "piezas"); }
  function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  // ---------- Filters ----------
  var chips = $("#catChips");
  function buildChips() {
    chips.textContent = "";
    [{ slug: "", name: "Todas" }].concat(D.categories).forEach(function (c) {
      var b = el("button", null, c.name); b.type = "button"; b.setAttribute("role", "radio");
      b.dataset.cat = c.slug; b.setAttribute("aria-checked", String(c.slug === state.cat));
      chips.appendChild(b);
    });
    UI.bindSeg(chips, function (b) { state.cat = b.dataset.cat; render(); });
  }
  $("#prodSearch").addEventListener("input", function (e) { state.q = e.target.value; render(); });
  $("#lowOnly").addEventListener("change", function (e) { state.low = e.target.checked; render(); });

  // ---------- Sorting ----------
  // Mockup-only SKU: the seed has no SKU column, so it is derived (category initials + id) and labeled as such.
  function sku(p) {
    var parts = p.cat.split("-");
    var pre = parts.length > 1 ? parts.map(function (w) { return w[0]; }).join("") : parts[0].slice(0, 3);
    return pre.toUpperCase() + "-" + String(p.id).padStart(3, "0");
  }
  // Packages in the "ofertas" category are already promo-priced in the seed; a toggled offer without a price says so.
  function currentOffer(p) { return p.offer && p.offerPrice ? p.offerPrice : null; }
  var SORT_VALUE = {
    name: function (p) { return p.name; },
    cat: function (p) { return D.category(p.cat).name; },
    price: function (p) { return p.price; },
    offer: currentOffer,
    stock: function (p) { return p.stock; }
  };
  var SORT_LABEL = { name: "Producto", cat: "Categoría", price: "Precio", offer: "Precio oferta", stock: "Stock" };
  function sortList(list) {
    var key = state.sort.key; if (!key) return list;
    var get = SORT_VALUE[key], f = state.sort.dir === "ascending" ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var va = get(a), vb = get(b);
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1; // "Sin oferta" always last
      return f * (typeof va === "string" ? collator.compare(va, vb) : va - vb);
    });
  }
  var heads = $$(".ptable th[data-sort]");
  var sortSel = $("#sortSel");
  function setSort(key, dir, announce) {
    state.sort = { key: key, dir: dir };
    heads.forEach(function (th) {
      if (key && th.dataset.sort === key) th.setAttribute("aria-sort", dir); else th.removeAttribute("aria-sort");
    });
    sortSel.value = key ? key + ":" + dir : "";
    var n = render();
    if (announce) $("#sortStatus").textContent = key
      ? "Ordenado por " + SORT_LABEL[key] + ", " + (dir === "ascending" ? "ascendente" : "descendente") + ", " + n + " productos."
      : "Orden del catálogo, " + n + " productos.";
  }
  heads.forEach(function (th) {
    th.querySelector("button").addEventListener("click", function () {
      var k = th.dataset.sort;
      setSort(k, state.sort.key === k && state.sort.dir === "ascending" ? "descending" : "ascending", true);
    });
  });
  sortSel.addEventListener("change", function () {
    var v = sortSel.value.split(":"); setSort(v[0] || "", v[1] || "ascending", true);
  });

  // ---------- Table ----------
  var body = $("#prodBody");
  function switchCell(p, key, label) {
    var lab = el("label", "switch");
    var inp = el("input"); inp.type = "checkbox"; inp.setAttribute("role", "switch"); inp.setAttribute("switch", "");
    inp.checked = !!p[key]; inp.setAttribute("aria-label", label + ": " + p.name);
    inp.addEventListener("change", function () {
      p[key] = inp.checked;
      if (key === "offer") p.tags.oferta = inp.checked;
      UI.toast(p.name + ": " + label.toLowerCase() + " " + (inp.checked ? "activado" : "desactivado") + ".");
      if (key === "offer") render();
    });
    lab.appendChild(inp); var ui = el("span", "switch__ui"); ui.setAttribute("aria-hidden", "true"); lab.appendChild(ui);
    var wrap = el("span", "swcell"); wrap.appendChild(lab);
    var txt = el("span", "swcell__txt", inp.checked ? "Sí" : "No"); txt.setAttribute("aria-hidden", "true"); wrap.appendChild(txt);
    inp.addEventListener("change", function () { txt.textContent = inp.checked ? "Sí" : "No"; });
    return wrap;
  }
  function render() {
    var q = norm(state.q.trim());
    var list = D.products.filter(function (p) {
      return (!state.cat || p.cat === state.cat) && (!q || norm(p.name).indexOf(q) >= 0) && (!state.low || p.stock < p.lowAt);
    });
    list = sortList(list);
    body.textContent = "";
    list.forEach(function (p) {
      var tr = el("tr");
      var c0 = el("td"); var pc = el("div", "pcell");
      var img = el("img"); img.src = D.IMG + p.img; img.alt = ""; img.width = 48; img.height = 48; img.loading = "lazy"; img.decoding = "async";
      var tx = el("div"); tx.appendChild(el("b", null, p.name));
      var sk = el("small", "pcell__sku", sku(p)); sk.title = "SKU de maqueta: categoría + id del seed"; tx.appendChild(sk);
      tx.appendChild(el("small", null, p.desc));
      pc.appendChild(img); pc.appendChild(tx); c0.appendChild(pc); tr.appendChild(c0);
      var c1 = el("td"); c1.dataset.label = "Categoría"; c1.appendChild(el("span", null, D.category(p.cat).name)); tr.appendChild(c1);
      var c2 = el("td", "num"); c2.dataset.label = "Precio";
      var pv = el("span", "pricev", mxn2.format(p.price)); pv.appendChild(el("small", null, " / " + UNIT[p.unit])); c2.appendChild(pv);
      tr.appendChild(c2);
      var co = el("td", "num"); co.dataset.label = "Precio oferta"; var op = currentOffer(p);
      co.appendChild(op ? el("b", "offerv", mxn2.format(op)) : el("span", "nooffer", !p.offer ? "Sin oferta" : p.cat === "ofertas" ? "Precio de promoción" : "Falta precio"));
      tr.appendChild(co);
      var c3 = el("td"); c3.dataset.label = "Modos de venta"; var mw = el("span");
      // Compact one-line list; the offer state has its own column now.
      mw.className = "modes-txt"; mw.textContent = p.modes.map(function (m) { return MODE_SHORT[m]; }).join(" · ");
      mw.title = p.modes.map(function (m) { return MODE[m]; }).join(", ");
      c3.appendChild(mw); tr.appendChild(c3);
      var c4 = el("td", "num"); c4.dataset.label = "Stock";
      var sv = el("span", "stockv" + (p.stock < p.lowAt ? " is-low" : ""), num.format(p.stock) + " ");
      sv.appendChild(el("small", null, unitWord(p, p.stock)));
      c4.appendChild(sv); tr.appendChild(c4);
      var c5 = el("td"); c5.dataset.label = "Disponible"; c5.appendChild(switchCell(p, "active", "Disponible")); tr.appendChild(c5);
      var c6 = el("td"); c6.dataset.label = "Oferta"; c6.appendChild(switchCell(p, "offer", "Oferta")); tr.appendChild(c6);
      var c7 = el("td"); var act = el("div", "rowact");
      var eb = el("button", "iconbtn"); eb.type = "button"; eb.setAttribute("aria-label", "Editar " + p.name); eb.appendChild(icon("pencil"));
      eb.addEventListener("click", function () { openEditor(p, eb); });
      var db = el("button", "iconbtn del"); db.type = "button"; db.setAttribute("aria-label", "Borrar " + p.name); db.appendChild(icon("trash"));
      db.addEventListener("click", function () { confirmDelete(p, db); });
      act.appendChild(eb); act.appendChild(db); c7.appendChild(act); tr.appendChild(c7);
      body.appendChild(tr);
    });
    $("#prodEmpty").hidden = list.length > 0;
    var low = D.products.filter(function (p) { return p.stock < p.lowAt; }).length;
    $("#prodSub").textContent = list.length + " de " + D.products.length + " productos · " + D.categories.length + " categorías de supabase/seed.sql · " + low + " con stock bajo · SKU de maqueta (categoría + id)";
    return list.length;
  }

  // ---------- Delete with confirmation ----------
  var confirmDlg = $("#confirmDlg");
  function confirmDelete(p, trigger) {
    $("#confirmText").textContent = "\"" + p.name + "\" sale del catálogo y deja de verse en la tienda. Los pedidos pasados lo conservan. En la maqueta no se guarda nada.";
    confirmDlg.returnValue = "";
    UI.openDialog(confirmDlg, trigger);
    confirmDlg.addEventListener("close", function onClose() {
      confirmDlg.removeEventListener("close", onClose);
      if (confirmDlg.returnValue === "ok") {
        var i = D.products.indexOf(p); if (i >= 0) D.products.splice(i, 1);
        render();
        UI.toast(p.name + " se borró de la maqueta.", "Deshacer", function () { D.products.splice(i, 0, p); render(); UI.toast(p.name + " volvió al catálogo."); });
        var focusTo = $("#prodSearch"); setTimeout(function () { focusTo.focus(); }, 0);
      }
    });
  }

  // ---------- Editor ----------
  var dlg = $("#prodDlg"), form = $("#prodForm");
  var draft = null, editing = null;
  var tabs = $$("#ptabs [role=tab]");
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") n = tabs[0];
      if (e.key === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  var catSel = $("#f-cat");
  D.categories.forEach(function (c) { var o = el("option", null, c.name); o.value = c.slug; catSel.appendChild(o); });

  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fresh() {
    return {
      id: null, name: "", desc: "", cat: "carnes-rojas", price: 0, cost: 0, unit: "kg", modes: ["money", "weight"], img: "res.webp",
      images: ["res.webp"], stock: 0, lowAt: 15, min: 0.25, source: "Despiece propio", pw: "", tol: 10, feat: "",
      tags: { oferta: false, destacado: false, nuevo: true },
      offer: { on: false, type: "pct", value: 10, from: iso(D.TODAY), to: iso(D.addDays(D.TODAY, 7)), tiers: ["Regular", "Premium", "VIP"] },
    };
  }
  function fromProduct(p) {
    var detalle = p.img.replace(".webp", "-detalle.webp");
    var d = fresh();
    d.cost = p.cost != null ? p.cost : Math.round(p.price * D.COST_RATIO[p.cat] * 100) / 100;
    d.id = p.id; d.name = p.name; d.desc = p.desc; d.cat = p.cat; d.price = p.price; d.unit = p.unit; d.modes = p.modes.slice();
    d.img = p.img; d.images = [p.img, detalle]; d.stock = p.stock; d.lowAt = p.lowAt; d.min = p.min; d.source = p.source;
    d.tags = { oferta: !!p.offer, destacado: !!p.tags.destacado, nuevo: !!p.tags.nuevo };
    d.offer.on = !!p.offer;
    if (p.cat === "cortes-especiales" && p.unit === "kg") { d.pw = p.name === "Tomahawk" ? "1.35" : ""; }
    return d;
  }
  function fill() {
    form.elements.name.value = draft.name; form.elements.desc.value = draft.desc; catSel.value = draft.cat;
    form.elements["t-oferta"].checked = draft.tags.oferta; form.elements["t-destacado"].checked = draft.tags.destacado; form.elements["t-nuevo"].checked = draft.tags.nuevo;
    form.elements.feat.value = draft.feat;
    form.elements.price.value = draft.price ? draft.price.toFixed(2) : "";
    form.elements.unit.value = draft.unit;
    form.elements.cost.value = draft.cost ? draft.cost.toFixed(2) : "";
    form.elements["m-weight"].checked = draft.modes.indexOf("weight") >= 0;
    form.elements["m-money"].checked = draft.modes.indexOf("money") >= 0;
    form.elements["m-pieces"].checked = draft.modes.indexOf("pieces") >= 0;
    form.elements.pw.value = draft.pw; form.elements.tol.value = draft.tol;
    $("#offerOn").checked = draft.offer.on;
    form.elements.offer.value = draft.offer.value; form.elements.from.value = draft.offer.from; form.elements.to.value = draft.offer.to;
    $$("#tiers input").forEach(function (c) { c.checked = draft.offer.tiers.indexOf(c.value) >= 0; });
    $$("#offerType [role=radio]").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.type === draft.offer.type)); b.tabIndex = b.dataset.type === draft.offer.type ? 0 : -1; });
    form.elements.src.value = draft.source; form.elements.stock.value = draft.stock; form.elements.low.value = draft.lowAt; form.elements.min.value = draft.min;
    $$(".err", form).forEach(function (e) { e.hidden = true; });
    $$("[aria-invalid]", form).forEach(function (e) { e.removeAttribute("aria-invalid"); });
    renderImages(); sync();
  }
  function parseNum(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; }
  function readForm() {
    draft.name = form.elements.name.value; draft.desc = form.elements.desc.value; draft.cat = catSel.value;
    draft.tags.oferta = form.elements["t-oferta"].checked; draft.tags.destacado = form.elements["t-destacado"].checked; draft.tags.nuevo = form.elements["t-nuevo"].checked;
    draft.feat = form.elements.feat.value;
    draft.price = parseNum(form.elements.price.value) || 0;
    draft.unit = form.elements.unit.value;
    draft.cost = parseNum(form.elements.cost.value) || 0;
    var m = [];
    if (form.elements["m-money"].checked) m.push("money");
    if (form.elements["m-weight"].checked) m.push("weight");
    if (form.elements["m-pieces"].checked) m.push("pieces");
    draft.modes = m;
    draft.pw = form.elements.pw.value; draft.tol = form.elements.tol.value;
    draft.offer.on = $("#offerOn").checked;
    draft.offer.value = parseNum(form.elements.offer.value);
    draft.offer.from = form.elements.from.value; draft.offer.to = form.elements.to.value;
    draft.offer.tiers = $$("#tiers input").filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    draft.source = form.elements.src.value; draft.stock = parseNum(form.elements.stock.value) || 0;
    draft.lowAt = parseNum(form.elements.low.value) || 0; draft.min = parseNum(form.elements.min.value) || 0;
  }
  function offerPrice() {
    if (!draft.offer.on || !(draft.offer.value > 0)) return null;
    var v = draft.offer.type === "pct" ? draft.price * (1 - Math.min(draft.offer.value, 90) / 100) : draft.offer.value;
    return v > 0 && v < draft.price ? v : null;
  }
  // Keeps dependent fields coherent and repaints the live customer card.
  function sync() {
    var perUnit = draft.unit !== "kg";
    // Schema rule: piece or package prices only allow "pieces" (products_piece_price_needs_pieces).
    ["m-weight", "m-money"].forEach(function (n) { form.elements[n].disabled = perUnit; if (perUnit) form.elements[n].checked = false; });
    if (perUnit) { form.elements["m-pieces"].checked = true; form.elements["m-pieces"].disabled = true; }
    else form.elements["m-pieces"].disabled = false;
    readForm();
    var u = UNIT[draft.unit];
    $("#f-price-label").textContent = "Precio por " + u;
    $("#f-usd").textContent = draft.price > 0 ? "Equivale a " + usd.format(draft.price / D.FX_SAMPLE) + " por " + u + " con la tasa del panel ($" + D.FX_SAMPLE.toFixed(2) + " de muestra)." : "Se muestra también en dólares con la tasa del panel.";
    $("#f-cost-label").textContent = "Precio de compra por " + u;
    $("#f-margin").textContent = draft.cost > 0 && draft.price > 0 ? "Margen " + num.format(Math.round((1 - draft.cost / draft.price) * 1000) / 10) + " % (costo de muestra)." : "Con el costo se calcula el margen.";
    $("#pieceRow").hidden = draft.modes.indexOf("pieces") < 0 || perUnit;
    var unitLabel = draft.unit === "kg" ? "kg" : "piezas";
    $("#f-stock-label").textContent = "Stock (" + unitLabel + ")";
    $("#f-low-label").textContent = "Avisar con stock bajo en (" + unitLabel + ")";
    $("#f-min-label").textContent = draft.unit === "kg" ? "Mínimo por pedido (kg)" : "Mínimo por pedido (piezas)";
    var ob = $("#offerBody"); if (draft.offer.on) ob.removeAttribute("inert"); else ob.setAttribute("inert", "");
    $("#f-offer-label").textContent = draft.offer.type === "pct" ? "Descuento (%)" : "Precio de oferta por " + u + " ($)";
    // Stock state
    var ss = $("#stockState"); ss.textContent = "";
    var isLow = draft.stock < draft.lowAt;
    ss.appendChild(el("span", null, isLow ? "Por debajo del umbral: aparecerá en Stock bajo." : "Stock suficiente."));
    var tr = el("div", "track"); var f = el("div", "fill" + (isLow ? " is-low" : ""));
    f.style.transform = "scaleX(" + Math.max(0.02, Math.min(1, draft.lowAt ? draft.stock / (draft.lowAt * 4) : 1)).toFixed(3) + ")";
    tr.appendChild(f); ss.appendChild(tr);
    renderCard();
  }
  function renderCard() {
    var c = $("#pcard"); c.textContent = "";
    var im = el("div", "pcard__img"); var img = el("img"); img.src = D.IMG + (draft.images[0] || draft.img); img.alt = ""; img.width = 320; img.height = 240; im.appendChild(img);
    var bd = el("div", "pcard__badges");
    var op = offerPrice();
    if (op != null) bd.appendChild(el("span", "b-offer", draft.offer.type === "pct" ? "-" + num.format(draft.offer.value) + "%" : "Oferta"));
    if (draft.tags.destacado) bd.appendChild(el("span", null, "Destacado"));
    if (draft.tags.nuevo) bd.appendChild(el("span", null, "Nuevo"));
    im.appendChild(bd); c.appendChild(im);
    var b = el("div", "pcard__body");
    b.appendChild(el("b", null, draft.name || "Nombre del producto"));
    b.appendChild(el("p", null, draft.desc || "La descripción aparece aquí."));
    var pr = el("div", "pcard__price");
    var u = UNIT[draft.unit];
    if (op != null) {
      pr.appendChild(el("strong", null, mxn2.format(op)));
      pr.appendChild(el("s", null, mxn2.format(draft.price)));
      pr.appendChild(el("em", null, "por " + u));
    } else {
      pr.appendChild(el("strong", null, draft.price ? mxn2.format(draft.price) : "$0.00"));
      pr.appendChild(el("em", null, "por " + u));
    }
    b.appendChild(pr);
    if (draft.price) b.appendChild(el("p", null, "≈ " + usd.format((op || draft.price) / D.FX_SAMPLE) + " por " + u));
    var md = el("div", "pcard__modes");
    draft.modes.forEach(function (m) { md.appendChild(el("span", "tag", MODE[m])); });
    b.appendChild(md);
    b.appendChild(el("div", "pcard__btn", draft.unit === "kg" ? "Elegir cantidad" : "Agregar al carrito"));
    c.appendChild(b);
    var note = $("#tierNote");
    if (op != null) {
      var dates = draft.offer.from && draft.offer.to ? " del " + draft.offer.from.split("-").reverse().join("/") + " al " + draft.offer.to.split("-").reverse().join("/") : "";
      note.textContent = draft.offer.tiers.length ? "Precio de oferta" + dates + " solo para: " + draft.offer.tiers.join(", ") + ". Los demás ven " + mxn2.format(draft.price) + "." : "Ningún nivel de lealtad seleccionado: nadie verá la oferta.";
    } else note.textContent = "Sin oferta activa: todos los niveles ven el precio normal.";
  }
  function renderImages() {
    var ul = $("#imgList"); ul.textContent = "";
    draft.images.forEach(function (name, i) {
      var li = el("li"); var img = el("img"); img.src = D.IMG + name; img.alt = "Imagen " + (i + 1) + " de " + (draft.name || "producto"); img.width = 240; img.height = 180; img.loading = "lazy";
      var cap = el("div", "cap"); cap.appendChild(el("span", i === 0 ? "main" : null, i === 0 ? "Principal" : name.indexOf("detalle") >= 0 ? "Detalle" : "Imagen " + (i + 1)));
      var acts = el("span");
      if (i > 0) {
        var up = el("button", "iconbtn"); up.type = "button"; up.setAttribute("aria-label", "Usar como principal"); up.appendChild(icon("star", "i--sm"));
        up.addEventListener("click", function () { draft.images.splice(i, 1); draft.images.unshift(name); renderImages(); renderCard(); });
        acts.appendChild(up);
      }
      var rm = el("button", "iconbtn"); rm.type = "button"; rm.setAttribute("aria-label", "Quitar imagen " + (i + 1)); rm.appendChild(icon("x", "i--sm"));
      rm.addEventListener("click", function () { if (draft.images.length > 1) { draft.images.splice(i, 1); renderImages(); renderCard(); } else UI.toast("El producto necesita al menos una imagen."); });
      acts.appendChild(rm); cap.appendChild(acts);
      li.appendChild(img); li.appendChild(cap); ul.appendChild(li);
    });
  }
  $("#addImg").addEventListener("click", function () {
    var cat = D.category(catSel.value);
    var extra = cat ? cat.img : "premium.webp";
    if (draft.images.indexOf(extra) >= 0) extra = "premium.webp";
    draft.images.push(extra); renderImages(); UI.toast("En la maqueta se agrega la foto de la categoría; en el panel real se sube el archivo.");
  });
  UI.bindSeg($("#offerType"), function (b) { draft.offer.type = b.dataset.type; if (b.dataset.type === "price" && draft.price) form.elements.offer.value = (draft.price * 0.9).toFixed(2); if (b.dataset.type === "pct") form.elements.offer.value = 10; sync(); });
  form.addEventListener("input", sync);
  form.addEventListener("change", function (e) {
    // The "Oferta" tag and the offer switch are the same fact: keep them in step.
    if (e.target.name === "t-oferta") $("#offerOn").checked = e.target.checked;
    if (e.target.id === "offerOn") form.elements["t-oferta"].checked = e.target.checked;
    sync();
  });

  function openEditor(p, trigger) {
    editing = p || null;
    draft = p ? fromProduct(p) : fresh();
    $("#prodDlgTitle").textContent = p ? "Editar " + p.name : "Nuevo producto";
    $("#prodDlgMeta").textContent = p ? D.category(p.cat).name + " · fila " + p.line + " de supabase/seed.sql" : "Los cambios de la maqueta no se guardan.";
    $("#saveHint").textContent = "";
    fill(); selectTab(tabs[0]);
    UI.openDialog(dlg, trigger);
    form.elements.name.focus();
  }
  function invalid(field, errId, msg) {
    field.setAttribute("aria-invalid", "true"); field.setAttribute("aria-describedby", errId);
    var e = $("#" + errId); if (msg) e.textContent = msg; e.hidden = false;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); readForm();
    $$(".err", form).forEach(function (x) { x.hidden = true; });
    $$("[aria-invalid]", form).forEach(function (x) { x.removeAttribute("aria-invalid"); });
    var bad = null;
    if (!draft.name.trim()) { invalid(form.elements.name, "f-name-err"); bad = bad || [tabs[0], form.elements.name]; }
    if (!draft.modes.length) { $("#f-modes-err").textContent = "Elige al menos un modo de venta."; $("#f-modes-err").hidden = false; bad = bad || [tabs[2], form.elements["m-weight"]]; }
    if (!(draft.price > 0)) { invalid(form.elements.price, "f-modes-err", "Escribe un precio mayor a cero."); bad = bad || [tabs[2], form.elements.price]; }
    if (draft.cost > 0 && draft.price > 0 && draft.price <= draft.cost) { invalid(form.elements.price, "f-cost-err", "El precio de venta tiene que ser mayor que el de compra (" + mxn2.format(draft.cost) + ")."); bad = bad || [tabs[2], form.elements.price]; }
    if (draft.offer.on && offerPrice() != null && draft.cost > 0 && offerPrice() < draft.cost) { invalid(form.elements.offer, "f-offer-err", "La oferta queda por debajo del costo (" + mxn2.format(draft.cost) + ")."); bad = bad || [tabs[2], form.elements.offer]; }
    if (draft.offer.on && offerPrice() == null) { invalid(form.elements.offer, "f-offer-err", "La oferta tiene que dejar el precio por debajo de " + mxn2.format(draft.price) + "."); bad = bad || [tabs[2], form.elements.offer]; }
    if (bad) { selectTab(bad[0]); bad[1].focus(); $("#saveHint").textContent = "Revisa los campos marcados."; return; }
    var target = editing;
    if (!target) {
      target = { id: nextId++, line: "nueva", lowAt: 15, source: "Despiece propio", active: true, tags: {} };
      D.products.unshift(target);
    }
    target.name = draft.name.trim(); target.desc = draft.desc.trim(); target.cat = draft.cat; target.price = draft.price; target.unit = draft.unit;
    target.modes = draft.modes; target.img = draft.images[0]; target.stock = draft.stock; target.lowAt = draft.lowAt; target.min = draft.min; target.source = draft.source;
    target.offer = draft.offer.on && offerPrice() != null; target.offerPrice = target.offer ? offerPrice() : null; target.cost = draft.cost; target.tags = { oferta: target.offer, destacado: draft.tags.destacado, nuevo: draft.tags.nuevo };
    dlg.close(); render();
    UI.toast(target.name + " quedó guardado en la maqueta (no se envía a la base).");
  });
  $("#newProduct").addEventListener("click", function (e) { openEditor(null, e.currentTarget); });

  buildChips(); render();
  window.CARNI_PRODUCTS = {
    enter: function (query) {
      var params = new URLSearchParams(query);
      if (params.has("q")) { state.q = params.get("q"); $("#prodSearch").value = state.q; }
      if (params.get("stock") === "bajo") { state.low = true; $("#lowOnly").checked = true; }
      render();
      if (params.has("nuevo")) setTimeout(function () { openEditor(null, $("#newProduct")); }, 0);
    },
  };
  if ((location.hash || "").indexOf("#productos") === 0) window.CARNI_PRODUCTS.enter((location.hash.split("?")[1]) || "");
})();
