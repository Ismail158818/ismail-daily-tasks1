
const firebaseConfig = {
    apiKey: "AIzaSyDRO38IiJiOWhrqGPL7KSP1WFzHmqeC-MU",
    authDomain: "taskvibe-pro.firebaseapp.com",
    projectId: "taskvibe-pro",
    storageBucket: "taskvibe-pro.firebasestorage.app",
    messagingSenderId: "1010924774371",
    appId: "1:1010924774371:web:e172464ce27c8c344d76d6"
};


let db = null;
let storage = null;

let isLocalSave = false;


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


function saveLocalCoreRuntime() {
    localStorage.setItem("taskvibe_pro_v3_core", JSON.stringify(state));
}


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
    

    if (!state.accessRegistry) {
        state.accessRegistry = {};
    }
    if (!state.accessRegistry["158818"]) {
        state.accessRegistry["158818"] = { name: "Admin", role: "System Administrator" };
    }
    

    if (typeof renderKanbanBoard === 'function') {
        renderKanbanBoard();
    }
    
    if (typeof executeGlobalInterfaceRefresh === 'function') {
        executeGlobalInterfaceRefresh();
    }
}


async function uploadFile(file, path = 'uploads/') {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    
    try {
        const fileRef = storage.ref(path + file.name);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File uploaded successfully:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Firebase upload error:', error);
        return null;
    }
}

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

function getStorageReference(path = '') {
    if (!storage) {
        const initialized = initializeFirebase();
        if (!initialized) return null;
    }
    return storage.ref(path);
}


function subscribeToRemoteChanges() {
    if (!db) {
        const initialized = initializeFirebase();
        if (!initialized) return;
    }
    
    db.collection('shared').doc('state').onSnapshot((doc) => {
        if (doc.exists) {
            if (isLocalSave) {
                isLocalSave = false;
                return;
            }
            console.log('Firebase real-time update received');
            Object.assign(state, doc.data());
            if (!state.accessRegistry || !state.accessRegistry["158818"]) {
                state.accessRegistry = state.accessRegistry || {};
                state.accessRegistry["158818"] = { name: "Admin", role: "System Administrator" };
            }
            executeGlobalInterfaceRefresh();
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    subscribeToRemoteChanges();
});
