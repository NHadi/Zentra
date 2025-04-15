import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define EmployeePage
window.EmployeePage = class {
    constructor() {
        this.grid = null;
        this.selectedDivision = null;
        this.currentEmployee = null;
        this.allDivisions = [];
        this.divisionFilter = '';
        this.exportButtonsAdded = false;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initializeAsync();
        }
        
        // Bind event handlers
        this.bindEvents();
    }

    async initializeAsync() {
        try {
            // Load divisions first
            await this.loadDivisionsData();
            // Then initialize the grid
            this.initialize();
        } catch (error) {
            console.error('Error during initialization:', error);
            DevExpress.ui.notify('Failed to initialize application', 'error', 3000);
        }
    }

    dispose() {
        // Clean up event listeners
        $('#divisionModal').off('show.bs.modal');
        $('#divisionModal').off('hide.bs.modal');
        $('#divisionSearchBox').off('input');
        $('#saveDivision').off('click');

        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    bindEvents() {
        // Modal show event
        $('#divisionModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const employeeId = button.data('employee-id');
            const employeeName = button.data('employee-name');
            this.currentEmployee = { id: employeeId, name: employeeName };
            this.loadDivisions(employeeId);
        });

        // Modal hide event
        $('#divisionModal').on('hide.bs.modal', () => {
            this.selectedDivision = null;
            this.divisionFilter = '';
            $('#divisionSearchBox').val('');
            $('.division-list').empty();
        });

        // Division search
        $('#divisionSearchBox').on('input', (e) => {
            this.divisionFilter = e.target.value.toLowerCase();
            this.renderDivisions();
        });

        // Save division
        $('#saveDivision').on('click', () => this.saveDivision());
    }

    initialize() {
        const gridElement = $('#employeeGrid');
        if (!gridElement.length) {
            console.error('Employee grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Log the available divisions
        console.log('Available divisions during grid initialization:', this.allDivisions);

        // Create a lookup data source for divisions
        const divisionLookup = {
            dataSource: this.allDivisions,
            displayExpr: 'name',
            valueExpr: 'id'
        };

        this.grid = $('#employeeGrid').dxDataGrid({
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
                    caption: 'Employee Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<div>')
                                    .addClass('avatar avatar-sm rounded-circle mr-3')
                                    .css('background-color', this.getAvatarColor(options.data.name))
                                    .append(
                                        $('<span>')
                                            .addClass('avatar-initials')
                                            .text(this.getInitials(options.data.name))
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'email',
                    caption: 'Email',
                    validationRules: [
                        { type: 'required' },
                        { type: 'email' }
                    ],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-email-83 mr-2 text-info')
                            )
                            .append(
                                $('<span>').text(options.data.email || '')
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'phone',
                    caption: 'Phone',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-mobile-button mr-2 text-warning')
                            )
                            .append(
                                $('<span>').text(options.data.phone || '')
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'division',
                    caption: 'Division',
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('division-container');
                        
                        if (options.data.division) {
                            $('<span>')
                                .addClass('division-badge')
                                .append(
                                    $('<i>').addClass('ni ni-building')
                                )
                                .append(
                                    $('<span>').text(' ' + options.data.division.name)
                                )
                                .appendTo($container);
                        } else {
                            $('<div>')
                                .addClass('text-muted small')
                                .append(
                                    $('<i>').addClass('ni ni-info-circle mr-1')
                                )
                                .append(
                                    $('<span>').text('No division assigned')
                                )
                                .appendTo($container);
                        }
                        
                        $container.appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 140,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('');


                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Employee')
                            .append($('<i>').addClass('ni ni-ruler-pencil'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Employee')
                            .append($('<i>').addClass('ni ni-fat-remove'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this employee?", "Confirm deletion")
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
            groupPanel: { visible: false },
            columnChooser: { enabled: false },
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
                texts: {
                    confirmDeleteMessage: 'Are you sure you want to delete this employee?',
                    saveRowChanges: 'Save',
                    cancelRowChanges: 'Cancel',
                    deleteRow: 'Delete',
                    editRow: 'Edit',
                    addRow: 'New Employee'
                },
                popup: {
                    title: 'Employee Information',
                    showTitle: true,
                    width: 800,
                    height: 'auto',
                    position: { my: 'center', at: 'center', of: window },
                    showCloseButton: true,
                    onHidden: () => {
                        // Only reset form data if we're not in the middle of an add operation
                        const changes = this.grid.option('editing.changes') || [];
                        const isAdding = changes.some(c => c.type === 'insert');
                        
                        if (!isAdding) {
                            const form = $('.dx-popup-content .dx-form').dxForm('instance');
                            if (form) {
                                form.resetValues();
                            }
                        }
                    }
                },
                form: {
                    labelLocation: 'top',
                    showColonAfterLabel: false,
                    colCount: 2,
                    items: [
                        {
                            itemType: 'group',
                            caption: 'Basic Information',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'name',
                                    label: { text: 'Full Name' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter employee full name'
                                    },
                                    validationRules: [{ type: 'required', message: 'Full name is required' }]
                                },
                                {
                                    dataField: 'email',
                                    label: { text: 'Email Address' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter work email address'
                                    },
                                    validationRules: [
                                        { type: 'required', message: 'Email address is required' },
                                        { type: 'email', message: 'Please enter a valid email address' }
                                    ]
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Contact Details',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'phone',
                                    label: { text: 'Phone Number' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter phone number',
                                        mask: '+1 (000) 000-0000',
                                        maskRules: {"0": /[0-9]/},
                                        maskInvalidMessage: 'Please enter a valid phone number'
                                    },
                                    validationRules: [{ type: 'required', message: 'Phone number is required' }]
                                },
                                {
                                    dataField: 'division_id',
                                    label: { text: 'Division' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        dataSource: this.allDivisions,
                                        displayExpr: 'name',
                                        valueExpr: 'id',
                                        placeholder: 'Select a division',
                                        searchEnabled: true,
                                        onValueChanged: (e) => {
                                            if (e.value) {
                                                const selectedDivision = this.allDivisions.find(d => d.id === e.value);
                                                if (selectedDivision) {
                                                    const form = $('.dx-popup-content .dx-form').dxForm('instance');
                                                    if (form) {
                                                        form.updateData('division', selectedDivision);
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Division is required' }]
                                }
                            ]
                        }
                    ]
                },
                startEditAction: 'click',
                refreshMode: 'reshape',
                onInitNewRow: (e) => {
                    console.log('Initializing new row');
                    // Initialize default values for new row
                    e.data = {
                        name: '',
                        email: '',
                        phone: '',
                        division_id: null
                    };
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Employee',
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
                    gridUtils.addExportButtons(this.grid, 'Employees');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: (e) => {
                this.grid = e.component;
                console.log('Grid initialized');
                this.loadData();
            },
            onEditingStart: (e) => {
                console.log('Edit starting for row:', e.key);
                console.log('Row data:', e.data);
                
                // Wait for the popup to be shown and form to be created
                setTimeout(() => {
                    const form = $('.dx-popup-content .dx-form').dxForm('instance');
                    if (!form) {
                        console.error('Form instance not found');
                        return;
                    }

                    // Get the division SelectBox instance
                    const divisionEditor = form.getEditor('division_id');
                    if (!divisionEditor) {
                        console.error('Division editor not found');
                        return;
                    }

                    // Initialize form data
                    const formData = { ...e.data };
                    console.log('Original data when editing starts:', formData);

                    // Set division value
                    if (formData.division_id) {
                        divisionEditor.option('value', parseInt(formData.division_id));
                    } else if (formData.division?.id) {
                        divisionEditor.option('value', parseInt(formData.division.id));
                    }

                    // Set the form data
                    form.option('formData', formData);
                }, 100);
            },
            onRowUpdating: (e) => {
                console.log('Row updating:', e);
                
                // Get the form instance
                const $form = $('.dx-popup-content .dx-form');
                const form = $form.length ? $form.dxForm('instance') : null;
                
                if (!form) {
                    console.error('Form instance not found');
                    return;
                }

                // Get all form data
                const formData = form.option('formData') || {};
                console.log('Form data before processing:', formData);

                // Get the grid's editing data
                const gridData = e.newData || {};
                console.log('Grid data:', gridData);

                // Merge form data with grid data, giving priority to form data
                const cleanData = { ...e.oldData, ...gridData, ...formData };
                console.log('Merged data:', cleanData);

                // Handle division_id and division object
                if (cleanData.division_id) {
                    cleanData.division_id = parseInt(cleanData.division_id);
                    const division = this.allDivisions.find(d => d.id === cleanData.division_id);
                    if (division) {
                        cleanData.division = division;
                    }
                } else if (cleanData.division?.id) {
                    cleanData.division_id = parseInt(cleanData.division.id);
                }

                // Update the newData with the merged data
                e.newData = cleanData;
            },
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowRemoving: null,
            onSaved: (e) => {
                console.log('Save operation completed:', e);
            },
            onSaving: (e) => {
                console.log('Saving event triggered:', e);
                
                const changes = e.changes || [];
                console.log('Current changes:', changes);
                
                if (!changes.length) {
                    console.log('No changes detected');
                    return;
                }

                e.cancel = true;
                e.promise = (async () => {
                    try {
                        const change = changes[0];

                        // Handle deletion
                        if (change.type === 'remove') {
                            const confirmed = await DevExpress.ui.dialog.confirm(
                                "Are you sure you want to delete this employee?",
                                "Confirm deletion"
                            );
                            
                            if (confirmed) {
                                await zentra.deleteEmployee(change.key);
                                DevExpress.ui.notify('Employee deleted successfully', 'success', 3000);
                                // Clear changes and refresh grid
                                this.grid.option('editing.changes', []);
                                await this.loadData();
                            }
                            return;
                        }

                        const form = $('.dx-popup-content .dx-form').dxForm('instance');
                        
                        if (!form) {
                            throw new Error('Form instance not found');
                        }

                        // Validate form
                        const validationResult = form.validate();
                        if (!validationResult.isValid) {
                            return;
                        }

                        // Get form data
                        const formData = form.option('formData') || {};
                        const changeData = change.data || {};
                        
                        // Merge the data
                        const mergedData = {
                            ...formData,
                            ...changeData
                        };

                        // Prepare API data
                        const apiData = {
                            name: (mergedData.name || '').trim(),
                            email: (mergedData.email || '').trim(),
                            phone: (mergedData.phone || '').replace(/[^\d]/g, ''),
                            DivisionID: parseInt(mergedData.division_id || 0)
                        };

                        // Validate required fields
                        if (!apiData.name) throw new Error('Employee name is required');
                        if (!apiData.email) throw new Error('Email is required');
                        if (!apiData.phone) throw new Error('Phone number is required');
                        if (!apiData.DivisionID) throw new Error('Division is required');

                        // Perform the operation
                        if (change.type === 'insert') {
                            const result = await zentra.createEmployee(apiData);
                            if (!result?.id) {
                                throw new Error('Failed to create employee - no ID returned');
                            }
                            DevExpress.ui.notify('Employee created successfully', 'success', 3000);
                        } else if (change.type === 'update') {
                            await zentra.updateEmployee(change.key, apiData);
                            DevExpress.ui.notify('Employee updated successfully', 'success', 3000);
                        }

                        // Close popup
                        this.grid.option('editing.popup.visible', false);
                        
                        // Clear form and grid state
                        form.resetValues();
                        this.grid.option('editing.changes', []);
                        this.grid.cancelEditData();
                        
                        // Refresh data
                        await this.loadData();

                    } catch (error) {
                        console.error('Error in saving:', error);
                        DevExpress.ui.notify(error.message || 'Failed to save employee', 'error', 3000);
                        throw error;
                    }
                })();
            }
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
            this.grid.beginCustomLoading('Loading employees...');

            const data = await zentra.getEmployees();
            
            // Update the data source
            this.grid.option('dataSource', {
                store: {
                    type: 'array',
                    key: 'id',
                    data: data
                }
            });
            
            // Refresh the grid
            this.grid.refresh();

            // Hide loading panel
            this.grid.endCustomLoading();
        } catch (error) {
            gridUtils.handleGridError(error, 'loading employees');
        }
    }

    async loadDivisions(employeeId) {
        try {
            this.allDivisions = await zentra.getDivisions();
            // Get the current employee's division
            const currentEmployee = this.grid.option('dataSource').find(e => e.id === employeeId);
            if (currentEmployee?.division) {
                // Set selected division based on current employee's division
                this.selectedDivision = currentEmployee.division;
            }
            this.renderDivisions();
        } catch (error) {
            console.error('Error loading divisions:', error);
            DevExpress.ui.notify('Failed to load divisions', 'error', 3000);
        }
    }

    renderDivisions() {
        const $divisionList = $('.division-list');
        $divisionList.empty();

        const filteredDivisions = this.allDivisions.filter(division => 
            division.name.toLowerCase().includes(this.divisionFilter) ||
            division.description?.toLowerCase().includes(this.divisionFilter)
        );

        if (filteredDivisions.length === 0) {
            $divisionList.html(`
                <div class="no-divisions">
                    <i class="ni ni-search"></i>
                    No divisions found matching your search
                </div>
            `);
            return;
        }

        filteredDivisions.forEach(division => {
            const isSelected = this.selectedDivision?.id === division.id;
            const $divisionItem = this.createDivisionItem(division, isSelected);
            $divisionList.append($divisionItem);
        });
    }

    createDivisionItem(division, isSelected) {
        return $(`
            <div class="division-item ${isSelected ? 'selected' : ''}" data-division-id="${division.id}">
                <div class="custom-control custom-radio">
                    <input type="radio" class="custom-control-input" id="division-${division.id}"
                           name="division" ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="division-${division.id}"></label>
                </div>
                <div class="division-info">
                    <div class="division-name">${division.name}</div>
                    <div class="division-details">${division.description || 'No description provided'}</div>
                </div>
            </div>
        `).on('change', () => {
            this.selectedDivision = division;
        });
    }

    async saveDivision() {
        if (!this.currentEmployee || !this.selectedDivision) {
            DevExpress.ui.notify('Please select a division', 'warning', 3000);
            return;
        }

        try {
            // Get current employee's division
            const currentEmployee = this.grid.option('dataSource').find(e => e.id === this.currentEmployee.id);
            
            // If employee already has a division and it's different from the selected one
            if (currentEmployee?.division?.id && currentEmployee.division.id !== this.selectedDivision.id) {
                // Remove from old division
                await zentra.removeDivision(this.currentEmployee.id);
            }
            
            // Assign to new division
            await zentra.assignDivision(this.currentEmployee.id, this.selectedDivision.id);
            
            $('#divisionModal').modal('hide');
            this.loadData();
            DevExpress.ui.notify('Division assigned successfully', 'success', 3000);
        } catch (error) {
            console.error('Error saving division:', error);
            DevExpress.ui.notify('Failed to assign division', 'error', 3000);
        }
    }

    getInitials(name) {
        if (!name) return '';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    getAvatarColor(name) {
        if (!name) return '#5e72e4';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#5e72e4', '#11cdef', '#2dce89', '#fb6340', '#f5365c',
            '#8965e0', '#ffd600', '#5603ad', '#8898aa', '#32325d'
        ];
        return colors[Math.abs(hash) % colors.length];
    }

    showNotification(message, type = 'success') {
        DevExpress.ui.notify({
            message,
            type,
            displayTime: 3000,
            position: {
                my: 'center top',
                at: 'center top'
            },
            width: 'auto',
            animation: {
                show: { type: 'fade', duration: 400, from: 0, to: 1 },
                hide: { type: 'fade', duration: 400, to: 0 }
            }
        });
    }

    async handleRowInserting(e) {
        try {
            // Get the form instance
            const $form = $('.dx-popup-content .dx-form');
            const form = $form.length ? $form.dxForm('instance') : null;
            
            if (!form) {
                throw new Error('Form instance not found');
            }

            // Get all form data
            const formData = form.option('formData') || {};
            console.log('Form data before processing:', formData);

            // Get the grid's editing data
            const gridData = e.data || {};
            console.log('Grid data:', gridData);

            // Merge form data with grid data, giving priority to form data
            const cleanData = { ...gridData, ...formData };
            console.log('Merged data:', cleanData);

            // Remove any temporary fields
            delete cleanData.__KEY__;

            // Validate required fields
            const requiredFields = {
                name: { value: cleanData.name, message: 'Employee name is required' },
                email: { value: cleanData.email, message: 'Email is required' },
                phone: { value: cleanData.phone, message: 'Phone number is required' },
                division_id: { value: cleanData.division_id, message: 'Division is required' }
            };

            // Check each required field
            for (const [field, { value, message }] of Object.entries(requiredFields)) {
                if (!value && value !== 0) {
                    console.error(`Missing required field: ${field}`, cleanData);
                    throw new Error(message);
                }
            }

            // Format phone number - remove non-digits
            cleanData.phone = cleanData.phone.replace(/[^\d]/g, '');

            // Ensure division_id is properly set
            if (!cleanData.division_id && cleanData.division?.id) {
                cleanData.division_id = cleanData.division.id;
            }

            // Prepare API data with correct field names
            const apiData = {
                name: cleanData.name,
                email: cleanData.email,
                phone: cleanData.phone,
                DivisionID: parseInt(cleanData.division_id) // Ensure division_id is included and converted to integer
            };

            console.log('Final data being sent to API:', apiData);

            // Create the employee
            const result = await zentra.createEmployee(apiData);
            
            if (!result || !result.id) {
                throw new Error('Failed to create employee - no ID returned');
            }

            // Update the data with the new ID and division info
            e.data.id = result.id;
            e.data.division = cleanData.division;

            DevExpress.ui.notify('Employee created successfully', 'success', 3000);
        } catch (error) {
            console.error('Error creating employee:', error);
            e.cancel = true;
            DevExpress.ui.notify(error.message || 'Failed to create employee', 'error', 3000);
        }
    }

    editEmployee(employee) {
        const rowIndex = this.grid.getRowIndexByKey(employee.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteEmployee(employee) {
        const rowIndex = this.grid.getRowIndexByKey(employee.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this employee?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }

    async loadDivisionsData() {
        try {
            console.log('Loading divisions...');
            const divisions = await zentra.getDivisions();
            if (Array.isArray(divisions) && divisions.length > 0) {
                this.allDivisions = divisions;
                console.log('Successfully loaded divisions:', this.allDivisions);
            } else {
                console.warn('No divisions returned from API');
                this.allDivisions = [];
            }
        } catch (error) {
            console.error('Error loading divisions:', error);
            DevExpress.ui.notify('Failed to load divisions', 'error', 3000);
            this.allDivisions = [];
        }
    }

    handleFieldChange(fieldName, value) {
        console.log(`Field changed: ${fieldName}`, value);
        
        // Get the grid instance
        const grid = this.grid;
        if (!grid) {
            console.error('Grid instance not found');
            return;
        }

        // Get current editing row key
        const editRowKey = grid.option('editing.editRowKey');
        
        // Get current changes
        let changes = grid.option('editing.changes') || [];
        
        // Find existing change for this row
        let currentChange = changes.find(c => c.key === editRowKey);
        
        // If no change exists for this row, create one
        if (!currentChange) {
            currentChange = {
                type: editRowKey ? 'update' : 'insert',
                key: editRowKey,
                data: {}
            };
            changes.push(currentChange);
        }
        
        // Update the change data
        currentChange.data = {
            ...currentChange.data,
            [fieldName]: value
        };
        
        console.log('Setting grid changes:', changes);
        grid.option('editing.changes', changes);
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.employeePageInstance) {
    window.employeePageInstance = new window.EmployeePage();
} 