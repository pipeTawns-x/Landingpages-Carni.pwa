// Panel mockup: routing, Inicio (KPIs, flow chart, heat map, lists), dialogs and CSV.
(function () {
  "use strict";
  var D = window.CARNI_DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  var mxn2 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });
  var pct = new Intl.NumberFormat("es-MX", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var num = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
  var dShort = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
  var dLong = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var dMonth = new Intl.DateTimeFormat("es-MX", { month: "long" });
  var tHour = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" });
  function money(c) { return mxn.format(c / 100); }
  function money2(c) { return mxn2.format(c / 100); }
  function compact(c) {
    var v = c / 100;
    if (Math.abs(v) >= 1e6) return "$" + num.format(+(v / 1e6).toFixed(2)) + " M";
    if (Math.abs(v) >= 1e3) return "$" + num.format(+(v / 1e3).toFixed(1)) + " mil";
    return mxn.format(v);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function svg(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function icon(name, cls) { var s = svg("svg", { class: "i" + (cls ? " " + cls : ""), "aria-hidden": "true" }); s.appendChild(svg("use", { href: "#i-" + name })); return s; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------- Toast and tooltip ----------
  var toastEl = $("#toast"), toastT = 0;
  // Toast with an optional action (used for "Deshacer" after a delete).
  function toast(msg, actionLabel, onAction) {
    toastEl.textContent = msg;
    if (actionLabel) {
      var b = el("button", "toast__act", actionLabel); b.type = "button";
      b.addEventListener("click", function () { toastEl.classList.remove("on"); onAction(); });
      toastEl.appendChild(b);
    }
    toastEl.classList.add("on"); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("on"); }, actionLabel ? 6000 : 2600);
  }
  var tip = $("#tip");
  function showTip(x, y, strong, small) {
    tip.textContent = ""; tip.appendChild(el("b", null, strong)); tip.appendChild(el("small", null, small));
    tip.hidden = false; tip.style.left = Math.round(x) + "px"; tip.style.top = Math.round(y) + "px";
  }
  function hideTip() { tip.hidden = true; }

  // ---------- Dialog helper with focus return ----------
  var lastTrigger = null;
  function openDialog(dlg, trigger) {
    lastTrigger = trigger || document.activeElement;
    dlg.showModal();
  }
  $$("dialog").forEach(function (dlg) {
    dlg.addEventListener("close", function () { if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus(); });
    dlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) dlg.close();
      // Fallback for browsers without closedby="any": click on the backdrop closes.
      if (dlg.getAttribute("closedby") === "any" && e.target === dlg) dlg.close();
    });
  });
  window.CARNI_UI = { openDialog: openDialog, toast: toast, money: money, money2: money2, el: el, icon: icon, num: num };

  // ---------- Routing ----------
  var PENDING = {
    ventas: "Venta de mostrador e historial de ventas.",
    pedidos: "Pedidos por estado, filtro, detalle en ventana e impresión de ticket.",
    compras: "Compras a proveedores y entradas de inventario.",
    inventario: "Fuentes, despiece y conciliación diaria con conteo.",
    promociones: "Ofertas por precio o porcentaje, con fechas y niveles de lealtad.",
    cupones: "Cupones con código, vigencia y límite de usos.",
    clientes: "Clientes, nivel de lealtad e historial de compras.",
    reportes: "Reportes de ventas, margen y merma con exportación a CSV.",
    configuracion: "Envío gratis, zonas de entrega, tasa del dólar y horarios.",
    bitacora: "Quién cambió qué y cuándo.",
  };
  var NAMES = { inicio: "Inicio", ventas: "Ventas", pedidos: "Pedidos", compras: "Compras", inventario: "Inventario", productos: "Productos", promociones: "Promociones", cupones: "Cupones", clientes: "Clientes", reportes: "Reportes", configuracion: "Configuración", bitacora: "Bitácora" };
  var side = $("#side"), scrim = $("#scrim"), menuBtn = $("#menuBtn");
  function setMenu(open) {
    side.classList.toggle("open", open); scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    if (open) $("a", side.querySelector(".side__nav")).focus();
  }
  menuBtn.addEventListener("click", function () { setMenu(!side.classList.contains("open")); });
  scrim.addEventListener("click", function () { setMenu(false); menuBtn.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && side.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });

  function route() {
    var raw = (location.hash || "#inicio").slice(1);
    var name = raw.split("?")[0] || "inicio";
    var query = raw.split("?")[1] || "";
    if (!NAMES[name]) name = "inicio";
    var view = name === "inicio" || name === "productos" ? name : "pendiente";
    $$(".view").forEach(function (v) { v.hidden = v.dataset.view !== view; });
    $$(".side__nav a").forEach(function (a) { if (a.dataset.route === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("#crumb").textContent = NAMES[name];
    document.title = NAMES[name] + " · Panel Carni (maqueta)";
    if (view === "pendiente") { $("#h-pend").textContent = NAMES[name]; $("#pendText").textContent = PENDING[name]; }
    if (view === "productos" && window.CARNI_PRODUCTS) window.CARNI_PRODUCTS.enter(query);
    setMenu(false);
    return view;
  }
  window.addEventListener("hashchange", function () { route(); $("#main").focus({ preventScroll: true }); window.scrollTo(0, 0); });

  // ---------- Inicio state ----------
  var state = { days: 7, metric: "revenue", grain: "semana" };
  var METRIC = {
    revenue: { label: "Ingresos", key: "revenue" },
    expense: { label: "Gasto", key: "expense" },
    profit: { label: "Ganancia", key: "profit" },
  };
  function windowFor(days, back) {
    var end = D.addDays(D.startOfDay(D.TODAY), 1 - (back || 0) * days);
    return { from: D.addDays(end, -days), to: end };
  }

  function bindSeg(seg, onPick) {
    var btns = $$("[role=radio]", seg);
    function select(b, focus) {
      btns.forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      if (focus) b.focus();
      onPick(b);
    }
    btns.forEach(function (b) {
      b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
      b.addEventListener("click", function () { select(b); });
      b.addEventListener("keydown", function (e) {
        var i = btns.indexOf(b), n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = btns[(i + 1) % btns.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = btns[(i - 1 + btns.length) % btns.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }
  window.CARNI_UI.bindSeg = bindSeg;

  // ---------- KPIs ----------
  function sparkPath(vals, w, h) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = max - min || 1;
    return vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * w, y = h - 2 - ((v - min) / span) * (h - 4);
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
  }
  function spark(vals, label) {
    var w = 96, h = 30;
    var s = svg("svg", { class: "spark", viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": label, preserveAspectRatio: "none" });
    var d = sparkPath(vals, w, h);
    s.appendChild(svg("path", { d: d + " L" + w + " " + h + " L0 " + h + " Z", class: "area" }));
    s.appendChild(svg("path", { d: d }));
    var last = d.split(" ").slice(-2);
    s.appendChild(svg("circle", { cx: last[0].replace(/[ML]/, ""), cy: last[1], r: 2.6 }));
    return s;
  }
  function deltaEl(cur, prev, goodWhenUp, kind) {
    var diff = kind === "pts" ? (cur - prev) * 100 : prev ? (cur - prev) / Math.abs(prev) : 0;
    var up = diff >= 0, good = up === goodWhenUp;
    var e = el("span", "delta " + (good ? "delta--good" : "delta--bad"));
    e.appendChild(icon(up ? "trending-up" : "trending-down"));
    var txt = kind === "pts" ? (up ? "+" : "") + diff.toFixed(1) + " pts" : (up ? "+" : "") + pct.format(diff);
    e.appendChild(document.createTextNode(txt));
    e.setAttribute("aria-label", (up ? "Sube " : "Baja ") + txt.replace("+", "").replace("-", "") + " contra el periodo anterior");
    return e;
  }

  var KPI_DEF = [
    { id: "ventas", label: "Ventas", icon: "coins", val: function (t) { return money(t.revenue); }, raw: function (t) { return t.revenue; }, good: true,
      goal: function (days) { return { txt: money(1400000 * days), ok: function (t) { return t.revenue >= 1400000 * days; } }; } },
    { id: "margen", label: "Margen", icon: "scale", val: function (t) { return pct.format(t.margin); }, raw: function (t) { return t.margin; }, good: true, kind: "pts",
      goal: function () { return { txt: "35 % o más", ok: function (t) { return t.margin >= 0.35; } }; } },
    { id: "merma", label: "Merma", icon: "flame", val: function (t) { return pct.format(t.shrinkPct); }, raw: function (t) { return t.shrinkPct; }, good: false, kind: "pts",
      goal: function () { return { txt: "2.5 % o menos", ok: function (t) { return t.shrinkPct <= 0.025; } }; } },
  ];
  function lowStock() { return D.products.filter(function (p) { return p.stock < p.lowAt; }).sort(function (a, b) { return a.stock / a.lowAt - b.stock / b.lowAt; }); }
  function periodName(days) { return days === 1 ? "ayer" : "los " + days + " días anteriores"; }

  var forecastPending = true;
  function renderKpis() {
    var box = $("#kpis"); box.textContent = "";
    var cur = windowFor(state.days, 0), prev = windowFor(state.days, 1);
    var tc = D.totals(cur.from, cur.to), tp = D.totals(prev.from, prev.to);
    var sparkDays = Math.max(state.days, 7);
    var series = D.dailySeries(sparkDays, function (t) { return t; });
    KPI_DEF.forEach(function (k) {
      var b = el("button", "kpi card"); b.type = "button";
      b.setAttribute("aria-haspopup", "dialog");
      var top = el("span", "kpi__top"); var ic = el("span", "kpi__ico"); ic.appendChild(icon(k.icon)); top.appendChild(ic); top.appendChild(el("span", null, k.label));
      var mid = el("span", "kpi__val", k.val(tc));
      top.appendChild(spark(series.map(function (s) { return k.raw(s.t); }), "Tendencia de " + k.label.toLowerCase() + " en " + sparkDays + " días"));
      var foot = el("span", "kpi__foot");
      foot.appendChild(deltaEl(k.raw(tc), k.raw(tp), k.good, k.kind)); foot.appendChild(el("span", "delta__vs", "vs " + periodName(state.days)));
      var g = k.goal(state.days); var gl = el("span", "kpi__goal");
      gl.appendChild(document.createTextNode("Meta de muestra: ")); gl.appendChild(el("b", null, g.txt + (g.ok(tc) ? " · cumplida" : " · pendiente")));
      b.appendChild(top); b.appendChild(mid); b.appendChild(foot); b.appendChild(gl);
      b.setAttribute("aria-label", k.label + ": " + k.val(tc) + ". Abrir detalle");
      b.addEventListener("click", function () { openKpi(k, cur, tc, tp, b); });
      box.appendChild(b);
    });
    // Low stock tile
    var low = lowStock();
    var lb = el("button", "kpi card"); lb.type = "button"; lb.setAttribute("aria-haspopup", "dialog");
    var lt = el("span", "kpi__top"); var li = el("span", "kpi__ico"); li.appendChild(icon("triangle-alert")); lt.appendChild(li); lt.appendChild(el("span", null, "Stock bajo"));
    lb.appendChild(lt);
    lb.appendChild(el("span", "kpi__val", low.length + " productos"));
    var lf = el("span", "kpi__foot"); lf.appendChild(el("span", "delta__vs", low.slice(0, 3).map(function (p) { return p.name; }).join(", "))); lb.appendChild(lf);
    lb.setAttribute("aria-label", "Stock bajo: " + low.length + " productos. Abrir detalle");
    lb.addEventListener("click", function () { openLow(lb); });
    box.appendChild(lb);
    // Accent forecast tile with switch
    var acc = el("div", "kpi card kpi--accent");
    var at = el("div", "kpi__top"); var al = el("span"); al.className = "kpi__top"; var ai = el("span", "kpi__ico"); ai.appendChild(icon("calendar")); al.appendChild(ai); al.appendChild(el("span", null, "Cierre de " + dMonth.format(D.TODAY)));
    at.appendChild(al);
    var sw = el("label", "switch switch--light");
    var inp = el("input"); inp.type = "checkbox"; inp.setAttribute("role", "switch"); inp.setAttribute("switch", ""); inp.checked = forecastPending;
    inp.setAttribute("aria-label", "Incluir pedidos por confirmar en el pronóstico");
    sw.appendChild(inp); var ui = el("span", "switch__ui"); ui.setAttribute("aria-hidden", "true"); sw.appendChild(ui);
    at.appendChild(sw); acc.appendChild(at);
    var f = forecast(forecastPending);
    acc.appendChild(el("span", "kpi__val", compact(f.total)));
    acc.appendChild(el("p", null, (forecastPending ? "Con pedidos por confirmar. " : "Solo pedidos confirmados. ") + "Proyección al ritmo de los últimos 14 días."));
    inp.addEventListener("change", function () { forecastPending = inp.checked; renderKpis(); $("#kpis .kpi--accent input").focus(); });
    box.appendChild(acc);
  }
  function forecast(withPending) {
    var monthStart = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth(), 1);
    var end = D.addDays(D.startOfDay(D.TODAY), 1);
    var done = D.totals(monthStart, end).revenue;
    var pace = D.totals(D.addDays(end, -14), end).revenue / 14;
    var daysLeft = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth() + 1, 0).getDate() - D.TODAY.getDate();
    var pending = withPending ? D.orders.filter(function (o) { return o.status !== "Entregado" && o.at >= monthStart; }).reduce(function (a, o) { return a + o.cents; }, 0) : 0;
    return { total: Math.round(done + pace * daysLeft + pending) };
  }

  // ---------- Detail dialogs ----------
  var detailDlg = $("#detailDlg");
  function stats(pairs) {
    var g = el("div", "dstats");
    pairs.forEach(function (p) { var c = el("div"); c.appendChild(el("b", null, p[1])); c.appendChild(el("small", null, p[0])); g.appendChild(c); });
    return g;
  }
  function orderTable(list) {
    var wrap = el("div", "dlist"); var t = el("table"); var cap2 = el("caption", "sr", "Pedidos del periodo"); t.appendChild(cap2);
    var hr = el("tr"); ["Pedido", "Cliente", "Canal", "Total"].forEach(function (h, i) { var th = el("th", i === 3 ? "num" : null, h); th.scope = "col"; hr.appendChild(th); });
    var th0 = el("thead"); th0.appendChild(hr); t.appendChild(th0);
    var tb = el("tbody");
    list.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 60).forEach(function (o) {
      var tr = el("tr");
      tr.appendChild(el("td", null, o.id + " · " + dShort.format(o.at) + " " + tHour.format(o.at)));
      tr.appendChild(el("td", null, o.customer)); tr.appendChild(el("td", null, o.channel));
      tr.appendChild(el("td", "num", money2(o.cents))); tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t); return wrap;
  }
  function openKpi(k, cur, tc, tp, trigger) {
    $("#detailTitle").textContent = k.label + ": " + k.val(tc);
    var body = $("#detailBody"); body.textContent = "";
    body.appendChild(el("p", "card__meta", "Del " + dShort.format(cur.from) + " al " + dShort.format(D.addDays(cur.to, -1)) + ". Antes: " + k.val(tp) + "."));
    body.appendChild(stats([["Pedidos", String(tc.orders)], ["Ingresos", money(tc.revenue)], ["Gasto (costo + merma)", money(tc.expense)]]));
    var list = D.ordersIn(cur.from, cur.to);
    body.appendChild(orderTable(list));
    if (list.length > 60) body.appendChild(el("p", "help", "Se muestran los 60 más recientes de " + list.length + "."));
    openDialog(detailDlg, trigger);
  }
  function openLow(trigger) {
    var low = lowStock();
    $("#detailTitle").textContent = "Stock bajo: " + low.length + " productos";
    var body = $("#detailBody"); body.textContent = "";
    var ul = el("ul", "low");
    low.forEach(function (p) { ul.appendChild(lowItem(p)); });
    body.appendChild(ul);
    var a = el("a", "btn btn--ghost", "Abrir en Productos"); a.href = "#productos?stock=bajo";
    a.addEventListener("click", function () { detailDlg.close(); });
    body.appendChild(a);
    openDialog(detailDlg, trigger);
  }
  function unitWord(p, n) { return p.unit === "kg" ? "kg" : p.unit === "package" ? (n === 1 ? "paquete" : "paquetes") : (n === 1 ? "pieza" : "piezas"); }
  function lowItem(p) {
    var li = el("li"); var img = el("img"); img.src = D.IMG + p.img; img.alt = ""; img.width = 40; img.height = 40; img.loading = "lazy";
    var tx = el("div"); tx.appendChild(el("b", null, p.name)); tx.appendChild(el("small", null, D.category(p.cat).name + " · umbral " + p.lowAt + " " + unitWord(p, p.lowAt)));
    li.appendChild(img); li.appendChild(tx); li.appendChild(el("span", "left", num.format(p.stock) + " " + unitWord(p, p.stock)));
    return li;
  }

  // ---------- Flow chart ----------
  var lastBuckets = [];
  function renderFlow(animate) {
    var host = $("#flowChart");
    var bs = D.buckets(state.grain);
    lastBuckets = bs;
    var key = METRIC[state.metric].key;
    var vals = bs.map(function (b) { return b.t[key]; });
    // Previous period: the same buckets one span earlier.
    var span = state.grain === "semana" ? 12 * 7 : 0;
    var prevVals = bs.map(function (b) {
      var from, to;
      if (state.grain === "semana") { from = D.addDays(b.from, -span); to = D.addDays(b.to, -span); }
      else { from = new Date(b.from.getFullYear() - 1, b.from.getMonth(), 1); to = new Date(b.from.getFullYear() - 1, b.from.getMonth() + 1, 1); }
      return D.totals(from, to)[key];
    });
    var hasPrev = prevVals.some(function (v) { return v !== 0; });
    var w = host.clientWidth || 800, h = host.clientHeight || 290;
    var pad = { l: 56, r: 12, t: 16, b: 28 };
    var all = vals.concat(hasPrev ? prevVals : []);
    var max = Math.max.apply(null, all.concat([0])), min = Math.min.apply(null, all.concat([0]));
    var niceMax = Math.ceil(max / 100 / 10000) * 10000 * 100 || 100;
    var niceMin = min < 0 ? -Math.ceil(-min / 100 / 10000) * 10000 * 100 : 0;
    function x(i) { return pad.l + (i / (vals.length - 1)) * (w - pad.l - pad.r); }
    function y(v) { return pad.t + (1 - (v - niceMin) / (niceMax - niceMin)) * (h - pad.t - pad.b); }
    function line(vs) {
      // Monotone-ish smoothing with short cubic handles.
      var d = "M" + x(0) + " " + y(vs[0]);
      for (var i = 1; i < vs.length; i++) {
        var x0 = x(i - 1), x1 = x(i), cx = (x1 - x0) * 0.42;
        d += " C" + (x0 + cx) + " " + y(vs[i - 1]) + " " + (x1 - cx) + " " + y(vs[i]) + " " + x1 + " " + y(vs[i]);
      }
      return d;
    }
    var s = host.querySelector("svg");
    if (!s) {
      s = svg("svg", { role: "img" });
      var defs = svg("defs", {}); var g = svg("linearGradient", { id: "flowFill", x1: 0, y1: 0, x2: 0, y2: 1 });
      g.appendChild(svg("stop", { offset: "0", "stop-color": "#FF6A1F", "stop-opacity": ".32" }));
      g.appendChild(svg("stop", { offset: "1", "stop-color": "#FF6A1F", "stop-opacity": "0" }));
      defs.appendChild(g);
      var g2 = svg("linearGradient", { id: "sparkFill", x1: 0, y1: 0, x2: 0, y2: 1 });
      g2.appendChild(svg("stop", { offset: "0", "stop-color": "#FF6A1F", "stop-opacity": ".25" }));
      g2.appendChild(svg("stop", { offset: "1", "stop-color": "#FF6A1F", "stop-opacity": "0" }));
      defs.appendChild(g2);
      s.appendChild(defs);
      ["grid", "axis", "series", "hits"].forEach(function (n) { s.appendChild(svg("g", { class: n })); });
      host.appendChild(s);
      var lg = el("div", "legend"); lg.id = "flowLegend"; host.after(lg);
    }
    s.setAttribute("viewBox", "0 0 " + w + " " + h);
    var label = METRIC[state.metric].label;
    s.setAttribute("aria-label", label + " " + (state.grain === "semana" ? "por semana, últimas 12 semanas" : "por mes, últimos 6 meses") + ". La tabla de abajo tiene los valores.");
    var grid = s.querySelector(".grid"), axis = s.querySelector(".axis"), ser = s.querySelector(".series"), hits = s.querySelector(".hits");
    grid.textContent = ""; axis.textContent = ""; hits.textContent = "";
    for (var k = 0; k <= 4; k++) {
      var v = niceMin + (niceMax - niceMin) * k / 4, yy = y(v);
      grid.appendChild(svg("line", { x1: pad.l, x2: w - pad.r, y1: yy, y2: yy }));
      var tx = svg("text", { x: pad.l - 10, y: yy + 4, "text-anchor": "end" }); tx.textContent = compact(v); axis.appendChild(tx);
    }
    var step = vals.length > 8 && w < 560 ? 2 : 1;
    bs.forEach(function (b, i) {
      if (i % step) return;
      var t = svg("text", { x: x(i), y: h - 6, "text-anchor": "middle" });
      t.textContent = state.grain === "semana" ? dShort.format(b.from) : cap(dMonth.format(b.from)).slice(0, 3);
      axis.appendChild(t);
    });
    var partial = bs[bs.length - 1].partial;
    var solid = partial ? vals.slice(0, -1) : vals;
    var lineD = line(solid);
    var areaD = lineD + " L" + x(solid.length - 1) + " " + y(Math.max(niceMin, 0)) + " L" + x(0) + " " + y(Math.max(niceMin, 0)) + " Z";
    var area = ser.querySelector(".area") || ser.appendChild(svg("path", { class: "area" }));
    var prev = ser.querySelector(".prev") || ser.appendChild(svg("path", { class: "prev" }));
    var ln = ser.querySelector(".line") || ser.appendChild(svg("path", { class: "line" }));
    area.setAttribute("d", areaD); ln.setAttribute("d", lineD);
    prev.setAttribute("d", hasPrev ? line(prevVals) : "");
    var part = ser.querySelector(".partial") || ser.appendChild(svg("path", { class: "partial" }));
    var n1 = vals.length - 1;
    part.setAttribute("d", partial ? "M" + x(n1 - 1) + " " + y(vals[n1 - 1]) + " L" + x(n1) + " " + y(vals[n1]) : "");
    var cross = ser.querySelector(".cross") || ser.appendChild(svg("line", { class: "cross", y1: pad.t, y2: h - pad.b, opacity: 0 }));
    cross.setAttribute("y2", h - pad.b);
    $$(".dot, .focusmark", ser).forEach(function (n) { n.remove(); });
    vals.forEach(function (v, i) {
      var cx = x(i), cy = y(v);
      ser.appendChild(svg("circle", { class: "dot", cx: cx, cy: cy, r: i === vals.length - 1 ? 4.5 : 3 }));
      var hit = svg("rect", { class: "hit", x: cx - Math.max(14, (w - pad.l - pad.r) / vals.length / 2), y: pad.t, width: Math.max(28, (w - pad.l - pad.r) / vals.length), height: h - pad.t - pad.b, tabindex: 0, role: "button" });
      var b = bs[i];
      var when = state.grain === "semana" ? "Semana del " + dShort.format(b.from) : cap(dMonth.format(b.from));
      var dv = hasPrev && prevVals[i] ? " (" + (v >= prevVals[i] ? "+" : "") + pct.format((v - prevVals[i]) / Math.abs(prevVals[i])) + ")" : "";
      hit.setAttribute("aria-label", when + (b.partial ? ", en curso" : "") + ": " + label + " " + money(v) + dv + ". Abrir detalle");
      var mark = svg("circle", { class: "focusmark", cx: cx, cy: cy, r: 9 });
      function enter() {
        var r = host.getBoundingClientRect();
        cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("opacity", 1);
        mark.classList.add("on");
        showTip(r.left + cx * r.width / w, r.top + cy * r.height / h, money(v) + dv, label + " · " + when + (b.partial ? " (en curso)" : ""));
      }
      function leave() { cross.setAttribute("opacity", 0); mark.classList.remove("on"); hideTip(); }
      hit.addEventListener("pointerenter", enter); hit.addEventListener("focus", enter);
      hit.addEventListener("pointerleave", leave); hit.addEventListener("blur", leave);
      function open() { hideTip(); openBucket(b, label, v, hit); }
      hit.addEventListener("click", open);
      hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      hits.appendChild(hit); hits.appendChild(mark);
    });
    var lgd = $("#flowLegend"); lgd.textContent = "";
    var a1 = el("span"); a1.appendChild(el("i")); a1.appendChild(document.createTextNode(label)); lgd.appendChild(a1);
    if (hasPrev) { var a2 = el("span"); a2.appendChild(el("i", "prev")); a2.appendChild(document.createTextNode(state.grain === "semana" ? "12 semanas antes" : "Mismo mes, año anterior")); lgd.appendChild(a2); }
    var total = vals.reduce(function (a, b2) { return a + b2; }, 0);
    $("#flowMeta").textContent = money(total) + " en " + (state.grain === "semana" ? "12 semanas" : "6 meses") + " · último periodo " + money(vals[vals.length - 1]) + (bs[bs.length - 1].partial ? " (en curso)" : "");
    // Table view
    var tw = $("#flowTable"); tw.textContent = "";
    var t = el("table"); var hr = el("tr");
    [state.grain === "semana" ? "Semana" : "Mes", "Ingresos", "Gasto", "Ganancia"].forEach(function (hh) { var th = el("th", null, hh); th.scope = "col"; hr.appendChild(th); });
    var thead = el("thead"); thead.appendChild(hr); t.appendChild(thead);
    var tb = el("tbody");
    bs.forEach(function (b) {
      var tr = el("tr");
      tr.appendChild(el("td", null, state.grain === "semana" ? dShort.format(b.from) : cap(dMonth.format(b.from))));
      tr.appendChild(el("td", null, money(b.t.revenue))); tr.appendChild(el("td", null, money(b.t.expense))); tr.appendChild(el("td", null, money(b.t.profit)));
      tb.appendChild(tr);
    });
    t.appendChild(tb); tw.appendChild(t);
  }
  function openBucket(b, label, v, trigger) {
    var when = state.grain === "semana" ? "Semana del " + dShort.format(b.from) : cap(dMonth.format(b.from));
    $("#detailTitle").textContent = when + ": " + label.toLowerCase() + " " + money(v);
    var body = $("#detailBody"); body.textContent = "";
    body.appendChild(stats([["Ingresos", money(b.t.revenue)], ["Gasto (costo + merma)", money(b.t.expense)], ["Ganancia", money(b.t.profit)]]));
    var list = D.ordersIn(b.from, b.to);
    body.appendChild(el("p", "card__meta", list.length + " pedidos" + (b.partial ? ", periodo en curso" : "") + "."));
    body.appendChild(orderTable(list));
    openDialog(detailDlg, trigger);
  }

  // ---------- Heat map ----------
  var DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  var DAYS_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  function renderHeat() {
    var wnd = windowFor(Math.max(state.days, 7), 0);
    var grid = D.heat(wnd.from, wnd.to);
    var max = 0; grid.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    var box = $("#heat"); box.textContent = "";
    box.setAttribute("role", "grid"); box.setAttribute("aria-label", "Ventas por día y hora");
    box.appendChild(el("span"));
    for (var c = 0; c < 13; c++) box.appendChild(el("span", "cl", c % 2 === 0 ? String(8 + c) : ""));
    var best = { v: -1 };
    grid.forEach(function (row, r) {
      box.appendChild(el("span", "rl", DAYS_ES[r]));
      row.forEach(function (v, c2) {
        var lvl = v === 0 ? 0 : Math.min(5, 1 + Math.floor((v / max) * 5));
        var b = el("button", "cell"); b.type = "button"; b.dataset.l = lvl;
        var lab = cap(DAYS_LONG[r]) + " de " + (8 + c2) + ":00 a " + (9 + c2) + ":00: " + money(v);
        b.setAttribute("aria-label", lab);
        b.addEventListener("pointerenter", function () { var rc = b.getBoundingClientRect(); showTip(rc.left + rc.width / 2, rc.top, money(v), cap(DAYS_LONG[r]) + ", " + (8 + c2) + ":00 a " + (9 + c2) + ":00"); });
        b.addEventListener("focus", function () { var rc = b.getBoundingClientRect(); showTip(rc.left + rc.width / 2, rc.top, money(v), cap(DAYS_LONG[r]) + ", " + (8 + c2) + ":00 a " + (9 + c2) + ":00"); });
        b.addEventListener("pointerleave", hideTip); b.addEventListener("blur", hideTip);
        b.addEventListener("click", function () { openHeat(r, c2, wnd, b); });
        if (v > best.v) best = { v: v, r: r, c: c2 };
        box.appendChild(b);
      });
    });
    var ht = $("#heatTable"); ht.textContent = "";
    var tbl = el("table"); var hr2 = el("tr"); ["Día", "Ventas", "Hora pico"].forEach(function (x) { var th = el("th", null, x); th.scope = "col"; hr2.appendChild(th); });
    var th2 = el("thead"); th2.appendChild(hr2); tbl.appendChild(th2); var tb2 = el("tbody");
    grid.forEach(function (row, r) {
      var tot = row.reduce(function (s, v) { return s + v; }, 0), pk = row.indexOf(Math.max.apply(null, row));
      var tr = el("tr"); tr.appendChild(el("td", null, cap(DAYS_LONG[r]))); tr.appendChild(el("td", null, money(tot))); tr.appendChild(el("td", null, (8 + pk) + ":00")); tb2.appendChild(tr);
    });
    tbl.appendChild(tb2); ht.appendChild(tbl);
    $("#heatMeta").textContent = "Últimos " + Math.max(state.days, 7) + " días · pico el " + DAYS_LONG[best.r] + " a las " + (8 + best.c) + ":00";
  }
  function openHeat(r, c, wnd, trigger) {
    var list = D.ordersIn(wnd.from, wnd.to).filter(function (o) { return (o.at.getDay() + 6) % 7 === r && o.at.getHours() === 8 + c; });
    var tot = list.reduce(function (a, o) { return a + o.cents; }, 0);
    $("#detailTitle").textContent = cap(DAYS_LONG[r]) + " de " + (8 + c) + ":00 a " + (9 + c) + ":00";
    var body = $("#detailBody"); body.textContent = "";
    body.appendChild(stats([["Ventas", money(tot)], ["Pedidos", String(list.length)], ["Ticket promedio", list.length ? money(tot / list.length) : "Sin pedidos"]]));
    body.appendChild(orderTable(list));
    openDialog(detailDlg, trigger);
  }

  // ---------- Lists ----------
  function renderLists() {
    var wnd = windowFor(state.days, 0);
    var rank = D.productRanking(wnd.from, wnd.to).slice(0, 5);
    var top = $("#topList"); top.textContent = "";
    var maxC = rank.length ? rank[0].cents : 1;
    rank.forEach(function (r, i) {
      var p = D.product(r.pid);
      var li = el("li"); var img = el("img"); img.src = D.IMG + p.img; img.alt = i === 0 ? p.name : ""; img.width = i === 0 ? 480 : 56; img.height = i === 0 ? 150 : 56; img.loading = "lazy";
      var tx = el("div", "top__txt"); var nm = el("div"); nm.appendChild(el("b", null, (i === 0 ? "1. " : (i + 1) + ". ") + p.name));
      nm.appendChild(el("small", null, num.format(+r.qty.toFixed(2)) + " " + unitWord(p, r.qty) + " vendidos"));
      if (i > 0) { var bar = el("div", "bar"); bar.style.transform = "scaleX(" + (r.cents / maxC).toFixed(3) + ")"; nm.appendChild(bar); }
      tx.appendChild(nm);
      var amt = el("span", "amt", money(r.cents));
      if (i === 0) tx.appendChild(amt);
      li.appendChild(img); li.appendChild(tx); if (i > 0) li.appendChild(amt);
      top.appendChild(li);
    });
    $("#topMeta").textContent = "Por ingresos en " + (state.days === 1 ? "el día" : "los últimos " + state.days + " días");
    var today = D.ordersIn(D.startOfDay(D.TODAY), D.addDays(D.startOfDay(D.TODAY), 1)).sort(function (a, b) { return b.at - a.at; });
    var ul = $("#ordersList"); ul.textContent = "";
    today.slice(0, 6).forEach(function (o) {
      var li = el("li");
      li.appendChild(el("b", null, o.customer));
      li.appendChild(el("span", "amt", money2(o.cents)));
      var items = o.items.map(function (it) { return D.product(it.pid).name; }).join(", ");
      li.appendChild(el("small", null, o.id + " · " + tHour.format(o.at) + " · " + o.channel + " · " + items));
      li.appendChild(el("span", "status status--" + o.status.toLowerCase().replace(" ", "-"), o.status));
      ul.appendChild(li);
    });
    var pend = today.filter(function (o) { return o.status !== "Entregado"; }).length;
    $("#ordersMeta").textContent = today.length + " pedidos · " + pend + " por atender";
    var low = $("#lowList"); low.textContent = "";
    lowStock().slice(0, 5).forEach(function (p) { low.appendChild(lowItem(p)); });
  }

  function renderHeroCopy() {
    $("#todayLabel").textContent = cap(dLong.format(D.TODAY));
    var t = D.totals(D.startOfDay(D.TODAY), D.addDays(D.startOfDay(D.TODAY), 1));
    $("#heroSub").textContent = "Hoy van " + money(t.revenue) + " en " + t.orders + " pedidos. " + lowStock().length + " productos piden resurtido.";
  }

  function renderAll() { renderKpis(); renderFlow(); renderHeat(); renderLists(); renderHeroCopy(); }

  // ---------- CSV of the visible series ----------
  $("#csvBtn").addEventListener("click", function () {
    var label = METRIC[state.metric].label;
    var rows = [["periodo_inicio", "periodo_fin", "agrupado_por", "serie", "valor_mxn", "en_curso"]];
    lastBuckets.forEach(function (b) {
      var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      rows.push([iso(b.from), iso(D.addDays(b.to, -1)), state.grain, label, (b.t[METRIC[state.metric].key] / 100).toFixed(2), b.partial ? "si" : "no"]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "carni-" + label.toLowerCase() + "-por-" + state.grain + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("Se descargó " + a.download + " (" + (rows.length - 1) + " filas, pedidos de muestra).");
  });

  bindSeg($("#periodSeg"), function (b) { state.days = +b.dataset.days; renderKpis(); renderHeat(); renderLists(); });
  bindSeg($("#metricSeg"), function (b) { state.metric = b.dataset.metric; renderFlow(); });
  $("#grainSel").addEventListener("change", function (e) { state.grain = e.target.value; renderFlow(); });
  var rT = 0;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(renderFlow, 120); });
  $("#globalSearch").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { location.hash = "#productos?q=" + encodeURIComponent(e.target.value); }
  });

  var first = route();
  renderAll();
  // Entrance: release the blur-rise once fonts and first layout are ready (rare, first paint only).
  function release() { requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.remove("is-entering"); }); }); }
  if (first !== "inicio") document.body.classList.remove("is-entering");
  else release();
})();
