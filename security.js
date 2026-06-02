// ==========================================================================
// CORE SECURITY ARCHITECTURE GUARD & VALIDATION MATRIX
// ==========================================================================

const ARCHITECTURE_SECURITY_GUARD = {
    ROOT_ADMIN_CODE: "158818",
    SYSTEM_STORAGE_KEY: "taskvibe_pro_v3_core",
    BACKUP_SESSION_KEY: "taskvibe_emergency_backup"
};


function cleanAndSanitizeApplicationState(rawPayload) {
    let checkedState = { ...rawPayload };

    if (!checkedState.accessRegistry || typeof checkedState.accessRegistry !== 'object') {
        checkedState.accessRegistry = {};
    }

  
    checkedState.accessRegistry[ARCHITECTURE_SECURITY_GUARD.ROOT_ADMIN_CODE] = { 
        name: "Admin", 
        role: "System Administrator" 
    };


    Object.keys(checkedState.accessRegistry).forEach(securityKey => {
        if (!securityKey || securityKey.trim() === "" || checkedState.accessRegistry[securityKey] === "undefined") {
            delete checkedState.accessRegistry[securityKey];
        }
        if (securityKey === "155355") {
            delete checkedState.accessRegistry[securityKey];
        }
    });

    if (!Array.isArray(checkedState.tasks)) checkedState.tasks = [];
    if (!Array.isArray(checkedState.chatMessages)) checkedState.chatMessages = [];
    if (!checkedState.sharedDraft) checkedState.sharedDraft = "";

    if (!checkedState.userMetrics || typeof checkedState.userMetrics !== 'object') {
        checkedState.userMetrics = {};
    }
    if (!checkedState.userMetrics["Admin"]) {
        checkedState.userMetrics["Admin"] = { logins: 1, sessionStart: null, workingHours: 0, rating: 5.0 };
    }

    return checkedState;
}


function verifySessionAdminAuthorization() {
    if (!state || state.currentUser !== "Admin") {
        console.error("PRIVILEGE VIOLATION DETECTED! THREAT MITIGATED.");
        executeGlobalSecurityToastTrigger("Security Block: Missing core administrator clearance level.");
        executeSecureSystemLogout();
        return false;
    }
    return true;
}

function captureSystemRollbackSnapshot() {
    try {
        sessionStorage.setItem(ARCHITECTURE_SECURITY_GUARD.BACKUP_SESSION_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Failed to commit recovery checkpoint snapshot.", error);
    }
}

function executeGlobalSecurityToastTrigger(message) {
    const toast = document.getElementById("securityNotificationToast");
    const label = document.getElementById("securityToastMessage");
    if (toast && label) {
        label.innerText = message;
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 4000);
    }
}

