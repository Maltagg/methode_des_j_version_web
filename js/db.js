/* =========================================================
   MÉTHODE DES J
   js/db.js

   Gestion des données locales de l'application.

   Toutes les données sont stockées dans le navigateur
   avec localStorage.

   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const DB_KEY = "methode_des_j_database";

const DB_VERSION = 1;


/* =========================================================
   STRUCTURE PAR DÉFAUT
   ========================================================= */

const DEFAULT_DATABASE = {

    version: DB_VERSION,

    subjects: [],

    chapters: [],

    reviews: [],

    /*
     * Catégories de l'emploi du temps
     * (ex : Licence, Option Santé, Autre travail...).
     */

    domains: [],

    /*
     * Créneaux de l'emploi du temps hebdomadaire.
     */

    scheduleBlocks: [],

    /*
     * Modèles de roulement de J réutilisables
     * (ex : "Standard" 0,1,3,7,15,30,45 ;
     * "Rapide" 0,1,3,7...) proposés au choix
     * lors de la création d'un chapitre.
     */

    intervalPresets: [],

    settings: {

        revisionIntervals: [
            0,
            1,
            3,
            7,
            15,
            30,
            45
        ],

        notificationsEnabled: false,

        theme: "light",

        /*
         * Dernier choix de liste de J utilisé lors de
         * la création d'un chapitre ("default", "custom"
         * ou l'id d'une liste enregistrée). Permet de
         * pré-sélectionner automatiquement ce choix la
         * prochaine fois.
         */

        lastIntervalPresetChoice: "default",

        /*
         * Durées du Pomodoro, en minutes.
         */

        pomodoroWorkMinutes: 25,

        pomodoroBreakMinutes: 5,

        /*
         * Nombre de boucles (travail + pause) avant
         * arrêt automatique du Pomodoro. 0 = illimité
         * (le minuteur enchaîne jusqu'à ce qu'on
         * l'arrête manuellement).
         */

        pomodoroLoopCount: 0

    }

};


/* =========================================================
   MIGRATION : ANCIENNES MATIÈRES EN TEXTE LIBRE
   =========================================================

   Dans une ancienne version, chaque chapitre possédait un
   champ "subject" (texte libre) et un champ "color" propre.

   On transforme ça en véritables matières partagées
   (une matière = un nom + une couleur), et chaque
   chapitre pointe désormais vers une matière via
   "subjectId".
   ========================================================= */

function migrateLegacySubjects(
    database
) {

    let hasChanges = false;


    database.chapters.forEach(
        chapter => {

            if (chapter.subjectId) {

                return;

            }


            const legacyName =
                String(
                    chapter.subject || ""
                ).trim();


            if (!legacyName) {

                return;

            }


            const normalizedName =
                legacyName.toLowerCase();


            let subject =
                database.subjects.find(
                    existingSubject =>
                        existingSubject.name
                            .trim()
                            .toLowerCase() ===
                        normalizedName
                );


            if (!subject) {

                subject = {

                    id:
                        generateId(),

                    name:
                        legacyName,

                    color:
                        chapter.color ||
                        "#4f46e5",

                    createdAt:
                        new Date().toISOString()

                };

                database.subjects.push(
                    subject
                );

            }


            chapter.subjectId =
                subject.id;

            hasChanges = true;

        }
    );


    if (hasChanges) {

        saveDatabase(
            database
        );

    }


    return database;

}


/* =========================================================
   CHARGER LA BASE DE DONNÉES
   ========================================================= */

