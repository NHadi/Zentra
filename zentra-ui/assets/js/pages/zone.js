import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define ZonePage
window.ZonePage = class {
    constructor() {
        this.grid = null;
        this.selectedOffices = new Set();
        this.currentZone = null;
        this.allOffices = [];
        this.officeFilter = '';
        this.regions = [];
        this.exportButtonsAdded = false;
        
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
        $('#officeModal').off('shown.bs.modal hidden.bs.modal');
        $('#saveOffices').off('click');
        $('#officeSearchBox').off('input');
    }

    bindEvents() {
        // Office modal events
        $('#officeModal').on('shown.bs.modal', async () => {
            try {
                // Load all offices first
                const offices = await zentra.getOffices();
                this.allOffices = offices;
                
                // Initialize selected offices from current zone
                if (this.currentZone && this.currentZone.offices) {
                    this.selectedOffices = new Set(this.currentZone.offices.map(o => o.id));
                }
                
                this.renderOffices();
                // Clear search box when modal opens
                $('#officeSearchBox').val('');
                this.officeFilter = '';
                // Update selected count
                this.updateSelectedCount();
            } catch (error) {
                console.error('Error loading offices:', error);
                DevExpress.ui.notify('Failed to load offices', 'error', 3000);
            }
        });

        $('#officeModal').on('hidden.bs.modal', () => {
            this.selectedOffices.clear();
            this.currentZone = null;
            this.officeFilter = '';
            // Reset select all checkbox
            $('#selectAllOffices').prop('checked', false);
        });

        // Select all checkbox
        $('#selectAllOffices').on('change', (e) => {
            const checked = e.target.checked;
            if (checked) {
                this.allOffices.forEach(office => {
                    this.selectedOffices.add(office.id);
                });
            } else {
                this.selectedOffices.clear();
            }
            this.renderOffices();
            this.updateSelectedCount();
        });

        $('#saveOffices').on('click', () => {
            this.saveOffices();
        });

        // Office search box
        $('#officeSearchBox').on('input', (e) => {
            this.officeFilter = e.target.value.toLowerCase();
            this.renderOffices();
        });
    }

    updateSelectedCount() {
        const count = this.selectedOffices.size;
        $('.selected-count .badge').text(count);
    }

    async initialize() {
        const gridElement = $('#zoneGrid');
        if (!gridElement.length) {
            console.error('Zone grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Load regions first before initializing grid
        await this.loadRegions();

        this.grid = $('#zoneGrid').dxDataGrid({
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
                    caption: 'Zone Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('fas fa-map-marker-alt mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>')
                                            .addClass('text-muted mt-1')
                                            .css({
                                                'font-size': '0.875em',
                                                'line-height': '1.4',
                                                'display': 'block',
                                                'max-width': '400px',
                                                'white-space': 'normal',
                                                'overflow': 'hidden',
                                                'text-overflow': 'ellipsis',
                                                '-webkit-line-clamp': '2',
                                                '-webkit-box-orient': 'vertical',
                                                'display': '-webkit-box'
                                            })
                                            .text(options.data.description || 'No description')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    validationRules: [{ type: 'required' }],
                    visible: false
                },
                {
                    dataField: 'region_id',
                    caption: 'Region',
                    lookup: {
                        dataSource: this.regions,
                        valueExpr: 'id',
                        displayExpr: 'name'
                    },
                    cellTemplate: (container, options) => {
                        const region = this.regions.find(r => r.id === options.value);
                        if (region) {
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('ni ni-map-big mr-2 text-info')
                                )
                                .append(
                                    $('<span>').text(region.name)
                                )
                                .appendTo(container);
                        }
                    }
                },
                {
                    dataField: 'offices',
                    caption: 'Offices',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        if (!options.value || options.value.length === 0) {
                            $('<div>')
                                .addClass('text-muted d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('ni ni-building mr-2')
                                )
                                .append(
                                    $('<span>').addClass('font-italic').text('No offices assigned')
                                )
                                .appendTo(container);
                            return;
                        }

                        const $container = $('<div>').addClass('office-container');
                        const offices = options.value;
                        
                        const $badgesContainer = $('<div>').addClass('office-badges-container');
                        offices.forEach(office => {
                            const $badge = $('<span>')
                                .addClass('office-badge')
                                .append(
                                    $('<i>').addClass('ni ni-building')
                                )
                                .append(
                                    $('<span>').text(office.name)
                                );
                            
                            $badgesContainer.append($badge);
                        });
                        
                        $container.append($badgesContainer);
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

                        // Offices Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary mr-2')
                            .attr('title', 'Manage Offices')
                            .append($('<i>').addClass('ni ni-building'))
                            .on('click', () => {
                                this.currentZone = options.row.data;
                                this.selectedOffices = new Set((options.row.data.offices || []).map(o => o.id));
                                $('#officeModal').modal('show');
                            })
                            .appendTo($buttonContainer);

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Zone')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Zone')
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
                            text: 'Add Zone',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            editing: {
                mode: 'popup',
                popup: {
                    title: 'Zone Information',
                    showTitle: true,
                    width: 700,
                    height: 'auto',
                    position: { my: 'center', at: 'center', of: window }
                },
                form: {
                    focusStateEnabled: true,
                    items: [
                        {
                            itemType: 'group',
                            colCount: 1,
                            items: [
                                {
                                    dataField: 'name',
                                    label: { 
                                        text: 'Zone Name',
                                        visible: true
                                    },
                                    editorOptions: {
                                        placeholder: 'Enter zone name',
                                        stylingMode: 'filled',
                                        labelMode: 'floating',
                                        maxLength: 100
                                    },
                                    validationRules: [{ type: 'required', message: 'Zone name is required' }]
                                },
                                {
                                    dataField: 'region_id',
                                    editorType: 'dxSelectBox',
                                    label: { 
                                        text: 'Region',
                                        visible: true
                                    },
                                    editorOptions: {
                                        dataSource: this.regions,
                                        valueExpr: 'id',
                                        displayExpr: 'name',
                                        placeholder: 'Select a region',
                                        searchEnabled: true,
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                        labelMode: 'floating',
                                        onInitialized: (e) => {
                                            this.regionEditor = e.component;
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Region is required' }]
                                },
                                {
                                    dataField: 'description',
                                    label: { 
                                        text: 'Description',
                                        visible: true
                                    },
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        placeholder: 'Enter zone description',
                                        height: 100,
                                        stylingMode: 'filled',
                                        labelMode: 'floating',
                                        maxLength: 500
                                    }
                                }
                            ]
                        }
                    ]
                },
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true
            },
            onInitNewRow: (e) => {
                // Initialize with default values
                e.data = {
                    name: '',
                    description: '',
                    region_id: null
                };
            },
            onEditorPreparing: (e) => {
                if (e.dataField === "description") {
                    const originalValueChanged = e.editorOptions.onValueChanged;
                    e.editorOptions.onValueChanged = (args) => {
                        if (originalValueChanged) {
                            originalValueChanged(args);
                        }
                        // Update the data immediately
                        if (e.row && e.row.data) {
                            e.row.data.description = args.value || '';
                        }
                    };
                }
            },
            onRowValidating: (e) => {
                if (e.newData) {
                    // Ensure description is included
                    e.newData.description = e.newData.description || '';
                }
            },
            onRowInserting: (e) => {
                // Ensure description is included
                e.data.description = e.data.description || '';
                return this.handleRowInserting(e);
            },
            onRowUpdating: (e) => {
                // Merge the changes while preserving description
                e.newData = {
                    ...e.newData,
                    description: e.newData.description !== undefined ? e.newData.description : e.oldData.description || ''
                };
                return this.handleRowUpdating(e);
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Zone_List');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => this.loadData(),
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');
    }

    async loadRegions() {
        try {
            const regions = await zentra.getRegions();
            this.regions = regions || [];
            
            // Update region editor if it exists
            if (this.regionEditor) {
                this.regionEditor.option('dataSource', this.regions);
            }
            
            // Update the grid's lookup column
            if (this.grid) {
                const regionColumn = this.grid.columnOption('region_id');
                if (regionColumn) {
                    this.grid.columnOption('region_id', 'lookup', {
                        dataSource: this.regions,
                        valueExpr: 'id',
                        displayExpr: 'name'
                    });
                }
            }
        } catch (error) {
            console.error('Error loading regions:', error);
            DevExpress.ui.notify('Failed to load regions', 'error', 3000);
            this.regions = [];
        }
    }

    renderOffices() {
        const $officeList = $('.office-list-content');
        $officeList.empty();

        // Show loading state
        if (!this.allOffices) {
            $officeList.html(`
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading offices...
                </div>
            `);
            return;
        }

        // Filter offices based on search
        const filteredOffices = this.allOffices.filter(office => {
            if (!this.officeFilter) return true;
            return (
                office.name.toLowerCase().includes(this.officeFilter) ||
                office.code.toLowerCase().includes(this.officeFilter) ||
                office.address.toLowerCase().includes(this.officeFilter)
            );
        });

        if (filteredOffices.length === 0) {
            $officeList.html(`
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <div class="h4 mb-1">No Results Found</div>
                    <p class="text-muted">
                        No offices match your search criteria. Try adjusting your search terms.
                    </p>
                </div>
            `);
            return;
        }

        filteredOffices.forEach(office => {
            const isSelected = this.selectedOffices.has(office.id);
            const $officeItem = this.createOfficeItem(office, isSelected);
            $officeList.append($officeItem);
        });
    }

    createOfficeItem(office, isSelected) {
        const $officeItem = $(`
            <div class="office-item ${isSelected ? 'selected' : ''}" data-office-id="${office.id}">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="office-${office.id}"
                           ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="office-${office.id}"></label>
                </div>
                <div class="office-info">
                    <div class="office-name">
                        <span class="office-code">${office.code}</span>
                        ${office.name}
                    </div>
                    <div class="office-details">
                        ${office.address || 'No address provided'}
                    </div>
                </div>
            </div>
        `);

        // Handle click on the entire office item
        $officeItem.on('click', function(e) {
            // Don't trigger if clicking the checkbox directly
            if (!$(e.target).is('input[type="checkbox"]')) {
                const checkbox = $(this).find('input[type="checkbox"]');
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
            }
        });

        // Handle checkbox change
        $officeItem.find('input[type="checkbox"]').on('change', (e) => {
            const checked = e.target.checked;
            if (checked) {
                this.selectedOffices.add(office.id);
            } else {
                this.selectedOffices.delete(office.id);
            }
            this.updateSelectedCount();
            $officeItem.toggleClass('selected', checked);
        });

        return $officeItem;
    }

    getAllOffices() {
        // Get all unique offices from the zones
        const offices = new Set();
        const data = this.grid.getDataSource().items();
        data.forEach(zone => {
            if (zone.offices && Array.isArray(zone.offices)) {
                zone.offices.forEach(office => {
                    offices.add(JSON.stringify(office));
                });
            }
        });
        return Array.from(offices).map(o => JSON.parse(o));
    }

    async saveOffices() {
        if (!this.currentZone) return;

        try {
            const $saveBtn = $('#saveOffices');
            $saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Saving...');

            const selectedOfficeIds = Array.from(this.selectedOffices);
            const offices = this.allOffices.filter(o => selectedOfficeIds.includes(o.id));

            const updatedZone = await zentra.updateZone(this.currentZone.id, {
                name: this.currentZone.name,
                description: this.currentZone.description,
                region_id: this.currentZone.region_id,
                office_ids: selectedOfficeIds
            });

            // Update grid data
            const dataSource = this.grid.getDataSource();
            const items = dataSource.items();
            const index = items.findIndex(item => item.id === this.currentZone.id);
            if (index !== -1) {
                items[index].offices = offices;
                dataSource.reload();
            }

            $('#officeModal').modal('hide');
            DevExpress.ui.notify('Offices updated successfully', 'success', 3000);
        } catch (error) {
            console.error('Error saving offices:', error);
            DevExpress.ui.notify('Failed to update offices', 'error', 3000);
        } finally {
            $('#saveOffices').prop('disabled', false).html('Save Changes');
        }
    }

    async loadData() {
        try {
            const data = await zentra.getZones();
            // Extract unique regions from zone data
            this.regions = zentra.getUniqueRegions(data);
            this.grid.option('dataSource', data);
        } catch (error) {
            console.error('Error loading zones:', error);
            DevExpress.ui.notify('Failed to load zones', 'error', 3000);
        }
    }

    async handleRowInserting(e) {
        try {
            // Ensure we have regions loaded
            if (this.regions.length === 0) {
                await this.loadRegions();
            }

            const zoneData = {
                name: e.data.name,
                description: e.data.description || '',
                region_id: e.data.region_id
            };

            console.log('Creating zone with data:', zoneData);

            const result = await zentra.createZone(zoneData);
            e.data.id = result.id;
            DevExpress.ui.notify('Zone created successfully', 'success', 3000);
            // Refresh grid data after successful creation
            await this.loadData();
        } catch (error) {
            console.error('Error creating zone:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to create zone', 'error', 3000);
        }
    }

    async handleRowUpdating(e) {
        try {
            const updatedData = {
                name: e.newData.name !== undefined ? e.newData.name : e.oldData.name,
                description: e.newData.description !== undefined ? e.newData.description : e.oldData.description || '',
                region_id: e.newData.region_id !== undefined ? e.newData.region_id : e.oldData.region_id
            };

            console.log('Updating zone with data:', updatedData);

            await zentra.updateZone(e.key.id, updatedData);
            DevExpress.ui.notify('Zone updated successfully', 'success', 3000);
            // Refresh grid data after successful update
            await this.loadData();
        } catch (error) {
            console.error('Error updating zone:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to update zone', 'error', 3000);
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteZone(e.key.id);
            DevExpress.ui.notify('Zone deleted successfully', 'success', 3000);
            // Refresh grid data after successful deletion
            await this.loadData();
        } catch (error) {
            console.error('Error deleting zone:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to delete zone', 'error', 3000);
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.zonePageInstance) {
    window.zonePageInstance = new window.ZonePage();
}