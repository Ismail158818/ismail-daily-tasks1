// ==========================================================================
// CENTRAL SYSTEM DATA & APPLICATION STATE (With Advanced Multi-Lingual Engine)
// ==========================================================================
let state = {
    currentLanguage: 'en', // 'en' or 'ar'
    currentUser: null,
    systemThemes: 'light',
    bgTexture: 'none',
    types: [],              // Shared global modules (المشاريع العامة والخاصة)
    sprints: [],            // Shared global sprints (السبرينتات النشطة للنظام)
    tasks: [],              // Shared global tasks (المهام التابعة)
    sprintNotes: [],
    sprintConfig: { start: '', end: '' },
    stickyNoteContent: "",
    
    // CUSTOM CREDENTIALS ACCESS CONTROL (ADMIN EXTENDABLE)
    // ملاحظة: يوجد مستخدم واحد فقط هو الأدمن، ويمكن للأدمن إضافة مستخدمين جدد
    accessRegistry: {
        "158818": { name: "Admin", role: "System Administrator" }
    },
    
    // LIVE CHRONOS PERFORMANCE TRACKER
    userMetrics: {
        "Admin": { logins: 0, sessionStart: null, workingHours: 0, rating: 5.0 }
    }
};

let activeAlarmTaskId = null;

// معرف الأدمن المسؤول وصاحب الصلاحيات المطلقة
const ROOT_ADMIN_ID = "158818";

// دالة التحقق الأمني من هوية المسؤول الحالي برقم الرمز التشغيلي
function isCurrentUserAdmin() {
    // جلب الرمز التشغيلي المخزن للمستخدم الحالي من الـ accessRegistry والتحقق من مطابقة الرقم المباشر
    if (!state.currentUser) return false;
    
    const userRegistryEntry = Object.keys(state.accessRegistry).find(key => state.accessRegistry[key].name === state.currentUser);
    return userRegistryEntry === ROOT_ADMIN_ID;
}

// قاموس الترجمة الموحد لشاشة الدخول والعناصر الثابتة في النظام
const SYSTEM_LOCALIZATION_DICTIONARY = {
    en: {
        authTitle: 'TaskVibe Pro <span class="pro-badge">v3</span>',
        authSubtitle: 'Unified Security Gateway for Operations & Analytics',
        authLabel: '<i class="fa-solid fa-key"></i> Operational Access Token',
        authPlaceholder: '        Enter your access token...',
        authBtn: '<i class="fa-solid fa-paper-plane"></i> Sent', 
        authFooterText: '', 
        loginError: 'Authentication failed: Invalid security token.',
        roleAdmin: 'System Infrastructure Administrator',
        roleUser: 'Certified Technical Operator'
    },
    ar: {
        authTitle: 'نظام تيسك فايب <span class="pro-badge">PRO v3</span>',
        authSubtitle: 'البوابة الأمنية الموحدة لإدارة العمليات والتحليلات',
        authLabel: '<i class="fa-solid fa-key"></i> رمز الأمان التشغيلي الخاص بك',
        authPlaceholder: 'أدخل رمز الدخول التشغيلي...',
        authBtn: '<i class="fa-solid fa-paper-plane"></i> إرسال', 
        authFooterText: '', 
        loginError: 'فشل التحقق: رمز الدخول الأمني المدخل غير صحيح.',
        roleAdmin: 'مسؤول البنية التحتية للنظام',
        roleUser: 'مشغل فني / موظف معتمد'
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadCoreRuntimeStorage();
    initializeClockEngine();
    initializeNavigationEngine();
    initializeThemeEngine();
    
    // Core Background Chronos Execution Tracker
    setInterval(checkActiveMilestonesEngine, 30000);
});

async function loadCoreRuntimeStorage() {
    let loaded = false;

    // 시도: Firebase에서 상태 로드
    try {
        const remoteState = await fetchRemoteState();
        if (remoteState && (remoteState.tasks || remoteState.types)) {
            Object.assign(state, remoteState);
            console.log('State loaded from Firebase');
            loaded = true;
        }
    } catch (err) {
        console.error('Failed to load state from Firebase:', err);
    }

    // 실패 시 로컬 스토리지에서 로드
    if (!loaded) {
        const hydrator = localStorage.getItem("taskvibe_pro_v3_core");
        if (hydrator) {
            try {
                const parsed = JSON.parse(hydrator);
                Object.assign(state, parsed);
                console.log('State loaded from localStorage');
                loaded = true;
            } catch (e) {
                console.error("Hydration schema failure. Falling back to seed.");
            }
        }
    }

    // 모두 실패 시 기본 데이터로 시딩
    if (!loaded) {
        seedInitialOperationalData();
        console.log('Seeded initial operational data');
    }

    // 데이터 마이그레이션 레이어 (이전 버전과의 호환성 보장)
    if (!state.accessRegistry) {
        state.accessRegistry = { "158818": { name: "Admin", role: "System Administrator" } };
    } else {
        Object.keys(state.accessRegistry).forEach(key => {
            if (typeof state.accessRegistry[key] === 'string') {
                const oldName = state.accessRegistry[key];
                state.accessRegistry[key] = { name: oldName, role: oldName === "Admin" ? "System Administrator" : "Data Analyst" };
            }
        });
    }

    if (!state.userMetrics) state.userMetrics = { "Admin": { logins: 0, sessionStart: null, workingHours: 0, rating: 5.0 } };
    if (!state.currentLanguage) state.currentLanguage = 'en';
    if (!state.types) state.types = [];
    if (!state.sprints) state.sprints = [];
    if (!state.tasks) state.tasks = [];

    // 언어 적용
    applyLanguageDOMEngine();
}

