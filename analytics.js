// ==========================================================================
// CORE DATA VISUALIZATION AND PERFORMANCE METRICS ANALYTICS ENGINE
// ==========================================================================
let systemDistributionBarChart = null;
let projectTimelineGanttChart = null;

function renderDashboardSummaryHub() {
    const totalCount = state.tasks.length;
    const completedCount = state.tasks.filter(t => t.status === 'done').length;
    const trackingClockTime = new Date();
    const overdueCount = state.tasks.filter(t => t.status !== 'done' && t.status !== 'rejected' && t.dueDate && new Date(t.dueDate) < trackingClockTime).length;
    const rejectedCount = state.tasks.filter(t => t.status === 'rejected').length;
    
    const activeTasks = totalCount - rejectedCount;
    const functionalProductivityFactor = activeTasks > 0 ? Math.round((completedCount / activeTasks) * 100) : 0;
    
    if(document.getElementById("statTotalTasks")) document.getElementById("statTotalTasks").innerText = totalCount;
    if(document.getElementById("statCompletedTasks")) document.getElementById("statCompletedTasks").innerText = completedCount;
    if(document.getElementById("statDelayedTasks")) document.getElementById("statDelayedTasks").innerText = overdueCount;
    if(document.getElementById("statCompletionRate")) document.getElementById("statCompletionRate").innerText = functionalProductivityFactor + "%";
    
    renderSharedModulesStackList();
    renderDistributionVisualizationCharts();
}

