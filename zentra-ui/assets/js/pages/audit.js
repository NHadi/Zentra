import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define AuditPage
window.AuditPage = class {
    constructor() {
        this.grid = null;
        this.startDatePicker = null;
        this.endDatePicker = null;
        this.entityTypeFilter = null;
        this.actionFilter = null;
        this.isInitialLoad = true;
        this.exportButtonsAdded = false;
        
        // Add debounce mechanism
        this.debouncedLoadData = this.debounce(this.loadData.bind(this), 300);
        
        // Check if DevExtreme is already loaded
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        if (this.startDatePicker) {
            this.startDatePicker.dispose();
            this.startDatePicker = null;
        }
        if (this.endDatePicker) {
            this.endDatePicker.dispose();
            this.endDatePicker = null;
        }
        if (this.entityTypeFilter) {
            this.entityTypeFilter.dispose();
            this.entityTypeFilter = null;
        }
        if (this.actionFilter) {
            this.actionFilter.dispose();
            this.actionFilter = null;
        }
    }

    initialize() {
        console.log('Initializing Audit Page...');
        this.initializeDatePickers();
        this.initializeFilters();
        this.initializeGrid();
        this.initializeRefreshButton();
        
        // Update filter options and load data only once
        this.updateFilterOptions().then(() => {
            console.log('Filter options updated');
            if (this.isInitialLoad) {
                this.loadData();
                this.isInitialLoad = false;
            }
        }).catch(error => {
            console.error('Error updating filter options:', error);
        });
        console.log('Audit Page initialized');
    }

    initializeDatePickers() {
        console.log('Initializing date pickers...');
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.startDatePicker = $('#startDatePicker').dxDateBox({
            type: 'date',
            value: thirtyDaysAgo,
            displayFormat: 'yyyy-MM-dd',
            stylingMode: 'filled',
            onValueChanged: this.debouncedLoadData.bind(this)
        }).dxDateBox('instance');

        this.endDatePicker = $('#endDatePicker').dxDateBox({
            type: 'date',
            value: today,
            displayFormat: 'yyyy-MM-dd',
            stylingMode: 'filled',
            onValueChanged: this.debouncedLoadData.bind(this)
        }).dxDateBox('instance');

        console.log('Date pickers initialized');
    }

    initializeFilters() {
        console.log('Initializing filters...');
        this.entityTypeFilter = $('#entityTypeFilter').dxSelectBox({
            items: ['All'],
            value: 'All',
            stylingMode: 'filled',
            onValueChanged: this.debouncedLoadData.bind(this),
            displayExpr: (item) => item ? item.charAt(0).toUpperCase() + item.slice(1) : '',
            searchEnabled: true
        }).dxSelectBox('instance');

        this.actionFilter = $('#actionFilter').dxSelectBox({
            items: ['All'],
            value: 'All',
            stylingMode: 'filled',
            onValueChanged: this.debouncedLoadData.bind(this),
            displayExpr: (item) => item ? item.charAt(0).toUpperCase() + item.slice(1) : '',
            searchEnabled: true
        }).dxSelectBox('instance');

        console.log('Filters initialized');
    }

    async updateFilterOptions() {
        try {
            console.log('Updating filter options...');
            if (!this.entityTypeFilter || !this.actionFilter) {
                console.warn('Filters not yet initialized');
                return;
            }

            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const formattedStartDate = thirtyDaysAgo.toISOString().split('T')[0];
            const formattedEndDate = today.toISOString().split('T')[0];

            const data = await zentra.getAuditsByDateRange(formattedStartDate, formattedEndDate);

            const entityTypes = ['All', ...new Set(data.map(item => item.entity_type))].sort();
            const actions = ['All', ...new Set(data.map(item => item.action))].sort();

            this.entityTypeFilter.option('items', entityTypes);
            this.actionFilter.option('items', actions);
            
            console.log('Filter options updated successfully');
        } catch (error) {
            console.error('Error updating filter options:', error);
            DevExpress.ui.notify('Failed to load filter options: ' + error.message, 'error', 3000);
        }
    }

    initializeRefreshButton() {
        $('#refreshButton').on('click', () => {
            this.loadData();
        });
    }

    initializeGrid() {
        const gridElement = $('#auditGrid');
        if (!gridElement.length) {
            console.error('Audit grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#auditGrid').dxDataGrid({
            dataSource: [],
            remoteOperations: false,
            columnAutoWidth: true,
            showBorders: true,
            rowAlternationEnabled: true,
            hoverStateEnabled: true,
            ...gridUtils.getCommonGridConfig(),
            columns: [
                {
                    dataField: 'created_at',
                    caption: 'Date/Time',
                    dataType: 'datetime',
                    format: 'yyyy-MM-dd HH:mm:ss',
                    width: 160,
                    sortOrder: 'desc'
                },
                {
                    dataField: 'entity_type',
                    caption: 'Entity Type',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('badge badge-info')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'entity_id',
                    caption: 'Entity ID',
                    width: 100,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('badge badge-primary')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'action',
                    caption: 'Action',
                    width: 100,
                    cellTemplate: (container, options) => {
                        const actionClasses = {
                            'create': 'badge-success',
                            'update': 'badge-warning',
                            'delete': 'badge-danger'
                        };
                        const badgeClass = actionClasses[options.value.toLowerCase()] || 'badge-secondary';
                        $('<div>')
                            .addClass(`badge ${badgeClass}`)
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'created_by',
                    caption: 'Created By',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('badge badge-light')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'old_values',
                    caption: 'Old Values',
                    cellTemplate: (container, options) => {
                        if (!options.value) {
                            container.text('-');
                            return;
                        }
                        const $container = $('<div>').addClass('json-container');
                        const $pre = $('<pre>').addClass('json-viewer m-0 p-2');
                        
                        try {
                            const formatted = JSON.stringify(options.value, null, 2)
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                                    let cls = 'number';
                                    if (/^"/.test(match)) {
                                        if (/:$/.test(match)) {
                                            cls = 'key';
                                        } else {
                                            cls = 'string';
                                        }
                                    } else if (/true|false/.test(match)) {
                                        cls = 'boolean';
                                    } else if (/null/.test(match)) {
                                        cls = 'null';
                                    }
                                    return `<span class="json-${cls}">${match}</span>`;
                                });
                            $pre.html(formatted);
                        } catch (error) {
                            $pre.text(JSON.stringify(options.value));
                        }
                        
                        $container.append($pre);
                        container.append($container);
                    }
                },
                {
                    dataField: 'new_values',
                    caption: 'New Values',
                    cellTemplate: (container, options) => {
                        if (!options.value) {
                            container.text('-');
                            return;
                        }
                        const $container = $('<div>').addClass('json-container');
                        const $pre = $('<pre>').addClass('json-viewer m-0 p-2');
                        
                        try {
                            const formatted = JSON.stringify(options.value, null, 2)
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                                    let cls = 'number';
                                    if (/^"/.test(match)) {
                                        if (/:$/.test(match)) {
                                            cls = 'key';
                                        } else {
                                            cls = 'string';
                                        }
                                    } else if (/true|false/.test(match)) {
                                        cls = 'boolean';
                                    } else if (/null/.test(match)) {
                                        cls = 'null';
                                    }
                                    return `<span class="json-${cls}">${match}</span>`;
                                });
                            $pre.html(formatted);
                        } catch (error) {
                            $pre.text(JSON.stringify(options.value));
                        }
                        
                        $container.append($pre);
                        container.append($container);
                    }
                }
            ],
            filterRow: { visible: true },
            searchPanel: { visible: true },
            groupPanel: { visible: true },
            columnChooser: { enabled: false },
            headerFilter: { visible: true },
            paging: {
                pageSize: 20
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [10, 20, 50, 100],
                showInfo: true
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Audit_Log');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => {
                if (this.grid) {
                    this.loadData();
                }
            }
        }).dxDataGrid('instance');

        // Add CSS for JSON formatting
        if (!document.getElementById('json-viewer-styles')) {
            const style = document.createElement('style');
            style.id = 'json-viewer-styles';
            style.textContent = `
                .json-container {
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    max-height: 150px;
                    overflow: auto;
                }
                .json-viewer {
                    font-family: monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    white-space: pre-wrap;
                }
                .json-key { color: #2c7be5; }
                .json-string { color: #2dce89; }
                .json-number { color: #fb6340; }
                .json-boolean { color: #f5365c; }
                .json-null { color: #8898aa; }
                .badge {
                    padding: 5px 10px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async loadData() {
        try {
            if (!this.startDatePicker || !this.endDatePicker || !this.entityTypeFilter || !this.actionFilter) {
                console.warn('Components not fully initialized');
                return;
            }

            const startDate = this.startDatePicker.option('value');
            const endDate = this.endDatePicker.option('value');
            const entityType = this.entityTypeFilter.option('value');
            const action = this.actionFilter.option('value');

            if (!startDate || !endDate) {
                console.warn('Start date or end date is missing');
                return;
            }

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            let data = await zentra.getAuditsByDateRange(formattedStartDate, formattedEndDate);
            
            if (entityType && entityType !== 'All') {
                data = data.filter(item => item.entity_type === entityType);
            }
            if (action && action !== 'All') {
                data = data.filter(item => item.action.toLowerCase() === action.toLowerCase());
            }

            if (this.grid) {
                this.grid.option('dataSource', data);
            }
        } catch (error) {
            gridUtils.handleGridError(error, 'loading audit data');
        }
    }

    // Add debounce utility function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.auditPageInstance) {
    window.auditPageInstance = new window.AuditPage();
} 