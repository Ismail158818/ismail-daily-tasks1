// ==========================================================================
// DRAG AND DROP INFRASTRUCTURE LOADER (KANBAN ENGINE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initializeAgileKanbanSortableEngine();
    populateKanbanFilter();
});

function initializeAgileKanbanSortableEngine() {
    const pipelines = ['tasks-todo', 'tasks-doing', 'tasks-review', 'tasks-pending-after-rejection', 'tasks-done', 'tasks-rejected'];
    pipelines.forEach(pipeId => {
        const targetElement = document.getElementById(pipeId);
        if (targetElement) {
            Sortable.create(targetElement, {
                group: 'shared-agile-kanban-framework',
                animation: 180,
                onEnd: (evt) => {
                    const taskId = evt.item.getAttribute("data-id");
                    const statusDestination = evt.to.id.replace("tasks-", "");
                    
                    // Route mutation task to proper structural entity (Private vs Shared)
                    mutateTaskPipelineStatus(taskId, statusDestination);
                }
            });
        }
    });
}

// ==========================================================================
// KANBAN FILTER POPULATION - تعبئة فلتر المشاريع
// ==========================================================================
function populateKanbanFilter() {
    const filterSelect = document.getElementById("kanbanTypeFilter");
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '';
    
    // إضافة خيار "الكل"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = state.currentLanguage === 'ar' ? 'جميع المشاريع' : 'All Projects';
    filterSelect.appendChild(allOption);
    
    // إضافة المشاريع العامة
    state.types.filter(t => !t.isPrivate).forEach(mod => {
        const option = document.createElement('option');
        option.value = mod.id;
        option.textContent = mod.name;
        filterSelect.appendChild(option);
    });
}

function filterKanbanBySprint() {
    const sprintFilter = document.getElementById("sprintFilter");
    if (!sprintFilter) return;
    
    state.currentSprintFilter = sprintFilter.value;
    renderKanbanBoard();
}

function populateSprintFilter() {
    const filterSelect = document.getElementById("sprintFilter");
    if (!filterSelect) return;
    
    const currentSprintFilter = state.currentSprintFilter || "all";
    
    // حفظ الخيار الحالي
    const currentValue = filterSelect.value;
    
    filterSelect.innerHTML = '';
    
    // إضافة خيار "الكل"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = state.currentLanguage === 'ar' ? 'جميع المهام' : 'All Tasks';
    filterSelect.appendChild(allOption);
    
    // إضافة السبرينتات
    if (state.sprints) {
        state.sprints.forEach(sprint => {
            const option = document.createElement('option');
            option.value = sprint.id;
            option.textContent = sprint.name + (sprint.isActive ? (state.currentLanguage === 'ar' ? ' (مفعل)' : ' (Active)') : '');
            if (sprint.id === currentValue) {
                option.selected = true;
            }
            filterSelect.appendChild(option);
        });
    }
}

