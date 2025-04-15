import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define SupplierPage
window.SupplierPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.suppliers = [];
        this.currentSupplier = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Supplier Code Badge */
            .supplier-code {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #5e72e4;
                background: rgba(94, 114, 228, 0.1);
                font-family: "Monaco", "Courier New", monospace;
            }

            .supplier-code i {
                margin-right: 0.375rem;
                color: #5e72e4;
            }

            /* Contact Info */
            .contact-info {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #525f7f;
            }

            .contact-info i {
                margin-right: 0.5rem;
                color: #5e72e4;
            }

            /* Status Badge */
            .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .status-badge.active {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .status-badge.inactive {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .status-badge i {
                margin-right: 0.375rem;
            }

            /* Contact Person */
            .contact-person {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #525f7f;
            }

            .contact-person i {
                margin-right: 0.5rem;
                color: #5e72e4;
            }

            /* Bank Info */
            .bank-info {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #525f7f;
                padding: 0.5rem;
                background: #f6f9fc;
                border-radius: 0.375rem;
            }

            .bank-info i {
                margin-right: 0.5rem;
                color: #5e72e4;
            }

            /* Tax Number */
            .tax-number {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                color: #8898aa;
                background: rgba(136, 152, 170, 0.1);
            }

            .tax-number i {
                margin-right: 0.375rem;
            }

            /* Detail View Styles */
            .detail-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 2rem;
                border-radius: 0.375rem;
                margin-bottom: 1.5rem;
            }

            .detail-header .supplier-name {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }

            .detail-header .supplier-code {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .info-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
                margin-bottom: 1.5rem;
            }

            .info-card .card-header {
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid #e9ecef;
                background: white;
            }

            .info-card .card-header h5 {
                margin: 0;
                font-size: 0.875rem;
                font-weight: 600;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }

            .info-card .card-body {
                padding: 1.5rem;
            }

            .info-item {
                margin-bottom: 1rem;
            }

            .info-item:last-child {
                margin-bottom: 0;
            }

            .info-item .label {
                font-size: 0.75rem;
                font-weight: 600;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.025em;
                margin-bottom: 0.25rem;
            }

            .info-item .value {
                font-size: 0.875rem;
                color: #525f7f;
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
        $('#supplierDetailsModal').off('show.bs.modal');
        $('#supplierDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#supplierDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const supplierId = button.data('supplier-id');
            if (supplierId) {
                this.loadSupplierDetails(supplierId);
            }
        });

        $('#supplierDetailsModal').on('hide.bs.modal', () => {
            this.currentSupplier = null;
            this.clearSupplierDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Save button event
        $('#saveSupplierBtn').on('click', () => {
            this.saveSupplier();
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#supplierGrid');
        if (!gridElement.length) {
            console.error('Supplier grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#supplierGrid').dxDataGrid({
            dataSource: this.suppliers,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: true,
            wordWrapEnabled: true,
            columns: [
                {
                    dataField: 'name',
                    caption: 'Supplier Info',
                    cellTemplate: (container, options) => {
                        const supplier = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold mb-1')
                                    .text(supplier.name)
                            )
                            .append(
                                $('<div>')
                                    .addClass('supplier-code mb-1')
                                    .append($('<i>').addClass('ni ni-tag'))
                                    .append(supplier.code)
                            )
                            .append(
                                $('<div>')
                                    .addClass('contact-person')
                                    .append($('<i>').addClass('ni ni-single-02'))
                                    .append(supplier.contact_person)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'contact',
                    caption: 'Contact',
                    cellTemplate: (container, options) => {
                        const supplier = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('contact-info mb-1')
                                    .append($('<i>').addClass('ni ni-email-83'))
                                    .append(supplier.email)
                            )
                            .append(
                                $('<div>')
                                    .addClass('contact-info')
                                    .append($('<i>').addClass('ni ni-mobile-button'))
                                    .append(supplier.phone)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'bank_info',
                    caption: 'Bank Info',
                    cellTemplate: (container, options) => {
                        const supplier = options.data;
                        $('<div>')
                            .addClass('bank-info')
                            .append($('<i>').addClass('ni ni-credit-card'))
                            .append(`${supplier.bank_name} - ${supplier.bank_account_number}`)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'tax_number',
                    caption: 'Tax Info',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('tax-number')
                            .append($('<i>').addClass('ni ni-paper-diploma'))
                            .append(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'is_active',
                    caption: 'Status',
                    width: 100,
                    cellTemplate: (container, options) => {
                        const status = options.value ? 'active' : 'inactive';
                        const icon = options.value ? 'ni-check-bold' : 'ni-fat-remove';
                        $('<div>')
                            .addClass(`status-badge ${status}`)
                            .append($('<i>').addClass(`ni ${icon}`))
                            .append(status.charAt(0).toUpperCase() + status.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    buttons: [{
                        hint: 'View Details',
                        icon: 'fas fa-eye',
                        onClick: (e) => {
                            this.showSupplierDetails(e.row.data);
                        }
                    }, {
                        hint: 'Edit',
                        icon: 'fas fa-edit',
                        onClick: (e) => {
                            this.editSupplier(e.row.data);
                        }
                    }]
                }
            ],
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true,
                showNavigationButtons: true
            },
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    this.renderSupplierDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Supplier_List');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.suppliers = await zentra.getSuppliers();
            this.grid.option('dataSource', this.suppliers);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            DevExpress.ui.notify('Failed to load suppliers', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalSuppliers = this.suppliers.length;
        const activeSuppliers = this.suppliers.filter(s => s.is_active).length;
        const inactiveSuppliers = totalSuppliers - activeSuppliers;
        const lastAdded = this.suppliers.length > 0 ? 
            new Date(Math.max(...this.suppliers.map(s => new Date(s.created_at)))).toLocaleDateString() : 
            '-';

        $('.card-stats .h2').eq(0).text(totalSuppliers);
        $('.card-stats .h2').eq(1).text(activeSuppliers);
        $('.card-stats .h2').eq(2).text(inactiveSuppliers);
        $('.card-stats .h4').text(lastAdded);
    }

    showSupplierDetails(supplier) {
        this.currentSupplier = supplier;
        $('#supplierDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('supplierInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateSupplierDetails(supplier);
        }, 150);
    }

    updateSupplierDetails(supplier) {
        // Basic Info
        $('#supplierName').text(supplier.name);
        $('#supplierCode').html(`<i class="ni ni-tag"></i>${supplier.code}`);
        $('#supplierContactPerson').html(`<i class="ni ni-single-02"></i>${supplier.contact_person}`);
        $('#supplierEmail').html(`<i class="ni ni-email-83"></i>${supplier.email}`);
        $('#supplierPhone').html(`<i class="ni ni-mobile-button"></i>${supplier.phone}`);
        $('#supplierAddress').html(`<i class="ni ni-pin-3"></i>${supplier.address}`);
        $('#supplierTaxNumber').html(`<i class="ni ni-paper-diploma"></i>${supplier.tax_number}`);
        
        // Status
        const statusClass = supplier.is_active ? 'active' : 'inactive';
        const statusIcon = supplier.is_active ? 'ni-check-bold' : 'ni-fat-remove';
        $('#supplierStatus').html(`
            <div class="status-badge ${statusClass}">
                <i class="ni ${statusIcon}"></i>
                ${supplier.is_active ? 'Active' : 'Inactive'}
            </div>
        `);

        // Bank Info
        $('#supplierBankName').text(supplier.bank_name);
        $('#supplierBankAccountName').text(supplier.bank_account_name);
        $('#supplierBankAccountNumber').text(supplier.bank_account_number);
        
        // Timeline
        this.updateTimeline(supplier);
    }

    updateTimeline(supplier) {
        const $timeline = $('.supplier-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Supplier Created',
            `Created by ${supplier.created_by}`,
            supplier.created_at
        ));

        // Updated if different from created
        if (supplier.updated_at !== supplier.created_at) {
            $timeline.append(this.createTimelineItem(
                'Supplier Updated',
                `Last updated by ${supplier.updated_by}`,
                supplier.updated_at
            ));
        }
    }

    createTimelineItem(title, info, date) {
        return $('<div>')
            .addClass('timeline-item')
            .append($('<div>').addClass('timeline-badge'))
            .append(
                $('<div>')
                    .addClass('timeline-content')
                    .append($('<div>').addClass('timeline-title font-weight-bold').text(title))
                    .append($('<div>').addClass('timeline-info text-muted').text(info))
                    .append(
                        $('<small>')
                            .addClass('text-muted d-block mt-2')
                            .text(new Date(date).toLocaleString())
                    )
            );
    }

    clearSupplierDetails() {
        $('#supplierName, #supplierCode, #supplierContactPerson, #supplierEmail, #supplierPhone, #supplierAddress, #supplierTaxNumber, #supplierStatus, #supplierBankName, #supplierBankAccountName, #supplierBankAccountNumber').text('');
        $('.supplier-timeline').empty();
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        // Load tab content if needed
        switch(tab) {
            case 'bankInfo':
                if (this.currentSupplier) {
                    $('#supplierBankName').text(this.currentSupplier.bank_name);
                    $('#supplierBankAccountName').text(this.currentSupplier.bank_account_name);
                    $('#supplierBankAccountNumber').text(this.currentSupplier.bank_account_number);
                }
                break;
            case 'timeline':
                if (this.currentSupplier) {
                    this.updateTimeline(this.currentSupplier);
                }
                break;
        }
    }

    editSupplier(supplier) {
        this.currentSupplier = supplier;
        $('#addSupplierModalLabel').text('Edit Supplier');
        
        // Fill form fields
        $('#input-name').val(supplier.name);
        $('#input-code').val(supplier.code);
        $('#input-contact-person').val(supplier.contact_person);
        $('#input-email').val(supplier.email);
        $('#input-phone').val(supplier.phone);
        $('#input-address').val(supplier.address);
        $('#input-tax-number').val(supplier.tax_number);
        $('#input-bank-name').val(supplier.bank_name);
        $('#input-bank-account-name').val(supplier.bank_account_name);
        $('#input-bank-account-number').val(supplier.bank_account_number);
        $('#input-is-active').prop('checked', supplier.is_active);
        
        $('#addSupplierModal').modal('show');
    }

    renderSupplierDetails(container, supplier) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Header Section
        const $header = $('<div>')
            .addClass('detail-header')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('supplier-name')
                            .text(supplier.name)
                    )
                    .append(
                        $('<div>')
                            .addClass('supplier-code')
                            .append($('<i>').addClass('ni ni-tag'))
                            .append(supplier.code)
                    )
            )
            .appendTo($detailContent);

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row mt-4').appendTo($detailContent);
        
        // Left column - Contact Info
        const $leftCol = $('<div>').addClass('col-lg-6').appendTo($row);
        
        // Right column - Bank & Tax Info
        const $rightCol = $('<div>').addClass('col-lg-6').appendTo($row);

        // Contact Info Card
        const $contactInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Contact Information'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Contact Person'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-single-02 mr-2 text-primary'))
                                    .append(supplier.contact_person)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Email'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-email-83 mr-2 text-primary'))
                                    .append(supplier.email)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Phone'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-mobile-button mr-2 text-primary'))
                                    .append(supplier.phone)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Address'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-pin-3 mr-2 text-primary'))
                                    .append(supplier.address)
                            )
                    )
            )
            .appendTo($leftCol);

        // Bank & Tax Info Card
        const $bankInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Bank & Tax Information'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Bank Name'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-building mr-2 text-primary'))
                                    .append(supplier.bank_name)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Account Name'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-single-02 mr-2 text-primary'))
                                    .append(supplier.bank_account_name)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Account Number'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-credit-card mr-2 text-primary'))
                                    .append(supplier.bank_account_number)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Tax Number'))
                            .append(
                                $('<div>')
                                    .addClass('value d-flex align-items-center')
                                    .append($('<i>').addClass('ni ni-paper-diploma mr-2 text-primary'))
                                    .append(supplier.tax_number)
                            )
                    )
            )
            .appendTo($rightCol);

        // Status Badge
        const statusClass = supplier.is_active ? 'active' : 'inactive';
        const statusIcon = supplier.is_active ? 'ni-check-bold' : 'ni-fat-remove';
        $('<div>')
            .addClass('info-card mt-3')
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center justify-content-between')
                            .append($('<div>').addClass('label').text('Status'))
                            .append(
                                $('<div>')
                                    .addClass(`status-badge ${statusClass}`)
                                    .append($('<i>').addClass(`ni ${statusIcon}`))
                                    .append(supplier.is_active ? 'Active' : 'Inactive')
                            )
                    )
            )
            .appendTo($rightCol);

        container.append($detailContent);
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.supplierPageInstance) {
    window.supplierPageInstance = new window.SupplierPage();
} 