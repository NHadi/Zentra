import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define BackupPage
window.BackupPage = class {
    constructor() {
        this.grid = null;
        this.selectedBackup = null;
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
        $('#restoreModal').off('shown.bs.modal hidden.bs.modal');
        $('#confirmRestore').off('click');
    }

    bindEvents() {
        // Restore modal events
        $('#restoreModal').on('shown.bs.modal', () => {
            if (this.selectedBackup) {
                $('#restoreFileName').text(this.selectedBackup.file_name);
                $('#restoreCreatedAt').text(new Date(this.selectedBackup.created_at).toLocaleString());
                $('#restoreCreatedBy').text(this.selectedBackup.created_by);
            }
        });

        $('#restoreModal').on('hidden.bs.modal', () => {
            this.selectedBackup = null;
        });

        $('#confirmRestore').on('click', () => {
            this.restoreBackup();
        });
    }

    initialize() {
        const gridElement = $('#backupGrid');
        if (!gridElement.length) {
            console.error('Backup grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#backupGrid').dxDataGrid({
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
                    dataField: 'file_name',
                    caption: 'Backup File',
                    cellTemplate: (container, options) => {
                        const $badge = $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<span>')
                                    .addClass('badge badge-primary badge-circle mr-2')
                                    .append($('<i>').addClass('ni ni-archive-2'))
                            )
                            .append(
                                $('<span>')
                                    .addClass('text-primary font-weight-bold')
                                    .text(options.value)
                            );
                        container.append($badge);
                    }
                },
                {
                    dataField: 'size',
                    caption: 'Size',
                    dataType: 'number',
                    format: '#,##0.## MB',
                    calculateCellValue: (data) => data.size / (1024 * 1024)
                },
                {
                    dataField: 'created_at',
                    caption: 'Created At',
                    dataType: 'date',
                    format: 'MMM dd, yyyy HH:mm'
                },
                {
                    dataField: 'created_by',
                    caption: 'Created By'
                },
                {
                    type: 'buttons',
                    width: 120,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Restore Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-primary mr-2')
                            .attr('title', 'Restore')
                            .append($('<i>').addClass('ni ni-single-copy-04'))
                            .on('click', () => {
                                this.selectedBackup = options.data;
                                $('#restoreModal').modal('show');
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete')
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
                            text: 'Create Backup',
                            onClick: () => this.createBackup(),
                            template: (data, container) => {
                                $('<i>')
                                    .addClass('ni ni-single-copy-04 mr-2')
                                    .appendTo(container);
                                $('<span>')
                                    .text('Create Backup')
                                    .appendTo(container);
                            }
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Backup_List');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => {
                this.loadData();
            },
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            const data = await zentra.getBackups();
            this.grid.option('dataSource', data);
        } catch (error) {
            gridUtils.handleGridError(error, 'loading backups');
        }
    }

    async createBackup() {
        try {
            // Show loading state
            const $grid = $('#backupGrid');
            $grid.addClass('loading');

            // Create backup
            const backup = await zentra.createBackup();
            
            // Refresh grid data
            await this.loadData();
            
            gridUtils.showSuccess('Backup created successfully');
        } catch (error) {
            gridUtils.handleGridError(error, 'creating backup');
        } finally {
            $('#backupGrid').removeClass('loading');
        }
    }

    async restoreBackup() {
        if (!this.selectedBackup) return;

        try {
            // Show loading state
            const $modal = $('#restoreModal');
            const $confirmBtn = $('#confirmRestore');
            $confirmBtn.prop('disabled', true).html('<i class="ni ni-refresh-02 mr-1"></i> Restoring...');

            // Restore backup
            await zentra.restoreBackup(this.selectedBackup.id);
            
            // Close modal and show success message
            $modal.modal('hide');
            gridUtils.showSuccess('Backup restored successfully');
            
            // Refresh grid data
            await this.loadData();
        } catch (error) {
            gridUtils.handleGridError(error, 'restoring backup');
        } finally {
            $('#confirmRestore').prop('disabled', false).html('<i class="ni ni-refresh-02 mr-1"></i> Restore Backup');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteBackup(e.key.id);
            gridUtils.showSuccess('Backup deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting backup');
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.backupPageInstance) {
    window.backupPageInstance = new window.BackupPage();
}