function loadDatabase() {

    try {

        const storedData =
            localStorage.getItem(DB_KEY);


        /*
         * Première utilisation :
         * aucune donnée n'existe encore.
         */

        if (!storedData) {

            saveDatabase(
                DEFAULT_DATABASE
            );

            return structuredClone(
                DEFAULT_DATABASE
            );

        }


        const database =
            JSON.parse(
                storedData
            );


        /*
         * Sécurité :
         * si certaines propriétés manquent,
         * on les recrée.
         */

        const completeDatabase = {

            ...DEFAULT_DATABASE,

            ...database,

            subjects:
                database.subjects || [],

            domains:
                database.domains || [],

            scheduleBlocks:
                (database.scheduleBlocks || []).map(
                    block => ({

                        active: true,

                        ...block

                    })
                ),

            intervalPresets:
                database.intervalPresets || [],

            settings: {

                ...DEFAULT_DATABASE.settings,

                ...(database.settings || {})

            }

        };


        return migrateLegacySubjects(
            completeDatabase
        );

    }

    catch (error) {

        console.error(
            "Erreur lors du chargement des données :",
            error
        );


        return structuredClone(
            DEFAULT_DATABASE
        );

    }

}


/* =========================================================
   SAUVEGARDER LA BASE DE DONNÉES
   ========================================================= */

function saveDatabase(database) {

    try {

        localStorage.setItem(

            DB_KEY,

            JSON.stringify(
                database
            )

        );


        /*
         * Point d'accroche unique pour
         * la synchro cloud (js/sync.js) :
         * si elle est active, elle écoute
         * ici pour renvoyer les données
         * vers le coffre en ligne.
         */

        if (
            typeof window !== "undefined" &&
            typeof window.onDatabaseSaved === "function"
        ) {

            window.onDatabaseSaved(
                database
            );

        }


        return true;

    }

    catch (error) {

        console.error(
            "Erreur lors de la sauvegarde :",
            error
        );

        return false;

    }

}


/* =========================================================
   RÉCUPÉRER LES MATIÈRES
   ========================================================= */

function getSubjects() {

    const database =
        loadDatabase();


    return database.subjects;

}


/* =========================================================
   RÉCUPÉRER UNE MATIÈRE
   ========================================================= */

function getSubject(
    subjectId
) {

    const database =
        loadDatabase();


    return database.subjects.find(

        subject =>
            subject.id === subjectId

    ) || null;

}


/* =========================================================
   AJOUTER UNE MATIÈRE
   ========================================================= */

function addSubject(
    subjectData
) {

    const database =
        loadDatabase();


    const subject = {

        id:
            generateId(),

        name:
            subjectData.name?.trim() ||
            "Sans nom",

        color:
            subjectData.color ||
            "#4f46e5",

        createdAt:
            new Date().toISOString()

    };


    database.subjects.push(
        subject
    );


    saveDatabase(
        database
    );


    return subject;

}


/* =========================================================
   MODIFIER UNE MATIÈRE
   ========================================================= */

function updateSubject(
    subjectId,
    updates
) {

    const database =
        loadDatabase();


    const subjectIndex =
        database.subjects.findIndex(

            subject =>
                subject.id === subjectId

        );


    if (
        subjectIndex === -1
    ) {

        return null;

    }


    database.subjects[
        subjectIndex
    ] = {

        ...database.subjects[
            subjectIndex
        ],

        ...updates

    };


    saveDatabase(
        database
    );


    return database.subjects[
        subjectIndex
    ];

}


/* =========================================================
   SUPPRIMER UNE MATIÈRE
   =========================================================

   Les chapitres liés ne sont pas supprimés : ils deviennent
   simplement "sans matière" pour éviter toute perte de
   données accidentelle.
   ========================================================= */

function deleteSubject(
    subjectId
) {

    const database =
        loadDatabase();


    database.subjects =
        database.subjects.filter(

            subject =>
                subject.id !== subjectId

        );


    database.chapters =
        database.chapters.map(

            chapter =>
                chapter.subjectId === subjectId
                    ? { ...chapter, subjectId: null }
                    : chapter

        );


    saveDatabase(
        database
    );


    return true;

}


/* =========================================================
   CHAPITRES D'UNE MATIÈRE
   ========================================================= */

