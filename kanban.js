// ==========================================================================
// DRAG AND DROP INFRASTRUCTURE LOADER (KANBAN ENGINE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initializeAgileKanbanSortableEngine();
    populateKanbanFilter();
});

function initializeAgileKanbanSortableEngine() {
    const pipelines = ['tasks-todo', 'tasks-doing', 'tasks-review', 'tasks-pending-after-rejection', 'tasks-done'];
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
        
        // الأدمن يمكنه فقط نقل المهمة من "review" إلى "done" (بعد التحقق الناجح)
        // أو من "pending-after-rejection" إلى "doing" (بعد الرفض بعد التحقق)
        if (isAdmin) {
            if (targetStatus === 'done' && task.status !== 'review') {
                showToast(state.currentLanguage === 'ar' ? 'الأدمن يمكنه نقل المهمة إلى مكتمل فقط من عمود المراجعة (Review)' : 'Admin can only move task to completed from Review column', 'danger');
                executeGlobalInterfaceRefresh();
                return;
            }
            
            if (targetStatus === 'doing' && task.status !== 'pending-after-rejection') {
                showToast(state.currentLanguage === 'ar' ? 'الأدمن يمكنه نقل المهمة إلى قيد العمل فقط من عمود pending-after-rejection' : 'Admin can only move task to In Progress from Pending After Rejection column', 'danger');
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
        
        // لا يمكن نقل مهمة من "review" إلى أعمدة أخرى غير "done"
        if (task.status === 'review' && targetStatus !== 'done') {
            showToast(state.currentLanguage === 'ar' ? 'المهمة في المراجعة لا يمكن نقلها إلا إلى مكتمل' : 'Task in review can only be moved to Completed', 'danger');
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
            const now = new Date().toISOString();
            if (targetStatus === 'doing' && vault.tasks[pTaskIdx].status !== 'doing') {
                vault.tasks[pTaskIdx].startedAt = now;
            }
            if (targetStatus === 'done') {
                vault.tasks[pTaskIdx].completedAt = now;
            }
            if (targetStatus === 'rejected') {
                vault.tasks[pTaskIdx].rejectedAt = now;
            }
            if (targetStatus === 'pending-after-rejection') {
                vault.tasks[pTaskIdx].pendingAfterRejectionAt = now;
            }
            
            vault.tasks[pTaskIdx].status = targetStatus;
            vault.tasks[pTaskIdx].updatedAt = now;
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
    
    // الحصول على السبرينت النشط
    const activeSprint = state.sprints ? state.sprints.find(s => s.isActive) : null;
    
    const tracks = { todo: [], doing: [], review: [], pendingAfterRejection: [], done: [], rejected: [] };
    
    // Hydrate Shared tasks matching criteria
    state.tasks.forEach(t => {
        // تحقق من تفعيل السبرينت: إذا كان السبرينت غير مفعل، لا تظهر مهامه
        if (t.sprintId && !activeSprint) {
            // لا توجد سبرينت مفعل، اخفي كل المهام التابعة لسبرينت
            return;
        }
        if (t.sprintId && activeSprint && t.sprintId !== activeSprint.id) {
            // السبرينت النشط ليس السبرينت الذي تتبع له المهمة
            return;
        }
        
        if (activeModuleFilter !== "all" && t.typeId !== activeModuleFilter) return;
        if (sprintFilter !== "all" && t.sprintId !== sprintFilter) return;
        
        // إخفاء المهام الخاصة بالمستخدمين الآخرين من غير الأدمن
        if (!isAdmin && t.assignedUser !== state.currentUser) return;
        
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
    
    // Hydrate Private tasks to board matching execution limits
    let localPrivateVaultKey = `taskvibe_vault_${state.currentUser}`;
    let privateStorageData = localStorage.getItem(localPrivateVaultKey);
    if (privateStorageData) {
        let vault = JSON.parse(privateStorageData);
        vault.tasks.forEach(pt => {
            if (activeModuleFilter !== "all" && pt.typeId !== activeModuleFilter) return;
            if (globalQuery && !pt.name.toLowerCase().includes(globalQuery) && 
                !pt.notes.toLowerCase().includes(globalQuery) &&
                !pt.assignedUser.toLowerCase().includes(globalQuery) &&
                !pt.tags.toLowerCase().includes(globalQuery)) return;
            if (pt.status === 'rejected') {
                tracks.rejected.push(pt);
            } else if (tracks[pt.status]) {
                tracks[pt.status].push(pt);
            }
        });
    }
    
    // Inject rendered structures systematically into DOM view tracks
    ['todo', 'doing', 'review', 'pendingAfterRejection', 'done', 'rejected'].forEach(trackName => {
        const columnZone = document.getElementById(`tasks-${trackName}`);
        if (!columnZone) return;
        columnZone.innerHTML = "";
        
        const countEl = document.getElementById(`count-${trackName}`);
        if (countEl) countEl.innerText = tracks[trackName].length;
        if(trackName === 'done') {
            const doneCountEl = document.getElementById("count-done-status");
            if (doneCountEl) doneCountEl.innerText = tracks[trackName].length;
        }
        
        tracks[trackName].forEach(task => {
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
             
             // الأدمن يمكنه حذف/تعديل أي مهمة في أي عمود
             if (isAdmin && !task.isPrivate) {
                 actionButtons += `
                     <button class="accept-task-btn" onclick="editTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}">
                         <i class="fa-solid fa-pen"></i>
                     </button>
                     <button class="reject-task-btn" onclick="deleteTask('${task.id}', false)" title="${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}">
                         <i class="fa-solid fa-trash"></i>
                     </button>
                 `;
                 
                 // الأدمن يمكنه إعادة المهمة من عمود الرفض إلى البداية
                 if (trackName === 'rejected') {
                     actionButtons += `
                         <button class="accept-task-btn" onclick="moveTaskBackToReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'إعادة للبداية' : 'Move to To Do'}">
                             <i class="fa-solid fa-rotate-left"></i>
                         </button>
                     `;
                 }
                 
                 // الأدمن يمكنه رفض المهمة بعد التحقق (نقل من review إلى pending-after-rejection)
                 if (trackName === 'review') {
                     actionButtons += `
                         <button class="accept-task-btn" onclick="rejectAfterReview('${task.id}')" title="${state.currentLanguage === 'ar' ? 'رفض بعد التحقق' : 'Reject After Review'}">
                             <i class="fa-solid fa-times-circle"></i>
                         </button>
                     `;
                 }
                 
                 // الأدمن يمكنه نقل أي مهمة إلى عمود المرفوض (إلا إذا كانت منسقة بالفعل)
                 if (trackName !== 'rejected' && trackName !== 'done') {
                     actionButtons += `
                         <button class="reject-task-btn" onclick="moveTaskToRejected('${task.id}')" title="${state.currentLanguage === 'ar' ? 'النقل إلى المرفوع' : 'Move to Rejected'}">
                             <i class="fa-solid fa-ban"></i>
                         </button>
                     `;
                 }
             }
             
             // المستخدم العادي يمكنه قبول/رفض مهامه فقط (وليس مهام زملائه)
             if (!isAdmin && isMyTask && trackName === 'todo') {
                 actionButtons += `
                     <button class="accept-task-btn" onclick="openTaskActionModal('${task.id}')" title="${state.currentLanguage === 'ar' ? 'قبول/رفض' : 'Accept/Reject'}">
                         <i class="fa-solid fa-clipboard-check"></i>
                     </button>
                 `;
             }
             
             // تطبيق لون الخط للمهام المكتملة
             const taskStyle = trackName === 'done' ? 'text-decoration: line-through; opacity: 0.6;' : '';
             
             // تطبيق حد أزرق للمهام الخاصة بالمستخدم
             const userAccentStyle = isMyTask && !isAdmin ? 'border-left: 3px solid var(--primary);' : '';
             
             columnZone.innerHTML += `
                 <div class="task-card-agile" data-id="${task.id}" style="border-top: 4px solid ${task.customColor || '#4a6cf7'}; ${userAccentStyle}">
                     <div style="display:flex; justify-content:space-between; align-items:start;">
                         <h4 style="font-size:13px; font-weight:600; ${taskStyle}">${task.name}</h4>
                         ${task.isPrivate ? `<i class="fa-solid fa-user-lock" style="color:var(--accent-orange); font-size:11px;" title="Private Card"></i>` : ''}
                     </div>
                     <p class="task-card-notes" style="${taskStyle}">${task.notes || ''}</p>
                     ${rejectionNote}
                     <div class="tags-wrapper">${tagsMarkup}</div>
                     <div class="task-footer-meta">
                         <span><i class="fa-solid fa-fingerprint"></i> ${task.assignedUser || 'Private'}</span>
                         <span><i class="fa-solid fa-clock"></i> ${task.dueDate ? task.dueDate.split("T")[0] : 'Open Deadline'}</span>
                     </div>
                     ${timingInfo}
                     ${actionButtons ? `<div class="task-action-badge">${actionButtons}</div>` : ''}
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
