// Sample orders for the panel mockup.
// Products and prices come only from catalog.js (generated from supabase/seed.sql).
// Customers, orders, costs and shrink are synthetic and deterministic (fixed seed),
// so every number on screen can be recomputed from these orders. Money is kept in cents.
(function () {
  "use strict";
  var catalog = window.CARNI_CATALOG;
  var TODAY = new Date(2026, 10, 25); // 2026-11-25, local time. Sample "today".
  var DAYS = 182;

  // Sample cost ratio per category (cost of goods / list price). Assumption for the mockup only.
  var COST_RATIO = {
    "carnes-rojas": 0.66, "cortes-especiales": 0.61, cerdo: 0.64, pollo: 0.7,
    embutidos: 0.62, preparadas: 0.55, ofertas: 0.72, merch: 0.45, otros: 0.58,
  };
  // Sample low-stock threshold (units of the product's own stock unit).
  var LOW_STOCK_DEFAULT = 15;
  // Sample panel exchange rate, MXN per USD. The real one lives in public.fx_rates.
  var FX_SAMPLE = 18.42;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20261125);
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

  // Obviously fictitious sample customers (auditor F-62): no real people or businesses, no phones or addresses.
  var CUSTOMERS = [
    "Rosa Ejemplo", "Javier Muestra", "Lupita Ejemplo", "Ricardo Muestra",
    "Mónica Ejemplo", "Fernando Muestra", "Alejandra Ejemplo", "Héctor Muestra",
    "Claudia Ejemplo", "Arturo Muestra", "Paola Ejemplo", "Chuy Muestra",
    "Verónica Ejemplo", "Iván Muestra", "Karla Ejemplo", "Gerardo Muestra",
    "Sofía Ejemplo", "Enrique Muestra", "Mariana Ejemplo", "Taquería de Muestra",
    "Restaurante de Ejemplo", "Beatriz Muestra", "Óscar Ejemplo", "Norma Muestra",
  ];
  var CHANNELS = ["Mostrador", "WhatsApp", "Web"];

  // Popularity weights by product name. Unlisted products weigh 1.
  var WEIGHT = {
    "Arrachera": 9, "Bistec de Res": 9, "Molida de Res Especial": 7, "Rib Eye": 6,
    "Chorizo Rojo": 6, "Pierna y Muslo": 6, "Pechuga Completa": 5, "Costilla de Cerdo": 5,
    "Bistec Adobado": 5, "Carnitas Surtidas": 5, "Salchicha Argentina": 4, "Top Sirloin": 4,
    "Carbón de Mezquite": 5, "Bolsa de Hielo": 4, "Tomahawk": 2, "Pollo Marinado": 4,
    "Cebolla Cambray": 3, "Limón con Sal y Chile": 3, "Chistorra": 3, "Diezmillo": 3,
  };
  var bag = [];
  catalog.products.forEach(function (p) {
    var w = WEIGHT[p.name] || 1;
    for (var i = 0; i < w; i++) bag.push(p);
  });

  // Hour profile 8:00 to 20:00 (13 slots) and weekday profile (0 = Sunday).
  var HOUR_W = [2, 4, 7, 9, 10, 8, 5, 4, 4, 6, 8, 7, 3];
  var DAY_W = [1.55, 0.7, 0.8, 0.85, 0.95, 1.25, 1.7];
  function weightedIndex(ws) {
    var total = ws.reduce(function (a, b) { return a + b; }, 0);
    var r = rnd() * total;
    for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; }
    return ws.length - 1;
  }

  function qtyFor(p) {
    if (p.unit !== "kg") return 1 + Math.floor(rnd() * (p.unit === "package" ? 1.4 : 3));
    var opts = [0.5, 0.75, 1, 1, 1.5, 2, 2, 3];
    var q = pick(opts);
    return Math.max(q, p.min || 0.25);
  }

  var orders = [];
  var shrink = []; // per day: cost of shrink in cents and kg
  var seq = 4180;
  for (var d = DAYS - 1; d >= 0; d--) {
    var day = new Date(TODAY); day.setDate(TODAY.getDate() - d);
    var wd = day.getDay();
    var trend = 1 + (DAYS - d) / DAYS * 0.18; // slow growth across the half year
    var n = Math.round((9 + rnd() * 6) * DAY_W[wd] * trend);
    var dayFreshCost = 0;
    for (var k = 0; k < n; k++) {
      var hour = 8 + weightedIndex(HOUR_W);
      var minute = Math.floor(rnd() * 60);
      var at = new Date(day); at.setHours(hour, minute, 0, 0);
      if (d === 0 && hour > 16) continue; // "today" stops at 16:59
      var count = 1 + weightedIndex([5, 4, 2, 1]);
      var items = []; var seen = {};
      for (var j = 0; j < count; j++) {
        var p = pick(bag);
        if (seen[p.id]) continue; seen[p.id] = 1;
        var q = qtyFor(p);
        var cents = Math.round(p.price * 100 * q);
        var cost = Math.round(cents * COST_RATIO[p.cat]);
        if (p.unit === "kg") dayFreshCost += cost;
        items.push({ pid: p.id, qty: q, cents: cents, cost: cost });
      }
      var total = items.reduce(function (a, it) { return a + it.cents; }, 0);
      var status = "Entregado";
      if (d === 0) status = pick(["Pendiente", "Preparando", "En camino", "Entregado"]);
      orders.push({
        id: "P-" + (seq++), at: at, customer: pick(CUSTOMERS), channel: pick(CHANNELS),
        items: items, cents: total,
        cost: items.reduce(function (a, it) { return a + it.cost; }, 0), status: status,
      });
    }
    var pct = 0.015 + rnd() * 0.02; // 1.5 % to 3.5 % of fresh cost is lost
    shrink.push({ date: new Date(day), cents: Math.round(dayFreshCost * pct), fresh: dayFreshCost });
  }

  function dayKey(dt) { return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate(); }
  var shrinkByDay = {};
  shrink.forEach(function (s) { shrinkByDay[dayKey(s.date)] = s; });

  function startOfDay(dt) { var x = new Date(dt); x.setHours(0, 0, 0, 0); return x; }
  function addDays(dt, n) { var x = new Date(dt); x.setDate(x.getDate() + n); return x; }

  // Orders between [from, to) dates.
  function ordersIn(from, to) {
    return orders.filter(function (o) { return o.at >= from && o.at < to; });
  }

  // Totals for a window: revenue, cost, shrink, expense, profit, margin, shrinkPct.
  function totals(from, to) {
    var list = ordersIn(from, to);
    var rev = 0, cost = 0, shr = 0, fresh = 0;
    list.forEach(function (o) { rev += o.cents; cost += o.cost; });
    for (var dt = startOfDay(from); dt < to; dt = addDays(dt, 1)) {
      var s = shrinkByDay[dayKey(dt)]; if (s) { shr += s.cents; fresh += s.fresh; }
    }
    var expense = cost + shr;
    return {
      orders: list.length, revenue: rev, cost: cost, shrink: shr, expense: expense,
      profit: rev - expense, margin: rev ? (rev - expense) / rev : 0,
      shrinkPct: fresh ? shr / fresh : 0,
    };
  }

  // Daily series of a metric over the last `days` days ending today (inclusive).
  function dailySeries(days, metric) {
    var end = addDays(startOfDay(TODAY), 1);
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var from = addDays(end, -(i + 1)); var to = addDays(from, 1);
      var t = totals(from, to);
      out.push({ from: from, to: to, value: metric(t), t: t });
    }
    return out;
  }

  // Buckets: weekly (last 12 weeks, Monday start) or monthly (last 6 months).
  function buckets(kind) {
    var end = addDays(startOfDay(TODAY), 1);
    var out = [];
    if (kind === "semana") {
      var monday = startOfDay(TODAY);
      monday = addDays(monday, -((monday.getDay() + 6) % 7));
      for (var w = 11; w >= 0; w--) {
        var f = addDays(monday, -7 * w); var t = addDays(f, 7);
        out.push({ from: f, to: t > end ? end : t, partial: t > end });
      }
    } else {
      for (var m = 5; m >= 0; m--) {
        var f2 = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
        var t2 = new Date(TODAY.getFullYear(), TODAY.getMonth() - m + 1, 1);
        out.push({ from: f2, to: t2 > end ? end : t2, partial: t2 > end });
      }
    }
    return out.map(function (b) { b.t = totals(b.from, b.to); return b; });
  }

  // Revenue heat by weekday (Monday first) and hour 8..20 inside a window.
  function heat(from, to) {
    var grid = [];
    for (var r = 0; r < 7; r++) { grid.push([]); for (var c = 0; c < 13; c++) grid[r].push(0); }
    ordersIn(from, to).forEach(function (o) {
      var row = (o.at.getDay() + 6) % 7; var col = o.at.getHours() - 8;
      if (col >= 0 && col < 13) grid[row][col] += o.cents;
    });
    return grid;
  }

  // Units and revenue per product inside a window.
  function productRanking(from, to) {
    var map = {};
    ordersIn(from, to).forEach(function (o) {
      o.items.forEach(function (it) {
        var m = map[it.pid] || (map[it.pid] = { pid: it.pid, qty: 0, cents: 0 });
        m.qty += it.qty; m.cents += it.cents;
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.cents - a.cents; });
  }

  var byId = {};
  catalog.products.forEach(function (p) {
    byId[p.id] = p;
    p.lowAt = LOW_STOCK_DEFAULT;
    p.source = p.cat === "merch" || p.cat === "otros" ? "Proveedor" : "Despiece propio";
    p.active = true;
    p.offer = p.cat === "ofertas";
    p.tags = { oferta: p.cat === "ofertas", destacado: false, nuevo: false };
  });
  var catBySlug = {};
  catalog.categories.forEach(function (c) { catBySlug[c.slug] = c; });

  window.CARNI_DATA = {
    TODAY: TODAY, FX_SAMPLE: FX_SAMPLE, COST_RATIO: COST_RATIO,
    orders: orders, totals: totals, dailySeries: dailySeries, buckets: buckets,
    heat: heat, productRanking: productRanking, ordersIn: ordersIn,
    startOfDay: startOfDay, addDays: addDays, product: function (id) { return byId[id]; },
    category: function (slug) { return catBySlug[slug]; },
    IMG: catalog.imgBase, // single image source: public/img/products/
    products: catalog.products, categories: catalog.categories,
  };
})();
