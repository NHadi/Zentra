import { zentra } from '../api/index.js';

window.TaskPage = class {
    constructor() {
        this.tasks = [];
        this.currentTask = null;
        this.employees = new Map(); // Cache for employee data
        this.taskTypes = [
            'LAYOUT',
            'PRINTING',
            'PREPARING',
            'PRESSING',
            'CUTTING',
            'SEWING',
            'FINISHING'
        ];
        
        // Initialize components
        this.initialize();
        
        // Bind event handlers
        this.bindEvents();
        
        // Add styles
        this.addStyles();
    }

    dispose() {
        // Clean up event listeners
        $('#taskDetailsModal').off('show.bs.modal');
        $('#taskDetailsModal').off('hide.bs.modal');
        
        // Remove drag and drop event listeners
        this.removeDragAndDropListeners();
    }

    bindEvents() {
        // Filter button click handler
        $(document).on('click', '#filterTasks', () => {
            this.showFilterModal();
        });

        // Task card click handler
        $(document).on('click', '.task-card', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const taskId = $(e.currentTarget).data('task-id');
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.showTaskDetails(task);
            }
        });

        // Task action buttons
        $(document).on('click', '#startTask', () => {
            if (this.currentTask) {
                this.startTask(this.currentTask.id);
            }
        });

        $(document).on('click', '#completeTask', () => {
            if (this.currentTask) {
                this.completeTask(this.currentTask.id);
            }
        });

        $(document).on('click', '#addNote', () => {
            if (this.currentTask) {
                this.addNoteToTask(this.currentTask.id);
            }
        });

        $(document).on('click', '#reassignTask', () => {
            if (this.currentTask) {
                this.showReassignModal(this.currentTask.id);
            }
        });
    }

    initialize() {
        this.loadData();
        this.initializeDragAndDrop();
    }

    initializeDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const column = e.target.closest('.tasks-container');
            if (column) {
                column.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const column = e.target.closest('.tasks-container');
            if (column) {
                column.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            const column = e.target.closest('.tasks-container');
            if (column) {
                column.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                try {
                    await this.updateTaskStatus(taskId, newStatus);
                    await this.loadData(); // Refresh the view
                } catch (error) {
                    console.error('Error updating task status:', error);
                    DevExpress.ui.notify('Failed to update task status', 'error', 3000);
                }
            }
        });
    }

    removeDragAndDropListeners() {
        document.removeEventListener('dragstart', this.handleDragStart);
        document.removeEventListener('dragend', this.handleDragEnd);
        document.removeEventListener('dragover', this.handleDragOver);
        document.removeEventListener('dragleave', this.handleDragLeave);
        document.removeEventListener('drop', this.handleDrop);
    }

    async loadData() {
        try {
            // Load tasks from API
            const tasks = await zentra.getTasks();
            this.tasks = tasks;
            
            // Update statistics and render tasks
            this.updateTaskStatistics(tasks);
            this.renderTasksByDivision(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            DevExpress.ui.notify('Failed to load tasks', 'error', 3000);
        }
    }

    updateTaskStatistics(tasks) {
        const totalTasks = tasks.length;
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending').length;
        
        // Update statistics cards
        $('#totalTasks').text(totalTasks);
        $('#inProgressTasks').text(inProgressTasks);
        $('#completedTasks').text(completedTasks);
        $('#pendingTasks').text(pendingTasks);
        
        // Calculate completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        $('#completionRate').html(`<i class="fa fa-arrow-up"></i> ${completionRate}%`);
        
        // Calculate weekly growth (placeholder)
        $('#tasksGrowth').html('<i class="fa fa-arrow-up"></i> 5%');
    }

    renderTasksByDivision(tasks) {
        // Clear existing content
        $('#main-content').empty();
        
        // Create main container with fixed header and scrollable content
        const container = $('<div>').addClass('division-container').html(`
            <div class="board-header">
                <div class="dashboard-summary">
                    <div class="summary-stats">
                        <div class="stat-item total">
                            <div class="stat-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${tasks.length}</div>
                                <div class="stat-label">Total Tasks</div>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item pending">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${tasks.filter(t => t.status === 'pending').length}</div>
                                <div class="stat-label">To Do</div>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item in-progress">
                            <div class="stat-icon">
                                <i class="fas fa-spinner fa-spin"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${tasks.filter(t => t.status === 'in_progress').length}</div>
                                <div class="stat-label">In Progress</div>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item completed">
                            <div class="stat-icon">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${tasks.filter(t => t.status === 'completed').length}</div>
                                <div class="stat-label">Completed</div>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-light btn-sm" id="viewFilters">
                            <i class="fas fa-filter"></i>
                        </button>
                        <button class="btn btn-light btn-sm" id="viewSettings">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="board-content">
                <div class="divisions-wrapper"></div>
            </div>
        `);

        // Add styles specific to the dashboard
        this.addDashboardStyles();
        
        // Rest of the existing code...
        const tasksByType = this.groupTasksByType(tasks);
        const divisionsWrapper = container.find('.divisions-wrapper');
        
        this.taskTypes.forEach(type => {
            const divisionTasks = tasksByType[type] || [];
            const divisionSection = this.createDivisionSection(type, divisionTasks);
            divisionsWrapper.append(divisionSection);
        });
        
        $('#main-content').append(container);
    }

    addDashboardStyles() {
        const styles = `
            .dashboard-summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            }

            .summary-stats {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                transition: transform 0.2s ease;
            }

            .stat-item:hover {
                transform: translateY(-1px);
            }

            .stat-divider {
                width: 1px;
                height: 2rem;
                background: #e9ecef;
                margin: 0 0.5rem;
            }

            .stat-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
            }

            .stat-info {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 1.25rem;
                font-weight: 600;
                line-height: 1;
                margin-bottom: 0.25rem;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .stat-item.total {
                color: #5e72e4;
            }
            .stat-item.total .stat-icon {
                background: rgba(94, 114, 228, 0.1);
            }

            .stat-item.pending {
                color: #fb6340;
            }
            .stat-item.pending .stat-icon {
                background: rgba(251, 99, 64, 0.1);
            }

            .stat-item.in-progress {
                color: #2dce89;
            }
            .stat-item.in-progress .stat-icon {
                background: rgba(45, 206, 137, 0.1);
            }

            .stat-item.completed {
                color: #11cdef;
            }
            .stat-item.completed .stat-icon {
                background: rgba(17, 205, 239, 0.1);
            }

            .dashboard-actions {
                display: flex;
                gap: 0.5rem;
            }

            .dashboard-actions .btn {
                width: 32px;
                height: 32px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                background: #f6f9fc;
                border: none;
                color: #8898aa;
                transition: all 0.2s ease;
            }

            .dashboard-actions .btn:hover {
                background: #e9ecef;
                color: #5e72e4;
            }

            @media (max-width: 768px) {
                .dashboard-summary {
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                }

                .summary-stats {
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .stat-divider {
                    display: none;
                }

                .stat-item {
                    flex: 1;
                    min-width: 140px;
                    justify-content: center;
                }
            }
        `;

        // Add styles to head if not already added
        if (!document.querySelector('style[data-dashboard-styles]')) {
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-dashboard-styles', '');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
    }

    showTaskSummaryDetails(type) {
        let filteredTasks = this.tasks;
        let title = 'All Tasks';

        if (type !== 'all') {
            filteredTasks = this.tasks.filter(t => t.status === type);
            title = `${type.replace('_', ' ').toUpperCase()} Tasks`;
        }

        // Show task details in a modal or side panel
        DevExpress.ui.dialog.custom({
            title: title,
            content: this.createTaskSummaryContent(filteredTasks),
            buttons: [{
                text: 'Close',
                onClick: () => true
            }],
            width: '800px',
            height: '600px'
        });
    }

    createTaskSummaryContent(tasks) {
        const container = $('<div>').addClass('task-summary-container');
        
        // Add summary statistics
        const stats = $('<div>').addClass('summary-stats').html(`
            <div class="stat-item">
                <div class="stat-value">${tasks.length}</div>
                <div class="stat-label">Tasks</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${tasks.filter(t => t.employee_id).length}</div>
                <div class="stat-label">Assigned</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${tasks.filter(t => t.completed_at).length}</div>
                <div class="stat-label">Completed</div>
            </div>
        `);
        
        // Add task list
        const taskList = $('<div>').addClass('task-list');
        tasks.forEach(task => {
            taskList.append(this.createTaskSummaryItem(task));
        });
        
        return container.append(stats, taskList);
    }

    createTaskSummaryItem(task) {
        const timeInfo = this.formatTaskTime(task);
        return $('<div>').addClass('task-summary-item').html(`
            <div class="task-summary-header">
                <span class="badge badge-${this.getStatusClass(task.status)}">
                    ${task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span class="task-type">${task.task_type}</span>
            </div>
            <div class="task-summary-body">
                <div class="task-description">${task.notes || 'No description'}</div>
                <div class="task-meta">
                    <span class="employee">
                        <i class="fas fa-user"></i> E${task.employee_id}
                    </span>
                    <span class="order">
                        <i class="fas fa-shopping-cart"></i> Order #${task.order_item_id}
                    </span>
                    <span class="time">
                        <i class="${timeInfo.icon}"></i> ${timeInfo.text}
                    </span>
                </div>
            </div>
        `);
    }

    groupTasksByType(tasks) {
        return tasks.reduce((groups, task) => {
            const type = task.task_type.toUpperCase();
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(task);
            return groups;
        }, {});
    }

    createDivisionSection(type, tasks) {
        const section = $('<div>').addClass('division-section');
        
        // Division header with task counts
        const header = $('<div>').addClass('division-header');
        const taskCounts = this.getTaskCountsByStatus(tasks);
        
        header.html(`
            <div class="division-header-content">
                <div class="division-title">
                    <i class="fas fa-layer-group"></i>
                    <h5>${type}</h5>
                </div>
                <div class="task-counts">
                    <span class="task-count total" title="Total Tasks">
                        <i class="fas fa-tasks"></i>${tasks.length}
                    </span>
                    <span class="task-count pending" title="Pending Tasks">
                        <i class="fas fa-clock"></i>${taskCounts.pending}
                    </span>
                    <span class="task-count in-progress" title="In Progress">
                        <i class="fas fa-spinner"></i>${taskCounts.inProgress}
                    </span>
                    <span class="task-count completed" title="Completed">
                        <i class="fas fa-check"></i>${taskCounts.completed}
                    </span>
                </div>
            </div>
        `);
        
        // Task columns container
        const columnsContainer = $('<div>').addClass('task-columns');
        
        // Create status columns
        const statuses = [
            { key: 'pending', label: 'To Do', icon: 'clock' },
            { key: 'in_progress', label: 'In Progress', icon: 'spinner fa-spin' },
            { key: 'completed', label: 'Completed', icon: 'check' }
        ];
        
        statuses.forEach(status => {
            const statusTasks = tasks.filter(task => task.status === status.key);
            const column = this.createStatusColumn(status, statusTasks);
            columnsContainer.append(column);
        });
        
        section.append(header, columnsContainer);
        return section;
    }

    createStatusColumn(status, tasks) {
        const column = $('<div>').addClass('status-column');
        
        // Column header
        const header = $('<div>').addClass('column-header')
            .html(`
                <div class="column-title">
                    <i class="fas fa-${status.icon}"></i>
                    <span>${status.label}</span>
                    <span class="task-count">${tasks.length}</span>
                </div>
            `);
            
        const tasksContainer = $('<div>')
            .addClass('tasks-container')
            .attr('data-status', status.key);
        
        if (tasks.length === 0) {
            tasksContainer.append(`
                <div class="empty-column">
                    <div>
                        <i class="fas fa-inbox mb-2"></i>
                        <div>No tasks</div>
                    </div>
                </div>
            `);
        } else {
            // Add tasks
            tasks.forEach(task => {
                const taskCard = this.createTaskCard(task);
                tasksContainer.append(taskCard);
            });
        }
        
        column.append(header, tasksContainer);
        return column;
    }

    createTaskCard(task) {
        // Create the card element
        const card = $('<div>')
            .addClass('task-card')
            .attr({
                'draggable': 'true',
                'data-task-id': task.id
            });
        
        const statusClass = this.getStatusClass(task.status);
        const timeInfo = this.formatTaskTime(task);
        
        // Add card content
        card.html(`
            <div class="task-card-content">
                <div class="task-header">
                    <div class="task-badges">
                        <span class="badge badge-${statusClass}">
                            ${task.status === 'in_progress' ? 
                                '<i class="fas fa-spinner fa-spin"></i>' : 
                                '<i class="fas fa-circle"></i>'}
                            ${task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span class="employee-badge" title="Assigned Employee">
                            <i class="fas fa-user"></i>
                            E${task.employee_id}
                        </span>
                    </div>
                </div>
                
                <div class="task-body">
                    <div class="task-description">
                        ${task.notes || 'No description provided'}
                    </div>
                    <div class="task-meta">
                        <span class="order-ref" title="Order Reference">
                            <i class="fas fa-shopping-cart"></i>
                            Order #${task.order_item_id}
                        </span>
                    </div>
                </div>
                
                <div class="task-footer">
                    <div class="task-time" title="${timeInfo.tooltip}">
                        <i class="${timeInfo.icon}"></i>
                        ${timeInfo.text}
                    </div>
                </div>
            </div>
        `);

        // Add styles for clickable card
        card.css('cursor', 'pointer');
        
        return card;
    }

    formatTaskTime(task) {
        const formatDateTime = (date) => {
            const d = new Date(date);
            return d.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });
        };

        if (task.completed_at) {
            return {
                icon: 'fas fa-check-circle text-success',
                text: formatDateTime(task.completed_at),
                tooltip: `Completed on ${new Date(task.completed_at).toLocaleString()}`
            };
        }
        if (task.started_at) {
            return {
                icon: 'fas fa-play-circle text-primary',
                text: formatDateTime(task.started_at),
                tooltip: `Started on ${new Date(task.started_at).toLocaleString()}`
            };
        }
        return {
            icon: 'fas fa-clock text-muted',
            text: formatDateTime(task.created_at),
            tooltip: `Created on ${new Date(task.created_at).toLocaleString()}`
        };
    }

    getStatusClass(status) {
        const classes = {
            'pending': 'warning',
            'in_progress': 'primary',
            'completed': 'success'
        };
        return classes[status] || 'secondary';
    }

    getTaskCountsByStatus(tasks) {
        return {
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
        };
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            await zentra.updateTaskStatus(taskId, newStatus);
            await this.loadData(); // Refresh the view
            DevExpress.ui.notify('Task status updated successfully', 'success', 3000);
        } catch (error) {
            console.error('Error updating task status:', error);
            DevExpress.ui.notify('Failed to update task status', 'error', 3000);
        }
    }

    // Add styles to the page
    addStyles() {
        const styles = `
            .division-container {
                height: calc(100vh - 80px);
                display: flex;
                flex-direction: column;
                background: #f8f9fa;
                overflow: hidden;
            }
            
            .board-header {
                background: #fff;
                border-bottom: 1px solid #e9ecef;
                padding: 1rem;
                position: sticky;
                top: 0;
                z-index: 100;
            }

            .board-content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }

            .divisions-wrapper {
                display: flex;
                flex-direction: column;
                gap: 2rem;
                padding-bottom: 2rem;
            }

            .division-section {
                background: transparent;
            }
            
            .division-header {
                margin-bottom: 1rem;
                position: sticky;
                top: 0;
                z-index: 5;
            }
            
            .division-header-content {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .task-columns {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                min-height: 100px;
            }
            
            .status-column {
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                height: fit-content;
                min-height: 100px;
            }

            .tasks-container {
                padding: 1rem;
                min-height: 50px;
                max-height: 500px;
                overflow-y: auto;
                flex: 1;
            }

            .tasks-container::-webkit-scrollbar {
                width: 6px;
            }

            .tasks-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .tasks-container::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .tasks-container::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            .empty-column {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100px;
                color: #8898aa;
                font-size: 0.875rem;
                text-align: center;
                border: 2px dashed #e9ecef;
                border-radius: 6px;
                margin: 0.5rem;
            }

            .division-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .division-title i {
                font-size: 1.25rem;
                color: #5e72e4;
            }
            
            .division-title h5 {
                margin: 0;
                font-weight: 600;
                color: #32325d;
            }
            
            .task-counts {
                display: flex;
                gap: 1rem;
            }
            
            .task-count {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .task-count i {
                font-size: 0.875rem;
            }

            .task-count.total {
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }
            
            .task-count.pending {
                background: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }
            
            .task-count.in-progress {
                background: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }
            
            .task-count.completed {
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }
            
            .task-columns {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
                min-height: 300px;
            }
            
            .column-header {
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
                background: white;
                border-radius: 8px 8px 0 0;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            .column-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #8898aa;
                font-weight: 600;
                font-size: 0.875rem;
            }
            
            .column-title .task-count {
                margin-left: auto;
                background: #f6f9fc;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
            }
            
            .task-card {
                background: white;
                border-radius: 8px;
                margin-bottom: 0.75rem;
                border: 1px solid #e9ecef;
                transition: all 0.2s ease;
                cursor: grab;
            }
            
            .task-card:hover {
                box-shadow: 0 4px 6px rgba(50, 50, 93, 0.1);
                transform: translateY(-1px);
            }
            
            .task-card.dragging {
                opacity: 0.9;
                transform: rotate(2deg);
                box-shadow: 0 8px 16px rgba(50, 50, 93, 0.15);
            }
            
            .task-card-content {
                padding: 1rem;
            }
            
            .task-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
            }
            
            .task-badges {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .badge {
                padding: 0.5rem 0.75rem;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
            }
            
            .badge i {
                font-size: 0.625rem;
            }
            
            .badge-warning {
                background: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }
            
            .badge-primary {
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }
            
            .badge-success {
                background: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }
            
            .employee-badge {
                background: #f6f9fc;
                color: #8898aa;
                padding: 0.5rem 0.75rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
            }
            
            .btn-icon {
                padding: 0.25rem;
                background: transparent;
                border: none;
                color: #8898aa;
                border-radius: 4px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .btn-icon:hover {
                background: #f6f9fc;
                color: #5e72e4;
            }
            
            .task-body {
                margin-bottom: 0.75rem;
            }
            
            .task-description {
                color: #525f7f;
                font-size: 0.875rem;
                line-height: 1.5;
                margin-bottom: 0.75rem;
            }
            
            .task-meta {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
            
            .order-ref {
                color: #8898aa;
                font-size: 0.75rem;
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
            }
            
            .task-footer {
                padding-top: 0.75rem;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .task-time {
                color: #8898aa;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.375rem;
            }
            
            @media (max-width: 1200px) {
                .task-columns {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media (max-width: 768px) {
                .task-columns {
                    grid-template-columns: 1fr;
                }
                
                .division-header-content {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }
                
                .task-counts {
                    width: 100%;
                    justify-content: space-between;
                }
            }

            /* Filter Modal Styles */
            .filter-form {
                padding: 1rem;
            }

            .filter-form .form-group {
                margin-bottom: 1rem;
            }

            .filter-form label {
                display: block;
                margin-bottom: 0.5rem;
                color: #8898aa;
                font-size: 0.875rem;
                font-weight: 600;
            }

            .filter-form .form-control {
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 0.75rem;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }

            .filter-form .form-control:focus {
                border-color: #5e72e4;
                box-shadow: 0 0 0 0.2rem rgba(94, 114, 228, 0.25);
            }

            .filter-form .input-group {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .filter-form .input-group-text {
                background: #f6f9fc;
                border: 1px solid #e9ecef;
                color: #8898aa;
                padding: 0.75rem;
                border-radius: 6px;
            }

            /* Task Card Hover Effect */
            .task-card {
                transition: all 0.2s ease;
            }

            .task-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(50, 50, 93, 0.1);
            }

            .task-card:active {
                transform: translateY(0);
            }

            /* Task Detail Modal Improvements */
            .task-detail-modal {
                max-height: 80vh;
                overflow-y: auto;
            }

            .task-detail-modal::-webkit-scrollbar {
                width: 6px;
            }

            .task-detail-modal::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .task-detail-modal::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .task-detail-modal::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            /* Responsive Improvements */
            @media (max-width: 768px) {
                .task-detail-modal {
                    padding: 0.5rem;
                }

                .task-detail-actions {
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .task-detail-actions .btn {
                    flex: 1;
                    min-width: 120px;
                }
            }
        `;
        
        // Add styles to head
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    showFilterModal() {
        const content = `
            <div class="filter-form">
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-control" id="statusFilter">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Task Type</label>
                    <select class="form-control" id="typeFilter">
                        <option value="">All Types</option>
                        ${this.taskTypes.map(type => `
                            <option value="${type}">${type}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Assigned To</label>
                    <input type="text" class="form-control" id="employeeFilter" placeholder="Employee ID">
                </div>
                <div class="form-group">
                    <label>Date Range</label>
                    <div class="input-group">
                        <input type="date" class="form-control" id="dateFrom">
                        <div class="input-group-append">
                            <span class="input-group-text">to</span>
                        </div>
                        <input type="date" class="form-control" id="dateTo">
                    </div>
                </div>
            </div>
        `;

        DevExpress.ui.dialog.custom({
            title: 'Filter Tasks',
            content: content,
            buttons: [{
                text: 'Cancel',
                onClick: () => true
            }, {
                text: 'Apply Filters',
                onClick: () => {
                    const filters = {
                        status: $('#statusFilter').val(),
                        type: $('#typeFilter').val(),
                        employeeId: $('#employeeFilter').val(),
                        dateFrom: $('#dateFrom').val(),
                        dateTo: $('#dateTo').val()
                    };
                    this.applyFilters(filters);
                    return true;
                }
            }],
            width: '500px'
        });
    }

    applyFilters(filters) {
        let filteredTasks = [...this.tasks];

        if (filters.status) {
            filteredTasks = filteredTasks.filter(task => task.status === filters.status);
        }

        if (filters.type) {
            filteredTasks = filteredTasks.filter(task => task.task_type === filters.type);
        }

        if (filters.employeeId) {
            filteredTasks = filteredTasks.filter(task => task.employee_id === parseInt(filters.employeeId));
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filteredTasks = filteredTasks.filter(task => new Date(task.created_at) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            filteredTasks = filteredTasks.filter(task => new Date(task.created_at) <= toDate);
        }

        this.renderTasksByDivision(filteredTasks);
        this.updateTaskStatistics(filteredTasks);
    }

    showTaskDetails(task) {
        if (!task) return;
        
        this.currentTask = task; // Store the current task
        
        // Create modal content
        const timeInfo = this.formatTaskTime(task);
        const statusClass = this.getStatusClass(task.status);
        const orderItem = task.order_item || {};
        const order = orderItem.order || {};
        
        const modalContent = `
            <div class="task-detail-modal">
                <div class="task-detail-header">
                    <div class="status-section">
                        <span class="badge badge-${statusClass} badge-lg">
                            ${task.status === 'in_progress' ? 
                                '<i class="fas fa-spinner fa-spin"></i>' : 
                                '<i class="fas fa-circle"></i>'}
                            ${task.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <div class="task-type-section">
                        <span class="task-type-badge">
                            <i class="fas fa-layer-group"></i>
                            ${task.task_type}
                        </span>
                    </div>
                </div>

                <div class="task-detail-body">
                    <div class="detail-section">
                        <h6 class="section-title">Order Information</h6>
                        <div class="order-info">
                            <div class="order-header">
                                <div class="order-title">
                                    <h5>Order #${order.order_number || 'N/A'}</h5>
                                    <span class="badge badge-${this.getOrderStatusClass(order.status)}">
                                        ${order.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                                    </span>
                            </div>
                                <div class="order-meta">
                                    <span class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        Created: ${new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                    <span class="meta-item">
                                        <i class="fas fa-truck"></i>
                                        Expected: ${order.expected_delivery_date || 'Not set'}
                                    </span>
                                </div>
                            </div>
                            <div class="order-details">
                                <div class="detail-row">
                                    <div class="detail-label">Customer</div>
                                    <div class="detail-value">
                                        <div class="customer-info">
                                            <strong>${order.customer?.name || 'N/A'}</strong>
                                            <div class="customer-contact">
                                                <span><i class="fas fa-envelope"></i> ${order.customer?.email || 'N/A'}</span>
                                                <span><i class="fas fa-phone"></i> ${order.customer?.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Item Details</div>
                                    <div class="detail-value">
                                        <div class="item-info">
                                            <div class="item-main">
                                                ${orderItem.product_detail?.name || 'Custom Item'}
                                            </div>
                                            <div class="item-specs">
                                                <span class="spec-item">
                                                    <i class="fas fa-ruler"></i> Size: ${orderItem.size || 'N/A'}
                                                </span>
                                                <span class="spec-item">
                                                    <i class="fas fa-palette"></i> Color: ${orderItem.color || 'N/A'}
                                                </span>
                                                <span class="spec-item">
                                                    <i class="fas fa-box"></i> Quantity: ${orderItem.quantity || 'N/A'}
                                                </span>
                                            </div>
                                            ${orderItem.customization ? `
                                                <div class="customization-info">
                                                    <div class="custom-title">Customization</div>
                                                    <div class="custom-details">
                                                        <span>Name: ${JSON.parse(orderItem.customization).name || 'N/A'}</span>
                                                        <span>Number: ${JSON.parse(orderItem.customization).number || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="detail-row">
                                    <div class="detail-label">Production Status</div>
                                    <div class="detail-value">
                                        <div class="production-info">
                                            <span class="badge badge-${this.getProductionStatusClass(orderItem.production_status)}">
                                                ${orderItem.production_status?.replace('_', ' ').toUpperCase() || 'N/A'}
                                            </span>
                                            <div class="current-task">
                                                Current Task: ${orderItem.current_task?.replace('_', ' ').toUpperCase() || 'None'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h6 class="section-title">Timeline</h6>
                        <div class="timeline">
                            <div class="timeline-item">
                                <i class="fas fa-clock"></i>
                                <div class="timeline-content">
                                    <div class="event">Created</div>
                                    <div class="time">${new Date(task.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                            ${task.started_at ? `
                                <div class="timeline-item">
                                    <i class="fas fa-play"></i>
                                    <div class="timeline-content">
                                        <div class="event">Started</div>
                                        <div class="time">${new Date(task.started_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            ` : ''}
                            ${task.completed_at ? `
                                <div class="timeline-item">
                                    <i class="fas fa-check"></i>
                                    <div class="timeline-content">
                                        <div class="event">Completed</div>
                                        <div class="time">${new Date(task.completed_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h6 class="section-title">Notes</h6>
                        <div class="notes-section">
                            <div class="note-content">
                                ${task.notes || 'No notes available'}
                            </div>
                            <div class="add-note-form">
                                <textarea id="newNote" class="form-control" placeholder="Add a note..."></textarea>
                                <button class="btn btn-sm btn-primary mt-2" id="addNote">
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="task-detail-actions">
                    ${task.status === 'pending' ? `
                        <button class="btn btn-primary" id="startTask">
                            <i class="fas fa-play"></i> Start Task
                        </button>
                    ` : ''}
                    ${task.status === 'in_progress' ? `
                        <button class="btn btn-success" id="completeTask">
                            <i class="fas fa-check"></i> Complete Task
                        </button>
                    ` : ''}
                    <button class="btn btn-info" id="reassignTask">
                        <i class="fas fa-user-edit"></i> Reassign
                    </button>
                </div>
            </div>
        `;

        // Show modal using DevExpress dialog
            DevExpress.ui.dialog.custom({
                title: `Task Details - ${task.task_type}`,
                content: modalContent,
                buttons: [{
                    text: 'Close',
                    onClick: () => {
                        this.currentTask = null;
                        return true;
                    }
                }],
            width: '800px',
                height: 'auto',
                dragEnabled: true,
                showCloseButton: true,
                onShown: () => {
                    this.addTaskDetailStyles();
                }
            });
    }

    getOrderStatusClass(status) {
        const classes = {
            'pending': 'warning',
            'confirmed': 'info',
            'in_production': 'primary',
            'quality_check': 'info',
            'ready_for_delivery': 'primary',
            'delivered': 'success',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    getProductionStatusClass(status) {
        const classes = {
            'pending': 'warning',
            'in_progress': 'primary',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    addTaskDetailStyles() {
        const styles = `
            .task-detail-modal {
                padding: 1rem;
            }

            .task-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .badge-lg {
                padding: 0.75rem 1rem;
                font-size: 0.875rem;
            }

            .task-type-badge {
                padding: 0.5rem 1rem;
                background: #f6f9fc;
                border-radius: 6px;
                color: #5e72e4;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .task-detail-body {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .detail-section {
                background: #fff;
                border-radius: 8px;
                padding: 1.5rem;
                border: 1px solid #e9ecef;
            }

            .section-title {
                color: #8898aa;
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 1.5rem;
            }

            .order-header {
                margin-bottom: 1.5rem;
            }

            .order-title {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 0.75rem;
            }

            .order-title h5 {
                margin: 0;
                font-weight: 600;
            }

            .order-meta {
                display: flex;
                gap: 1.5rem;
                color: #8898aa;
                font-size: 0.875rem;
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .order-details {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .detail-row {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 1rem;
                align-items: start;
            }

            .detail-label {
                color: #8898aa;
                font-size: 0.875rem;
                font-weight: 600;
            }

            .detail-value {
                color: #525f7f;
            }

            .customer-info {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .customer-contact {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                color: #8898aa;
            }

            .customer-contact span {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .item-info {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .item-main {
                font-weight: 600;
                color: #32325d;
            }

            .item-specs {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .spec-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #8898aa;
                background: #f6f9fc;
                padding: 0.5rem 0.75rem;
                border-radius: 4px;
            }

            .customization-info {
                background: #f6f9fc;
                padding: 1rem;
                border-radius: 6px;
                margin-top: 0.75rem;
            }

            .custom-title {
                font-weight: 600;
                color: #32325d;
                margin-bottom: 0.5rem;
            }

            .custom-details {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                color: #525f7f;
            }

            .production-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .current-task {
                font-size: 0.875rem;
                color: #8898aa;
            }

            .task-detail-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e9ecef;
            }

            .task-detail-actions .btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .detail-row {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }

                .detail-label {
                    margin-bottom: 0.25rem;
                }

                .order-meta {
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .item-specs {
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }
        `;

        // Add styles to head if not already added
        if (!document.querySelector('style[data-task-detail-styles]')) {
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-task-detail-styles', '');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
    }

    async startTask(taskId) {
        try {
            await zentra.updateTaskStatus(taskId, 'in_progress');
            await this.loadData();
            DevExpress.ui.notify('Task started successfully', 'success', 3000);
        } catch (error) {
            console.error('Error starting task:', error);
            DevExpress.ui.notify('Failed to start task', 'error', 3000);
        }
    }

    async completeTask(taskId) {
        try {
            await zentra.updateTaskStatus(taskId, 'completed');
            await this.loadData();
            DevExpress.ui.notify('Task completed successfully', 'success', 3000);
        } catch (error) {
            console.error('Error completing task:', error);
            DevExpress.ui.notify('Failed to complete task', 'error', 3000);
        }
    }

    async addNoteToTask(taskId) {
        const noteText = $('#newNote').val().trim();
        if (!noteText) {
            DevExpress.ui.notify('Please enter a note', 'warning', 3000);
            return;
        }

        try {
            await zentra.addTaskNote(taskId, noteText);
            await this.loadData();
            DevExpress.ui.notify('Note added successfully', 'success', 3000);
            $('#newNote').val('');
        } catch (error) {
            console.error('Error adding note:', error);
            DevExpress.ui.notify('Failed to add note', 'error', 3000);
        }
    }

    showReassignModal(taskId) {
        const content = `
            <div class="reassign-form">
                <div class="form-group">
                    <label for="employeeId">Employee ID</label>
                    <input type="text" class="form-control" id="employeeId" placeholder="Enter employee ID">
                </div>
            </div>
        `;

        DevExpress.ui.dialog.custom({
            title: 'Reassign Task',
            content: content,
            buttons: [{
                text: 'Cancel',
                onClick: () => true
            }, {
                text: 'Reassign',
                onClick: () => {
                    const employeeId = $('#employeeId').val();
                    if (employeeId) {
                        this.reassignTask(taskId, employeeId);
                        return true;
                    }
                    DevExpress.ui.notify('Please enter an employee ID', 'warning', 3000);
                    return false;
                }
            }],
            width: '400px'
        });
    }

    async reassignTask(taskId, employeeId) {
        try {
            await zentra.reassignTask(taskId, employeeId);
            await this.loadData();
            DevExpress.ui.notify('Task reassigned successfully', 'success', 3000);
        } catch (error) {
            console.error('Error reassigning task:', error);
            DevExpress.ui.notify('Failed to reassign task', 'error', 3000);
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.taskPageInstance) {
    window.taskPageInstance = new window.TaskPage();
}