function saveCoreRuntimeToStorage() {
    localStorage.setItem("taskvibe_pro_v3_core", JSON.stringify(state));
    // حفظ في التخزين البعيد إذا كان متاحاً
    if (typeof saveRemoteState === 'function') {
        saveRemoteState(state).catch(err => console.error('Remote save failed:', err));
    }
}

function seedInitialOperationalData() {
    state.types = [
        { id: "st1", name: "Enterprise Gateway Core", notes: "Core infrastructural APIs", color: "#4a6cf7", isPrivate: false }
    ];
    state.sprints = [
        { id: "sp1", name: "Sprint Alpha - Initial Phase", description: "Bootstrap infrastructure metrics", color: "#4a6cf7" }
    ];
    state.tasks = [
        { id: "stsk1", typeId: "st1", sprintId: "sp1", name: "Configure OAuth Pipeline Tokens", assignedUser: "Admin", status: "doing", dueDate: "2026-12-31T23:59", notes: "Use SHA-256 standard encryption keys", tags: "security, api", customColor: "#4a6cf7" }
    ];
    state.accessRegistry = {
        "158818": { name: "Admin", role: "System Administrator" }
    };
    state.currentLanguage = 'en';
    saveCoreRuntimeToStorage();
}

// ==========================================================================
// SECURITY ACCESS CONTROL & VERIFICATION
// ==========================================================================
function verifyLoginCode() {
    const inputField = document.getElementById("userAccessCode");
    const code = inputField.value.trim();
    const errorSpan = document.getElementById("loginError");
    const dict = SYSTEM_LOCALIZATION_DICTIONARY[state.currentLanguage];
    
    if (state.accessRegistry && state.accessRegistry[code]) {
        const entry = state.accessRegistry[code];
        // دعم كلا البنيتين: object أو string
        const identity = typeof entry === 'object' ? entry.name : entry;
        state.currentUser = identity;
        errorSpan.style.display = "none";
        
        if (!state.userMetrics[identity]) {
            state.userMetrics[identity] = { logins: 0, sessionStart: null, workingHours: 0, rating: 4.0 };
        }
        
        state.userMetrics[identity].logins += 1;
        state.userMetrics[identity].sessionStart = Date.now();
        
        document.getElementById("currentLoggedUser").innerText = identity;
        
        const roleLabel = document.getElementById("currentLoggedUserRole");
        if (roleLabel) {
            roleLabel.innerText = typeof entry === 'object' ? entry.role : "User";
        }

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("appDashboardLayout").style.display = "flex";
        inputField.value = "";
        
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
        
        // إظهار تنبيه بالمهام التي تحتاج مراجعة
        setTimeout(() => showLoginNotification(), 500);
    } else {
        errorSpan.innerText = dict.loginError;
        errorSpan.style.display = "block";
    }
}

// ==========================================================================
// LOGIN NOTIFICATION SYSTEM - نظام التنبيهات عند الدخول
// ==========================================================================
function showLoginNotification() {
    const isAdmin = isCurrentUserAdmin();
    let tasksNeedingAction = [];
    
    if (isAdmin) {
        tasksNeedingAction = state.tasks.filter(t => t.status === 'todo' || t.status === 'review');
    } else {
        tasksNeedingAction = state.tasks.filter(t => t.assignedUser === state.currentUser && (t.status === 'todo' || t.status === 'review'));
    }
    
    const now = new Date();
    const overdueTasks = tasksNeedingAction.filter(t => t.dueDate && new Date(t.dueDate) < now);
    
    if (tasksNeedingAction.length > 0 || overdueTasks.length > 0) {
        showWelcomeToast(tasksNeedingAction.length, overdueTasks.length, tasksNeedingAction.slice(0, 5));
    }
}

