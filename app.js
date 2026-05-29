// ==========================================================================
// CENTRAL SYSTEM DATA & APPLICATION STATE (With Advanced Multi-Lingual Engine)
// ==========================================================================
let state = {
    currentLanguage: 'en', // 'en' or 'ar'
    currentUser: null,
    systemThemes: 'light',
    bgTexture: 'none',
    types: [],              // Shared global modules (المشاريع العامة والخاصة)
    tasks: [],              // Shared global tasks (المهام التابعة)
    sprints: [],            // Sprints data
    sprintNotes: [],
    sprintConfig: { start: '', end: '' },
    stickyNoteContent: "",
    currentSprintFilter: "all",
    currentKanbanModuleFilter: null,
    
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

document.addEventListener("DOMContentLoaded", () => {
    loadCoreRuntimeStorage();
    initializeClockEngine();
    initializeNavigationEngine();
    initializeThemeEngine();
    
    // Core Background Chronos Execution Tracker
    setInterval(checkActiveMilestonesEngine, 30000);
});

function loadCoreRuntimeStorage() {
    const hydrator = localStorage.getItem("taskvibe_pro_v3_core");
    if (hydrator) {
        try {
            state = JSON.parse(hydrator);
            
            // هجرة البيانات (Migration Layer) لضمان عدم حدوث Crash للبيانات السابقة وتحويلها للبنية الكائنية
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
            if (!state.tasks) state.tasks = [];
        } catch (e) {
            console.error("Hydration schema failure. Reseeding default core configuration.");
            seedInitialOperationalData();
        }
    } else {
        seedInitialOperationalData();
    }
    
    applyLanguageDOMEngine();
}

function saveCoreRuntimeToStorage() {
    localStorage.setItem("taskvibe_pro_v3_core", JSON.stringify(state));
}

function seedInitialOperationalData() {
    state.types = [
        { id: "st1", name: "Enterprise Gateway Core", notes: "Core infrastructural APIs", color: "#4a6cf7", isPrivate: false }
    ];
    state.tasks = [
        { id: "stsk1", typeId: "st1", name: "Configure OAuth Pipeline Tokens", assignedUser: "Admin", status: "doing", dueDate: "2026-12-31T23:59", notes: "Use SHA-256 standard encryption keys", tags: "security, api", customColor: "#4a6cf7" }
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
    
    if (state.accessRegistry[code]) {
        const identity = state.accessRegistry[code].name;
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
            roleLabel.innerText = state.accessRegistry[code].role;
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
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    // جمع المهام التي تحتاج إجراء من المستخدم الحالي
    let tasksNeedingAction = [];
    
    if (isAdmin) {
        // الأدمن يرى جميع المهام
        tasksNeedingAction = state.tasks.filter(t => t.status === 'todo' || t.status === 'review');
    } else {
        // المستخدم العادي يرى مهامه فقط
        tasksNeedingAction = state.tasks.filter(t => t.assignedUser === state.currentUser && (t.status === 'todo' || t.status === 'review'));
    }
    
    // إضافة المهام المتأخرة
    const now = new Date();
    const overdueTasks = tasksNeedingAction.filter(t => t.dueDate && new Date(t.dueDate) < now);
    
    if (tasksNeedingAction.length > 0 || overdueTasks.length > 0) {
        showWelcomeToast(tasksNeedingAction.length, overdueTasks.length, tasksNeedingAction.slice(0, 5));
    }
}

function showWelcomeToast(pendingCount, overdueCount, sampleTasks) {
    // إزالة أي toast قديم
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
    
    // إغلاق تلقائي بعد 10 ثواني
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 10000);
}

function navigateToTask(taskId) {
    // الانتقال إلى لوحة كانبان
    document.querySelector('[data-target=kanban]').click();
    
    // إغلاق toast
    const toast = document.querySelector('.welcome-toast');
    if (toast) toast.remove();
    
    // التمرير إلى المهمة (إذا كانت موجودة)
    setTimeout(() => {
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElement.style.boxShadow = '0 0 0 3px var(--primary)';
            setTimeout(() => {
                taskElement.style.boxShadow = '';
            }, 2000);
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
            const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
            
            // حارس أمني صارم: منع أي مستخدم غير مسؤول النظام من تخطي الرابط برمجياً لقسم الأدمن
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
            
            if (targetViewId === 'dashboard') renderDashboardSummaryHub();
            if (targetViewId === 'gantt') renderGanttTimelineChart();
            if (targetViewId === 'adminAnalytics') renderSystemAnalyticsDashboard();
            if (targetViewId === 'privateWorkspace') renderPrivateIsolatedWorkspace();
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
            renderKanbanBoard();
        });
    }
}

function executeGlobalInterfaceRefresh() {
    const isAdmin = (state.currentUser === 'Admin' || state.currentUser === 'الأدمن الأساسي');
    
    if (isAdmin) {
        document.querySelectorAll(".admin-only-element").forEach(el => {
            // حل الثغرة: لا تجبر قسم الـ view الكامل على أخذ display block لكي لا يظهر بصفحة الـ shared hub بالأسفل
            if (!el.classList.contains('view-section')) {
                el.style.display = "block";
            }
        });
        if(document.getElementById("adminSettingsNavBtn")) {
            document.getElementById("adminSettingsNavBtn").style.display = "block";
        }
    } else {
        document.querySelectorAll(".admin-only-element").forEach(el => el.style.display = "none");
        // حارس حماية إضافي: إذا طُرد الأدمن أو سُحبت صلاحياته وكان داخل صفحة التحكم، يتم تحويله فوراً للـ Dashboard
        const adminSection = document.getElementById("adminSettingsView");
        if (adminSection && adminSection.classList.contains("active")) {
            document.querySelector('[data-target="dashboard"]').click();
        }
    }
    
    hydrateUserOptionSelectors();
    renderDashboardSummaryHub();
    
    // عرض بطاقة "مهامي"
    if (typeof renderMyTasksCard === "function") renderMyTasksCard();
    
    if (typeof renderKanbanBoard === "function") renderKanbanBoard();
    if (typeof initializeSprintsSystem === "function") initializeSprintsSystem();
    
    const adminSection = document.getElementById("adminSettingsView");
    if (adminSection && adminSection.classList.contains("active")) {
        renderAdminConfigurationDirectory();
    }
}

function hydrateUserOptionSelectors() {
    const select = document.getElementById("taskAssignedUser");
    if(!select) return;
    select.innerHTML = "";
    Object.values(state.accessRegistry).forEach(userObj => {
        select.innerHTML += `<option value="${userObj.name}">${userObj.name} (${userObj.role})</option>`;
    });
}

// ==========================================================================
// MODULE FORMULATION SYSTEM (إصلاح بناء المشاريع العامة والسرية وإضافة مهامها)
// ==========================================================================
function openModuleForm(isPrivate = false) {
    document.getElementById("typeIsPrivate").value = isPrivate ? "true" : "false";
    document.getElementById("typeName").value = "";
    document.getElementById("typeNotes").value = "";
    openModal("typeModal");
}

function handleTypeSubmit(event) {
    event.preventDefault();
    
    const typeId = document.getElementById("typeId").value;
    const nameInput = document.getElementById("typeName");
    const notesInput = document.getElementById("typeNotes");
    const colorInput = document.getElementById("typeColor");
    const isPrivateStr = document.getElementById("typeIsPrivate").value;
    
    if (typeId) {
        // تعديل مشروع موجود
        const moduleIndex = state.types.findIndex(t => t.id === typeId);
        if (moduleIndex > -1) {
            state.types[moduleIndex].name = nameInput.value.trim();
            state.types[moduleIndex].notes = notesInput.value.trim();
            state.types[moduleIndex].color = colorInput.value;
        }
    } else {
        // إنشاء مشروع جديد
        const newModule = {
            id: "mod_" + Date.now(),
            name: nameInput.value.trim(),
            notes: notesInput.value.trim(),
            color: colorInput.value,
            isPrivate: isPrivateStr === "true"
        };
        
        state.types.push(newModule);
        
        if (newModule.isPrivate) {
            renderPrivateIsolatedWorkspace();
        }
    }
    
    saveCoreRuntimeToStorage();
    closeModal("typeModal");
    executeGlobalInterfaceRefresh();
}

function renderPrivateIsolatedWorkspace() {
    const container = document.getElementById("privateTypesList");
    if (!container) return;
    container.innerHTML = "";
    
    const privateModules = state.types.filter(t => t.isPrivate);
    if(privateModules.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:12px;">No encrypted personal environments active.</p>`;
        return;
    }
    
    privateModules.forEach(mod => {
        container.innerHTML += `
            <div style="border-inline-start: 4px solid var(--accent-orange); background:#f8fafc; padding:12px; margin-bottom:12px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                <strong>${mod.name}</strong>
                <button class="btn-primary-sm" onclick="launchTaskCreationWizard('${mod.id}', true)" style="background:var(--accent-orange); padding:4px 8px; font-size:11px; border:none; color:#fff; border-radius:3px; cursor:pointer;">+ Task</button>
            </div>`;
    });
}

function handleModuleSubmit(event) {
    event.preventDefault();
    
    const typeId = document.getElementById("typeId").value;
    const nameInput = document.getElementById("typeName");
    const notesInput = document.getElementById("typeNotes");
    const colorInput = document.getElementById("typeColor");
    const isPrivateStr = document.getElementById("typeIsPrivate").value;
    
    if (typeId) {
        // For private modules, update in vault
        if (isPrivateStr === "true") {
            const vaultKey = `taskvibe_vault_${state.currentUser}`;
            const vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
            const moduleIndex = vault.types.findIndex(t => t.id === typeId);
            if (moduleIndex > -1) {
                vault.types[moduleIndex].name = nameInput.value.trim();
                vault.types[moduleIndex].notes = (notesInput ? notesInput.value.trim() : '');
                vault.types[moduleIndex].color = (colorInput ? colorInput.value : vault.types[moduleIndex].color);
                localStorage.setItem(vaultKey, JSON.stringify(vault));
                renderPrivateIsolatedWorkspace();
            }
        } else {
            // For shared modules, update in state
            const moduleIndex = state.types.findIndex(t => t.id === typeId);
            if (moduleIndex > -1) {
                state.types[moduleIndex].name = nameInput.value.trim();
                state.types[moduleIndex].notes = (notesInput ? notesInput.value.trim() : '');
                state.types[moduleIndex].color = (colorInput ? colorInput.value : state.types[moduleIndex].color);
            }
        }
    } else {
        if (isPrivateStr === "true") {
            // Create private module in vault
            const vaultKey = `taskvibe_vault_${state.currentUser}`;
            let vault = JSON.parse(localStorage.getItem(vaultKey) || '{"types":[],"tasks":[]}');
            const newModule = {
                id: "mod_" + Date.now(),
                name: nameInput.value.trim(),
                notes: (notesInput ? notesInput.value.trim() : ''),
                color: (colorInput ? colorInput.value : '#4a6cf7'),
                isPrivate: true
            };
            vault.types.push(newModule);
            localStorage.setItem(vaultKey, JSON.stringify(vault));
            renderPrivateIsolatedWorkspace();
        } else {
            // Create shared module in state
            const newModule = {
                id: "mod_" + Date.now(),
                name: nameInput.value.trim(),
                notes: (notesInput ? notesInput.value.trim() : ''),
                color: (colorInput ? colorInput.value : '#4a6cf7'),
                isPrivate: false
            };
            state.types.push(newModule);
        }
    }
    
    saveCoreRuntimeToStorage();
    closeModal("typeModal");
    executeGlobalInterfaceRefresh();
}

function handleTaskSubmit(event) {
    event.preventDefault();
    
    const typeId = document.getElementById("taskBelongsToType").value;
    const sprintId = document.getElementById("taskSprintId").value || null;
    const name = document.getElementById("taskName").value.trim();
    const user = document.getElementById("taskAssignedUser").value;
    const dueDate = document.getElementById("taskDueDate").value;
    const notes = document.getElementById("taskNotes").value.trim();
    const tags = document.getElementById("taskTags").value.trim();
    const color = document.getElementById("taskCustomColor").value;
    const isPrivate = document.getElementById("taskIsPrivate").value === "true";
    
    const newTask = {
        id: "tsk_" + Date.now(),
        typeId: typeId,
        sprintId: sprintId,
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
    saveCoreRuntimeToStorage();
    closeModal("taskModal");
    
    executeGlobalInterfaceRefresh();
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
        const isSystemAdmin = (userObj.name === "Admin" || userObj.name === "الأدمن الأساسي");
        
        const badgeColor = isSystemAdmin ? "#e74c3c" : "#2ecc71";
        const currentStatus = state.currentLanguage === 'en' ? "Active Node" : "عقدة نشطة";

        // بناء أزرار التحكم الفوري (تعديل وحذف) لمدير النظام فقط ومنع لمس الحساب الجذري (Protected Root)
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
    
    const nameInput = document.getElementById("newIdentityName");
    const roleSelect = document.getElementById("newIdentityRole");
    const codeInput = document.getElementById("newIdentityCode");
    
    if (!nameInput || !codeInput || !roleSelect) return;
    
    const newName = nameInput.value.trim();
    const newCode = codeInput.value.trim();
    const selectedRole = roleSelect.value;
    
    if (newName === "" || newCode === "") return;
    
    // تسجيل كامل لمعلومات الكائن والدور المختار بدقة دون الاعتماد على مسميات ثابتة
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
    const userObj = state.accessRegistry[tokenCode];
    if (!userObj) return;
    
    const promptNameText = state.currentLanguage === 'en' ? "Update Identity Name:" : "تعديل اسم المستخدم:";
    const promptRoleText = state.currentLanguage === 'en' ? "Update Functional Role (e.g., Data Analyst, BI Specialist, AI Engineer):" : "تعديل المسمى الوظيفي والصلاحية:";
    
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

function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

function checkActiveMilestonesEngine() {
    if (typeof checkActiveMilestones === "function") {
        checkActiveMilestones();
    }
}