function getSubjectChapters(
    subjectId
) {

    const database =
        loadDatabase();


    return database.chapters.filter(

        chapter =>
            chapter.subjectId === subjectId

    );

}


/* =========================================================
   MAÎTRISE (NOTE EN ÉTOILES) D'UN CHAPITRE
   ========================================================= */

function updateChapterMastery(
    chapterId,
    stars
) {

    const clamped =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(stars) || 0
                )
            )
        );


    return updateChapter(
        chapterId,
        { mastery: clamped }
    );

}


/* =========================================================
   MAÎTRISE MOYENNE D'UNE MATIÈRE
   =========================================================

   Calculée à partir des chapitres notés (note > 0)
   de cette matière. Les chapitres non notés ne
   comptent pas dans la moyenne.
   ========================================================= */

function getSubjectMasteryAverage(
    subjectId
) {

    const chapters =
        getSubjectChapters(
            subjectId
        );


    const ratedChapters =
        chapters.filter(
            chapter =>
                (chapter.mastery || 0) > 0
        );


    if (ratedChapters.length === 0) {

        return {

            average:
                null,

            ratedCount:
                0,

            totalCount:
                chapters.length

        };

    }


    const sum =
        ratedChapters.reduce(
            (total, chapter) =>
                total + (chapter.mastery || 0),
            0
        );


    return {

        average:
            sum / ratedChapters.length,

        ratedCount:
            ratedChapters.length,

        totalCount:
            chapters.length

    };

}


/* =========================================================
   RÉCUPÉRER LES CHAPITRES
   ========================================================= */

function getChapters() {

    const database =
        loadDatabase();


    return database.chapters;

}


/* =========================================================
   RÉCUPÉRER UN CHAPITRE
   ========================================================= */

function getChapter(
    chapterId
) {

    const database =
        loadDatabase();


    return database.chapters.find(

        chapter =>
            chapter.id === chapterId

    ) || null;

}


/* =========================================================
   AJOUTER UN CHAPITRE
   ========================================================= */

function addChapter(
    chapterData
) {

    const database =
        loadDatabase();


    const now =
        new Date().toISOString();


    const chapter = {

        id:
            generateId(),

        title:
            chapterData.title?.trim() ||
            "Sans titre",

        subjectId:
            chapterData.subjectId || null,

        description:
            chapterData.description?.trim() ||
            "",

        createdAt:
            now,

        updatedAt:
            now,

        /*
         * Nombre de révisions déjà validées.
         */

        completedReviews:
            0,

        /*
         * Niveau actuel :
         *
         * -1 = pas encore commencé
         *  0 = J0
         *  1 = J1
         * etc.
         */

        currentJ:
            -1,

        /*
         * Date de dernière révision.
         */

        lastReviewDate:
            null,

        /*
         * Date de prochaine révision.
         */

        nextReviewDate:
            null,

        /*
         * Note de maîtrise de la matière du chapitre.
         *
         * 0 = pas encore noté
         * 1 à 5 = nombre d'étoiles
         */

        mastery:
            0

    };


    database.chapters.push(
        chapter
    );


    saveDatabase(
        database
    );


    return chapter;

}


/* =========================================================
   MODIFIER UN CHAPITRE
   ========================================================= */

function updateChapter(
    chapterId,
    updates
) {

    const database =
        loadDatabase();


    const chapterIndex =
        database.chapters.findIndex(

            chapter =>
                chapter.id === chapterId

        );


    if (
        chapterIndex === -1
    ) {

        return null;

    }


    database.chapters[
        chapterIndex
    ] = {

        ...database.chapters[
            chapterIndex
        ],

        ...updates,

        updatedAt:
            new Date().toISOString()

    };


    saveDatabase(
        database
    );


    return database.chapters[
        chapterIndex
    ];

}


/* =========================================================
   SUPPRIMER UN CHAPITRE
   ========================================================= */