function showWelcomeToast(pendingCount, overdueCount, sampleTasks) {
    const existingToast = document.querySelector('.welcome-toast');
    if (existingToast) existingToast.remove();
    
    const dict = state.currentLanguage === 'ar' ? {
        title: 'مرحباً بك!',
        pending: 'لديك مهام تحتاج مراجعة',
        overdue: 'مهام متأخرة',
        viewAll: 'عرض جميع المهام',
        close: 'إغلاق'
    } : {
        title: 'Welcome Back!',
        pending: 'Tasks Awaiting Review',
        overdue: 'Overdue Tasks',
        viewAll: 'View All Tasks',
        close: 'Close'
    };
    
    const toast = document.createElement('div');
    toast.className = 'welcome-toast';
    toast.innerHTML = `
        <div class="welcome-toast-header">
            <i class="fa-solid fa-bell"></i>
            <h4>${dict.title}</h4>
            <button class="close-welcome" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="welcome-toast-body">
            ${pendingCount > 0 ? `<p><i class="fa-solid fa-circle-exclamation" style="color: var(--warning);"></i> ${dict.pending}: <strong>${pendingCount}</strong></p>` : ''}
            ${overdueCount > 0 ? `<p><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> ${dict.overdue}: <strong>${overdueCount}</strong></p>` : ''}
            ${sampleTasks.length > 0 ? `
                <div class="my-tasks-list">
                    ${sampleTasks.map(t => `
                        <div class="my-task-item" onclick="navigateToTask('${t.id}')">
                            <span>${t.name}</span>
                            <span class="my-task-status status-${t.status}">${t.status}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="font-size:12px; color:var(--text-muted);">لا توجد مهام جديدة</p>'}
            <button class="view-all-tasks-btn" onclick="document.querySelector('[data-target=kanban]').click(); this.parentElement.parentElement.remove();">
                <i class="fa-solid fa-arrow-right"></i> ${dict.viewAll}
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 10000);
}

function navigateToTask(taskId) {
    document.querySelector('[data-target=kanban]').click();
    const toast = document.querySelector('.welcome-toast');
    if (toast) toast.remove();
    
    setTimeout(() => {
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElement.style.boxShadow = '0 0 0 3px var(--primary)';
            setTimeout(() => { taskElement.style.boxShadow = ''; }, 2000);
        }
    }, 300);
}

function handleLogout() {
    if (state.currentUser && state.userMetrics[state.currentUser]?.sessionStart) {
        let sessionMs = Date.now() - state.userMetrics[state.currentUser].sessionStart;
        let accruedHours = parseFloat((sessionMs / (1000 * 60 * 60)).toFixed(4));
        state.userMetrics[state.currentUser].workingHours += (accruedHours > 0 ? accruedHours : 0.25);
        state.userMetrics[state.currentUser].sessionStart = null;
    }
    state.currentUser = null;
    document.getElementById("appDashboardLayout").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    saveCoreRuntimeToStorage();
}

// ==========================================================================
// TRANSLATION ENGINE PIPELINE (Unified Gate Translation)
// ==========================================================================
function toggleSystemLanguage() {
    state.currentLanguage = state.currentLanguage === 'en' ? 'ar' : 'en';
    saveCoreRuntimeToStorage();
    applyLanguageDOMEngine();
    executeGlobalInterfaceRefresh();
}

function applyLanguageDOMEngine() {
    document.querySelectorAll("[data-en]").forEach(el => {
        el.innerText = state.currentLanguage === 'en' ? el.getAttribute("data-en") : el.getAttribute("data-ar");
    });
    
    const dict = SYSTEM_LOCALIZATION_DICTIONARY[state.currentLanguage];
    if (document.getElementById("authTitleNode")) document.getElementById("authTitleNode").innerHTML = dict.authTitle;
    if (document.getElementById("authSubtitleNode")) document.getElementById("authSubtitleNode").innerText = dict.authSubtitle;
    if (document.getElementById("authLabelNode")) document.getElementById("authLabelNode").innerHTML = dict.authLabel;
    if (document.getElementById("userAccessCode")) document.getElementById("userAccessCode").placeholder = dict.authPlaceholder;
    if (document.getElementById("authBtnNode")) document.getElementById("authBtnNode").innerHTML = dict.authBtn;
    if (document.getElementById("authFooterTextNode")) document.getElementById("authFooterTextNode").innerText = dict.authFooterText;
    
    const toggleBtnText = document.getElementById("langToggleBtnText");
    if (toggleBtnText) {
        toggleBtnText.innerText = state.currentLanguage === 'en' ? 'AR' : 'EN';
    }

    const searchInput = document.getElementById("globalSearch");
    if (state.currentLanguage === 'ar') {
        document.body.classList.add("rtl-mode");
        document.documentElement.dir = "rtl";
        if (searchInput) searchInput.placeholder = "ابحث عن العمليات والمهام الفنية...";
    } else {
        document.body.classList.remove("rtl-mode");
        document.documentElement.dir = "ltr";
        if (searchInput) searchInput.placeholder = "Search operational matrices...";
    }
}

// ==========================================================================
// NAVIGATION HUB ROUTER & STRICT SECURITY GUARDS
// ==========================================================================
function initializeNavigationEngine() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetViewId = btn.getAttribute("data-target");
            const isAdmin = isCurrentUserAdmin();
            
            if (targetViewId === 'adminSettingsView' && !isAdmin) {
                alert("Access Denied: Infrastructure privilege escalation blocked.");
                return;
            }
            
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            document.querySelectorAll(".view-section").forEach(v => {
                v.classList.remove("active");
                v.style.display = "none"; 
            });
            
            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add("active");
                targetView.style.display = "block";
            }
            
            if (targetViewId === 'dashboard') renderSharedModulesStackList();
            if (targetViewId === 'gantt') {
                if (typeof renderGanttTimelineChart === "function") renderGanttTimelineChart();
            }
            if (targetViewId === 'adminAnalytics') {
                if (typeof renderSystemAnalyticsDashboard === "function") renderSystemAnalyticsDashboard();
            }
            if (targetViewId === 'adminSettingsView') renderAdminConfigurationDirectory();
        });
    });
    
    const textPad = document.getElementById("stickyNote");
    if(textPad) {
        textPad.value = state.stickyNoteContent || "";
        textPad.addEventListener("input", (e) => {
            state.stickyNoteContent = e.target.value;
            saveCoreRuntimeToStorage();
        });
    }
    
    const searchInput = document.getElementById("globalSearch");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (typeof renderKanbanBoard === "function") renderKanbanBoard();
        });
    }
}

function executeGlobalInterfaceRefresh() {
    const isAdmin = isCurrentUserAdmin();
    
    // التحكم بظهور أزرار إدخال البيانات الرئيسية في الـ HTML الثابت
    const adminGlobalElements = document.querySelectorAll(".admin-only-element, .admin-control-btn");
    adminGlobalElements.forEach(el => {
        if (!el.classList.contains('view-section')) {
            el.style.display = isAdmin ? "block" : "none";
        }
    });

    if(document.getElementById("adminSettingsNavBtn")) {
        document.getElementById("adminSettingsNavBtn").style.display = isAdmin ? "block" : "none";
    }

    // التحقق الفوري في حال سحب الصلاحيات المباشلة
    const adminSection = document.getElementById("adminSettingsView");
    if (adminSection && adminSection.classList.contains("active") && !isAdmin) {
        document.querySelector('[data-target="dashboard"]').click();
    }
    
    hydrateUserOptionSelectors();
    renderSharedModulesStackList();
    
    if (typeof renderMyTasksCard === "function") renderMyTasksCard();
    if (typeof renderKanbanBoard === "function") renderKanbanBoard();
    if (typeof initializeSprintsSystem === "function") initializeSprintsSystem();
    
    if (adminSection && adminSection.classList.contains("active")) {
        renderAdminConfigurationDirectory();
    }
}

function hydrateUserOptionSelectors() {
    const select = document.getElementById("taskAssignedUser");
    if(!select) return;
    select.innerHTML = "";
    Object.values(state.accessRegistry).forEach(userObj => {
        // Don't add Admin as an assignable user (check both role and name)
        if (userObj.role === 'System Administrator' || userObj.name === 'Admin') return;
        select.innerHTML += `<option value="${userObj.name}">${userObj.name} (${userObj.role})</option>`;
    });
}

// ==========================================================================
// MODULE FORMULATION SYSTEM (إدارة المشاريع - إضافة/تعديل/حذف)
// ==========================================================================
function openModuleForm(isPrivate = false, projectId = null) {
    if (!isCurrentUserAdmin()) {
        alert("Access Denied: Operations restricted to System Administrator.");
        return;
    }
    document.getElementById("typeId").value = projectId || "";
    document.getElementById("typeIsPrivate").value = isPrivate ? "true" : "false";
    
    if (projectId) {
        const project = state.types.find(t => t.id === projectId);
        if (project) {
            document.getElementById("typeName").value = project.name;
            document.getElementById("typeNotes").value = project.notes || "";
            document.getElementById("typeColor").value = project.color || "#4a6cf7";
        }
    } else {
        document.getElementById("typeName").value = "";
        document.getElementById("typeNotes").value = "";
        document.getElementById("typeColor").value = "#4a6cf7";
    }
    openModal("typeModal");
}

function handleModuleSubmit(event) {
    event.preventDefault();
    if (!isCurrentUserAdmin()) return;
    
    const typeId = document.getElementById("typeId").value;
    const nameInput = document.getElementById("typeName");
    const notesInput = document.getElementById("typeNotes");
    const colorInput = document.getElementById("typeColor");
    const isPrivateStr = document.getElementById("typeIsPrivate").value;
    
    if (typeId) {
        const moduleIndex = state.types.findIndex(t => t.id === typeId);
        if (moduleIndex > -1) {
            state.types[moduleIndex].name = nameInput.value.trim();
            state.types[moduleIndex].notes = notesInput.value.trim();
            state.types[moduleIndex].color = colorInput.value;
        }
    } else {
        const newModule = {
            id: "mod_" + Date.now(),
            name: nameInput.value.trim(),
            notes: notesInput.value.trim(),
            color: colorInput.value,
            isPrivate: isPrivateStr === "true"
        };
        state.types.push(newModule);
        if (newModule.isPrivate) renderPrivateIsolatedWorkspace();
    }
    
    saveCoreRuntimeToStorage();
    closeModal("typeModal");
    executeGlobalInterfaceRefresh();
}

function triggerDeleteProject(projectId) {
    if (!isCurrentUserAdmin()) {
        alert("Unauthorized security execution blocked.");
        return;
    }
    const confirmMsg = state.currentLanguage === 'ar' ? "هل أنت متأكد من حذف هذا المشروع نهائياً مع كافة المهام التابعة له؟" : "Are you sure you want to delete this project and all related tasks?";
    if (confirm(confirmMsg)) {
        state.types = state.types.filter(t => t.id !== projectId);
        state.tasks = state.tasks.filter(task => task.typeId !== projectId);
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
    }
}

function renderSharedModulesStackList() {
    const renderBox = document.getElementById("typesList");
    if (!renderBox) return;
    renderBox.innerHTML = "";
    
    const isAdmin = isCurrentUserAdmin();
    const isRTL = state.currentLanguage === 'ar';
    const dict = isRTL ? {
        createSprint: 'سبرينت جديد',
        createTask: 'مهمة جديدة',
        noTasks: 'لا توجد مهام',
        noSprints: 'لا توجد سبرينتات داخل هذا المشروع',
        addDirectTask: 'إنشاء مهمة مباشرة',
        edit: 'تعديل',
        delete: 'حذف',
        activateDeactivate: 'تفعيل/إلغاء التفعيل'
    } : {
        createSprint: 'New Sprint',
        createTask: 'New Task',
        noTasks: 'No tasks',
        noSprints: 'No sprints in this project',
        addDirectTask: 'Add Direct Task',
        edit: 'Edit',
        delete: 'Delete',
        activateDeactivate: 'Activate/Deactivate'
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
                            ${isAdmin ? `<div style="display: flex; gap: 2px; align-items: center;">
                                <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="background: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;" title="${task.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}"><i class="fa-solid fa-power-off"></i></button>
                                <div style="position: relative; display: inline-block;">
                                    <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 2px; border-radius: 3px; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                    <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                        <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.edit}</button>
                                        <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.delete}</button>
                                    </div>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });
            
