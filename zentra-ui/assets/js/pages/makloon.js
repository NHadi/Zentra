import { gridUtils } from '../utils/gridUtils.js';

// Define MakloonPage
window.MakloonPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.makloons = [];
        this.currentMakloon = null;
        this.isLoading = false;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            // Ensure DOM is ready before initialization
            $(document).ready(() => {
                this.initialize();
            });
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Grid Styles */
            .dx-datagrid {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
            }

            .dx-datagrid-headers {
                background: #f8f9fe;
                border-bottom: 1px solid #e9ecef;
            }

            .dx-datagrid-rowsview .dx-row-alt > td {
                background-color: #f8f9fe;
            }

            /* Master Detail Container */
            .master-detail-container {
                background: #f8f9fe;
                border-radius: 0.375rem;
            }

            /* Detail Header */
            .detail-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 2rem;
                border-radius: 0.375rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 0 2rem 0 rgba(94, 114, 228, 0.15);
            }

            .avatar {
                width: 4rem;
                height: 4rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Cards */
            .card.shadow-sm {
                box-shadow: 0 0 1rem 0 rgba(136, 152, 170, 0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .card.shadow-sm:hover {
                transform: translateY(-2px);
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
            }

            .card-header {
                border-bottom: 1px solid #e9ecef;
            }

            .card-header h5 {
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.025em;
                margin-bottom: 0;
            }

            /* Production Stages */
            .production-stages {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
            }

            .stage-card {
                display: flex;
                align-items: flex-start;
                padding: 1.5rem;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 0 1rem rgba(136, 152, 170, 0.1);
                border: 1px solid #e9ecef;
                transition: transform 0.2s ease;
            }

            .stage-card:hover {
                transform: translateY(-2px);
            }

            .stage-icon {
                width: 3rem;
                height: 3rem;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
            }

            .stage-icon i {
                color: white;
                font-size: 1.25rem;
            }

            .stage-info {
                flex: 1;
            }

            .stage-info h4 {
                margin: 0 0 1rem;
                font-size: 1rem;
                font-weight: 600;
                color: #32325d;
            }

            .stage-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
            }

            .stat {
                text-align: center;
                padding: 0.5rem;
                background: #f8f9fe;
                border-radius: 0.375rem;
                transition: transform 0.2s ease;
            }

            .stat:hover {
                transform: translateY(-2px);
            }

            .stat-label {
                display: block;
                font-size: 0.75rem;
                color: #8898aa;
                margin-bottom: 0.25rem;
            }

            .stat-value {
                font-size: 1rem;
                font-weight: 600;
                color: #525f7f;
            }

            /* Progress Bars */
            .progress {
                height: 0.5rem;
                width: 120px;
                background-color: #f6f9fc;
                border-radius: 0.25rem;
                margin: 0.5rem 0;
            }

            .progress-bar {
                border-radius: 0.25rem;
                transition: width 0.3s ease;
            }

            /* Table Styles */
            .table thead th {
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.025em;
                padding: 0.75rem 1.5rem;
                background-color: #f6f9fc;
                border-bottom: 1px solid #e9ecef;
            }

            .table td {
                font-size: 0.875rem;
                padding: 1rem 1.5rem;
                color: #525f7f;
                vertical-align: middle;
            }

            .table tbody tr:hover {
                background-color: #f6f9fc;
            }

            /* Status Badges */
            .badge-dot {
                font-size: 0.875rem;
                font-weight: 500;
            }

            .badge-dot i {
                display: inline-block;
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                margin-right: 0.5rem;
            }

            /* Capacity Stats */
            .capacity-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .capacity-stat {
                padding: 1rem;
                background: #f8f9fe;
                border-radius: 0.375rem;
                text-align: center;
                transition: transform 0.2s ease;
            }

            .capacity-stat:hover {
                transform: translateY(-2px);
            }

            .capacity-stat h4 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0;
                color: #32325d;
            }

            .capacity-stat small {
                font-size: 0.75rem;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }

            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .fade-in {
                animation: fadeIn 0.3s ease-out forwards;
            }

            /* Makloon Code Badge */
            .makloon-code {
                display: inline-flex;
                align-items: center;
                padding: 0.35rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #5e72e4;
                background: rgba(94, 114, 228, 0.1);
                font-family: "Monaco", "Courier New", monospace;
            }

            .makloon-code i {
                margin-right: 0.375rem;
                color: #5e72e4;
            }

            /* Contact Info */
            .contact-info {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #525f7f;
                padding: 0.25rem 0;
            }

            .contact-info i {
                margin-right: 0.5rem;
                color: #5e72e4;
                font-size: 1rem;
            }

            /* Status Badge */
            .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.35rem 0.75rem;
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

            /* Specialization Badge */
            .specialization-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.35rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .specialization-badge i {
                margin-right: 0.375rem;
            }

            /* Capacity Indicator */
            .capacity-info {
                padding: 0.5rem;
                border-radius: 0.375rem;
                background: #f8f9fe;
            }

            .capacity-indicator {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .capacity-bar {
                flex: 1;
                height: 0.5rem;
                background: #e9ecef;
                border-radius: 0.25rem;
                overflow: hidden;
            }

            .capacity-bar-fill {
                height: 100%;
                border-radius: 0.25rem;
                transition: width 0.3s ease;
            }

            .capacity-bar-fill.bg-success {
                background: linear-gradient(to right, #2dce89, #2dceaa);
            }

            .capacity-bar-fill.bg-warning {
                background: linear-gradient(to right, #fb6340, #fbb140);
            }

            .capacity-bar-fill.bg-danger {
                background: linear-gradient(to right, #f5365c, #f56036);
            }

            .capacity-text {
                font-size: 0.75rem;
                font-weight: 600;
                min-width: 3rem;
                text-align: right;
            }

            .info-item {
                position: relative;
                padding-left: 2rem;
            }

            .info-item i {
                position: absolute;
                left: 0;
                top: 1.25rem;
            }

            /* Timeline Styles */
            .makloon-timeline {
                position: relative;
                padding: 2rem;
            }

            .timeline-item {
                position: relative;
                padding-left: 3rem;
                margin-bottom: 2rem;
            }

            .timeline-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: -2rem;
                width: 2px;
                background: #e9ecef;
            }

            .timeline-badge {
                position: absolute;
                left: -0.5rem;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                background: #5e72e4;
                border: 2px solid white;
                box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.2);
            }

            .timeline-content {
                background: white;
                border-radius: 0.375rem;
                padding: 1.5rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.1);
                border: 1px solid #e9ecef;
            }

            /* Card Styles */
            .card {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.2);
            }

            .card-header {
                border-bottom: 1px solid #e9ecef;
            }

            .card-header h5 {
                margin: 0;
                font-size: 0.875rem;
                font-weight: 600;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.025em;
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
        $('#makloonDetailsModal').off('show.bs.modal');
        $('#makloonDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#makloonDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const makloonId = button.data('makloon-id');
            if (makloonId) {
                this.loadMakloonDetails(makloonId);
            }
        });

        $('#makloonDetailsModal').on('hide.bs.modal', () => {
            this.currentMakloon = null;
            this.clearMakloonDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', async (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            await this.switchTab(tab);
        });

        // Refresh button event
        $('#refreshMakloonData').on('click', async () => {
            await this.loadData();
        });
    }

    async initialize() {
        console.log('Initializing Makloon page...');
        try {
            // Show loader first
            this.showLoader();

            // Initialize grid
            await this.initializeGrid();
            
            // Load data
            await this.loadData();
            
            // Update statistics
            this.updateStatistics();
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
            DevExpress.ui.notify('Failed to initialize page', 'error', 3000);
        } finally {
            // Ensure grid is visible
            this.hideLoader();
        }
    }

    async initializeGrid() {
        const gridElement = $('#makloonGrid');
        if (!gridElement.length) {
            console.error('Makloon grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#makloonGrid').dxDataGrid({
            dataSource: this.makloons,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: true,
            wordWrapEnabled: true,
            rowAlternationEnabled: true,
            hoverStateEnabled: true,
            columns: [
                {
                    dataField: 'name',
                    caption: 'Makloon Info',
                    cellTemplate: (container, options) => {
                        const makloon = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center mb-1')
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold text-primary mr-2')
                                            .text(makloon.name)
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('makloon-code')
                                            .append($('<i>').addClass('ni ni-tag'))
                                            .append(makloon.code)
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('specialization-badge')
                                    .append($('<i>').addClass('ni ni-settings'))
                                    .append(makloon.specialization)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'contact',
                    caption: 'Contact',
                    cellTemplate: (container, options) => {
                        const makloon = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('contact-info mb-1')
                                    .append($('<i>').addClass('ni ni-single-02'))
                                    .append(makloon.contact_person)
                            )
                            .append(
                                $('<div>')
                                    .addClass('contact-info mb-1')
                                    .append($('<i>').addClass('ni ni-email-83'))
                                    .append(makloon.email)
                            )
                            .append(
                                $('<div>')
                                    .addClass('contact-info')
                                    .append($('<i>').addClass('ni ni-mobile-button'))
                                    .append(makloon.phone)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'capacity',
                    caption: 'Production Capacity',
                    cellTemplate: (container, options) => {
                        const makloon = options.data;
                        const usedPercentage = (makloon.current_load / makloon.monthly_capacity) * 100;
                        const status = usedPercentage >= 90 ? 'danger' : usedPercentage >= 75 ? 'warning' : 'success';
                        
                        $('<div>')
                            .addClass('capacity-info')
                            .append(
                                $('<div>')
                                    .addClass('d-flex justify-content-between mb-1')
                                    .append(
                                        $('<small>')
                                            .addClass('font-weight-bold text-muted')
                                            .text('Monthly Capacity:')
                                    )
                                    .append(
                                        $('<small>')
                                            .addClass('font-weight-bold')
                                            .text(makloon.monthly_capacity.toLocaleString())
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('capacity-indicator')
                                    .append(
                                        $('<div>')
                                            .addClass('capacity-bar')
                                            .append(
                                                $('<div>')
                                                    .addClass(`capacity-bar-fill bg-${status}`)
                                                    .css('width', `${usedPercentage}%`)
                                            )
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass(`capacity-text text-${status}`)
                                            .text(`${Math.round(usedPercentage)}%`)
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'is_active',
                    caption: 'Status',
                    width: 120,
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
                            this.showMakloonDetails(e.row.data);
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
                    this.renderMakloonDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Makloon_List');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        console.log('Loading data...');
        try {
            // Static data for prototype
            this.makloons = [
                {
                    id: 1,
                    code: 'MKL-001',
                    name: 'Jersey Pro Manufacturing',
                    contact_person: 'John Smith',
                    phone: '+62-812-3456-7890',
                    email: 'contact@jerseypro.com',
                    address: 'Jl. Industri Raya No. 123, Bandung',
                    specialization: 'Football Jersey',
                    is_active: true,
                    daily_capacity: 500,
                    monthly_capacity: 10000,
                    current_load: 6000,
                    production_capabilities: [
                        'Screen Printing',
                        'Sublimation Printing',
                        'Embroidery',
                        'Custom Cutting',
                        'Heat Transfer'
                    ],
                    created_at: '2024-01-01T00:00:00Z',
                    created_by: 'admin',
                    updated_at: '2024-03-15T00:00:00Z',
                    updated_by: 'admin'
                },
                {
                    id: 2,
                    code: 'MKL-002',
                    name: 'Sportswear Solutions',
                    contact_person: 'Sarah Johnson',
                    phone: '+62-813-9876-5432',
                    email: 'info@sportswear.co.id',
                    address: 'Jl. Tekstil No. 45, Bandung',
                    specialization: 'Basketball Jersey',
                    is_active: true,
                    daily_capacity: 300,
                    monthly_capacity: 6000,
                    current_load: 2000,
                    production_capabilities: [
                        'Sublimation Printing',
                        'Custom Cutting',
                        'Heat Transfer',
                        'Laser Cutting'
                    ],
                    created_at: '2024-02-01T00:00:00Z',
                    created_by: 'admin',
                    updated_at: '2024-03-10T00:00:00Z',
                    updated_by: 'admin'
                },
                {
                    id: 3,
                    code: 'MKL-003',
                    name: 'Elite Jersey Makers',
                    contact_person: 'David Lee',
                    phone: '+62-815-1234-5678',
                    email: 'production@elitejersey.com',
                    address: 'Jl. Manufaktur No. 78, Bandung',
                    specialization: 'Cycling Jersey',
                    is_active: false,
                    daily_capacity: 200,
                    monthly_capacity: 4000,
                    current_load: 3500,
                    production_capabilities: [
                        'Sublimation Printing',
                        'Custom Cutting',
                        'Flatlock Stitching',
                        'Reflective Printing'
                    ],
                    created_at: '2024-01-15T00:00:00Z',
                    created_by: 'admin',
                    updated_at: '2024-03-01T00:00:00Z',
                    updated_by: 'admin'
                }
            ];

            // Update grid data source
            if (this.grid) {
                await this.grid.option('dataSource', this.makloons);
                console.log('Data loaded successfully');
            } else {
                console.error('Grid not initialized');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    updateStatistics() {
        const totalMakloon = this.makloons.length;
        const activeMakloon = this.makloons.filter(m => m.is_active).length;
        const totalCapacity = this.makloons.reduce((sum, m) => sum + m.monthly_capacity, 0);
        const totalCurrentLoad = this.makloons.reduce((sum, m) => sum + m.current_load, 0);
        const availableCapacity = totalCapacity - totalCurrentLoad;

        $('#totalMakloon').text(totalMakloon);
        $('#activeMakloon').text(activeMakloon);
        $('#totalCapacity').text(totalCapacity.toLocaleString());
        $('#availableCapacity').text(availableCapacity.toLocaleString());
    }

    async showMakloonDetails(makloon) {
        this.currentMakloon = makloon;
        $('#makloonDetailsModal').modal('show');
        
        // Show loader
        this.showModalLoader();
        
        // Reset tabs to first tab
        this.switchTab('makloonInfo');
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update content
        this.updateMakloonDetails(makloon);
        
        // Hide loader
        this.hideModalLoader();
    }

    updateMakloonDetails(makloon) {
        // Basic Info
        $('#makloonName').text(makloon.name);
        $('#makloonCode').html(`<i class="ni ni-tag"></i>${makloon.code}`);
        $('#makloonContactPerson').html(`<i class="ni ni-single-02"></i>${makloon.contact_person}`);
        $('#makloonEmail').html(`<i class="ni ni-email-83"></i>${makloon.email}`);
        $('#makloonPhone').html(`<i class="ni ni-mobile-button"></i>${makloon.phone}`);
        $('#makloonAddress').html(`<i class="ni ni-pin-3"></i>${makloon.address}`);
        $('#makloonSpecialization').html(`<i class="ni ni-settings"></i>${makloon.specialization}`);
        
        // Status
        const statusClass = makloon.is_active ? 'active' : 'inactive';
        const statusIcon = makloon.is_active ? 'ni-check-bold' : 'ni-fat-remove';
        $('#makloonStatus').html(`
            <div class="status-badge ${statusClass}">
                <i class="ni ${statusIcon}"></i>
                ${makloon.is_active ? 'Active' : 'Inactive'}
            </div>
        `);

        // Capacity Info
        $('#dailyCapacity').text(makloon.daily_capacity.toLocaleString());
        $('#monthlyCapacity').text(makloon.monthly_capacity.toLocaleString());
        $('#currentLoad').text(makloon.current_load.toLocaleString());
        $('#availableCapacityDetail').text((makloon.monthly_capacity - makloon.current_load).toLocaleString());

        // Production Capabilities
        const $capabilities = $('#productionCapabilities');
        $capabilities.empty();
        makloon.production_capabilities.forEach(capability => {
            $capabilities.append(`
                <div class="specialization-badge mb-2">
                    <i class="ni ni-settings"></i>${capability}
                </div>
            `);
        });
        
        // Timeline
        this.updateTimeline(makloon);
    }

    updateTimeline(makloon) {
        const $timeline = $('.makloon-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Makloon Partner Created',
            `Created by ${makloon.created_by}`,
            makloon.created_at
        ));

        // Updated if different from created
        if (makloon.updated_at !== makloon.created_at) {
            $timeline.append(this.createTimelineItem(
                'Information Updated',
                `Last updated by ${makloon.updated_by}`,
                makloon.updated_at
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

    clearMakloonDetails() {
        $('#makloonName, #makloonCode, #makloonContactPerson, #makloonEmail, #makloonPhone, #makloonAddress, #makloonSpecialization, #makloonStatus').text('');
        $('#dailyCapacity, #monthlyCapacity, #currentLoad, #availableCapacityDetail').text('');
        $('#productionCapabilities').empty();
        $('.makloon-timeline').empty();
    }

    async switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        if (this.currentMakloon) {
            // Show loader for tab content
            this.showModalLoader();
            
            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Load tab content
            switch(tab) {
                case 'capacityInfo':
                    $('#dailyCapacity').text(this.currentMakloon.daily_capacity.toLocaleString());
                    $('#monthlyCapacity').text(this.currentMakloon.monthly_capacity.toLocaleString());
                    $('#currentLoad').text(this.currentMakloon.current_load.toLocaleString());
                    $('#availableCapacityDetail').text(
                        (this.currentMakloon.monthly_capacity - this.currentMakloon.current_load).toLocaleString()
                    );
                    break;
                case 'productionInfo':
                    const $capabilities = $('#productionCapabilities');
                    $capabilities.empty();
                    this.currentMakloon.production_capabilities.forEach(capability => {
                        $capabilities.append(`
                            <div class="specialization-badge mb-2">
                                <i class="ni ni-settings"></i>${capability}
                            </div>
                        `);
                    });
                    break;
                case 'timeline':
                    this.updateTimeline(this.currentMakloon);
                    break;
            }
            
            // Hide loader
            this.hideModalLoader();
        }
    }

    renderMakloonDetails(container, makloon) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Header Section with Gradient Background
        const $header = $('<div>')
            .addClass('detail-header')
            .append(
                $('<div>')
                    .addClass('row align-items-center')
                    .append(
                        $('<div>')
                            .addClass('col-auto')
                            .append(
                                $('<div>')
                                    .addClass('avatar avatar-xl rounded-circle bg-white shadow')
                                    .append($('<i>').addClass('ni ni-building text-primary fa-2x'))
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('col ml-n2')
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center mb-2')
                                    .append(
                                        $('<h3>')
                                            .addClass('mb-0 text-white mr-3')
                                            .text(makloon.name)
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('makloon-code')
                                            .append($('<i>').addClass('ni ni-tag'))
                                            .append(makloon.code)
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center')
                                    .append(
                                        $('<span>')
                                            .addClass('specialization-badge mr-3')
                                            .append($('<i>').addClass('ni ni-settings'))
                                            .append(makloon.specialization)
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass(`status-badge ${makloon.is_active ? 'active' : 'inactive'}`)
                                            .append($('<i>').addClass(`ni ${makloon.is_active ? 'ni-check-bold' : 'ni-fat-remove'}`))
                                            .append(makloon.is_active ? 'Active' : 'Inactive')
                                    )
                            )
                    )
            );

        // Main Content
        const $content = $('<div>').addClass('row mt-4');

        // Contact Information Card
        const $contactCard = $('<div>')
            .addClass('col-lg-6')
            .append(
                $('<div>')
                    .addClass('card shadow-sm')
                    .append(
                        $('<div>')
                            .addClass('card-header bg-transparent')
                            .append(
                                $('<h5>')
                                    .addClass('mb-0')
                                    .append($('<i>').addClass('ni ni-single-02 mr-2 text-primary'))
                                    .append('Contact Information')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('card-body')
                            .append(this.createInfoItem('Contact Person', makloon.contact_person, 'ni ni-single-02'))
                            .append(this.createInfoItem('Email', makloon.email, 'ni ni-email-83'))
                            .append(this.createInfoItem('Phone', makloon.phone, 'ni ni-mobile-button'))
                            .append(this.createInfoItem('Address', makloon.address, 'ni ni-pin-3'))
                    )
            );

        // Production Capacity Card
        const $capacityCard = $('<div>')
            .addClass('col-lg-6')
            .append(
                $('<div>')
                    .addClass('card shadow-sm')
                    .append(
                        $('<div>')
                            .addClass('card-header bg-transparent')
                            .append(
                                $('<h5>')
                                    .addClass('mb-0')
                                    .append($('<i>').addClass('ni ni-chart-bar-32 mr-2 text-primary'))
                                    .append('Production Capacity')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('card-body')
                            .append(
                                $('<div>')
                                    .addClass('capacity-stats mb-4')
                                    .append(this.createCapacityStat('Daily Capacity', makloon.daily_capacity))
                                    .append(this.createCapacityStat('Monthly Capacity', makloon.monthly_capacity))
                                    .append(this.createCapacityStat('Current Load', makloon.current_load))
                            )
                            .append(
                                $('<div>')
                                    .addClass('capacity-progress')
                                    .append(
                                        $('<h6>')
                                            .addClass('mb-2')
                                            .text('Capacity Utilization')
                                    )
                                    .append(this.createCapacityBar(makloon))
                            )
                    )
            );

        // Production Tracking Card
        const $trackingCard = $('<div>')
            .addClass('col-12 mt-4')
            .append(
                $('<div>')
                    .addClass('card shadow-sm')
                    .append(
                        $('<div>')
                            .addClass('card-header bg-transparent')
                            .append(
                                $('<div>')
                                    .addClass('row align-items-center')
                                    .append(
                                        $('<div>')
                                            .addClass('col')
                                            .append(
                                                $('<h5>')
                                                    .addClass('mb-0')
                                                    .append($('<i>').addClass('ni ni-app mr-2 text-primary'))
                                                    .append('Production Tracking')
                                            )
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('col-auto')
                                            .append(
                                                $('<button>')
                                                    .addClass('btn btn-sm btn-primary')
                                                    .append($('<i>').addClass('fas fa-sync-alt mr-1'))
                                                    .append('Refresh')
                                            )
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('card-body p-0')
                            .append(
                                $('<div>')
                                    .addClass('production-stages p-4')
                                    .append(this.createStageCard('Cutting', 'primary', 'fa-cut', { inQueue: 3, inProgress: 2, completed: 45 }))
                                    .append(this.createStageCard('Printing', 'info', 'fa-print', { inQueue: 5, inProgress: 1, completed: 42 }))
                                    .append(this.createStageCard('Sewing', 'success', 'fa-pencil-ruler', { inQueue: 4, inProgress: 3, completed: 40 }))
                                    .append(this.createStageCard('Quality Control', 'warning', 'fa-clipboard-check', { inQueue: 2, inProgress: 1, completed: 38 }))
                            )
                    )
            );

        // Current Orders Card
        const $ordersCard = $('<div>')
            .addClass('col-12 mt-4')
            .append(
                $('<div>')
                    .addClass('card shadow-sm')
                    .append(
                        $('<div>')
                            .addClass('card-header bg-transparent')
                            .append(
                                $('<h5>')
                                    .addClass('mb-0')
                                    .append($('<i>').addClass('ni ni-cart mr-2 text-primary'))
                                    .append('Current Orders')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('table-responsive')
                            .append(
                                $('<table>')
                                    .addClass('table align-items-center mb-0')
                                    .append(
                                        $('<thead>')
                                            .addClass('thead-light')
                                            .append(
                                                $('<tr>')
                                                    .append($('<th>').text('Order ID'))
                                                    .append($('<th>').text('Product'))
                                                    .append($('<th>').text('Quantity'))
                                                    .append($('<th>').text('Status'))
                                                    .append($('<th>').text('Progress'))
                                                    .append($('<th>').text('Stage'))
                                            )
                                    )
                                    .append(
                                        $('<tbody>')
                                            .append(this.createOrderRow('ORD-001', 'Football Jersey - Home Kit', 100, 'In Production', 60, 'Cutting'))
                                            .append(this.createOrderRow('ORD-002', 'Basketball Jersey - Away Kit', 50, 'In Production', 30, 'Printing'))
                                            .append(this.createOrderRow('ORD-003', 'Cycling Jersey - Pro', 75, 'In Production', 85, 'Quality Control'))
                                    )
                            )
                    )
            );

        $content.append($contactCard).append($capacityCard).append($trackingCard).append($ordersCard);
        $detailContent.append($header).append($content);
        container.append($detailContent);
    }

    createInfoItem(label, value, icon) {
        return $('<div>')
            .addClass('info-item mb-3')
            .append(
                $('<small>')
                    .addClass('text-muted d-block mb-1')
                    .text(label)
            )
            .append(
                $('<div>')
                    .addClass('d-flex align-items-center')
                    .append($('<i>').addClass(`${icon} mr-2 text-primary`))
                    .append($('<span>').text(value))
            );
    }

    createCapacityStat(label, value) {
        return $('<div>')
            .addClass('capacity-stat mb-3')
            .append(
                $('<small>')
                    .addClass('text-muted d-block mb-1')
                    .text(label)
            )
            .append(
                $('<h4>')
                    .addClass('mb-0')
                    .text(value.toLocaleString())
            );
    }

    createCapacityBar(makloon) {
        const usedPercentage = (makloon.current_load / makloon.monthly_capacity) * 100;
        const status = usedPercentage >= 90 ? 'danger' : usedPercentage >= 75 ? 'warning' : 'success';

        return $('<div>')
            .addClass('capacity-indicator')
            .append(
                $('<div>')
                    .addClass('capacity-bar')
                    .append(
                        $('<div>')
                            .addClass(`capacity-bar-fill bg-${status}`)
                            .css('width', `${usedPercentage}%`)
                    )
            )
            .append(
                $('<div>')
                    .addClass(`capacity-text text-${status}`)
                    .text(`${Math.round(usedPercentage)}%`)
            );
    }

    createStageCard(title, colorClass, icon, stats) {
        return $('<div>')
            .addClass('stage-card')
            .append(
                $('<div>')
                    .addClass(`stage-icon bg-${colorClass}`)
                    .append($('<i>').addClass(`fas ${icon}`))
            )
            .append(
                $('<div>')
                    .addClass('stage-info')
                    .append($('<h4>').text(title))
                    .append(
                        $('<div>')
                            .addClass('stage-stats')
                            .append(this.createStat('In Queue', stats.inQueue))
                            .append(this.createStat('In Progress', stats.inProgress))
                            .append(this.createStat('Completed', stats.completed))
                    )
            );
    }

    createStat(label, value) {
        return $('<div>')
            .addClass('stat')
            .append($('<span>').addClass('stat-label').text(label))
            .append($('<span>').addClass('stat-value').text(value));
    }

    createOrderRow(orderId, product, quantity, status, progress, stage) {
        const statusColor = status === 'Completed' ? 'success' : 
                          status === 'In Production' ? 'warning' : 
                          'info';
        
        return $('<tr>')
            .append($('<td>').text(orderId))
            .append($('<td>').text(product))
            .append($('<td>').text(`${quantity} pcs`))
            .append(
                $('<td>')
                    .append(
                        $('<span>')
                            .addClass('badge badge-dot mr-4')
                            .append($('<i>').addClass(`bg-${statusColor}`))
                            .append($('<span>').text(status))
                    )
            )
            .append(
                $('<td>')
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append($('<span>').addClass('mr-2').text(`${progress}%`))
                            .append(
                                $('<div>')
                                    .addClass('progress')
                                    .append(
                                        $('<div>')
                                            .addClass(`progress-bar bg-${statusColor}`)
                                            .attr('role', 'progressbar')
                                            .css('width', `${progress}%`)
                                    )
                            )
                    )
            )
            .append($('<td>').text(stage));
    }

    showLoader() {
        console.log('Showing loader...');
        this.isLoading = true;
        $('#makloonGridLoader').show();
        $('#makloonGrid').css('visibility', 'hidden');
    }

    hideLoader() {
        console.log('Hiding loader...');
        this.isLoading = false;
        $('#makloonGridLoader').hide();
        $('#makloonGrid')
            .css('visibility', 'visible')
            .addClass('fade-in');
    }

    showModalLoader() {
        $('#makloonDetailsLoader').show();
        $('#makloonDetailsContent').hide();
    }

    hideModalLoader() {
        $('#makloonDetailsLoader').hide();
        $('#makloonDetailsContent').show().addClass('fade-in');
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.makloonPageInstance) {
    window.makloonPageInstance = new window.MakloonPage();
}