import { zentra } from '../api/index.js';

export class TaskPage {
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

        // Initialize Bootstrap modal
        this.initializeModal();
    }

    initializeModal() {
        // Initialize the Bootstrap modal
        const modalElement = document.getElementById('taskDetailsModal');
        
        // Clean up any existing event listeners
        modalElement.removeEventListener('hidden.bs.modal', this.handleModalHidden);
        
        // Create new modal instance
        this.taskModal = new bootstrap.Modal(modalElement, {
            keyboard: true,
            backdrop: true
        });

        // Add event listener for modal hidden event
        modalElement.addEventListener('hidden.bs.modal', this.handleModalHidden.bind(this));
    }

    handleModalHidden() {
        // Reset modal state when hidden
        this.currentTask = null;
        $('#taskDetailsModal .modal-body').html('');
        $('#taskTitle').text('');
        $('#taskIdBadge').text('');
        $('#taskStatus').html('');
    }

    dispose() {
        // Clean up event listeners
        $('#taskDetailsModal').off('show.bs.modal');
        $('#taskDetailsModal').off('hide.bs.modal');
        
        // Remove drag and drop event listeners
        this.removeDragAndDropListeners();
    }

    bindEvents() {
        // Task card click handler with improved event delegation
        $(document).on('click', '.task-card', (e) => {
            const taskCard = $(e.currentTarget);
            const taskId = taskCard.data('task-id');
            
            // Prevent click if clicking on action buttons
            if ($(e.target).closest('.task-actions').length) {
                return;
            }
            
            // Find the task and show details
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                e.preventDefault();
                e.stopPropagation();
                this.showTaskDetails(task);
            }
        });

        // Task action buttons with improved event handling
        $('#startTask').on('click', () => {
            if (this.currentTask) {
                this.startTask(this.currentTask.id);
            }
        });

        $('#completeTask').on('click', () => {
            if (this.currentTask) {
                this.completeTask(this.currentTask.id);
            }
        });

        $('#addNoteBtn').on('click', () => {
            if (this.currentTask) {
                this.addNoteToTask(this.currentTask.id);
            }
        });

        $('#reassignTask').on('click', () => {
            if (this.currentTask) {
                this.showReassignModal(this.currentTask.id);
            }
        });

        // Filter button click handler
        $(document).on('click', '#viewFilters', () => {
            this.showFilterModal();
        });
    }

    initialize() {
        this.loadData();
        this.initializeDragAndDrop();
        this.initializeSettings();
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
        
        // Update circular progress
        const circle = document.querySelector('.circular-chart .circle');
        if (circle) {
            circle.style.strokeDasharray = `${completionRate}, 100`;
        }
        $('.rate-text').text(`${completionRate}%`);
        
        // Update progress bar
        const progressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
        $('#progressPercentage').css('width', `${progressPercentage}%`);
        $('#progressText').text(`${inProgressTasks} of ${totalTasks} tasks`);
        
        // Update pending breakdown
        const highPriorityTasks = tasks.filter(task => {
            const dueDate = task.order_item?.order?.expected_delivery_date;
            return task.status === 'pending' && dueDate && new Date(dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        }).length;
        
        const dueTodayTasks = tasks.filter(task => {
            const dueDate = task.order_item?.order?.expected_delivery_date;
            return task.status === 'pending' && dueDate && new Date(dueDate).toDateString() === new Date().toDateString();
        }).length;
        
        $('#highPriorityCount').text(highPriorityTasks);
        $('#dueTodayCount').text(dueTodayTasks);
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
        
        // Group tasks by type and filter based on visibility
        const tasksByType = this.groupTasksByType(tasks);
        const divisionsWrapper = container.find('.divisions-wrapper');
        
        this.taskTypes.forEach(type => {
            // Check if type is visible in settings
            if (this.getTypeVisibility(type)) {
                const divisionTasks = tasksByType[type] || [];
                const divisionSection = this.createDivisionSection(type, divisionTasks);
                divisionsWrapper.append(divisionSection);
            }
        });
        
        $('#main-content').append(container);

        // Apply current settings
        this.applySettings();
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

        // Update the task details modal with summary content
        $('#taskTitle').text(title);
        $('#taskDetailsModal .modal-body').html(this.createTaskSummaryContent(filteredTasks));
        
        // Show the Bootstrap modal
        if (this.taskModal) {
            this.taskModal.show();
        } else {
            $('#taskDetailsModal').modal('show');
        }
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
        const card = $('<div>')
            .addClass('task-card')
            .attr({
                'draggable': 'true',
                'data-task-id': task.id,
                'role': 'button',
                'tabindex': '0'  // Make it focusable for accessibility
            });
        
        const statusClass = this.getStatusClass(task.status);
        const timeInfo = this.formatTaskTime(task);
        const dueDate = new Date(task.order_item?.order?.expected_delivery_date);
        const isOverdue = dueDate < new Date() && task.status !== 'completed';
        const isPriority = dueDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        card.html(`
            <div class="task-card-content">
                <div class="task-header">
                    <div class="task-badges">
                        <span class="badge badge-${statusClass}">
                            ${this.getStatusIcon(task.status)}
                            ${task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        ${isOverdue ? `
                            <span class="badge badge-danger">
                                <i class="fas fa-exclamation-triangle"></i> OVERDUE
                        </span>
                        ` : ''}
                        ${isPriority && !isOverdue ? `
                            <span class="badge badge-warning">
                                <i class="fas fa-bolt"></i> PRIORITY
                            </span>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-icon btn-sm" title="Quick Actions">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                
                <div class="task-body">
                    <div class="task-info">
                        <div class="task-type">
                            <i class="fas ${this.getTaskTypeIcon(task.task_type)}"></i>
                            <span>${task.task_type.toUpperCase()}</span>
                    </div>
                    <div class="task-meta">
                            <span class="meta-item" title="Order Reference">
                            <i class="fas fa-shopping-cart"></i>
                                #${task.order_item.order.order_number}
                            </span>
                            <span class="meta-item" title="Product">
                                <i class="fas fa-tshirt"></i>
                                ${task.order_item.product_name}
                        </span>
                    </div>
                    </div>
                    <div class="task-details">
                        <div class="detail-row">
                            <span class="detail-label">Quantity:</span>
                            <span class="detail-value">${task.order_item.quantity} pcs</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Size/Color:</span>
                            <span class="detail-value">${task.order_item.size} / ${task.order_item.color}</span>
                        </div>
                    </div>
                    ${task.notes ? `
                        <div class="task-notes">
                            <i class="fas fa-comment-alt"></i>
                            ${task.notes}
                        </div>
                    ` : ''}
                </div>
                
                <div class="task-footer">
                    <div class="assigned-to" title="Assigned Employee">
                        <div class="employee-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <span>${task.employee_name || 'Unassigned'}</span>
                    </div>
                    <div class="task-time" title="${timeInfo.tooltip}">
                        <i class="${timeInfo.icon}"></i>
                        ${timeInfo.text}
                    </div>
                </div>
            </div>
            <div class="task-card-overlay">
                <span class="view-details">
                    <i class="fas fa-search"></i> View Details
                </span>
            </div>
        `);

        // Add click handler for the entire card
        card.on('click', (e) => {
            // Prevent click if we're dragging
            if (card.hasClass('dragging')) return;
            
            // Don't trigger click when clicking action buttons
            if ($(e.target).closest('.task-actions').length) return;
            
            this.showTaskDetails(task);
        });

        // Add keyboard support for accessibility
        card.on('keypress', (e) => {
            if (e.which === 13 || e.which === 32) { // Enter or Space key
                e.preventDefault();
                this.showTaskDetails(task);
            }
        });

        // Add hover effect styles
        card.hover(
            function() {
                $(this).addClass('task-card-hover');
            },
            function() {
                $(this).removeClass('task-card-hover');
            }
        );
        
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
            const loadingNotification = DevExpress.ui.notify({
                message: 'Updating task status...',
                type: 'info',
                displayTime: 1000,
                position: { at: 'top center', my: 'top center' }
            });

            await zentra.updateTaskStatus(taskId, newStatus);
            
            // Refresh the view
            await this.loadData();
            
            DevExpress.ui.notify({
                message: 'Task status updated successfully',
                type: 'success',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        } catch (error) {
            console.error('Error updating task status:', error);
            DevExpress.ui.notify({
                message: 'Failed to update task status: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
            
            // Refresh the view to revert any UI changes
            await this.loadData();
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
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
                overflow: hidden;
            }
            
            .task-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .task-card:active {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .task-card:focus {
                outline: none;
                box-shadow: 0 0 0 2px #4299e1;
            }
            
            .task-card-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(66, 153, 225, 0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .task-card:hover .task-card-overlay {
                opacity: 1;
            }
            
            .view-details {
                background: rgba(255, 255, 255, 0.9);
                padding: 0.5rem 1rem;
                border-radius: 20px;
                color: #4299e1;
                font-size: 0.875rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                transform: translateY(5px);
                transition: transform 0.2s ease;
            }
            
            .task-card:hover .view-details {
                transform: translateY(0);
            }
            
            .task-actions {
                position: relative;
                z-index: 2;
            }
            
            .task-actions .btn-icon {
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }
            
            .task-actions .btn-icon:hover {
                opacity: 1;
                background: rgba(66, 153, 225, 0.1);
            }
            
            .task-card.dragging {
                opacity: 0.9;
                transform: rotate(2deg) scale(1.02);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }
            
            .task-card.dragging .task-card-overlay {
                display: none;
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

            /* Task Modal Styles */
            #taskDetailsModal .modal-content {
                border: none;
                border-radius: 0.75rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }

            #taskDetailsModal .modal-dialog {
                max-width: 90%;
                margin: 1.75rem auto;
            }

            #taskDetailsModal .modal-body {
                padding: 1.5rem;
                max-height: calc(90vh - 210px);
                overflow-y: auto;
            }

            #taskDetailsModal .task-details-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
            }

            #taskDetailsModal .detail-section.task-info {
                grid-column: 1 / -1;
            }

            #taskDetailsModal .detail-section.timeline-section {
                grid-column: 1 / 2;
            }

            #taskDetailsModal .detail-section.notes-section {
                grid-column: 2 / 3;
            }

            @media (max-width: 1200px) {
                #taskDetailsModal .modal-dialog {
                    max-width: 95%;
                }
                
                #taskDetailsModal .task-details-grid {
                    grid-template-columns: 1fr;
                }

                #taskDetailsModal .detail-section.timeline-section,
                #taskDetailsModal .detail-section.notes-section {
                    grid-column: 1 / -1;
                }
            }

            #taskDetailsModal .modal-header {
                background: #5e72e4;
                color: white;
                border-radius: 0.75rem 0.75rem 0 0;
                padding: 1.5rem;
                align-items: center;
            }

            #taskDetailsModal .modal-title-wrapper {
                display: flex;
                align-items: center;
                gap: 1.25rem;
            }

            #taskDetailsModal .task-type-badge {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
            }

            #taskDetailsModal .modal-title-group {
                display: flex;
                flex-direction: column;
                gap: 0.375rem;
            }

            #taskDetailsModal .modal-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: white;
            }

            #taskDetailsModal .task-meta {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            #taskDetailsModal .task-id {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.8);
                font-weight: 500;
            }

            #taskDetailsModal .btn-close {
                color: white;
                opacity: 0.8;
                transition: opacity 0.2s;
            }

            #taskDetailsModal .btn-close:hover {
                opacity: 1;
            }

            #taskDetailsModal .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.25rem;
            }

            #taskDetailsModal .section-header h6 {
                margin: 0;
                font-size: 0.875rem;
                font-weight: 600;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            #taskDetailsModal .section-badge {
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            #taskDetailsModal .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.25rem;
            }

            #taskDetailsModal .info-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            #taskDetailsModal .info-item .label {
                font-size: 0.75rem;
                color: #8898aa;
                font-weight: 500;
            }

            #taskDetailsModal .info-item .value {
                font-weight: 500;
                color: #32325d;
            }

            #taskDetailsModal .timeline {
                position: relative;
                padding-left: 2rem;
            }

            #taskDetailsModal .timeline::before {
                content: '';
                position: absolute;
                left: 8px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #e9ecef;
            }

            #taskDetailsModal .timeline-item {
                position: relative;
                padding-bottom: 1.5rem;
            }

            #taskDetailsModal .timeline-item::before {
                content: '';
                position: absolute;
                left: -2rem;
                top: 0;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid #fff;
                background: #5e72e4;
            }

            #taskDetailsModal .timeline-item.started::before {
                background: #fb6340;
            }

            #taskDetailsModal .timeline-item.completed::before {
                background: #2dce89;
            }

            #taskDetailsModal .timeline-content {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
            }

            #taskDetailsModal .timeline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            #taskDetailsModal .timeline-action {
                font-weight: 600;
                color: #32325d;
            }

            #taskDetailsModal .timeline-time {
                font-size: 0.75rem;
                color: #8898aa;
            }

            #taskDetailsModal .timeline-details {
                font-size: 0.875rem;
                color: #525f7f;
            }

            #taskDetailsModal .notes-container {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 1rem;
            }

            #taskDetailsModal .note-item {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            #taskDetailsModal .note-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            #taskDetailsModal .note-author {
                font-weight: 500;
                color: #32325d;
            }

            #taskDetailsModal .note-time {
                font-size: 0.75rem;
                color: #8898aa;
            }

            #taskDetailsModal .note-content {
                font-size: 0.875rem;
                color: #525f7f;
                line-height: 1.5;
            }

            #taskDetailsModal .modal-footer {
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                border-radius: 0 0 0.75rem 0.75rem;
                padding: 1.25rem 1.5rem;
                display: flex;
                align-items: center;
            }

            #taskDetailsModal .footer-info {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                margin-right: auto;
            }

            #taskDetailsModal .status-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            #taskDetailsModal .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            #taskDetailsModal .status-text {
                font-size: 0.875rem;
                font-weight: 500;
            }

            #taskDetailsModal .time-info {
                font-size: 0.875rem;
                color: #8898aa;
            }

            #taskDetailsModal .action-buttons {
                display: flex;
                gap: 0.75rem;
            }

            #taskDetailsModal .action-buttons .btn {
                padding: 0.625rem 1.25rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }

            #taskDetailsModal .action-buttons .btn i {
                font-size: 0.875rem;
            }

            #taskDetailsModal .note-input-wrapper {
                margin-top: 1rem;
            }

            #taskDetailsModal .note-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }

            @media (max-width: 768px) {
                #taskDetailsModal .task-details-grid {
                    grid-template-columns: 1fr;
                }

                #taskDetailsModal .info-grid {
                    grid-template-columns: 1fr;
                }

                #taskDetailsModal .modal-footer {
                    flex-direction: column;
                    gap: 1rem;
            }

                #taskDetailsModal .footer-info {
                    width: 100%;
                    justify-content: space-between;
                }

                #taskDetailsModal .action-buttons {
                    width: 100%;
                    flex-wrap: wrap;
                }

                #taskDetailsModal .action-buttons .btn {
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
        const self = this;
        
        // Initialize filter state
        const filterState = {
            searchText: '',
            status: [],
            types: [],
            employee: '',
            dateFrom: '',
            dateTo: ''
        };

        // Helper function to update active filters display
        const updateActiveFilters = () => {
            const activeFilters = [];
            let count = 0;

            if (filterState.searchText) {
                activeFilters.push({
                    type: 'Search',
                    value: filterState.searchText,
                    key: 'search'
                });
                count++;
            }

            if (filterState.status.length > 0) {
                activeFilters.push({
                    type: 'Status',
                    value: filterState.status.map(s => s.replace('_', ' ').toUpperCase()).join(', '),
                    key: 'status'
                });
                count++;
            }

            if (filterState.types.length > 0) {
                activeFilters.push({
                    type: 'Types',
                    value: filterState.types.join(', '),
                    key: 'types'
                });
                count++;
            }

            if (filterState.employee) {
                activeFilters.push({
                    type: 'Employee',
                    value: filterState.employee,
                    key: 'employee'
                });
                count++;
            }

            if (filterState.dateFrom || filterState.dateTo) {
                activeFilters.push({
                    type: 'Date Range',
                    value: `${filterState.dateFrom || 'Any'} to ${filterState.dateTo || 'Any'}`,
                    key: 'date'
                });
                count++;
            }

            $('#activeFiltersCount').text(count);
            
            const tagsHtml = activeFilters.map(filter => `
                <span class="active-filter-tag">
                    <strong>${filter.type}:</strong> ${filter.value}
                    <i class="fas fa-times remove-filter" data-filter-key="${filter.key}"></i>
                </span>
            `).join('');
            
            $('#activeFiltersTags').html(tagsHtml);

            // Update matching tasks count
            const matchingTasks = self.getFilteredTasks(filterState);
            $('#matchingTasksCount').text(matchingTasks.length);
        };
        
        const modalContent = `
            <div class="modal fade" id="filterModal" tabindex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-filter me-2"></i>
                                <h5 class="modal-title" id="filterModalLabel">Advanced Task Filters</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="filter-form">
                                <!-- Search Section -->
                                <div class="settings-section mb-4">
                                    <div class="settings-section-header">
                                        <div class="settings-section-title">
                                            <i class="fas fa-search me-2"></i>
                                            Search Tasks
                                        </div>
                                    </div>
                                    <div class="search-container p-3">
                                        <div class="input-group">
                                            <span class="input-group-text bg-light">
                                                <i class="fas fa-search"></i>
                                            </span>
                                            <input type="text" 
                                                class="form-control" 
                                                id="taskSearch" 
                                                placeholder="Search in tasks (order number, product, size, notes, etc...)"
                                                autocomplete="off">
                                            <button class="btn btn-outline-secondary" type="button" id="clearSearch">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div class="search-help text-muted mt-2">
                                            <small>
                                                <i class="fas fa-info-circle me-1"></i>
                                                Search across order numbers, products, sizes, notes, and more
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <!-- Rest of existing filter sections -->
                                ${this.getExistingFilterSections()}
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <div class="d-flex justify-content-between w-100">
                                <div class="filter-stats">
                                    <small class="text-muted">Matching Tasks: <span id="matchingTasksCount">0</span></small>
                                </div>
                                <div>
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        <i class="fas fa-times me-1"></i>
                                        Cancel
                                    </button>
                                    <button type="button" class="btn btn-primary" id="applyFilters">
                                        <i class="fas fa-check me-1"></i>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const filterStyles = `
            /* Search styles */
            .search-container {
                background: #fff;
                border-radius: 8px;
            }

            .search-container .input-group {
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            }

            .search-container .input-group-text {
                border: none;
                background: #f8f9fa;
                color: #5e72e4;
            }

            .search-container .form-control {
                border: none;
                padding: 0.75rem;
                font-size: 0.95rem;
                box-shadow: none;
            }

            .search-container .form-control:focus {
                box-shadow: none;
                background: #f8f9fa;
            }

            .search-container .btn-outline-secondary {
                border: none;
                background: transparent;
                color: #8898aa;
            }

            .search-container .btn-outline-secondary:hover {
                background: #f8f9fa;
                color: #5e72e4;
            }

            .search-help {
                font-size: 0.85rem;
                color: #8898aa;
            }

            /* Existing filter styles */
            ${this.getExistingFilterStyles()}
        `;

        // Remove existing modal and styles
        $('#filterModal, #filterStyles').remove();
        
        // Add the modal and styles to the body
        $('body').append(modalContent);
        $('head').append(`<style id="filterStyles">${filterStyles}</style>`);
        
        // Initialize the modal
        const filterModal = new bootstrap.Modal(document.getElementById('filterModal'), {
            keyboard: true,
            backdrop: true
        });
        
        this.filterModal = filterModal;

        // Bind event handlers
        $(document).on('input', '#taskSearch', function() {
            filterState.searchText = $(this).val();
            updateActiveFilters();
        });

        $(document).on('click', '#clearSearch', function() {
            $('#taskSearch').val('');
            filterState.searchText = '';
            updateActiveFilters();
        });

        // Bind existing filter handlers
        this.bindExistingFilterHandlers(filterState, updateActiveFilters);

        // Show the modal
        filterModal.show();
        
        // Initial update of active filters
        updateActiveFilters();
    }

    // Helper method to get existing filter sections HTML
    getExistingFilterSections() {
        return `
            <div class="row">
                <!-- Status Filters -->
                <div class="col-md-6">
                    <div class="form-group mb-3">
                        <label class="form-label d-flex justify-content-between">
                            <span>Status</span>
                            <small class="text-muted" id="statusCount"></small>
                        </label>
                        <div class="status-filters">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="statusPending" value="pending">
                                <label class="form-check-label" for="statusPending">
                                    <span class="status-dot bg-warning"></span> Pending
                                </label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="statusInProgress" value="in_progress">
                                <label class="form-check-label" for="statusInProgress">
                                    <span class="status-dot bg-primary"></span> In Progress
                                </label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="statusCompleted" value="completed">
                                <label class="form-check-label" for="statusCompleted">
                                    <span class="status-dot bg-success"></span> Completed
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group mb-3">
                        <label class="form-label d-flex justify-content-between">
                            <span>Task Type</span>
                            <small class="text-muted" id="typeCount"></small>
                        </label>
                        <div class="task-type-filters">
                            ${this.taskTypes.map(type => `
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="type${type}" value="${type}">
                                    <label class="form-check-label" for="type${type}">
                                        <i class="fas ${this.getTaskTypeIcon(type)} me-2"></i>
                                        ${type}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="form-group mb-3">
                        <label class="form-label">Assignment</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-user"></i>
                            </span>
                            <input type="text" class="form-control" id="employeeFilter" placeholder="Employee ID or Name">
                            <button class="btn btn-outline-secondary" type="button" id="clearEmployee">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group mb-3">
                        <label class="form-label">Date Range</label>
                        <div class="date-range-group">
                            <div class="input-group mb-2">
                                <span class="input-group-text">From</span>
                                <input type="date" class="form-control" id="dateFrom">
                                <button class="btn btn-outline-secondary" type="button" id="clearDateFrom">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="input-group">
                                <span class="input-group-text">To</span>
                                <input type="date" class="form-control" id="dateTo">
                                <button class="btn btn-outline-secondary" type="button" id="clearDateTo">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="filter-summary mt-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="active-filters">
                        <span class="text-muted">Active Filters:</span>
                        <span id="activeFiltersCount" class="badge bg-primary ms-2">0</span>
                    </div>
                    <button type="button" class="btn btn-link btn-sm text-danger" id="clearAllFilters">
                        <i class="fas fa-trash-alt me-1"></i> Clear All
                    </button>
                </div>
                <div id="activeFiltersTags" class="mt-2"></div>
            </div>
        `;
    }

    // Helper method to get existing filter styles
    getExistingFilterStyles() {
        return `
            .filter-form .status-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 4px;
            }
            /* ... rest of existing styles ... */
        `;
    }

    // Helper method to bind existing filter handlers
    bindExistingFilterHandlers(filterState, updateActiveFilters) {
        const self = this;
        
        // Status filters
        $('.status-filters input[type="checkbox"]').on('change', function() {
            const status = $(this).val();
            const index = filterState.status.indexOf(status);
            
            if (this.checked && index === -1) {
                filterState.status.push(status);
            } else if (!this.checked && index > -1) {
                filterState.status.splice(index, 1);
            }
            
            updateActiveFilters();
        });

        // Task type filters
        $('.task-type-filters input[type="checkbox"]').on('change', function() {
            const type = $(this).val();
            const index = filterState.types.indexOf(type);
            
            if (this.checked && index === -1) {
                filterState.types.push(type);
            } else if (!this.checked && index > -1) {
                filterState.types.splice(index, 1);
            }
            
            updateActiveFilters();
        });

        // Employee filter
        $('#employeeFilter').on('input', function() {
            filterState.employee = $(this).val();
            updateActiveFilters();
        });

        // Date filters
        $('#dateFrom, #dateTo').on('change', function() {
            const id = $(this).attr('id');
            filterState[id] = $(this).val();
            updateActiveFilters();
        });

        // Clear all filters
        $('#clearAllFilters').on('click', () => {
            // Reset all form inputs
            $('.filter-form input[type="checkbox"]').prop('checked', false);
            $('#employeeFilter').val('');
            $('#dateFrom').val('');
            $('#dateTo').val('');
            $('#taskSearch').val('');
            
            // Reset filter state
            filterState.status = [];
            filterState.types = [];
            filterState.employee = '';
            filterState.dateFrom = '';
            filterState.dateTo = '';
            filterState.searchText = '';
            
            // Update UI
            updateActiveFilters();
            
            // Show all tasks
            self.renderTasksByDivision(self.tasks);
            self.updateTaskStatistics(self.tasks);
        });

        // Apply filters button handler
        $('#applyFilters').on('click', () => {
            const filteredTasks = self.getFilteredTasks(filterState);
            self.renderTasksByDivision(filteredTasks);
            self.updateTaskStatistics(filteredTasks);
            
            // Hide the modal
            if (self.filterModal) {
                self.filterModal.hide();
            } else {
                $('#filterModal').modal('hide');
            }

            // Show success notification
            DevExpress.ui.notify({
                message: `Showing ${filteredTasks.length} filtered tasks`,
                type: 'success',
                displayTime: 2000,
                position: { at: 'top center', my: 'top center' }
            });
        });
    }

    // Helper method to get filtered tasks without applying them
    getFilteredTasks(filterState) {
        let filteredTasks = [...this.tasks];

        // Text search filter
        if (filterState.searchText) {
            const searchLower = filterState.searchText.toLowerCase();
            filteredTasks = filteredTasks.filter(task => {
                // Search in task details
                const searchableFields = [
                    task.task_type,
                    task.notes,
                    task.order_item?.order?.order_number,
                    task.order_item?.product_name,
                    task.order_item?.size,
                    task.order_item?.color,
                    task.employee_name,
                    `${task.order_item?.quantity} pcs`,
                    task.status
                ];
                
                return searchableFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchLower)
                );
            });
        }

        // Filter by task type
        if (filterState.types && filterState.types.length > 0) {
            filteredTasks = filteredTasks.filter(task => filterState.types.includes(task.task_type));
        }

        // Filter by status
        if (filterState.status && filterState.status.length > 0) {
            filteredTasks = filteredTasks.filter(task => filterState.status.includes(task.status));
        }

        // Filter by employee
        if (filterState.employee) {
            const employeeSearch = filterState.employee.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                (task.employee_id && task.employee_id.toString().includes(employeeSearch)) ||
                (task.employee_name && task.employee_name.toLowerCase().includes(employeeSearch))
            );
        }

        // Filter by date range
        if (filterState.dateFrom) {
            const fromDate = new Date(filterState.dateFrom);
            filteredTasks = filteredTasks.filter(task => new Date(task.created_at) >= fromDate);
        }

        if (filterState.dateTo) {
            const toDate = new Date(filterState.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filteredTasks = filteredTasks.filter(task => new Date(task.created_at) <= toDate);
        }

        return filteredTasks;
    }

    async showTaskDetails(task) {
        if (!task) return;
        
        try {
            // Show loading state
            const modalBody = $('#taskDetailsModal .modal-body');
            modalBody.html(`
                <div class="d-flex justify-content-center align-items-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `);
        
            // Show modal with loading state
            if (this.taskModal) {
                this.taskModal.show();
            } else {
                $('#taskDetailsModal').modal('show');
            }

            // Fetch fresh task data
            const freshTask = await zentra.getTask(task.id);
            if (!freshTask) {
                throw new Error('Task not found');
            }
            
            this.currentTask = freshTask;
            
            // Update header content
            $('#taskTypeBadge i').attr('class', `fas ${this.getTaskTypeIcon(freshTask.task_type)}`);
            $('#taskTitle').text(`${freshTask.task_type.toUpperCase()} Task`);
            $('#taskIdBadge').text(`#${freshTask.id}`);
        
            const statusClass = this.getStatusClass(freshTask.status);
        $('#taskStatus').html(`
            <span class="badge badge-${statusClass}">
                    ${this.getStatusIcon(freshTask.status)}
                    ${freshTask.status.replace('_', ' ').toUpperCase()}
                        </span>
        `);
        
            // Build the main content
            const mainContent = `
                <div class="task-details-grid">
                    <!-- Task Info Section -->
                    <div class="detail-section task-info">
                        <div class="section-header">
                            <h6>Task Information</h6>
                            <span class="section-badge" id="sequenceBadge">Sequence ${freshTask.sequence_number}</span>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Assigned To</span>
                                <div class="value-wrapper">
                                    <div class="employee-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <span class="value">${freshTask.employee_name || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="label">Sequence</span>
                                <span class="value">#${freshTask.sequence_number}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Created</span>
                                <span class="value">${new Date(freshTask.created_at).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Last Updated</span>
                                <span class="value">${new Date(freshTask.updated_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Order Info Section -->
                    <div class="detail-section order-info">
                        <div class="section-header">
                            <h6>Order Details</h6>
                            <span class="order-number">${freshTask.order_item?.order?.order_number || 'N/A'}</span>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Customer</span>
                                <div class="value-wrapper">
                                    <i class="fas fa-building"></i>
                                    <span class="value">${freshTask.order_item?.order?.customer_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="label">Product</span>
                                <div class="value-wrapper">
                                    <i class="fas fa-tshirt"></i>
                                    <span class="value">${freshTask.order_item?.product_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="label">Quantity</span>
                                <div class="value-wrapper">
                                    <i class="fas fa-box"></i>
                                    <span class="value">${freshTask.order_item?.quantity || 0} pcs</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="label">Due Date</span>
                                <div class="value-wrapper">
                                    <i class="fas fa-calendar"></i>
                                    <span class="value">${freshTask.order_item?.order?.expected_delivery_date ? new Date(freshTask.order_item.order.expected_delivery_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline Section -->
                    <div class="detail-section timeline-section">
                        <div class="section-header">
                            <h6>Task Timeline</h6>
                            <div class="timeline-legend">
                                <span class="legend-item">
                                    <i class="fas fa-circle text-primary"></i> Created
                                </span>
                                <span class="legend-item">
                                    <i class="fas fa-circle text-warning"></i> Started
                                </span>
                                <span class="legend-item">
                                    <i class="fas fa-circle text-success"></i> Completed
                                </span>
                            </div>
                        </div>
                        <div class="timeline" id="taskTimeline">
                            <!-- Timeline items will be added here -->
                        </div>
                    </div>

                    <!-- Notes Section -->
                    <div class="detail-section notes-section">
                        <div class="section-header">
                            <h6>Notes & Updates</h6>
                            <button class="btn btn-sm btn-primary" id="addNoteBtn">
                                <i class="fas fa-plus"></i> Add Note
                            </button>
                        </div>
                        <div class="notes-container" id="taskNotes">
                            <!-- Notes will be added here -->
                        </div>
                        <div class="note-input-wrapper" style="display: none;">
                            <textarea class="form-control" id="newNote" rows="3" placeholder="Enter your note here..."></textarea>
                            <div class="note-actions">
                                <button class="btn btn-sm btn-secondary" id="cancelNote">Cancel</button>
                                <button class="btn btn-sm btn-primary" id="saveNote">Save Note</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        
            // Update modal content
            modalBody.html(mainContent);

            // Update the dynamic sections
            this.updateTaskTimeline(freshTask);
            this.updateTaskNotes(freshTask);
            this.updateFooterInfo(freshTask);
            this.updateActionButtons(freshTask);
        
        } catch (error) {
            console.error('Error showing task details:', error);
            DevExpress.ui.notify({
                message: 'Failed to load task details: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
            
        if (this.taskModal) {
                this.taskModal.hide();
        } else {
                $('#taskDetailsModal').modal('hide');
            }
        }
    }

    updateFooterInfo(task) {
        // Update status indicator
        const statusClass = this.getStatusClass(task.status);
        const statusColors = {
            'warning': '#fb6340',
            'primary': '#5e72e4',
            'success': '#2dce89'
        };
        
        $('#statusDot').css('background-color', statusColors[statusClass]);
        $('#statusText').text(task.status.replace('_', ' ').toUpperCase());
        
        // Update time info
        const timeInfo = this.formatTaskTime(task);
        $('#timeInfo').html(`<i class="${timeInfo.icon}"></i> ${timeInfo.text}`);
    }

    updateTaskTimeline(task) {
        const timeline = $('#taskTimeline');
        timeline.empty();
        
        // Add creation event
        timeline.append(`
                            <div class="timeline-item">
                                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-action">Task Created</span>
                        <span class="timeline-time">${new Date(task.created_at).toLocaleString()}</span>
                                </div>
                    <div class="timeline-details">
                        Created by ${task.created_by}
                            </div>
                                    </div>
                                </div>
        `);
        
        // Add started event if applicable
        if (task.started_at) {
            timeline.append(`
                <div class="timeline-item started">
                                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-action">Task Started</span>
                            <span class="timeline-time">${new Date(task.started_at).toLocaleString()}</span>
                                    </div>
                        <div class="timeline-details">
                            Started by ${task.employee_name}
                                </div>
                        </div>
                    </div>
            `);
        }
        
        // Add completed event if applicable
        if (task.completed_at) {
            timeline.append(`
                <div class="timeline-item completed">
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-action">Task Completed</span>
                            <span class="timeline-time">${new Date(task.completed_at).toLocaleString()}</span>
                            </div>
                        <div class="timeline-details">
                            Completed by ${task.employee_name}
                            </div>
                        </div>
                    </div>
            `);
        }
    }

    updateTaskNotes(task) {
        const notesContainer = $('#taskNotes');
        notesContainer.empty();
        
        if (task.notes) {
            notesContainer.append(`
                <div class="note-item">
                    <div class="note-header">
                        <span class="note-author">${task.employee_name || 'System'}</span>
                        <span class="note-time">${new Date(task.updated_at).toLocaleString()}</span>
                    </div>
                    <div class="note-content">${task.notes}</div>
                </div>
            `);
        } else {
            notesContainer.append(`
                <div class="empty-notes">
                    <p class="text-muted text-center">No notes available</p>
                </div>
            `);
        }

        // Set up note input handlers
        $('#addNoteBtn').off('click').on('click', () => {
            $('.note-input-wrapper').slideDown();
            $('#newNote').focus();
        });

        $('#cancelNote').off('click').on('click', () => {
            $('.note-input-wrapper').slideUp();
            $('#newNote').val('');
        });

        $('#saveNote').off('click').on('click', () => {
            const noteText = $('#newNote').val().trim();
            if (noteText) {
                this.addNoteToTask(task.id, noteText);
            }
        });
    }

    updateActionButtons(task) {
        const startBtn = $('#startTask');
        const completeBtn = $('#completeTask');
        
        // Show/hide buttons based on task status
        startBtn.toggle(task.status === 'pending');
        completeBtn.toggle(task.status === 'in_progress');
        
        // Update button states
        startBtn.prop('disabled', task.status === 'completed');
        completeBtn.prop('disabled', task.status === 'completed');

        // Add click handlers
        startBtn.off('click').on('click', () => this.handleStartTask(task.id));
        completeBtn.off('click').on('click', () => this.handleCompleteTask(task.id));
    }

    async handleStartTask(taskId) {
        try {
            // Disable buttons and show loading state
            const startBtn = $('#startTask');
            const originalText = startBtn.html();
            startBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Starting...');

            // Show loading notification
            DevExpress.ui.notify({
                message: 'Starting task...',
                type: 'info',
                displayTime: 1000,
                position: { at: 'top center', my: 'top center' }
            });

            // Call API to start task
            await zentra.startTask(taskId);
            
            // Refresh data and show success message
            await this.loadData();
            
            DevExpress.ui.notify({
                message: 'Task started successfully',
                type: 'success',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });

            // Refresh modal content with updated task
            const updatedTask = await zentra.getTask(taskId);
            if (updatedTask) {
                this.showTaskDetails(updatedTask);
            }

        } catch (error) {
            console.error('Error starting task:', error);
            DevExpress.ui.notify({
                message: 'Failed to start task: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        }
    }

    async handleCompleteTask(taskId) {
        try {
            // Disable buttons and show loading state
            const completeBtn = $('#completeTask');
            const originalText = completeBtn.html();
            completeBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Completing...');

            // Show loading notification
            DevExpress.ui.notify({
                message: 'Completing task...',
                type: 'info',
                displayTime: 1000,
                position: { at: 'top center', my: 'top center' }
            });

            // Call API to complete task
            await zentra.completeTask(taskId);
            
            // Refresh data and show success message
            await this.loadData();
            
            DevExpress.ui.notify({
                message: 'Task completed successfully',
                type: 'success',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });

            // Refresh modal content with updated task
            const updatedTask = await zentra.getTask(taskId);
            if (updatedTask) {
                this.showTaskDetails(updatedTask);
            }

        } catch (error) {
            console.error('Error completing task:', error);
            DevExpress.ui.notify({
                message: 'Failed to complete task: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        }
    }

    getTaskTypeIcon(taskType) {
        const icons = {
            'layout': 'fa-object-group',
            'printing': 'fa-print',
            'cutting': 'fa-cut',
            'sewing': 'fa-thread',
            'pressing': 'fa-iron',
            'finishing': 'fa-check-double',
            'quality_check': 'fa-clipboard-check'
        };
        return icons[taskType.toLowerCase()] || 'fa-tasks';
    }

    getStatusIcon(status) {
        const icons = {
            'pending': '<i class="fas fa-clock"></i>',
            'in_progress': '<i class="fas fa-spinner fa-spin"></i>',
            'completed': '<i class="fas fa-check"></i>'
        };
        return icons[status] || '<i class="fas fa-circle"></i>';
    }

    async addNoteToTask(taskId, noteText) {
        try {
            // Show loading state
            const saveButton = $('#saveNote');
            const originalText = saveButton.html();
            saveButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

            // Show loading notification
            DevExpress.ui.notify({
                message: 'Adding note...',
                type: 'info',
                displayTime: 1000,
                position: { at: 'top center', my: 'top center' }
            });

            await zentra.addTaskNote(taskId, noteText);
            
            // Refresh the data
            await this.loadData();
            
            // Reset the note input
            $('#newNote').val('');
            $('.note-input-wrapper').slideUp();
            
            // Show success notification
            DevExpress.ui.notify({
                message: 'Note added successfully',
                type: 'success',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });

            // If we're in the task details modal, refresh the notes section
            if (this.currentTask && this.currentTask.id === taskId) {
                this.showTaskDetails(this.currentTask);
            }
        } catch (error) {
            console.error('Error adding note:', error);
            DevExpress.ui.notify({
                message: 'Failed to add note: ' + (error.message || 'Unknown error'),
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center' }
            });
        } finally {
            // Reset the save button
            const saveButton = $('#saveNote');
            saveButton.prop('disabled', false).html(originalText);
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

        // Update the task details modal for reassignment
        $('#taskTitle').text('Reassign Task');
        $('#taskDetailsModal .modal-body').html(content);
        
        // Update footer buttons
        $('#taskDetailsModal .action-buttons').html(`
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmReassign">Reassign</button>
        `);

        // Bind reassign button click
        $('#confirmReassign').on('click', () => {
                    const employeeId = $('#employeeId').val();
                    if (employeeId) {
                        this.reassignTask(taskId, employeeId);
                if (this.taskModal) {
                    this.taskModal.hide();
                } else {
                    $('#taskDetailsModal').modal('hide');
                    }
            } else {
                    DevExpress.ui.notify('Please enter an employee ID', 'warning', 3000);
            }
        });

        // Show the Bootstrap modal
        if (this.taskModal) {
            this.taskModal.show();
        } else {
            $('#taskDetailsModal').modal('show');
        }
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

    initializeSettings() {
        // Bind settings button click
        $(document).on('click', '#viewSettings', () => {
            this.showSettingsModal();
        });
    }

    showSettingsModal() {
        const self = this;
        
        const modalContent = `
            <div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="settingsModalLabel">
                                <i class="fas fa-cog me-2"></i>
                                Task Board Settings
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="settings-form">
                                <!-- Task Types Section -->
                                <div class="settings-section mb-4">
                                    <div class="settings-section-header">
                                        <div class="settings-section-title">
                                            <i class="fas fa-layer-group me-2"></i>
                                            Task Types Visibility
                                        </div>
                                        <button class="btn btn-outline-primary btn-sm" id="toggleAllTypes">
                                            <i class="fas fa-check-double me-1"></i>
                                            Toggle All
                                        </button>
                                    </div>
                                    <div class="task-types-list">
                                        ${this.taskTypes.map(type => `
                                            <div class="task-type-item">
                                                <label class="custom-checkbox">
                                                    <input type="checkbox" 
                                                        id="show${type}" 
                                                        value="${type}" 
                                                        ${this.getTypeVisibility(type) ? 'checked' : ''}>
                                                    <span class="checkmark"></span>
                                                    <span class="type-icon">
                                                        <i class="fas ${this.getTaskTypeIcon(type)}"></i>
                                                    </span>
                                                    <span class="type-label">${type}</span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <!-- Display Options Section -->
                                <div class="settings-section mb-4">
                                    <div class="settings-section-header">
                                        <div class="settings-section-title">
                                            <i class="fas fa-desktop me-2"></i>
                                            Display Options
                                        </div>
                                    </div>
                                    <div class="display-options">
                                        <label class="custom-checkbox">
                                            <input type="checkbox" id="showCompletedTasks" 
                                                ${this.getSettingValue('showCompletedTasks', true) ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <span class="option-icon">
                                                <i class="fas fa-check-circle"></i>
                                            </span>
                                            <span class="option-label">Show Completed Tasks</span>
                                        </label>
                                        <label class="custom-checkbox">
                                            <input type="checkbox" id="showTaskCounts" 
                                                ${this.getSettingValue('showTaskCounts', true) ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <span class="option-icon">
                                                <i class="fas fa-hashtag"></i>
                                            </span>
                                            <span class="option-label">Show Task Counts</span>
                                        </label>
                                        <label class="custom-checkbox">
                                            <input type="checkbox" id="enableAnimations" 
                                                ${this.getSettingValue('enableAnimations', true) ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <span class="option-icon">
                                                <i class="fas fa-magic"></i>
                                            </span>
                                            <span class="option-label">Enable Animations</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Auto Refresh Section -->
                                <div class="settings-section">
                                    <div class="settings-section-header">
                                        <div class="settings-section-title">
                                            <i class="fas fa-sync-alt me-2"></i>
                                            Auto Refresh
                                        </div>
                                    </div>
                                    <div class="refresh-option">
                                        <select class="form-select" id="refreshInterval">
                                            <option value="0" ${this.getSettingValue('refreshInterval', '0') === '0' ? 'selected' : ''}>
                                                <i class="fas fa-clock"></i> Manual Refresh
                                            </option>
                                            <option value="30" ${this.getSettingValue('refreshInterval', '0') === '30' ? 'selected' : ''}>Every 30 seconds</option>
                                            <option value="60" ${this.getSettingValue('refreshInterval', '0') === '60' ? 'selected' : ''}>Every minute</option>
                                            <option value="300" ${this.getSettingValue('refreshInterval', '0') === '300' ? 'selected' : ''}>Every 5 minutes</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>
                                Cancel
                            </button>
                            <button type="button" class="btn btn-primary" id="saveSettings">
                                <i class="fas fa-save me-1"></i>
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const settingsStyles = `
            .settings-form {
                padding: 0.5rem;
            }

            .settings-section {
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            }

            .settings-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .settings-section-title {
                font-size: 1rem;
                font-weight: 600;
                color: #32325d;
                display: flex;
                align-items: center;
            }

            .settings-section-title i {
                color: #5e72e4;
                font-size: 1.1rem;
            }

            .task-types-list {
                max-height: 200px;
                overflow-y: auto;
                padding: 0.75rem;
            }

            .task-type-item {
                padding: 0.5rem;
                border-radius: 6px;
                transition: background-color 0.2s;
            }

            .task-type-item:hover {
                background-color: #f8f9fa;
            }

            .custom-checkbox {
                display: flex;
                align-items: center;
                padding: 0.5rem;
                cursor: pointer;
                user-select: none;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .custom-checkbox:hover {
                background: #f8f9fa;
            }

            .custom-checkbox input {
                position: absolute;
                opacity: 0;
                cursor: pointer;
            }

            .checkmark {
                position: relative;
                height: 20px;
                width: 20px;
                background-color: #fff;
                border: 2px solid #e9ecef;
                border-radius: 4px;
                margin-right: 12px;
                transition: all 0.2s;
            }

            .custom-checkbox:hover .checkmark {
                border-color: #5e72e4;
            }

            .custom-checkbox input:checked ~ .checkmark {
                background-color: #5e72e4;
                border-color: #5e72e4;
            }

            .checkmark:after {
                content: "";
                position: absolute;
                display: none;
                left: 6px;
                top: 2px;
                width: 5px;
                height: 10px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }

            .custom-checkbox input:checked ~ .checkmark:after {
                display: block;
            }

            .type-icon, .option-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: rgba(94, 114, 228, 0.1);
                border-radius: 6px;
                margin-right: 12px;
                color: #5e72e4;
            }

            .type-label, .option-label {
                color: #525f7f;
                font-weight: 500;
            }

            .display-options {
                padding: 0.75rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .refresh-option {
                padding: 0.75rem;
            }

            .form-select {
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 0.75rem;
                font-size: 0.875rem;
                color: #525f7f;
                background-color: #fff;
                transition: all 0.2s;
            }

            .form-select:focus {
                border-color: #5e72e4;
                box-shadow: 0 0 0 0.2rem rgba(94, 114, 228, 0.25);
            }

            .modal-header {
                border-bottom: 0;
            }

            .modal-header .modal-title {
                font-size: 1.1rem;
                font-weight: 600;
            }

            .modal-footer {
                border-top: 1px solid #e9ecef;
            }

            .btn-outline-primary {
                color: #5e72e4;
                border-color: #5e72e4;
                background: transparent;
                font-size: 0.875rem;
                padding: 0.5rem 1rem;
                transition: all 0.2s;
            }

            .btn-outline-primary:hover {
                color: #fff;
                background: #5e72e4;
            }

            /* Custom scrollbar for task types list */
            .task-types-list::-webkit-scrollbar {
                width: 6px;
            }

            .task-types-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .task-types-list::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .task-types-list::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            /* Animation for modal */
            .modal.fade .modal-dialog {
                transform: scale(0.95);
                transition: transform 0.2s ease-out;
            }

            .modal.show .modal-dialog {
                transform: scale(1);
            }
        `;

        // Remove existing modal and styles if any
        $('#settingsModal, #settingsStyles').remove();

        // Add modal and styles to the page
        $('body').append(modalContent);
        $('head').append(`<style id="settingsStyles">${settingsStyles}</style>`);

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'), {
            keyboard: true,
            backdrop: true
        });

        // Toggle all types handler
        $('#toggleAllTypes').on('click', function() {
            const checkboxes = $('.task-types-list input[type="checkbox"]');
            const allChecked = checkboxes.length === checkboxes.filter(':checked').length;
            checkboxes.prop('checked', !allChecked);
        });

        // Save settings handler
        $('#saveSettings').on('click', () => {
            // Save task type visibility
            const visibleTypes = {};
            $('.task-types-list input[type="checkbox"]').each(function() {
                visibleTypes[$(this).val()] = $(this).is(':checked');
            });
            localStorage.setItem('taskTypeVisibility', JSON.stringify(visibleTypes));

            // Save other settings
            const settings = {
                showCompletedTasks: $('#showCompletedTasks').is(':checked'),
                showTaskCounts: $('#showTaskCounts').is(':checked'),
                enableAnimations: $('#enableAnimations').is(':checked'),
                refreshInterval: $('#refreshInterval').val()
            };
            localStorage.setItem('taskBoardSettings', JSON.stringify(settings));

            // Apply settings
            this.applySettings();

            // Hide modal
            modal.hide();

            // Show success message
            DevExpress.ui.notify({
                message: 'Settings saved successfully',
                type: 'success',
                displayTime: 2000,
                position: { at: 'top center', my: 'top center' }
            });

            // Refresh the view
            this.loadData();
        });

        // Show the modal
        modal.show();
    }

    getTypeVisibility(type) {
        const visibility = localStorage.getItem('taskTypeVisibility');
        if (visibility) {
            const visibleTypes = JSON.parse(visibility);
            return visibleTypes[type] !== false; // Default to true if not set
        }
        return true; // Default visibility is true
    }

    getSettingValue(key, defaultValue) {
        const settings = localStorage.getItem('taskBoardSettings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            return parsedSettings[key] !== undefined ? parsedSettings[key] : defaultValue;
        }
        return defaultValue;
    }

    applySettings() {
        // Apply animations setting
        if (this.getSettingValue('enableAnimations', true)) {
            $('body').removeClass('no-animations');
        } else {
            $('body').addClass('no-animations');
        }

        // Apply task counts visibility
        if (this.getSettingValue('showTaskCounts', true)) {
            $('.task-count').show();
        } else {
            $('.task-count').hide();
        }

        // Apply completed tasks visibility
        if (!this.getSettingValue('showCompletedTasks', true)) {
            $('.status-column[data-status="completed"]').hide();
        } else {
            $('.status-column[data-status="completed"]').show();
        }

        // Handle auto-refresh
        const interval = parseInt(this.getSettingValue('refreshInterval', '0'));
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (interval > 0) {
            this.refreshInterval = setInterval(() => this.loadData(), interval * 1000);
        }
    }
}

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined') {
    window.taskPageInstance = new TaskPage();
}