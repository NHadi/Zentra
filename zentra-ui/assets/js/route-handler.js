// Use IIFE to avoid global variable pollution
(function() {
    let isInitialized = false;
    let isProcessingRoute = false;
    let currentPath = null;
    let lastLoadTime = 0;
    let routeQueue = [];

    window.initializeRoutes = function(menus) {
        if (isInitialized) {
            console.log('Routes already initialized');
            return;
        }
        
        // Remove any existing click handlers
        $(document).off('click', '.nav-link[href], a[href]:not(.nav-link)');
        
        // Handle all navigation clicks in one handler
        $(document).on('click', '.nav-link[href], a[href]:not(.nav-link)', function(e) {
            const href = $(this).attr('href');
            // Skip if link has data-no-route attribute
            if ($(this).attr('data-no-route')) {
                console.log('Skipping route change due to data-no-route');
                return;
            }
            if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto:')) {
                e.preventDefault();
                e.stopPropagation();
                handleRoute(href);
            }
        });

        // Initial route handling
        const initialPath = window.location.pathname;
        if (!initialPath.includes('login.html')) {
            // For index page or root, load dashboard
            if (initialPath === '/' || initialPath === '/index.html' || initialPath === '') {
                handleRoute('/', false);
            } else {
                handleRoute(initialPath, false);
            }
        }

        isInitialized = true;
    };

    function handleRoute(path, addToHistory = true) {
        // Add to queue if currently processing
        if (isProcessingRoute) {
            routeQueue.push({ path, addToHistory });
            return;
        }

        // Prevent rapid repeated route changes
        const now = Date.now();
        if (now - lastLoadTime < 500) {
            console.log('Route change too frequent, skipping');
            return;
        }

        // Clean up path and handle special cases
        path = path.replace(/^\/+|\/+$/g, '');
        if (!path || path === 'index.html') {
            path = '/';
        }
        
        // Skip if same path and content exists
        if (path === currentPath && $('#main-content').children().length > 0) {
            console.log('Same path with content, skipping:', path);
            return;
        }

        isProcessingRoute = true;
        lastLoadTime = now;

        try {
            // Update URL if needed
            if (addToHistory) {
                window.history.pushState({}, '', path === '/' ? '/' : path);
            }

            // Load content
            if (window.contentLoader) {
                window.contentLoader.loadContent(path)
                    .catch(error => {
                        console.error('Error loading content:', error);
                    })
                    .finally(() => {
                        isProcessingRoute = false;
                        
                        // Process next route in queue if any
                        if (routeQueue.length > 0) {
                            const nextRoute = routeQueue.shift();
                            handleRoute(nextRoute.path, nextRoute.addToHistory);
                        }
                    });
            } else {
                console.error('Content loader not available');
                isProcessingRoute = false;
            }
            
            currentPath = path;
        } catch (error) {
            console.error('Error handling route:', error);
            isProcessingRoute = false;
        }
    }

    function findMenuByPath(menus, path) {
        for (const menu of menus) {
            if (menu.url && (menu.url === path || menu.url === '/' + path)) {
                return true;
            }
            if (menu.children && menu.children.length > 0) {
                if (findMenuByPath(menu.children, path)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Handle browser back/forward buttons
    window.onpopstate = function(event) {
        handleRoute(window.location.pathname, false);
    };
})();