function deleteChapter(
    chapterId
) {

    const database =
        loadDatabase();


    database.chapters =
        database.chapters.filter(

            chapter =>
                chapter.id !== chapterId

        );


    /*
     * On supprime également toutes
     * les révisions associées.
     */

    database.reviews =
        database.reviews.filter(

            review =>
                review.chapterId !== chapterId

        );


    saveDatabase(
        database
    );


    return true;

}


/* =========================================================
   RÉCUPÉRER LES RÉVISIONS
   ========================================================= */

function getReviews() {

    const database =
        loadDatabase();


    return database.reviews;

}


/* =========================================================
   RÉCUPÉRER UNE RÉVISION
   ========================================================= */

function getReview(
    reviewId
) {

    const database =
        loadDatabase();


    return database.reviews.find(

        review =>
            review.id === reviewId

    ) || null;

}


/* =========================================================
   RÉVISIONS D'UN CHAPITRE
   ========================================================= */

function getChapterReviews(
    chapterId
) {

    const database =
        loadDatabase();


    return database.reviews.filter(

        review =>
            review.chapterId === chapterId

    );

}


/* =========================================================
   AJOUTER UNE RÉVISION
   ========================================================= */

function addReview(
    reviewData
) {

    const database =
        loadDatabase();


    const review = {

        id:
            generateId(),

        chapterId:
            reviewData.chapterId,

        j:
            reviewData.j ?? 0,

        scheduledDate:
            reviewData.scheduledDate,

        completed:
            false,

        completedAt:
            null,

        createdAt:
            new Date().toISOString()

    };


    database.reviews.push(
        review
    );


    saveDatabase(
        database
    );


    return review;

}


/* =========================================================
   MODIFIER UNE RÉVISION
   ========================================================= */

function updateReview(
    reviewId,
    updates
) {

    const database =
        loadDatabase();


    const reviewIndex =
        database.reviews.findIndex(

            review =>
                review.id === reviewId

        );


    if (
        reviewIndex === -1
    ) {

        return null;

    }


    database.reviews[
        reviewIndex
    ] = {

        ...database.reviews[
            reviewIndex
        ],

        ...updates

    };


    saveDatabase(
        database
    );


    return database.reviews[
        reviewIndex
    ];

}


/* =========================================================
   TERMINER UNE RÉVISION
   ========================================================= */

function completeReview(
    reviewId
) {

    const review =
        getReview(
            reviewId
        );


    if (!review) {

        return null;

    }


    const updatedReview =
        updateReview(

            reviewId,

            {

                completed:
                    true,

                completedAt:
                    new Date().toISOString()

            }

        );


    /*
     * Mise à jour du chapitre.
     */

    const chapter =
        getChapter(
            review.chapterId
        );


    if (chapter) {

        updateChapter(

            chapter.id,

            {

                completedReviews:
                    chapter.completedReviews + 1,

                currentJ:
                    review.j

            }

        );

    }


    return updatedReview;

}


/* =========================================================
   RÉINITIALISER UNE RÉVISION
   ========================================================= */

function uncompleteReview(
    reviewId
) {

    return updateReview(

        reviewId,

        {

            completed:
                false,

            completedAt:
                null

        }

    );

}


/* =========================================================
   DÉCALER LES RÉVISIONS À VENIR D'UN CHAPITRE
   =========================================================

   Permet d'ajuster tout le planning d'un chapitre
   (ex : je suis débordé cette semaine, je décale
   de 3 jours). Seules les révisions non terminées
   sont déplacées ; l'historique déjà validé ne
   bouge pas.
   ========================================================= */

function shiftChapterReviews(
    chapterId,
    deltaDays
) {

    const database =
        loadDatabase();


    const delta =
        Number(deltaDays) || 0;


    database.reviews =
        database.reviews.map(
            review => {

                if (
                    review.chapterId !== chapterId ||
                    review.completed ||
                    delta === 0
                ) {

                    return review;

                }


                const newDate =
                    addDays(
                        review.scheduledDate,
                        delta
                    );


                return {

                    ...review,

                    scheduledDate:
                        formatDateKey(newDate)

                };

            }
        );


    saveDatabase(
        database
    );


    return database.reviews.filter(
        review =>
            review.chapterId === chapterId
    );

}