function renderSharedModulesStackList() {
    const renderBox = document.getElementById("typesList");
    if (!renderBox) return;
    renderBox.innerHTML = "";
    
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    const isRTL = state.currentLanguage === 'ar';
    const dict = isRTL ? {
        createSprint: 'سبرينت جديد',
        createTask: 'مهمة جديدة',
        noTasks: 'لا توجد مهام',
        noSprints: 'لا توجد سبرينتات داخل هذا المشروع',
        addDirectTask: 'إنشاء مهمة مباشرة',
        edit: 'تعديل',
        delete: 'حذف'
    } : {
        createSprint: 'New Sprint',
        createTask: 'New Task',
        noTasks: 'No tasks',
        noSprints: 'No sprints in this project',
        addDirectTask: 'Add Direct Task',
        edit: 'Edit',
        delete: 'Delete'
    };
    
    state.types.filter(t => !t.isPrivate).forEach(moduleType => {
        const subsetTasks = state.tasks.filter(t => t.typeId === moduleType.id && !t.sprintId);
        const moduleSprints = state.sprints ? state.sprints.filter(s => s.typeId === moduleType.id) : [];
        let sprintsHTML = "";
        
        moduleSprints.forEach(sprint => {
            const sprintTasks = state.tasks.filter(t => t.sprintId === sprint.id);
            let tasksHTML = "";
            sprintTasks.forEach(task => {
                const isDone = task.status === 'done';
                const taskColor = task.customColor && task.customColor !== '#4a6cf7' ? task.customColor : sprint.color;
                tasksHTML += `
                    <div style="border-top: 3px solid ${taskColor}; margin: 6px 0; padding: 8px; background: var(--bg-surface); border-radius: 4px; border-${isRTL ? 'right' : 'left'}: 2px solid ${task.assignedUser === state.currentUser ? 'var(--primary)' : 'transparent'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                            <div>
                                <span style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
                                <small style="display: block; color: var(--text-muted); font-size: 11px;">${task.assignedUser || 'Unallocated'} • ${task.status}</small>
                            </div>
                            ${isAdmin ? `<div style="position: relative; display: inline-block;">
                                <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 2px; border-radius: 3px; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                    <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.edit}</button>
                                    <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.delete}</button>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            sprintsHTML += `
                <div class="sprint-card" style="border: 2px dashed ${sprint.color}; border-radius: 8px; padding: 12px; margin: 12px 0; cursor: pointer;" onclick="this.classList.toggle('expanded');">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                        <strong style="color: ${sprint.color}; font-size: 14px;"><i class="fa-solid fa-sprint"></i> ${sprint.name}</strong>
                        ${isAdmin ? `<div style="display: flex; gap: 4px;" onclick="event.stopPropagation();">
                            <button onclick="createTaskForSprint('${sprint.id}')" title="${dict.createTask}" style="background: ${sprint.color}; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">+</button>
                            <div style="position: relative; display: inline-block;">
                                <button onclick="event.stopPropagation(); toggleSprintActions('${sprint.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 4px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div id="sprintActions_${sprint.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                    <button onclick="event.stopPropagation(); openEditSprintModal('${sprint.id}')" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.edit}</button>
                                    <button onclick="event.stopPropagation(); deleteSprint('${sprint.id}')" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.delete}</button>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                    <small style="color: var(--text-muted);">${sprint.startDate || '...'} - ${sprint.endDate || '...'}</small>
                    <div style="margin-top: 8px;">
                        ${tasksHTML || `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px;">${dict.noTasks}</p>`}
                    </div>
                </div>
            `;
        });
        
        let directTasksHTML = "";
        subsetTasks.forEach(task => {
            const isDone = task.status === 'done';
            const taskColor = task.customColor || moduleType.color;
            directTasksHTML += `
                <div style="border-top: 3px solid ${taskColor}; margin: 6px 0; padding: 8px; background: var(--bg-surface); border-radius: 4px; border-${isRTL ? 'right' : 'left'}: 2px solid ${task.assignedUser === state.currentUser ? 'var(--primary)' : 'transparent'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div>
                            <span style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
                            <small style="display: block; color: var(--text-muted); font-size: 11px;">${task.assignedUser || 'Unallocated'} • ${task.status}</small>
                        </div>
                        ${isAdmin ? `<div style="position: relative; display: inline-block;">
                            <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 2px; border-radius: 3px; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.edit}</button>
                                <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.delete}</button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        });
        
        renderBox.innerHTML += `
            <div style="border-${isRTL ? 'right' : 'left'}: 4px solid ${moduleType.color}; background: var(--bg-surface); border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--border-color); box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="padding: 14px; border-bottom: 3px solid ${moduleType.color}; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: ${moduleType.color};"><i class="fa-solid fa-folder" style="margin-${isRTL ? 'right' : 'left'}: 8px;"></i> ${moduleType.name}</h3>
                    ${isAdmin ? `<div style="display: flex; gap: 6px;">
                        <button onclick="openSprintModal(null, '${moduleType.id}')" style="background: var(--success); border: none; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-sprint"></i> ${isRTL ? 'سبرينت' : 'Sprint'}</button>
                        <div style="position: relative; display: inline-block;">
                            <button onclick="event.stopPropagation(); toggleModuleActions('${moduleType.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 6px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="moduleActions_${moduleType.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 120px;">
                                <button onclick="event.stopPropagation(); editModule('${moduleType.id}')" style="display: block; width: 100%; padding: 8px 12px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 13px; font-family: var(--font-stack);"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 6px;"></i> ${dict.edit}</button>
                                <button onclick="event.stopPropagation(); deleteModule('${moduleType.id}')" style="display: block; width: 100%; padding: 8px 12px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 13px; font-family: var(--font-stack);"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 6px;"></i> ${dict.delete}</button>
                            </div>
                        </div>
                    </div>` : ''}
                </div>
                <div style="padding: 0 14px;">
                    ${moduleType.notes ? `<p style="padding: 8px 0; color: var(--text-muted); font-size: 12px; border-bottom: 1px solid var(--border-color);">${moduleType.notes}</p>` : ''}
                    <div style="padding: 10px 0;">
                        <h4 style="font-size: 13px; margin: 6px 0 8px; color: var(--text-muted);"><i class="fa-solid fa-sprint" style="margin-${isRTL ? 'right' : 'left'}: 6px;"></i> ${isRTL ? 'السبرينتات' : 'Sprints'}</h4>
                        ${sprintsHTML || `<p style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 15px;">${dict.noSprints}</p>`}
                    </div>
                    ${directTasksHTML ? `<div style="padding: 10px 0; border-top: 1px dashed var(--border-color);">
                        <h4 style="font-size: 13px; margin: 6px 0 8px; color: var(--text-muted);"><i class="fa-solid fa-circle-dot" style="margin-${isRTL ? 'right' : 'left'}: 6px;"></i> ${isRTL ? 'مهام مباشرة' : 'Direct Tasks'}</h4>
                        ${directTasksHTML}
                    </div>` : ''}
                </div>
                ${isAdmin ? `<div style="padding: 12px; border-top: 1px solid var(--border-color);">
                    <button onclick="triggerTaskFormAllocation('${moduleType.id}', false)" style="width: 100%; background: ${moduleType.color}; border: none; color: #fff; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 13px;"><i class="fa-solid fa-plus"></i> ${dict.addDirectTask}</button>
                </div>` : ''}
            </div>
        `;
    });
}

// Toggle dropdown menu for module actions
function toggleModuleActions(moduleId) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`moduleActions_${moduleId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleSprintActions(sprintId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`sprintActions_${sprintId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleTaskActions(taskId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`taskActions_${taskId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-container') && !e.target.closest('[id^="taskActions_"]') && !e.target.closest('[id^="moduleActions_"]')) {
        document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    }
});

// ==========================================================================
// TASK DETAIL MODAL - عرض تفاصيل المهمة عند النقر
// ==========================================================================
function openTaskDetailModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Remove existing modal
    const existingModal = document.getElementById('taskDetailModal');
    if (existingModal) existingModal.remove();
    
    const dict = state.currentLanguage === 'ar' ? {
        title: 'تفاصيل المهمة',
        name: 'الاسم',
        status: 'الحالة',
        assignee: 'المسؤول',
        dueDate: 'تاريخ الاستحقاق',
        tags: 'الوسوم',
        notes: 'الملاحظات',
        close: 'إغلاق'
    } : {
        title: 'Task Details',
        name: 'Name',
        status: 'Status',
        assignee: 'Assignee',
        dueDate: 'Due Date',
        tags: 'Tags',
        notes: 'Notes',
        close: 'Close'
    };
    
    const modal = document.createElement('div');
    modal.id = 'taskDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3><i class="fa-solid fa-clipboard-list"></i> ${dict.title}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('taskDetailModal').remove()">&times;</button>
            </div>
            <div class="task-detail-box" style="padding: 20px;">
                <p><strong>${dict.name}:</strong> ${task.name}</p>
                <p><strong>${dict.status}:</strong> <span class="status-${task.status}" style="text-transform: uppercase; font-weight: 600;">${task.status}</span></p>
                <p><strong>${dict.assignee}:</strong> ${task.assignedUser || 'Unallocated'}</p>
                ${task.dueDate ? `<p><strong>${dict.dueDate}:</strong> ${task.dueDate.split('T')[0]}</p>` : ''}
                ${task.tags ? `<p><strong>${dict.tags}:</strong> ${task.tags}</p>` : ''}
                ${task.notes ? `<p><strong>${dict.notes}:</strong></p><p style="background: var(--bg-surface); padding: 10px; border-radius: 4px; margin-top: 5px;">${task.notes}</p>` : ''}
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('taskDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function renderSystemAnalyticsDashboard() {
    const modulesGrid = document.getElementById("analyticsModulesGrid");
    if(!modulesGrid) return;
    modulesGrid.innerHTML = "";
    
    state.types.forEach(m => {
        const subTasks = state.tasks.filter(t => t.typeId === m.id);
        const resolved = subTasks.filter(t => t.status === 'done').length;
        const completionRate = subTasks.length > 0 ? Math.round((resolved / subTasks.length) * 100) : 0;
        
        modulesGrid.innerHTML += `
            <div class="analytics-module-card">
                <h4 style="font-weight:700;"><i class="fa-solid fa-cubes-stacked" style="color:${m.color}"></i> ${m.name}</h4>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:10px;">
                    <span>Volume: ${subTasks.length} Units</span>
                    <span>Rate: ${completionRate}%</span>
                </div>
                <div class="analytics-bar-wrapper">
                    <div class="analytics-bar-fill" style="width: ${completionRate}%; background-color: ${m.color}"></div>
                </div>
            </div>
        `;
    });
    
    const tableBody = document.getElementById("analyticsUserTableBody");
    if (tableBody) {
        tableBody.innerHTML = "";
        
        Object.keys(state.userMetrics).forEach(resourceName => {
            const data = state.userMetrics[resourceName];
            const resourceTasks = state.tasks.filter(t => t.assignedUser === resourceName);
            const complete = resourceTasks.filter(t => t.status === 'done').length;
            const productivityRatio = resourceTasks.length > 0 ? Math.round((complete / resourceTasks.length) * 100) : 0;
            
            let starsMarkup = "";
            let roundedRating = Math.round(data.rating || 4);
            for(let s=1; s<=5; s++) {
                starsMarkup += `<i class="fa-${s <= roundedRating ? 'solid' : 'regular'} fa-star star-rating"></i>`;
            }
            
            tableBody.innerHTML += `
                <tr>
                    <td><strong><i class="fa-solid fa-user-gear"></i> ${resourceName}</strong></td>
                    <td>${data.logins} Logs</td>
                    <td>${Math.ceil(data.workingHours || 1)} Session Hours</td>
                    <td>
                        <span style="font-weight:700; color:var(--primary);">${productivityRatio}%</span>
                        <span style="font-size:11px; color:var(--text-muted);"> (${complete}/${resourceTasks.length} items)</span>
                    </td>
                    <td>${starsMarkup}</td>
                </tr>
            `;
        });
    }
}

function renderDistributionVisualizationCharts() {
    const structuralCanvas = document.getElementById("weeklyChart");
    if(!structuralCanvas) return;
    const coreCtx = structuralCanvas.getContext("2d");
    if (systemDistributionBarChart) systemDistributionBarChart.destroy();
    
    systemDistributionBarChart = new Chart(coreCtx, {
        type: 'bar',
        data: {
            labels: state.types.map(t => t.name),
            datasets: [{
                data: state.types.map(type => state.tasks.filter(t => t.typeId === type.id).length),
                backgroundColor: state.types.map(t => t.color || '#4a6cf7'),
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderGanttTimelineChart() {
    const targetCanvas = document.getElementById("ganttChart");
    if(!targetCanvas) return;
    const coreCtx = targetCanvas.getContext("2d");
    if (projectTimelineGanttChart) projectTimelineGanttChart.destroy();
    
    const validDuedateTasks = state.tasks.filter(t => t.dueDate);
    
    const ganttSection = document.getElementById("gantt");
    const existingInfo = document.getElementById("ganttInfoCard");
    if (existingInfo) existingInfo.remove();
    
    const infoCard = document.createElement('div');
    infoCard.id = 'ganttInfoCard';
    infoCard.className = 'content-card';
    infoCard.style.marginTop = '20px';
    
    const dict = state.currentLanguage === 'ar' ? {
        title: '📊 كيفية استخدام مخطط غانت',
        desc1: '• يعرض هذا المخطط المهام التي لها تواريخ استحقاق محددة',
        desc2: '• كل نقطة تمثل مهمة، والمحور الأفقي يمثل تسلسل المهام',
        desc3: '• النقاط الحمراء تشير إلى المهام المتأخرة (تاريخ الاستحقاق منتهي)',
        desc4: '• انقر على أي نقطة في الرسم البياني لعرض تفاصيل المهمة',
        tip: '💡 نصيحة: قم بإنشاء مهام مع تواريخ استحقاق لرؤيتها على هذا المخطط'
    } : {
        title: '📊 How to Use Gantt Chart',
        desc1: '• This chart displays tasks that have specific due dates',
        desc2: '• Each point represents a task, and the horizontal axis shows task sequence',
        desc3: '• Red points indicate overdue tasks (past due date)',
        desc4: '• Click on any point in the chart to view task details',
        tip: '💡 Tip: Create tasks with due dates to see them on this chart'
    };
    
    infoCard.innerHTML = `
        <h3><i class="fa-solid fa-circle-info"></i> ${dict.title}</h3>
        <div style="margin-top: 10px; font-size: 13px; color: var(--text-muted); line-height: 1.8;">
            <p>${dict.desc1}</p>
            <p>${dict.desc2}</p>
            <p>${dict.desc3}</p>
            <p>${dict.desc4}</p>
            <p style="margin-top: 10px; padding: 10px; background: rgba(74,108,247,0.1); border-radius: 6px; color: var(--primary);">${dict.tip}</p>
        </div>
    `;
    
    const chartCard = targetCanvas.closest('.content-card');
    if (chartCard && chartCard.parentNode) {
        chartCard.parentNode.insertBefore(infoCard, chartCard.nextSibling);
    }
    
    projectTimelineGanttChart = new Chart(coreCtx, {
        type: 'line',
        data: {
            labels: validDuedateTasks.map(t => t.name),
            datasets: [{
                label: 'Milestone Map Index Chronos Timeline',
                data: validDuedateTasks.map((t, index) => index + 1),
                borderColor: '#4a6cf7',
                pointBackgroundColor: validDuedateTasks.map(t => {
                    const now = new Date();
                    const due = new Date(t.dueDate);
                    return due < now && t.status !== 'done' ? '#e74c3c' : '#4a6cf7';
                }),
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.1,
                fill: false
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const task = validDuedateTasks[index];
                    openTaskDetailModal(task.id);
                }
            }
        }
    });
}