/**
 * Application Configuration
 * Central place for all app settings and constants
 */

const CONFIG = {
    // API & Content Paths
    paths: {
        pages: 'paginas',
        images: 'img'
    },

    // Page mapping
    pages: {
        about: 'pagina1.html',
        projects: 'pagina2.html',
        contact: 'pagina3.html',
        blog: 'blog.html'
    },

    // Animation settings
    animations: {
        fadeDuration: 300,
        slideDelay: 100
    },

    // Cache settings
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000 // 5 minutes
    },

    // Breakpoints (matches CSS)
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        wide: 1280
    },

    // Feature flags
    features: {
        darkMode: false,
        analytics: false,
        comments: false
    },

    // Error messages
    messages: {
        loadError: 'Error al cargar el contenido',
        notFound: 'Página no encontrada',
        networkError: 'Error de conexión. Por favor, verifica tu conexión a internet.'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}