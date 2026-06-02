// ==========================================================================
// MY TASKS CARD - عرض بطاقة مهام المستخدم في اللوحة المشتركة
// ==========================================================================
function renderMyTasksCard() {
    const container = document.getElementById("myTasksCardContainer");
    if (!container) return;
    
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    // Get user's private tasks (from vault) and shared tasks assigned to them
    let privateTasks = [];
    let localPrivateVaultKey = `taskvibe_vault_${state.currentUser}`;
    let privateData = localStorage.getItem(localPrivateVaultKey);
    if (privateData) {
        let vault = JSON.parse(privateData);
        privateTasks = vault.tasks || [];
    }
    
    const sharedTasks = isAdmin 
        ? state.tasks.filter(t => t.assignedUser === state.currentUser) 
        : state.tasks.filter(t => t.assignedUser === state.currentUser);
    
    const myTasks = [...privateTasks, ...sharedTasks];
    const pendingTasks = myTasks.filter(t => t.status === 'assigned');
    const inProgressTasks = myTasks.filter(t => t.status === 'doing');
    const completedTasks = myTasks.filter(t => t.status === 'done');
    
    const dict = state.currentLanguage === 'ar' ? {
        title: 'مهامي',
        pending: 'معلقة',
        inProgress: 'قيد العمل',
        completed: 'مكتملة'
    } : {
        title: 'My Tasks',
        pending: 'Pending',
        inProgress: 'In Progress',
        completed: 'Completed'
    };
    
    container.innerHTML = `
        <div class="stat-card" style="grid-column: span 2; cursor: default;">
            <div class="stat-info">
                <h3 style="font-size: 16px; margin-bottom: 10px;"><i class="fa-solid fa-user"></i> ${dict.title}</h3>
                <div style="display: flex; gap: 20px;">
                    <div style="text-align: center;">
                        <strong style="color: var(--text-muted); font-size: 20px;">${pendingTasks.length}</strong>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${dict.pending}</p>
                    </div>
                    <div style="text-align: center;">
                        <strong style="color: var(--warning); font-size: 20px;">${inProgressTasks.length}</strong>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${dict.inProgress}</p>
                    </div>
                    <div style="text-align: center;">
                        <strong style="color: var(--success); font-size: 20px;">${completedTasks.length}</strong>
                        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${dict.completed}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// CORE DATA VISUALIZATION AND PERFORMANCE METRICS ANALYTICS ENGINE
// ==========================================================================
let systemDistributionBarChart = null;
let projectTimelineGanttChart = null;

function renderDashboardSummaryHub() {
    // Only public modules for dashboard stats
    const publicTypes = state.types.filter(t => !t.isPrivate);
    const publicTasks = state.tasks.filter(t => !t.isPrivate);
    
    const totalCount = publicTasks.length;
    const completedCount = publicTasks.filter(t => t.status === 'done').length;
    const trackingClockTime = new Date();
    const overdueCount = publicTasks.filter(t => t.status !== 'done' && t.status !== 'rejected' && t.dueDate && new Date(t.dueDate) < trackingClockTime).length;
    const rejectedCount = publicTasks.filter(t => t.status === 'rejected').length;
    const totalModules = publicTypes.length;
    const activeModules = publicTypes.filter(t => t.isActive !== false).length;
    const inactiveModules = totalModules - activeModules;
    const totalSprints = state.sprints ? state.sprints.length : 0;
    const activeSprints = state.sprints ? state.sprints.filter(s => s.isActive !== false).length : 0;
    const inactiveSprints = totalSprints - activeSprints;
    
    const activeTasks = totalCount - rejectedCount;
    const functionalProductivityFactor = activeTasks > 0 ? Math.round((completedCount / activeTasks) * 100) : 0;
    
    if(document.getElementById("statTotalTasks")) document.getElementById("statTotalTasks").innerText = totalCount;
    if(document.getElementById("statCompletedTasks")) document.getElementById("statCompletedTasks").innerText = completedCount;
    if(document.getElementById("statDelayedTasks")) document.getElementById("statDelayedTasks").innerText = overdueCount;
    if(document.getElementById("statCompletionRate")) document.getElementById("statCompletionRate").innerText = functionalProductivityFactor + "%";
    
    // Update module and sprint count stats
    const totalModulesEl = document.getElementById("statTotalModules");
    const totalSprintsEl = document.getElementById("statTotalSprints");
    const activeModulesEl = document.getElementById("statActiveModules");
    const inactiveModulesEl = document.getElementById("statInactiveModules");
    const activeSprintsEl = document.getElementById("statActiveSprints");
    const inactiveSprintsEl = document.getElementById("statInactiveSprints");
    
    if (totalModulesEl) totalModulesEl.innerText = totalModules;
    if (activeModulesEl) activeModulesEl.innerText = activeModules;
    if (inactiveModulesEl) inactiveModulesEl.innerText = inactiveModules;
    if (totalSprintsEl) totalSprintsEl.innerText = totalSprints;
    if (activeSprintsEl) activeSprintsEl.innerText = activeSprints;
    if (inactiveSprintsEl) inactiveSprintsEl.innerText = inactiveSprints;
    
    renderSharedModulesStackList();
    renderDistributionVisualizationCharts();
}

function getSprintName(sprintId) {
    const sprint = state.sprints ? state.sprints.find(s => s.id === sprintId) : null;
    return sprint ? sprint.name : '';
}

function getModuleName(typeId) {
    const module = state.types.find(t => t.id === typeId);
    return module ? module.name : '';
}

function openModuleDetailModal(moduleId) {
    const moduleType = state.types.find(t => t.id === moduleId);
    if (!moduleType) return;
    
    const existingModal = document.getElementById('moduleDetailModal');
    if (existingModal) existingModal.remove();
    
    const moduleTasks = state.tasks.filter(t => t.typeId === moduleId);
    const moduleSprints = state.sprints ? state.sprints.filter(s => s.typeId === moduleId) : [];
    
    const dict = state.currentLanguage === 'ar' ? {
        title: 'تفاصيل المشروع',
        description: 'الوصف',
        tasks: 'المهام',
        sprints: 'السبرينتات',
        color: 'اللون',
        createdAt: 'تاريخ الإنشاء',
        close: 'إغلاق'
    } : {
        title: 'Project Details',
        description: 'Description',
        tasks: 'Tasks',
        sprints: 'Sprints',
        color: 'Color',
        createdAt: 'Created At',
        close: 'Close'
    };
    
    let tasksList = '';
    moduleTasks.forEach(t => {
        tasksList += `<li style="padding: 6px 0; border-bottom: 1px solid var(--border-color);">${t.name} - <span class="status-${t.status}">${t.status}</span></li>`;
    });
    
    let sprintsList = '';
    moduleSprints.forEach(s => {
        sprintsList += `<li style="padding: 6px 0; border-bottom: 1px solid var(--border-color);">${s.name} (${s.isActive ? 'Active' : 'Inactive'})</li>`;
    });
    
    const modal = document.createElement('div');
    modal.id = 'moduleDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-folder"></i> ${dict.title}: ${moduleType.name}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('moduleDetailModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                ${moduleType.notes ? `<p><strong>${dict.description}:</strong><br>${moduleType.notes}</p>` : ''}
                <p><strong>${dict.color}:</strong> <span style="background:${moduleType.color};width:20px;height:20px;display:inline-block;border-radius:4px;"></span></p>
                <h4 style="margin-top:15px;"><i class="fa-solid fa-list"></i> ${dict.tasks} (${moduleTasks.length})</h4>
                <ul style="list-style:none; padding:0; margin:10px 0; max-height:150px; overflow-y:auto;">${tasksList || '<li style="color:var(--text-muted);">No tasks</li>'}</ul>
                ${moduleSprints.length > 0 ? `<h4 style="margin-top:15px;"><i class="fa-solid fa-sprint"></i> ${dict.sprints} (${moduleSprints.length})</h4>
                <ul style="list-style:none; padding:0; margin:10px 0; max-height:150px; overflow-y:auto;">${sprintsList}</ul>` : ''}
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('moduleDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==========================================================================
// TASK DETAIL MODAL - عرض تفاصيل المهمة عند النقر
// ==========================================================================
function openTaskDetailModal(taskId) {
    let task = state.tasks.find(t => t.id === taskId);
    let isPrivate = false;
    
    // Check private vault if not found in shared tasks
    if (!task) {
        const vaultKey = `taskvibe_vault_${state.currentUser}`;
        const privateData = localStorage.getItem(vaultKey);
        if (privateData) {
            let vault = JSON.parse(privateData);
            task = vault.tasks.find(t => t.id === taskId);
            if (task) isPrivate = true;
        }
    }
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
                                <p><strong>${dict.assignee}:</strong> ${(task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : (task.assignedUser || 'Unassigned'))}</p>
                ${task.dueDate ? `<p><strong>${dict.dueDate}:</strong> ${task.dueDate.split('T')[0]}</p>` : ''}
                ${task.tags ? `<p><strong>${dict.tags}:</strong> ${task.tags}</p>` : ''}
                ${task.notes ? `<p><strong>${dict.notes}:</strong></p><p style="background: var(--bg-surface); padding: 10px; border-radius: 4px; margin-top: 5px;">${task.notes}</p>` : ''}
                ${task.startedAt ? `<p><strong>${state.currentLanguage === 'ar' ? 'بدأ في' : 'Started at'}:</strong> ${new Date(task.startedAt).toLocaleString()}</p>` : ''}
                ${task.completedAt ? `<p><strong>${state.currentLanguage === 'ar' ? 'انتهى في' : 'Completed at'}:</strong> ${new Date(task.completedAt).toLocaleString()}</p>` : ''}
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('taskDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// نافذة تفصيلية للسبرينت
function openSprintDetailModal(sprintId) {
    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    const existingModal = document.getElementById('sprintDetailModal');
    if (existingModal) existingModal.remove();
    
    const sprintTasks = state.tasks.filter(t => t.sprintId === sprintId);
    
    const dict = state.currentLanguage === 'ar' ? {
        title: 'تفاصيل السبرينت',
        status: 'الحالة',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        tasks: 'المهام',
        taskList: 'قائمة المهام',
        close: 'إغلاق'
    } : {
        title: 'Sprint Details',
        status: 'Status',
        startDate: 'Start Date',
        endDate: 'End Date',
        tasks: 'Tasks',
        taskList: 'Task List',
        close: 'Close'
    };
    
    let tasksListHTML = '';
    sprintTasks.forEach(task => {
        tasksListHTML += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px;">${task.name}</td>
                <td style="padding: 8px;"><span class="status-${task.status}" style="font-size: 11px;">${task.status}</span></td>
                <td style="padding: 8px;">${task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : task.assignedUser}</td>
                <td style="padding: 8px;">${task.dueDate ? task.dueDate.split('T')[0] : '-'}</td>
            </tr>
        `;
    });
    
    const modal = document.createElement('div');
    modal.id = 'sprintDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-sprint"></i> ${dict.title}: ${sprint.name}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('sprintDetailModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <p><strong>${dict.status}:</strong> <span class="status-${sprint.status}">${sprint.isActive ? 'Active' : 'Inactive'}</span></p>
                <p><strong>${dict.startDate}:</strong> ${sprint.startDate || '-'}</p>
                <p><strong>${dict.endDate}:</strong> ${sprint.endDate || '-'}</p>
                ${sprint.description ? `<p><strong>${dict.notes || 'Notes'}:</strong></p><p style="background: var(--bg-surface); padding: 10px; border-radius: 4px;">${sprint.description}</p>` : ''}
                <h4 style="margin-top: 20px; margin-bottom: 10px;"><i class="fa-solid fa-list"></i> ${dict.taskList} (${sprintTasks.length})</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-base);">
                                <th style="text-align: left; padding: 8px;">${dict.name || 'Name'}</th>
                                <th style="text-align: left; padding: 8px;">${dict.status}</th>
                                <th style="text-align: left; padding: 8px;">${dict.assignee || 'Assignee'}</th>
                                <th style="text-align: left; padding: 8px;">${dict.dueDate || 'Due Date'}</th>
                            </tr>
                        </thead>
                        <tbody>${tasksListHTML || `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">${dict.tasks}: 0</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('sprintDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function renderSharedModulesStackList() {
    const renderBox = document.getElementById("typesList");
    if (!renderBox) return;
    renderBox.innerHTML = "";
    
    // Only public modules
    const publicTypes = state.types.filter(t => !t.isPrivate);
    
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    const isRTL = state.currentLanguage === 'ar';
    const dict = isRTL ? {
        createSprint: 'سبرينت جديد',
        createTask: 'مهمة جديدة',
        noTasks: 'لا توجد مهام',
        noSprints: 'لا توجد سبرينتات داخل هذا المشروع',
        addDirectTask: 'إنشاء مهمة مباشرة',
        edit: 'تعديل',
        delete: 'حذف',
        viewDetails: 'عرض التفاصيل',
        toggleSprint: 'تفعيل السبرينت',
        cancelSprint: 'إلغاء التفعيل',
        addTaskToSprint: 'إضافة مهمة للسبرينت'
    } : {
        createSprint: 'New Sprint',
        createTask: 'New Task',
        noTasks: 'No tasks',
        noSprints: 'No sprints in this project',
        addDirectTask: 'Add Direct Task',
        edit: 'Edit',
        delete: 'Delete',
        viewDetails: 'View Details',
        toggleSprint: 'Activate Sprint',
        cancelSprint: 'Deactivate',
        addTaskToSprint: 'Add Task to Sprint'
    };
    
    publicTypes.forEach(moduleType => {
        const subsetTasks = state.tasks.filter(t => t.typeId === moduleType.id && !t.sprintId);
        const moduleSprints = state.sprints ? state.sprints.filter(s => s.typeId === moduleType.id) : [];
        let sprintsHTML = "";
        
        moduleSprints.forEach(sprint => {
            const sprintTasks = state.tasks.filter(t => t.sprintId === sprint.id);
            let tasksHTML = "";
            sprintTasks.forEach(task => {
                const isDone = task.status === 'done';
                const taskColor = task.customColor && task.customColor !== '#4a6cf7' ? task.customColor : sprint.color;
                const taskModule = state.types.find(m => m.id === task.typeId);
                const isModuleActive = !taskModule || taskModule.isActive !== false;
                const isSprintActive = !sprint || sprint.isActive !== false;
                const isActivationAllowed = isModuleActive && isSprintActive;
                const isMyTask = (task.assignedTo && task.assignedTo.includes(state.currentUser)) || task.assignedUser === state.currentUser;
                tasksHTML += `
                    <div style="border-top: 3px solid ${taskColor}; margin: 6px 0; padding: 8px; background: var(--bg-surface); border-radius: 4px; border-${isRTL ? 'right' : 'left'}: 2px solid ${isMyTask ? 'var(--primary)' : 'transparent'}; cursor: pointer; position: relative;" onclick="openTaskDetailModal('${task.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                            <div>
                                <span style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
                                <small style="display: block; color: var(--text-muted); font-size: 11px;">${(task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : (task.assignedUser || 'Unallocated'))} • ${task.status}</small>
                            </div>
                            ${isAdmin && isActivationAllowed ? `<div style="display: flex; gap: 2px; align-items: center;">
                                <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="background: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;" title="${task.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}"><i class="fa-solid fa-power-off"></i></button>
                                <div style="position: relative; display: inline-block;">
                                    <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--primary); border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                    <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100; min-width: 100px;">
                                        <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                                        <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                                    </div>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });
            
sprintsHTML += `
            <div class="sprint-card" style="border: 2px dashed ${sprint.color}; border-radius: 8px; padding: 12px; margin: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                    <strong style="color: ${sprint.color}; font-size: 14px; cursor: pointer;" onclick="openSprintDetailModal('${sprint.id}')"><i class="fa-solid fa-sprint"></i> ${sprint.name}</strong>
                    ${isAdmin ? `<div style="display: flex; gap: 4px; align-items: center;">
                        <button class="btn-primary-sm" onclick="createTaskForSprint('${sprint.id}')" title="${dict.createTask}" style="background: ${sprint.color};"><i class="fa-solid fa-plus"></i></button>
                        <button onclick="event.stopPropagation(); toggleSprintActivation('${sprint.id}')" style="background: ${sprint.isActive && moduleType.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: ${moduleType.isActive ? 'pointer' : 'not-allowed'}; font-size: 12px; opacity: ${moduleType.isActive ? '1' : '0.5'};" title="${!moduleType.isActive ? (isRTL ? 'قم بتفعيل المشروع أولاً' : 'Activate project first') : (sprint.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل السبرينت' : 'Activate Sprint'))}">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                        <div style="position: relative; display: inline-block;">
                            <button onclick="event.stopPropagation(); toggleSprintActions('${sprint.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 4px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="sprintActions_${sprint.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                <button onclick="event.stopPropagation(); openEditSprintModal('${sprint.id}')" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${dict.edit}</button>
                                <button onclick="event.stopPropagation(); deleteSprint('${sprint.id}')" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${dict.delete}</button>
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
        const isDirectModuleActive = moduleType.isActive !== false;
        subsetTasks.forEach(task => {
            const isDone = task.status === 'done';
            const taskColor = task.customColor || moduleType.color;
            const isMyTask = (task.assignedTo && task.assignedTo.includes(state.currentUser)) || task.assignedUser === state.currentUser;
            directTasksHTML += `
                <div style="border-top: 3px solid ${taskColor}; margin: 6px 0; padding: 8px; background: var(--bg-surface); border-radius: 4px; border-${isRTL ? 'right' : 'left'}: 2px solid ${isMyTask ? 'var(--primary)' : 'transparent'}; cursor: pointer; position: relative;" onclick="openTaskDetailModal('${task.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div>
                            <span style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
                            <small style="display: block; color: var(--text-muted); font-size: 11px;">${task.assignedUser || 'Unallocated'} • ${task.status}</small>
                        </div>
                        ${isAdmin && isDirectModuleActive ? `<div style="display: flex; gap: 2px; align-items: center;">
                            <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="background: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;" title="${task.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}"><i class="fa-solid fa-power-off"></i></button>
                            <div style="position: relative; display: inline-block;">
                                <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--primary); border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100; min-width: 100px;">
                                    <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                                    <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        });
        
        renderBox.innerHTML += `
            <div class="module-card" style="border-${isRTL ? 'right' : 'left'}: 4px solid ${moduleType.color}; background: var(--bg-surface); border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--border-color); box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="padding: 14px; border-bottom: 3px solid ${moduleType.color}; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: ${moduleType.color}; cursor: pointer;" onclick="openModuleDetailModal('${moduleType.id}')"><i class="fa-solid fa-folder" style="margin-${isRTL ? 'right' : 'left'}: 8px;"></i> ${moduleType.name}</h3>
                    ${isAdmin ? `<div style="display: flex; gap: 6px;">
                        <button class="btn-primary-sm" onclick="openSprintModal(null, '${moduleType.id}')" style="background: var(--success);"><i class="fa-solid fa-sprint"></i> ${isRTL ? 'سبرينت' : 'Sprint'}</button>
                        <button class="btn-primary-sm" onclick="event.stopPropagation(); toggleModuleActivation('${moduleType.id}')" style="background: ${moduleType.isActive ? 'var(--success)' : 'var(--warning)'};" title="${moduleType.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                        <div style="position: relative; display: inline-block;">
                            <button onclick="event.stopPropagation(); toggleModuleActions('${moduleType.id}')" style="background: var(--primary); border: none; color: #fff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-ellipsis-vertical"></i> <span style="font-size: 12px;">${isRTL ? 'خيارات' : 'Options'}</span></button>
                            <div id="moduleActions_${moduleType.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 120px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100;">
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
            </div>
        `;
    });
}

function toggleModuleActions(moduleId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
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

function renderSystemAnalyticsDashboard() {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    const modulesGrid = document.getElementById("analyticsModulesGrid");
    if(!modulesGrid) return;
    modulesGrid.innerHTML = "";
    
    const isRTL = state.currentLanguage === 'ar';
    const dict = isRTL ? {
        tasks: 'مهمة',
        completion: 'إنجاز',
        volume: 'الحجم'
    } : {
        tasks: 'Task',
        completion: 'Completion',
        volume: 'Volume'
    };
    
    // Show project stats as analytics cards
    state.types.filter(t => !t.isPrivate).forEach(m => {
        const subTasks = state.tasks.filter(t => t.typeId === m.id);
        const resolved = subTasks.filter(t => t.status === 'done').length;
        const completionRate = subTasks.length > 0 ? Math.round((resolved / subTasks.length) * 100) : 0;
        
        modulesGrid.innerHTML += `
            <div class="analytics-module-card" style="border-left: 4px solid ${m.color}; background: var(--bg-surface); border-radius: 8px; padding: 12px; margin: 8px 0; border: 1px solid var(--border-color);">
                <h4 style="font-weight:700; color:${m.color}"><i class="fa-solid fa-folder"></i> ${m.name}</h4>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:10px;">
                    <span>${isRTL ? dict.tasks : 'Tasks'}: <strong>${subTasks.length}</strong></span>
                    <span>${isRTL ? dict.completion : 'Completion'}: <strong>${completionRate}%</strong></span>
                </div>
                <div style="background: var(--bg-base); height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden;">
                    <div style="width: ${completionRate}%; background: ${m.color}; height: 100%;"></div>
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
                starsMarkup += `<i class="fa-${s <= roundedRating ? 'solid' : 'regular'} fa-star star-rating" style="color: ${s <= roundedRating ? 'var(--warning)' : 'var(--text-muted)'};"></i>`;
            }
            
            tableBody.innerHTML += `
                <tr>
                    <td><strong><i class="fa-solid fa-user-gear"></i> ${resourceName}</strong></td>
                    <td>${data.logins} ${isRTL ? 'دخول' : 'Logins'}</td>
                    <td>${Math.ceil(data.workingHours || 1)} ${isRTL ? 'ساعة' : 'Hours'}</td>
                    <td>
                        <span style="font-weight:700; color:var(--primary);">${productivityRatio}%</span>
                        <span style="font-size:11px; color:var(--text-muted);"> (${complete}/${resourceTasks.length} ${isRTL ? dict.tasks : 'tasks'})</span>
                    </td>
                    <td>${starsMarkup}</td>
                </tr>
            `;
        });
    }
}

// إغلاق القوائم المنسدلة عند النقر خارجها
document.addEventListener('click', function(e) {
    if (!e.target.closest('.private-dropdown-menu') && !e.target.closest('[onclick*="toggleModuleActions"]') && !e.target.closest('[onclick*="toggleSprintActions"]') && !e.target.closest('[onclick*="toggleTaskActions"]')) {
        document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    }
});

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
            <div style="margin-top: 15px; background: var(--bg-surface); padding: 10px; border-radius: 6px; font-size: 12px;">
                <strong>${state.currentLanguage === 'ar' ? 'مفتاح الألوان:' : 'Legend:'}</strong><br>
                <span style="color: var(--success); font-weight: 600;">● ${state.currentLanguage === 'ar' ? 'مهام مكتملة' : 'Completed Tasks'}</span><br>
                <span style="color: var(--danger); font-weight: 600;">● ${state.currentLanguage === 'ar' ? 'مهام متأخرة غير مكتملة' : 'Overdue Uncompleted Tasks'}</span>
            </div>
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
                label: state.currentLanguage === 'ar' ? 'المهام مع المنسق' : 'Tasks with Assignee',
                data: validDuedateTasks.map((t, index) => index + 1),
                borderColor: '#4a6cf7',
                pointBackgroundColor: validDuedateTasks.map(t => {
                    const now = new Date();
                    const due = new Date(t.dueDate);
                    return due < now && t.status !== 'done' ? '#e74c3c' : '#4a6cf7';
                }),
                pointRadius: 8,
                pointHoverRadius: 12,
                tension: 0.1,
                fill: false
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const task = validDuedateTasks[context.dataIndex];
                            return task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo.join(', ') : (task.assignedUser || (state.currentLanguage === 'ar' ? 'غير مُعيَّن' : 'Unassigned'));
                        }
                    }
                }
            },
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