sprintsHTML += `
                 <div class="sprint-card" style="border: 2px dashed ${sprint.color}; border-radius: 8px; padding: 12px; margin: 12px 0; cursor: pointer;" onclick="this.classList.toggle('expanded');">
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                         <strong style="color: ${sprint.color}; font-size: 14px; cursor: pointer;" onclick="openSprintDetailModal('${sprint.id}')"><i class="fa-solid fa-sprint"></i> ${sprint.name}</strong>
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
            const isMyTask = task.assignedUser === state.currentUser;
            directTasksHTML += `
                <div style="border-top: 3px solid ${taskColor}; margin: 6px 0; padding: 8px; background: var(--bg-surface); border-radius: 4px; border-${isRTL ? 'right' : 'left'}: 2px solid ${isMyTask ? 'var(--primary)' : 'transparent'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div>
                            <span style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
                            <small style="display: block; color: var(--text-muted); font-size: 11px;">${task.assignedUser || 'Unallocated'} • ${task.status}</small>
                        </div>
                        ${isAdmin ? `<div style="display: flex; gap: 2px; align-items: center;">
                            <button onclick="event.stopPropagation(); toggleTaskActivation('${task.id}')" style="background: ${task.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-size: 11px;" title="${task.isActive ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}"><i class="fa-solid fa-power-off"></i></button>
                            <div style="position: relative; display: inline-block;">
                                <button onclick="event.stopPropagation(); toggleTaskActions('${task.id}')" style="background: var(--text-muted); border: none; color: #fff; padding: 2px; border-radius: 3px; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div id="taskActions_${task.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px;">
                                    <button onclick="event.stopPropagation(); editTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-pen" style="color: var(--warning); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.edit}</button>
                                    <button onclick="event.stopPropagation(); deleteTask('${task.id}', false)" style="display: block; width: 100%; padding: 6px 10px; text-align: ${isRTL ? 'right' : 'left'}; border: none; background: none; cursor: pointer; font-size: 11px;"><i class="fa-solid fa-trash" style="color: var(--danger); margin-${isRTL ? 'left' : 'right'}: 4px; font-size: 10px;"></i> ${dict.delete}</button>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
        });
        
        renderBox.innerHTML += `
            <div style="border-${isRTL ? 'right' : 'left'}: 4px solid ${moduleType.color}; background: var(--bg-surface); border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--border-color); box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="padding: 14px; border-bottom: 3px solid ${moduleType.color}; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: ${moduleType.color}; cursor: pointer;" onclick="openModuleDetailModal('${moduleType.id}')"><i class="fa-solid fa-folder" style="margin-${isRTL ? 'right' : 'left'}: 8px;"></i> ${moduleType.name}</h3>
                    ${isAdmin ? `<div style="display: flex; gap: 4px; align-items: center;">
                        <button onclick="openSprintModal(null, '${moduleType.id}')" style="background: var(--success); border: none; color: #fff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;"><i class="fa-solid fa-sprint"></i> ${state.currentLanguage === 'ar' ? 'سبرينت' : 'Sprint'}</button>
                        <button onclick="toggleModuleActivation('${moduleType.id}')" style="background: ${moduleType.isActive ? 'var(--success)' : 'var(--warning)'}; border: none; color: #fff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;"><i class="fa-solid fa-power-off"></i> ${moduleType.isActive ? (isRTL ? 'إلغاء' : 'Off') : (isRTL ? 'تفعيل' : 'On')}</button>
                        <div style="position: relative; display: inline-block;">
                            <button onclick="event.stopPropagation(); toggleModuleActions('${moduleType.id}')" style="background: var(--primary); border: none; color: #fff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-ellipsis-vertical"></i> <span style="font-size: 12px;">${isRTL ? 'خيارات' : 'Options'}</span></button>
                            <div id="moduleActions_${moduleType.id}" class="private-dropdown-menu" style="display: none; position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 100%; min-width: 100px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-lg); z-index: 100;">
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
    
    // Update stats
    const trackingClockTime = new Date();
    if(document.getElementById("statTotalTasks")) document.getElementById("statTotalTasks").innerText = state.tasks.length;
    if(document.getElementById("statCompletedTasks")) document.getElementById("statCompletedTasks").innerText = state.tasks.filter(t => t.status === 'done').length;
    if(document.getElementById("statDelayedTasks")) document.getElementById("statDelayedTasks").innerText = state.tasks.filter(t => t.status !== 'done' && t.status !== 'rejected' && t.dueDate && new Date(t.dueDate) < trackingClockTime).length;
    if(document.getElementById("statCompletionRate")) {
        const totalCount = state.tasks.length;
        const completedCount = state.tasks.filter(t => t.status === 'done').length;
        const rejectedCount = state.tasks.filter(t => t.status === 'rejected').length;
        const activeTasks = totalCount - rejectedCount;
        const rate = activeTasks > 0 ? Math.round((completedCount / activeTasks) * 100) : 0;
        document.getElementById("statCompletionRate").innerText = rate + "%";
    }
    
    // Update modules stats
    const totalModules = state.types.filter(t => !t.isPrivate).length;
    const activeModules = state.types.filter(t => !t.isPrivate && t.isActive !== false).length;
    if(document.getElementById("statTotalModules")) document.getElementById("statTotalModules").innerText = totalModules;
    if(document.getElementById("statActiveModules")) document.getElementById("statActiveModules").innerText = activeModules + (state.currentLanguage === 'ar' ? ' مفعل' : ' active');
    
    // Update sprints stats
    const totalSprints = state.sprints ? state.sprints.length : 0;
    const activeSprints = state.sprints ? state.sprints.filter(s => s.isActive).length : 0;
    if(document.getElementById("statTotalSprints")) document.getElementById("statTotalSprints").innerText = totalSprints;
    if(document.getElementById("statActiveSprints")) document.getElementById("statActiveSprints").innerText = activeSprints + (state.currentLanguage === 'ar' ? ' مفعل' : ' active');
    
    // Update task activation stats
    const activeTasksCount = state.tasks.filter(t => t.isActive !== false).length;
    const inactiveTasksCount = state.tasks.filter(t => t.isActive === false).length;
    if(document.getElementById("statActiveTasks")) document.getElementById("statActiveTasks").innerText = activeTasksCount;
    if(document.getElementById("statInactiveTasks")) document.getElementById("statInactiveTasks").innerText = inactiveTasksCount + (state.currentLanguage === 'ar' ? ' غير مفعل' : ' inactive');
}

// ==========================================================================
// SPRINT INTEGRATION ENGINE (إدارة السبرينتات الشاملة + أزرار الإضافة والتعديل والحذف)
// ==========================================================================
function openSprintFormModal(sprintId = null) {
    if (!isCurrentUserAdmin()) return;
    document.getElementById("sprintModalId").value = sprintId || "";
    
    if (sprintId) {
        const sprint = state.sprints.find(s => s.id === sprintId);
        if (sprint) {
            document.getElementById("sprintNameField").value = sprint.name;
            document.getElementById("sprintDescField").value = sprint.description || "";
            document.getElementById("sprintColorField").value = sprint.color || "#4a6cf7";
        }
    } else {
        document.getElementById("sprintNameField").value = "";
        document.getElementById("sprintDescField").value = "";
        document.getElementById("sprintColorField").value = "#4a6cf7";
    }
    openModal("sprintFormModal"); // تأكد من وجود معرف هذا المودال في كود الـ HTML الخاص بك
}

function handleSprintSubmit(event) {
    event.preventDefault();
    if (!isCurrentUserAdmin()) return;

    const sprintId = document.getElementById("sprintModalId").value;
    const name = document.getElementById("sprintNameField").value.trim();
    const desc = document.getElementById("sprintDescField").value.trim();
    const color = document.getElementById("sprintColorField").value;

    if (sprintId) {
        const index = state.sprints.findIndex(s => s.id === sprintId);
        if (index > -1) {
            state.sprints[index].name = name;
            state.sprints[index].description = desc;
            state.sprints[index].color = color;
        }
    } else {
        const newSprint = {
            id: "sprint_" + Date.now(),
            name: name,
            description: desc,
            color: color
        };
        state.sprints.push(newSprint);
    }

    saveCoreRuntimeToStorage();
    closeModal("sprintFormModal");
    executeGlobalInterfaceRefresh();
}

function triggerDeleteSprint(sprintId) {
    if (!isCurrentUserAdmin()) return;
    const confirmMsg = state.currentLanguage === 'ar' ? "هل تود حذف هذا السبرينت نهائياً؟ (المهام ستبقى بدون سبرينت)" : "Are you sure you want to delete this sprint permanently?";
    if (confirm(confirmMsg)) {
        state.sprints = state.sprints.filter(s => s.id !== sprintId);
        state.tasks.forEach(t => { if (t.sprintId === sprintId) t.sprintId = null; });
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
    }
}

// Note: Sprint management functions are in workspace.js
// openSprintModal, saveSprint, toggleSprintActivation, deleteSprint, openEditSprintModal, createTaskForSprint

// ==========================================================================
// TASK FORMULATION WIZARD (إدارة المهام الشاملة - إضافة/تعديل/حذف)
// ==========================================================================
function openTaskFormWizard(taskId = null, defaultModuleId = null, boundSprintId = null) {
    if (!isCurrentUserAdmin()) {
        alert("Access Denied: Task modifications restricted.");
        return;
    }
    
    document.getElementById("taskId").value = taskId || "";
    document.getElementById("taskBelongsToType").value = defaultModuleId || (state.types[0] ? state.types[0].id : "");
    document.getElementById("taskSprintId").value = boundSprintId || ""; // حقل مخفي مدمج بالمودال للسبرينت التابع له
    
    if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById("taskName").value = task.name;
            document.getElementById("taskNotes").value = task.notes || "";
            document.getElementById("taskTags").value = task.tags || "";
            document.getElementById("taskAssignedUser").value = task.assignedUser;
            document.getElementById("taskDueDate").value = task.dueDate || "";
            document.getElementById("taskCustomColor").value = task.customColor || "#4a6cf7";
            document.getElementById("taskSprintId").value = task.sprintId || "";
        }
    } else {
        document.getElementById("taskName").value = "";
        document.getElementById("taskNotes").value = "";
        document.getElementById("taskTags").value = "";
        document.getElementById("taskDueDate").value = "";
        document.getElementById("taskCustomColor").value = "#4a6cf7";
    }
    openModal("taskModal");
}

function handleTaskSubmit(event) {
    event.preventDefault();
    if (!isCurrentUserAdmin()) return;
    
    const taskId = document.getElementById("taskId").value;
    const typeId = document.getElementById("taskBelongsToType").value;
    const sprintId = document.getElementById("taskSprintId").value;
    const name = document.getElementById("taskName").value.trim();
    const user = document.getElementById("taskAssignedUser").value;
    const dueDate = document.getElementById("taskDueDate").value;
    const notes = document.getElementById("taskNotes").value.trim();
    const tags = document.getElementById("taskTags").value.trim();
    const color = document.getElementById("taskCustomColor").value;
    const isPrivate = document.getElementById("taskIsPrivate").value === "true";
    
    if (taskId) {
        const index = state.tasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            state.tasks[index].name = name;
            state.tasks[index].typeId = typeId;
            state.tasks[index].sprintId = sprintId || state.tasks[index].sprintId;
            state.tasks[index].assignedUser = user;
            state.tasks[index].dueDate = dueDate;
            state.tasks[index].notes = notes;
            state.tasks[index].tags = tags;
            state.tasks[index].customColor = color;
        }
    } else {
        const newTask = {
            id: "tsk_" + Date.now(),
            typeId: typeId,
            sprintId: sprintId || null,
            name: name,
            assignedUser: user,
            status: "todo",
            dueDate: dueDate,
            notes: notes,
            tags: tags,
            customColor: color,
            isPrivate: isPrivate
        };
        state.tasks.push(newTask);
    }
    
    saveCoreRuntimeToStorage();
    closeModal("taskModal");
    executeGlobalInterfaceRefresh();
}

function triggerDeleteTask(taskId) {
    if (!isCurrentUserAdmin()) return;
    if (confirm(state.currentLanguage === 'ar' ? "هل تريد حذف هذه المهمة؟" : "Are you sure you want to delete this task?")) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
    }
}

// Note: Private workspace functions are in workspace.js
// This function is kept for compatibility with privateWorkspace section
function renderPrivateIsolatedWorkspace() {
    if (typeof window.renderPrivateIsolatedWorkspace === 'function') {
        return window.renderPrivateIsolatedWorkspace();
    }
}

// ==========================================================================
// BACKUP DATA EXPORT PIPELINE (استخراج وتحميل بيانات المنصة المضافة بالكامل)
// ==========================================================================
function exportSystemDataBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const timestamp = new Date().toISOString().slice(0,10);
    downloadAnchor.setAttribute("download", `taskvibe_pro_system_dump_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// ==========================================================================
// INFRASTRUCTURE CREDENTIAL PROVISIONING & MEMBERS REVOLVING LABELS
// ==========================================================================
function renderAdminConfigurationDirectory() {
    const tableBody = document.getElementById("adminCredentialDirectoryTable");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    Object.keys(state.accessRegistry).forEach(tokenCode => {
        const userObj = state.accessRegistry[tokenCode];
        const isSystemAdmin = tokenCode === ROOT_ADMIN_ID;
        
        const badgeColor = isSystemAdmin ? "#e74c3c" : "#2ecc71";
        const currentStatus = state.currentLanguage === 'en' ? "Active Node" : "عقدة نشطة";

        const actionButtons = isSystemAdmin ? 
            `<span style="color:var(--text-muted); font-size:11px; font-style:italic;">Protected Root</span>` : 
            `<button type="button" class="btn-primary-sm" onclick="triggerEditUserNode('${tokenCode}')" style="background:#f1c40f; color:#fff; border:none; padding:4px 8px; margin-inline-end:6px; border-radius:3px; cursor:pointer;"><i class="fa-solid fa-user-pen"></i></button>
             <button type="button" class="btn-primary-sm" onclick="triggerDeleteUserNode('${tokenCode}')" style="background:#e74c3c; color:#fff; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;"><i class="fa-solid fa-user-xmark"></i></button>`;

        tableBody.innerHTML += `
            <tr>
                <td><strong>${userObj.name}</strong></td>
                <td><span class="role-badge" style="background: rgba(74,108,247,0.1); color: #4a6cf7; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight:600;">${userObj.role}</span></td>
                <td><code>${tokenCode}</code></td>
                <td><span style="color: ${badgeColor}; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> ${currentStatus}</span></td>
                <td class="admin-only-element">${actionButtons}</td>
            </tr>
        `;
    });
}

function handleProvisioningSubmit(event) {
    event.preventDefault();
    if (!isCurrentUserAdmin()) return;
    
    const nameInput = document.getElementById("newIdentityName");
    const roleSelect = document.getElementById("newIdentityRole");
    const codeInput = document.getElementById("newIdentityCode");
    
    if (!nameInput || !codeInput || !roleSelect) return;
    
    const newName = nameInput.value.trim();
    const newCode = codeInput.value.trim();
    const selectedRole = roleSelect.value;
    
    if (newName === "" || newCode === "") return;
    
    state.accessRegistry[newCode] = {
        name: newName,
        role: selectedRole
    };
    
    nameInput.value = "";
    codeInput.value = "";
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
}

function triggerDeleteUserNode(tokenCode) {
    if (!isCurrentUserAdmin()) return;
    if (tokenCode === ROOT_ADMIN_ID) return;

    const confirmationText = state.currentLanguage === 'en' ? 
        `Are you completely sure you want to revoke infrastructure access for token [ ${tokenCode} ]?` : 
        `هل أنت متأكد تماماً من إلغاء وحذف صلاحية الدخول للرمز التشغيلي [ ${tokenCode} ]؟`;
        
    if (confirm(confirmationText)) {
        delete state.accessRegistry[tokenCode];
        saveCoreRuntimeToStorage();
        executeGlobalInterfaceRefresh();
    }
}

function triggerEditUserNode(tokenCode) {
    if (!isCurrentUserAdmin()) return;
    if (tokenCode === ROOT_ADMIN_ID) return;

    const userObj = state.accessRegistry[tokenCode];
    if (!userObj) return;
    
    const promptNameText = state.currentLanguage === 'en' ? "Update Identity Name:" : "تعديل اسم المستخدم:";
    const promptRoleText = state.currentLanguage === 'en' ? "Update Functional Role (e.g., Data Analyst, BI Specialist):" : "تعديل المسمى الوظيفي والصلاحية:";
    
    const updatedName = prompt(promptNameText, userObj.name);
    if (!updatedName || updatedName.trim() === "") return;
    
    const updatedRole = prompt(promptRoleText, userObj.role);
    if (!updatedRole || updatedRole.trim() === "") return;
    
    state.accessRegistry[tokenCode] = {
        name: updatedName.trim(),
        role: updatedRole.trim()
    };
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
}

// ==========================================================================
// UTILITY CHRONOS TIME & CLOCK ENGINE
// ==========================================================================
function initializeClockEngine() {
    setInterval(() => {
        const current = new Date();
        const clockEl = document.getElementById("liveClock");
        if (clockEl) {
            clockEl.innerText = current.toLocaleTimeString(state.currentLanguage === 'ar' ? 'ar-EG' : 'en-US') + " | " + current.toLocaleDateString(state.currentLanguage === 'ar' ? 'ar-EG' : 'en-US');
        }
    }, 1000);
}

function initializeThemeEngine() {
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const nowTheme = document.documentElement.getAttribute("data-theme") === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute("data-theme", nowTheme);
            state.systemThemes = nowTheme;
            saveCoreRuntimeToStorage();
        });
    }
    if (state.systemThemes) document.documentElement.setAttribute("data-theme", state.systemThemes);
}

