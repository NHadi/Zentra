import { zentra } from '../api/index.js';

// Define RolePage
window.RolePage = class {
    constructor() {
        this.grid = null;
        this.permissionCategories = new Map();
        this.selectedPermissions = new Set();
        this.currentRole = null;
        this.allPermissions = [];
        this.permissionFilter = '';
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        // Clean up event listeners
        $('#permissionModal').off('shown.bs.modal hidden.bs.modal');
        $('#savePermissions').off('click');
        $('.select-all-category').off('click');
        $('#permissionSearchBox').off('input');
    }

    bindEvents() {
        // Permission modal events
        $('#permissionModal').on('shown.bs.modal', () => {
            this.renderPermissionCategories();
            // Clear search box when modal opens
            $('#permissionSearchBox').val('');
            this.permissionFilter = '';
        });

        $('#permissionModal').on('hidden.bs.modal', () => {
            this.selectedPermissions.clear();
            this.currentRole = null;
            this.permissionFilter = '';
        });

        $('#savePermissions').on('click', () => {
            this.savePermissions();
        });

        // Permission search box
        $('#permissionSearchBox').on('input', (e) => {
            this.permissionFilter = e.target.value.toLowerCase();
            this.renderPermissionCategories();
        });

        // Category select all functionality
        $(document).on('click', '.select-all-category', (e) => {
            const category = $(e.currentTarget).data('category');
            const isChecked = $(e.currentTarget).prop('checked');
            const categoryPermissions = this.allPermissions.filter(p => 
                this.getPermissionCategory(p.name) === category
            );
            
            categoryPermissions.forEach(permission => {
                if (isChecked) {
                    this.selectedPermissions.add(permission.id);
                } else {
                    this.selectedPermissions.delete(permission.id);
                }
            });
            
            this.renderPermissionCategories();
        });
    }

    initialize() {
        const gridElement = $('#roleGrid');
        if (!gridElement.length) {
            console.error('Role grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#roleGrid').dxDataGrid({
            dataSource: {
                store: {
                    type: 'array',
                    key: 'id',
                    data: []
                }
            },
            remoteOperations: false,
            columns: [
                {
                    dataField: 'name',
                    caption: 'Role Name',
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'description',
                    caption: 'Description'
                },
                {
                    dataField: 'permissions',
                    caption: 'Permissions',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        if (!options.value || options.value.length === 0) {
                            $('<div>')
                                .addClass('no-menus')
                                .append($('<i>').addClass('ni ni-key-25'))
                                .append($('<span>').text('No permissions assigned'))
                                .appendTo(container);
                            return;
                        }

                        const $container = $('<div>').addClass('menu-container');
                        
                        // Group permissions by category
                        const groupedPermissions = this.groupPermissionsByCategory(options.value);
                        
                        // Create category sections
                        Object.entries(groupedPermissions)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .forEach(([category, permissions]) => {
                                const $category = $('<div>').addClass('menu-category');
                                const $header = $('<div>').addClass('menu-category-header');
                                
                                $('<div>')
                                    .addClass('menu-category-title')
                                    .text(category)
                                    .append(
                                        $('<span>')
                                            .addClass('menu-category-count')
                                            .text(permissions.length)
                                    )
                                    .appendTo($header);
                                
                                $category.append($header);
                                
                                // Add permission badges
                                const $badgesContainer = $('<div>').addClass('menu-badges-container');
                                permissions.forEach((permission, index) => {
                                    const $badge = $('<span>')
                                        .addClass('menu-badge permission-badge')
                                        .css('animation-delay', `${index * 0.1}s`)
                                        .append(
                                            $('<i>')
                                                .addClass('ni ni-key-25')
                                                .css('margin-right', '6px')
                                        )
                                        .append(
                                            $('<span>').text(permission.name)
                                        );
                                    
                                    $badgesContainer.append($badge);
                                });
                                
                                $category.append($badgesContainer);
                                $container.append($category);
                            });
                        
                        container.append($container);
                    }
                },
                {
                    dataField: 'menus',
                    caption: 'Menus',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        if (!options.value || options.value.length === 0) {
                            $('<div>')
                                .addClass('no-menus')
                                .append($('<i>').addClass('ni ni-app'))
                                .append($('<span>').text('No menus assigned'))
                                .appendTo(container);
                            return;
                        }

                        const $container = $('<div>').addClass('menu-container');
                        
                        // Group menus by parent
                        const mainMenus = options.value.filter(m => !m.parent_id);
                        const subMenus = options.value.filter(m => m.parent_id);
                        
                        // Create main menu category
                        if (mainMenus.length > 0) {
                            const $mainCategory = $('<div>').addClass('menu-category');
                            const $mainHeader = $('<div>').addClass('menu-category-header');
                            
                            $('<div>')
                                .addClass('menu-category-title')
                                .text('Main Menu')
                                .append(
                                    $('<span>')
                                        .addClass('menu-category-count')
                                        .text(mainMenus.length)
                                )
                                .appendTo($mainHeader);
                            
                            $mainCategory.append($mainHeader);
                            
                            // Add main menu badges
                            const $mainBadgesContainer = $('<div>').addClass('menu-badges-container');
                            mainMenus.forEach((menu, index) => {
                                const $menuBadge = $('<span>')
                                    .addClass('menu-badge parent-menu')
                                    .css('animation-delay', `${index * 0.1}s`)
                                    .append(
                                        $('<i>')
                                            .addClass(menu.icon)
                                    )
                                    .append(
                                        $('<span>').text(menu.name)
                                    );
                                
                                $mainBadgesContainer.append($menuBadge);
                            });
                            
                            $mainCategory.append($mainBadgesContainer);
                            $container.append($mainCategory);
                        }
                        
                        // Group and create sub-menu categories
                        const menuGroups = mainMenus.reduce((acc, mainMenu) => {
                            const children = subMenus.filter(sub => sub.parent_id === mainMenu.id);
                            if (children.length > 0) {
                                acc[mainMenu.name] = children;
                            }
                            return acc;
                        }, {});
                        
                        Object.entries(menuGroups).forEach(([parentName, children]) => {
                            const $subCategory = $('<div>').addClass('menu-category');
                            const $subHeader = $('<div>').addClass('menu-category-header');
                            
                            $('<div>')
                                .addClass('menu-category-title')
                                .text(parentName)
                                .append(
                                    $('<span>')
                                        .addClass('menu-category-count')
                                        .text(children.length)
                                )
                                .appendTo($subHeader);
                            
                            $subCategory.append($subHeader);
                            
                            // Add sub-menu badges
                            const $subBadgesContainer = $('<div>').addClass('menu-badges-container');
                            children.forEach((menu, index) => {
                                const $menuBadge = $('<span>')
                                    .addClass('menu-badge child-menu')
                                    .css('animation-delay', `${index * 0.1}s`)
                                    .append(
                                        $('<i>')
                                            .addClass(menu.icon)
                                    )
                                    .append(
                                        $('<span>').text(menu.name)
                                    );
                                
                                $subBadgesContainer.append($menuBadge);
                            });
                            
                            $subCategory.append($subBadgesContainer);
                            $container.append($subCategory);
                        });
                        
                        container.append($container);
                    }
                },
                {
                    type: 'buttons',
                    width: 140,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Permissions Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary mr-2')
                            .attr('title', 'Manage Permissions')
                            .append($('<i>').addClass('ni ni-key-25'))
                            .on('click', () => {
                                this.currentRole = options.row.data;
                                this.selectedPermissions = new Set((options.row.data.permissions || []).map(p => p.id));
                                $('#permissionModal').modal('show');
                            })
                            .appendTo($buttonContainer);

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Role')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Role')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                this.grid.deleteRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        container.append($buttonContainer);
                    }
                }
            ],
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: true },
            columnChooser: { enabled: false },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Role',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                popup: {
                    title: 'Role Information',
                    showTitle: true,
                    width: 700,
                    height: 325
                },
                form: {
                    items: [
                        {
                            itemType: 'group',
                            colCount: 1,
                            items: [
                                {
                                    dataField: 'name',
                                    isRequired: true
                                },
                                {
                                    dataField: 'description',
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        height: 100
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            onInitialized: () => this.loadData(),
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');
    }

    groupPermissionsByCategory(permissions = []) {
        const grouped = {};
        permissions.forEach(permission => {
            const category = this.getPermissionCategory(permission.name);
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });
        return grouped;
    }

    getPermissionCategory(permissionName) {
        const categories = {
            'Permission': ['View Permissions', 'Manage Permissions'],
            'Role': ['View Roles', 'Manage Roles', 'Delete Roles'],
            'User': ['View Users', 'Manage Users', 'Delete Users'],
            'Menu': ['View Menus', 'Manage Menus', 'Delete Menus'],
            'Zone': ['View Zones', 'Manage Zones', 'Delete Zones'],
            'Order': ['View Orders', 'Create Orders', 'Update Orders', 'Delete Orders', 'Approve Orders'],
            'Payment': ['View Payments', 'Process Payments', 'Cancel Payments'],
            'Task': ['View Tasks', 'Manage Tasks', 'Delete Tasks'],
            'Finance': ['View Cash Flow', 'Manage Cash Flow', 'View Petty Cash', 'Create Petty Cash', 'Approve Petty Cash']
        };

        for (const [category, permissions] of Object.entries(categories)) {
            if (permissions.includes(permissionName)) {
                return category;
            }
        }
        return 'Other';
    }

    renderPermissionCategories() {
        this.allPermissions = this.getAllPermissions();
        const $permissionList = $('.permission-list').empty();
        
        // Filter permissions based on search
        const filteredPermissions = this.allPermissions.filter(permission => {
            if (!this.permissionFilter) return true;
            return (
                permission.name.toLowerCase().includes(this.permissionFilter) ||
                permission.description.toLowerCase().includes(this.permissionFilter)
            );
        });
        
        // Group permissions by category
        const groupedPermissions = {};
        filteredPermissions.forEach(permission => {
            const category = this.getPermissionCategory(permission.name);
            if (!groupedPermissions[category]) {
                groupedPermissions[category] = [];
            }
            groupedPermissions[category].push(permission);
        });

        // Only show categories that have matching permissions
        if (Object.keys(groupedPermissions).length === 0) {
            $permissionList.append(`
                <div class="no-results">
                    <i class="ni ni-fat-remove"></i>
                    <div class="h4 mb-1">No Results Found</div>
                    <p class="text-muted">
                        No permissions match your search criteria. Try adjusting your search terms.
                    </p>
                </div>
            `);
            return;
        }

        Object.entries(groupedPermissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([category, permissions]) => {
                const $categoryGroup = $('<div>').addClass('category-group mb-3');
                
                // Add category header with select all checkbox and count badge
                const $header = $('<div>').addClass('category-header d-flex align-items-center justify-content-between');
                const $headerLeft = $('<div>').addClass('d-flex align-items-center');
                
                const $checkbox = $('<div>').addClass('custom-control custom-checkbox');
                const $input = $('<input>')
                    .addClass('custom-control-input select-all-category')
                    .attr({
                        type: 'checkbox',
                        id: `category-${category}`,
                        'data-category': category
                    });
                const $label = $('<label>')
                    .addClass('custom-control-label')
                    .attr('for', `category-${category}`)
                    .text(category);
                
                $checkbox.append($input, $label);
                $headerLeft.append($checkbox);
                
                // Add count badge
                const $count = $('<span>')
                    .addClass('badge badge-soft-primary ml-2')
                    .text(`${permissions.length} permission${permissions.length !== 1 ? 's' : ''}`);
                $headerLeft.append($count);
                
                $header.append($headerLeft);
                $categoryGroup.append($header);

                // Add permissions for this category with animation delay
                const $permissionsContainer = $('<div>').addClass('p-3');
                permissions.forEach((permission, index) => {
                    const $item = this.createPermissionItem(permission)
                        .css('animation', `fadeInUp 0.2s ease-out ${index * 0.05}s forwards`)
                        .css('opacity', '0');
                    $permissionsContainer.append($item);
                });
                
                $categoryGroup.append($permissionsContainer);
                $permissionList.append($categoryGroup);
            });

        // Update select all checkboxes state
        this.updateSelectAllCheckboxes();

        // Add animation keyframes if not already present
        if (!document.getElementById('permission-animations')) {
            const style = document.createElement('style');
            style.id = 'permission-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createPermissionItem(permission) {
        const $item = $('<div>').addClass('permission-item');
        
        const $checkbox = $('<div>').addClass('custom-control custom-checkbox');
        const $input = $('<input>')
            .addClass('custom-control-input')
            .attr({
                type: 'checkbox',
                id: `permission-${permission.id}`,
                checked: this.selectedPermissions.has(permission.id)
            })
            .on('change', (e) => {
                const checked = e.target.checked;
                if (checked) {
                    this.selectedPermissions.add(permission.id);
                    $item.addClass('permission-selected');
                } else {
                    this.selectedPermissions.delete(permission.id);
                    $item.removeClass('permission-selected');
                }
                this.updateSelectAllCheckboxes();
                
                // Add ripple effect
                const $ripple = $('<div>').addClass('ripple');
                $checkbox.append($ripple);
                setTimeout(() => $ripple.remove(), 1000);
            });
        
        const $label = $('<label>')
            .addClass('custom-control-label')
            .attr('for', `permission-${permission.id}`);
        
        $checkbox.append($input, $label);
        
        const $info = $('<div>').addClass('permission-info');
        const $name = $('<div>').addClass('permission-name d-flex align-items-center');
        const $description = $('<div>').addClass('permission-description');

        // Add category badge
        const category = this.getPermissionCategory(permission.name);
        const $badge = $('<span>')
            .addClass('badge badge-soft-primary badge-pill ml-2')
            .css('font-size', '10px')
            .text(category);

        // Highlight matching text if there's a filter
        if (this.permissionFilter) {
            $name.html(this.highlightText(permission.name, this.permissionFilter));
            $description.html(this.highlightText(permission.description, this.permissionFilter));
        } else {
            $name.text(permission.name);
            $description.text(permission.description);
        }

        $name.append($badge);
        $info.append($name, $description);
        $item.append($checkbox, $info);

        // Add selected state if permission is selected
        if (this.selectedPermissions.has(permission.id)) {
            $item.addClass('permission-selected');
        }

        return $item;
    }

    highlightText(text, filter) {
        if (!filter) return text;
        const regex = new RegExp(`(${filter})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    updateSelectAllCheckboxes() {
        const groupedPermissions = this.groupPermissionsByCategory(this.allPermissions);
        
        Object.entries(groupedPermissions).forEach(([category, permissions]) => {
            const categoryPermissionIds = new Set(permissions.map(p => p.id));
            const selectedCategoryPermissions = new Set(
                [...this.selectedPermissions].filter(id => categoryPermissionIds.has(id))
            );
            
            const $checkbox = $(`.select-all-category[data-category="${category}"]`);
            $checkbox.prop('checked', selectedCategoryPermissions.size === permissions.length);
            $checkbox.prop('indeterminate', 
                selectedCategoryPermissions.size > 0 && 
                selectedCategoryPermissions.size < permissions.length
            );
        });
    }

    getAllPermissions() {
        // Get all unique permissions from the roles
        const permissions = new Set();
        const data = this.grid.getDataSource().items();
        data.forEach(role => {
            if (role.permissions && Array.isArray(role.permissions)) {
                role.permissions.forEach(permission => {
                    permissions.add(JSON.stringify(permission));
                });
            }
        });
        return Array.from(permissions).map(p => JSON.parse(p));
    }

    async savePermissions() {
        if (!this.currentRole) return;

        try {
            const permissions = this.allPermissions
                .filter(p => this.selectedPermissions.has(p.id));

            const updatedRole = await zentra.updateRole(this.currentRole.id, {
                name: this.currentRole.name,
                description: this.currentRole.description,
                permission_ids: Array.from(this.selectedPermissions)
            });

            // Update grid data
            const dataSource = this.grid.getDataSource();
            const items = dataSource.items();
            const index = items.findIndex(item => item.id === this.currentRole.id);
            if (index !== -1) {
                items[index].permissions = permissions;
                dataSource.reload();
            }

            $('#permissionModal').modal('hide');
            DevExpress.ui.notify('Permissions updated successfully', 'success', 3000);
        } catch (error) {
            console.error('Error saving permissions:', error);
            DevExpress.ui.notify('Failed to update permissions', 'error', 3000);
        }
    }

    async loadData() {
        try {
            const data = await zentra.getRoles();
            this.grid.option('dataSource', data);
        } catch (error) {
            console.error('Error loading roles:', error);
            DevExpress.ui.notify('Failed to load roles', 'error', 3000);
        }
    }

    async handleRowInserting(e) {
        try {
            const result = await zentra.createRole(e.data);
            e.data.id = result.id;
            DevExpress.ui.notify('Role created successfully', 'success', 3000);
        } catch (error) {
            console.error('Error creating role:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to create role', 'error', 3000);
        }
    }

    async handleRowUpdating(e) {
        try {
            await zentra.updateRole(e.key.id, {...e.oldData, ...e.newData});
            DevExpress.ui.notify('Role updated successfully', 'success', 3000);
        } catch (error) {
            console.error('Error updating role:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to update role', 'error', 3000);
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteRole(e.key.id);
            DevExpress.ui.notify('Role deleted successfully', 'success', 3000);
        } catch (error) {
            console.error('Error deleting role:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to delete role', 'error', 3000);
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.rolePageInstance) {
    window.rolePageInstance = new window.RolePage();
} 