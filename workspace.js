// ==========================================================================
// VAULT MANAGEMENT (ISOLATED WORKSPACE)
// ==========================================================================
function renderPrivateIsolatedWorkspace() {
    const isRTL = state.currentLanguage === 'ar';
    const currentUser = state.currentUser;
    const vaultContainer = document.getElementById("privateTypesList");
    if (!vaultContainer) return;
    vaultContainer.innerHTML = "";
    
    // زر إنشاء مشروع خاص في الأعلى
    vaultContainer.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button class="btn-primary-sm" onclick="openPrivateModuleModal()" style="background: var(--success); width: 100%; padding: 10px;">
                <i class="fa-solid fa-folder-plus"></i> ${state.currentLanguage === 'ar' ? 'إنشاء مشروع خاص' : 'Create Private Project'}
            </button>
        </div>
    `;
    
    let localPrivateVaultKey = `taskvibe_vault_${currentUser}`;
    let currentVaultData = localStorage.getItem(localPrivateVaultKey);
    
    if (!currentVaultData) {
        let initialVaultStructure = { types: [], tasks: [] };
        localStorage.setItem(localPrivateVaultKey, JSON.stringify(initialVaultStructure));
        currentVaultData = JSON.stringify(initialVaultStructure);
    }
    
    let vault = JSON.parse(currentVaultData);
    
    if (vault.types.length === 0) {
        vaultContainer.innerHTML += `<p style="font-size:12px; color:var(--text-muted); padding:10px;">${state.currentLanguage === 'ar' ? 'لا توجد مشاريع خاصة بعد' : 'No private projects yet.'}</p>`;
        return;
    }
    
vault.types.forEach(pType => {
        const pTasks = vault.tasks.filter(t => t.typeId === pType.id);
        let tasksMarkup = "";
        
        pTasks.forEach(pt => {
            tasksMarkup += `
                <div class="task-mini-item ${pt.status === 'done' ? 'done-status' : ''}" style="border-right: 4px solid ${pt.customColor || pType.color}; background: linear-gradient(135deg, rgba(230, 126, 34, 0.02) 0%, rgba(230, 126, 34, 0) 100%); border-radius: 6px; margin: 4px 0; padding: 8px;">
                    <div class="task-left-part">
                        <i class="fa-solid fa-user-lock" style="color:var(--accent-orange)"></i>
                        <div class="task-inner-details">
                            <h4>${pt.name}</h4>
                            <span class="task-note-display-label">${state.currentLanguage === 'ar' ? 'خاص بك فقط' : 'Private to you'}</span>
                        </div>
                    </div>
                    <div style="position: relative; display: inline-block;">
                        <button class="btn-primary-sm" onclick="event.stopPropagation(); togglePrivateTaskDropdown('${pt.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 4px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div id="privateTaskDropdown-${pt.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 80px;">
                            <button onclick="event.stopPropagation(); openModifyExistingTaskModal('${pt.id}', true)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                            <button onclick="event.stopPropagation(); deleteTask('${pt.id}', true)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const dict = state.currentLanguage === 'ar' ? {
            createTask: 'مهمة جديدة',
            createSprint: 'سبرينت جديد',
            activate: 'تفعيل',
            deactivate: 'إلغاء التفعيل',
            viewDetails: 'عرض التفاصيل',
            delete: 'حذف',
            edit: 'تعديل'
        } : {
            createTask: 'New Task',
            createSprint: 'New Sprint',
            activate: 'Activate',
            deactivate: 'Deactivate',
            viewDetails: 'View Details',
            delete: 'Delete',
            edit: 'Edit'
        };
        
        // Get sprints for this module
        const moduleSprints = vault.sprints ? vault.sprints.filter(s => s.typeId === pType.id) : [];
        
        let sprintsMarkup = '';
        moduleSprints.forEach(sprint => {
            const sprintTasks = vault.tasks.filter(t => t.sprintId === sprint.id);
            let sprintTasksMarkup = '';
            sprintTasks.forEach(task => {
                sprintTasksMarkup += `<div style="padding: 4px 0; font-size: 11px;">${task.name} - <span class="status-${task.status}">${task.status}</span></div>`;
            });
            sprintsMarkup += `
                <div style="margin: 8px 0; padding: 8px; border: 1px dashed ${sprint.color}; border-radius: 6px; background: rgba(74,108,247,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="color: ${sprint.color}; font-size: 12px; cursor: pointer;" onclick="viewSprintDetails('${sprint.id}')"><i class="fa-solid fa-sprint"></i> ${sprint.name}</strong>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="event.stopPropagation(); toggleSprintActivation('${sprint.id}')" style="background: ${sprint.isActive && pType.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 20px; height: 20px; border-radius: 4px; cursor: ${pType.isActive ? 'pointer' : 'not-allowed'}; font-size: 10px; opacity: ${pType.isActive ? '1' : '0.5'};" title="${!pType.isActive ? (isRTL ? 'قم بتفعيل المشروع أولاً' : 'Activate project first') : (sprint.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل السبرينت' : 'Activate Sprint'))}">
                            <i class="fa-solid fa-power-off"></i>
                        </div>
                    </div>
                    ${sprintTasksMarkup ? `<div style="margin-top: 4px;">${sprintTasksMarkup}</div>` : ''}
                </div>
            `;
        });
        
        vaultContainer.innerHTML += `
            <div class="type-item-row" style="border-left-color: ${pType.color}; background: rgba(230, 126, 34, 0.04); border-radius: 8px; overflow: hidden;">
                <div class="type-row-header" style="background: linear-gradient(135deg, ${pType.color}15 0%, ${pType.color}05 100%);">
                    <strong style="cursor: pointer;" onclick="openModuleDetailModal('${pType.id}', true)"><i class="fa-solid fa-shield-halted"></i> ${pType.name}</strong>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="btn-primary-sm" style="background:var(--success)" onclick="openSprintModal(null, '${pType.id}')"><i class="fa-solid fa-sprint"></i> ${state.currentLanguage === 'ar' ? 'سبرينت' : 'Sprint'}</button>
                        <button class="btn-primary-sm" onclick="event.stopPropagation(); togglePrivateModuleActivation('${pType.id}')" style="background: ${pType.isActive ? 'var(--success)' : 'var(--warning)'};"><i class="fa-solid fa-power-off"></i></button>
                        <div style="position: relative; display: inline-block;">
                            <button class="btn-primary-sm" onclick="event.stopPropagation(); togglePrivateModuleDropdown('${pType.id}')" style="background: var(--primary);"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="privateModuleDropdown-${pType.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100; min-width: 100px;">
                                <button onclick="event.stopPropagation(); openPrivateModuleModal('${pType.id}')" style="display: block; width: 100%; padding: 8px 12px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 13px; font-family: var(--font-stack);"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 6px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                                <button onclick="event.stopPropagation(); deletePrivateModule('${pType.id}')" style="display: block; width: 100%; padding: 8px 12px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 13px; font-family: var(--font-stack);"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 6px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
                ${moduleSprints.length > 0 ? `<div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);"><h4 style="font-size: 12px; margin: 8px 0; color: var(--text-muted);"><i class="fa-solid fa-sprint" style="margin-${isRTL ? 'right' : 'left'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'السبرينتات' : 'Sprints'}</h4>${sprintsMarkup}</div>` : ''}
                <div style="padding: 8px 12px;">${tasksMarkup || `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 8px;">${state.currentLanguage === 'ar' ? 'لا توجد مهام' : 'No tasks'}</p>`}</div>
            </div>
        `;
    });
}

// ==========================================================================
// PRIVATE KANBAN BOARD RENDER
// ==========================================================================
function renderPrivateKanban() {
    const isRTL = state.currentLanguage === 'ar';
    const filterSelect = document.getElementById("privateModuleFilter");
    if (filterSelect) {
        // Populate filter with private modules
        const vaultKey = `taskvibe_vault_${state.currentUser}`;
        const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
        
        // Keep "All" option
        const allOptions = filterSelect.querySelectorAll('option');
        allOptions.forEach(opt => opt.remove());
        
        filterSelect.innerHTML = `<option value="all">${state.currentLanguage === 'ar' ? 'كل مشاريعي الخاصة' : 'All My Private Projects'}</option>`;
        vault.types.forEach(t => {
            filterSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });
    }
    
    const moduleFilter = document.getElementById("privateModuleFilter")?.value || "all";
    const tracks = { todo: [], doing: [], done: [], rejected: [] };
    
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[],"sprints":[]}');
    
    // Get active private sprint for filtering
    const activePrivateSprint = vault.sprints ? vault.sprints.find(s => s.isActive) : null;
    
    vault.tasks.forEach(task => {
        // Check module activation: tasks with modules only show if module is active
        const taskModule = vault.types ? vault.types.find(m => m.id === task.typeId) : null;
        if (taskModule && taskModule.isActive === false) {
            return;
        }
        
        // Check sprint activation: tasks with sprints only show if sprint is active
        // Tasks without sprints always show
        if (task.sprintId && activePrivateSprint && task.sprintId !== activePrivateSprint.id) {
            return;
        }
        
        // Check task activation
        if (task.isActive === false) {
            return;
        }
        
        if (moduleFilter !== "all" && task.typeId !== moduleFilter) return;
        
        if (task.status === 'rejected') {
            tracks.rejected.push(task);
        } else if (tracks[task.status]) {
            tracks[task.status].push(task);
        }
    });
    
    // Render private kanban columns
    ['todo', 'doing', 'done', 'rejected'].forEach(status => {
        const column = document.getElementById(`p-tasks-${status}`);
        const count = document.getElementById(`p-count-${status}`);
        
        if (column) column.innerHTML = "";
        if (count) count.innerText = tracks[status].length;
        
        tracks[status].forEach(task => {
            const type = vault.types.find(t => t.id === task.typeId);
            const isDone = task.status === 'done';
            const taskColor = task.customColor || (type ? type.color : '#4a6cf7');
            
// 3 نقط للمهام الخاصة (تعديل، حذف) - زر التفعيل منفصل
             let actionButtons = `
                 <div style="position: absolute; top: 8px; ${isRTL ? 'left' : 'right'}: 8px; display: flex; gap: 4px;">
                     <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="background: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="${task.isActive ? (state.currentLanguage === 'ar' ? 'إلغاء التفعيل' : 'Deactivate') : (state.currentLanguage === 'ar' ? 'تفعيل' : 'Activate')}">
                         <i class="fa-solid fa-power-off"></i>
                     </button>
                     <button onclick="event.stopPropagation(); togglePrivateTaskDropdown('${task.id}')" style="background: var(--primary); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                     <div id="privateTaskDropdown-${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100; min-width: 100px;">
                         <button onclick="event.stopPropagation(); openModifyExistingTaskModal('${task.id}', true)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}</button>
                         <button onclick="event.stopPropagation(); deleteTask('${task.id}', true)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px;"></i> ${state.currentLanguage === 'ar' ? 'حذف' : 'Delete'}</button>
                     </div>
                 </div>
             `;
            
            column.innerHTML += `
                <div class="task-card-agile" data-id="${task.id}" style="border-top: 4px solid ${taskColor}; position: relative; cursor: pointer;" onclick="openTaskDetailModal('${task.id}')">
                    ${actionButtons}
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h4 style="font-size:13px; font-weight:600; ${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</h4>
                    </div>
                    <p class="task-card-notes">${task.notes || ''}</p>
                    <div class="task-footer-meta">
                        <span><i class="fa-solid fa-fingerprint"></i> ${task.assignedUser}</span>
                        <span><i class="fa-solid fa-clock"></i> ${task.dueDate ? task.dueDate.split("T")[0] : '-'}</span>
                    </div>
                </div>
            `;
        });
    });
    
    // Initialize sortable for private kanban
    ['p-tasks-todo', 'p-tasks-doing', 'p-tasks-done', 'p-tasks-rejected'].forEach(pipeId => {
        const el = document.getElementById(pipeId);
        if (el && !el.sortable) {
            Sortable.create(el, {
                group: 'private-kanban',
                animation: 180,
                onEnd: (evt) => {
                    const taskId = evt.item.getAttribute("data-id");
                    const statusDestination = evt.to.id.replace("p-tasks-", "");
                    mutatePrivateTaskStatus(taskId, statusDestination);
                }
            });
        }
    });
}

// Handle private task status change
function mutatePrivateTaskStatus(taskId, targetStatus) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    const task = vault.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Private tasks: owner has full control
    const now = new Date().toISOString();
    if (targetStatus === 'doing' && task.status !== 'doing') {
        task.startedAt = now;
    }
    if (targetStatus === 'done') {
        task.completedAt = now;
    }
    if (targetStatus === 'rejected') {
        task.rejectedAt = now;
    }
    
    task.status = targetStatus;
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderPrivateKanban();
}

// Toggle task activation in private workspace
function toggleTaskActivation(taskId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    const task = vault.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Check if module is active
    if (task.typeId) {
        const module = vault.types.find(m => m.id === task.typeId);
        if (module && module.isActive === false) {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل المهمة قبل تفعيل المشروع' : 'Cannot activate task before activating the project', 'warning');
            return;
        }
    }
    
    // Check if sprint is active
    if (task.sprintId && vault.sprints) {
        const sprint = vault.sprints.find(s => s.id === task.sprintId);
        if (sprint && sprint.isActive === false) {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل المهمة قبل تفعيل السبرينت' : 'Cannot activate task before activating the sprint', 'warning');
            return;
        }
    }
    
    task.isActive = !task.isActive;
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderPrivateKanban();
}

// Toggle sprint activation in private workspace
function togglePrivateSprintActivation(sprintId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    
    if (!vault.sprints) vault.sprints = [];
    
    const sprint = vault.sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    // Check if module is active
    const module = vault.types.find(m => m.id === sprint.typeId);
    if (module && module.isActive === false) {
        showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل السبرينت قبل تفعيل المشروع' : 'Cannot activate sprint before activating the project', 'warning');
        return;
    }
    
    sprint.isActive = !sprint.isActive;
    
    // Deactivate other sprints when activating this one
    if (sprint.isActive) {
        vault.sprints.forEach(s => {
            if (s.id !== sprintId) {
                s.isActive = false;
            }
        });
    }
    
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderPrivateIsolatedWorkspace();
    renderPrivateKanban();
    showToast(
        state.currentLanguage === 'ar'
            ? (sprint.isActive ? `تم تفعيل السبرينت "${sprint.name}"` : `تم إلغاء تفعيل السبرينت "${sprint.name}"`)
            : (sprint.isActive ? `Sprint "${sprint.name}" activated` : `Sprint "${sprint.name}" deactivated`),
        sprint.isActive ? 'success' : 'warning'
    );
}

// Get private sprint name
function getPrivateSprintName(sprintId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vaultData = localStorage.getItem(vaultKey);
    if (!vaultData) return '';
    const vault = JSON.parse(vaultData);
    const sprint = vault.sprints ? vault.sprints.find(s => s.id === sprintId) : null;
    return sprint ? sprint.name : '';
}

// الثلاث نقط للمشروع - تبقى مفتوحة عند النقر
function toggleModuleActions(moduleId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`moduleActions_${moduleId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// الثلاث نقط للسبرينت - تبقى مفتوحة عند النقر
function toggleSprintActions(sprintId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`sprintActions_${sprintId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// الثلاث نقط للمهمة - تبقى مفتوحة عند النقر
function toggleTaskActions(taskId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`taskActions_${taskId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// الثلاث نقط للسبرينت في الصفحة الخاصة
function toggleSprintDropdown(sprintId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const dropdown = document.getElementById(`sprintDropdown-${sprintId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// الثلاث نقط للمهمة في الصفحة الخاصة (مستخدمة بالفعل لكن التأكيد)
function togglePrivateTaskDropdown(taskId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const dropdown = document.getElementById(`privateTaskDropdown-${taskId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// الثلاث نقط للمشروع في الصفحة الخاصة (مستخدمة بالفعل لكن التأكيد)
function togglePrivateModuleDropdown(moduleId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const dropdown = document.getElementById(`privateModuleDropdown-${moduleId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// تعديل مشروع خاص
function openPrivateModuleModal(moduleId) {
    const isRTL = state.currentLanguage === 'ar';
    
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
    
    // إذا لم يتم تمرير moduleId، هذا يعني إنشاء مشروع جديد
    if (!moduleId) {
        document.getElementById("typeId").value = "";
        document.getElementById("typeName").value = "";
        if (document.getElementById("typeNotes")) document.getElementById("typeNotes").value = '';
        if (document.getElementById("typeColor")) document.getElementById("typeColor").value = '#4a6cf7';
        document.getElementById("typeIsPrivate").value = "true";
        
        document.getElementById("typeModalTitle").innerHTML = '<i class="fa-solid fa-folder-plus"></i> ' + (isRTL ? 'إنشاء مشروع خاص' : 'Create Private Project');
        
        openModal('typeModal');
        return;
    }
    
    // تعديل مشروع موجود - يمكن للمالك فقط التعديل
    const moduleType = vault.types.find(t => t.id === moduleId);
    if (!moduleType) return;
    
    // لا حاجة للتحقق من الأدمن - المشروع الخاص للمالك
    document.getElementById("typeId").value = moduleType.id;
    document.getElementById("typeName").value = moduleType.name;
    if (document.getElementById("typeNotes")) document.getElementById("typeNotes").value = moduleType.notes || '';
    if (document.getElementById("typeColor")) document.getElementById("typeColor").value = moduleType.color || '#4a6cf7';
    document.getElementById("typeIsPrivate").value = "true";
    
    document.getElementById("typeModalTitle").innerHTML = '<i class="fa-solid fa-folder-open"></i> ' + (isRTL ? 'تعديل المشروع' : 'Edit Module');
    
    openModal('typeModal');
}

// حذف مشروع خاص - للمالك فقط (ليس للأدمن)
function deletePrivateModule(moduleId) {
    const isRTL = state.currentLanguage === 'ar';
    
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey));
    const moduleType = vault.types.find(t => t.id === moduleId);
    
    if (!moduleType) return;
    
    const confirmText = isRTL ? `هل تريد حذف المشروع "${moduleType.name}" وجميع مهامه؟` : `Are you sure you want to delete module "${moduleType.name}" and all its tasks?`;
    if (!confirm(confirmText)) return;
    
    vault.tasks = vault.tasks.filter(t => t.typeId !== moduleId);
    vault.types = vault.types.filter(t => t.id !== moduleId);
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderPrivateIsolatedWorkspace();
    showToast(isRTL ? 'تم حذف المشروع' : 'Module deleted', 'success');
}

// ==========================================================================
// SPRINT MANAGEMENT SYSTEM - نظام إدارة السبرينتات
// ==========================================================================

// تهيئة نظام السبرينتات
function initializeSprintsSystem() {
    if (!state.sprints) {
        state.sprints = [];
    }
}

// فتح نموذج السبرينت (إنشاء/تعديل)
function openSprintModal(sprintId = null, moduleId = null) {
    document.getElementById("sprintId").value = sprintId || "";
    document.getElementById("sprintModuleId").value = moduleId || "";
    document.getElementById("sprintName").value = "";
    document.getElementById("sprintDescription").value = "";
    document.getElementById("sprintStartDate").value = "";
    document.getElementById("sprintEndDate").value = "";
    document.getElementById("sprintColor").value = "#4a6cf7";

    const dict = state.currentLanguage === 'ar' ? {
        title: sprintId ? 'تعديل السبرينت' : 'سبرينت جديد'
    } : {
        title: sprintId ? 'Edit Sprint' : 'New Sprint'
    };

    document.getElementById("sprintModalTitle").innerHTML = `<i class="fa-solid fa-sprint"></i> ${dict.title}`;

    openModal('sprintModal');
}

// حفظ السبرينت
function saveSprint(event) {
    event.preventDefault();
    
    const sprintId = document.getElementById("sprintId").value;
    const moduleId = document.getElementById("sprintModuleId").value;
    const name = document.getElementById("sprintName").value.trim();
    const description = document.getElementById("sprintDescription").value.trim();
    const startDate = document.getElementById("sprintStartDate").value;
    const endDate = document.getElementById("sprintEndDate").value;
    const color = document.getElementById("sprintColor").value;
    
    if (!name) return;
    
    // Check if this is for a private module
    const isPrivate = moduleId && document.getElementById("privateModuleFilter")?.value !== "all";
    
    if (isPrivate) {
        // Save private sprint to vault
        const vaultKey = `taskvibe_vault_${state.currentUser}`;
        let vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[],"sprints":[]}');
        
        if (!vault.sprints) vault.sprints = [];
        
        if (sprintId) {
            const sprintIndex = vault.sprints.findIndex(s => s.id === sprintId);
            if (sprintIndex > -1) {
                vault.sprints[sprintIndex].name = name;
                vault.sprints[sprintIndex].description = description;
                vault.sprints[sprintIndex].startDate = startDate;
                vault.sprints[sprintIndex].endDate = endDate;
                vault.sprints[sprintIndex].color = color;
            }
        } else {
            const newSprint = {
                id: "spr_" + Date.now(),
                typeId: moduleId,
                name: name,
                description: description,
                startDate: startDate,
                endDate: endDate,
                color: color,
                isActive: false,
                createdAt: new Date().toISOString()
            };
            vault.sprints.push(newSprint);
        }
        
        localStorage.setItem(vaultKey, JSON.stringify(vault));
        closeModal('sprintModal');
        renderPrivateIsolatedWorkspace();
        if (typeof renderPrivateKanban === 'function') renderPrivateKanban();
        showToast(state.currentLanguage === 'ar' ? 'تم حفظ السبرينت' : 'Sprint saved', 'success');
    } else {
        // Save shared sprint to state (admin only)
        if (sprintId) {
            const sprintIndex = state.sprints.findIndex(s => s.id === sprintId);
            if (sprintIndex > -1) {
                state.sprints[sprintIndex].name = name;
                state.sprints[sprintIndex].description = description;
                state.sprints[sprintIndex].startDate = startDate;
                state.sprints[sprintIndex].endDate = endDate;
                state.sprints[sprintIndex].color = color;
            }
        } else {
            const newSprint = {
                id: "spr_" + Date.now(),
                typeId: moduleId,
                name: name,
                description: description,
                startDate: startDate,
                endDate: endDate,
                color: color,
                isActive: false,
                createdAt: new Date().toISOString()
            };
            state.sprints.push(newSprint);
        }
        
        saveCoreRuntimeToStorage();
        closeModal('sprintModal');
        executeGlobalInterfaceRefresh();
        showToast(state.currentLanguage === 'ar' ? 'تم حفظ السبرينت' : 'Sprint saved', 'success');
    }
}

// تفعيل/إلغاء تفعيل السبرينت (للأدمن فقط)
function toggleSprintActivation(sprintId) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }
    
    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    // Check if module is active
    const module = state.types.find(m => m.id === sprint.typeId);
    if (module && module.isActive === false) {
        showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل السبرينت قبل تفعيل المشروع' : 'Cannot activate sprint before activating the project', 'warning');
        return;
    }
    
    sprint.isActive = !sprint.isActive;
    
    if (sprint.isActive) {
        state.sprints.forEach(s => {
            if (s.id !== sprintId) {
                s.isActive = false;
            }
        });
    }
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    renderKanbanBoard();
    
    showToast(
        state.currentLanguage === 'ar'
            ? (sprint.isActive ? `تم تفعيل السبرينت "${sprint.name}"` : `تم إلغاء تفعيل السبرينت "${sprint.name}"`)
            : (sprint.isActive ? `Sprint "${sprint.name}" activated` : `Sprint "${sprint.name}" deactivated`),
        sprint.isActive ? 'success' : 'warning'
    );
}

// حذف السبرينت (للأدمن فقط)
function deleteSprint(sprintId) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }

    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    const confirmText = state.currentLanguage === 'ar'
        ? `هل تريد حذف السبرينت "${sprint.name}"؟`
        : `Are you sure you want to delete sprint "${sprint.name}"?`;

    if (!confirm(confirmText)) return;

    state.tasks = state.tasks.filter(t => t.sprintId !== sprintId);
    state.sprints = state.sprints.filter(s => s.id !== sprintId);

    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    renderKanbanBoard();
    showToast(state.currentLanguage === 'ar' ? 'تم حذف السبرينت' : 'Sprint deleted', 'success');
}

// فتح نموذج تعديل السبرينت (للأدمن فقط)
function openEditSprintModal(sprintId) {
    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    document.getElementById("sprintId").value = sprint.id;
    document.getElementById("sprintName").value = sprint.name;
    document.getElementById("sprintDescription").value = sprint.description || "";
    document.getElementById("sprintStartDate").value = sprint.startDate || "";
    document.getElementById("sprintEndDate").value = sprint.endDate || "";
    document.getElementById("sprintColor").value = sprint.color || "#4a6cf7";

    document.getElementById("sprintModalTitle").innerHTML = `<i class="fa-solid fa-sprint"></i> ` + (state.currentLanguage === 'ar' ? 'تعديل السبرينت' : 'Edit Sprint');

    openModal('sprintModal');
}

// عرض تفاصيل السبرينت
function viewSprintDetails(sprintId) {
    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    state.currentSprintFilter = sprintId;
    state.currentKanbanModuleFilter = null;

    document.querySelector('[data-target=kanban]').click();

    setTimeout(() => {
        const sprintFilter = document.getElementById("sprintFilter");
        if (sprintFilter) {
            sprintFilter.value = sprintId;
            renderKanbanBoard();
        }
    }, 300);
}

// إنشاء مهمة للسبرينت
function createTaskForSprint(sprintId) {
    document.getElementById("taskId").value = "";
    document.getElementById("taskBelongsToType").value = "";
    document.getElementById("taskIsPrivate").value = "false";
    document.getElementById("taskSprintId").value = sprintId;
    document.getElementById("taskName").value = "";
    document.getElementById("taskNotes").value = "";
    document.getElementById("taskTags").value = "";
    document.getElementById("taskCustomColor").value = "#4a6cf7";

    document.querySelectorAll(".shared-task-element").forEach(el => el.style.display = "block");
    document.getElementById("taskSprintId").value = sprintId;

    document.getElementById("taskModalTitle").innerHTML = '<i class="fa-solid fa-sprint"></i> ' + (state.currentLanguage === 'ar' ? 'إنشاء مهمة للسبرينت' : 'Create Task for Sprint');

    openModal('taskModal');
}

// فتح قائمة السبرينتات
function toggleSprintDropdown(sprintId) {
    const dropdown = document.getElementById(`sprintDropdown-${sprintId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// ==========================================================================
// TASK ACCEPT/REJECT SYSTEM - نظام قبول ورفض المهام
// ==========================================================================

// فتح نافذة قبول/رفض المهمة
function openTaskActionModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingModal = document.getElementById('taskActionModal');
    if (existingModal) existingModal.remove();

    const dict = state.currentLanguage === 'ar' ? {
        title: 'قبول/رفض المهمة',
        taskTitle: 'عنوان المهمة',
        status: 'الحالة',
        dueDate: 'تاريخ الاستحقاق',
        notes: 'الملاحظات',
        accept: 'قبول - نقل إلى قيد العمل',
        reject: 'رفض - نقل إلى المرفوع',
        rejectNote: 'سبب الرفض (اختياري)',
        cancel: 'إلغاء',
        close: 'إغلاق'
    } : {
        title: 'Task Review',
        taskTitle: 'Task Title',
        status: 'Status',
        dueDate: 'Due Date',
        notes: 'Notes',
        accept: 'Accept - Move to Pending',
        reject: 'Reject - Move to Rejected',
        rejectNote: 'Rejection Reason (Optional)',
        cancel: 'Cancel',
        close: 'Close'
    };

    const modal = document.createElement('div');
    modal.id = 'taskActionModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box task-action-modal">
            <div class="modal-header">
                <h3><i class="fa-solid fa-clipboard-check"></i> ${dict.title}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('taskActionModal').remove()">&times;</button>
            </div>
            <div class="task-detail-box">
                <p><strong>${dict.taskTitle}:</strong> ${task.name}</p>
                <p><strong>${dict.status}:</strong> <span class="status-${task.status}">${task.status}</span></p>
                ${task.dueDate ? `<p><strong>${dict.dueDate}:</strong> ${task.dueDate.split('T')[0]}</p>` : ''}
                ${task.notes ? `<p><strong>${dict.notes}:</strong> ${task.notes}</p>` : ''}
            </div>
            <div class="rejection-note-area" id="rejectionNoteArea" style="display: none;">
                <label>${dict.rejectNote}:</label>
                <textarea id="rejectionNoteText" rows="3" placeholder="${state.currentLanguage === 'ar' ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'}"></textarea>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('taskActionModal').remove()">${dict.cancel}</button>
                <button type="button" class="btn-primary btn-reject" onclick="rejectTask('${task.id}')">${dict.reject}</button>
                <button type="button" class="btn-primary btn-accept" onclick="acceptTask('${task.id}')">${dict.accept}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const rejectBtn = modal.querySelector('.btn-reject');
    const rejectionNoteArea = document.getElementById('rejectionNoteArea');
    if (rejectBtn && rejectionNoteArea) {
        rejectBtn.addEventListener('click', () => {
            rejectionNoteArea.style.display = rejectionNoteArea.style.display === 'none' ? 'block' : 'none';
        });
    }
}

// قبول المهمة - تحركها إلى قيد العمل (doing)
function acceptTask(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    state.tasks[taskIndex].status = 'doing';
    state.tasks[taskIndex].acceptedAt = new Date().toISOString();

    saveCoreRuntimeToStorage();

    const modal = document.getElementById('taskActionModal');
    if (modal) modal.remove();
    executeGlobalInterfaceRefresh();

    showToast(state.currentLanguage === 'ar' ? 'تم قبول المهمة ونقلها إلى قيد العمل' : 'Task accepted and moved to In Progress', 'success');
}

// رفض المهمة - نقلها إلى العمود المرفوع
function rejectTask(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const rejectionNote = document.getElementById('rejectionNoteText')?.value.trim() || '';

    state.tasks[taskIndex].status = 'rejected';
    state.tasks[taskIndex].rejectionNote = rejectionNote;
    state.tasks[taskIndex].rejectedAt = new Date().toISOString();

    saveCoreRuntimeToStorage();

    const modal = document.getElementById('taskActionModal');
    if (modal) modal.remove();
    executeGlobalInterfaceRefresh();

    showToast(state.currentLanguage === 'ar' ? 'تم رفض المهمة' : 'Task rejected', 'danger');
}

// نقل المهمة إلى عمود المرفوع (للأدمن فقط)
function moveTaskToRejected(taskId) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const promptText = state.currentLanguage === 'ar' ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):';
    const rejectionNote = prompt(promptText, '') || '';

    const now = new Date().toISOString();
    task.status = 'rejected';
    task.rejectionNote = rejectionNote;
    task.rejectedAt = now;
    task.updatedAt = now;

    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();

    showToast(state.currentLanguage === 'ar' ? 'تم نقل المهمة إلى المرفوع' : 'Task moved to Rejected', 'warning');
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.system-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `system-toast system-toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'danger' ? 'var(--danger)' : 'var(--primary)'};
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        font-size: 14px;
    `;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : type === 'danger' ? 'triangle-exclamation' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================================================
// ADMIN TASK MANAGEMENT - إدارة المهام (للأدمن فقط)
// ==========================================================================

// حذف مهمة (للأدمن فقط للمشتركة، وللمالك للخاصة)
function deleteTask(taskId, isPrivate = false) {
    const isRTL = state.currentLanguage === 'ar';
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    if (isPrivate) {
        let localPrivateVaultKey = `taskvibe_vault_${state.currentUser}`;
        let vault = JSON.parse(localStorage.getItem(localPrivateVaultKey));
        if (vault) {
            const task = vault.tasks.find(t => t.id === taskId);
            if (!task) return;
            if (!isAdmin && task.assignedUser !== state.currentUser) {
                showToast(state.currentLanguage === 'ar' ? 'غير مسموح - ليس مهامك' : 'Access Denied - Not your task', 'danger');
                return;
            }
            const confirmText = isRTL ? 'هل تريد حذف هذه المهمة نهائياً؟' : 'Are you sure you want to permanently delete this task?';
            if (!confirm(confirmText)) return;
            vault.tasks = vault.tasks.filter(t => t.id !== taskId);
            localStorage.setItem(localPrivateVaultKey, JSON.stringify(vault));
            renderPrivateIsolatedWorkspace();
        }
    } else {
        if (!isAdmin) {
            showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
            return;
        }
        const confirmText = isRTL ? 'هل تريد حذف هذه المهمة نهائياً؟' : 'Are you sure you want to permanently delete this task?';
        if (!confirm(confirmText)) return;
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
    }
    
    showToast(state.currentLanguage === 'ar' ? 'تم حذف المهمة' : 'Task deleted', 'success');
}

// تعديل مهمة (للأدمن فقط للمشتركة، وللمالك للخاصة)
function editTask(taskId, isPrivate = false) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    if (isPrivate) {
        openModifyExistingTaskModal(taskId, true);
    } else {
        if (!isAdmin) {
            showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
            return;
        }
        openModifyExistingTaskModal(taskId, false);
    }
}

function openModifyExistingTaskModal(taskId, isPrivateFlag) {
    let task = null;
    if (isPrivateFlag) {
        let localPrivateVaultKey = `taskvibe_vault_${state.currentUser}`;
        let vault = JSON.parse(localStorage.getItem(localPrivateVaultKey));
        task = vault.tasks.find(t => t.id === taskId);
    } else {
        task = state.tasks.find(t => t.id === taskId);
    }

    if (!task) return;
    
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    // For private tasks, only allow owner or admin to edit
    if (isPrivateFlag && !isAdmin && task.assignedUser !== state.currentUser) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - ليس مهامك' : 'Access Denied - Not your task', 'danger');
        return;
    }

    document.getElementById("taskId").value = task.id;
    document.getElementById("taskBelongsToType").value = task.typeId || "";
    document.getElementById("taskSprintId").value = task.sprintId || "";
    document.getElementById("taskIsPrivate").value = isPrivateFlag ? "true" : "false";
    document.getElementById("taskName").value = task.name;
    document.getElementById("taskDueDate").value = task.dueDate || "";
    document.getElementById("taskNotes").value = task.notes || "";
    document.getElementById("taskTags").value = task.tags || "";
    document.getElementById("taskCustomColor").value = task.customColor || "#4a6cf7";

    if (!isPrivateFlag) {
        document.querySelectorAll(".shared-task-element").forEach(el => el.style.display = "block");
        document.getElementById("taskAssignedUser").value = task.assignedUser || "Admin";
    } else {
        document.querySelectorAll(".shared-task-element").forEach(el => el.style.display = "none");
    }

    openModal('taskModal');
}

// ==========================================================================
// TRIGGER TASK FORM ALLOCATION - تشغيل نموذج المهمة
// ==========================================================================
function triggerTaskFormAllocation(typeId, isPrivateFlag) {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("taskBelongsToType").value = typeId;
    document.getElementById("taskSprintId").value = "";
    document.getElementById("taskIsPrivate").value = isPrivateFlag ? "true" : "false";

    const dict = state.currentLanguage === 'ar' ? {
        privateTitle: 'تهيئة مهمة خاصة',
        sharedTitle: 'تهيئة مهمة مشتركة'
    } : {
        privateTitle: 'تكوين مهمة خاصة',
        sharedTitle: 'تكوين مهمة مشتركة'
    };

    document.getElementById("taskModalTitle").innerText = isPrivateFlag ? dict.privateTitle : dict.sharedTitle;

    if (isPrivateFlag) {
        document.querySelectorAll(".shared-task-element").forEach(el => el.style.display = "none");
    } else {
        document.querySelectorAll(".shared-task-element").forEach(el => el.style.display = "block");
    }

    openModal('taskModal');
}

// ==========================================================================
// MODULE MANAGEMENT - إدارة المشاريع (للأدمن فقط)
// ==========================================================================

// تعديل مشروع (للأدمن فقط)
function editModule(moduleId) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }

    const moduleType = state.types.find(t => t.id === moduleId);
    if (!moduleType) return;

    document.getElementById("typeId").value = moduleType.id;
    document.getElementById("typeName").value = moduleType.name;
    if (document.getElementById("typeNotes")) document.getElementById("typeNotes").value = moduleType.notes || '';
    if (document.getElementById("typeColor")) document.getElementById("typeColor").value = moduleType.color || '#4a6cf7';
    document.getElementById("typeIsPrivate").value = "false";

    document.getElementById("typeModalTitle").innerHTML = '<i class="fa-solid fa-folder-open"></i> ' + (state.currentLanguage === 'ar' ? 'تعديل المشروع' : 'Edit Module');

    openModal('typeModal');
}

// حذف مشروع (للأدمن فقط)
function deleteModule(moduleId) {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }

    const moduleType = state.types.find(t => t.id === moduleId);
    if (!moduleType) return;

    const confirmText = state.currentLanguage === 'ar'
        ? `هل تريد حذف المشروع "${moduleType.name}" وجميع مهامه؟`
        : `Are you sure you want to delete module "${moduleType.name}" and all its tasks?`;

    if (!confirm(confirmText)) return;

    state.tasks = state.tasks.filter(t => t.typeId !== moduleId);
    state.types = state.types.filter(t => t.id !== moduleId);

    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();

    showToast(state.currentLanguage === 'ar' ? 'تم حذف المشروع' : 'Module deleted', 'success');
}

// ==========================================================================
// MODULE DETAIL MODAL - عرض تفاصيل المشروع
// ==========================================================================
function openModuleDetailModal(moduleId) {
    const moduleType = state.types.find(t => t.id === moduleId);
    if (!moduleType) return;

    const existingModal = document.getElementById('moduleDetailModal');
    if (existingModal) existingModal.remove();

    const tasksInModule = state.tasks.filter(t => t.typeId === moduleId);
    const completedTasks = tasksInModule.filter(t => t.status === 'done').length;
    const progressPercent = tasksInModule.length > 0 ? Math.round((completedTasks / tasksInModule.length) * 100) : 0;

    const dict = state.currentLanguage === 'ar' ? {
        title: 'تفاصيل المشروع',
        name: 'الاسم',
        description: 'الوصف',
        tasks: 'المهام',
        completed: 'مكتمل',
        progress: 'نسبة الإنجاز',
        close: 'إغلاق'
    } : {
        title: 'Module Details',
        name: 'Name',
        description: 'Description',
        tasks: 'Tasks',
        completed: 'Completed',
        progress: 'Progress',
        close: 'Close'
    };

    const modal = document.createElement('div');
    modal.id = 'moduleDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3><i class="fa-solid fa-folder-open" style="color:${moduleType.color}"></i> ${dict.title}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('moduleDetailModal').remove()">&times;</button>
            </div>
            <div class="task-detail-box" style="padding: 20px;">
                <p><strong>${dict.name}:</strong> <span style="color:${moduleType.color}">${moduleType.name}</span></p>
                ${moduleType.notes ? `<p><strong>${dict.description}:</strong></p><p style="background: var(--bg-surface); padding: 10px; border-radius: 4px; margin-top: 5px;">${moduleType.notes}</p>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <div style="background: rgba(74,108,247,0.1); padding: 10px; border-radius: 4px; text-align: center;">
                        <h4 style="font-size: 20px; color: var(--primary);">${tasksInModule.length}</h4>
                        <p style="font-size: 12px; color: var(--text-muted);">${dict.tasks}</p>
                    </div>
                    <div style="background: rgba(46,204,113,0.1); padding: 10px; border-radius: 4px; text-align: center;">
                        <h4 style="font-size: 20px; color: var(--success);">${completedTasks}</h4>
                        <p style="font-size: 12px; color: var(--text-muted);">${dict.completed}</p>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <p><strong>${dict.progress}:</strong> ${progressPercent}%</p>
                    <div style="background: var(--bg-surface); border-radius: 10px; height: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${moduleType.color}; height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('moduleDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// فتح تفاصيل المشروع الخاص (تُستخدم للنقر على اسم المشروع)
function openModuleDetailModal(moduleId, isPrivate = false) {
    const isRTL = state.currentLanguage === 'ar';
    
    let moduleType = null;
    let moduleTasks = [];
    
    if (isPrivate) {
        const vaultKey = `taskvibe_vault_${state.currentUser}`;
        const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
        moduleType = vault.types.find(t => t.id === moduleId);
        moduleTasks = vault.tasks.filter(t => t.typeId === moduleId);
    } else {
        moduleType = state.types.find(t => t.id === moduleId);
        moduleTasks = state.tasks.filter(t => t.typeId === moduleId);
    }
    
    if (!moduleType) return;
    
    const completedTasks = moduleTasks.filter(t => t.status === 'done').length;
    const progressPercent = moduleTasks.length > 0 ? Math.round((completedTasks / moduleTasks.length) * 100) : 0;
    
    const dict = isRTL ? {
        title: 'تفاصيل المشروع',
        name: 'الاسم',
        description: 'الوصف',
        tasks: 'المهام',
        completed: 'مكتمل',
        progress: 'نسبة الإنجاز',
        close: 'إغلاق'
    } : {
        title: 'Module Details',
        name: 'Name',
        description: 'Description',
        tasks: 'Tasks',
        completed: 'Completed',
        progress: 'Progress',
        close: 'Close'
    };
    
    const existingModal = document.getElementById('moduleDetailModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'moduleDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3><i class="fa-solid fa-folder-open" style="color:${moduleType.color}"></i> ${dict.title}</h3>
                <button class="close-modal-btn" onclick="document.getElementById('moduleDetailModal').remove()">&times;</button>
            </div>
            <div class="task-detail-box" style="padding: 20px;">
                <p><strong>${dict.name}:</strong> <span style="color:${moduleType.color}">${moduleType.name}</span></p>
                ${moduleType.notes ? `<p><strong>${dict.description}:</strong></p><p style="background: var(--bg-surface); padding: 10px; border-radius: 4px; margin-top: 5px;">${moduleType.notes}</p>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <div style="background: rgba(74,108,247,0.1); padding: 10px; border-radius: 4px; text-align: center;">
                        <h4 style="font-size: 20px; color: var(--primary);">${moduleTasks.length}</h4>
                        <p style="font-size: 12px; color: var(--text-muted);">${dict.tasks}</p>
                    </div>
                    <div style="background: rgba(46,204,113,0.1); padding: 10px; border-radius: 4px; text-align: center;">
                        <h4 style="font-size: 20px; color: var(--success);">${completedTasks}</h4>
                        <p style="font-size: 12px; color: var(--text-muted);">${dict.completed}</p>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <p><strong>${dict.progress}:</strong> ${progressPercent}%</p>
                    <div style="background: var(--bg-surface); border-radius: 10px; height: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${moduleType.color}; height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('moduleDetailModal').remove()">${dict.close}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// تفعيل/إلغاء تفعيل المشروع الخاص
function togglePrivateModuleActivation(moduleId) {
    const vaultKey = `taskvibe_vault_${state.currentUser}`;
    const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
    const moduleType = vault.types.find(t => t.id === moduleId);
    if (!moduleType) return;
    
    moduleType.isActive = !moduleType.isActive;
    
    // Deactivate other modules when activating this one
    if (moduleType.isActive) {
        vault.types.forEach(t => {
            if (t.id !== moduleId) {
                t.isActive = false;
            }
        });
    }
    
    localStorage.setItem(vaultKey, JSON.stringify(vault));
    renderPrivateIsolatedWorkspace();
    showToast(
        state.currentLanguage === 'ar'
            ? (moduleType.isActive ? `تم تفعيل المشروع "${moduleType.name}"` : `تم إلغاء تفعيل المشروع "${moduleType.name}"`)
            : (moduleType.isActive ? `Project "${moduleType.name}" activated` : `Project "${moduleType.name}" deactivated`),
        moduleType.isActive ? 'success' : 'warning'
    );
}

// إغلاق القوائم المنسدلة عند النقر خارجها
document.addEventListener('click', function(e) {
    if (!e.target.closest('.private-dropdown-menu') && !e.target.closest('[onclick*="toggleModuleActions"]') && !e.target.closest('[onclick*="toggleSprintActions"]') && !e.target.closest('[onclick*="toggleTaskActions"]') && !e.target.closest('[onclick*="togglePrivateModuleDropdown"]') && !e.target.closest('[onclick*="togglePrivateTaskDropdown"]')) {
        document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    }
});