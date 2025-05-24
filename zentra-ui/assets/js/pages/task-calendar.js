import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define TaskCalendarPage
window.TaskCalendarPage = class {
    constructor() {
        this.calendar = null;
        this.tasks = [];
        this.currentTask = null;
        this.currentView = 'calendar'; // Add view tracking
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Task Status Badges */
            .task-status {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .task-status.completed {
                background-color: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .task-status.in_progress {
                background-color: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }

            .task-status.pending {
                background-color: rgba(245, 54, 92, 0.1);
                color: #f5365c;
            }

            /* Task ID Badge */
            .task-id-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background-color: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            .task-id-badge i {
                margin-right: 0.5rem;
            }

            /* Assigned To Badge */
            .assigned-to {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background-color: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            .assigned-to i {
                margin-right: 0.5rem;
            }

            /* Calendar Styles */
            .dx-calendar-cell {
                position: relative;
            }

            .dx-calendar-cell.has-tasks::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: #5e72e4;
            }

            .dx-calendar-cell.has-completed-tasks::after {
                background: #2dce89;
            }

            .dx-calendar-cell.has-in-progress-tasks::after {
                background: #fb6340;
            }

            .dx-calendar-cell.has-pending-tasks::after {
                background: #f5365c;
            }

            /* Task Tooltip */
            .task-tooltip {
                position: absolute;
                background: white;
                border-radius: 4px;
                padding: 8px;
                box-shadow: 0 2px 4px rgba(50, 50, 93, 0.1);
                z-index: 1000;
                min-width: 200px;
            }

            .task-tooltip-header {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .task-tooltip-content {
                font-size: 0.875rem;
                color: #8898aa;
            }
        `)
        .appendTo('head');
    }

    dispose() {
        if (this.calendar) {
            this.calendar.dispose();
            this.calendar = null;
        }
        // Clean up event listeners
        $('#startTask').off('click');
        $('#completeTask').off('click');
        $('#reassignTask').off('click');
        $('#addNote').off('click');
        $('#taskDetailsModal').off('show.bs.modal');
        $('#taskDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#taskDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const taskId = button.data('task-id');
            if (taskId) {
                this.loadTaskDetails(taskId);
            }
        });

        $('#taskDetailsModal').on('hide.bs.modal', () => {
            this.currentTask = null;
            this.clearTaskDetails();
        });

        // Action buttons
        $('#startTask').on('click', () => {
            if (this.currentTask) {
                this.startTask(this.currentTask);
            }
        });

        $('#completeTask').on('click', () => {
            if (this.currentTask) {
                this.completeTask(this.currentTask);
            }
        });

        $('#reassignTask').on('click', () => {
            if (this.currentTask) {
                this.showReassignDialog(this.currentTask);
            }
        });

        $('#addNote').on('click', () => {
            if (this.currentTask) {
                this.showAddNoteDialog(this.currentTask);
            }
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Add view switching handlers
        $('#viewCalendar').on('click', () => this.switchView('calendar'));
        $('#viewKanban').on('click', () => this.switchView('kanban'));
    }

    initialize() {
        this.initializeCalendar();
        this.loadData();
    }

    initializeCalendar() {
        const calendarElement = $('#taskCalendar');
        if (!calendarElement.length) {
            console.error('Task calendar element not found');
            return;
        }

        if (this.calendar) {
            this.calendar.dispose();
        }

        // Calculate optimal dimensions
        const containerHeight = Math.max(800, window.innerHeight - 400);
        calendarElement.height(containerHeight);

        this.calendar = $('#taskCalendar').dxCalendar({
            value: new Date(),
            firstDayOfWeek: 1,
            min: new Date(2025, 0, 1),
            max: new Date(2026, 0, 1),
            height: '100%',
            width: '100%',
            cellTemplate: (itemData, itemIndex, element) => {
                const date = itemData.date;
                const tasks = this.getTasksForDate(date);
                const isToday = this.isToday(date);

                // Create cell content
                const $cell = $('<div>').addClass('calendar-cell-content');
                
                // Add date number with task count
                const $dateHeader = $('<div>').addClass('calendar-date');
                $dateHeader.append($('<span>').text(date.getDate()));
                
                if (tasks.length > 0) {
                    $dateHeader.append(
                        $('<div>')
                            .addClass('task-count-indicator')
                            .append($('<i>').addClass('fas fa-tasks'))
                            .append($('<span>').text(tasks.length))
                    );
                }
                
                $cell.append($dateHeader);
                
                // Add tasks container
                const $taskContainer = $('<div>').addClass('calendar-tasks');
                
                if (tasks.length > 0) {
                    // Group tasks by type
                    const tasksByType = this.groupTasksByType(tasks);
                    const MAX_TASKS_PER_TYPE = 3;
                    
                    // Add task items by type
                    Object.entries(tasksByType).forEach(([type, typeTasks]) => {
                        const visibleTasks = typeTasks.slice(0, MAX_TASKS_PER_TYPE);
                        const remainingTasks = typeTasks.length - MAX_TASKS_PER_TYPE;
                        
                        visibleTasks.forEach(task => {
                            const $task = $('<div>')
                                .addClass(`calendar-task-item ${type.toLowerCase()}`)
                                .html(this.createTaskItem(task))
                                .on('click', (e) => {
                                    e.stopPropagation();
                                    this.showTaskDetails(task);
                                });
                            
                            $taskContainer.append($task);
                        });
                        
                        // Add "more tasks" indicator if needed
                        if (remainingTasks > 0) {
                            const $more = $('<div>')
                                .addClass('more-tasks-indicator')
                                .html(`<i class="fas fa-plus-circle mr-1"></i>${remainingTasks} more ${type.toLowerCase()} tasks`)
                                .on('click', (e) => {
                                    e.stopPropagation();
                                    this.showTaskList(typeTasks);
                                });
                            
                            $taskContainer.append($more);
                        }
                    });
                } else {
                    // Add empty state
                    $taskContainer.append(`
                        <div class="calendar-empty-state">
                            <i class="fas fa-calendar-day"></i>
                            <span>No tasks scheduled</span>
                        </div>
                    `);
                }
                
                $cell.append($taskContainer);
                element.append($cell);

                // Add today indicator
                if (isToday) {
                    element.addClass('calendar-cell-today');
                }

                // Add status indicators
                if (tasks.length > 0) {
                    element.append(this.getDayStatusIndicators(tasks));
                }
            }
        }).dxCalendar('instance');

        // Handle window resize
        $(window).on('resize', () => {
            const newHeight = Math.max(800, window.innerHeight - 400);
            calendarElement.height(newHeight);
            this.calendar.repaint();
        });
    }

    groupTasksByType(tasks) {
        return tasks.reduce((acc, task) => {
            const type = task.task_type.toUpperCase();
            if (!acc[type]) acc[type] = [];
            acc[type].push(task);
            return acc;
        }, {});
    }

    getDetailedTaskStatus(tasks) {
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        
        return `
            <div class="status-counts">
                <span class="status-item text-success">
                    <i class="fas fa-check-circle"></i>
                    ${completed} completed
                </span>
                <span class="status-item text-warning">
                    <i class="fas fa-clock"></i>
                    ${inProgress} in progress
                </span>
                <span class="status-item text-danger">
                    <i class="fas fa-hourglass-start"></i>
                    ${pending} pending
                </span>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;

        $('#totalTasks').text(total);
        $('#completedTasks').text(completed);
        $('#inProgressTasks').text(inProgress);
        $('#pendingTasks').text(pending);

        // Update rates
        const completionRate = total ? Math.round((completed / total) * 100) : 0;
        const progressRate = total ? Math.round((inProgress / total) * 100) : 0;
        const delayRate = total ? Math.round((pending / total) * 100) : 0;

        $('#completionRate').text(`${completionRate}%`);
        $('#progressRate').text(`${progressRate}%`);
        $('#delayRate').text(`${delayRate}%`);

        // Update Kanban column counts
        this.updateKanbanCounts();
    }

    updateKanbanCounts() {
        const tasksByType = this.groupTasksByType(this.tasks);
        
        Object.entries(tasksByType).forEach(([type, tasks]) => {
            const column = $(`.kanban-column[data-type="${type.toLowerCase()}"]`);
            if (column.length) {
                column.find('.task-count').text(tasks.length);
            }
        });
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    async loadData() {
        try {
            console.log('Loading tasks...');
            const tasks = await zentra.getTasks();
            console.log('Loaded tasks:', tasks);

            this.tasks = tasks.map(task => ({
                ...task,
                // Convert string dates to Date objects
                started_at: task.started_at ? new Date(task.started_at) : null,
                completed_at: task.completed_at ? new Date(task.completed_at) : null,
                created_at: new Date(task.created_at),
                updated_at: new Date(task.updated_at),
                // Add display properties
                displayDate: this.getTaskDisplayDate(task),
                displayStatus: this.getTaskDisplayStatus(task)
            }));

            console.log('Processed tasks:', this.tasks);
            this.updateStats();
            
            // Update current view
            if (this.currentView === 'calendar') {
                this.calendar.repaint();
            } else {
                this.updateKanbanBoard();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            DevExpress.ui.notify('Failed to load tasks', 'error', 3000);
        }
    }

    getTaskDisplayDate(task) {
        // Prioritize dates based on task status
        if (task.completed_at) return new Date(task.completed_at);
        if (task.started_at) return new Date(task.started_at);
        if (task.order_item?.order?.expected_delivery_date) return new Date(task.order_item.order.expected_delivery_date);
        return new Date(task.created_at);
    }

    getTaskDisplayStatus(task) {
        if (task.status === 'completed') return 'completed';
        if (task.status === 'in_progress') return 'in_progress';
        
        // Check if task is overdue
        const today = new Date();
        const deliveryDate = task.order_item?.order?.expected_delivery_date ? 
            new Date(task.order_item.order.expected_delivery_date) : null;
        
        if (deliveryDate) {
            // If delivery date is past, mark as overdue
            if (deliveryDate < today) {
                return 'overdue';
            }
            
            // If delivery date is within 3 days, mark as due-soon
            const daysUntilDue = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 3) {
                return 'due-soon';
            }
        }
        
        return 'pending';
    }

    getDeadlineIndicator(task) {
        const today = new Date();
        const deliveryDate = task.order_item?.order?.expected_delivery_date ? 
            new Date(task.order_item.order.expected_delivery_date) : null;
        
        if (!deliveryDate) return '';
        
        const daysUntilDue = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
            return `
                <div class="deadline-indicator overdue">
                    <i class="fas fa-exclamation-circle"></i>
                    ${Math.abs(daysUntilDue)} days overdue
                </div>
            `;
        }
        
        if (daysUntilDue <= 3) {
            return `
                <div class="deadline-indicator due-soon">
                    <i class="fas fa-clock"></i>
                    Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}
                </div>
            `;
        }
        
        return `
            <div class="deadline-indicator on-track">
                <i class="fas fa-calendar-check"></i>
                Due in ${daysUntilDue} days
            </div>
        `;
    }

    createTaskItem(task) {
        const status = this.getTaskDisplayStatus(task);
        const deadlineIndicator = this.getDeadlineIndicator(task);
        
        return `
            <div class="calendar-task-item ${task.task_type.toLowerCase()} ${status}">
                <div class="task-status-indicator ${status}"></div>
                ${deadlineIndicator}
                <div class="task-content">
                    <div class="task-title">
                        <i class="fas ${this.getTypeIcon(task.task_type)}"></i>
                        ${task.order_item.product_name}
                    </div>
                    <div class="task-subtitle">
                        <i class="fas fa-shopping-cart"></i>
                        ${task.order_item.order.order_number}
                    </div>
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <i class="fas fa-user"></i>
                            ${task.employee_name || 'Unassigned'}
                        </div>
                        <div class="task-meta-item">
                            <i class="fas fa-box"></i>
                            Qty: ${task.order_item.quantity}
                        </div>
                    </div>
                </div>
                <div class="task-progress">
                    <div class="task-progress-bar" style="width: ${this.getTaskProgress(task)}%"></div>
                </div>
            </div>
        `;
    }

    getTaskProgress(task) {
        if (task.status === 'completed') return 100;
        if (task.status === 'pending') return 0;
        
        // For in_progress, calculate based on time elapsed
        const startDate = task.started_at ? new Date(task.started_at) : new Date(task.created_at);
        const endDate = task.order_item?.order?.expected_delivery_date ? 
            new Date(task.order_item.order.expected_delivery_date) : null;
        
        if (!endDate) return 50; // Default to 50% if no end date
        
        const now = new Date();
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        
        return Math.min(Math.round((elapsed / totalDuration) * 100), 99);
    }

    getDayStatusIndicators(tasks) {
        const hasOverdue = tasks.some(t => this.getTaskDisplayStatus(t) === 'overdue');
        const hasDueSoon = tasks.some(t => this.getTaskDisplayStatus(t) === 'due-soon');
        const hasOngoing = tasks.some(t => t.status === 'in_progress');
        
        return `
            <div class="day-status">
                ${hasOverdue ? '<div class="day-status-dot has-overdue"></div>' : ''}
                ${hasDueSoon ? '<div class="day-status-dot has-due-soon"></div>' : ''}
                ${hasOngoing ? '<div class="day-status-dot has-ongoing"></div>' : ''}
            </div>
        `;
    }

    getTasksForDate(date) {
        if (!date || !this.tasks || !Array.isArray(this.tasks)) {
            console.log('No tasks or invalid date', { date, tasks: this.tasks });
            return [];
        }
        
        const dateStr = date.toDateString();
        const tasksForDate = this.tasks.filter(task => {
            // Get all relevant dates for the task
            const dates = [
                task.started_at,
                task.completed_at,
                task.created_at,
                task.order_item?.order?.expected_delivery_date
            ].filter(Boolean).map(d => new Date(d).toDateString());

            return dates.includes(dateStr);
        });

        console.log(`Tasks for ${dateStr}:`, tasksForDate.length);
        return tasksForDate;
    }

    getCellClasses(tasks) {
        if (!tasks || !tasks.length) {
            return '';
        }
        
        const classes = ['has-tasks'];
        
        // Add status-based classes
        const hasOverdue = tasks.some(t => t.displayStatus === 'overdue');
        const hasCompleted = tasks.some(t => t.displayStatus === 'completed');
        const hasInProgress = tasks.some(t => t.displayStatus === 'in_progress');
        const hasPending = tasks.some(t => t.displayStatus === 'pending');
        
        if (hasOverdue) classes.push('has-overdue-tasks');
        if (hasCompleted) classes.push('has-completed-tasks');
        if (hasInProgress) classes.push('has-in-progress-tasks');
        if (hasPending) classes.push('has-pending-tasks');
        
        return classes.join(' ');
    }

    createTaskTooltip(container, tasks) {
        if (!tasks || !tasks.length) {
            return;
        }

        const $tooltip = $('<div>')
            .addClass('task-tooltip')
            .hide();

        // Group tasks by status and order item
        const taskGroups = tasks.reduce((groups, task) => {
            const key = `${task.displayStatus}-${task.order_item.id}`;
            if (!groups[key]) {
                groups[key] = {
                    status: task.displayStatus,
                    orderNumber: task.order_item.order.order_number,
                    customerName: task.order_item.order.customer_name,
                    tasks: []
                };
            }
            groups[key].tasks.push(task);
            return groups;
        }, {});

        // Add tasks to tooltip by group
        Object.values(taskGroups).forEach(group => {
            const $section = $('<div>')
                .addClass('task-tooltip-section')
                .append(
                    $('<div>')
                        .addClass('task-tooltip-header')
                        .append(
                            $('<span>')
                                .addClass(`badge badge-${this.getStatusColor(group.status)}`)
                                .text(group.status.toUpperCase())
                        )
                        .append(
                            $('<span>')
                                .addClass('ml-2')
                                .text(`${group.orderNumber} - ${group.customerName}`)
                        )
                );

            group.tasks.forEach(task => {
                $('<div>')
                    .addClass('task-tooltip-item')
                    .append(
                        $('<div>')
                            .addClass('task-tooltip-title')
                            .text(`${task.task_type} - ${task.order_item.product_name}`)
                    )
                    .append(
                        $('<div>')
                            .addClass('task-tooltip-meta')
                            .append(
                                $('<span>')
                                    .html(`<i class="ni ni-single-02"></i>${task.employee_name || 'Unassigned'}`)
                            )
                    )
                    .appendTo($section);
            });

            $tooltip.append($section);
        });

        container.append($tooltip);

        container.hover(
            () => $tooltip.show(),
            () => $tooltip.hide()
        );
    }

    showTaskList(tasks) {
        const today = new Date();
        const $list = $('<div>')
            .addClass('task-list-popup')
            .append(
                $('<div>')
                    .addClass('task-list-header')
                    .append($('<h5>').text('Tasks for ' + new Date(tasks[0].due_date).toLocaleDateString()))
            );

        // Group tasks by status
        const taskGroups = {
            overdue: [],
            pending: [],
            in_progress: [],
            completed: []
        };

        tasks.forEach(task => {
            const dueDate = new Date(task.due_date);
            if (task.status !== 'completed' && dueDate < today) {
                taskGroups.overdue.push(task);
            } else {
                taskGroups[task.status].push(task);
            }
        });

        // Add tasks by group
        if (taskGroups.overdue.length > 0) {
            this.addTaskGroupToList($list, taskGroups.overdue, 'Overdue Tasks', 'danger');
        }
        if (taskGroups.pending.length > 0) {
            this.addTaskGroupToList($list, taskGroups.pending, 'Pending Tasks', 'warning');
        }
        if (taskGroups.in_progress.length > 0) {
            this.addTaskGroupToList($list, taskGroups.in_progress, 'In Progress', 'info');
        }
        if (taskGroups.completed.length > 0) {
            this.addTaskGroupToList($list, taskGroups.completed, 'Completed', 'success');
        }

        DevExpress.ui.dialog.custom({
            title: 'Tasks',
            messageHtml: $list,
            buttons: [{
                text: 'Close',
                onClick: () => true
            }]
        }).show();
    }

    addTaskGroupToList($list, tasks, title, type) {
        const $group = $('<div>')
            .addClass('task-list-group')
            .append(
                $('<div>')
                    .addClass(`task-list-group-header text-${type}`)
                    .text(title)
            );

        tasks.forEach(task => {
            $('<div>')
                .addClass('task-list-item')
                .append(
                    $('<div>')
                        .addClass('task-list-item-header')
                        .append(
                            $('<span>')
                                .addClass(`task-status ${task.status}`)
                                .text(task.status.charAt(0).toUpperCase() + task.status.slice(1))
                        )
                        .append(
                            $('<span>')
                                .addClass('task-title')
                                .text(task.title)
                        )
                )
                .append(
                    $('<div>')
                        .addClass('task-list-item-meta')
                        .append(
                            $('<span>')
                                .addClass('assigned-to')
                                .html(`<i class="ni ni-single-02"></i>${task.employee_name}`)
                            )
                            .append(
                                $('<span>')
                                    .addClass('due-date')
                                    .html(`<i class="ni ni-calendar-grid-58"></i>Due: ${new Date(task.due_date).toLocaleDateString()}`)
                            )
                        )
                        .append(
                            $('<div>')
                                .addClass('task-list-item-content')
                                .text(task.description)
                        )
                        .on('click', () => this.showTaskDetails(task))
                        .appendTo($group);
        });

        $list.append($group);
    }

    showTaskDetails(task) {
        this.currentTask = task;
        $('#taskDetailsModal').modal('show');
        this.updateTaskDetails(task);
    }

    updateTaskDetails(task) {
        // Update modal header class based on task type
        const modalHeader = $('#taskDetailsModal .modal-header');
        modalHeader.removeClass('layout printing cutting sewing finishing')
                  .addClass(task.task_type.toLowerCase());

        // Update task type information
        const taskType = task.task_type.toLowerCase();
        const typeInfo = TASK_TYPE_INFO[taskType] || {
            title: task.task_type,
            description: 'Task type description not available',
            icon: 'fa-tasks'
        };

        $('#taskType').text(typeInfo.title);
        $('#taskTypeIcon').removeClass().addClass(`fas ${typeInfo.icon}`);
        
        // Update task type description
        const $typeDesc = $('#taskTypeDescription');
        $typeDesc.removeClass().addClass(`task-type-description ${taskType}`);
        $typeDesc.html(`
            <i class="fas ${typeInfo.icon} mr-2"></i>
            <strong>${typeInfo.title}:</strong> ${typeInfo.description}
        `);

        // Update task info
        $('#taskProductName').text(task.order_item.product_name);
        $('#taskOrderNumber').text(`Order #${task.order_item.order.order_number}`);
        $('#taskQuantity').text(task.order_item.quantity);
        $('#assignedTo').text(task.employee_name || 'Unassigned');
        $('#taskCreatedBy').text(task.created_by || 'System');
        $('#dueDate').text(this.formatDate(task.order_item.order.expected_delivery_date));
        $('#taskNotes').text(task.notes || 'No notes available');

        // Update status badge
        const status = this.getTaskDisplayStatus(task);
        const $statusBadge = $('#taskStatus');
        $statusBadge.removeClass('completed in_progress pending overdue')
                    .addClass(status);
        $statusBadge.find('.status').text(this.formatStatus(status));

        // Update progress
        const progress = this.getTaskProgress(task);
        $('#taskProgress').text(`${progress}%`);
        $('.progress-bar').css('width', `${progress}%`);

        // Update timeline
        this.updateTimeline(task);

        // Update action buttons visibility based on status
        this.updateActionButtons(task);
    }

    formatDate(dateString) {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatStatus(status) {
        return status.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
    }

    updateActionButtons(task) {
        const status = task.status;
        
        // Start Task button
        $('#startTask').toggleClass('d-none', status !== 'pending');
        
        // Complete Task button
        $('#completeTask').toggleClass('d-none', status !== 'in_progress');
        
        // Reassign Task button
        $('#reassignTask').toggleClass('d-none', status === 'completed');
        
        // Add Note button is always visible
    }

    getPriorityColor(priority) {
        const colors = {
            'Critical': 'danger',
            'High': 'warning',
            'Medium': 'info',
            'Low': 'success'
        };
        return colors[priority] || 'secondary';
    }

    createResourceList(resources) {
        const $list = $('<div>').addClass('list-group');
        
        if (!resources || !resources.length) {
            return $('<div>').addClass('text-muted').text('No resources allocated');
        }

        resources.forEach(resource => {
            $list.append(
                $('<div>')
                    .addClass('list-group-item')
                    .append(
                        $('<div>')
                            .addClass('d-flex justify-content-between align-items-center')
                            .append(
                                $('<div>')
                                    .addClass('resource-info')
                                    .append(
                                        $('<h5>')
                                            .addClass('mb-1')
                                            .text(resource.name)
                                    )
                                    .append(
                                        $('<small>')
                                            .addClass('text-muted')
                                            .text(resource.type)
                                    )
                            )
                            .append(
                                $('<span>')
                                    .addClass('badge badge-primary badge-pill')
                                    .text(`${resource.utilization}%`)
                            )
                    )
            );
        });

        return $list;
    }

    createProductionMetrics(task) {
        const metrics = [
            {
                title: 'Efficiency Rate',
                value: `${task.efficiency || 0}%`,
                icon: 'ni-chart-bar-32'
            },
            {
                title: 'Quality Rate',
                value: `${task.quality || 0}%`,
                icon: 'ni-check-bold'
            },
            {
                title: 'Time to Completion',
                value: this.formatTimeRemaining(task.estimated_completion),
                icon: 'ni-time-alarm'
            },
            {
                title: 'Cost Variance',
                value: this.formatCostVariance(task.cost_variance),
                icon: 'ni-money-coins'
            }
        ];

        return metrics.map(metric => 
            $('<div>')
                .addClass('col-md-3')
                .append(
                    $('<div>')
                        .addClass('card card-stats mb-4 mb-xl-0')
                        .append(
                            $('<div>')
                                .addClass('card-body')
                                .append(
                                    $('<div>')
                                        .addClass('row')
                                        .append(
                                            $('<div>')
                                                .addClass('col')
                                                .append(
                                                    $('<h5>')
                                                        .addClass('card-title text-uppercase text-muted mb-0')
                                                        .text(metric.title)
                                                )
                                                .append(
                                                    $('<span>')
                                                        .addClass('h2 font-weight-bold mb-0')
                                                        .text(metric.value)
                                                )
                                        )
                                        .append(
                                            $('<div>')
                                                .addClass('col-auto')
                                                .append(
                                                    $('<div>')
                                                        .addClass('icon icon-shape bg-info text-white rounded-circle shadow')
                                                        .append(
                                                            $('<i>')
                                                                .addClass(`ni ${metric.icon}`)
                                                        )
                                                )
                                        )
                                )
                        )
                )
        );
    }

    formatTimeRemaining(timestamp) {
        if (!timestamp) return 'N/A';
        const remaining = new Date(timestamp) - new Date();
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        return `${days} days`;
    }

    formatCostVariance(variance) {
        if (!variance) return '±0%';
        const sign = variance > 0 ? '+' : '';
        return `${sign}${variance}%`;
    }

    updateTimeline(task) {
        const $timeline = $('.task-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Task Created',
            `Task created by ${task.created_by}`,
            task.created_at
        ));

        // Started
        if (task.started_at) {
            $timeline.append(this.createTimelineItem(
                'Task Started',
                `Task started by ${task.assigned_to}`,
                task.started_at
            ));
        }

        // Completed
        if (task.completed_at) {
            $timeline.append(this.createTimelineItem(
                'Task Completed',
                `Task completed by ${task.assigned_to}`,
                task.completed_at
            ));
        }
    }

    createTimelineItem(title, info, date) {
        return $('<div>')
            .addClass('timeline-item')
            .append($('<div>').addClass('timeline-point'))
            .append(
                $('<div>')
                    .addClass('timeline-content')
                    .append($('<div>').addClass('timeline-title').text(title))
                    .append($('<div>').addClass('timeline-info').text(info))
                    .append(
                        $('<small>')
                            .addClass('text-muted d-block mt-2')
                            .text(new Date(date).toLocaleString())
                    )
            );
    }

    updateOrderInfo(order) {
        const $orderInfo = $('.order-info');
        $orderInfo.empty();

        const $orderDetails = $('<div>')
            .addClass('card shadow-none border')
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<h6>').addClass('heading-small text-muted mb-4').text('Order Information')
                    )
                    .append(
                        $('<div>')
                            .addClass('pl-lg-4')
                            .append(this.createInfoGroup('Order Number', order.order_number))
                            .append(this.createInfoGroup('Customer', order.customer_name))
                            .append(this.createInfoGroup('Total Amount', this.formatIDR(order.total_amount)))
                            .append(this.createInfoGroup('Status', this.formatOrderStatus(order.status)))
                    )
            );

        $orderInfo.append($orderDetails);
    }

    createInfoGroup(label, value) {
        return $('<div>')
            .addClass('info-group')
            .append($('<div>').addClass('info-label').text(label))
            .append($('<div>').addClass('info-value').html(value));
    }

    getStatusColor(status) {
        const colors = {
            'completed': 'success',
            'in_progress': 'warning',
            'pending': 'danger'
        };
        return colors[status] || 'secondary';
    }

    formatOrderStatus(status) {
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    clearTaskDetails() {
        // Clear all dynamic content
        $('#taskId').text('');
        $('#taskTitle').text('');
        $('#taskDescription').text('');
        $('#assignedTo').text('');
        $('#dueDate').text('');
        $('#taskNotes').text('');
        $('.task-timeline').empty();
        $('.order-info').empty();
    }

    switchTab(tab) {
        $('.nav-tabs .nav-link').removeClass('active');
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $('.tab-pane').removeClass('show active');
        $(`#${tab}`).addClass('show active');
    }

    async startTask(task) {
        try {
            await zentra.startTask(task.id);
            await this.loadData();
            $('#taskDetailsModal').modal('hide');
            DevExpress.ui.notify('Task started successfully', 'success', 3000);
        } catch (error) {
            console.error('Start task error:', error);
            DevExpress.ui.notify('Failed to start task', 'error', 3000);
        }
    }

    async completeTask(task) {
        try {
            await zentra.completeTask(task.id);
            await this.loadData();
            $('#taskDetailsModal').modal('hide');
            DevExpress.ui.notify('Task completed successfully', 'success', 3000);
        } catch (error) {
            console.error('Complete task error:', error);
            DevExpress.ui.notify('Failed to complete task', 'error', 3000);
        }
    }

    showReassignDialog(task) {
        // Implement reassign dialog
        console.log('Show reassign dialog for task:', task);
    }

    showAddNoteDialog(task) {
        // Implement add note dialog
        console.log('Show add note dialog for task:', task);
    }

    switchView(view) {
        this.currentView = view;
        
        // Hide all views first
        $('.view-section').removeClass('active');
        
        // Show selected view
        $(`#${view}View`).addClass('active');
        
        // Update toggle buttons
        $('.view-toggle .btn').removeClass('active');
        $(`#view${view.charAt(0).toUpperCase() + view.slice(1)}`).addClass('active');
        
        // Refresh the appropriate view
        if (view === 'calendar') {
            this.calendar.repaint();
        } else {
            this.updateKanbanBoard();
        }
    }

    updateKanbanBoard() {
        // Clear existing tasks
        $('.kanban-body').empty();
        
        // Group tasks by type
        const tasksByType = this.groupTasksByType(this.tasks);
        
        // Update each column
        Object.entries(tasksByType).forEach(([type, tasks]) => {
            const columnId = `#${type.toLowerCase()}Tasks`;
            const $column = $(columnId);
            
            if ($column.length) {
                // Sort tasks by status and date
                tasks.sort((a, b) => {
                    // First sort by status priority
                    const statusPriority = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
                    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
                    if (statusDiff !== 0) return statusDiff;
                    
                    // Then by date (newer first)
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                tasks.forEach(task => {
                    const $taskCard = $('<div>')
                        .addClass('kanban-task-card')
                        .html(this.createTaskItem(task))
                        .on('click', () => this.showTaskDetails(task));
                    
                    // Add hover effect
                    $taskCard.hover(
                        function() { $(this).addClass('hover-shadow-lg'); },
                        function() { $(this).removeClass('hover-shadow-lg'); }
                    );
                    
                    $column.append($taskCard);
                });

                // Update column count
                const $header = $(`.kanban-column[data-type="${type.toLowerCase()}"] .task-count`);
                $header.text(tasks.length);
            }
        });
    }

    getTypeIcon(type) {
        const icons = {
            'layout': 'fa-pencil-ruler',
            'printing': 'fa-print',
            'cutting': 'fa-cut',
            'sewing': 'fa-thread',
            'finishing': 'fa-check-double'
        };
        return icons[type.toLowerCase()] || 'fa-tasks';
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.taskCalendarPageInstance) {
    window.taskCalendarPageInstance = new window.TaskCalendarPage();
}

// Add task type descriptions
const TASK_TYPE_INFO = {
    layout: {
        title: 'Layout & Design',
        description: 'Initial design and pattern creation phase. This involves creating digital or physical patterns, selecting materials, and planning the production process.',
        icon: 'fa-pencil-ruler'
    },
    printing: {
        title: 'Printing',
        description: 'Application of designs, graphics, and patterns onto the fabric using various printing techniques such as screen printing, digital printing, or heat transfer.',
        icon: 'fa-print'
    },
    cutting: {
        title: 'Cutting',
        description: 'Precise cutting of fabric materials according to the patterns. This phase ensures accurate dimensions and optimal material usage.',
        icon: 'fa-cut'
    },
    sewing: {
        title: 'Sewing',
        description: 'Assembly of cut pieces into the final product. This involves various sewing techniques, machine operations, and quality control checks.',
        icon: 'fa-thread'
    },
    finishing: {
        title: 'Finishing',
        description: 'Final touches including quality inspection, cleaning, ironing, packaging, and preparing the product for delivery.',
        icon: 'fa-check-double'
    }
}; 