function mutateTaskPipelineStatus(taskId, targetStatus) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    // 1. Search in shared cluster matrix
    let taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const task = state.tasks[taskIndex];
        const isMyTask = task.assignedUser === state.currentUser;
        
        // التحقق: لا يمكن نقل مهمة ليست لي إلى أعمدة أخرى
        if (!isAdmin && !isMyTask) {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكنك تحريك مهمة ليست لك' : 'You cannot move tasks that are not assigned to you', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        
        // الأدمن يمكنه نقل المهمة من "review" إلى "done" (بعد التحقق الناجح)
        // أو من "review" إلى "pending-after-rejection" (بعد الرفض)
        // أو من "pending-after-rejection" إلى "doing" (بعد الرفض بعد التحقق)
        if (isAdmin) {
            if (task.status === 'review' && targetStatus !== 'done' && targetStatus !== 'pending-after-rejection') {
                showToast(state.currentLanguage === 'ar' ? 'الأدمن يمكنه نقل المهمة من عمود المراجعة إلى مكتمل أو إلى رفض' : 'Admin can move task from Review column to Completed or Rejected', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
            
            if (targetStatus === 'pending-after-rejection' && task.status !== 'review') {
                showToast(state.currentLanguage === 'ar' ? 'الأدمن يمكنه نقل المهمة إلى رفض بعد التحقق من عمود المراجعة' : 'Admin can only move task to Rejected from Review column', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
            
            if (task.status === 'pending-after-rejection' && targetStatus !== 'doing') {
                showToast(state.currentLanguage === 'ar' ? 'الأدمن يمكنه نقل المهمة إلى قيد العمل من عمود رفض بعد التحقق' : 'Admin can only move task to In Progress from Pending After Rejection column', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
        }
        
        // المستخدم العادي لا يمكنه نقل المهمة إلى "done"
        if (!isAdmin && targetStatus === 'done') {
            showToast(state.currentLanguage === 'ar' ? 'فقط الأدمن يمكنه نقل المهمة إلى مكتمل' : 'Only admin can move task to completed', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        
        // المستخدم العادي لا يمكنه إعادة المهمة المقبولة (doing) إلى todo
        if (!isAdmin && task.status === 'doing' && targetStatus === 'todo') {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن إعادة المهمة المقبولة إلى التنفيذ' : 'Cannot move accepted task back to To Do', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        
        // لا يمكن نقل مهمة من "pending-after-rejection" إلى أعمدة أخرى غير "doing" (للمستخدم العادي)
        if (!isAdmin && task.status === 'pending-after-rejection' && targetStatus !== 'doing') {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن نقل المهمة من عمود pending-after-rejection إلا إلى قيد العمل' : 'Cannot move task from Pending After Rejection column except to In Progress', 'danger');
            executeGlobalInterfaceRefresh();
            return;
        }
        
        // تحديث timestamps حسب الحالة
        const now = new Date().toISOString();
        if (targetStatus === 'doing' && task.status !== 'doing') {
            state.tasks[taskIndex].startedAt = now;
        }
        if (targetStatus === 'done') {
            applyProductivityRewardWeight(task.assignedUser);
            state.tasks[taskIndex].completedAt = now;
        }
        if (targetStatus === 'rejected') {
            state.tasks[taskIndex].rejectedAt = now;
        }
        if (targetStatus === 'pending-after-rejection') {
            state.tasks[taskIndex].pendingAfterRejectionAt = now;
        }
        
        state.tasks[taskIndex].status = targetStatus;
        state.tasks[taskIndex].updatedAt = now;
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
        return;
    }
    
    // 2. Search in isolated encrypted user profile space vault
    let localPrivateVaultKey = `taskvibe_vault_${state.currentUser}`;
    let privateData = localStorage.getItem(localPrivateVaultKey);
    if (privateData) {
        let vault = JSON.parse(privateData);
        let pTaskIdx = vault.tasks.findIndex(t => t.id === taskId);
        if (pTaskIdx > -1) {
            const task = vault.tasks[pTaskIdx];
            
            // Private tasks: only owner can change (admin can also edit private tasks)
            if (task.assignedUser !== state.currentUser && !isAdmin) {
                showToast(state.currentLanguage === 'ar' ? 'لا يمكنك تحريك مهمة ليست لك' : 'You cannot move tasks that are not assigned to you', 'danger');
                renderPrivateIsolatedWorkspace();
                renderKanbanBoard();
                return;
            }
            
            const now = new Date().toISOString();
            
            // Private tasks: owner has full control - no admin restrictions
            if (targetStatus === 'doing' && task.status !== 'doing') {
                task.startedAt = now;
            }
            if (targetStatus === 'done') {
                task.completedAt = now;
            }
            if (targetStatus === 'rejected') {
                task.rejectedAt = now;
            }
            if (targetStatus === 'pending-after-rejection') {
                task.pendingAfterRejectionAt = now;
            }
            
            task.status = targetStatus;
            task.updatedAt = now;
            localStorage.setItem(localPrivateVaultKey, JSON.stringify(vault));
            renderPrivateIsolatedWorkspace();
            renderKanbanBoard();
        }
    }
}

function applyProductivityRewardWeight(user) {
    if (state.userMetrics[user]) {
        state.userMetrics[user].rating = Math.min(5.0, state.userMetrics[user].rating + 0.15);
    }
}

function getModuleName(typeId) {
    const module = state.types.find(t => t.id === typeId);
    return module ? module.name : '';
}

function getSprintName(sprintId) {
    const sprint = state.sprints ? state.sprints.find(s => s.id === sprintId) : null;
    return sprint ? sprint.name : '';
}

// فلترة كانبان حسب الحالة
function filterKanbanByStatus(status) {
    const filterSelect = document.getElementById("kanbanTypeFilter");
    if (filterSelect) {
        filterSelect.value = "all";
    }
    
    // إخفاء جميع الأعمدة ثم إظهار العمود المطلوب فقط
    const columns = ['todo', 'doing', 'review', 'pending-after-rejection', 'done', 'rejected'];
    columns.forEach(col => {
        const colEl = document.getElementById(`tasks-${col}`);
        const headerEl = document.querySelector(`#tasks-${col}`)?.parentElement;
        if (colEl) {
            if (col === status) {
                colEl.parentElement.style.display = 'flex';
            } else {
                colEl.parentElement.style.display = 'none';
            }
        }
    });
    
    // إعادة التهيئة بعد ثانية
    setTimeout(() => {
        columns.forEach(col => {
            const colEl = document.getElementById(`tasks-${col}`);
            if (colEl && colEl.parentElement) {
                colEl.parentElement.style.display = 'flex';
            }
        });
    }, 3000);
}

// إرجاع مهمة من العمود المرفوض إلى حالة قيد الانتظار
function moveTaskBackToReview(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const now = new Date().toISOString();
    state.tasks[taskIndex].status = 'todo';
    state.tasks[taskIndex].updatedAt = now;
    state.tasks[taskIndex].rejectionNote = '';
    state.tasks[taskIndex].rejectedAt = null;
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    
    showToast(state.currentLanguage === 'ar' ? 'تم إرجاع المهمة إلى قيد الانتظار' : 'Task moved back to To Do', 'success');
}

// رفض المهمة بعد المراجعة (نقل من review إلى pending-after-rejection)
function rejectAfterReview(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const promptText = state.currentLanguage === 'ar' ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):';
    const rejectionNote = prompt(promptText, '') || '';
    
    const now = new Date().toISOString();
    state.tasks[taskIndex].status = 'pending-after-rejection';
    state.tasks[taskIndex].rejectionNote = rejectionNote;
    state.tasks[taskIndex].pendingAfterRejectionAt = now;
    state.tasks[taskIndex].updatedAt = now;
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    
    showToast(state.currentLanguage === 'ar' ? 'تم رفض المهمة وإرجاعها' : 'Task rejected and moved', 'warning');
}

function renderKanbanBoard() {
    // إعادة تعبئة الفلتر عند كل تحديث
    populateKanbanFilter();
    
    // تعبئة فلتر السبرينتات
    populateSprintFilter();
    
    const activeModuleFilter = document.getElementById("kanbanTypeFilter")?.value || "all";
    const sprintFilter = document.getElementById("sprintFilter")?.value || "all";
    const globalQuery = document.getElementById("globalSearch")?.value.toLowerCase().trim() || "";
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    const isRTL = state.currentLanguage === 'ar';
    
    // الحصول على السبرينت النشط
    const activeSprint = state.sprints ? state.sprints.find(s => s.isActive) : null;
    
    const tracks = { todo: [], doing: [], review: [], pendingAfterRejection: [], done: [], rejected: [] };
    
    // Hydrate Shared tasks matching criteria
    state.tasks.forEach(t => {
        // تحقق من تفعيل السبرينت والمشروع: المهام تظهر فقط إذا كان المشروع والسبرينت مفعلين
        const taskModule = state.types.find(m => m.id === t.typeId);
        // المهام بدون مشروع أو سبرينت تظهر فقط إذا كانت مفعلة
        // المهام بها مشروع تحتاج المشروع مفعل
        // المهام بها سبرينت تحتاج السبرينت مفعل
        if (taskModule && taskModule.isActive === false) {
            return;
        }
        
        // تحقق من تفعيل السبرينت: إذا كانت للمهمة سبرينت، تحقق من تفعيله
        if (t.sprintId) {
            const taskSprint = state.sprints ? state.sprints.find(s => s.id === t.sprintId) : null;
            if (taskSprint && taskSprint.isActive === false) {
                return;
            }
        }
        
        // تحقق من التفعيل الجامع: المهام غير المفعلة لا تظهر
        if (t.isActive === false) {
            return;
        }
        
        if (activeModuleFilter !== "all" && t.typeId !== activeModuleFilter) return;
        if (sprintFilter !== "all" && t.sprintId !== sprintFilter) return;
        
        if (globalQuery && !t.name.toLowerCase().includes(globalQuery) && 
            !t.notes.toLowerCase().includes(globalQuery) &&
            !t.assignedUser.toLowerCase().includes(globalQuery) &&
            !t.tags.toLowerCase().includes(globalQuery)) return;
        
        // إضافة حالة rejected إلى tracks
        if (t.status === 'rejected') {
            tracks.rejected.push(t);
        } else if (tracks[t.status]) {
            tracks[t.status].push(t);
        }
    });
    
// Inject rendered structures systematically into DOM view tracks
    ['todo', 'doing', 'review', 'pending-after-rejection', 'done', 'rejected'].forEach(trackName => {
        const columnZone = document.getElementById(`tasks-${trackName}`);
        if (!columnZone) return;
        columnZone.innerHTML = "";
        
        const countEl = document.getElementById(`count-${trackName.replace(/-/g, '')}`);
        if (countEl) countEl.innerText = tracks[trackName.replace(/-/g, '')];
        if(trackName === 'done') {
            const doneCountEl = document.getElementById("count-done-status");
            if (doneCountEl) doneCountEl.innerText = tracks['done'];
        }
        
        tracks[`${trackName.replace(/-/g, '')}`].forEach(task => {
            let tagsMarkup = "";
            if (task.tags) {
                task.tags.split(",").forEach(tag => {
                    if(tag.trim()) tagsMarkup += `<span class="tag-badge">${tag.trim()}</span>`;
                });
            }
            
            // عرض سبب الرفض للمهام المرفوضة
            let rejectionNote = '';
            if (trackName === 'rejected' && task.rejectionNote) {
                rejectionNote = `<p style="font-size:11px; color:var(--danger); margin-top:6px; padding:6px; background:rgba(231,76,60,0.1); border-radius:4px;">
                    <i class="fa-solid fa-circle-exclamation"></i> ${task.rejectionNote}
                </p>`;
            }
            
            // عرض تواريخ البدء والانتهاء
            let timingInfo = '';
            if (task.startedAt) {
                const startedDate = new Date(task.startedAt);
                timingInfo += `<p style="font-size:10px; color:var(--text-muted); margin-top:2px;">
                    <i class="fa-solid fa-play"></i> ${startedDate.toLocaleDateString()} ${startedDate.toLocaleTimeString()}
                </p>`;
            }
            if (task.completedAt) {
                const completedDate = new Date(task.completedAt);
                timingInfo += `<p style="font-size:10px; color:var(--success); margin-top:2px;">
                    <i class="fa-solid fa-check"></i> ${completedDate.toLocaleDateString()} ${completedDate.toLocaleTimeString()}
                </p>`;
            }
            if (task.rejectedAt) {
                const rejectedDate = new Date(task.rejectedAt);
                timingInfo += `<p style="font-size:10px; color:var(--danger); margin-top:2px;">
                    <i class="fa-solid fa-times-circle"></i> ${rejectedDate.toLocaleDateString()} ${rejectedDate.toLocaleTimeString()}
                </p>`;
            }
            if (task.pendingAfterRejectionAt) {
                const pendingAfterRejectionDate = new Date(task.pendingAfterRejectionAt);
                timingInfo += `<p style="font-size:10px; color:var(--warning); margin-top:2px;">
                    <i class="fa-solid fa-undo"></i> ${pendingAfterRejectionDate.toLocaleDateString()} ${pendingAfterRejectionDate.toLocaleTimeString()}
                </p>`;
            }
            
// تحديد أزرار الإجراءات المتاحة
            let actionButtons = '';
            const isMyTask = task.assignedUser === state.currentUser;
            
            // الأدمن يمكنه حذف/تعديل أي مهمة في أي عمود (شارلط للمهام العامة)
            if (isAdmin && !task.isPrivate) {
                actionButtons += `
                    <button class="accept-task-btn" onclick="event.stopPropagation(); editTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="reject-task-btn" onclick="event.stopPropagation(); deleteTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
                
                // الأدمن يمكنه إعادة المهمة من عمود الرفض إلى البداية
                if (trackName === 'rejected') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); moveTaskBackToReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'إعادة للبداية' : 'Move to To Do'}">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                    `;
                }
                
                // الأدمن يمكنه رفض المهمة بعد التحقق (نقل من review إلى pending-after-rejection)
                if (trackName === 'review') {
                    actionButtons += `
                        <button class="accept-task-btn" onclick="event.stopPropagation(); rejectAfterReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض بعد التحقق' : 'Reject After Review'}">
                            <i class="fa-solid fa-times-circle"></i>
                        </button>
                    `;
                }
                
                // الأدمن يمكنه نقل المهمة إلى المرفوع من عمود المراجعة فقط
                if (trackName === 'review') {
                    actionButtons += `
                        <button class="reject-task-btn" onclick="event.stopPropagation(); moveTaskToRejected('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض المهمة' : 'Reject Task'}">
                            <i class="fa-solid fa-ban"></i>
                        </button>
                    `;
                }
            }
            
            // المستخدم العادي يمكنه قبول/رفض مهامه فقط (وليس مهام زملائه) في عمود todo
            if (!isAdmin && isMyTask && trackName === 'todo') {
                actionButtons += `
                    <button class="accept-task-btn" onclick="event.stopPropagation(); openTaskActionModal('${task.id}')" title="${state.currentLanguage === 'ar' ? 'قبول/رفض' : 'Accept/Reject'}">
                        <i class="fa-solid fa-clipboard-check"></i>
                    </button>
                `;
            }
            
            // Private tasks: owner can move to In Progress directly (no approval needed) - لا تظهر في الكانبان المشتركة
            if (task.isPrivate && isMyTask && trackName === 'todo') {
                actionButtons = `
                    <button class="accept-task-btn" onclick="event.stopPropagation(); acceptPrivateTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'ابدأ المهمة' : 'Start Task'}">
                        <i class="fa-solid fa-play"></i>
                    </button>
                    <button class="reject-task-btn" onclick="event.stopPropagation(); rejectPrivateTask('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض المهمة' : 'Reject Task'}">
                        <i class="fa-solid fa-times"></i>
                    </button>
                `;
            }
            
            // تطبيق لون الخط للمهام المكتملة
            const taskStyle = trackName === 'done' ? 'text-decoration: line-through; opacity: 0.6;' : '';
            
            // تطبيق حد أزرق للمهام الخاصة بالمستخدم
            const userAccentStyle = isMyTask && !isAdmin ? 'border-left: 3px solid var(--primary);' : '';
            
            // 3 نقط للمهام (تعديل، حذف، تفعيل)
            let taskDropdownButtons = '';
            if (task.isPrivate || isAdmin) {
                taskDropdownButtons = `
                    <div style="position: absolute; top: 8px; ${isRTL ? 'left' : 'right'}: 8px;">
                        <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--primary); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100; min-width: 100px;">
                            <button onclick="event.stopPropagation(); editTask('${task.id}', ${task.isPrivate})" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                            <button onclick="event.stopPropagation(); deleteTask('${task.id}', ${task.isPrivate})" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                            <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-power-off" style="color: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${task.isActive ? (state.currentLanguage === 'ar' ? 'إلغاء التفعيل' : 'Deactivate') : (state.currentLanguage === 'ar' ? 'تفعيل' : 'Activate')}</button>
                        </div>
                    </div>
                `;
            }
            
            columnZone.innerHTML += `
                <div class="task-card-agile" data-id="${task.id}" style="border-top: 4px solid ${task.customColor || '#4a6cf7'}; ${userAccentStyle}; cursor: pointer; position: relative;" onclick="openTaskDetailModal('${task.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h4 style="font-size:13px; font-weight:600; ${taskStyle}">${task.name}</h4>
                        ${task.isPrivate ? `<i class="fa-solid fa-user-lock" style="color:var(--accent-orange); font-size:11px;" title="Private Card"></i>` : ''}
                    </div>
                    <p style="font-size:11px; color:var(--text-muted); margin:4px 0;">${getModuleName(task.typeId)} ${task.sprintId ? ' • ' + getSprintName(task.sprintId) : ''}</p>
                    <p class="task-card-notes" style="${taskStyle}">${task.notes || ''}</p>
                    ${rejectionNote}
                    <div class="tags-wrapper">${tagsMarkup}</div>
                    <div class="task-footer-meta">
                        <span><i class="fa-solid fa-fingerprint"></i> ${task.assignedUser || 'Unallocated'}</span>
                        <span><i class="fa-solid fa-clock"></i> ${task.dueDate ? task.dueDate.split("T")[0] : 'Open Deadline'}</span>
                    </div>
                    ${timingInfo}
                    ${actionButtons ? `<div class="task-action-badge">${actionButtons}</div>` : ''}
                    ${taskDropdownButtons}
                </div>
            `;
        });
    });
    
    // تحديث كروت الإحصائيات
    const statTodo = document.getElementById("kanbanStatTodo");
    const statDoing = document.getElementById("kanbanStatDoing");
    const statReview = document.getElementById("kanbanStatReview");
    const statPendingAfterRejection = document.getElementById("kanbanStatPendingAfterRejection");
    const statDone = document.getElementById("kanbanStatDone");
    const statRejected = document.getElementById("kanbanStatRejected");
    
    if (statTodo) statTodo.innerText = tracks.todo.length;
    if (statDoing) statDoing.innerText = tracks.doing.length;
    if (statReview) statReview.innerText = tracks.review.length;
    if (statPendingAfterRejection) statPendingAfterRejection.innerText = tracks.pendingAfterRejection.length;
    if (statDone) statDone.innerText = tracks.done.length;
    if (statRejected) statRejected.innerText = tracks.rejected.length;
}

// Private task: Move to In Progress directly (no approval needed)
function acceptPrivateTask(taskId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    const task = vault.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    task.status = 'doing';
    task.startedAt = new Date().toISOString();
    
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderKanbanBoard();
}

// Private task: Reject with reason (mandatory)
function rejectPrivateTask(taskId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    const task = vault.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    const isRTL = state.currentLanguage === 'ar';
    const rejectionNote = prompt(isRTL ? 'سبب الرفض (إلزامي):' : 'Rejection reason (required):', '') || '';
    
    if (!rejectionNote.trim()) {
        showToast(isRTL ? 'سبب الرفض مطلوب' : 'Rejection reason is required', 'danger');
        return;
    }
    
    task.status = 'rejected';
    task.rejectionNote = rejectionNote;
    task.rejectedAt = new Date().toISOString();
    
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderKanbanBoard();
}

// إغلاق القوائم المنسدلة عند النقر خارجها
document.addEventListener('click', function(e) {
    if (!e.target.closest('.private-dropdown-menu') && !e.target.closest('[onclick*="toggleModuleActions"]') && !e.target.closest('[onclick*="toggleSprintActions"]') && !e.target.closest('[onclick*="toggleTaskActions"]') && !e.target.closest('[onclick*="togglePrivateModuleDropdown"]') && !e.target.closest('[onclick*="togglePrivateTaskDropdown"]')) {
        document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    }
});