function openModal(id) { if(document.getElementById(id)) document.getElementById(id).style.display = "flex"; }
function closeModal(id) { if(document.getElementById(id)) document.getElementById(id).style.display = "none"; }

// showToast - displays notification toasts
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.system-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `system-toast system-toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'danger' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--primary)'};
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        font-size: 14px;
    `;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'danger' || type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleTaskActivation(taskId) {
    const isAdmin = isCurrentUserAdmin();
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }
    
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check if module is active
    if (task.typeId) {
        const module = state.types.find(m => m.id === task.typeId);
        if (module && module.isActive === false) {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل المهمة قبل تفعيل المشروع' : 'Cannot activate task before activating the project', 'warning');
            return;
        }
    }
    
    // Check if sprint is active
    if (task.sprintId) {
        const sprint = state.sprints.find(s => s.id === task.sprintId);
        if (sprint && sprint.isActive === false) {
            showToast(state.currentLanguage === 'ar' ? 'لا يمكن تفعيل المهمة قبل تفعيل السبرينت' : 'Cannot activate task before activating the sprint', 'warning');
            return;
        }
    }
    
    task.isActive = !task.isActive;
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    
    showToast(
        state.currentLanguage === 'ar'
            ? (task.isActive ? 'تم تفعيل المهمة' : 'تم إلغاء تفعيل المهمة')
            : (task.isActive ? 'Task activated' : 'Task deactivated'),
        task.isActive ? 'success' : 'warning'
    );
}

