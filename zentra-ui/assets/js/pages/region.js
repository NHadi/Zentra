import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define RegionPage
window.RegionPage = class {
    constructor() {
        this.grid = null;
        this.selectedZones = new Set();
        this.currentRegion = null;
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
        $('#zoneModal').off('show.bs.modal');
        $('#zoneModal').off('hide.bs.modal');
        $('#zoneSearchBox').off('input');
        $('#saveZones').off('click');

        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    bindEvents() {
        // Modal show event
        $('#zoneModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const regionId = button.data('region-id');
            const regionName = button.data('region-name');
            this.currentRegion = { id: regionId, name: regionName };
            this.loadZones(regionId);
        });

        // Modal hide event
        $('#zoneModal').on('hide.bs.modal', () => {
            this.selectedZones.clear();
            this.zoneFilter = '';
            $('#zoneSearchBox').val('');
            $('.zone-list').empty();
        });

        // Zone search
        $('#zoneSearchBox').on('input', (e) => {
            this.zoneFilter = e.target.value.toLowerCase();
            this.renderZones();
        });

        // Save zones
        $('#saveZones').on('click', () => this.saveZones());
    }

    initialize() {
        const gridElement = $('#regionGrid');
        if (!gridElement.length) {
            console.error('Region grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#regionGrid').dxDataGrid({
            dataSource: {
                store: {
                    type: 'array',
                    key: 'id',
                    data: []
                }
            },
            remoteOperations: false,
            ...gridUtils.getCommonGridConfig(),
            columns: [
                {
                    dataField: 'name',
                    caption: 'Region Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-map-big mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.description || 'No description')
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
                    dataField: 'zones',
                    caption: 'Zones',
                    width: 300,
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('zone-container d-flex align-items-center');
                        
                        if (options.data.zones?.length) {
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('fas fa-map-marker-alt mr-2 text-danger')
                                )
                                .append(
                                    $('<div>').addClass('d-flex flex-column')
                                        .append(
                                            $('<span>').addClass('font-weight-bold small').text(`${options.data.zones.length} zones`)
                                        )
                                        .append(
                                            $('<small>').addClass('text-muted')
                                                .text(options.data.zones.map(z => z.name).join(', '))
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
                                    $('<span>').addClass('small font-italic').text('No zones assigned')
                                )
                                .appendTo($container);
                        }
                        
                        container.append($container);
                    }
                },
                {
                    type: 'buttons',
                    width: 140,
                    alignment: 'right',
                    fixed: true,
                    fixedPosition: 'right',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Manage Zones Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary mr-2')
                            .attr({
                                'title': 'Manage Zones',
                                'data-toggle': 'modal',
                                'data-target': '#zoneModal',
                                'data-region-id': options.row.data.id,
                                'data-region-name': options.row.data.name
                            })
                            .append($('<i>').addClass('fas fa-map-marked-alt'))
                            .appendTo($buttonContainer);

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Region')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Region')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this region?", "Confirm deletion")
                                    .then((result) => {
                                        if (result) {
                                            this.grid.deleteRow(options.rowIndex);
                                        }
                                    });
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
                    title: 'Region Information',
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
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter region name'
                                    }
                                },
                                {
                                    dataField: 'description',
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        height: 100,
                                        placeholder: 'Enter region description'
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Region',
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
                    gridUtils.addExportButtons(this.grid, 'Region_List');
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
            this.grid.beginCustomLoading('Loading regions...');
            
            const data = await zentra.getRegions();
            this.grid.option('dataSource', data);
            
            // Hide loading panel
            this.grid.endCustomLoading();
        } catch (error) {
            gridUtils.handleGridError(error, 'loading regions');
        }
    }

    async loadZones(regionId) {
        try {
            // Show loading state
            const $modal = $('#zoneModal');
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
            const isSelected = this.selectedZones.has(zone.id);
            const $zoneItem = this.createZoneItem(zone, isSelected);
            $zoneList.append($zoneItem);
        });
    }

    createZoneItem(zone, isSelected) {
        return $(`
            <div class="zone-item ${isSelected ? 'selected' : ''}" data-zone-id="${zone.id}">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="zone-${zone.id}"
                           ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="zone-${zone.id}"></label>
                </div>
                <div class="zone-info">
                    <div class="zone-name">${zone.name}</div>
                    <div class="zone-details">${zone.description || 'No description provided'}</div>
                </div>
            </div>
        `).on('change', (e) => {
            const checked = e.target.checked;
            if (checked) {
                this.selectedZones.add(zone.id);
            } else {
                this.selectedZones.delete(zone.id);
            }
        });
    }

    async saveZones() {
        try {
            if (!this.currentRegion || !this.currentRegion.id) {
                throw new Error('No region selected for zone assignment');
            }

            // Show loading state
            const $saveBtn = $('#saveZones');
            $saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Saving...');

            await zentra.assignZones(this.currentRegion.id, Array.from(this.selectedZones));
            
            // Close modal first
            $('#zoneModal').modal('hide');
            
            // Clear selection and filter
            this.selectedZones.clear();
            this.zoneFilter = '';
            $('#zoneSearchBox').val('');
            
            // Refresh grid data
            await this.loadData();
            
            gridUtils.showSuccess('Zones assigned successfully');
        } catch (error) {
            console.error('Error saving zones:', error);
            gridUtils.handleGridError(error, 'assigning zones');
        } finally {
            $('#saveZones').prop('disabled', false).html('Save Changes');
        }
    }

    async handleRowInserting(e) {
        try {
            const result = await zentra.createRegion(e.data);
            e.data.id = result.id;
            gridUtils.showSuccess('Region created successfully');
            // Refresh grid data after successful creation
            await this.loadData();
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating region');
        }
    }

    async handleRowUpdating(e) {
        try {
            await zentra.updateRegion(e.key.id, {...e.oldData, ...e.newData});
            // Refresh grid data after successful creation
            await this.loadData();
            gridUtils.showSuccess('Region updated successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating region');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteRegion(e.key.id);
            gridUtils.showSuccess('Region deleted successfully');
            // Refresh grid data after successful creation
            await this.loadData();
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting region');
        }
    }

    editRegion(region) {
        const rowIndex = this.grid.getRowIndexByKey(region.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteRegion(region) {
        const rowIndex = this.grid.getRowIndexByKey(region.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this region?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.regionPageInstance) {
    window.regionPageInstance = new window.RegionPage();
} 