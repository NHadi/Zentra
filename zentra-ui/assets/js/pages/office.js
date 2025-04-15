import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define OfficePage
window.OfficePage = class {
    constructor() {
        this.grid = null;
        this.selectedZone = null;
        this.currentOffice = null;
        this.allZones = [];
        this.zoneFilter = '';
        this.exportButtonsAdded = false;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();
    }

    dispose() {
        // Clean up event listeners
        $('#zoneModal').off('shown.bs.modal hidden.bs.modal');
        $('#saveZone').off('click');
        $('#zoneSearchBox').off('input');

        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    bindEvents() {
        // Modal show event
        $('#zoneModal').on('shown.bs.modal', (e) => {
            const button = $(e.relatedTarget);
            this.currentOffice = {
                id: button.data('office-id'),
                name: button.data('office-name')
            };
            this.loadZones();
            
            // Update modal title to include office name
            const modal = $(e.target);
            modal.find('.modal-title').html(`
                <i class="ni ni-map-big mr-2"></i>
                Manage Zone - ${this.currentOffice.name}
            `);
        });

        // Modal hide event
        $('#zoneModal').on('hidden.bs.modal', () => {
            this.selectedZone = null;
            this.currentOffice = null;
            this.zoneFilter = '';
            $('#zoneSearchBox').val('');
            $('.zone-list').empty();
        });

        // Zone search
        $('#zoneSearchBox').on('input', (e) => {
            this.zoneFilter = e.target.value.toLowerCase();
            this.renderZones();
        });

        // Save zone
        $('#saveZone').on('click', () => this.saveZone());
    }

    initialize() {
        const gridElement = $('#officeGrid');
        if (!gridElement.length) {
            console.error('Office grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#officeGrid').dxDataGrid({
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
                    caption: 'Office Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-building mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.code || '')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'code',
                    caption: 'Office Code',
                    validationRules: [{ type: 'required' }],
                    visible: false
                },
                {
                    dataField: 'email',
                    caption: 'Email',
                    validationRules: [{ type: 'required' }],
                    visible: false
                },
                {
                    dataField: 'address',
                    caption: 'Location',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-pin-3 mr-2 text-info')
                            )
                            .append(
                                $('<div>').addClass('text-wrap small')
                                    .text(options.data.address || 'No address provided')
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'phone',
                    caption: 'Contact',
                    width: 200,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('d-flex flex-column');

                        // Phone number
                        if (options.data.phone) {
                            $('<div>')
                                .addClass('d-flex align-items-center mb-1')
                                .append(
                                    $('<i>').addClass('fas fa-phone-alt mr-2 text-success')
                                )
                                .append(
                                    $('<a>')
                                        .addClass('text-muted small')
                                        .attr('href', `tel:${options.data.phone}`)
                                        .text(options.data.phone)
                                )
                                .appendTo($container);
                        }

                        // Email
                        if (options.data.email) {
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('fas fa-envelope mr-2 text-warning')
                                )
                                .append(
                                    $('<a>')
                                        .addClass('text-muted small')
                                        .attr('href', `mailto:${options.data.email}`)
                                        .text(options.data.email)
                                )
                                .appendTo($container);
                        }

                        if (!options.data.phone && !options.data.email) {
                            $('<div>')
                                .addClass('text-muted small font-italic')
                                .append(
                                    $('<i>').addClass('fas fa-info-circle mr-1')
                                )
                                .append('No contact info')
                                .appendTo($container);
                        }

                        container.append($container);
                    }
                },
                {
                    dataField: 'zone',
                    caption: 'Zone',
                    width: 180,
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('zone-container d-flex align-items-center');
                        
                        if (options.data.zone) {
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('fas fa-map-marker-alt mr-2 text-danger')
                                )
                                .append(
                                    $('<div>').addClass('d-flex flex-column')
                                        .append(
                                            $('<span>').addClass('font-weight-bold small').text(options.data.zone.name)
                                        )
                                        .append(
                                            $('<small>').addClass('text-muted')
                                                .text(options.data.zone.description || 'No description')
                                        )
                                )
                                .appendTo($container);
                        } else {
                            $('<div>')
                                .addClass('d-flex align-items-center text-muted')
                                .append(
                                    $('<i>').addClass('fas fa-map mr-2')
                                )
                                .append(
                                    $('<span>').addClass('small font-italic').text('No zone assigned')
                                )
                                .appendTo($container);
                        }
                        
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

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Office')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger mr-2')
                            .attr('title', 'Delete Office')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this office?", "Confirm deletion")
                                    .then((result) => {
                                        if (result) {
                                            this.grid.deleteRow(options.rowIndex);
                                        }
                                    });
                            })
                            .appendTo($buttonContainer);

                        // Manage Zone Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary')
                            .attr({
                                'title': 'Manage Zone',
                                'data-toggle': 'modal',
                                'data-target': '#zoneModal',
                                'data-office-id': options.row.data.id,
                                'data-office-name': options.row.data.name
                            })
                            .append($('<i>').addClass('fas fa-map-marked-alt'))
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
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                popup: {
                    title: 'Office Information',
                    showTitle: true,
                    width: 700,
                    height: 525,
                    position: { my: 'center', at: 'center', of: window },
                    showCloseButton: true
                },
                form: {
                    colCount: 2,
                    labelLocation: 'top',
                    items: [
                        {
                            itemType: 'group',
                            caption: 'Basic Information',
                            colSpan: 2,
                            items: [
                                {
                                    dataField: 'name',
                                    label: { text: 'Office Name', showColon: true },
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter office name',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mode: 'text',
                                        inputAttr: {
                                            'aria-label': 'Office Name'
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Office name is required' }]
                                },
                                {
                                    dataField: 'code',
                                    label: { text: 'Office Code', showColon: true },
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter office code',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mode: 'text',
                                        inputAttr: {
                                            'aria-label': 'Office Code'
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Office code is required' }]
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Contact Information',
                            colSpan: 2,
                            items: [
                                {
                                    dataField: 'email',
                                    label: { text: 'Email Address', showColon: true },
                                    editorOptions: {
                                        placeholder: 'Enter email address',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        valueChangeEvent: 'change'
                                    }
                                },
                                {
                                    dataField: 'phone',
                                    label: { text: 'Phone Number', showColon: true },
                                    editorOptions: {
                                        placeholder: 'Enter phone number',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mask: '+99 (999) 999-9999',
                                        maskRules: { "9": /[0-9]/ },
                                        maskInvalidMessage: 'Please enter a valid phone number',
                                        inputAttr: {
                                            'aria-label': 'Phone Number'
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Location Details',
                            colSpan: 2,
                            items: [
                                {
                                    dataField: 'address',
                                    label: { text: 'Office Address', showColon: true },
                                    editorType: 'dxTextArea',
                                    colSpan: 2,
                                    editorOptions: {
                                        placeholder: 'Enter complete office address',
                                        stylingMode: 'filled',
                                        height: 100,
                                        maxLength: 500,
                                        showClearButton: true,
                                        inputAttr: {
                                            'aria-label': 'Office Address'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                useIcons: true,
                texts: {
                    saveRowChanges: 'Save',
                    cancelRowChanges: 'Cancel'
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Office',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Office_List');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => {
                if (this.grid) {
                    this.loadData();
                }
            },
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');

        // Initial data load
        this.loadData();
    }

    async loadData() {
        try {
            if (!this.grid) {
                console.warn('Grid instance is not available');
                return;
            }

            // Show loading panel
            this.grid.beginCustomLoading('Loading offices...');
            
            const data = await zentra.getOffices();
            if (Array.isArray(data)) {
                this.grid.option('dataSource', data);
            } else {
                console.warn('Invalid data format received:', data);
                this.grid.option('dataSource', []);
            }
        } catch (error) {
            console.error('Error loading offices:', error);
            gridUtils.handleGridError(error, 'loading offices');
        } finally {
            // Always hide loading panel
            this.grid.endCustomLoading();
        }
    }

    async loadZones() {
        try {
            // Show loading state
            const $zoneList = $('.zone-list');
            $zoneList.html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading zones...</div>');
            
            this.allZones = await zentra.getZones();
            this.renderZones();
        } catch (error) {
            gridUtils.handleGridError(error, 'loading zones');
        }
    }

    renderZones() {
        const $zoneList = $('.zone-list');
        $zoneList.empty();

        const filteredZones = this.allZones.filter(zone => 
            zone.name.toLowerCase().includes(this.zoneFilter) ||
            zone.description?.toLowerCase().includes(this.zoneFilter)
        );

        if (filteredZones.length === 0) {
            $zoneList.html(`
                <div class="no-zones">
                    <i class="fas fa-search"></i>
                    No zones found matching your search
                </div>
            `);
            return;
        }

        filteredZones.forEach(zone => {
            const isSelected = this.selectedZone?.id === zone.id;
            const $zoneItem = this.createZoneItem(zone, isSelected);
            $zoneList.append($zoneItem);
        });
    }

    createZoneItem(zone, isSelected) {
        return $(`
            <div class="zone-item ${isSelected ? 'selected' : ''}" data-zone-id="${zone.id}">
                <div class="custom-control custom-radio">
                    <input type="radio" class="custom-control-input" id="zone-${zone.id}"
                           name="zone" ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="zone-${zone.id}"></label>
                </div>
                <div class="zone-info">
                    <div class="zone-name">${zone.name}</div>
                    <div class="zone-details">${zone.description || 'No description provided'}</div>
                </div>
            </div>
        `).on('change', 'input[type="radio"]', () => {
            this.selectedZone = zone;
        });
    }

    async saveZone() {
        try {
            // Show loading state
            const $saveBtn = $('#saveZone');
            $saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Saving...');

            if (!this.selectedZone) {
                DevExpress.ui.notify('Please select a zone', 'warning', 3000);
                return;
            }

            await zentra.assignZone(this.currentOffice.id, this.selectedZone.id);
            $('#zoneModal').modal('hide');
            await this.loadData();
            gridUtils.showSuccess('Zone assigned successfully');
        } catch (error) {
            gridUtils.handleGridError(error, 'assigning zone');
        } finally {
            $('#saveZone').prop('disabled', false).html('Save Changes');
        }
    }

    async handleRowInserting(e) {
        try {
            // Debug logging
            console.log('Raw Form Data:', e.data);

            // Validate required fields
            if (!e.data.name || !e.data.code) {
                e.cancel = true;
                DevExpress.ui.notify('Office name and code are required', 'error', 3000);
                return;
            }

            // Create office data with all fields
            const officeData = {
                name: e.data.name.trim(),
                code: e.data.code.trim(),
                email: e.data.email || null,  // Changed to directly use the email value
                phone: e.data.phone || null,
                address: e.data.address || null
            };

            // Debug logging
            console.log('Processed Data:', officeData);

            // Validate email format if provided
            if (officeData.email && !this.isValidEmail(officeData.email)) {
                e.cancel = true;
                DevExpress.ui.notify('Please enter a valid email address', 'error', 3000);
                return;
            }

            const result = await zentra.createOffice(officeData);
            e.data.id = result.id;
            gridUtils.showSuccess('Office created successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating office');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async handleRowUpdating(e) {
        try {
            // Combine old and new data, excluding zone
            const { zone, ...oldData } = e.oldData;
            const updatedData = {
                ...oldData,
                ...e.newData,
                // Ensure these fields are always included
                name: e.newData.name || oldData.name,
                code: e.newData.code || oldData.code,
                email: e.newData.email || oldData.email || null,
                phone: e.newData.phone || oldData.phone || null,
                address: e.newData.address || oldData.address || null
            };

            await zentra.updateOffice(e.key.id, updatedData);
            gridUtils.showSuccess('Office updated successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating office');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteOffice(e.key.id);
            gridUtils.showSuccess('Office deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting office');
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.officePageInstance) {
    window.officePageInstance = new window.OfficePage();
} 