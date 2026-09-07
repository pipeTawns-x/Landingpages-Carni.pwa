// Header scroll behavior y Mobile drawer functionality
(function() {
    function initHeader() {
    // Header scroll behavior
    const header = document.querySelector('.main-header');
    const miniHeader = document.querySelector('.mini-header');
    const body = document.body;

    // EL ESTADO DEL ENCABEZADO AL HACER SCROLL YA NO VIVE AQUI.
    //
    // Este bloque escondía el encabezado al bajar —`header.classList.toggle(
    // 'scrolled')`, y `.main-header.scrolled` lo sube con
    // `transform: translateY(-100%)` hasta sacarlo de pantalla— y lo devolvía
    // al subir. Retirado el 2026-08-31 por dos motivos:
    //
    // 1. No es lo que se pidió. La referencia es Louis Vuitton, donde la barra
    //    NUNCA se va: se queda arriba y cambia de transparente a blanca. Un
    //    encabezado que aparece y desaparece según la dirección del dedo es el
    //    patrón contrario.
    // 2. Peleaba con `js/modules/ui/header-scroll.js`. Dos módulos escribiendo
    //    clases sobre el mismo elemento en el mismo evento, cada uno con su
    //    propia idea de cuál es el estado correcto.
    //
    // Ahora el estado del encabezado tiene UN solo dueño: `header-scroll.js`.
    // Este archivo se queda con el cajón móvil, que es lo suyo.
    if (miniHeader) {
        // El mini-header sí conserva su plegado: es una barra secundaria y
        // esconderla al bajar no le quita nada a la navegación.
        let plegado = false;
        let encolado = false;

        function estadoMiniHeader() {
            encolado = false;
            const debePlegarse = window.pageYOffset > 90;
            if (debePlegarse === plegado) return;
            plegado = debePlegarse;
            miniHeader.classList.toggle('mini-header--hidden', plegado);
            body.classList.toggle('header-collapsed', plegado);
        }

        window.addEventListener('scroll', () => {
            if (encolado) return;
            encolado = true;
            requestAnimationFrame(estadoMiniHeader);
        }, { passive: true });

        estadoMiniHeader();
    }

    // Mobile drawer functionality (hamburger menu mejorado)
    const menuToggle = document.getElementById('menuToggle');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const mobileDrawer = document.getElementById('mobileDrawer');

    function openDrawer() {
        if (mobileDrawer && drawerOverlay) {
            mobileDrawer.setAttribute('aria-hidden', 'false');
            drawerOverlay.classList.add('active');
            if (menuToggle) menuToggle.classList.add('active');
            body.style.overflow = 'hidden';
        }
    }

    function closeDrawer() {
        if (mobileDrawer && drawerOverlay) {
            mobileDrawer.setAttribute('aria-hidden', 'true');
            drawerOverlay.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
            body.style.overflow = '';
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openDrawer();
        });
    }

    if (drawerClose) {
        drawerClose.addEventListener('click', closeDrawer);
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Cerrar drawer al hacer clic en un enlace
    if (mobileDrawer) {
        // Buttons count too: the loyalty trigger now lives in the drawer, and
        // its modal would otherwise open on top of a drawer left hanging open.
        const drawerLinks = mobileDrawer.querySelectorAll('a, button[data-loyalty-trigger]');
        drawerLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeDrawer();
            });
        });
    }

    // Cerrar drawer con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer && mobileDrawer.getAttribute('aria-hidden') === 'false') {
            closeDrawer();
        }
    });
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        // DOM ya está listo
        initHeader();
    }
})();