// ==========================================================================
// KANBAN HELPERS
// ==========================================================================

function getTaskAssignees(task) {
    const assignees = [];
    if (task.assignedTo && Array.isArray(task.assignedTo)) assignees.push(...task.assignedTo);
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) assignees.push(...task.assignedUsers);
    if (task.assignedUser && typeof task.assignedUser === 'string') assignees.push(task.assignedUser);
    return assignees;
}

function isTaskAssignedToUser(task, username) {
    const assignees = getTaskAssignees(task);
    const normalizedUser = (username || '').replace(/\s+/g, '');
    return assignees.some(a => (a || '').replace(/\s+/g, '') === normalizedUser);
}

function getModuleName(typeId) {
    const module = state.types.find(t => t.id === typeId);
    return module ? module.name : '';
}

function getSprintName(sprintId) {
    if (!state.sprints || !sprintId) return '';
    const sprint = state.sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : '';
}

function getArabicStatusName(status) {
    const names = { assigned: 'قيد التكليف', doing: 'قيد العمل', review: 'قيد المراجعة', rejected: 'مرفوض', done: 'مكتمل' };
    return names[status] || status;
}

document.addEventListener("DOMContentLoaded", () => {
    initializeAgileKanbanSortableEngine();
    populateKanbanFilter();
});

function initializeAgileKanbanSortableEngine() {
    ['tasks-assigned', 'tasks-doing', 'tasks-review', 'tasks-done', 'tasks-rejected'].forEach(pipeId => {
        const el = document.getElementById(pipeId);
        if (!el) return;
        Sortable.create(el, {
            group: 'shared-agile-kanban-framework',
            animation: 180,
            onEnd: (evt) => {
                const taskId = evt.item.getAttribute("data-id");
                const targetStatus = evt.to.id.replace("tasks-", "");
                mutateTaskPipelineStatus(taskId, targetStatus);
            }
        });
    });
}

function populateKanbanFilter() {
    const filterSelect = document.getElementById("kanbanTypeFilter");
    if (!filterSelect) return;
    filterSelect.innerHTML = '<option value="all">' + (state.currentLanguage === 'ar' ? 'جميع المشاريع' : 'All Projects') + '</option>';
    state.types.filter(t => !t.isPrivate).forEach(mod => {
        filterSelect.innerHTML += `<option value="${mod.id}">${mod.name}</option>`;
    });
}

