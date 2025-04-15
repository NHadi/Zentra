import { zentra } from '../api/index.js';

// Define DivisionPage
window.DivisionPage = class {
    constructor() {
        this.grid = null;
        this.selectedEmployees = new Set();
        this.currentDivision = null;
        this.allEmployees = [];
        this.employeeFilter = '';
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();
    }

    dispose() {
        // Clean up event listeners
        $('#employeeModal').off('show.bs.modal');
        $('#employeeModal').off('hide.bs.modal');
        $('#employeeSearchBox').off('input');
        $('#saveEmployees').off('click');

        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    bindEvents() {
        // Modal show event
        $('#employeeModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const divisionId = button.data('division-id');
            const divisionName = button.data('division-name');
            this.currentDivision = { id: divisionId, name: divisionName };
            
            // Update modal title with division name
            $('#employeeModalLabel').text(`Manage Employees - ${divisionName}`);
            
            // Show loading state
            $('.employee-list').html(`
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <div class="mt-2">Loading employees...</div>
                </div>
            `);
            
            this.loadEmployees(divisionId);
        });

        // Modal hide event
        $('#employeeModal').on('hide.bs.modal', () => {
            this.selectedEmployees.clear();
            this.employeeFilter = '';
            $('#employeeSearchBox').val('');
            $('.employee-list').empty();
            $('#employeeModalLabel').text('Manage Division Employees');
        });

        // Employee search
        $('#employeeSearchBox').on('input', (e) => {
            this.employeeFilter = e.target.value.toLowerCase();
            this.renderEmployees();
        });

        // Save employees
        $('#saveEmployees').on('click', () => {
            const $saveBtn = $('#saveEmployees');
            const originalText = $saveBtn.text();
            
            // Disable button and show loading state
            $saveBtn.prop('disabled', true)
                   .html('<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>Saving...');
            
            this.saveEmployees()
                .finally(() => {
                    // Re-enable button and restore text
                    $saveBtn.prop('disabled', false).text(originalText);
                });
        });
    }

    initialize() {
        const gridElement = $('#divisionGrid');
        if (!gridElement.length) {
            console.error('Division grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#divisionGrid').dxDataGrid({
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
                    caption: 'Division Name',
                    width: 200,
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center p-2')
                            .append(
                                $('<div>')
                                    .addClass('division-icon-wrapper mr-3')
                                    .append($('<i>').addClass('ni ni-building text-primary'))
                            )
                            .append(
                                $('<div>')
                                    .addClass('division-info')
                                    .append(
                                        $('<div>').addClass('division-name font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('division-meta text-muted small')
                                            .text(`ID: ${options.data.id}`)
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    width: 250,
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('description-cell p-2')
                            .append(
                                $('<div>')
                                    .addClass('text-wrap')
                                    .text(options.data.description || 'No description provided')
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'employees',
                    caption: 'Employees',
                    minWidth: 300,
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('employee-container p-2');
                        
                        if (options.data.employees?.length) {
                            const $employeeList = $('<div>').addClass('d-flex flex-wrap gap-2');
                            
                            options.data.employees.slice(0, 3).forEach(employee => {
                                $('<div>')
                                    .addClass('employee-chip d-flex align-items-center bg-light rounded p-2 mr-2')
                                    .append(
                                        $('<i>').addClass('ni ni-single-02 text-primary mr-2')
                                    )
                                    .append(
                                        $('<span>').addClass('employee-name').text(employee.name)
                                    )
                                    .appendTo($employeeList);
                            });

                            if (options.data.employees.length > 3) {
                                const remainingCount = options.data.employees.length - 3;
                                const remainingEmployees = options.data.employees.slice(3);
                                
                                // Create a unique ID for the modal
                                const modalId = `employeeListModal-${options.data.id}`;
                                
                                // Create the modal if it doesn't exist
                                if (!$(`#${modalId}`).length) {
                                    $('body').append(`
                                        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
                                            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title">All Employees - ${options.data.name}</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body p-0">
                                                        <div class="list-group list-group-flush">
                                                            ${remainingEmployees.map(emp => `
                                                                <div class="list-group-item">
                                                                    <div class="d-flex align-items-center">
                                                                        <div class="employee-avatar mr-3">
                                                                            <i class="ni ni-single-02 text-primary"></i>
                                                                        </div>
                                                                        <div class="flex-grow-1">
                                                                            <h6 class="mb-1">${emp.name}</h6>
                                                                            ${emp.email ? `<div class="text-muted small">${emp.email}</div>` : ''}
                                                                            ${emp.phone ? `<div class="text-muted small"><i class="ni ni-mobile-button mr-1"></i>${emp.phone}</div>` : ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            `).join('')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `);
                                }

                                // Create the +X more chip that opens the modal
                                $('<div>')
                                    .addClass('employee-chip more-chip d-flex align-items-center bg-primary text-white rounded p-2')
                                    .attr({
                                        'data-toggle': 'modal',
                                        'data-target': `#${modalId}`,
                                        'role': 'button'
                                    })
                                    .append(
                                        $('<i>').addClass('ni ni-users mr-1')
                                    )
                                    .append(
                                        $('<span>').text(`+${remainingCount} more`)
                                    )
                                    .appendTo($employeeList);
                            }

                            $employeeList.appendTo($container);
                        } else {
                            $('<div>')
                                .addClass('text-muted d-flex align-items-center')
                                .append(
                                    $('<i>').addClass('ni ni-user-run mr-2')
                                )
                                .append(
                                    $('<span>').text('No employees assigned')
                                )
                                .appendTo($container);
                        }
                        
                        $container.appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 150,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center p-2');

                        // Manage Employees Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary mr-2')
                            .attr({
                                'title': 'Manage Employees',
                                'data-toggle': 'modal',
                                'data-target': '#employeeModal',
                                'data-division-id': options.row.data.id,
                                'data-division-name': options.row.data.name
                            })
                            .append($('<i>').addClass('ni ni-single-02'))
                            .appendTo($buttonContainer);

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Division')
                            .append($('<i>').addClass('ni ni-ruler-pencil'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Division')
                            .append($('<i>').addClass('ni ni-fat-remove'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm({
                                    title: "Confirm Deletion",
                                    message: "Are you sure you want to delete this division?",
                                    buttons: [{
                                        text: "Delete",
                                        type: "danger",
                                        onClick: () => this.grid.deleteRow(options.rowIndex)
                                    }, {
                                        text: "Cancel",
                                        type: "normal"
                                    }]
                                });
                            })
                            .appendTo($buttonContainer);

                        container.append($buttonContainer);
                    }
                }
            ],
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: {
                visible: true,
                width: 300,
                placeholder: "Search divisions..."
            },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: false },
            rowAlternationEnabled: true,
            hoverStateEnabled: true,
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true,
                showNavigationButtons: true
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                useIcons: true,
                popup: {
                    title: 'Division Information',
                    showTitle: true,
                    width: 700,
                    height: 400,
                    position: {
                        my: 'center',
                        at: 'center',
                        of: window
                    }
                },
                form: {
                    items: [
                        {
                            itemType: 'group',
                            colCount: 1,
                            items: [
                                {
                                    dataField: 'name',
                                    validationRules: [{ type: 'required', message: 'Division name is required' }],
                                    editorOptions: {
                                        stylingMode: 'filled'
                                    }
                                },
                                {
                                    dataField: 'description',
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        height: 100,
                                        stylingMode: 'filled'
                                    },
                                    validationRules: [{ type: 'required', message: 'Description is required' }]
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
                            text: 'Add Division',
                            type: 'default',
                            stylingMode: 'contained',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel'
                ]
            },
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e),
            onInitialized: () => this.loadData()
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            const data = await zentra.getDivisions();
            this.grid.option('dataSource', data);
        } catch (error) {
            console.error('Error loading divisions:', error);
            DevExpress.ui.notify('Failed to load divisions', 'error', 3000);
        }
    }

    async loadEmployees(divisionId) {
        try {
            this.allEmployees = await zentra.getEmployees();
            // Get the current division's employees
            const currentDivision = this.grid.option('dataSource').find(d => d.id === divisionId);
            if (currentDivision?.employees) {
                // Set selected employees based on current division's employees
                this.selectedEmployees = new Set(currentDivision.employees.map(e => e.id));
            }
            this.renderEmployees();
        } catch (error) {
            console.error('Error loading employees:', error);
            $('.employee-list').html(`
                <div class="alert alert-danger m-3" role="alert">
                    <i class="ni ni-support-16 mr-2"></i>
                    Failed to load employees. Please try again.
                </div>
            `);
            DevExpress.ui.notify('Failed to load employees', 'error', 3000);
        }
    }

    renderEmployees() {
        const $employeeList = $('.employee-list');
        $employeeList.empty();

        const filteredEmployees = this.allEmployees.filter(employee => 
            employee.name.toLowerCase().includes(this.employeeFilter) ||
            employee.email?.toLowerCase().includes(this.employeeFilter) ||
            employee.phone?.toLowerCase().includes(this.employeeFilter)
        );

        if (filteredEmployees.length === 0) {
            $employeeList.html(`
                <div class="no-employees">
                    <i class="ni ni-zoom-split-in"></i>
                    <div>No employees found matching your search</div>
                    <div class="text-muted small mt-2">Try adjusting your search terms</div>
                </div>
            `);
            return;
        }

        // Add select all option if there are employees
        const allSelected = filteredEmployees.every(emp => this.selectedEmployees.has(emp.id));
        const $selectAll = $(`
            <div class="employee-item select-all mb-3">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="selectAll"
                           ${allSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="selectAll"></label>
                </div>
                <div class="employee-info d-flex align-items-center">
                    <div class="employee-details">
                        <div class="employee-name font-weight-bold">Select All</div>
                        <div class="employee-email text-muted small">
                            ${filteredEmployees.length} employees
                        </div>
                    </div>
                </div>
            </div>
        `).on('change', 'input[type="checkbox"]', (e) => {
            const checked = e.target.checked;
            filteredEmployees.forEach(emp => {
                if (checked) {
                    this.selectedEmployees.add(emp.id);
                } else {
                    this.selectedEmployees.delete(emp.id);
                }
            });
            this.renderEmployees();
        });

        $employeeList.append($selectAll);
        
        // Add divider
        $employeeList.append('<hr class="my-3">');

        filteredEmployees.forEach(employee => {
            const isSelected = this.selectedEmployees.has(employee.id);
            const $employeeItem = this.createEmployeeItem(employee, isSelected);
            $employeeList.append($employeeItem);
        });
    }

    createEmployeeItem(employee, isSelected) {
        return $(`
            <div class="employee-item ${isSelected ? 'selected' : ''}" data-employee-id="${employee.id}">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="employee-${employee.id}"
                           ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="employee-${employee.id}"></label>
                </div>
                <div class="employee-info d-flex align-items-center">
                    <div class="employee-avatar mr-3">
                        <i class="ni ni-single-02 text-primary"></i>
                    </div>
                    <div class="employee-details">
                        <div class="employee-name font-weight-bold">${employee.name}</div>
                        <div class="employee-email text-muted small">${employee.email || 'No email provided'}</div>
                        ${employee.phone ? `<div class="employee-phone text-muted small"><i class="ni ni-mobile-button mr-1"></i>${employee.phone}</div>` : ''}
                    </div>
                </div>
            </div>
        `).on('change', 'input[type="checkbox"]', (e) => {
            const checked = e.target.checked;
            if (checked) {
                this.selectedEmployees.add(employee.id);
                $(e.target).closest('.employee-item').addClass('selected');
            } else {
                this.selectedEmployees.delete(employee.id);
                $(e.target).closest('.employee-item').removeClass('selected');
            }
        });
    }

    async saveEmployees() {
        try {
            // Convert Set to Array for API call
            const selectedEmployeeIds = Array.from(this.selectedEmployees);
            
            // Update division employees with the complete list of selected employees
            await zentra.updateDivisionEmployees(this.currentDivision.id, selectedEmployeeIds);
            
            $('#employeeModal').modal('hide');
            await this.loadData();
            DevExpress.ui.notify({
                message: 'Employees updated successfully',
                type: 'success',
                displayTime: 3000,
                animation: {
                    show: { type: 'fade', duration: 400, from: 0, to: 1 },
                    hide: { type: 'fade', duration: 400, from: 1, to: 0 }
                }
            });
        } catch (error) {
            console.error('Error updating employees:', error);
            DevExpress.ui.notify({
                message: 'Failed to update employees',
                type: 'error',
                displayTime: 3000,
                animation: {
                    show: { type: 'fade', duration: 400, from: 0, to: 1 },
                    hide: { type: 'fade', duration: 400, from: 1, to: 0 }
                }
            });
        }
    }

    async handleRowInserting(e) {
        try {
            const result = await zentra.createDivision(e.data);
            e.data.id = result.id;
            DevExpress.ui.notify('Division created successfully', 'success', 3000);
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            console.error('Error creating division:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to create division', 'error', 3000);
        }
    }

    async handleRowUpdating(e) {
        try {
            // Ensure we're passing the numeric ID
            const divisionId = typeof e.key === 'object' ? e.key.id : e.key;
            await zentra.updateDivision(divisionId, {...e.oldData, ...e.newData});
            DevExpress.ui.notify('Division updated successfully', 'success', 3000);
        } catch (error) {
            console.error('Error updating division:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to update division', 'error', 3000);
        }
    }

    async handleRowRemoving(e) {
        try {
            // Ensure we're passing the numeric ID
            const divisionId = typeof e.key === 'object' ? e.key.id : e.key;
            await zentra.deleteDivision(divisionId);
            DevExpress.ui.notify('Division deleted successfully', 'success', 3000);
        } catch (error) {
            console.error('Error deleting division:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to delete division', 'error', 3000);
        }
    }

    editDivision(division) {
        const rowIndex = this.grid.getRowIndexByKey(division.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteDivision(division) {
        const rowIndex = this.grid.getRowIndexByKey(division.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this division?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.divisionPageInstance) {
    window.divisionPageInstance = new window.DivisionPage();
} 