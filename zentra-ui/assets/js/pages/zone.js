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
        $('#officeModal').on('shown.bs.modal', () => {
            this.renderOffices();
            // Clear search box when modal opens
            $('#officeSearchBox').val('');
            this.officeFilter = '';
        });

        $('#officeModal').on('hidden.bs.modal', () => {
            this.selectedOffices.clear();
            this.currentZone = null;
            this.officeFilter = '';
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

    initialize() {
        const gridElement = $('#zoneGrid');
        if (!gridElement.length) {
            console.error('Zone grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

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
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'description',
                    caption: 'Description'
                },
                {
                    dataField: 'region_id',
                    caption: 'Region',
                    lookup: {
                        dataSource: () => this.regions,
                        valueExpr: 'id',
                        displayExpr: 'name'
                    }
                },
                {
                    dataField: 'offices',
                    caption: 'Offices',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        if (!options.value || options.value.length === 0) {
                            $('<div>')
                                .addClass('no-offices')
                                .append($('<i>').addClass('ni ni-building'))
                                .append($('<span>').text('No offices assigned'))
                                .appendTo(container);
                            return;
                        }

                        const $container = $('<div>').addClass('office-container');
                        
                        // Group offices by type (if you have office types)
                        const offices = options.value;
                        
                        // Create office badges
                        const $badgesContainer = $('<div>').addClass('office-badges-container');
                        offices.forEach((office, index) => {
                            const $badge = $('<span>')
                                .addClass('office-badge')
                                .css('animation-delay', `${index * 0.1}s`)
                                .append(
                                    $('<i>')
                                        .addClass('ni ni-building')
                                        .css('margin-right', '6px')
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
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                popup: {
                    title: 'Zone Information',
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
                                },
                                {
                                    dataField: 'region_id',
                                    label: { text: 'Region' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        dataSource: () => this.regions,
                                        valueExpr: 'id',
                                        displayExpr: 'name'
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Zone_List');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => this.loadData(),
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');
    }

    renderOffices() {
        this.allOffices = this.getAllOffices();
        const $officeList = $('.office-list').empty();
        
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
            $officeList.append(`
                <div class="no-results">
                    <i class="ni ni-fat-remove"></i>
                    <div class="h4 mb-1">No Results Found</div>
                    <p class="text-muted">
                        No offices match your search criteria. Try adjusting your search terms.
                    </p>
                </div>
            `);
            return;
        }

        filteredOffices.forEach((office, index) => {
            const $item = this.createOfficeItem(office)
                .css('animation', `fadeInUp 0.2s ease-out ${index * 0.05}s forwards`)
                .css('opacity', '0');
            $officeList.append($item);
        });

        // Add animation keyframes if not already present
        if (!document.getElementById('office-animations')) {
            const style = document.createElement('style');
            style.id = 'office-animations';
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

    createOfficeItem(office) {
        const $item = $('<div>').addClass('office-item');
        
        const $checkbox = $('<div>').addClass('custom-control custom-checkbox');
        const $input = $('<input>')
            .addClass('custom-control-input')
            .attr({
                type: 'checkbox',
                id: `office-${office.id}`,
                checked: this.selectedOffices.has(office.id)
            })
            .on('change', (e) => {
                const checked = e.target.checked;
                if (checked) {
                    this.selectedOffices.add(office.id);
                    $item.addClass('office-selected');
                } else {
                    this.selectedOffices.delete(office.id);
                    $item.removeClass('office-selected');
                }
                
                // Add ripple effect
                const $ripple = $('<div>').addClass('ripple');
                $checkbox.append($ripple);
                setTimeout(() => $ripple.remove(), 1000);
            });
        
        const $label = $('<label>')
            .addClass('custom-control-label')
            .attr('for', `office-${office.id}`);
        
        $checkbox.append($input, $label);
        
        const $info = $('<div>').addClass('office-info');
        const $name = $('<div>').addClass('office-name d-flex align-items-center');
        const $details = $('<div>').addClass('office-details');

        // Add office code badge
        const $badge = $('<span>')
            .addClass('badge badge-soft-primary badge-pill ml-2')
            .css('font-size', '10px')
            .text(office.code);

        // Highlight matching text if there's a filter
        if (this.officeFilter) {
            $name.html(this.highlightText(office.name, this.officeFilter));
            $details.html(this.highlightText(`${office.address} | ${office.phone}`, this.officeFilter));
        } else {
            $name.text(office.name);
            $details.text(`${office.address} | ${office.phone}`);
        }

        $name.append($badge);
        $info.append($name, $details);
        $item.append($checkbox, $info);

        // Add selected state if office is selected
        if (this.selectedOffices.has(office.id)) {
            $item.addClass('office-selected');
        }

        return $item;
    }

    highlightText(text, filter) {
        if (!filter) return text;
        const regex = new RegExp(`(${filter})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
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
            const offices = this.allOffices
                .filter(o => this.selectedOffices.has(o.id));

            const updatedZone = await zentra.updateZone(this.currentZone.id, {
                name: this.currentZone.name,
                description: this.currentZone.description,
                region_id: this.currentZone.region_id,
                office_ids: Array.from(this.selectedOffices)
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
            const result = await zentra.createZone(e.data);
            e.data.id = result.id;
            DevExpress.ui.notify('Zone created successfully', 'success', 3000);
        } catch (error) {
            console.error('Error creating zone:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to create zone', 'error', 3000);
        }
    }

    async handleRowUpdating(e) {
        try {
            await zentra.updateZone(e.key.id, {...e.oldData, ...e.newData});
            DevExpress.ui.notify('Zone updated successfully', 'success', 3000);
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