import { gridUtils } from '../utils/gridUtils.js';

// Define MLServicesPage
window.MLServicesPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.models = [];
        this.currentModel = null;
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
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        // Clean up event listeners
        $('#modelDetailsModal').off('show.bs.modal');
        $('#modelDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#modelDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const modelId = button.data('model-id');
            if (modelId) {
                this.loadModelDetails(modelId);
            }
        });

        $('#modelDetailsModal').on('hide.bs.modal', () => {
            this.currentModel = null;
            this.clearModelDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', async (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            await this.switchTab(tab);
        });

        // Retrain model button
        $('#retrain-model').on('click', () => {
            if (this.currentModel) {
                this.retrainModel(this.currentModel.id);
            }
        });
    }

    async initialize() {
        console.log('Initializing ML Services page...');
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
        const gridElement = $('#mlModelsGrid');
        if (!gridElement.length) {
            console.error('ML Models grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#mlModelsGrid').dxDataGrid({
            dataSource: this.models,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: true },
            columnChooser: { enabled: true },
            columnAutoWidth: true,
            wordWrapEnabled: true,
            rowAlternationEnabled: true,
            hoverStateEnabled: true,
            columns: [
                {
                    dataField: 'name',
                    caption: 'Model Info',
                    groupIndex: 0,
                    cellTemplate: (container, options) => {
                        const model = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center mb-1')
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold text-primary mr-2')
                                            .text(model.name)
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('model-type')
                                            .append($('<i>').addClass('ni ni-atom'))
                                            .append(model.type)
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('version-info')
                                    .append($('<i>').addClass('ni ni-tag'))
                                    .append(`v${model.version}`)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'industry',
                    caption: 'Industry',
                    groupIndex: 1
                },
                {
                    dataField: 'use_case',
                    caption: 'Use Case'
                },
                {
                    dataField: 'framework',
                    caption: 'Framework',
                    cellTemplate: (container, options) => {
                        const model = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('contact-info mb-1')
                                    .append($('<i>').addClass('ni ni-settings'))
                                    .append(model.framework)
                            )
                            .append(
                                $('<div>')
                                    .addClass('contact-info')
                                    .append($('<i>').addClass('ni ni-single-02'))
                                    .append(model.created_by)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'performance',
                    caption: 'Performance',
                    cellTemplate: (container, options) => {
                        const model = options.data;
                        const accuracy = model.accuracy * 100;
                        const status = accuracy >= 90 ? 'success' : accuracy >= 75 ? 'warning' : 'danger';
                        
                        $('<div>')
                            .addClass('performance-info')
                            .append(
                                $('<div>')
                                    .addClass('d-flex justify-content-between mb-1')
                                    .append(
                                        $('<small>')
                                            .addClass('font-weight-bold text-muted')
                                            .text('Accuracy:')
                                    )
                                    .append(
                                        $('<small>')
                                            .addClass('font-weight-bold')
                                            .text(`${accuracy.toFixed(2)}%`)
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('performance-indicator')
                                    .append(
                                        $('<div>')
                                            .addClass('performance-bar')
                                            .append(
                                                $('<div>')
                                                    .addClass(`performance-bar-fill bg-${status}`)
                                                    .css('width', `${accuracy}%`)
                                            )
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass(`performance-text text-${status}`)
                                            .text(`${Math.round(accuracy)}%`)
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    width: 120,
                    cellTemplate: (container, options) => {
                        const status = options.value.toLowerCase();
                        const icon = status === 'active' ? 'ni-check-bold' : 
                                   status === 'training' ? 'ni-time-alarm' : 'ni-fat-remove';
                        $('<div>')
                            .addClass(`status-badge ${status}`)
                            .append($('<i>').addClass(`ni ${icon}`))
                            .append(status.charAt(0).toUpperCase() + status.slice(1))
                            .appendTo(container);
                    }
                }
            ],
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    this.renderModelDetails(container, options.data);
                }
            },
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true,
                showNavigationButtons: true
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'ML_Models_List');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        console.log('Loading data...');
        try {
            // Static data for prototype showcasing different industries and use cases
            this.models = [
                {
                    id: 1,
                    name: 'AI Demand Forecaster',
                    type: 'Deep Learning',
                    version: '2.1.0',
                    framework: 'TensorFlow',
                    created_by: 'John Smith',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-03-15T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Advanced demand forecasting using multi-modal data including sales history, weather patterns, events, and seasonal trends. Optimizes inventory and reduces waste across industries.',
                    status: 'Active',
                    accuracy: 0.94,
                    f1_score: 0.93,
                    precision: 0.95,
                    recall: 0.94,
                    industry: 'Cross-Industry',
                    use_case: 'Demand Forecasting'
                },
                {
                    id: 2,
                    name: 'Dynamic Pricing Engine',
                    type: 'Reinforcement Learning',
                    version: '1.8.0',
                    framework: 'PyTorch',
                    created_by: 'Sarah Johnson',
                    created_at: '2024-02-01T00:00:00Z',
                    updated_at: '2024-03-10T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Real-time price optimization based on demand signals, inventory levels, competitor pricing, and time-based factors. Supports dynamic discounting and flash sales.',
                    status: 'Active',
                    accuracy: 0.91,
                    f1_score: 0.90,
                    precision: 0.92,
                    recall: 0.89,
                    industry: 'Retail & F&B',
                    use_case: 'Price Optimization'
                },
                {
                    id: 3,
                    name: 'Social Trend Analyzer',
                    type: 'NLP & Computer Vision',
                    version: '2.2.0',
                    framework: 'TensorFlow',
                    created_by: 'David Lee',
                    created_at: '2024-01-15T00:00:00Z',
                    updated_at: '2024-03-01T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Analyzes social media trends, influencer content, and online engagement to predict upcoming style and product trends. Integrates with design systems.',
                    status: 'Active',
                    accuracy: 0.88,
                    f1_score: 0.87,
                    precision: 0.89,
                    recall: 0.86,
                    industry: 'Fashion & Jersey',
                    use_case: 'Trend Prediction'
                },
                {
                    id: 4,
                    name: 'Smart F&B Optimizer',
                    type: 'Ensemble Learning',
                    version: '1.5.0',
                    framework: 'Scikit-learn',
                    created_by: 'Emily Chen',
                    created_at: '2024-02-15T00:00:00Z',
                    updated_at: '2024-03-20T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Comprehensive F&B optimization: predicts peak hours, suggests menu bundles, optimizes staffing, and reduces food waste through smart inventory management.',
                    status: 'Active',
                    accuracy: 0.93,
                    f1_score: 0.92,
                    precision: 0.94,
                    recall: 0.91,
                    industry: 'Food & Beverage',
                    use_case: 'Operations Optimization'
                },
                {
                    id: 5,
                    name: 'Personalization Engine',
                    type: 'Deep Learning',
                    version: '2.0.0',
                    framework: 'PyTorch',
                    created_by: 'Michael Wong',
                    created_at: '2024-01-20T00:00:00Z',
                    updated_at: '2024-03-18T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Advanced recommendation system using customer behavior data, purchase history, and contextual signals to provide personalized product suggestions and bundles.',
                    status: 'Active',
                    accuracy: 0.90,
                    f1_score: 0.89,
                    precision: 0.91,
                    recall: 0.88,
                    industry: 'Cross-Industry',
                    use_case: 'Personalization'
                },
                {
                    id: 6,
                    name: 'Smart Inventory Manager',
                    type: 'Time Series & ML',
                    version: '1.7.0',
                    framework: 'TensorFlow',
                    created_by: 'Lisa Anderson',
                    created_at: '2024-02-10T00:00:00Z',
                    updated_at: '2024-03-25T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Intelligent inventory management system that automates reordering based on predicted demand, sales velocity, and seasonal patterns. Minimizes stockouts and dead stock.',
                    status: 'Active',
                    accuracy: 0.92,
                    f1_score: 0.91,
                    precision: 0.93,
                    recall: 0.90,
                    industry: 'Cross-Industry',
                    use_case: 'Inventory Management'
                },
                {
                    id: 7,
                    name: 'Geo-Analytics Engine',
                    type: 'Spatial ML',
                    version: '1.3.0',
                    framework: 'PyTorch',
                    created_by: 'James Wilson',
                    created_at: '2024-02-20T00:00:00Z',
                    updated_at: '2024-03-22T00:00:00Z',
                    updated_by: 'admin',
                    description: 'Location-based analytics for retail and F&B optimization. Analyzes foot traffic patterns, local events, and demographics to optimize operations and marketing.',
                    status: 'Active',
                    accuracy: 0.89,
                    f1_score: 0.88,
                    precision: 0.90,
                    recall: 0.87,
                    industry: 'Retail & F&B',
                    use_case: 'Location Analytics'
                }
            ];

            // Update grid data source
            if (this.grid) {
                await this.grid.option('dataSource', this.models);
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
        const totalModels = this.models.length;
        const activeModels = this.models.filter(m => m.status === 'Active').length;
        const totalPredictions = 15000; // Example static value
        const avgAccuracy = this.models.reduce((sum, m) => sum + m.accuracy, 0) / this.models.length * 100;

        $('#totalModels').text(totalModels);
        $('#activeModels').text(activeModels);
        $('#totalPredictions').text(totalPredictions.toLocaleString());
        $('#accuracyRate').text(`${avgAccuracy.toFixed(1)}%`);
    }

    async showModelDetails(model) {
        this.currentModel = model;
        $('#modelDetailsModal').modal('show');
        
        // Show loader
        this.showModalLoader();
        
        // Reset tabs to first tab
        this.switchTab('modelInfo');
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update content
        this.updateModelDetails(model);
        
        // Hide loader
        this.hideModalLoader();
    }

    updateModelDetails(model) {
        // Basic Info
        $('#modelName').text(model.name);
        $('#modelType').html(`<i class="ni ni-atom"></i>${model.type}`);
        $('#modelCreator').html(`<i class="ni ni-single-02"></i>${model.created_by}`);
        $('#modelFramework').html(`<i class="ni ni-settings"></i>${model.framework}`);
        $('#modelVersion').html(`<i class="ni ni-tag"></i>v${model.version}`);
        $('#modelLastUpdated').html(`<i class="ni ni-calendar-grid-58"></i>${new Date(model.updated_at).toLocaleString()}`);
        $('#modelDescription').html(`<i class="ni ni-align-left-2"></i>${model.description}`);
        
        // Status
        const statusClass = model.status.toLowerCase();
        const statusIcon = statusClass === 'active' ? 'ni-check-bold' : 
                          statusClass === 'training' ? 'ni-time-alarm' : 'ni-fat-remove';
        $('#modelStatus').html(`
            <div class="status-badge ${statusClass}">
                <i class="ni ${statusIcon}"></i>
                ${model.status}
            </div>
        `);

        // Performance Info
        $('#modelAccuracy').text(`${(model.accuracy * 100).toFixed(1)}%`);
        $('#modelF1Score').text(`${(model.f1_score * 100).toFixed(1)}%`);
        $('#modelPrecision').text(`${(model.precision * 100).toFixed(1)}%`);
        $('#modelRecall').text(`${(model.recall * 100).toFixed(1)}%`);

        // Update timeline
        this.updateTimeline(model);
        
        // Initialize performance chart
        this.initializePerformanceChart(model);
    }

    updateTimeline(model) {
        const $timeline = $('.training-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Model Created',
            `Created by ${model.created_by}`,
            model.created_at
        ));

        // Updated if different from created
        if (model.updated_at !== model.created_at) {
            $timeline.append(this.createTimelineItem(
                'Model Updated',
                `Last updated by ${model.updated_by}`,
                model.updated_at
            ));
        }

        // Add training events
        $timeline.append(this.createTimelineItem(
            'Training Completed',
            `Accuracy: ${(model.accuracy * 100).toFixed(1)}%`,
            model.updated_at
        ));
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

    initializePerformanceChart(model) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Sample performance data
        const data = {
            labels: ['Accuracy', 'F1 Score', 'Precision', 'Recall'],
            datasets: [{
                label: 'Model Performance',
                data: [
                    model.accuracy * 100,
                    model.f1_score * 100,
                    model.precision * 100,
                    model.recall * 100
                ],
                backgroundColor: 'rgba(94, 114, 228, 0.2)',
                borderColor: '#5e72e4',
                borderWidth: 2,
                pointBackgroundColor: '#5e72e4'
            }]
        };

        new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    clearModelDetails() {
        $('#modelName, #modelType, #modelCreator, #modelFramework, #modelVersion, #modelLastUpdated, #modelDescription, #modelStatus').text('');
        $('#modelAccuracy, #modelF1Score, #modelPrecision, #modelRecall').text('');
        $('.training-timeline').empty();
    }

    async switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        if (this.currentModel) {
            // Show loader for tab content
            this.showModalLoader();
            
            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Load tab content
            switch(tab) {
                case 'performanceInfo':
                    this.initializePerformanceChart(this.currentModel);
                    break;
                case 'predictionInfo':
                    // Initialize predictions grid here
                    break;
                case 'trainingHistory':
                    this.updateTimeline(this.currentModel);
                    break;
            }
            
            // Hide loader
            this.hideModalLoader();
        }
    }

    async retrainModel(modelId) {
        try {
            // Show loading state
            $('#retrain-model').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Retraining...');
            
            // Simulate retraining process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update model status
            const model = this.models.find(m => m.id === modelId);
            if (model) {
                model.status = 'Training';
                await this.grid.refresh();
                this.updateModelDetails(model);
            }
            
            DevExpress.ui.notify('Model retraining started successfully', 'success', 3000);
        } catch (error) {
            console.error('Error retraining model:', error);
            DevExpress.ui.notify('Failed to start model retraining', 'error', 3000);
        } finally {
            $('#retrain-model').prop('disabled', false).text('Retrain Model');
        }
    }

    showLoader() {
        console.log('Showing loader...');
        this.isLoading = true;
        $('#mlModelsGridLoader').show();
        $('#mlModelsGrid').css('visibility', 'hidden');
    }

    hideLoader() {
        console.log('Hiding loader...');
        this.isLoading = false;
        $('#mlModelsGridLoader').hide();
        $('#mlModelsGrid')
            .css('visibility', 'visible')
            .addClass('fade-in');
    }

    showModalLoader() {
        $('#modelDetailsLoader').show();
        $('#modelDetailsContent').hide();
    }

    hideModalLoader() {
        $('#modelDetailsLoader').hide();
        $('#modelDetailsContent').show().addClass('fade-in');
    }

    renderModelDetails(container, model) {
        const $detailContent = $('<div>').addClass('master-detail-container');

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
                                    .append($('<i>').addClass('ni ni-atom text-primary fa-2x'))
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
                                            .text(model.name)
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('model-type')
                                            .append($('<i>').addClass('ni ni-atom'))
                                            .append(model.type)
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center')
                                    .append(
                                        $('<span>')
                                            .addClass('version-info mr-3')
                                            .append($('<i>').addClass('ni ni-tag'))
                                            .append(`v${model.version}`)
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass(`status-badge ${model.status.toLowerCase()}`)
                                            .append($('<i>').addClass(`ni ${model.status.toLowerCase() === 'active' ? 'ni-check-bold' : 'ni-time-alarm'}`))
                                            .append(model.status)
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
                                    .append('Model Information')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('card-body')
                            .append(this.createInfoItem('Created By', model.created_by, 'ni ni-single-02'))
                            .append(this.createInfoItem('Framework', model.framework, 'ni ni-settings'))
                            .append(this.createInfoItem('Last Updated', new Date(model.updated_at).toLocaleString(), 'ni ni-calendar-grid-58'))
                            .append(this.createInfoItem('Description', model.description, 'ni ni-align-left-2'))
                    )
            );

        // Performance Card
        const $performanceCard = $('<div>')
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
                                    .append('Performance Metrics')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('card-body')
                            .append(
                                $('<div>')
                                    .addClass('performance-stats')
                                    .append(this.createPerformanceStat('Accuracy', model.accuracy * 100))
                                    .append(this.createPerformanceStat('F1 Score', model.f1_score * 100))
                                    .append(this.createPerformanceStat('Precision', model.precision * 100))
                                    .append(this.createPerformanceStat('Recall', model.recall * 100))
                            )
                            .append(
                                $('<div>')
                                    .attr('id', `performanceChart-${model.id}`)
                                    .addClass('performance-chart')
                            )
                    )
            );

        // Simulation Outputs
        const $simulationOutputs = $('<div>').addClass('col-12 mt-4').append(
            $('<div>').addClass('card shadow-sm').append(
                $('<div>').addClass('card-header bg-transparent').append(
                    $('<h5>').addClass('mb-0').text('Simulated Outputs')
                ),
                $('<div>').addClass('card-body').append(
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-lg-6').append(
                            $('<div>').addClass('card').append(
                                $('<div>').addClass('card-header').append(
                                    $('<h5>').addClass('mb-0').text('Sales Prediction (7-30 Days)')
                                ),
                                $('<div>').addClass('card-body').append(
                                    $('<canvas>').attr('id', `salesPredictionChart-${model.id}`)
                                )
                            )
                        ),
                        $('<div>').addClass('col-lg-6').append(
                            $('<div>').addClass('card').append(
                                $('<div>').addClass('card-header').append(
                                    $('<h5>').addClass('mb-0').text('Product/Menu Recommendations')
                                ),
                                $('<div>').addClass('card-body').attr('id', `productRecommendations-${model.id}`)
                            )
                        )
                    ),
                    $('<div>').addClass('row mt-4').append(
                        $('<div>').addClass('col-lg-6').append(
                            $('<div>').addClass('card').append(
                                $('<div>').addClass('card-header').append(
                                    $('<h5>').addClass('mb-0').text('Customer Trend Visualization')
                                ),
                                $('<div>').addClass('card-body').append(
                                    $('<canvas>').attr('id', `customerTrendsChart-${model.id}`)
                                )
                            )
                        ),
                        $('<div>').addClass('col-lg-6').append(
                            $('<div>').addClass('card').append(
                                $('<div>').addClass('card-header').append(
                                    $('<h5>').addClass('mb-0').text('Restock Notifications')
                                ),
                                $('<div>').addClass('card-body').attr('id', `restockNotifications-${model.id}`)
                            )
                        )
                    )
                )
            )
        );

        // Append all sections
        $content.append($contactCard).append($performanceCard).append($simulationOutputs);
        $detailContent.append($header).append($content);
        container.append($detailContent);

        // Initialize performance chart and simulate outputs
        setTimeout(() => {
            this.initializePerformanceChart(model);
            this.simulateModelOutputsForModel(model.id);
        }, 0);
    }

    createInfoItem(label, value, icon) {
        return $('<div>')
            .addClass('info-item')
            .append(
                $('<small>')
                    .addClass('text-muted d-block mb-1')
                    .text(label)
            )
            .append(
                $('<div>')
                    .addClass('d-flex align-items-center')
                    .append($('<i>').addClass(`${icon} mr-2`))
                    .append($('<span>').text(value))
            );
    }

    createPerformanceStat(label, value) {
        return $('<div>')
            .addClass('performance-stat')
            .append(
                $('<h4>')
                    .text(`${value.toFixed(1)}%`)
            )
            .append(
                $('<small>')
                    .text(label)
                )
    }

    // Simulate outputs for a specific model
    simulateModelOutputsForModel(modelId) {
        // More realistic sample data for demand forecasting
        const salesData = Array.from({ length: 30 }, (_, i) => ({
            day: i + 1,
            predicted_demand: Math.floor(100 + Math.random() * 50 + Math.sin(i / 2) * 20),
            optimal_price: Math.floor(50 + Math.random() * 20 + Math.cos(i / 3) * 10),
            profit_margin: Math.floor(25 + Math.random() * 15 + Math.sin(i / 4) * 5)
        }));

        // Product insights with profitability and demand scores
        const productInsights = [
            { 
                product: 'Premium Jersey A',
                demand_score: 92,
                profit_margin: 45,
                recommended_price: '$89.99',
                stock_level: 'Optimal',
                trend_status: 'Rising'
            },
            { 
                product: 'Classic Jersey B',
                demand_score: 88,
                profit_margin: 35,
                recommended_price: '$69.99',
                stock_level: 'Low',
                trend_status: 'Stable'
            },
            { 
                product: 'Limited Edition C',
                demand_score: 95,
                profit_margin: 55,
                recommended_price: '$129.99',
                stock_level: 'Critical',
                trend_status: 'Trending'
            }
        ];

        // Customer segment analysis
        const customerSegments = [
            { 
                segment: 'Premium Buyers',
                percentage: 35,
                avg_order_value: '$150',
                purchase_frequency: 'High',
                growth_rate: '+15%'
            },
            { 
                segment: 'Regular Customers',
                percentage: 45,
                avg_order_value: '$75',
                purchase_frequency: 'Medium',
                growth_rate: '+8%'
            },
            { 
                segment: 'Price Sensitive',
                percentage: 20,
                avg_order_value: '$45',
                purchase_frequency: 'Low',
                growth_rate: '+5%'
            }
        ];

        // Inventory optimization recommendations
        const inventoryInsights = [
            { 
                product: 'Premium Jersey A',
                current_stock: 41,
                threshold: 20,
                reorder_quantity: 50,
                expected_demand: 'High',
                recommendation: 'Restock soon'
            },
            { 
                product: 'Classic Jersey B',
                current_stock: 23,
                threshold: 15,
                reorder_quantity: 30,
                expected_demand: 'Medium',
                recommendation: 'Critical - Order now'
            }
        ];

        // Visualize demand and pricing trends
        this.visualizeDemandAndPricing(salesData, modelId);

        // Display product profitability insights
        this.displayProductInsights(productInsights, modelId);

        // Visualize customer segments
        this.visualizeCustomerSegments(customerSegments, modelId);

        // Display inventory recommendations
        this.displayInventoryInsights(inventoryInsights, modelId);
    }

    visualizeDemandAndPricing(data, modelId) {
        const ctx = document.getElementById(`salesPredictionChart-${modelId}`);
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => `Day ${d.day}`),
                datasets: [
                    {
                        label: 'Predicted Demand',
                        data: data.map(d => d.predicted_demand),
                        borderColor: '#5e72e4',
                        fill: false,
                        yAxisID: 'y-demand'
                    },
                    {
                        label: 'Optimal Price ($)',
                        data: data.map(d => d.optimal_price),
                        borderColor: '#2dce89',
                        fill: false,
                        yAxisID: 'y-price'
                    },
                    {
                        label: 'Profit Margin (%)',
                        data: data.map(d => d.profit_margin),
                        borderColor: '#fb6340',
                        fill: false,
                        yAxisID: 'y-profit'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    'y-demand': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Predicted Demand (Units)'
                        }
                    },
                    'y-price': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Optimal Price ($)'
                        }
                    },
                    'y-profit': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Profit Margin (%)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Demand, Price & Profit Forecast (30 Days)'
                    }
                }
            }
        });
    }

    displayProductInsights(insights, modelId) {
        const container = document.getElementById(`productRecommendations-${modelId}`);
        if (!container) return;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table align-items-center">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Demand</th>
                            <th>Margin</th>
                            <th>Price</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${insights.map(item => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="font-weight-bold">${item.product}</span>
                                        <span class="badge badge-${item.trend_status === 'Rising' ? 'success' : item.trend_status === 'Trending' ? 'danger' : 'info'} ml-2">
                                            ${item.trend_status}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="progress-wrapper w-75">
                                            <div class="progress">
                                                <div class="progress-bar bg-success" role="progressbar" style="width: ${item.demand_score}%"></div>
                                            </div>
                                        </div>
                                        <span class="ml-2">${item.demand_score}%</span>
                                    </div>
                                </td>
                                <td>${item.profit_margin}%</td>
                                <td>${item.recommended_price}</td>
                                <td>
                                    <span class="badge badge-${item.stock_level === 'Optimal' ? 'success' : item.stock_level === 'Low' ? 'warning' : 'danger'}">
                                        ${item.stock_level}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    visualizeCustomerSegments(segments, modelId) {
        const ctx = document.getElementById(`customerTrendsChart-${modelId}`);
        if (!ctx) return;

        const colors = ['#5e72e4', '#2dce89', '#fb6340'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: segments.map(s => s.segment),
                datasets: [{
                    data: segments.map(s => s.percentage),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const segment = segments[context.dataIndex];
                                return [
                                    `${segment.segment}: ${segment.percentage}%`,
                                    `Avg. Order: ${segment.avg_order_value}`,
                                    `Growth: ${segment.growth_rate}`
                                ];
                            }
                        }
                    }
                }
            }
        });

        // Add segment details below the chart
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'mt-3';
        detailsContainer.innerHTML = segments.map((segment, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <span class="badge badge-dot">
                        <i class="bg-${index === 0 ? 'primary' : index === 1 ? 'success' : 'warning'}"></i>
                    </span>
                    <span class="ml-2">${segment.segment}</span>
                </div>
                <div class="text-right">
                    <small class="text-muted">Avg. Order: ${segment.avg_order_value}</small>
                    <span class="text-success ml-2">${segment.growth_rate}</span>
                </div>
            </div>
        `).join('');
        ctx.parentNode.appendChild(detailsContainer);
    }

    displayInventoryInsights(insights, modelId) {
        const container = document.getElementById(`restockNotifications-${modelId}`);
        if (!container) return;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table align-items-center">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Stock Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${insights.map(item => {
                            const stockStatus = item.current_stock <= item.threshold ? 'danger' : 
                                             item.current_stock <= item.threshold * 1.5 ? 'warning' : 'success';
                            return `
                                <tr>
                                    <td>
                                        <span class="font-weight-bold">${item.product}</span>
                                        <br>
                                        <small class="text-muted">Expected Demand: ${item.expected_demand}</small>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="progress-wrapper w-75">
                                                <div class="progress">
                                                    <div class="progress-bar bg-${stockStatus}" role="progressbar" 
                                                         style="width: ${(item.current_stock / (item.threshold * 2)) * 100}%">
                                                    </div>
                                                </div>
                                            </div>
                                            <span class="ml-2">${item.current_stock} units</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge badge-${stockStatus}">
                                            ${item.recommendation}
                                        </span>
                                        <br>
                                        <small class="text-muted">Order ${item.reorder_quantity} units</small>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.mlServicesPageInstance) {
    window.mlServicesPageInstance = new window.MLServicesPage();
} 