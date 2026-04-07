// Header scroll behavior y Mobile drawer functionality
(function() {
    function initHeader() {
    // Header scroll behavior
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    if (header) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }

    // Mobile drawer functionality (hamburger menu mejorado)
    const menuToggle = document.getElementById('menuToggle');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const body = document.body;

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
        const drawerLinks = mobileDrawer.querySelectorAll('a');
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