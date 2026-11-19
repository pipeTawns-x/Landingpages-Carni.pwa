/*
 * The parts of the store header that need a script (ventas/tienda/_cabecera.html). Every page
 * works without it: the panels open with the native `popover` attribute and the search is a
 * plain GET form. Loaded with `defer` on every public page.
 *
 * - Over the video: on the landing the header is transparent while the hero video is under it,
 *   and solid once the video scrolls away.
 * - The pause button of the hero video.
 * - The live search: up to eight products while typing (ventas:buscar, JSON).
 * - The favourites: kept in this browser (localStorage), listed in their panel, toggled by the
 *   hearts of the cards and of the product page.
 *
 * Nothing is written with innerHTML: every text from the server or from storage goes in as text.
 */
(() => {
  document.documentElement.classList.add("js");

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const thumbnail = (src, size, className) => {
    const box = make("span", className);
    if (src) {
      const img = make("img", "size-full object-cover");
      img.src = src;
      img.alt = "";
      img.width = size;
      img.height = size;
      box.append(img);
    }
    return box;
  };

  // ------------------------------------------------------------- over the video
  const header = document.querySelector("[data-cabecera]");
  const hero = document.querySelector("[data-hero-media]");
  if (header && hero && header.dataset.cabecera === "sobre" && "IntersectionObserver" in window) {
    const watch = new IntersectionObserver(
      ([entry]) => {
        header.dataset.cabecera = entry.isIntersecting ? "sobre" : "solida";
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );
    watch.observe(hero);
  } else if (header) {
    header.dataset.cabecera = "solida";
  }

  // ---------------------------------------------------------------- the video
  const toggle = document.querySelector("[data-hero-toggle]");
  const video = document.querySelector("[data-hero-video]");
  if (toggle && video) {
    const show = () => {
      const paused = video.paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Reproducir el video" : "Pausar el video");
    };
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener("play", show);
    video.addEventListener("pause", show);
    show();
  }

  // ------------------------------------------------------------- live search
  const input = document.querySelector("[data-buscador-q]");
  const results = document.querySelector("[data-buscador-resultados]");
  if (input && results) {
    let timer = 0;
    let asked = "";
    const draw = (items, query) => {
      if (!items.length) {
        results.replaceChildren(
          make("li", "px-2 py-3 text-ui text-text-muted", `Sin resultados para «${query}».`),
        );
        return;
      }
      results.replaceChildren(
        ...items.map((item) => {
          const link = make(
            "a",
            "flex min-h-16 items-center gap-4 rounded-control p-2 transition-colors duration-150 hover:bg-surface-1",
          );
          link.href = item.url;
          const text = make("span", "flex flex-col");
          text.append(
            make("span", "font-display text-lead", item.nombre),
            make("span", "text-meta text-sand tabular-nums", `$${item.precio} / ${item.unidad}`),
          );
          link.append(thumbnail(item.imagen, 56, "size-14 shrink-0 overflow-hidden rounded-control bg-surface-1"), text);
          const li = make("li");
          li.append(link);
          return li;
        }),
      );
    };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const query = input.value.trim();
      if (query.length < 2) {
        asked = "";
        results.replaceChildren();
        return;
      }
      timer = setTimeout(async () => {
        asked = query;
        try {
          const response = await fetch(`/buscar/?q=${encodeURIComponent(query)}`, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) return;
          const data = await response.json();
          if (asked === query) draw(data.resultados || [], query);
        } catch {
          /* offline: the form still submits to the catalogue */
        }
      }, 220);
    });
  }

  // ------------------------------------------------------- cart panel and Esc
  // The cart panel is popover="manual" so the page behind it stays usable (Engram #541); a
  // manual popover ignores Esc, so Esc closes it here.
  const bag = document.getElementById("bolsa");
  if (bag) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && bag.matches(":popover-open")) bag.hidePopover();
    });
  }

  // --------------------------------------------------------------- favourites
  const KEY = "carni:favoritos";
  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(saved) ? saved.filter((item) => item && item.id && item.url) : [];
    } catch {
      return [];
    }
  };
  const write = (saved) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved.slice(0, 50)));
    } catch {
      /* private mode: the hearts still toggle for this page */
    }
  };
  const list = document.querySelector("[data-favoritos-lista]");
  const empty = document.querySelector("[data-favoritos-vacio]");
  const count = document.querySelector("[data-fav-count]");

  const render = () => {
    const saved = read();
    const ids = new Set(saved.map((item) => String(item.id)));
    document.querySelectorAll("[data-favorito]").forEach((button) => {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(ids.has(button.dataset.favorito)));
    });
    if (count) {
      count.textContent = String(saved.length);
      count.hidden = saved.length === 0;
    }
    if (empty) empty.hidden = saved.length > 0;
    if (!list) return;
    list.replaceChildren(
      ...saved.map((item) => {
        const link = make("a", "flex min-w-0 flex-1 items-center gap-4 hover:text-sand");
        link.href = item.url;
        const text = make("span", "flex min-w-0 flex-col");
        text.append(
          make("span", "truncate font-display text-lead", item.nombre),
          make("span", "text-meta text-text-muted tabular-nums", `$${item.precio}`),
        );
        link.append(thumbnail(item.imagen, 64, "size-16 shrink-0 overflow-hidden rounded-control bg-surface-1"), text);
        const remove = make(
          "button",
          "min-h-11 text-meta text-text-muted underline underline-offset-4 hover:text-red-text",
          "Quitar",
        );
        remove.type = "button";
        remove.addEventListener("click", () => {
          write(read().filter((other) => String(other.id) !== String(item.id)));
          render();
        });
        const li = make("li", "flex items-center gap-4 py-4");
        li.append(link, remove);
        return li;
      }),
    );
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorito]");
    if (!button) return;
    const id = button.dataset.favorito;
    const saved = read();
    const next = saved.some((item) => String(item.id) === id)
      ? saved.filter((item) => String(item.id) !== id)
      : [
          {
            id,
            nombre: button.dataset.nombre,
            url: button.dataset.url,
            imagen: button.dataset.imagen,
            precio: button.dataset.precio,
          },
          ...saved,
        ];
    write(next);
    render();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) render();
  });
  render();
})();