/* =========================================================
   REPROGRAMMER UNE RÉVISION PRÉCISE
   =========================================================

   Permet de déplacer un seul J (une seule révision)
   à une nouvelle date, sans toucher au reste du
   planning du chapitre.
   ========================================================= */

function rescheduleReview(
    reviewId,
    newDate
) {

    return updateReview(

        reviewId,

        {
            scheduledDate:
                newDate
        }

    );

}


/* =========================================================
   ROULEMENTS DE J RÉUTILISABLES
   =========================================================

   Un roulement de J = un nom + une liste d'intervalles
   (ex : "Rapide" -> [0, 1, 2, 3, 5]).
   Proposés au choix lors de la création d'un chapitre,
   pour ne pas avoir à ressaisir les intervalles à chaque fois.
   ========================================================= */

function getIntervalPresets() {

    const database =
        loadDatabase();


    return database.intervalPresets;

}


function getIntervalPreset(
    presetId
) {

    const database =
        loadDatabase();


    return database.intervalPresets.find(

        preset =>
            preset.id === presetId

    ) || null;

}


function addIntervalPreset(
    presetData
) {

    const database =
        loadDatabase();


    const preset = {

        id:
            generateId(),

        name:
            presetData.name?.trim() ||
            "Sans nom",

        intervals:
            presetData.intervals ||
            [],

        createdAt:
            new Date().toISOString()

    };


    database.intervalPresets.push(
        preset
    );


    saveDatabase(
        database
    );


    return preset;

}


function updateIntervalPreset(
    presetId,
    updates
) {

    const database =
        loadDatabase();


    const presetIndex =
        database.intervalPresets.findIndex(

            preset =>
                preset.id === presetId

        );


    if (
        presetIndex === -1
    ) {

        return null;

    }


    database.intervalPresets[
        presetIndex
    ] = {

        ...database.intervalPresets[
            presetIndex
        ],

        ...updates

    };


    saveDatabase(
        database
    );


    return database.intervalPresets[
        presetIndex
    ];

}


function deleteIntervalPreset(
    presetId
) {

    const database =
        loadDatabase();


    database.intervalPresets =
        database.intervalPresets.filter(

            preset =>
                preset.id !== presetId

        );


    saveDatabase(
        database
    );


    return true;

}


/* =========================================================
   CATÉGORIES DE L'EMPLOI DU TEMPS (DOMAINES)
   =========================================================

   Une catégorie = un nom + une couleur
   (ex : Licence, Option Santé, Autre travail...).
   Utilisées pour répartir les créneaux de
   l'emploi du temps hebdomadaire.
   ========================================================= */

function getDomains() {

    const database =
        loadDatabase();


    return database.domains;

}


function getDomain(
    domainId
) {

    const database =
        loadDatabase();


    return database.domains.find(

        domain =>
            domain.id === domainId

    ) || null;

}


function addDomain(
    domainData
) {

    const database =
        loadDatabase();


    const domain = {

        id:
            generateId(),

        name:
            domainData.name?.trim() ||
            "Sans nom",

        color:
            domainData.color ||
            "#4f46e5",

        createdAt:
            new Date().toISOString()

    };


    database.domains.push(
        domain
    );


    saveDatabase(
        database
    );


    return domain;

}


function updateDomain(
    domainId,
    updates
) {

    const database =
        loadDatabase();


    const domainIndex =
        database.domains.findIndex(

            domain =>
                domain.id === domainId

        );


    if (domainIndex === -1) {

        return null;

    }


    database.domains[
        domainIndex
    ] = {

        ...database.domains[
            domainIndex
        ],

        ...updates

    };


    saveDatabase(
        database
    );


    return database.domains[
        domainIndex
    ];

}


