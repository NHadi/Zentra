// Create a self-executing function to avoid global scope pollution
(function() {
    // Store loaded scripts to prevent duplicate loading
    const loadedScripts = new Set();
    const loadedStyles = new Set();
    
    window.contentLoader = {
        currentPath: null,
        isLoading: false,
        
        clearContent: function() {
            // Clear all dynamic content areas
            $('#main-content').empty();
            $('#stats-container').hide();
            $('#page-actions').empty();
            // Reset page header to prevent stale data
            $('#page-title').text('');
            $('#breadcrumb-parent').text('');
            $('#breadcrumb-current').text('');
        },

        showError: function(message, path) {
            // Clear existing content first
            this.clearContent();
            
            // Update header with error state
            $('#page-title').text('Not Found');
            $('#breadcrumb-parent').text('Error');
            $('#breadcrumb-current').text('Page Not Found');
            
            // Show error message with more details
            $('#main-content').html(`
                <div class="container-fluid mt-4">
                    <div class="alert alert-danger" role="alert">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-exclamation-circle fa-2x mr-3"></i>
                            <div>
                                <h4 class="alert-heading mb-2">Component Not Found</h4>
                                <p class="mb-1">${message}</p>
                                <hr>
                                <div class="mt-3">
                                    <p class="mb-1"><strong>Possible solutions:</strong></p>
                                    <ul class="mb-0">
                                        <li>Check if the component file exists in the correct location</li>
                                        <li>Verify the path in your menu configuration</li>
                                        <li>Ensure the component name matches exactly</li>
                                    </ul>
                                </div>
                                <div class="mt-3">
                                    <a href="/" class="btn btn-outline-primary">
                                        <i class="fas fa-home mr-1"></i> Return to Dashboard
                                    </a>
                                    <button onclick="window.history.back()" class="btn btn-outline-secondary ml-2">
                                        <i class="fas fa-arrow-left mr-1"></i> Go Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        },

        loadContent: async function(path) {
            // If already loading, prevent duplicate load
            if (this.isLoading) {
                console.log('Already loading content, skipping');
                return;
            }
            
            // Set loading state
            this.isLoading = true;
            
            try {
                // Clean path and handle special cases
                path = (path || '').split('#')[0].replace(/^\/+|\/+$/g, '');
                if (path === 'index.html') {
                    path = '';
                }
                
                // Check authentication
                const token = localStorage.getItem('token');
                if (!token && path !== 'login') {
                    window.location.href = '/login.html';
                    return;
                }

                // Clear existing content before any loading attempt
                this.clearContent();

                // Find current menu and update header
                const menus = JSON.parse(localStorage.getItem('menus') || '[]');
                const currentMenu = path === '' ? { name: 'Dashboard', url: '/' } : this.findMenuByPath(menus, path);

                // Handle content loading based on path
                if (path === '' || path === '/') {
                    // Load dashboard
                    await this.loadDashboard();
                    this.updatePageHeader({ name: 'Dashboard', url: '/' });
                } else if (currentMenu) {
                    // Update header before loading content
                    this.updatePageHeader(currentMenu);
                    
                    // Load appropriate content
                    switch (path) {
                        case 'menu':
                            await this.loadMenuGrid();
                            break;
                        case 'zone':
                            await this.loadZoneGrid();
                            break;
                        case 'region':
                            await this.loadRegionGrid();
                            break;
                        case 'office':
                            await this.loadOfficeGrid();
                            break;
                        case 'audit':
                            await this.loadAuditGrid();
                            break;
                        case 'role':
                            await this.loadRoleGrid();
                            break;
                        case 'permission':
                            await this.loadPermissionGrid();
                            break;
                        case 'backup':
                            await this.loadBackupGrid();
                            break;
                        case 'division':
                            await this.loadDivisionGrid();
                            break;
                        case 'employee':
                            await this.loadEmployeeGrid();
                            break;
                        case 'product':
                            await this.loadProductGrid();
                            break;
                        case 'product-category':
                            await this.loadProductCategoryGrid();
                            break;
                        case 'user':
                            await this.loadUserGrid();
                            break;
                        case 'order':
                            await this.loadOrderGrid();
                            break;
                        case 'task':
                            await this.loadTaskGrid();
                            break;
                        case 'item':
                            await this.loadItemGrid();
                            break;
                        case 'payment':
                            await this.loadPaymentGrid();
                            break;
                        case 'stock-opname':
                            await this.loadStockOpnameGrid();
                            break;
                        case 'stock-movement':
                            await this.loadStockMovementGrid();
                            break;
                        case 'supplier':
                            await this.loadSupplierGrid();
                            break;
                        case 'makloon':
                            await this.loadMakloonGrid();
                            break;
                        case 'model-builder':
                            await this.loadMLServicesGrid();
                            break;
                        case 'cash-flow':
                            await this.loadCashFlowGrid();
                            break;
                        case 'purchase-list':
                            await this.loadPurchaseOrder();
                            break;
                        case 'spk-data':
                            await this.loadSPKData();
                            break;
                        case 'petty-cash':
                            await this.loadPettyCashGrid();
                            break;
                        case 'transaction-category':
                            await this.loadTransactionCategoriesGrid();
                            break;
                        case 'petty-cash-request':
                            await this.loadPettyCashRequestsGrid();
                            break;
                        case 'petty-cash-summary':
                            await this.loadPettyCashSummary();
                            break;
                        default:
                            try {
                                await this.loadDefaultContent('/' + path);
                            } catch (error) {
                                console.error('Content loading error:', error.message);
                                this.showError(`The page "${path}" could not be loaded: ${error.message}`, path);
                                return;
                            }
                    }
                } else {
                    // Show error for non-existent pages and return early
                    this.showError(`The page "${path}" is not available in your menu.`, path);
                    return;
                }
                
                // Only update current path if content was loaded successfully
                this.currentPath = path;
            } catch (error) {
                console.error('Error loading content:', error);
                this.showError('An error occurred while loading the page.', path);
            } finally {
                this.isLoading = false;
            }
        },

        loadScript: function(src) {
            return new Promise((resolve, reject) => {
                if (loadedScripts.has(src)) {
                    resolve();
                    return;
                }

                const existingScript = document.querySelector(`script[src="${src}"]`);
                if (existingScript) {
                    loadedScripts.add(src);
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedScripts.add(src);
                    resolve();
                };
                script.onerror = reject;
                document.body.appendChild(script);
            });
        },

        loadStyle: function(href) {
            return new Promise((resolve, reject) => {
                if (loadedStyles.has(href)) {
                    resolve();
                    return;
                }

                const existingLink = document.querySelector(`link[href="${href}"]`);
                if (existingLink) {
                    loadedStyles.add(href);
                    resolve();
                    return;
                }

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = () => {
                    loadedStyles.add(href);
                    resolve();
                };
                link.onerror = reject;
                document.head.appendChild(link);
            });
        },

        loadMenuGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.menuPageInstance) {
                window.menuPageInstance.dispose();
                window.menuPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/menu.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="menu"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the menu.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/menu.js';
                        script.setAttribute('data-page', 'menu');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the menu page instance
                            if (!window.menuPageInstance) {
                                window.menuPageInstance = new window.MenuPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load menu module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load menu component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load menu component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadZoneGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.zonePageInstance) {
                window.zonePageInstance.dispose();
                window.zonePageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/zone.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="zone"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the zone.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/zone.js';
                        script.setAttribute('data-page', 'zone');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the zone page instance
                            if (!window.zonePageInstance) {
                                window.zonePageInstance = new window.ZonePage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load zone module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load zone component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load zone component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadRegionGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.regionPageInstance) {
                window.regionPageInstance.dispose();
                window.regionPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/region.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="region"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the region.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/region.js';
                        script.setAttribute('data-page', 'region');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the region page instance
                            if (!window.regionPageInstance) {
                                window.regionPageInstance = new window.RegionPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load region module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load region component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load region component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadOfficeGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.officePageInstance) {
                window.officePageInstance.dispose();
                window.officePageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/office.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="office"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the office.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/office.js';
                        script.setAttribute('data-page', 'office');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the office page instance
                            if (!window.officePageInstance) {
                                window.officePageInstance = new window.OfficePage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load office module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load office component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load office component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadAuditGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.auditPageInstance) {
                window.auditPageInstance.dispose();
                window.auditPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/audit.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="audit"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the audit.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/audit.js';
                        script.setAttribute('data-page', 'audit');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the audit page instance
                            if (!window.auditPageInstance) {
                                window.auditPageInstance = new window.AuditPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load audit module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load audit component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load audit component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadRoleGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.rolePageInstance) {
                window.rolePageInstance.dispose();
                window.rolePageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/role.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="role"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the role.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/role.js';
                        script.setAttribute('data-page', 'role');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the role page instance
                            if (!window.rolePageInstance) {
                                window.rolePageInstance = new window.RolePage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load role module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load role component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load role component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadBackupGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.backupPageInstance) {
                window.backupPageInstance.dispose();
                window.backupPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/backup.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="backup"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the backup.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/backup.js';
                        script.setAttribute('data-page', 'backup');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the backup page instance
                            if (!window.backupPageInstance) {
                                window.backupPageInstance = new window.BackupPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load backup module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load backup component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load backup component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadDivisionGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.divisionPageInstance) {
                window.divisionPageInstance.dispose();
                window.divisionPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/division.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="division"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the division.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/division.js';
                        script.setAttribute('data-page', 'division');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the division page instance
                            if (!window.divisionPageInstance) {
                                window.divisionPageInstance = new window.DivisionPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load division module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load division component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load division component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadEmployeeGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.employeePageInstance) {
                window.employeePageInstance.dispose();
                window.employeePageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/employee.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="employee"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the employee.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/employee.js';
                        script.setAttribute('data-page', 'employee');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the employee page instance
                            if (!window.employeePageInstance) {
                                window.employeePageInstance = new window.EmployeePage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load employee module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load employee component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load employee component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadProductGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.productPageInstance) {
                window.productPageInstance.dispose();
                window.productPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/product.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="product"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the product.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/product.js';
                        script.setAttribute('data-page', 'product');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the product page instance
                            if (!window.productPageInstance) {
                                window.productPageInstance = new window.ProductPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load product module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load product component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load product component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadProductCategoryGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.productCategoryPageInstance) {
                window.productCategoryPageInstance.dispose();
                window.productCategoryPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/product-category.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="product-category"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the product-category.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/product-category.js';
                        script.setAttribute('data-page', 'product-category');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the product category page instance
                            if (!window.productCategoryPageInstance) {
                                window.productCategoryPageInstance = new window.ProductCategoryPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load product category module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load product category component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load product category component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadUserGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.userPageInstance) {
                window.userPageInstance.dispose();
                window.userPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/user.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="user"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the user.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/user.js';
                        script.setAttribute('data-page', 'user');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the user page instance
                            if (!window.userPageInstance) {
                                window.userPageInstance = new window.UserPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load user module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load user component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load user component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadOrderGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.orderPageInstance) {
                window.orderPageInstance.dispose();
                window.orderPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/order.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="order"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the order.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/order.js';
                        script.setAttribute('data-page', 'order');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the order page instance
                            if (!window.orderPageInstance) {
                                window.orderPageInstance = new window.OrderPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load order module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load order component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load order component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadTaskGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.taskPageInstance) {
                window.taskPageInstance.dispose();
                window.taskPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/task.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="task"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the task.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/task.js';
                        script.setAttribute('data-page', 'task');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the task page instance
                            if (!window.taskPageInstance) {
                                window.taskPageInstance = new window.TaskPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load task module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load task component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load task component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadPermissionGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.permissionPageInstance) {
                window.permissionPageInstance.dispose();
                window.permissionPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/permission.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="permission"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the permission.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/permission.js';
                        script.setAttribute('data-page', 'permission');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the permission page instance
                            if (!window.permissionPageInstance) {
                                window.permissionPageInstance = new window.PermissionPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load permission module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load permission component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load permission component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadItemGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.itemPageInstance) {
                window.itemPageInstance.dispose();
                window.itemPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/item.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="item"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the item.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/item.js';
                        script.setAttribute('data-page', 'item');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the item page instance
                            if (!window.itemPageInstance) {
                                window.itemPageInstance = new window.ItemPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load item module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load item component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load item component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadPaymentGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.paymentPageInstance) {
                window.paymentPageInstance.dispose();
                window.paymentPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/payment.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="payment"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the payment.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/payment.js';
                        script.setAttribute('data-page', 'payment');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the payment page instance
                            if (!window.paymentPageInstance) {
                                window.paymentPageInstance = new window.PaymentPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load payment module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load payment component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load payment component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadStockOpnameGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.stockOpnamePageInstance) {
                window.stockOpnamePageInstance.dispose();
                window.stockOpnamePageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/stock-opname.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="stock-opname"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the stock-opname.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/stock-opname.js';
                        script.setAttribute('data-page', 'stock-opname');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the stock opname page instance
                            if (!window.stockOpnamePageInstance) {
                                window.stockOpnamePageInstance = new window.StockOpnamePage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load stock opname module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load stock opname component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load stock opname component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadStockMovementGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.stockMovementPageInstance) {
                window.stockMovementPageInstance.dispose();
                window.stockMovementPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/stock-movement.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="stock-movement"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the stock-movement.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/stock-movement.js';
                        script.setAttribute('data-page', 'stock-movement');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the stock movement page instance
                            if (!window.stockMovementPageInstance) {
                                window.stockMovementPageInstance = new window.StockMovementPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load stock movement module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load stock movement component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load stock movement component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadDefaultContent: function(path) {
            return new Promise((resolve, reject) => {
                const componentPath = `components${path}.html`;
                console.log('Loading component:', componentPath);
                
                fetch(componentPath)
                    .then(response => {
                        if (!response.ok) {
                            if (response.status === 404) {
                                throw new Error(`The component "${path}" could not be found. Please check the file path: ${componentPath}`);
                            }
                            throw new Error(`Failed to load component (${response.status}): ${componentPath}`);
                        }
                        return response.text();
                    })
                    .then(content => {
                        // Check if content is empty or just whitespace
                        if (!content || !content.trim()) {
                            throw new Error(`The component file "${componentPath}" exists but appears to be empty.`);
                        }

                        // Content looks valid, load it into the DOM
                        $('#main-content').html(content);
                        resolve();
                    })
                    .catch(error => {
                        console.error('Failed to load component:', error);
                        reject(error);
                    });
            });
        },

        findMenuByPath: function(menus, path) {
            for (const menu of menus) {
                if (menu.url && (menu.url === path || menu.url === '/' + path)) {
                    return menu;
                }
                if (menu.children && menu.children.length > 0) {
                    const found = this.findMenuByPath(menu.children, path);
                    if (found) return found;
                }
            }
            return null;
        },

        updatePageHeader: function(menu) {
            // Update page title
            $('#page-title').text(menu.name);
            
            // Update breadcrumb
            const parentMenu = this.findParentMenu(JSON.parse(localStorage.getItem('menus')), menu.id);
            $('#breadcrumb-parent').text(parentMenu ? parentMenu.name : 'Home');
            $('#breadcrumb-current').text(menu.name);
            
            // Show/hide stats container
            $('#stats-container').toggle(menu.url === '/');

            // Remove active class from all menu items
            $('.sidenav .nav-item').removeClass('active');
            $('.sidenav .nav-item .nav-link').removeClass('active');
            
            // Find and activate the current menu item
            const currentPath = menu.url.replace(/^\/+/, '');
            const menuLink = $(`.sidenav .nav-link[href*="${currentPath}"]`);
            
            if (menuLink.length) {
                // Add active class to the menu item
                menuLink.closest('.nav-item').addClass('active');
                menuLink.addClass('active');
                
                // If it's a submenu item, expand the parent menu
                const parentCollapse = menuLink.closest('.collapse');
                if (parentCollapse.length) {
                    parentCollapse.addClass('show');
                    parentCollapse.prev('.nav-link').attr('aria-expanded', 'true');
                    parentCollapse.prev('.nav-link').closest('.nav-item').addClass('active');
                }
            }
        },

        findParentMenu: function(menus, childId) {
            for (const menu of menus) {
                if (menu.children) {
                    for (const child of menu.children) {
                        if (child.id === childId) return menu;
                    }
                    const found = this.findParentMenu(menu.children, childId);
                    if (found) return found;
                }
            }
            return null;
        },

        loadDashboard: function() {
            return new Promise((resolve) => {
                // Show stats container first to prevent flashing
                $('#stats-container').show();
                
                // Load dashboard content
                $('#main-content').load('components/dashboard.html', () => {
                    resolve();
                });
            });
        },

        loadMakloonGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.makloonPageInstance) {
                window.makloonPageInstance.dispose();
                window.makloonPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/makloon.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="makloon"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the makloon.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/makloon.js';
                        script.setAttribute('data-page', 'makloon');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the makloon page instance
                            if (!window.makloonPageInstance) {
                                window.makloonPageInstance = new window.MakloonPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load makloon module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load makloon component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load makloon component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadMLServicesGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.mlServicesPageInstance) {
                window.mlServicesPageInstance.dispose();
                window.mlServicesPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/ml_services.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="ml_services"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the ml_services.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/ml_services.js';
                        script.setAttribute('data-page', 'ml_services');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the ML services page instance
                            if (!window.mlServicesPageInstance) {
                                window.mlServicesPageInstance = new window.MLServicesPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load ML services module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load ML services component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load ML services component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadSupplierGrid: function() {
            return new Promise((resolve, reject) => {
                // Dispose existing instance if it exists
                if (window.supplierPageInstance) {
                    window.supplierPageInstance.dispose();
                    window.supplierPageInstance = null;
                }

                $('#main-content').load('components/supplier.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="supplier"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the supplier.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/supplier.js';
                        script.setAttribute('data-page', 'supplier');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the supplier page instance
                            if (!window.supplierPageInstance) {
                                window.supplierPageInstance = new window.SupplierPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load supplier module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load supplier component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load supplier component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadCashFlowGrid: async function() {

            // Only dispose if we're loading a new instance
            if (window.cashFlowPageInstance) {
                window.cashFlowPageInstance.dispose();
                window.cashFlowPageInstance = null;
            }
            return new Promise(async (resolve, reject) => {
                try {
                    // Load the cash flow component HTML
                    const response = await fetch('./components/cash-flow.html');
                    if (!response.ok) {
                        throw new Error('Failed to load cash flow component');
                    }
                    const html = await response.text();
                    $('#main-content').html(html);

                    // Wait for DevExpress to be available
                    await new Promise(resolve => {
                        const checkDevExtreme = () => {
                            if (typeof DevExpress !== 'undefined') {
                                resolve();
                            } else {
                                setTimeout(checkDevExtreme, 100);
                            }
                        };
                        checkDevExtreme();
                    });

                    // Remove any existing script
                    const existingScript = document.querySelector('script[data-page="cash-flow"]');
                    if (existingScript) {
                        existingScript.remove();
                    }

                    // Create a script element with type="module" to load the cash-flow.js module
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = './assets/js/pages/cash-flow.js';
                    script.setAttribute('data-page', 'cash-flow');
                    
                    // Handle script load/error
                    script.onload = () => {
                        // Initialize the cash flow page instance
                        if (!window.cashFlowPageInstance) {
                            window.cashFlowPageInstance = new window.CashFlowPage();
                        }
                        resolve();
                    };
                    script.onerror = (error) => {
                        console.error('Failed to load cash flow module:', error);
                        reject(error);
                    };
                    
                    document.body.appendChild(script);
                } catch (error) {
                    console.error('Failed to load cash flow component:', error);
                    $('#main-content').html('<div class="alert alert-danger">Failed to load cash flow component</div>');
                    reject(error);
                }
            });
        },

        loadPurchaseOrder: async function() {
            // Only dispose if we're loading a new instance
            if (window.purchaseOrderPageInstance) {
                window.purchaseOrderPageInstance.dispose();
                window.purchaseOrderPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/purchase-order.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="purchase-order"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the purchase-order.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/purchase-order.js';
                        script.setAttribute('data-page', 'purchase-order');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the purchase order page instance
                            if (!window.purchaseOrderPageInstance) {
                                window.purchaseOrderPageInstance = new window.PurchaseOrderPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load purchase order module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load purchase order component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load purchase order component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadSPKData: async function() {
            // Only dispose if we're loading a new instance
            if (window.spkPageInstance) {
                window.spkPageInstance.dispose();
                window.spkPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/spk-data.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="spk-data"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the spk-data.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/spk-data.js';
                        script.setAttribute('data-page', 'spk-data');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the SPK page instance
                            if (!window.spkPageInstance) {
                                window.spkPageInstance = new window.SPKPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load SPK data module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load SPK data component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load SPK data component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadPettyCashGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.pettyCashPageInstance) {
                window.pettyCashPageInstance.dispose();
                window.pettyCashPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/petty-cash.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="petty-cash"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the petty-cash.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/petty-cash.js';
                        script.setAttribute('data-page', 'petty-cash');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the petty cash page instance
                            if (!window.pettyCashPageInstance) {
                                window.pettyCashPageInstance = new window.PettyCashPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load petty cash module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load petty cash component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load petty cash component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadTransactionCategoriesGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.transactionCategoryPageInstance) {
                window.transactionCategoryPageInstance.dispose();
                window.transactionCategoryPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/transaction-categories.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="transaction-categories"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the transaction-categories.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/transaction-categories.js';
                        script.setAttribute('data-page', 'transaction-categories');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the transaction categories page instance
                            if (!window.transactionCategoryPageInstance) {
                                window.transactionCategoryPageInstance = new window.TransactionCategoryPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load transaction categories module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load transaction categories component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load transaction categories component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadPettyCashRequestsGrid: async function() {
            // Only dispose if we're loading a new instance
            if (window.pettyCashRequestsPageInstance) {
                window.pettyCashRequestsPageInstance.dispose();
                window.pettyCashRequestsPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/petty-cash-requests.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="petty-cash-requests"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the petty-cash-requests.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/petty-cash-requests.js';
                        script.setAttribute('data-page', 'petty-cash-requests');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the petty cash requests page instance
                            if (!window.pettyCashRequestsPageInstance) {
                                window.pettyCashRequestsPageInstance = new window.PettyCashRequestsPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load petty cash requests module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load petty cash requests component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load petty cash requests component</div>');
                        reject(error);
                    }
                });
            });
        },

        loadPettyCashSummary: async function() {
            // Only dispose if we're loading a new instance
            if (window.pettyCashSummaryPageInstance) {
                window.pettyCashSummaryPageInstance.dispose();
                window.pettyCashSummaryPageInstance = null;
            }

            return new Promise((resolve, reject) => {
                $('#main-content').load('components/petty-cash-summary.html', async () => {
                    try {
                        // Wait for DevExtreme to load
                        await new Promise(resolve => {
                            const checkDevExtreme = () => {
                                if (typeof DevExpress !== 'undefined') {
                                    resolve();
                                } else {
                                    setTimeout(checkDevExtreme, 100);
                                }
                            };
                            checkDevExtreme();
                        });

                        // Remove any existing script
                        const existingScript = document.querySelector('script[data-page="petty-cash-summary"]');
                        if (existingScript) {
                            existingScript.remove();
                        }

                        // Create a script element with type="module" to load the petty-cash-summary.js module
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.src = './assets/js/pages/petty-cash-summary.js';
                        script.setAttribute('data-page', 'petty-cash-summary');
                        
                        // Handle script load/error
                        script.onload = () => {
                            // Initialize the petty cash summary page instance
                            if (!window.pettyCashSummaryPageInstance) {
                                window.pettyCashSummaryPageInstance = new window.PettyCashSummaryPage();
                            }
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error('Failed to load petty cash summary module:', error);
                            reject(error);
                        };
                        
                        document.body.appendChild(script);
                    } catch (error) {
                        console.error('Failed to load petty cash summary component:', error);
                        $('#main-content').html('<div class="alert alert-danger">Failed to load petty cash summary component</div>');
                        reject(error);
                    }
                });
            });
        }
    };
})();