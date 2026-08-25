// Header scroll behavior y Mobile drawer functionality
(function() {
    function initHeader() {
    // Header scroll behavior
    const header = document.querySelector('.main-header');
    const miniHeader = document.querySelector('.mini-header');
    const body = document.body;

    if (header) {
        // Distance the pointer must travel in one direction before the header is
        // allowed to change state. Momentum and trackpad scrolling report constant
        // one-pixel reversals; without a deadzone every one of them flipped the
        // class and the header snapped in and out over the content below.
        const DIRECTION_DEADZONE = 8;
        const COLLAPSE_AFTER = 90;

        let lastScroll = window.pageYOffset;
        let anchor = lastScroll;      // last position where direction actually changed
        let collapsed = false;
        let queued = false;

        function applyScrollState() {
            queued = false;
            const currentScroll = window.pageYOffset;
            const delta = currentScroll - anchor;

            if (Math.abs(delta) < DIRECTION_DEADZONE) {
                lastScroll = currentScroll;
                return;
            }

            const shouldCollapse = delta > 0 && currentScroll > COLLAPSE_AFTER;
            anchor = currentScroll;
            lastScroll = currentScroll;

            // Writing a class that is already present still costs an attribute
            // mutation on every scroll event. Only touch the DOM when the state
            // genuinely changes.
            if (shouldCollapse === collapsed) return;
            collapsed = shouldCollapse;

            header.classList.toggle('scrolled', collapsed);
            miniHeader?.classList.toggle('mini-header--hidden', collapsed);
            body.classList.toggle('header-collapsed', collapsed);
        }

        // Scroll fires far more often than the screen refreshes. Coalescing into
        // one animation frame keeps style work off the scrolling path.
        window.addEventListener('scroll', () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(applyScrollState);
        }, { passive: true });
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