function deleteDomain(
    domainId
) {

    const database =
        loadDatabase();


    database.domains =
        database.domains.filter(

            domain =>
                domain.id !== domainId

        );


    /*
     * Les créneaux liés à cette catégorie
     * sont supprimés avec elle.
     */

    database.scheduleBlocks =
        database.scheduleBlocks.filter(

            block =>
                block.domainId !== domainId

        );


    saveDatabase(
        database
    );


    return true;

}


/* =========================================================
   CRÉNEAUX DE L'EMPLOI DU TEMPS
   =========================================================

   Un créneau = un jour de la semaine (0 = lundi,
   6 = dimanche), une heure de début, une heure de
   fin, une catégorie et un libellé optionnel.
   ========================================================= */

function getScheduleBlocks() {

    const database =
        loadDatabase();


    return database.scheduleBlocks;

}


function getScheduleBlock(
    blockId
) {

    const database =
        loadDatabase();


    return database.scheduleBlocks.find(

        block =>
            block.id === blockId

    ) || null;

}


function addScheduleBlock(
    blockData
) {

    const database =
        loadDatabase();


    const block = {

        id:
            generateId(),

        day:
            Number(blockData.day) || 0,

        startTime:
            blockData.startTime ||
            "08:00",

        endTime:
            blockData.endTime ||
            "09:00",

        domainId:
            blockData.domainId ||
            null,

        label:
            String(
                blockData.label || ""
            ).trim(),

        /*
         * Indique si ce créneau de la semaine type
         * doit être reporté automatiquement sur
         * l'emploi du temps des 30 prochains jours.
         */

        active:
            blockData.active !== false,

        createdAt:
            new Date().toISOString()

    };


    database.scheduleBlocks.push(
        block
    );


    saveDatabase(
        database
    );


    return block;

}


function updateScheduleBlock(
    blockId,
    updates
) {

    const database =
        loadDatabase();


    const blockIndex =
        database.scheduleBlocks.findIndex(

            block =>
                block.id === blockId

        );


    if (blockIndex === -1) {

        return null;

    }


    database.scheduleBlocks[
        blockIndex
    ] = {

        ...database.scheduleBlocks[
            blockIndex
        ],

        ...updates

    };


    saveDatabase(
        database
    );


    return database.scheduleBlocks[
        blockIndex
    ];

}


function deleteScheduleBlock(
    blockId
) {

    const database =
        loadDatabase();


    database.scheduleBlocks =
        database.scheduleBlocks.filter(

            block =>
                block.id !== blockId

        );


    saveDatabase(
        database
    );


    return true;

}


/* =========================================================
   PARAMÈTRES
   ========================================================= */

function getSettings() {

    const database =
        loadDatabase();


    return database.settings;

}


function updateSettings(
    updates
) {

    const database =
        loadDatabase();


    database.settings = {

        ...database.settings,

        ...updates

    };


    saveDatabase(
        database
    );


    return database.settings;

}


/* =========================================================
   SUPPRIMER TOUTES LES DONNÉES
   ========================================================= */

function resetDatabase() {

    localStorage.removeItem(
        DB_KEY
    );


    saveDatabase(
        DEFAULT_DATABASE
    );


    return true;

}


/* =========================================================
   EXPORTER LES DONNÉES
   ========================================================= */

function exportDatabase() {

    const database =
        loadDatabase();


    return JSON.stringify(
        database,
        null,
        2
    );

}


/* =========================================================
   IMPORTER LES DONNÉES
   ========================================================= */

