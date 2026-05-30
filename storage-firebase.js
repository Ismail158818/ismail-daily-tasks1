// ==========================================================================
// CENTRALIZED REMOTE STORAGE WITH FIREBASE (FIRESTORE + STORAGE)
// ==========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDRO38IiJiOWhrqGPL7KSP1WFzHmqeC-MU",
    authDomain: "taskvibe-pro.firebaseapp.com",
    projectId: "taskvibe-pro",
    storageBucket: "taskvibe-pro.firebasestorage.app",
    messagingSenderId: "1010924774371",
    appId: "1:1010924774371:web:e172464ce27c8c344d76d6"
};

// متغيرات Firebase
let db = null;
let storage = null;
// منع التكرار عند الحفظ محليًا ثم استلام التحديث من Firestore
let isLocalSave = false;

// تهيئة Firebase
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded yet');
        return false;
    }
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    storage = firebase.storage();
    return true;
}

// جلب الحالة من Firebase
async function fetchRemoteState() {
    if (!db) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    
    try {
        const doc = await db.collection('shared').doc('state').get();
        if (doc.exists) {
            console.log('Successfully loaded state from Firebase');
            return doc.data();
        }
    } catch (error) {
        console.error('Firebase fetch error:', error);
    }
    return null;
}

// حفظ الحالة في Firebase
async function saveRemoteState(stateData) {
    if (!db) {
        const initialized = initializeFirebase();
        if (!initialized) return false;
    }
    
    try {
        isLocalSave = true;
        await db.collection('shared').doc('state').set(stateData);
        console.log('Successfully saved state to Firebase');
        if (typeof showToast === 'function') {
            showToast('Data saved to cloud!', 'success');
        }
        return true;
    } catch (error) {
        console.error('Firebase save error:', error);
        return false;
    } finally {
        isLocalSave = false;
    }
}

// حفظ الحالة محلياً
function saveLocalCoreRuntime() {
    localStorage.setItem("taskvibe_pro_v3_core", JSON.stringify(state));
}

// تحميل الحالة عند بدء التشغيل (يتم استدعاؤها من app.js بعد تعريف state)
async function loadStateFromFirebase() {
    if (typeof state === 'undefined') return;
    
    const remoteState = await fetchRemoteState();
    
    if (remoteState && (remoteState.tasks || remoteState.types)) {
        Object.assign(state, remoteState);
        console.log('State loaded from Firebase');
    } else {
        // fallback to localStorage
        const localState = localStorage.getItem("taskvibe_pro_v3_core");
        if (localState) {
            Object.assign(state, JSON.parse(localState));
            console.log('State loaded from localStorage');
        }
    }
    
    // التأكد من وجود الأدمن
    if (!state.accessRegistry) {
        state.accessRegistry = {};
    }
    if (!state.accessRegistry["158818"]) {
        state.accessRegistry["158818"] = { name: "Admin", role: "System Administrator" };
    }
    
    // تشغيل الكانبان بعد التحميل
    if (typeof renderKanbanBoard === 'function') {
        renderKanbanBoard();
    }
    
    if (typeof executeGlobalInterfaceRefresh === 'function') {
        executeGlobalInterfaceRefresh();
    }
}

// رفع ملف إلى Firebase Storage
async function uploadFile(file, path = 'uploads/') {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    
    try {
        // إنشاء مرجع للملف في التخزين
        const fileRef = storage.ref(path + file.name);
        // رفع الملف
        const snapshot = await fileRef.put(file);
        // الحصول على رابط التحميل
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File uploaded successfully:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Firebase upload error:', error);
        return null;
    }
}

// تحميل ملف من Firebase Storage
async function downloadFile(path) {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    
    try {
        const fileRef = storage.ref(path);
        const downloadURL = await fileRef.getDownloadURL();
        console.log('File download URL obtained:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Firebase download error:', error);
        return null;
    }
}

// حذف ملف من Firebase Storage
async function deleteFile(path) {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return false;
    }
    
    try {
        const fileRef = storage.ref(path);
        await fileRef.delete();
        console.log('File deleted successfully');
        return true;
    } catch (error) {
        console.error('Firebase delete error:', error);
        return false;
    }
}

// الحصول على مرجع لمجلد في التخزين (لرفع ملفات متعددة)
function getStorageReference(path = '') {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    return storage.ref(path);
}

// الاستماع للتغييرات في الوقت الحقيقي
function subscribeToRemoteChanges() {
    if (!db) {
        const initialized = initializeFirebase();
        if (!initialized) return;
    }
    
    db.collection('shared').doc('state').onSnapshot((doc) => {
        if (doc.exists) {
            // تجاهل التحديثات التي مصدرها هذا العميل
            if (isLocalSave) {
                isLocalSave = false;
                return;
            }
            console.log('Firebase real-time update received');
            Object.assign(state, doc.data());
            executeGlobalInterfaceRefresh();
        }
    });
}

// بدء التحميل التلقائي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تفعيل المزامنة الزمنية réelle مع Firebase (مع الحماية من التكرار)
    subscribeToRemoteChanges();
});

// ==========================================================================
// كيفية استخدام وظائف التخزين:
// ==========================================================================
//
// رفع ملف:
// const fileInput = document.getElementById('fileInput');
// const file = fileInput.files[0];
// uploadFile(file, 'task-attachments/')
//   .then(downloadURL => {
//     console.log('File available at:', downloadURL);
//     // يمكنك حفظ downloadURL في state أو Firestore
//   });
//
// تحميل ملف:
// downloadFile('task-attachments/example.pdf')
//   .then(downloadURL => {
//     const link = document.createElement('a');
//     link.href = downloadURL;
//     link.download = 'example.pdf';
//     link.click();
//   });
//
// حذف ملف:
// deleteFile('task-attachments/example.pdf')
//   .then(success => {
//     if (success) console.log('File deleted');
//   });
//
// الحصول على مرجع مجلد:
// const folderRef = getStorageReference('project-files/');
// // يمكنك استخدام folderRef لرفع ملفات متعددة أو مراقبة التغييرات
// ==========================================================================