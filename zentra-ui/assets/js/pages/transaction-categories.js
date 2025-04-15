import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define TransactionCategoryPage
window.TransactionCategoryPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.transactionCategories = [];
        this.currentCategory = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Category Status Badge */
            .category-status {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .category-status.active {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .category-status.inactive {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            /* Category Type Badge */
            .category-type {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .category-type.income {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .category-type.expense {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            /* Category Code */
            .category-code {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                color: #8898aa;
                background: rgba(136, 152, 170, 0.1);
            }
        `)
        .appendTo('head');
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        // Clean up event listeners
        $('#addCategoryModal').off('show.bs.modal');
        $('#addCategoryModal').off('hide.bs.modal');
        $('#saveCategoryBtn').off('click');
    }

    bindEvents() {
        // Modal events
        $('#addCategoryModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const categoryId = button.data('category-id');
            if (categoryId) {
                this.loadCategoryForEdit(categoryId);
            } else {
                this.resetForm();
            }
        });

        $('#addCategoryModal').on('hide.bs.modal', () => {
            this.currentCategory = null;
            this.resetForm();
        });

        // Save button event
        $('#saveCategoryBtn').on('click', () => {
            this.saveCategory();
        });

        // Edit button event
        $(document).on('click', '.edit-category-btn', (e) => {
            const categoryId = $(e.currentTarget).data('category-id');
            if (categoryId) {
                this.loadCategoryForEdit(categoryId);
            }
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
    }

    initializeGrid() {
        const gridElement = $('#transactionCategoryGrid');
        if (!gridElement.length) {
            console.error('Transaction category grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#transactionCategoryGrid').dxDataGrid({
            dataSource: this.transactionCategories,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: false,
            wordWrapEnabled: true,
            height: 'calc(100vh - 350px)',
            width: '100%',
            columns: [
                {
                    dataField: 'code',
                    caption: 'Code',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('category-code')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'name',
                    caption: 'Name'
                },
                {
                    dataField: 'type',
                    caption: 'Type',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass(`category-type ${options.value}`)
                            .text(options.value.charAt(0).toUpperCase() + options.value.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description'
                },
                {
                    dataField: 'is_active',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass(`category-status ${options.value ? 'active' : 'inactive'}`)
                            .text(options.value ? 'Active' : 'Inactive')
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    buttons: [{
                        hint: 'Edit',
                        icon: 'fas fa-edit',
                        onClick: (e) => {
                            const categoryId = e.row.data.id;
                            $('#addCategoryModal').modal('show');
                            this.loadCategoryForEdit(categoryId);
                        }
                    }, {
                        hint: 'Delete',
                        icon: 'fas fa-trash',
                        onClick: (e) => {
                            this.deleteCategory(e.row.data);
                        }
                    }]
                }
            ],
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20, 50],
                showInfo: true,
                showNavigationButtons: true
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Transaction_Categories');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.transactionCategories = await zentra.getTransactionCategories();
            this.grid.option('dataSource', this.transactionCategories);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading categories:', error);
            DevExpress.ui.notify('Failed to load categories', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalCategories = this.transactionCategories.length;
        const incomeCategories = this.transactionCategories.filter(cat => cat.type === 'income').length;
        const expenseCategories = this.transactionCategories.filter(cat => cat.type === 'expense').length;
        
        const lastUpdate = this.transactionCategories.length > 0 ? 
            new Date(Math.max(...this.transactionCategories.map(cat => new Date(cat.updated_at)))).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        $('#totalCategories').text(totalCategories);
        $('#incomeCategories').text(incomeCategories);
        $('#expenseCategories').text(expenseCategories);
        $('#lastUpdate').text(lastUpdate);
    }

    editCategory(category) {
        this.currentCategory = category;
        $('#addCategoryModalLabel').text('Edit Transaction Category');
        
        // Fill form fields
        $('#input-code').val(category.code);
        $('#input-name').val(category.name);
        $('#input-type').val(category.type);
        $('#input-description').val(category.description);
        $('#input-active').prop('checked', category.is_active);
        
        $('#addCategoryModal').modal('show');
    }

    async deleteCategory(category) {
        try {
            const result = await DevExpress.ui.dialog.confirm(
                `Are you sure you want to delete the category "${category.name}"?`,
                'Confirm Delete'
            );

            if (result) {
                await zentra.deleteTransactionCategory(category.id);
                DevExpress.ui.notify('Category deleted successfully', 'success', 3000);
                await this.loadData();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            DevExpress.ui.notify('Failed to delete category', 'error', 3000);
        }
    }

    resetForm() {
        $('#addCategoryModalLabel').text('New Transaction Category');
        $('#addCategoryForm')[0].reset();
        $('#input-active').prop('checked', true);
    }

    async saveCategory() {
        try {
            const formData = {
                code: $('#input-code').val(),
                name: $('#input-name').val(),
                type: $('#input-type').val(),
                description: $('#input-description').val(),
                is_active: $('#input-active').is(':checked')
            };

            if (this.currentCategory) {
                // Update existing category
                await zentra.updateTransactionCategory(this.currentCategory.id, formData);
                DevExpress.ui.notify('Category updated successfully', 'success', 3000);
            } else {
                // Create new category
                await zentra.createTransactionCategory(formData);
                DevExpress.ui.notify('Category created successfully', 'success', 3000);
            }

            // Refresh data
            await this.loadData();
            
            // Close modal
            $('#addCategoryModal').modal('hide');
        } catch (error) {
            console.error('Error saving category:', error);
            DevExpress.ui.notify('Failed to save category', 'error', 3000);
        }
    }

    async loadCategoryForEdit(categoryId) {
        try {
            const category = await zentra.getTransactionCategory(categoryId);
            this.currentCategory = category;
            
            // Update modal title
            $('#addCategoryModalLabel').text('Edit Transaction Category');
            
            // Fill form fields
            $('#input-code').val(category.code);
            $('#input-name').val(category.name);
            $('#input-type').val(category.type);
            $('#input-description').val(category.description);
            $('#input-active').prop('checked', category.is_active);
        } catch (error) {
            console.error('Error loading category for edit:', error);
            DevExpress.ui.notify('Failed to load category details', 'error', 3000);
        }
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.transactionCategoryPageInstance) {
    window.transactionCategoryPageInstance = new window.TransactionCategoryPage();
} 