/*
=========================================================
MÉTHODE DES J
js/revision.js

Moteur de répétition espacée.

Architecture :

chapters[]
    ↓
reviews[]

Intervalles :

J0 → J1 → J3 → J7 → J15 → J30 → J45
=========================================================
*/


/* ======================================================
   CONFIGURATION
   ====================================================== */

const DEFAULT_REVISION_INTERVALS = [
    0,
    1,
    3,
    7,
    15,
    30,
    45
];


/* ======================================================
   OUTILS DE DATE
   ====================================================== */

/**
 * Ajoute un nombre de jours à une date.
 */
function addDays(date, days) {

    const result = new Date(date);

    result.setDate(
        result.getDate() + days
    );

    return result;

}


/**
 * Transforme une Date en YYYY-MM-DD.
 */
function formatDate(date) {

    const d = new Date(date);

    const year =
        d.getFullYear();

    const month =
        String(
            d.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            d.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/**
 * Transforme YYYY-MM-DD en Date.
 */
function parseDate(dateString) {

    if (!dateString) {

        return null;

    }

    const [
        year,
        month,
        day
    ] =
        dateString
            .split("-")
            .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );

}


/**
 * Retourne aujourd'hui sans l'heure.
 */
function todayDate() {

    const now =
        new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

}


/**
 * Retourne la date du jour sous forme YYYY-MM-DD.
 */
function todayKey() {

    return formatDate(
        todayDate()
    );

}


/* ======================================================
   CRÉATION DU PLANNING
   ====================================================== */

/**
 * Crée les dates J0/J1/J3/J7/J15/J30/J45.
 *
 * Retourne uniquement les informations nécessaires
 * à la création des reviews dans la base.
 */
function createRevisionSchedule(
    startDate = new Date(),
    intervals = DEFAULT_REVISION_INTERVALS
) {

    return intervals.map(
        (interval, index) => {

            const date =
                addDays(
                    startDate,
                    interval
                );

            return {

                j:
                    interval,

                index,

                scheduledDate:
                    formatDate(date),

                completed:
                    false,

                completedAt:
                    null

            };

        }
    );

}


/**
 * Crée directement les reviews d'un chapitre.
 *
 * Cette fonction utilise la base de données.
 */
function createChapterReviews(
    chapterId,
    startDate = new Date(),
    intervals = DEFAULT_REVISION_INTERVALS
) {

    const schedule =
        createRevisionSchedule(
            startDate,
            intervals
        );


    return schedule.map(
        revision => {

            return Database.addReview({

                chapterId,

                j:
                    revision.j,

                scheduledDate:
                    revision.scheduledDate

            });

        }
    );

}


/* ======================================================
   IDENTIFIANT
   ====================================================== */

function generateRevisionId() {

    return (
        "revision_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* ======================================================
   RECHERCHE DES RÉVISIONS
   ====================================================== */

/**
 * Retourne toutes les reviews.
 */
function getAllReviews() {

    return Database.getReviews();

}


/**
 * Retourne les reviews d'un chapitre.
 */
function getReviewsForChapter(
    chapterId
) {

    return Database
        .getChapterReviews(
            chapterId
        );

}


/**
 * Retourne une review avec les informations
 * de son chapitre.
 */
function enrichReview(
    review
) {

    const chapter =
        Database.getChapter(
            review.chapterId
        );


    return {

        ...review,

        chapterTitle:
            chapter
                ? chapter.title
                : "Chapitre supprimé",

        chapterSubjectId:
            chapter
                ? chapter.subjectId
                : null

    };

}


/**
 * Retourne toutes les reviews enrichies.
 */
function getEnrichedReviews() {

    return getAllReviews()
        .map(
            enrichReview
        );

}


/* ======================================================
   ÉTAT D'UNE RÉVISION
   ====================================================== */

/**
 * Vérifie si une review est prévue aujourd'hui.
 */
function isRevisionToday(
    revision
) {

    return (
        revision.scheduledDate ===
        todayKey()
    );

}


/**
 * Vérifie si une review est en retard.
 */
function isRevisionLate(
    revision
) {

    if (
        revision.completed
    ) {

        return false;

    }


    const today =
        todayDate();


    const revisionDate =
        parseDate(
            revision.scheduledDate
        );


    return (
        revisionDate <
        today
    );

}


/**
 * Vérifie si une review est future.
 */
function isRevisionUpcoming(
    revision
) {

    if (
        revision.completed
    ) {

        return false;

    }


    const today =
        todayDate();


    const revisionDate =
        parseDate(
            revision.scheduledDate
        );


    return (
        revisionDate >
        today
    );

}


/* ======================================================
   RÉVISIONS DU JOUR
   ====================================================== */

/**
 * Retourne les révisions prévues aujourd'hui.
 */
function getTodayRevisions() {

    return getEnrichedReviews()
        .filter(
            revision =>
                isRevisionToday(
                    revision
                ) &&
                !revision.completed
        );

}


/**
 * Nombre de révisions prévues aujourd'hui.
 */
function countTodayRevisions() {

    return getTodayRevisions()
        .length;

}


/* ======================================================
   RÉVISIONS EN RETARD
   ====================================================== */

/**
 * Retourne toutes les révisions en retard.
 */
function getLateRevisions() {

    return getEnrichedReviews()
        .filter(
            revision =>
                isRevisionLate(
                    revision
                )
        );

}


/**
 * Nombre de révisions en retard.
 */
function countLateRevisions() {

    return getLateRevisions()
        .length;

}


/* ======================================================
   RÉVISIONS FUTURES
   ====================================================== */

/**
 * Retourne les prochaines révisions.
 */
function getUpcomingRevisions(
    limit = 20
) {

    const revisions =
        getEnrichedReviews()
            .filter(
                revision =>
                    isRevisionUpcoming(
                        revision
                    )
            );


    revisions.sort(
        (a, b) => {

            return (
                parseDate(
                    a.scheduledDate
                ) -
                parseDate(
                    b.scheduledDate
                )
            );

        }
    );


    return revisions.slice(
        0,
        limit
    );

}


/* ======================================================
   RÉVISIONS D'UNE DATE
   ====================================================== */

/**
 * Retourne toutes les révisions prévues
 * pour une date donnée.
 */
function getRevisionsForDate(
    date
) {

    const targetDate =
        typeof date === "string"
            ? date
            : formatDate(date);


    return getEnrichedReviews()
        .filter(
            revision =>
                revision.scheduledDate ===
                targetDate
        );

}


/* ======================================================
   VALIDATION
   ====================================================== */

/**
 * Termine une révision.
 */
function completeRevision(
    revisionId
) {

    return Database.completeReview(
        revisionId
    );

}


/**
 * Annule une révision.
 */
function uncompleteRevision(
    revisionId
) {

    return Database.uncompleteReview(
        revisionId
    );

}


/* ======================================================
   PROGRESSION D'UN CHAPITRE
   ====================================================== */

/**
 * Nombre de révisions terminées.
 */
function getChapterCompletedCount(
    chapter
) {

    const reviews =
        Database.getChapterReviews(
            chapter.id
        );


    return reviews.filter(
        review =>
            review.completed
    ).length;

}


/**
 * Nombre total de révisions.
 */
function getChapterTotalCount(
    chapter
) {

    return Database
        .getChapterReviews(
            chapter.id
        )
        .length;

}


/**
 * Pourcentage de progression.
 */
function getChapterProgress(
    chapter
) {

    const total =
        getChapterTotalCount(
            chapter
        );


    if (
        total === 0
    ) {

        return 0;

    }


    const completed =
        getChapterCompletedCount(
            chapter
        );


    return Math.round(
        (
            completed /
            total
        ) * 100
    );

}


/* ======================================================
   STATISTIQUES
   ====================================================== */

/**
 * Nombre total de reviews.
 */
function getTotalReviews() {

    return Database
        .getReviews()
        .length;

}


/**
 * Nombre de reviews terminées.
 */
function getCompletedReviews() {

    return Database
        .getReviews()
        .filter(
            review =>
                review.completed
        )
        .length;

}


/**
 * Taux de réussite global.
 */
function getCompletionRate() {

    const total =
        getTotalReviews();


    if (
        total === 0
    ) {

        return 0;

    }


    return Math.round(
        (
            getCompletedReviews() /
            total
        ) * 100
    );

}


/**
 * Statistiques générales.
 */
function getStatistics() {

    return {

        chapters:
            Database
                .getChapters()
                .length,

        totalReviews:
            getTotalReviews(),

        completedReviews:
            getCompletedReviews(),

        todayReviews:
            countTodayRevisions(),

        lateReviews:
            countLateRevisions(),

        upcomingReviews:
            getUpcomingRevisions()
                .length,

        completionRate:
            getCompletionRate()

    };

}


/* ======================================================
   EXPORT PUBLIC
   ====================================================== */

window.RevisionEngine = {

    DEFAULT_REVISION_INTERVALS,

    addDays,

    formatDate,

    parseDate,

    todayDate,

    todayKey,

    createRevisionSchedule,

    createChapterReviews,

    generateRevisionId,

    getAllReviews,

    getReviewsForChapter,

    getEnrichedReviews,

    isRevisionToday,

    isRevisionLate,

    isRevisionUpcoming,

    getTodayRevisions,

    countTodayRevisions,

    getLateRevisions,

    countLateRevisions,

    getUpcomingRevisions,

    getRevisionsForDate,

    completeRevision,

    uncompleteRevision,

    getChapterCompletedCount,

    getChapterTotalCount,

    getChapterProgress,

    getTotalReviews,

    getCompletedReviews,

    getCompletionRate,

    getStatistics

};