function importDatabase(
    jsonData
) {

    try {

        const importedData =
            typeof jsonData === "string"
                ? JSON.parse(jsonData)
                : jsonData;


        if (
            !importedData ||
            typeof importedData !== "object"
        ) {

            throw new Error(
                "Format invalide."
            );

        }


        const database = {

            ...DEFAULT_DATABASE,

            ...importedData,

            settings: {

                ...DEFAULT_DATABASE.settings,

                ...(importedData.settings || {})

            }

        };


        saveDatabase(
            database
        );


        return true;

    }

    catch (error) {

        console.error(
            "Erreur lors de l'importation :",
            error
        );


        return false;

    }

}


/* =========================================================
   GÉNÉRATEUR D'IDENTIFIANT
   ========================================================= */

function generateId() {

    return (

        Date.now().toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


/* =========================================================
   OUTILS DE DATES
   ========================================================= */


/*
 * Transforme une date en YYYY-MM-DD.
 */

function formatDateKey(
    date
) {

    const d =
        new Date(date);


    const year =
        d.getFullYear();


    const month =
        String(
            d.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            d.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/*
 * Ajouter X jours à une date.
 */

function addDays(
    date,
    numberOfDays
) {

    const result =
        new Date(date);


    result.setDate(

        result.getDate() +
        numberOfDays

    );


    return result;

}


/*
 * Vérifie si deux dates correspondent
 * au même jour.
 */

function isSameDay(
    dateA,
    dateB
) {

    return (
        formatDateKey(dateA) ===
        formatDateKey(dateB)
    );

}


/*
 * Vérifie si une date est dans le passé.
 */

function isDateBeforeToday(
    date
) {

    const today =
        new Date();


    const target =
        new Date(date);


    today.setHours(
        0,
        0,
        0,
        0
    );


    target.setHours(
        0,
        0,
        0,
        0
    );


    return target < today;

}


/* =========================================================
   STATISTIQUES
   ========================================================= */

function getStatistics() {

    const database =
        loadDatabase();


    const chapters =
        database.chapters;


    const reviews =
        database.reviews;


    const totalReviews =
        reviews.length;


    const completedReviews =
        reviews.filter(
            review =>
                review.completed
        ).length;


    const todayReviews =
        reviews.filter(

            review =>
                isSameDay(
                    review.scheduledDate,
                    new Date()
                )

        );


    const lateReviews =
        reviews.filter(

            review =>
                !review.completed &&
                isDateBeforeToday(
                    review.scheduledDate
                )

        );


    const completionRate =
        totalReviews === 0
            ? 0
            : Math.round(
                (
                    completedReviews /
                    totalReviews
                ) * 100
            );


    return {

        chapters:
            chapters.length,

        totalReviews,

        completedReviews,

        todayReviews:
            todayReviews.length,

        lateReviews:
            lateReviews.length,

        completionRate

    };

}


/* =========================================================
   INITIALISATION
   ========================================================= */


/*
 * On initialise la base dès que
 * db.js est chargé.
 */

loadDatabase();


console.log(
    "Méthode des J — base de données chargée."
);

window.Database = {

    loadDatabase,
    saveDatabase,

    getSubjects,
    getSubject,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectChapters,

    getChapters,
    getChapter,
    addChapter,
    updateChapter,
    deleteChapter,

    updateChapterMastery,
    getSubjectMasteryAverage,

    getReviews,
    getReview,
    getChapterReviews,
    addReview,
    updateReview,
    completeReview,
    uncompleteReview,

    shiftChapterReviews,
    rescheduleReview,

    getDomains,
    getDomain,
    addDomain,
    updateDomain,
    deleteDomain,

    getIntervalPresets,
    getIntervalPreset,
    addIntervalPreset,
    updateIntervalPreset,
    deleteIntervalPreset,

    getScheduleBlocks,
    getScheduleBlock,
    addScheduleBlock,
    updateScheduleBlock,
    deleteScheduleBlock,

    getSettings,
    updateSettings,

    resetDatabase,

    exportDatabase,
    importDatabase,

    formatDateKey,
    addDays,
    isSameDay,
    isDateBeforeToday,

    getStatistics

};