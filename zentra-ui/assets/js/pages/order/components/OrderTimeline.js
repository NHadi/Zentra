export class OrderTimeline {
    constructor(orderPage) {
        this.orderPage = orderPage;
    }

    render($container, order) {
        // Add timeline styles
        this.addTimelineStyles();
        
        // Create timeline container
        const $timelineContainer = $('<div>').addClass('production-timeline');

        // Add timeline header
        $timelineContainer.append(this.createTimelineHeader(order));

        // Get production details
        const { taskProgress, tasksByType } = this.getProductionDetails(order);

        // Add stages
        this.renderStages($timelineContainer, order, taskProgress, tasksByType);

        // Add summary section
        this.renderSummary($timelineContainer, taskProgress);

        $container.append($timelineContainer);
    }

    addTimelineStyles() {
        if (!document.querySelector('style[data-timeline-styles]')) {
            const timelineStyles = document.createElement('style');
            timelineStyles.setAttribute('data-timeline-styles', '');
            timelineStyles.textContent = `
                .production-timeline {
                    padding: 2rem;
                    background: #f8f9fc;
                    border-radius: 1rem;
                    box-shadow: 0 0 20px rgba(0,0,0,0.03);
                }
                .timeline-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e9ecef;
                }
                .timeline-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #32325d;
                    margin: 0;
                }
                .timeline-meta {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .timeline-meta-item {
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                    color: #8898aa;
                }
                .timeline-meta-item i {
                    margin-right: 0.5rem;
                    color: #5e72e4;
                }
                .timeline-stage {
                    position: relative;
                    padding: 2rem;
                    background: white;
                    border-radius: 1rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .timeline-stage:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                }
                .timeline-stage.completed { border-left: 4px solid #2dce89; }
                .timeline-stage.current { border-left: 4px solid #5e72e4; }
                .timeline-stage.pending { border-left: 4px solid #e9ecef; }
                .timeline-stage-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .timeline-stage-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #5e72e4;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                    font-size: 1.25rem;
                    box-shadow: 0 4px 6px rgba(94, 114, 228, 0.1);
                }
                .timeline-stage-info { flex: 1; }
                .timeline-stage-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #32325d;
                    margin-bottom: 0.25rem;
                }
                .timeline-stage-subtitle {
                    font-size: 0.875rem;
                    color: #8898aa;
                }
                .timeline-stage-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #8898aa;
                }
                .timeline-tasks {
                    margin-top: 1.5rem;
                    margin-left: 4rem;
                }
                .timeline-task-item {
                    position: relative;
                    padding: 1.5rem;
                    background: #f8f9fc;
                    border-radius: 0.75rem;
                    margin-bottom: 1rem;
                    transition: transform 0.2s ease;
                }
                .timeline-task-item:hover {
                    transform: translateX(4px);
                }
                .task-status-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    padding: 0.375rem 1rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .task-status-completed {
                    background: rgba(45, 206, 137, 0.1);
                    color: #2dce89;
                }
                .task-status-in-progress {
                    background: rgba(251, 99, 64, 0.1);
                    color: #fb6340;
                    animation: pulse 2s infinite;
                }
                .task-status-pending {
                    background: rgba(136, 152, 170, 0.1);
                    color: #8898aa;
                }
                .task-info { margin-right: 7rem; }
                .task-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #32325d;
                    margin-bottom: 0.5rem;
                }
                .task-details {
                    font-size: 0.875rem;
                    color: #8898aa;
                    margin-bottom: 1rem;
                }
                .task-progress { margin-bottom: 1rem; }
                .progress {
                    height: 6px;
                    border-radius: 3px;
                    background: #e9ecef;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(45deg, #5e72e4, #825ee4);
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
                .task-meta {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(0,0,0,0.05);
                }
                .task-employee {
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                    color: #525f7f;
                }
                .task-employee i {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(94, 114, 228, 0.1);
                    color: #5e72e4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.75rem;
                }
                .task-time {
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                    color: #8898aa;
                }
                .task-time i {
                    margin-right: 0.5rem;
                    color: #5e72e4;
                }
                .task-notes {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    color: #525f7f;
                    font-style: italic;
                    border-left: 3px solid #5e72e4;
                }
                .task-notes i {
                    color: #5e72e4;
                    margin-right: 0.5rem;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(251, 99, 64, 0.2); }
                    70% { box-shadow: 0 0 0 10px rgba(251, 99, 64, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(251, 99, 64, 0); }
                }
                .timeline-connector {
                    position: absolute;
                    left: -2px;
                    top: 0;
                    bottom: -2rem;
                    width: 4px;
                    background: #e9ecef;
                    z-index: 0;
                }
                .timeline-stage:last-child .timeline-connector {
                    display: none;
                }
                .timeline-stage.completed .timeline-connector {
                    background: #2dce89;
                }
                .timeline-stage.current .timeline-connector {
                    background: linear-gradient(to bottom, #5e72e4 50%, #e9ecef 50%);
                }
                .timeline-summary {
                    margin-top: 2rem;
                    padding: 1.5rem;
                    background: white;
                    border-radius: 0.75rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .timeline-summary-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #8898aa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 1rem;
                }
                .timeline-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .timeline-stat-item {
                    padding: 1rem;
                    background: #f8f9fc;
                    border-radius: 0.5rem;
                    text-align: center;
                }
                .timeline-stat-value {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #5e72e4;
                    margin-bottom: 0.25rem;
                }
                .timeline-stat-label {
                    font-size: 0.875rem;
                    color: #8898aa;
                }
            `;
            document.head.appendChild(timelineStyles);
        }
    }

    createTimelineHeader(order) {
        return $('<div>').addClass('timeline-header')
            .append($('<h3>').addClass('timeline-title').text('Production Timeline'))
            .append(
                $('<div>').addClass('timeline-meta')
                    .append(
                        $('<div>').addClass('timeline-meta-item')
                            .append($('<i>').addClass('far fa-calendar-alt'))
                            .append(new Date(order.created_at).toLocaleDateString())
                    )
                    .append(
                        $('<div>').addClass('timeline-meta-item')
                            .append($('<i>').addClass('far fa-clock'))
                            .append(new Date(order.created_at).toLocaleTimeString())
                    )
            );
    }

    getProductionDetails(order) {
        const allTasks = order.order_items.flatMap(item => item.tasks || []);
        const tasksByType = {};
        
        allTasks.forEach(task => {
            if (!tasksByType[task.task_type]) {
                tasksByType[task.task_type] = [];
            }
            tasksByType[task.task_type].push(task);
        });

        // Calculate progress for each task type
        const taskProgress = {};
        Object.entries(tasksByType).forEach(([type, tasks]) => {
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            taskProgress[type] = {
                total,
                completed,
                inProgress,
                percentage: Math.round((completed / total) * 100)
            };
        });

        return { taskProgress, tasksByType };
    }

    renderStages($container, order, taskProgress, tasksByType) {
        // Order Received Stage
        const $receivedStage = this.createTimelineStage({
            icon: 'shopping-cart',
            title: 'Order Received',
            subtitle: `Order #${order.order_number}`,
            date: new Date(order.created_at),
            status: 'completed',
            tasks: [{
                status: 'completed',
                name: 'Order Placement',
                details: `Order placed by ${order.customer_name}`,
                time: new Date(order.created_at)
            }]
        });
        $container.append($receivedStage);

        // Order Confirmed Stage
        if (order.status !== 'pending') {
            const $confirmedStage = this.createTimelineStage({
                icon: 'check-circle',
                title: 'Order Confirmed',
                subtitle: 'Order verification complete',
                date: new Date(order.updated_at),
                status: 'completed',
                tasks: [{
                    status: 'completed',
                    name: 'Order Verification',
                    details: 'All order details have been verified and confirmed',
                    time: new Date(order.updated_at)
                }]
            });
            $container.append($confirmedStage);
        }

        // Production Stage
        if (order.status === 'in_production') {
            const $productionStage = this.createTimelineStage({
                icon: 'cogs',
                title: 'Production in Progress',
                subtitle: 'Manufacturing and customization',
                date: new Date(order.updated_at),
                status: 'current',
                tasks: Object.entries(tasksByType).map(([type, tasks]) => {
                    const progress = taskProgress[type];
                    return {
                        status: progress.completed === progress.total ? 'completed' : 
                               progress.inProgress > 0 ? 'in-progress' : 'pending',
                        name: type.replace(/_/g, ' ').toUpperCase(),
                        details: `${progress.completed} of ${progress.total} items completed`,
                        progress: progress.percentage,
                        tasks: tasks.map(task => ({
                            status: task.status,
                            employee_name: task.employee_name,
                            started_at: task.started_at,
                            completed_at: task.completed_at,
                            notes: task.notes
                        }))
                    };
                })
            });
            $container.append($productionStage);
        }
    }

    createTimelineStage({ icon, title, subtitle, date, status, tasks }) {
        const $stage = $('<div>').addClass(`timeline-stage ${status}`);
        
        // Add connector line
        $stage.append($('<div>').addClass('timeline-connector'));
        
        // Stage header
        $stage.append(
            $('<div>').addClass('timeline-stage-header')
                .append(
                    $('<div>').addClass('timeline-stage-icon')
                        .append($('<i>').addClass(`fas fa-${icon}`))
                )
                .append(
                    $('<div>').addClass('timeline-stage-info')
                        .append($('<div>').addClass('timeline-stage-title').text(title))
                        .append($('<div>').addClass('timeline-stage-subtitle').text(subtitle))
                )
                .append(
                    $('<div>').addClass('timeline-stage-date')
                        .append($('<i>').addClass('far fa-calendar-alt'))
                        .append(date.toLocaleDateString())
                        .append($('<i>').addClass('far fa-clock ml-2'))
                        .append(date.toLocaleTimeString())
                )
        );

        // Tasks container
        const $tasks = $('<div>').addClass('timeline-tasks');
        
        tasks.forEach(task => {
            const $taskItem = $('<div>').addClass('timeline-task-item');
            
            // Status badge
            $taskItem.append(
                $('<div>')
                    .addClass(`task-status-badge task-status-${task.status}`)
                    .text(task.status.replace(/_/g, ' ').toUpperCase())
            );

            // Task info
            const $taskInfo = $('<div>').addClass('task-info');
            $taskInfo.append($('<div>').addClass('task-name').text(task.name));
            $taskInfo.append($('<div>').addClass('task-details').text(task.details));

            // Add progress bar if available
            if (task.progress !== undefined) {
                $taskInfo.append(
                    $('<div>').addClass('task-progress')
                        .append(
                            $('<div>')
                                .addClass('progress')
                                .append(
                                    $('<div>')
                                        .addClass('progress-bar')
                                        .css('width', `${task.progress}%`)
                                )
                        )
                );
            }

            // Add task meta information
            const $taskMeta = $('<div>').addClass('task-meta');

            // Add subtasks if available
            if (task.tasks) {
                task.tasks.forEach(subtask => {
                    const $subtaskInfo = $('<div>').addClass('task-employee');
                    $subtaskInfo.append($('<i>').addClass('fas fa-user'));
                    
                    let subtaskText = `${subtask.employee_name}`;
                    if (subtask.started_at) {
                        $taskMeta.append(
                            $('<div>').addClass('task-time')
                                .append($('<i>').addClass('far fa-play-circle'))
                                .append(new Date(subtask.started_at).toLocaleString())
                        );
                    }
                    if (subtask.completed_at) {
                        $taskMeta.append(
                            $('<div>').addClass('task-time')
                                .append($('<i>').addClass('far fa-check-circle'))
                                .append(new Date(subtask.completed_at).toLocaleString())
                        );
                    }
                    
                    $subtaskInfo.append(subtaskText);
                    $taskMeta.prepend($subtaskInfo);
                    
                    if (subtask.notes) {
                        $taskInfo.append(
                            $('<div>').addClass('task-notes')
                                .append($('<i>').addClass('fas fa-sticky-note'))
                                .append(subtask.notes)
                        );
                    }
                });
            }

            $taskInfo.append($taskMeta);
            $taskItem.append($taskInfo);

            // Add task time if available
            if (task.time) {
                $taskMeta.append(
                    $('<div>').addClass('task-time')
                        .append($('<i>').addClass('far fa-clock'))
                        .append(task.time.toLocaleString())
                );
            }

            $tasks.append($taskItem);
        });

        $stage.append($tasks);
        return $stage;
    }

    renderSummary($container, taskProgress) {
        const totalTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.total, 0);
        const completedTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.completed, 0);
        const inProgressTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.inProgress, 0);
        const overallProgress = Math.round((completedTasks / totalTasks) * 100);

        const $summary = $('<div>').addClass('timeline-summary')
            .append($('<h4>').addClass('timeline-summary-title').text('Production Summary'))
            .append(
                $('<div>').addClass('timeline-stats')
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(`${overallProgress}%`))
                            .append($('<div>').addClass('timeline-stat-label').text('Overall Progress'))
                    )
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(completedTasks))
                            .append($('<div>').addClass('timeline-stat-label').text('Tasks Completed'))
                    )
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(inProgressTasks))
                            .append($('<div>').addClass('timeline-stat-label').text('Tasks In Progress'))
                    )
            );

        $container.append($summary);
    }
} 