function populateSprintFilter() {
    const filterSelect = document.getElementById("sprintFilter");
    if (!filterSelect) return;
    filterSelect.innerHTML = '<option value="all">' + (state.currentLanguage === 'ar' ? 'جميع المهام' : 'All Tasks') + '</option>';
    if (state.sprints) {
        state.sprints.forEach(s => {
            filterSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
    }
}

function filterKanbanByStatus(status) {
    const filterSelect = document.getElementById("kanbanTypeFilter");
    if (filterSelect) filterSelect.value = "all";
    
    const columns = ['assigned', 'doing', 'review', 'done', 'rejected'];
    columns.forEach(col => {
        const colEl = document.getElementById(`tasks-${col}`);
        if (!colEl || !colEl.parentElement) return;
        colEl.parentElement.style.display = col === status ? 'flex' : 'none';
    });
    
    setTimeout(() => {
        columns.forEach(col => {
            const colEl = document.getElementById(`tasks-${col}`);
            if (colEl && colEl.parentElement) colEl.parentElement.style.display = 'flex';
        });
    }, 3000);
}

function mutateTaskPipelineStatus(taskId, targetStatus) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    let taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = state.tasks[taskIndex];
    const now = new Date().toISOString();
    const isMyTask = isTaskAssignedToUser(task, state.currentUser);
    
    console.log('[MUTATE] User:', state.currentUser, 'isAdmin:', isAdmin, 'isMyTask:', isMyTask, 'taskStatus:', task.status, 'target:', targetStatus, 'assignedTo:', JSON.stringify(task.assignedTo), 'assignedUser:', JSON.stringify(task.assignedUser));
    
    if (!isMyTask && !isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'هذه المهمة غير مكلف بها' : 'This task is not assigned to you', 'danger');
        executeGlobalInterfaceRefresh();
        return;
    }
    
    if (isMyTask && !isAdmin) {
        // assigned → doing (accept)
        if (task.status === 'assigned' && targetStatus === 'doing') {
            task.assignedTo = [state.currentUser];
            state.tasks[taskIndex].previousStatus = 'assigned';
            state.tasks[taskIndex].status = 'doing';
            state.tasks[taskIndex].startedAt = now;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'assigned' && targetStatus === 'rejected') {
            const reason = prompt(state.currentLanguage === 'ar' ? 'سبب الرفض (إلزامي):' : 'Rejection reason (required):', '') || '';
            if (!reason.trim()) {
                showToast(state.currentLanguage === 'ar' ? 'سبب الرفض مطلوب' : 'Rejection reason is required', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
            state.tasks[taskIndex].previousStatus = 'assigned';
            state.tasks[taskIndex].status = 'rejected';
            state.tasks[taskIndex].rejectionReason = reason;
            state.tasks[taskIndex].rejectedBy = state.currentUser;
            state.tasks[taskIndex].rejectedAt = now;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'doing' && targetStatus === 'review') {
            state.tasks[taskIndex].previousStatus = 'doing';
            state.tasks[taskIndex].status = 'review';
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'review' && targetStatus === 'doing') {
            state.tasks[taskIndex].previousStatus = 'review';
            state.tasks[taskIndex].status = 'doing';
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            showToast(state.currentLanguage === 'ar' ? 'تم إعادة المهمة إلى قيد العمل' : 'Task returned to In Progress', 'success');
            return;
        }
        
        if (task.status === 'rejected' && targetStatus === 'assigned') {
            state.tasks[taskIndex].previousStatus = 'rejected';
            state.tasks[taskIndex].status = 'assigned';
            state.tasks[taskIndex].rejectionReason = '';
            state.tasks[taskIndex].rejectedBy = '';
            state.tasks[taskIndex].rejectedAt = null;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        showToast(state.currentLanguage === 'ar' ? 'عملية غير مسموح بها' : 'Operation not allowed', 'danger');
        executeGlobalInterfaceRefresh();
        return;
    }
    
    if (isAdmin) {
        // Admin CANNOT touch doing or done
        if (task.status === 'doing') {
            showToast(state.currentLanguage === 'ar' ? 'الأدمن لا يمكنه نقل المهمة من قيد العمل' : 'Admin cannot move task from In Progress', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        if (task.status === 'done') {
            showToast(state.currentLanguage === 'ar' ? 'الأدمن لا يمكنه نقل المهمة من مكتمل' : 'Admin cannot move task from Completed', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'review' && targetStatus === 'done') {
            state.tasks[taskIndex].previousStatus = 'review';
            state.tasks[taskIndex].status = 'done';
            state.tasks[taskIndex].completedAt = now;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'review' && targetStatus === 'rejected') {
            const reason = prompt(state.currentLanguage === 'ar' ? 'سبب الرفض والملاحظات (إلزامي):' : 'Rejection reason and notes (required):', '') || '';
            if (!reason.trim()) {
                showToast(state.currentLanguage === 'ar' ? 'سبب الرفض مطلوب' : 'Rejection reason is required', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
            state.tasks[taskIndex].previousStatus = 'review';
            state.tasks[taskIndex].status = 'doing';
            state.tasks[taskIndex].rejectionReason = reason;
            state.tasks[taskIndex].rejectedBy = state.currentUser;
            state.tasks[taskIndex].rejectedAt = now;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            showToast(state.currentLanguage === 'ar' ? 'تم رفض المهمة وإعادتها لقيد العمل مع ملاحظات' : 'Task rejected and returned to In Progress with notes', 'warning');
            return;
        }
        
        if (task.status === 'rejected' && targetStatus === 'assigned') {
            state.tasks[taskIndex].previousStatus = 'rejected';
            state.tasks[taskIndex].status = 'assigned';
            state.tasks[taskIndex].rejectionReason = '';
            state.tasks[taskIndex].rejectedBy = '';
            state.tasks[taskIndex].rejectedAt = null;
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
        if (task.status === 'rejected' && targetStatus === 'doing') {
            state.tasks[taskIndex].previousStatus = 'rejected';
            state.tasks[taskIndex].status = 'doing';
            state.tasks[taskIndex].updatedAt = now;
            saveCoreRuntimeToStorage();
            executeGlobalInterfaceRefresh();
            return;
        }
        
     
        
        showToast(state.currentLanguage === 'ar' ? 'عملية غير مسموح بها' : 'Operation not allowed', 'danger');
        
        showToast(state.currentLanguage === 'ar' ? 'عملية غير مسموح بها' : 'Operation not allowed', 'danger');
        executeGlobalInterfaceRefresh();
        return;
    }
    
    showToast(state.currentLanguage === 'ar' ? 'عملية غير مسموح بها' : 'Operation not allowed', 'danger');
    executeGlobalInterfaceRefresh();
}
function renderKanbanBoard() {
    populateKanbanFilter();
    populateSprintFilter();
    
    const activeModuleFilter = document.getElementById("kanbanTypeFilter")?.value || "all";
    const sprintFilter = document.getElementById("sprintFilter")?.value || "all";
    const globalQuery = document.getElementById("globalSearch")?.value.toLowerCase().trim() || "";
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    const isRTL = state.currentLanguage === 'ar';
    
    const tracks = { assigned: [], doing: [], review: [], done: [], rejected: [] };
    
    state.tasks.forEach(t => {
        const taskModule = state.types.find(m => m.id === t.typeId);
        if (taskModule && taskModule.isActive === false) return;
        if (t.sprintId) {
            const taskSprint = state.sprints ? state.sprints.find(s => s.id === t.sprintId) : null;
            if (taskSprint && taskSprint.isActive === false) return;
        }
        if (t.isActive === false) return;
        if (activeModuleFilter !== "all" && t.typeId !== activeModuleFilter) return;
        if (sprintFilter !== "all" && t.sprintId !== sprintFilter) return;
        if (globalQuery && !t.name.toLowerCase().includes(globalQuery) && 
            !t.notes.toLowerCase().includes(globalQuery) &&
            !getTaskAssignees(t).some(a => a.toLowerCase().includes(globalQuery)) &&
            !t.tags.toLowerCase().includes(globalQuery)) return;
        
        if (t.status === 'rejected') tracks.rejected.push(t);
        else if (tracks[t.status]) tracks[t.status].push(t);
        else tracks.assigned.push(t);
    });
    
    ['assigned', 'doing', 'review', 'done', 'rejected'].forEach(trackName => {
        const columnZone = document.getElementById(`tasks-${trackName}`);
        if (!columnZone) return;
        columnZone.innerHTML = "";
        
        const countEl = document.getElementById(`count-${trackName}`);
        if (countEl && tracks[trackName]) countEl.innerText = tracks[trackName].length;
        if (!tracks[trackName] || !tracks[trackName].length) return;
        
        tracks[trackName].forEach(task => {
            let tagsMarkup = "";
            if (task.tags) {
                task.tags.split(",").forEach(tag => {
                    if(tag.trim()) tagsMarkup += `<span class="tag-badge">${tag.trim()}</span>`;
                });
            }
            
            let rejectionNote = '';
            if (trackName === 'rejected' && (task.rejectionReason || task.rejectionNote)) {
                const reasonText = task.rejectionReason || task.rejectionNote || '';
                rejectionNote = `<p style="font-size:11px; color:var(--danger); margin-top:6px; padding:6px; background:rgba(231,76,60,0.1); border-radius:4px;">
                    <i class="fa-solid fa-circle-exclamation"></i> ${reasonText}
                </p>`;
            }
            
            let timingInfo = '';
            if (task.startedAt) {
                const d = new Date(task.startedAt);
                timingInfo += `<p style="font-size:10px; color:var(--text-muted); margin-top:2px;"><i class="fa-solid fa-play"></i> ${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>`;
            }
            if (task.completedAt) {
                const d = new Date(task.completedAt);
                timingInfo += `<p style="font-size:10px; color:var(--success); margin-top:2px;"><i class="fa-solid fa-check"></i> ${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>`;
            }
            if (task.rejectedAt) {
                const d = new Date(task.rejectedAt);
                timingInfo += `<p style="font-size:10px; color:var(--danger); margin-top:2px;"><i class="fa-solid fa-times-circle"></i> ${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>`;
            }
            
            const assignedToDisplay = getTaskAssignees(task).length > 0 ? getTaskAssignees(task).join(', ') : 'Unallocated';
            let actionButtons = '';
            const isMyTask = isTaskAssignedToUser(task, state.currentUser);
            
            const taskModule = state.types.find(m => m.id === task.typeId);
            const isModuleActive = !taskModule || taskModule.isActive !== false;
            const taskSprint = state.sprints ? state.sprints.find(s => s.id === task.sprintId) : null;
            const isSprintActive = !taskSprint || taskSprint.isActive !== false;
            const isActivationAllowed = isModuleActive && isSprintActive;
            
            if (isAdmin) {
                actionButtons += `
                    <button class="accept-task-btn" onclick="event.stopPropagation(); editTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}"><i class="fa-solid fa-pen"></i></button>
                    <button class="reject-task-btn" onclick="event.stopPropagation(); deleteTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}"><i class="fa-solid fa-trash"></i></button>
                `;
                if (trackName === 'review') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); approveTaskFromReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'قبول (مكتمل)' : 'Approve'}"><i class="fa-solid fa-check"></i></button>
                        <button class="reject-task-btn" onclick="event.stopPropagation(); rejectTaskFromReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض (إعادة للعمل)' : 'Reject'}"><i class="fa-solid fa-times-circle"></i></button>
                    `;
                }
                if (trackName === 'rejected') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); reassignTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'إعادة تكليف' : 'Reassign'}"><i class="fa-solid fa-rotate-left"></i></button>
                    `;
                }
            }
            
            if (!isAdmin && isMyTask) {
                console.log('[RENDER DEBUG] Showing buttons for user:', state.currentUser, 'task:', task.id, 'track:', trackName);
                if (trackName === 'assigned') {
                    if (isActivationAllowed) {
                        actionButtons += `
                            <button class="accept-task-btn" onclick="event.stopPropagation(); acceptAssignedTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'قبول' : 'Accept'}"><i class="fa-solid fa-play"></i></button>
                            <button class="reject-task-btn" onclick="event.stopPropagation(); rejectAssignedTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض' : 'Reject'}"><i class="fa-solid fa-times"></i></button>
                        `;
                    } else {
                        actionButtons += `<button class="accept-task-btn" disabled style="opacity:0.5;cursor:not-allowed;" title="${state.currentLanguage === 'ar' ? 'المشروع أو السبرينت غير مفعل' : 'Project or sprint not active'}"><i class="fa-solid fa-play"></i></button>`;
                    }
                }
                if (trackName === 'doing') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); finishDoingTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'إنهاء (إرسال للمراجعة)' : 'Finish'}"><i class="fa-solid fa-check"></i></button>
                    `;
                }
                if (trackName === 'review' && task.previousStatus === 'doing') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); revertTaskToPrevious('${task.id}')" title="${state.currentLanguage === 'ar' ? 'إعادة لقيد العمل' : 'Back to In Progress'}" style="background:var(--warning);"><i class="fa-solid fa-rotate-left"></i></button>
                    `;
                }
            }
            
            const taskStyle = trackName === 'done' ? 'text-decoration: line-through; opacity: 0.7;' : '';
            const userAccentStyle = isMyTask && !isAdmin ? 'border-right: 3px solid var(--primary);' : '';
            
            let taskDropdown = '';
            if (isAdmin) {
                const taskModule = state.types.find(m => m.id === task.typeId);
                const isModuleActive = !taskModule || taskModule.isActive !== false;
                const taskSprint = state.sprints ? state.sprints.find(s => s.id === task.sprintId) : null;
                const isSprintActive = !taskSprint || taskSprint.isActive !== false;
                const isActivationAllowed = isModuleActive && isSprintActive;
                const activationOnClick = isActivationAllowed ? `toggleTaskActivation('${task.id}')` : '';
                const activationDisabled = !isActivationAllowed ? 'disabled' : '';
                taskDropdown = `
                    <div style="position:absolute;top:8px;${isRTL ? 'left' : 'right'}:8px;">
                        <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background:var(--primary);border:none;color:#fff;width:26px;height:26px;border-radius:4px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display:none;position:absolute;${isRTL ? 'left' : 'right'}:0;top:100%;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:6px;box-shadow:var(--shadow-lg);z-index:100;min-width:100px;">
                            <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display:block;width:100%;padding:6px 10px;text-align:${isRTL ? 'right' : 'left'};border:none;background:none;cursor:pointer;font-size:12px;"><i class="fa-solid fa-pen" style="color:var(--warning);margin-${isRTL ? 'left' : 'right'}:4px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                            <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display:block;width:100%;padding:6px 10px;text-align:${isRTL ? 'right' : 'left'};border:none;background:none;cursor:pointer;font-size:12px;"><i class="fa-solid fa-trash" style="color:var(--danger);margin-${isRTL ? 'left' : 'right'}:4px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                            <button onclick="event.stopPropagation(); ${activationOnClick}" ${activationDisabled} style="display:block;width:100%;padding:6px 10px;text-align:${isRTL ? 'right' : 'left'};border:none;background:none;cursor:${isActivationAllowed ? 'pointer' : 'not-allowed'};opacity:${isActivationAllowed ? 1 : 0.5};font-size:12px;"><i class="fa-solid fa-power-off" style="color:${task.isActive ? 'var(--success)' : 'var(--warning)'};margin-${isRTL ? 'left' : 'right'}:4px;"></i> ${task.isActive ? (state.currentLanguage === 'ar' ? 'إلغاء التفعيل' : 'Deactivate') : (state.currentLanguage === 'ar' ? 'تفعيل' : 'Activate')}</button>
                        </div>
                    </div>
                `;
            }
            
            columnZone.innerHTML += `
                <div class="task-card-agile" data-id="${task.id}" style="border-top:4px solid ${task.customColor || '#4a6cf7'};${userAccentStyle};cursor:pointer;position:relative;" onclick="openTaskDetailModal('${task.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <h4 style="font-size:13px;font-weight:600;${taskStyle}">${task.name}</h4>
                    </div>
                    <p style="font-size:11px;color:var(--text-muted);margin:4px 0;">${getModuleName(task.typeId)} ${task.sprintId ? ' • ' + getSprintName(task.sprintId) : ''}</p>
                    <p class="task-card-notes" style="${taskStyle}">${task.notes || ''}</p>
                    ${rejectionNote}
                    <div class="task-card-assigned" style="font-size:11px;color:var(--primary);margin:4px 0;">
                        <i class="fa-solid fa-users"></i> ${assignedToDisplay}
                    </div>
                    <div class="tags-wrapper">${tagsMarkup}</div>
                    <div class="task-footer-meta">
                        <span style="color:${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--danger)' : ''};"><i class="fa-solid fa-clock"></i> ${task.dueDate ? task.dueDate.split("T")[0] : 'Open Deadline'}</span>
                    </div>
                    ${timingInfo}
                    ${actionButtons ? `<div class="task-action-badge">${actionButtons}</div>` : ''}
                    ${taskDropdown}
                </div>
            `;
        });
    });
    
    const statAssigned = document.getElementById("kanbanStatAssigned");
    const statDoing = document.getElementById("kanbanStatDoing");
    const statReview = document.getElementById("kanbanStatReview");
    const statDone = document.getElementById("kanbanStatDone");
    const statRejected = document.getElementById("kanbanStatRejected");
    if (statAssigned) statAssigned.innerText = tracks.assigned.length;
    if (statDoing) statDoing.innerText = tracks.doing.length;
    if (statReview) statReview.innerText = tracks.review.length;
    if (statDone) statDone.innerText = tracks.done.length;
    if (statRejected) statRejected.innerText = tracks.rejected.length;
}

function acceptAssignedTask(taskId) { mutateTaskPipelineStatus(taskId, 'doing'); }
function rejectAssignedTask(taskId) { mutateTaskPipelineStatus(taskId, 'rejected'); }
function finishDoingTask(taskId) { mutateTaskPipelineStatus(taskId, 'review'); }
function approveTaskFromReview(taskId) { mutateTaskPipelineStatus(taskId, 'done'); }
function rejectTaskFromReview(taskId) { mutateTaskPipelineStatus(taskId, 'rejected'); }
function adminStartTask(taskId) { mutateTaskPipelineStatus(taskId, 'doing'); }

function reassignTask(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const now = new Date().toISOString();
    state.tasks[taskIndex].status = 'assigned';
    state.tasks[taskIndex].previousStatus = 'rejected';
    state.tasks[taskIndex].rejectionReason = '';
    state.tasks[taskIndex].rejectedBy = '';
    state.tasks[taskIndex].rejectedAt = null;
    state.tasks[taskIndex].updatedAt = now;
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    showToast(state.currentLanguage === 'ar' ? 'تم إعادة تكليف المهمة' : 'Task reassigned', 'success');
}

function revertTaskToPrevious(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = state.tasks[taskIndex];
    
    if (!task.previousStatus) return;
    
    const confirmMsg = state.currentLanguage === 'ar'
        ? `هل تريد إعادة المهمة "${task.name}" من "${getArabicStatusName(task.status)}" إلى "${getArabicStatusName(task.previousStatus)}"؟`
        : `Revert "${task.name}" from ${task.status} to ${task.previousStatus}?`;
    
    if (!confirm(confirmMsg)) return;
    
    const now = new Date().toISOString();
    const prevStatus = task.previousStatus;
    state.tasks[taskIndex].status = prevStatus;
    state.tasks[taskIndex].previousStatus = task.status;
    state.tasks[taskIndex].updatedAt = now;
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    showToast(state.currentLanguage === 'ar' ? `تم إعادة المهمة إلى "${getArabicStatusName(prevStatus)}"` : `Reverted to "${prevStatus}"`, 'success');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.private-dropdown-menu') && !e.target.closest('[onclick*="toggleModuleActions"]') && !e.target.closest('[onclick*="toggleSprintActions"]') && !e.target.closest('[onclick*="toggleTaskActions"]')) {
        document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    }
});
