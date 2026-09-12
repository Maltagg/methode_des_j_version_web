/* =========================================================
   MÉTHODE DES J
   js/sync.js

   Synchro optionnelle entre appareils via un "code de
   synchro" — pas de compte, pas de mot de passe utilisateur.

   Principe :
   - Deux appareils qui connaissent le même code lisent et
     écrivent le même document Firestore.
   - À chaque sauvegarde locale, on renvoie une copie complète
     des données vers ce document (après un court délai, pour
     grouper les sauvegardes rapprochées en un seul envoi).
   - Au démarrage de l'appli, si un code est déjà enregistré,
     on va chercher la version en ligne et on l'applique en
     local (l'appli sert alors toujours la donnée la plus
     récente connue).
   ========================================================= */


/* =========================================================
   CONFIGURATION FIREBASE
   ========================================================= */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCIDtzc4-ScYArjxr1U6ZYouHvsDcy2zi4",
    authDomain: "methode-des-j-23314.firebaseapp.com",
    projectId: "methode-des-j-23314",
    storageBucket: "methode-des-j-23314.firebasestorage.app",
    messagingSenderId: "785742922491",
    appId: "1:785742922491:web:6340d15d3b9c30a7d5e65e"
};

const SYNC_CODE_KEY =
    "methode_des_j_sync_code";

const SYNC_PUSH_DELAY_MS =
    1500;


/* =========================================================
   ÉTAT INTERNE
   ========================================================= */

let firebaseApp = null;
let firestoreDb = null;
let pushTimer = null;
let isApplyingRemoteUpdate = false;

let syncState = {
    status: "idle",
    /* idle | syncing | ok | error */
    lastError: null,
    lastSyncedAt: null
};


/* =========================================================
   INITIALISATION FIREBASE (paresseuse)
   ========================================================= */

function initFirebase() {

    if (firebaseApp) {

        return firebaseApp;

    }


    try {

        firebaseApp =
            firebase.initializeApp(
                FIREBASE_CONFIG
            );


        firestoreDb =
            firebase.firestore();


        firestoreDb
            .enablePersistence({
                synchronizeTabs: true
            })
            .catch(
                error => {

                    console.warn(
                        "Persistance hors-ligne Firestore indisponible :",
                        error
                    );

                }
            );

    }

    catch (error) {

        console.error(
            "Erreur d'initialisation Firebase :",
            error
        );

    }


    return firebaseApp;

}


/* =========================================================
   CODE DE SYNCHRO
   ========================================================= */

function getSyncCode() {

    return (
        localStorage.getItem(
            SYNC_CODE_KEY
        ) || null
    );

}


function generateSyncCodeValue() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        if (i === 4) {

            code += "-";

        }


        code +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }


    return code;

}


function setSyncCode(
    code
) {

    localStorage.setItem(
        SYNC_CODE_KEY,
        code
    );


    initFirebase();

}


function disableSync() {

    localStorage.removeItem(
        SYNC_CODE_KEY
    );


    syncState = {
        status: "idle",
        lastError: null,
        lastSyncedAt: null
    };

}


function getSyncDocRef() {

    const code =
        getSyncCode();


    if (
        !code ||
        !firestoreDb
    ) {

        return null;

    }


    return firestoreDb
        .collection("syncs")
        .doc(code);

}


/* =========================================================
   ENVOI VERS LE CLOUD
   ========================================================= */

function scheduleCloudPush(
    database
) {

    if (
        !getSyncCode() ||
        isApplyingRemoteUpdate
    ) {

        return;

    }


    initFirebase();


    clearTimeout(
        pushTimer
    );


    pushTimer =
        setTimeout(
            () => {

                pushToCloud(
                    database
                );

            },
            SYNC_PUSH_DELAY_MS
        );

}


async function pushToCloud(
    database
) {

    const ref =
        getSyncDocRef();


    if (!ref) {

        return;

    }


    syncState.status =
        "syncing";


    try {

        await ref.set({

            data:
                JSON.stringify(
                    database
                ),

            updatedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        });


        syncState.status =
            "ok";

        syncState.lastError =
            null;

        syncState.lastSyncedAt =
            new Date();

    }

    catch (error) {

        syncState.status =
            "error";

        syncState.lastError =
            error.message;

        console.error(
            "Erreur de synchro (envoi) :",
            error
        );

    }

}


/* =========================================================
   RÉCEPTION DEPUIS LE CLOUD
   ========================================================= */

async function pullFromCloud() {

    const ref =
        getSyncDocRef();


    if (!ref) {

        return false;

    }


    syncState.status =
        "syncing";


    try {

        const snapshot =
            await ref.get();


        if (!snapshot.exists) {

            /*
             * Rien en ligne encore pour ce
             * code : on pousse la version
             * locale actuelle pour amorcer
             * le coffre.
             */

            await pushToCloud(
                Database.loadDatabase()
            );

            syncState.status =
                "ok";

            return false;

        }


        const cloudData =
            snapshot.data();


        isApplyingRemoteUpdate =
            true;

        Database.importDatabase(
            cloudData.data
        );

        isApplyingRemoteUpdate =
            false;


        syncState.status =
            "ok";

        syncState.lastError =
            null;

        syncState.lastSyncedAt =
            new Date();


        return true;

    }

    catch (error) {

        isApplyingRemoteUpdate =
            false;

        syncState.status =
            "error";

        syncState.lastError =
            error.message;

        console.error(
            "Erreur de synchro (réception) :",
            error
        );

        return false;

    }

}


/* =========================================================
   API PUBLIQUE
   ========================================================= */

function getSyncStatus() {

    return {

        active:
            Boolean(
                getSyncCode()
            ),

        code:
            getSyncCode(),

        status:
            syncState.status,

        error:
            syncState.lastError,

        lastSyncedAt:
            syncState.lastSyncedAt

    };

}


window.onDatabaseSaved =
    function (database) {

        scheduleCloudPush(
            database
        );

    };


window.Sync = {

    getSyncCode,
    generateSyncCodeValue,
    setSyncCode,
    disableSync,
    pullFromCloud,

    pushNow:
        () =>
            pushToCloud(
                Database.loadDatabase()
            ),

    getSyncStatus,
    initFirebase

};


/*
 * Si un code de synchro est déjà
 * enregistré sur cet appareil, on
 * tente une synchro dès le chargement
 * de l'appli.
 */

if (getSyncCode()) {

    initFirebase();


    pullFromCloud().then(
        () => {

            if (
                typeof renderApp === "function"
            ) {

                renderApp();

            }

        }
    );

}