function toggleModuleActivation(moduleId) {
    const isAdmin = isCurrentUserAdmin();
    if (!isAdmin) {
        showToast(state.currentLanguage === 'ar' ? 'غير مسموح - الأدمن فقط' : 'Access Denied - Admin only', 'danger');
        return;
    }
    
    const mod = state.types.find(t => t.id === moduleId);
    if (!mod) return;
    
    mod.isActive = !mod.isActive;
    
    saveCoreRuntimeToStorage();
    executeGlobalInterfaceRefresh();
    
    showToast(
        state.currentLanguage === 'ar'
            ? (mod.isActive ? `تم تفعيل المشروع "${mod.name}"` : `تم إلغاء تفعيل المشروع "${mod.name}"`)
            : (mod.isActive ? `Project "${mod.name}" activated` : `Project "${mod.name}" deactivated`),
        mod.isActive ? 'success' : 'warning'
    );
}

// toggleModuleActions - opens dropdown for module actions
function toggleModuleActions(moduleId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`moduleActions_${moduleId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// toggleSprintActions - opens dropdown for sprint actions
function toggleSprintActions(sprintId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`sprintActions_${sprintId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// toggleTaskActions - opens dropdown for task actions
function toggleTaskActions(taskId) {
    document.querySelectorAll('.private-dropdown-menu').forEach(m => m.style.display = 'none');
    const menu = document.getElementById(`taskActions_${taskId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}