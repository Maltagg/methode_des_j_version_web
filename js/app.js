/*
=========================================================
MÉTHODE DES J
js/app.js

Application principale.

Architecture :

index.html
    ↓
app.js
    ├── Database
    └── RevisionEngine

Database
    └── localStorage

RevisionEngine
    └── J0 → J1 → J3 → J7 → J15 → J30 → J45
=========================================================
*/


"use strict";


/* ======================================================
   CONFIGURATION
   ====================================================== */

const APP = {

    name: "Méthode des J",

    version: "1.0.0"

};


/* ======================================================
   ÉTAT DE L'APPLICATION
   ====================================================== */

const AppState = {

    currentView: "accueil",

    selectedDate:
        new Date(),

    editingChapterId:
        null,

    editingSubjectId:
        null,

    editingDomainId:
        null,

    editingScheduleBlockId:
        null,

    /*
     * Filtre actif dans l'agenda.
     *
     * type :
     * - "chapter"
     * - "subject"
     * - null
     *
     * value :
     * - id du chapitre ou de la matière concernée
     */

    agendaFilter: {
        type: null,
        value: null
    },

    /*
     * Filtre actif dans les statistiques
     * (progression par chapitre).
     *
     * null   -> toutes les matières
     * "none" -> chapitres sans matière
     * id     -> une matière précise
     */

    statsSubjectFilter:
        null,

    tourStepIndex:
        0,

    initialized:
        false,

    /*
     * État de la session Pomodoro en cours.
     *
     * phase : "idle" | "work" | "break"
     */

    pomodoro: {

        reviewId: null,

        chapterTitle: "",

        phase: "idle",

        secondsLeft: 0,

        totalSeconds: 0,

        running: false,

        intervalId: null,

        /*
         * 0 = boucles illimitées.
         */

        totalLoops: 0,

        loopsCompleted: 0

    }

};


/* ======================================================
   INITIALISATION
   ====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initApp
);


function initApp() {

    if (AppState.initialized) {

        return;

    }


    AppState.initialized = true;


    setupNavigation();

    setupGlobalEvents();

    renderApp();

    console.log(
        "Méthode des J — application initialisée."
    );

}


/* ======================================================
   NAVIGATION
   ====================================================== */

function setupNavigation() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-view]"
                );


            if (!button) {

                return;

            }


            event.preventDefault();


            const view =
                button.dataset.view;


            navigateTo(
                view
            );

        }
    );

}


function navigateTo(view) {

    const allowedViews = [

        "accueil",
        "decouverte",
        "matieres",
        "chapitres",
        "agenda",
        "planning",
        "semaine-type",
        "pomodoro",
        "statistiques",
        "parametres"

    ];


    if (
        !allowedViews.includes(view)
    ) {

        return;

    }


    AppState.currentView =
        view;


    renderApp();

}


/* ======================================================
   ÉVÉNEMENTS GLOBAUX
   ====================================================== */

function setupGlobalEvents() {

    document.addEventListener(
        "click",
        handleClick
    );


    document.addEventListener(
        "submit",
        handleSubmit
    );


    document.addEventListener(
        "change",
        handleChange
    );


    document.addEventListener(
        "click",
        event => {

            const swatch =
                event.target.closest(
                    "[data-preset-color]"
                );


            if (!swatch) {

                return;

            }


            const colorInput =
                swatch
                    .closest("form")
                    ?.querySelector(
                        "input[type=\"color\"]"
                    );


            if (!colorInput) {

                return;

            }


            colorInput.value =
                swatch.dataset.presetColor;


            colorInput.dispatchEvent(
                new Event("input")
            );

        }
    );

}


/* ======================================================
   GESTION DES CLICS
   ====================================================== */

function handleClick(event) {

    const target =
        event.target.closest(
            "[data-action]"
        );


    if (!target) {

        return;

    }


    const action =
        target.dataset.action;


    switch (action) {

        case "add-chapter":

            openChapterForm();

            break;


        case "add-subject":

            openSubjectForm();

            break;


        case "close-modal-and-add-subject":

            AppState.editingChapterId =
                null;

            openSubjectForm();

            break;


        case "close-modal-and-add-domain":

            AppState.editingScheduleBlockId =
                null;

            openDomainForm();

            break;


        case "edit-subject":

            editSubject(
                target.dataset.id
            );

            break;


        case "delete-subject":

            deleteSubjectFromUI(
                target.dataset.id
            );

            break;


        case "close-modal":

            closeModal();

            break;


        case "complete-review":

            completeReviewFromUI(
                target.dataset.id
            );

            break;


        case "apply-subject-color":

            applySubjectColorFromUI();

            break;


        case "start-pomodoro":

            startPomodoroForReview(
                target.dataset.id
            );

            break;


        case "start-free-pomodoro":

            startFreePomodoroFromUI();

            break;


        case "pause-pomodoro":

            pausePomodoro();

            break;


        case "resume-pomodoro":

            resumePomodoro();

            break;


        case "stop-pomodoro":

            stopPomodoro();

            break;


        case "complete-pomodoro-now":

            completePomodoroNow();

            break;


        case "skip-pomodoro-break":

            skipPomodoroBreak();

            break;


        case "uncomplete-review":

            uncompleteReviewFromUI(
                target.dataset.id
            );

            break;


        case "delete-chapter":

            deleteChapterFromUI(
                target.dataset.id
            );

            break;


        case "edit-chapter":

            editChapter(
                target.dataset.id
            );

            break;


        case "shift-chapter":

            openShiftChapterForm(
                target.dataset.id
            );

            break;


        case "set-mastery":

            setChapterMasteryFromUI(
                target.dataset.id,
                target.dataset.value
            );

            break;


        case "reschedule-review":

            openRescheduleReviewForm(
                target.dataset.id
            );

            break;


        case "add-domain":

            openDomainForm();

            break;


        case "edit-domain":

            editDomain(
                target.dataset.id
            );

            break;


        case "delete-domain":

            deleteDomainFromUI(
                target.dataset.id
            );

            break;


        case "add-schedule-block":

            openScheduleBlockForm(
                null,
                target.dataset.day
            );

            break;


        case "edit-schedule-block":

            editScheduleBlock(
                target.dataset.id
            );

            break;


        case "delete-schedule-block":

            deleteScheduleBlockFromUI(
                target.dataset.id
            );

            break;


        case "seed-default-domains":

            seedDefaultDomains();

            break;


        case "filter-chapter":

            toggleAgendaChapterFilter(
                target.dataset.id
            );

            break;


        case "filter-subject":

            toggleAgendaSubjectFilter(
                target.dataset.subjectId
            );

            break;


        case "filter-stats-subject":

            AppState.statsSubjectFilter =
                target.dataset.subjectId ||
                null;

            renderApp();

            break;


        case "delete-interval-preset":

            Database.deleteIntervalPreset(
                target.dataset.id
            );

            renderApp();

            break;


        case "generate-sync-code":

            handleGenerateSyncCode();

            break;


        case "connect-sync-code":

            handleConnectSyncCode();

            break;


        case "copy-sync-code":

            handleCopySyncCode();

            break;


        case "sync-now":

            handleSyncNow();

            break;


        case "disable-sync":

            handleDisableSync();

            break;


        case "start-tour":

            startTour();

            break;


        case "tour-next":

            goToNextTourStep();

            break;


        case "tour-end":

            endTour();

            break;


        case "open-chapter-agenda":

            AppState.agendaFilter = {
                type: "chapter",
                value: target.dataset.id
            };

            navigateTo(
                "agenda"
            );

            break;


        case "open-subject-agenda":

            AppState.agendaFilter = {
                type: "subject",
                value: target.dataset.id
            };

            navigateTo(
                "agenda"
            );

            break;

        case "go-today":

            AppState.selectedDate =
                new Date();

            renderApp();

            break;


        case "select-date":

            AppState.selectedDate =
                RevisionEngine.parseDate(
                    target.dataset.date
                );

            renderApp();

            break;


        case "previous-month":

            changeCalendarMonth(
                -1
            );

            break;


        case "next-month":

            changeCalendarMonth(
                1
            );

            break;


        case "export":

            exportData();

            break;


        case "import":

            openImportDialog();

            break;


        case "delete-data":

            openDeleteDataDialog();

            break;


        case "export-then-delete":

            exportThenDeleteData();

            break;


        case "delete-data-only":

            confirmAndResetApplication();

            break;
            
        case "clear-agenda-filter":

            clearAgendaFilter();

            renderApp();

            break;

    }

}


/* ======================================================
   FORMULAIRES
   ====================================================== */

function handleSubmit(event) {

    const form =
        event.target;


    if (
        form.id ===
        "chapter-form"
    ) {

        event.preventDefault();

        saveChapterFromForm(
            form
        );

    }


    if (
        form.id ===
        "subject-form"
    ) {

        event.preventDefault();

        saveSubjectFromForm(
            form
        );

    }


    if (
        form.id ===
        "import-form"
    ) {

        event.preventDefault();

        importDataFromForm(
            form
        );

    }


    if (
        form.id ===
        "shift-chapter-form"
    ) {

        event.preventDefault();

        shiftChapterFromForm(
            form
        );

    }


    if (
        form.id ===
        "reschedule-review-form"
    ) {

        event.preventDefault();

        rescheduleReviewFromForm(
            form
        );

    }


    if (
        form.id ===
        "domain-form"
    ) {

        event.preventDefault();

        saveDomainFromForm(
            form
        );

    }


    if (
        form.id ===
        "schedule-block-form"
    ) {

        event.preventDefault();

        saveScheduleBlockFromForm(
            form
        );

    }

}


/* ======================================================
   CHANGEMENTS
   ====================================================== */

function handleChange(event) {

    const target =
        event.target;


    if (
        target.dataset.setting
    ) {

        const setting =
            target.dataset.setting;


        const value =
            target.type === "checkbox"
                ? target.checked
                : target.type === "number"
                    ? Number(target.value) || 0
                    : target.value;


        Database.updateSettings({

            [setting]:
                value

        });


        if (
            setting === "theme"
        ) {

            applyTheme();

        }

    }


    if (
        target.dataset.action ===
        "toggle-schedule-block-active"
    ) {

        Database.updateScheduleBlock(
            target.dataset.id,
            {
                active:
                    target.checked
            }
        );

        renderApp();

        return;

    }


    if (
        target.id ===
        "interval-preset-select"
    ) {

        const customFields =
            document.getElementById(
                "interval-preset-custom-fields"
            );


        if (customFields) {

            customFields.hidden =
                target.value !== "custom";

        }

    }

}


/* ======================================================
   RENDU PRINCIPAL
   ====================================================== */

function renderApp() {

    const root =
        getAppRoot();


    if (!root) {

        console.error(
            "Élément #app introuvable."
        );

        return;

    }


    root.innerHTML =
        renderLayout();


    updateActiveNavigation();


    renderCurrentView();

}


/* ======================================================
   ROOT
   ====================================================== */

function getAppRoot() {

    let root =
        document.getElementById(
            "app"
        );


    if (!root) {

        root =
            document.querySelector(
                "main"
            );

    }


    if (!root) {

        root =
            document.body;

    }


    return root;

}


/* ======================================================
   LAYOUT
   ====================================================== */

function renderLayout() {

    return `

        <div class="app-container">

            ${renderHeader()}

            ${renderNavigation()}

            <main class="app-content">

                <div id="view-container"></div>

            </main>

        </div>

    `;

}


function renderHeader() {

    const statistics =
        RevisionEngine.getStatistics();


    return `

        <header class="app-header">

            <div>

                <h1>
                    ${APP.name}
                </h1>

                <p>
                    Répétition espacée
                </p>

            </div>

            <div class="header-counter">

                <strong>
                    ${statistics.todayReviews}
                </strong>

                <span>
                    aujourd'hui
                </span>

            </div>

        </header>

    `;

}


function renderNavigation() {

    return `

        <nav class="app-navigation">

            <button
                type="button"
                data-view="accueil"
            >
                🏠 Accueil
            </button>

            <button
                type="button"
                data-view="matieres"
            >
                🎨 Matières
            </button>

            <button
                type="button"
                data-view="chapitres"
            >
                📚 Chapitres
            </button>

            <button
                type="button"
                data-view="agenda"
            >
                📅 Agenda
            </button>

            <button
                type="button"
                data-view="planning"
            >
                🗓️ Emploi du temps
            </button>

            <button
                type="button"
                data-view="semaine-type"
            >
                📆 Semaine type
            </button>

            <button
                type="button"
                data-view="pomodoro"
            >
                🍅 Pomodoro
            </button>

            <button
                type="button"
                data-view="statistiques"
            >
                📊 Statistiques
            </button>

            <button
                type="button"
                data-view="parametres"
            >
                ⚙️ Paramètres
            </button>

            <button
                type="button"
                data-view="decouverte"
            >
                🧭 Découverte
            </button>

        </nav>

    `;

}


function updateActiveNavigation() {

    document
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.view ===
                    AppState.currentView

                );

            }
        );

}


/* ======================================================
   VUE ACTUELLE
   ====================================================== */

function renderCurrentView() {

    const container =
        document.getElementById(
            "view-container"
        );


    if (!container) {

        return;

    }


    switch (
        AppState.currentView
    ) {

        case "accueil":

            container.innerHTML =
                renderHome();

            break;


        case "decouverte":

            container.innerHTML =
                renderDiscovery();

            break;


        case "matieres":

            container.innerHTML =
                renderSubjects();

            break;


        case "chapitres":

            container.innerHTML =
                renderChapters();

            break;


        case "agenda":

            container.innerHTML =
                renderAgenda();

            break;


        case "semaine-type":

            container.innerHTML =
                renderSchedule();

            break;


        case "planning":

            container.innerHTML =
                renderPlanning();

            break;


        case "pomodoro":

            container.innerHTML =
                renderPomodoro();

            break;


        case "statistiques":

            container.innerHTML =
                renderStatistics();

            break;


        case "parametres":

            container.innerHTML =
                renderSettings();

            break;

    }

}


/* ======================================================
   DÉCOUVERTE
   ====================================================== */

function renderDiscovery() {

    return `

        <section class="view discovery-view">

            <div class="page-title">

                <div>

                    <h2>
                        🧭 Découverte
                    </h2>

                    <p>
                        Comprends la méthode et l'appli en 2 minutes.
                    </p>

                </div>

                <button
                    type="button"
                    class="primary-button"
                    data-action="start-tour"
                >
                    ▶️ Lancer le tutoriel
                </button>

            </div>


            <section class="content-section">

                <h3>
                    La méthode des J, c'est quoi ?
                </h3>

                <p>
                    C'est une technique de révision espacée :
                    au lieu de réviser un chapitre une seule fois
                    juste avant un contrôle (et de tout oublier
                    après), tu le revois plusieurs fois à des
                    intervalles de plus en plus grands. Chaque
                    passage renforce la mémorisation sur le long
                    terme, pour beaucoup moins d'effort au total.
                </p>

                <p>
                    Dès que tu marques une première révision
                    (J0) comme faite, l'appli calcule
                    automatiquement les prochaines dates pour toi :
                </p>

                <div class="discovery-interval-row">

                    ${
                        DEFAULT_REVISION_INTERVALS
                            .map(
                                (day, index) => `
                                    ${
                                        index > 0
                                            ? '<span class="discovery-interval-arrow">→</span>'
                                            : ""
                                    }
                                    <span class="discovery-interval-chip">
                                        J${day}
                                    </span>
                                `
                            )
                            .join("")
                    }

                </div>

                <p class="discovery-interval-caption">
                    Exemple : si tu fais ta première révision (J0)
                    le 1<sup>er</sup> septembre, l'appli programme
                    automatiquement la suivante (J1) le 2 septembre,
                    puis J3 le 4 septembre, J7 le 8 septembre, etc.
                    Tu n'as rien à calculer toi-même.
                </p>

            </section>


            <section class="content-section">

                <h3>
                    Comment utiliser l'appli
                </h3>

                <div class="discovery-steps">

                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            🎨
                        </span>

                        <div>

                            <h4>
                                1. Crée tes matières
                            </h4>

                            <p>
                                Une matière (ex : Biologie), avec
                                une couleur qui te sert de repère
                                visuel partout dans l'appli
                                (agenda, statistiques...).
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            📚
                        </span>

                        <div>

                            <h4>
                                2. Ajoute tes chapitres
                            </h4>

                            <p>
                                Chaque chapitre appartient à une
                                matière. Marque sa première révision
                                (J0) comme faite pour lancer le
                                cycle de révisions espacées.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            📅
                        </span>

                        <div>

                            <h4>
                                3. Suis ton agenda
                            </h4>

                            <p>
                                Toutes tes révisions du jour
                                apparaissent ici. Tu peux filtrer
                                par matière ou par chapitre en
                                cliquant directement sur leur nom,
                                où que tu les voies dans l'appli.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            📆
                        </span>

                        <div>

                            <h4>
                                4. Organise ta semaine type
                            </h4>

                            <p>
                                Indépendamment des révisions,
                                répartis des créneaux de travail
                                par catégorie sur une semaine type,
                                pour équilibrer ton temps. Coche
                                « Reporté sur l'emploi du temps »
                                sur un créneau pour qu'il apparaisse
                                automatiquement chaque semaine.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            🗓️
                        </span>

                        <div>

                            <h4>
                                5. Consulte ton emploi du temps
                            </h4>

                            <p>
                                Retrouve un calendrier comme celui de
                                l'Agenda, mais rempli automatiquement
                                avec les créneaux cochés dans ta
                                semaine type. Clique sur un jour pour
                                voir son détail.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            🍅
                        </span>

                        <div>

                            <h4>
                                6. Révise avec le Pomodoro
                            </h4>

                            <p>
                                Retrouve tous tes J du jour et
                                lance un pomodoro sur un chapitre :
                                une fois la session terminée, ce J
                                est automatiquement marqué comme
                                révisé.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            📊
                        </span>

                        <div>

                            <h4>
                                7. Vérifie tes statistiques
                            </h4>

                            <p>
                                Ta progression par chapitre,
                                regroupée et filtrable par matière,
                                pour voir en un coup d'œil ce qui
                                est solide et ce qu'il reste à
                                travailler.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            ⚙️
                        </span>

                        <div>

                            <h4>
                                8. Personnalise dans Paramètres
                            </h4>

                            <p>
                                Thème clair/sombre, durées du
                                Pomodoro, export de tes données
                                pour les sauvegarder ou les
                                transférer sur un autre appareil,
                                et suppression si besoin.
                            </p>

                        </div>

                    </div>


                    <div class="discovery-step">

                        <span class="discovery-step-icon">
                            🔗
                        </span>

                        <div>

                            <h4>
                                9. Synchronise tes appareils
                            </h4>

                            <p>
                                Dans Paramètres, génère un code
                                sur un appareil et entre-le sur
                                un autre (téléphone, PC...) : tes
                                matières et chapitres se
                                retrouvent automatiquement des
                                deux côtés, sans créer de compte.
                            </p>

                        </div>

                    </div>

                </div>

            </section>


            <section class="content-section">

                <h3>
                    Astuces
                </h3>

                <div class="info-box">
                    Clique sur le nom d'une matière ou d'un
                    chapitre n'importe où dans l'appli : ça
                    t'emmène directement sur l'agenda filtré
                    dessus.
                </div>

            </section>

        </section>

    `;

}


/* ======================================================
   TUTORIEL GUIDÉ
   ====================================================== */

const TOUR_STEPS = [

    {
        view: null,
        selector: null,
        title: "👋 Bienvenue",
        text:
            "Petit tour guidé de l'appli, moins de 5 minutes. " +
            "Clique sur \"Suivant\" pour avancer à ton rythme, " +
            "ou \"Passer\" pour arrêter à tout moment."
    },

    {
        view: "accueil",
        selector: ".home-view .page-title h2",
        title: "🏠 Accueil",
        text:
            "Ta page d'accueil : toutes les révisions " +
            "prévues aujourd'hui, en un coup d'œil."
    },

    {
        view: "matieres",
        selector: "[data-action=\"add-subject\"]",
        title: "🎨 Crée tes matières",
        text:
            "Une matière a une couleur qui te sert de " +
            "repère partout dans l'appli."
    },

    {
        view: "matieres",
        selector: ".subject-card-main",
        title: "🎨 Clique sur une matière",
        text:
            "Ça t'emmène directement sur son planning " +
            "dans l'agenda."
    },

    {
        view: "chapitres",
        selector: "[data-action=\"add-chapter\"]",
        title: "📚 Ajoute tes chapitres",
        text:
            "Valide la 1ère révision (J0) d'un chapitre : " +
            "les suivantes se programment automatiquement. " +
            "Tu peux même choisir ou créer ta propre liste de J à la création."
    },

    {
        view: "agenda",
        selector: ".agenda-view .page-title h2",
        title: "📅 Agenda",
        text:
            "Ton planning jour par jour. Filtre par matière " +
            "ou par chapitre pour te concentrer sur un point précis."
    },

    {
        view: "semaine-type",
        selector: ".schedule-view .page-title h2",
        title: "📆 Semaine type",
        text:
            "Indépendamment des révisions : répartis des " +
            "créneaux de travail par catégorie sur une semaine " +
            "type. Coche « Reporté sur l'emploi du temps » sur " +
            "un créneau pour qu'il apparaisse automatiquement " +
            "chaque semaine dans ton emploi du temps."
    },

    {
        view: "planning",
        selector: ".planning-view .page-title h2",
        title: "🗓️ Emploi du temps",
        text:
            "Un calendrier comme celui de l'Agenda, rempli " +
            "automatiquement à partir des créneaux cochés dans " +
            "ta semaine type."
    },

    {
        view: "pomodoro",
        selector: ".pomodoro-view .page-title h2",
        title: "🍅 Pomodoro",
        text:
            "Retrouve tous tes J du jour ici. Clique sur " +
            "\"Lancer\" pour démarrer un pomodoro sur un " +
            "chapitre : dès qu'il se termine, ce J est " +
            "automatiquement marqué comme révisé."
    },

    {
        view: "statistiques",
        selector: ".statistics-view .page-title h2",
        title: "📊 Statistiques",
        text:
            "Ta progression par chapitre, regroupée et " +
            "filtrable par matière."
    },

    {
        view: "parametres",
        selector: ".settings-view .page-title h2",
        title: "⚙️ Paramètres",
        text:
            "Thème clair/sombre, export de tes données, " +
            "et suppression si besoin — toujours avec ton accord."
    },

    {
        view: "parametres",
        selector: "#sync-section",
        title: "🔗 Synchronise tes appareils",
        text:
            "Relie ton téléphone et ton PC avec un simple code " +
            "(sans compte) : tes matières et chapitres se " +
            "retrouvent automatiquement sur les deux, même " +
            "modifiés hors ligne."
    },

    {
        view: null,
        selector: null,
        title: "🎉 Tour terminé",
        text:
            "Tu peux le relancer à tout moment depuis " +
            "l'onglet Découverte. Bonnes révisions !"
    }

];


function startTour() {

    closeModal();

    AppState.tourStepIndex =
        0;

    renderTourStep();

}


function endTour() {

    const overlay =
        document.getElementById(
            "tour-overlay"
        );


    if (overlay) {

        overlay.remove();

    }


    AppState.tourStepIndex =
        0;

}


function goToNextTourStep() {

    AppState.tourStepIndex += 1;


    if (
        AppState.tourStepIndex >=
        TOUR_STEPS.length
    ) {

        endTour();

        return;

    }


    renderTourStep();

}


function renderTourStep() {

    const step =
        TOUR_STEPS[
            AppState.tourStepIndex
        ];


    if (!step) {

        endTour();

        return;

    }


    if (
        step.view &&
        step.view !== AppState.currentView
    ) {

        AppState.currentView =
            step.view;

        renderApp();

    }


    requestAnimationFrame(
        () => {

            renderTourOverlay(
                step
            );

        }
    );

}


function renderTourOverlay(
    step
) {

    let overlay =
        document.getElementById(
            "tour-overlay"
        );


    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "tour-overlay";

        overlay.className =
            "tour-overlay";

        document.body.appendChild(
            overlay
        );

    }


    const target =
        step.selector
            ? document.querySelector(
                step.selector
            )
            : null;


    overlay.classList.toggle(
        "tour-overlay-dimmed",
        !target
    );


    const isLast =
        AppState.tourStepIndex ===
        TOUR_STEPS.length - 1;


    const stepLabel =
        `${AppState.tourStepIndex + 1} / ${TOUR_STEPS.length}`;


    const nextLabel =
        isLast
            ? "Terminer"
            : "Suivant →";


    overlay.innerHTML = `

        ${
            target
                ? '<div class="tour-spotlight" id="tour-spotlight"></div>'
                : ""
        }

        <div
            class="tour-card${
                target
                    ? ""
                    : " tour-card-centered"
            }"
            id="tour-card"
        >

            <div class="tour-card-step">
                ${stepLabel}
            </div>

            <h3>
                ${step.title}
            </h3>

            <p>
                ${step.text}
            </p>

            <div class="tour-card-actions">

                <button
                    type="button"
                    class="link-button"
                    data-action="tour-end"
                >
                    Passer
                </button>

                <button
                    type="button"
                    class="primary-button"
                    data-action="tour-next"
                >
                    ${nextLabel}
                </button>

            </div>

        </div>

    `;


    if (target) {

        target.scrollIntoView({
            block: "center"
        });


        requestAnimationFrame(
            () => {

                positionTourElements(
                    target
                );

            }
        );

    }

}


function positionTourElements(
    target
) {

    const spotlight =
        document.getElementById(
            "tour-spotlight"
        );

    const card =
        document.getElementById(
            "tour-card"
        );


    if (
        !spotlight ||
        !card ||
        !target
    ) {

        return;

    }


    const rect =
        target.getBoundingClientRect();


    const padding = 8;


    spotlight.style.top =
        `${rect.top - padding}px`;

    spotlight.style.left =
        `${rect.left - padding}px`;

    spotlight.style.width =
        `${rect.width + padding * 2}px`;

    spotlight.style.height =
        `${rect.height + padding * 2}px`;


    const cardRect =
        card.getBoundingClientRect();


    const spaceBelow =
        window.innerHeight -
        rect.bottom;


    let top;


    if (
        spaceBelow >
        cardRect.height + 40
    ) {

        top =
            rect.bottom + 20;

    } else if (
        rect.top >
        cardRect.height + 40
    ) {

        top =
            rect.top -
            cardRect.height -
            20;

    } else {

        top =
            Math.max(
                16,
                (window.innerHeight - cardRect.height) / 2
            );

    }


    let left =
        rect.left;


    const maxLeft =
        window.innerWidth -
        cardRect.width -
        16;


    left =
        Math.min(
            Math.max(
                16,
                left
            ),
            Math.max(
                16,
                maxLeft
            )
        );


    card.style.top =
        `${top}px`;

    card.style.left =
        `${left}px`;

}


/* ======================================================
   ACCUEIL
   ====================================================== */

function renderHome() {

    const statistics =
        RevisionEngine.getStatistics();


    const todayReviews =
        RevisionEngine.getTodayRevisions();


    const lateReviews =
        RevisionEngine.getLateRevisions();


    return `

        <section class="view home-view">

            <div class="page-title">

                <div>

                    <h2>
                        Bonjour 👋
                    </h2>

                    <p>
                        Voici ce que tu dois réviser aujourd'hui.
                    </p>

                </div>

                <button
                    class="primary-button"
                    data-action="add-chapter"
                >
                    + Ajouter un chapitre
                </button>

            </div>


            <div class="stats-grid">

                <article class="stat-card">

                    <span>
                        📚 Chapitres
                    </span>

                    <strong>
                        ${statistics.chapters}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        🧠 Aujourd'hui
                    </span>

                    <strong>
                        ${statistics.todayReviews}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        ⚠️ En retard
                    </span>

                    <strong>
                        ${statistics.lateReviews}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        📈 Progression
                    </span>

                    <strong>
                        ${statistics.completionRate}%
                    </strong>

                </article>

            </div>


            <section class="content-section">

                <div class="section-header">

                    <h3>
                        Révisions du jour
                    </h3>

                    <button
                        type="button"
                        data-view="agenda"
                    >
                        Voir l'agenda →
                    </button>

                </div>


                ${
                    todayReviews.length === 0
                        ? renderEmptyState(
                            "🎉",
                            "Aucune révision aujourd'hui",
                            "Tu es à jour !"
                        )
                        : todayReviews
                            .map(
                                renderReviewCard
                            )
                            .join("")
                }

            </section>


            ${
                lateReviews.length > 0
                    ? `

                        <section class="content-section">

                            <div class="section-header">

                                <h3>
                                    ⚠️ Révisions en retard
                                </h3>

                            </div>

                            ${
                                lateReviews
                                    .map(
                                        renderReviewCard
                                    )
                                    .join("")
                            }

                        </section>

                    `
                    : ""
            }

        </section>

    `;

}


/* ======================================================
   CHAPITRES
   ====================================================== */

function renderChapters() {

    const chapters =
        Database.getChapters();


    return `

        <section class="view chapters-view">

            <div class="page-title">

                <div>

                    <h2>
                        Mes chapitres
                    </h2>

                    <p>
                        ${chapters.length}
                        chapitre${chapters.length > 1 ? "s" : ""}
                    </p>

                </div>

                <button
                    class="primary-button"
                    data-action="add-chapter"
                >
                    + Ajouter un chapitre
                </button>

            </div>


            <div class="chapters-list">

                ${
                    chapters.length === 0

                        ? renderEmptyState(
                            "📚",
                            "Aucun chapitre",
                            "Commence par ajouter ton premier chapitre."
                        )

                        : chapters
                            .map(
                                renderChapterCard
                            )
                            .join("")
                }

            </div>

        </section>

    `;

}


/* ======================================================
   MAÎTRISE (ÉTOILES)
   ====================================================== */

/*
 * Rangée d'étoiles cliquables pour noter
 * un chapitre directement depuis sa carte,
 * sans ouvrir de formulaire.
 *
 * Cliquer sur l'étoile déjà active la fait
 * redescendre d'un cran (pratique pour
 * corriger ou remettre à zéro).
 */

function renderStarRating(
    chapterId,
    mastery
) {

    const current =
        mastery || 0;


    const stars =
        [1, 2, 3, 4, 5]
            .map(
                value => `

                    <button
                        type="button"
                        class="star-button${
                            value <= current
                                ? " star-filled"
                                : ""
                        }"
                        data-action="set-mastery"
                        data-id="${escapeAttribute(chapterId)}"
                        data-value="${value}"
                        title="${value} étoile${value > 1 ? "s" : ""} de maîtrise"
                    >
                        ${value <= current ? "★" : "☆"}
                    </button>

                `
            )
            .join("");


    return `

        <div class="star-rating" data-id="${escapeAttribute(chapterId)}">

            ${stars}

            <span class="star-rating-label">
                ${
                    current > 0
                        ? current + "/5"
                        : "Non noté"
                }
            </span>

        </div>

    `;

}


/*
 * Version non cliquable des étoiles,
 * utilisée pour afficher une moyenne
 * (ex : moyenne d'une matière), avec
 * arrondi à l'entier le plus proche.
 */

function renderStaticStars(
    average
) {

    const rounded =
        Math.round(
            average || 0
        );


    return [1, 2, 3, 4, 5]
        .map(
            value =>
                value <= rounded
                    ? "★"
                    : "☆"
        )
        .join("");

}


function setChapterMasteryFromUI(
    chapterId,
    value
) {

    const chapter =
        Database.getChapter(
            chapterId
        );


    if (!chapter) {

        return;

    }


    const current =
        chapter.mastery || 0;


    const requested =
        Number(value) || 0;


    /*
     * Cliquer sur l'étoile déjà active
     * fait redescendre la note d'un cran.
     */

    const newValue =
        current === requested
            ? requested - 1
            : requested;


    Database.updateChapterMastery(
        chapterId,
        newValue
    );


    renderApp();

}


function renderChapterCard(
    chapter
) {

    const progress =
        RevisionEngine
            .getChapterProgress(
                chapter
            );


    const reviews =
        Database
            .getChapterReviews(
                chapter.id
            );


    const subject =
        chapter.subjectId
            ? Database.getSubject(
                chapter.subjectId
            )
            : null;


    const nextReview =
        reviews
            .filter(
                review =>
                    !review.completed
            )
            .sort(
                (a, b) =>
                    a.scheduledDate.localeCompare(
                        b.scheduledDate
                    )
            )[0];


    return `

        <article
            class="chapter-card"
            data-id="${escapeHtml(chapter.id)}"
        >

            <div class="chapter-card-main">

                <div class="chapter-card-title-block">

                    <button
                        type="button"
                        class="chapter-card-title-button"
                        data-action="open-chapter-agenda"
                        data-id="${escapeAttribute(
                            chapter.id
                        )}"
                        title="Voir ce chapitre dans l'agenda"
                    >
                        <h3>
                            ${escapeHtml(
                                chapter.title
                            )}
                        </h3>
                    </button>

                    <button
                        type="button"
                        class="chapter-subject"
                        data-action="open-subject-agenda"
                        data-id="${escapeAttribute(
                            subject ? subject.id : ""
                        )}"
                        ${subject ? "" : "disabled"}
                    >

                        <span
                            class="chapter-subject-dot"
                            style="background:${escapeAttribute(
                                subject
                                    ? subject.color
                                    : "#9ca3af"
                            )};"
                        ></span>

                        ${escapeHtml(
                            subject
                                ? subject.name
                                : "Sans matière"
                        )}

                    </button>

                </div>


                <div class="chapter-progress">

                    <strong>
                        ${progress}%
                    </strong>

                    <div class="progress-bar">

                        <div
                            class="progress-bar-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>

            </div>


            ${renderStarRating(
                chapter.id,
                chapter.mastery
            )}


            <div class="chapter-card-info">

                <span>
                    ${reviews.filter(
                        review =>
                            review.completed
                    ).length}
                    / ${reviews.length}
                    révisions
                </span>

                ${
                    nextReview
                        ? `
                            <span>
                                Prochaine :
                                ${formatDisplayDate(
                                    nextReview.scheduledDate
                                )}
                            </span>
                        `
                        : `
                            <span>
                                Terminé 🎉
                            </span>
                        `
                }

            </div>


            <div class="chapter-card-actions">

                <button
                    type="button"
                    data-action="open-chapter-agenda"
                    data-id="${escapeHtml(chapter.id)}"
                >
                    📅 Voir dans l'agenda
                </button>

                <button
                    type="button"
                    data-action="edit-chapter"
                    data-id="${escapeHtml(chapter.id)}"
                >
                    Modifier
                </button>

                <button
                    type="button"
                    data-action="shift-chapter"
                    data-id="${escapeHtml(chapter.id)}"
                    title="Décaler les révisions à venir de ce chapitre"
                >
                    🔀 Décaler
                </button>

                <button
                    type="button"
                    data-action="delete-chapter"
                    data-id="${escapeHtml(chapter.id)}"
                >
                    Supprimer
                </button>

            </div>

        </article>

    `;

}


/* ======================================================
   DÉCALER LES RÉVISIONS D'UN CHAPITRE
   ====================================================== */

function openShiftChapterForm(
    chapterId
) {

    const chapter =
        Database.getChapter(
            chapterId
        );


    if (!chapter) {

        return;

    }


    const pendingCount =
        Database
            .getChapterReviews(
                chapterId
            )
            .filter(
                review =>
                    !review.completed
            ).length;


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    Décaler « ${escapeHtml(chapter.title)} »
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="shift-chapter-form"
                class="chapter-form"
            >

                <input
                    type="hidden"
                    name="chapterId"
                    value="${escapeAttribute(chapterId)}"
                >

                <div class="info-box">

                    ${
                        pendingCount > 0
                            ? `
                                🧠 ${pendingCount}
                                révision${pendingCount > 1 ? "s" : ""}
                                à venir seront décalées.
                                Les révisions déjà faites ne bougent pas.
                            `
                            : `
                                🎉 Ce chapitre n'a plus de
                                révision à venir.
                            `
                    }

                </div>


                <label>

                    <span>
                        Décaler de combien de jours ?
                    </span>

                    <input
                        type="number"
                        id="shift-days-input"
                        name="days"
                        value="1"
                        step="1"
                    >

                </label>


                <div class="shift-quick-buttons">

                    <button
                        type="button"
                        data-shift-preset="-7"
                    >
                        -7 j
                    </button>

                    <button
                        type="button"
                        data-shift-preset="-1"
                    >
                        -1 j
                    </button>

                    <button
                        type="button"
                        data-shift-preset="1"
                    >
                        +1 j
                    </button>

                    <button
                        type="button"
                        data-shift-preset="3"
                    >
                        +3 j
                    </button>

                    <button
                        type="button"
                        data-shift-preset="7"
                    >
                        +7 j
                    </button>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                        ${pendingCount === 0 ? "disabled" : ""}
                    >
                        Décaler
                    </button>

                </div>

            </form>

        </div>

    `);


    const daysInput =
        document.getElementById(
            "shift-days-input"
        );


    document
        .querySelectorAll(
            "[data-shift-preset]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (daysInput) {

                            daysInput.value =
                                button.dataset
                                    .shiftPreset;

                        }

                    }
                );

            }
        );

}


function shiftChapterFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const chapterId =
        String(
            formData.get("chapterId") || ""
        );


    const days =
        parseInt(
            formData.get("days"),
            10
        );


    if (
        !chapterId ||
        Number.isNaN(days) ||
        days === 0
    ) {

        closeModal();

        return;

    }


    Database.shiftChapterReviews(
        chapterId,
        days
    );


    closeModal();

    renderApp();

}


/* ======================================================
   MATIÈRES
   ====================================================== */

const SUBJECT_COLOR_PRESETS = [
    "#4f46e5",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6"
];


function renderSubjects() {

    const subjects =
        Database.getSubjects();


    return `

        <section class="view subjects-view">

            <div class="page-title">

                <div>

                    <h2>
                        Mes matières
                    </h2>

                    <p>
                        ${subjects.length}
                        matière${subjects.length > 1 ? "s" : ""}
                    </p>

                </div>

                <button
                    class="primary-button"
                    data-action="add-subject"
                >
                    + Ajouter une matière
                </button>

            </div>


            <div class="subjects-list">

                ${
                    subjects.length === 0

                        ? renderEmptyState(
                            "🎨",
                            "Aucune matière",
                            "Crée une matière et choisis-lui une couleur avant d'ajouter tes chapitres."
                        )

                        : subjects
                            .map(
                                renderSubjectCard
                            )
                            .join("")
                }

            </div>

        </section>

    `;

}


function renderSubjectCard(
    subject
) {

    const chapters =
        Database.getSubjectChapters(
            subject.id
        );


    const mastery =
        Database.getSubjectMasteryAverage(
            subject.id
        );


    return `

        <article
            class="subject-card"
            data-id="${escapeHtml(subject.id)}"
        >

            <button
                type="button"
                class="subject-card-main"
                data-action="open-subject-agenda"
                data-id="${escapeAttribute(subject.id)}"
                title="Voir les J de cette matière dans l'agenda"
            >

                <span
                    class="subject-color-dot"
                    style="background:${escapeAttribute(subject.color)};"
                ></span>

                <div>

                    <h3>
                        ${escapeHtml(subject.name)}
                    </h3>

                    <span>
                        ${chapters.length}
                        chapitre${chapters.length > 1 ? "s" : ""}
                        · 📅 Voir dans l'agenda
                    </span>

                    <span class="subject-mastery">

                        ${
                            mastery.average === null
                                ? `
                                    <span class="subject-mastery-empty">
                                        ☆☆☆☆☆ Pas encore noté
                                    </span>
                                `
                                : `
                                    <span class="subject-mastery-stars">
                                        ${renderStaticStars(mastery.average)}
                                    </span>
                                    <span>
                                        ${mastery.average.toFixed(1)}/5
                                        (${mastery.ratedCount}/${mastery.totalCount}
                                        chapitre${mastery.totalCount > 1 ? "s" : ""}
                                        noté${mastery.ratedCount > 1 ? "s" : ""})
                                    </span>
                                `
                        }

                    </span>

                </div>

            </button>


            <div class="subject-card-actions">

                <button
                    type="button"
                    data-action="edit-subject"
                    data-id="${escapeHtml(subject.id)}"
                >
                    Modifier
                </button>

                <button
                    type="button"
                    data-action="delete-subject"
                    data-id="${escapeHtml(subject.id)}"
                >
                    Supprimer
                </button>

            </div>

        </article>

    `;

}


function openSubjectForm(
    subject = null
) {

    AppState.editingSubjectId =
        subject
            ? subject.id
            : null;


    const title =
        subject
            ? "Modifier la matière"
            : "Ajouter une matière";


    const currentColor =
        subject
            ? subject.color || "#4f46e5"
            : SUBJECT_COLOR_PRESETS[
                Database.getSubjects().length %
                SUBJECT_COLOR_PRESETS.length
            ];


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    ${title}
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="subject-form"
                class="subject-form"
            >

                <label>

                    <span>
                        Nom de la matière *
                    </span>

                    <input
                        type="text"
                        name="name"
                        required
                        value="${
                            subject
                                ? escapeAttribute(subject.name)
                                : ""
                        }"
                        placeholder="Ex : Médecine"
                    >

                </label>


                <label>
                    <span>Couleur de la matière</span>

                    <div class="color-picker-row">

                        <input
                            type="color"
                            id="subject-color"
                            name="color"
                            value="${escapeAttribute(currentColor)}"
                        >

                        <span
                            id="subject-color-preview"
                            class="chapter-color-preview"
                            style="background: ${escapeAttribute(currentColor)};"
                        ></span>

                        <span
                            id="subject-color-value"
                            class="chapter-color-value"
                        >
                            ${escapeHtml(currentColor)}
                        </span>

                        <button
                            type="button"
                            class="secondary-button"
                            data-action="apply-subject-color"
                        >
                            ✓ Appliquer
                        </button>

                    </div>

                    <div class="color-presets">

                        ${
                            SUBJECT_COLOR_PRESETS
                                .map(
                                    presetColor => `
                                        <button
                                            type="button"
                                            class="color-preset-swatch"
                                            data-preset-color="${presetColor}"
                                            style="background:${presetColor};"
                                        ></button>
                                    `
                                )
                                .join("")
                        }

                    </div>

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${
                            subject
                                ? "Enregistrer"
                                : "Créer la matière"
                        }
                    </button>

                </div>

            </form>

        </div>

    `);

    setupColorPicker(
        "subject-color",
        "subject-color-preview",
        "subject-color-value"
    );

}


/**
 * Applique immédiatement la couleur choisie à la
 * matière en cours d'édition (sans attendre le
 * bouton "Enregistrer" du formulaire). Si la matière
 * est en cours de création (pas encore enregistrée),
 * on se contente de confirmer l'aperçu.
 */

function applySubjectColorFromUI() {

    const colorInput =
        document.getElementById(
            "subject-color"
        );


    if (!colorInput) {

        return;

    }


    const color =
        colorInput.value;


    if (AppState.editingSubjectId) {

        Database.updateSubject(
            AppState.editingSubjectId,
            { color }
        );

        renderApp();

        showToast(
            "✓ Couleur appliquée"
        );

    } else {

        showToast(
            "✓ Couleur choisie — clique sur " +
            "\"Créer la matière\" pour valider."
        );

    }

}


function saveSubjectFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const name =
        String(
            formData.get("name") || ""
        ).trim();


    const color =
        String(
            formData.get("color") || "#4f46e5"
        );


    if (!name) {

        return;

    }


    if (
        AppState.editingSubjectId
    ) {

        Database.updateSubject(

            AppState.editingSubjectId,

            {
                name,
                color
            }

        );

        AppState.editingSubjectId =
            null;

    } else {

        Database.addSubject({
            name,
            color
        });

    }


    closeModal();

    renderApp();

}


function editSubject(
    subjectId
) {

    const subject =
        Database.getSubject(
            subjectId
        );


    if (!subject) {

        return;

    }


    openSubjectForm(
        subject
    );

}


function deleteSubjectFromUI(
    subjectId
) {

    const subject =
        Database.getSubject(
            subjectId
        );


    if (!subject) {

        return;

    }


    const confirmed =
        window.confirm(

            `Supprimer la matière "${subject.name}" ?\n\n` +
            "Les chapitres liés ne seront pas supprimés, " +
            "mais n'auront plus de matière associée."

        );


    if (!confirmed) {

        return;

    }


    Database.deleteSubject(
        subjectId
    );


    if (
        AppState.agendaFilter.type === "subject" &&
        AppState.agendaFilter.value === subjectId
    ) {

        clearAgendaFilter();

    }


    renderApp();

}


/* ======================================================
   FORMULAIRE CHAPITRE
   ====================================================== */

function openChapterForm(
    chapter = null
) {

    AppState.editingChapterId =
        chapter
            ? chapter.id
            : null;


    const title =
        chapter
            ? "Modifier le chapitre"
            : "Ajouter un chapitre";


    const subjects =
        Database.getSubjects();


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    ${title}
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="chapter-form"
                class="chapter-form"
            >

                <label>

                    <span>
                        Nom du chapitre *
                    </span>

                    <input
                        type="text"
                        name="title"
                        required
                        value="${
                            chapter
                                ? escapeAttribute(
                                    chapter.title
                                )
                                : ""
                        }"
                        placeholder="Ex : Système endocrinien"
                    >

                </label>


                <label>

                    <span>
                        Matière
                    </span>

                    ${
                        subjects.length === 0
                            ? `
                                <div class="info-box">
                                    Tu n'as pas encore de matière.
                                    <button
                                        type="button"
                                        class="link-button"
                                        data-action="close-modal-and-add-subject"
                                    >
                                        Créer une matière
                                    </button>
                                    pour lui choisir une couleur.
                                </div>
                            `
                            : `
                                <select name="subjectId">

                                    <option value="">
                                        Sans matière
                                    </option>

                                    ${
                                        subjects
                                            .map(
                                                subjectOption => `
                                                    <option
                                                        value="${escapeAttribute(subjectOption.id)}"
                                                        ${
                                                            chapter &&
                                                            chapter.subjectId === subjectOption.id
                                                                ? "selected"
                                                                : ""
                                                        }
                                                    >
                                                        ${escapeHtml(subjectOption.name)}
                                                    </option>
                                                `
                                            )
                                            .join("")
                                    }

                                </select>

                                <button
                                    type="button"
                                    class="link-button"
                                    data-action="close-modal-and-add-subject"
                                >
                                    + Nouvelle matière
                                </button>
                            `
                    }

                </label>


                <label>

                    <span>
                        Description
                    </span>

                    <textarea
                        name="description"
                        rows="4"
                        placeholder="Notes ou informations complémentaires..."
                    >${
                        chapter
                            ? escapeHtml(
                                chapter.description
                            )
                            : ""
                    }</textarea>

                </label>


                ${
                    chapter
                        ? ""
                        : `
                            <label>

                                <span>
                                    Liste de J à appliquer
                                </span>

                                <p class="field-help-text">
                                    Choisis une liste de J déjà
                                    enregistrée, ou crée-en une nouvelle
                                    juste en dessous. Ton dernier choix
                                    reste sélectionné par défaut la
                                    prochaine fois.
                                </p>

                                <select
                                    name="intervalPresetChoice"
                                    id="interval-preset-select"
                                >

                                    <option
                                        value="default"
                                        ${
                                            getLastIntervalPresetChoice() === "default"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Par défaut
                                        (J0 · J1 · J3 · J7 · J15 · J30 · J45)
                                    </option>

                                    ${
                                        Database
                                            .getIntervalPresets()
                                            .map(
                                                preset => `
                                                    <option
                                                        value="${escapeAttribute(preset.id)}"
                                                        ${
                                                            getLastIntervalPresetChoice() === preset.id
                                                                ? "selected"
                                                                : ""
                                                        }
                                                    >
                                                        📋 ${escapeHtml(preset.name)}
                                                        (J${preset.intervals.join(" · J")})
                                                    </option>
                                                `
                                            )
                                            .join("")
                                    }

                                    <option
                                        value="custom"
                                        ${
                                            getLastIntervalPresetChoice() === "custom"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ➕ Créer une nouvelle liste de J...
                                    </option>

                                </select>

                            </label>


                            <div
                                class="chapter-interval-fields"
                                id="interval-preset-custom-fields"
                                ${
                                    getLastIntervalPresetChoice() === "custom"
                                        ? ""
                                        : "hidden"
                                }
                            >

                                <p class="field-help-text">
                                    ✏️ Nouvelle liste de J : donne-lui un
                                    nom et choisis ses intervalles. Une
                                    fois enregistrée, elle sera proposée
                                    dans la liste ci-dessus pour tous
                                    tes prochains chapitres.
                                </p>

                                <label>

                                    <span>
                                        Nom de cette nouvelle liste de J
                                    </span>

                                    <input
                                        type="text"
                                        name="customIntervalName"
                                        placeholder="Ex : Rapide, J-5..."
                                    >

                                </label>

                                <label>

                                    <span>
                                        Intervalles (en jours, séparés
                                        par des virgules)
                                    </span>

                                    <input
                                        type="text"
                                        name="customIntervals"
                                        value="${DEFAULT_REVISION_INTERVALS.join(", ")}"
                                    >

                                </label>

                                <label class="chapter-interval-save-toggle">

                                    <input
                                        type="checkbox"
                                        name="saveIntervalPreset"
                                        checked
                                    >

                                    <span>
                                        Enregistrer cette liste de J pour
                                        la réutiliser plus tard
                                    </span>

                                </label>

                                <p class="discovery-interval-caption">
                                    Le premier chiffre doit être 0
                                    (jour de la première révision).
                                </p>

                            </div>
                        `
                }


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${
                            chapter
                                ? "Enregistrer"
                                : "Créer le chapitre"
                        }
                    </button>

                </div>

            </form>

        </div>

    `);
}

/**
 * Détermine quel roulement de J utiliser à la
 * création d'un chapitre, selon le choix fait
 * dans le menu déroulant :
 *
 * - "default" → roulement par défaut
 * - "custom"  → nouvel intervalle saisi, sauvegardé
 *               comme préréglage réutilisable si
 *               la case correspondante est cochée
 * - un id     → un préréglage déjà enregistré
 */

function resolveChapterIntervals(
    intervalPresetChoice,
    formData
) {

    if (
        intervalPresetChoice === "custom"
    ) {

        const rawIntervals =
            String(
                formData.get(
                    "customIntervals"
                ) || ""
            ).trim();


        const parsedIntervals =
            parseCustomIntervals(
                rawIntervals
            ) ||
            DEFAULT_REVISION_INTERVALS;


        const presetName =
            String(
                formData.get(
                    "customIntervalName"
                ) || ""
            ).trim();


        const shouldSave =
            formData.get(
                "saveIntervalPreset"
            ) === "on";


        if (
            shouldSave &&
            presetName
        ) {

            const savedPreset =
                Database.addIntervalPreset({
                    name: presetName,
                    intervals: parsedIntervals
                });

            /*
             * Cette nouvelle liste de J devient le
             * choix par défaut proposé la prochaine
             * fois : elle reste "sélectionnée".
             */

            setLastIntervalPresetChoice(
                savedPreset?.id || "default"
            );

        } else {

            setLastIntervalPresetChoice(
                "custom"
            );

        }


        return parsedIntervals;

    }


    if (
        intervalPresetChoice !== "default"
    ) {

        const preset =
            Database.getIntervalPreset(
                intervalPresetChoice
            );


        if (
            preset &&
            preset.intervals?.length
        ) {

            /*
             * On garde cette liste de J sélectionnée
             * par défaut pour le prochain chapitre.
             */

            setLastIntervalPresetChoice(
                intervalPresetChoice
            );

            return preset.intervals;

        }

    }


    setLastIntervalPresetChoice(
        "default"
    );

    return DEFAULT_REVISION_INTERVALS;

}


/**
 * Dernière liste de J choisie par l'utilisateur
 * ("default", "custom", ou l'id d'une liste
 * enregistrée), utilisée pour pré-sélectionner
 * automatiquement ce choix au prochain chapitre.
 */

function getLastIntervalPresetChoice() {

    return (
        Database.getSettings()
            .lastIntervalPresetChoice ||
        "default"
    );

}


function setLastIntervalPresetChoice(
    choice
) {

    Database.updateSettings({
        lastIntervalPresetChoice:
            choice || "default"
    });

}


/**
 * Parse une chaîne "0, 1, 3, 7, 15" saisie par
 * l'utilisateur en un tableau d'intervalles valides.
 *
 * Retourne null si la saisie est vide, invalide,
 * ou ne commence pas par 0 — dans ce cas l'appelant
 * doit retomber sur le roulement par défaut.
 */

function parseCustomIntervals(
    rawValue
) {

    if (!rawValue) {

        return null;

    }


    const parsed =
        rawValue
            .split(",")
            .map(
                part =>
                    parseInt(
                        part.trim(),
                        10
                    )
            )
            .filter(
                n =>
                    Number.isInteger(n) &&
                    n >= 0
            );


    const unique =
        [...new Set(parsed)]
            .sort(
                (a, b) => a - b
            );


    if (
        unique.length === 0 ||
        unique[0] !== 0
    ) {

        return null;

    }


    return unique;

}


function setupColorPicker(
    colorInputId = "chapter-color",
    previewId = "chapter-color-preview",
    valueId = "chapter-color-value"
) {

    const colorInput =
        document.getElementById(
            colorInputId
        );

    const preview =
        document.getElementById(
            previewId
        );

    const value =
        document.getElementById(
            valueId
        );

    if (
        !colorInput ||
        !preview ||
        !value
    ) {
        return;
    }

    colorInput.addEventListener(
        "input",
        () => {

            preview.style.backgroundColor =
                colorInput.value;

            value.textContent =
                colorInput.value;

        }
    );
}

function saveChapterFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const title =
        String(
            formData.get(
                "title"
            ) || ""
        ).trim();


    const subjectId =
        String(
            formData.get(
                "subjectId"
            ) || ""
        ).trim() || null;


    const description =
        String(
            formData.get(
                "description"
            ) || ""
        ).trim();


    if (!title) {

        return;

    }


    /*
     * MODIFICATION
     */

    if (
        AppState.editingChapterId
    ) {

        Database.updateChapter(

    AppState.editingChapterId,

    {

        title,
        subjectId,
        description

    }

);


        AppState.editingChapterId =
            null;


        closeModal();

        renderApp();

        return;

    }


    /*
     * CRÉATION
     */

    const chapter =
        Database.addChapter({

            title,
            subjectId,
            description

        });


    const intervalPresetChoice =
        String(
            formData.get(
                "intervalPresetChoice"
            ) || "default"
        ).trim();


    const resolvedIntervals =
        resolveChapterIntervals(
            intervalPresetChoice,
            formData
        );


    /*
     * Création automatique
     * des révisions, avec le
     * roulement résolu ci-dessus
     * (par défaut, préréglage
     * choisi, ou personnalisé).
     */

    RevisionEngine
        .createChapterReviews(
            chapter.id,
            new Date(),
            resolvedIntervals
        );


    closeModal();

    renderApp();

}


/* ======================================================
   MODIFICATION
   ====================================================== */

function editChapter(
    chapterId
) {

    const chapter =
        Database.getChapter(
            chapterId
        );


    if (!chapter) {

        return;

    }


    openChapterForm(
        chapter
    );

}


/* ======================================================
   SUPPRESSION
   ====================================================== */

function deleteChapterFromUI(
    chapterId
) {

    const chapter =
        Database.getChapter(
            chapterId
        );


    if (!chapter) {

        return;

    }


    const confirmed =
        window.confirm(

            `Supprimer le chapitre "${chapter.title}" ?\n\n` +
            "Toutes ses révisions seront également supprimées."

        );


    if (!confirmed) {

        return;

    }


    Database.deleteChapter(
        chapterId
    );


    renderApp();

}


/* ======================================================
   RÉVISIONS
   ====================================================== */

function renderReviewCard(
    review,
    agendaMode = false
) {

    const completed =
        review.completed;


    const chapter =
        Database.getChapter(
            review.chapterId
        );


    const subject =
        chapter && chapter.subjectId
            ? Database.getSubject(
                chapter.subjectId
            )
            : null;


    const subjectColor =
        getChapterColor(
            chapter
        );


    return `

        <article
            class="
                review-card
                ${completed ? "completed" : ""}
                ${agendaMode ? "agenda-review-card" : ""}
            "
        >

            <div class="review-card-date">

                <strong>
                    J${review.j}
                </strong>

                <span>
                    ${formatDisplayDate(
                        review.scheduledDate
                    )}
                </span>

            </div>


            <div class="review-card-content">

                ${
                    agendaMode
                        ? `

                            <button
                                type="button"
                                class="agenda-filter-chapter"
                                data-action="filter-chapter"
                                data-id="${escapeAttribute(
                                    review.chapterId
                                )}"
                            >

                                <span
                                    class="agenda-review-color"
                                    style="background:${escapeAttribute(
                                        subjectColor
                                    )}"
                                ></span>

                                <h4>
                                    ${escapeHtml(
                                        review.chapterTitle ||
                                        getChapterTitle(
                                            review.chapterId
                                        )
                                    )}
                                </h4>

                            </button>

                        `
                        : `

                            <h4>
                                ${escapeHtml(
                                    review.chapterTitle ||
                                    getChapterTitle(
                                        review.chapterId
                                    )
                                )}
                            </h4>

                        `
                }


                ${
                    subject
                        ? `

                            ${
                                agendaMode
                                    ? `

                                        <button
                                            type="button"
                                            class="agenda-filter-subject"
                                            data-action="filter-subject"
                                            data-subject-id="${escapeAttribute(
                                                subject.id
                                            )}"
                                        >
                                            <span
                                                class="agenda-review-color"
                                                style="background:${escapeAttribute(
                                                    subject.color
                                                )}"
                                            ></span>
                                            ${escapeHtml(
                                                subject.name
                                            )}
                                        </button>

                                    `
                                    : `

                                        <span>
                                            ${escapeHtml(
                                                subject.name
                                            )}
                                        </span>

                                    `
                            }

                        `
                        : ""
                }

            </div>


            <div class="review-card-action">

                ${
                    completed

                        ? `

                            <span class="review-badge-done">
                                ✓ Révisé
                            </span>

                            <button
                                type="button"
                                data-action="uncomplete-review"
                                data-id="${escapeHtml(review.id)}"
                            >
                                ↩ Annuler
                            </button>

                        `

                        : `

                            <button
                                type="button"
                                class="icon-button"
                                data-action="reschedule-review"
                                data-id="${escapeHtml(review.id)}"
                                title="Déplacer cette révision à une autre date"
                            >
                                🗓️
                            </button>

                            <button
                                type="button"
                                class="primary-button"
                                data-action="complete-review"
                                data-id="${escapeHtml(review.id)}"
                            >
                                ✓ Révisé
                            </button>

                        `
                }

            </div>

        </article>

    `;
}


function completeReviewFromUI(
    reviewId
) {

    const result =
        RevisionEngine
            .completeRevision(
                reviewId
            );


    if (!result) {

        console.error(
            "Impossible de terminer la révision."
        );

        return;

    }


    renderApp();

}


function uncompleteReviewFromUI(
    reviewId
) {

    RevisionEngine
        .uncompleteRevision(
            reviewId
        );


    renderApp();

}


/* ======================================================
   POMODORO
   ====================================================== */

function renderPomodoro() {

    const pendingReviews = [
        ...RevisionEngine.getTodayRevisions(),
        ...RevisionEngine.getLateRevisions()
    ];


    /*
     * On enlève d'éventuels doublons (une révision
     * en retard ne devrait pas aussi être "du jour",
     * mais on sécurise quand même).
     */

    const seenIds = new Set();

    const reviews =
        pendingReviews.filter(
            review => {

                if (seenIds.has(review.id)) {

                    return false;

                }


                seenIds.add(review.id);

                return true;

            }
        );


    const session =
        AppState.pomodoro;


    return `

        <section class="view pomodoro-view">

            <div class="page-title">

                <div>

                    <h2>
                        🍅 Pomodoro
                    </h2>

                    <p>
                        Lance une session sur un chapitre. Dès que
                        le pomodoro est terminé, ton J est
                        automatiquement marqué comme révisé.
                    </p>

                </div>

            </div>

            ${
                session.phase !== "idle"
                    ? renderPomodoroSession()
                    : renderFreePomodoroLauncher()
            }

            <section class="content-section">

                <h3>
                    Tes J du jour
                </h3>

                ${
                    reviews.length === 0
                        ? renderEmptyState(
                            "🎉",
                            "Rien à réviser",
                            "Aucun J à faire aujourd'hui ou en retard."
                        )
                        : `
                            <div class="pomodoro-review-list">

                                ${
                                    reviews
                                        .map(
                                            renderPomodoroReviewItem
                                        )
                                        .join("")
                                }

                            </div>
                        `
                }

            </section>

        </section>

    `;

}


function renderPomodoroReviewItem(
    review
) {

    const chapter =
        Database.getChapter(
            review.chapterId
        );


    const color =
        getChapterColor(
            chapter
        );


    const session =
        AppState.pomodoro;


    const isCurrent =
        session.reviewId === review.id;


    const isLate =
        review.scheduledDate <
        RevisionEngine.todayKey();


    return `

        <div class="pomodoro-review-item${isCurrent ? " pomodoro-review-item-active" : ""}">

            <span
                class="schedule-block-dot"
                style="background:${escapeAttribute(color)};"
            ></span>

            <div class="pomodoro-review-info">

                <strong>
                    ${escapeHtml(review.chapterTitle || "Chapitre")}
                </strong>

                <span>
                    J${escapeHtml(String(review.j))}
                    ${
                        isLate
                            ? "· en retard"
                            : "· aujourd'hui"
                    }
                </span>

            </div>

            ${
                isCurrent
                    ? `
                        <span class="pomodoro-review-badge">
                            ⏳ En cours
                        </span>
                    `
                    : `
                        <button
                            type="button"
                            class="primary-button"
                            data-action="start-pomodoro"
                            data-id="${escapeAttribute(review.id)}"
                            ${
                                session.phase !== "idle"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ▶️ Lancer
                        </button>
                    `
            }

        </div>

    `;

}


function renderPomodoroSession() {

    const session =
        AppState.pomodoro;


    const totalSeconds =
        session.totalSeconds ||
        1;


    const progress =
        Math.min(
            100,
            Math.round(
                ((totalSeconds - session.secondsLeft) /
                    totalSeconds) * 100
            )
        );


    const isFreeSession =
        session.phase === "work" &&
        !session.reviewId;


    const loopLabel =
        session.totalLoops > 0
            ? "Boucle " +
                (session.loopsCompleted + 1) +
                " / " +
                session.totalLoops
            : "Boucle " +
                (session.loopsCompleted + 1) +
                " (illimité)";


    return `

        <section class="content-section pomodoro-session">

            <div class="pomodoro-session-phase">
                ${
                    session.phase === "break"
                        ? "☕ Pause"
                        : "🍅 Session de travail"
                }
            </div>

            <h3 class="pomodoro-session-chapter">
                ${escapeHtml(session.chapterTitle)}
            </h3>

            <div class="pomodoro-session-loop">
                🔁 ${escapeHtml(loopLabel)}
            </div>

            <div
                class="pomodoro-timer"
                id="pomodoro-timer-display"
            >
                ${formatSecondsAsClock(session.secondsLeft)}
            </div>

            <div class="pomodoro-progress">

                <div
                    class="pomodoro-progress-fill"
                    id="pomodoro-progress-fill"
                    style="width:${progress}%"
                ></div>

            </div>

            <div class="pomodoro-session-actions">

                ${
                    session.running
                        ? `
                            <button
                                type="button"
                                class="secondary-button"
                                data-action="pause-pomodoro"
                            >
                                ⏸️ Pause
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="primary-button"
                                data-action="resume-pomodoro"
                            >
                                ▶️ Reprendre
                            </button>
                        `
                }

                ${
                    session.phase === "break"
                        ? `
                            <button
                                type="button"
                                class="secondary-button"
                                data-action="skip-pomodoro-break"
                            >
                                ⏭️ Passer la pause
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="secondary-button"
                                data-action="complete-pomodoro-now"
                            >
                                ✓ ${
                                    isFreeSession
                                        ? "Terminer maintenant"
                                        : "Marquer révisé maintenant"
                                }
                            </button>
                        `
                }

                <button
                    type="button"
                    class="link-button"
                    data-action="stop-pomodoro"
                >
                    ✕ Arrêter la session
                </button>

            </div>

        </section>

    `;

}


function formatSecondsAsClock(
    seconds
) {

    const safeSeconds =
        Math.max(
            0,
            Math.round(seconds)
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const remaining =
        safeSeconds % 60;


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );

}


function renderFreePomodoroLauncher() {

    const chapters =
        Database
            .getChapters()
            .slice()
            .sort(
                (a, b) =>
                    a.title.localeCompare(
                        b.title
                    )
            );


    return `

        <section class="content-section pomodoro-free-launcher">

            <h3>
                🎯 Pomodoro libre
            </h3>

            <p>
                Pas de J prévu aujourd'hui, ou envie de bosser
                autre chose ? Lance un pomodoro libre, avec ou
                sans chapitre associé.
            </p>

            <div class="pomodoro-free-form">

                <select id="pomodoro-free-chapter-select">

                    <option value="">
                        Sans chapitre (session libre)
                    </option>

                    ${
                        chapters
                            .map(
                                chapter => `
                                    <option value="${escapeAttribute(chapter.id)}">
                                        ${escapeHtml(chapter.title)}
                                    </option>
                                `
                            )
                            .join("")
                    }

                </select>

                <button
                    type="button"
                    class="primary-button"
                    data-action="start-free-pomodoro"
                >
                    ▶️ Lancer un pomodoro libre
                </button>

            </div>

        </section>

    `;

}


function startFreePomodoroFromUI() {

    const select =
        document.getElementById(
            "pomodoro-free-chapter-select"
        );


    const chapterId =
        select
            ? select.value
            : "";


    const chapter =
        chapterId
            ? Database.getChapter(
                chapterId
            )
            : null;


    startPomodoroSession({

        reviewId: null,

        chapterTitle:
            chapter
                ? chapter.title
                : "Session libre"

    });

}


function startPomodoroForReview(
    reviewId
) {

    const review =
        RevisionEngine
            .getEnrichedReviews()
            .find(
                item =>
                    item.id === reviewId
            );


    if (!review) {

        return;

    }


    startPomodoroSession({

        reviewId,

        chapterTitle:
            review.chapterTitle ||
            "Chapitre"

    });

}


/**
 * Démarre une session de travail Pomodoro.
 * reviewId peut être null (pomodoro libre,
 * sans J associé) : dans ce cas, aucune
 * révision ne sera marquée automatiquement.
 */

function startPomodoroSession(
    { reviewId, chapterTitle }
) {

    stopPomodoroTimerInterval();


    const workMinutes =
        Database.getSettings()
            .pomodoroWorkMinutes || 25;


    const totalSeconds =
        Math.max(
            60,
            Math.round(
                workMinutes * 60
            )
        );


    const totalLoops =
        Math.max(
            0,
            Math.round(
                Database.getSettings()
                    .pomodoroLoopCount || 0
            )
        );


    AppState.pomodoro = {

        reviewId:
            reviewId || null,

        chapterTitle:
            chapterTitle ||
            "Session libre",

        phase: "work",

        secondsLeft: totalSeconds,

        totalSeconds,

        running: true,

        intervalId: null,

        /*
         * 0 = boucles illimitées (par défaut).
         * Sinon, nombre de cycles
         * travail + pause avant arrêt automatique.
         */

        totalLoops,

        loopsCompleted: 0

    };


    renderApp();

    launchPomodoroTimerInterval();

}


function launchPomodoroTimerInterval() {

    stopPomodoroTimerInterval();


    AppState.pomodoro.intervalId =
        setInterval(
            tickPomodoro,
            1000
        );

}


function stopPomodoroTimerInterval() {

    if (AppState.pomodoro.intervalId) {

        clearInterval(
            AppState.pomodoro.intervalId
        );

        AppState.pomodoro.intervalId =
            null;

    }

}


function tickPomodoro() {

    const session =
        AppState.pomodoro;


    if (
        session.phase === "idle" ||
        !session.running
    ) {

        return;

    }


    session.secondsLeft =
        Math.max(
            0,
            session.secondsLeft - 1
        );


    /*
     * Mise à jour directe du DOM plutôt qu'un
     * renderApp() complet chaque seconde, pour
     * ne pas saccader l'interface.
     */

    const display =
        document.getElementById(
            "pomodoro-timer-display"
        );

    const fill =
        document.getElementById(
            "pomodoro-progress-fill"
        );


    if (display) {

        display.textContent =
            formatSecondsAsClock(
                session.secondsLeft
            );

    }


    if (fill && session.totalSeconds) {

        const progress =
            Math.min(
                100,
                Math.round(
                    ((session.totalSeconds - session.secondsLeft) /
                        session.totalSeconds) * 100
                )
            );

        fill.style.width =
            progress + "%";

    }


    if (session.secondsLeft <= 0) {

        if (session.phase === "work") {

            finishPomodoroWork();

        } else {

            finishPomodoroBreak();

        }

    }

}


function pausePomodoro() {

    AppState.pomodoro.running =
        false;

    stopPomodoroTimerInterval();

    renderApp();

}


function resumePomodoro() {

    if (
        AppState.pomodoro.phase === "idle"
    ) {

        return;

    }


    AppState.pomodoro.running =
        true;

    renderApp();

    launchPomodoroTimerInterval();

}


function stopPomodoro() {

    stopPomodoroTimerInterval();


    AppState.pomodoro = {

        reviewId: null,

        chapterTitle: "",

        phase: "idle",

        secondsLeft: 0,

        totalSeconds: 0,

        running: false,

        intervalId: null,

        totalLoops: 0,

        loopsCompleted: 0

    };


    renderApp();

}


/**
 * Fin d'une session de travail Pomodoro : on marque
 * automatiquement le J comme révisé (une seule fois,
 * à la première boucle), puis on enchaîne sur une pause.
 */

function finishPomodoroWork() {

    const session =
        AppState.pomodoro;


    const reviewId =
        session.reviewId;

    const chapterTitle =
        session.chapterTitle;

    const totalLoops =
        session.totalLoops || 0;

    const loopsCompleted =
        session.loopsCompleted || 0;


    stopPomodoroTimerInterval();


    if (reviewId) {

        RevisionEngine.completeRevision(
            reviewId
        );

        showToast(
            "✓ " +
            chapterTitle +
            " marqué comme révisé 🎉"
        );

    }


    const breakMinutes =
        Database.getSettings()
            .pomodoroBreakMinutes || 5;


    const totalSeconds =
        Math.max(
            60,
            Math.round(
                breakMinutes * 60
            )
        );


    AppState.pomodoro = {

        /*
         * Le J n'est marqué révisé qu'une fois : on
         * vide reviewId pour les boucles suivantes.
         */

        reviewId: null,

        chapterTitle,

        phase: "break",

        secondsLeft: totalSeconds,

        totalSeconds,

        running: true,

        intervalId: null,

        totalLoops,

        loopsCompleted

    };


    renderApp();

    launchPomodoroTimerInterval();

}


/**
 * Fin d'une pause : soit on enchaîne automatiquement
 * sur une nouvelle boucle de travail (comportement par
 * défaut, illimité), soit on s'arrête si le nombre de
 * boucles réglé dans les Paramètres est atteint.
 */

function finishPomodoroBreak() {

    const session =
        AppState.pomodoro;

    const chapterTitle =
        session.chapterTitle;

    const totalLoops =
        session.totalLoops || 0;

    const loopsCompleted =
        (session.loopsCompleted || 0) + 1;


    stopPomodoroTimerInterval();


    const sessionIsOver =
        totalLoops > 0 &&
        loopsCompleted >= totalLoops;


    if (sessionIsOver) {

        AppState.pomodoro = {

            reviewId: null,

            chapterTitle: "",

            phase: "idle",

            secondsLeft: 0,

            totalSeconds: 0,

            running: false,

            intervalId: null,

            totalLoops: 0,

            loopsCompleted: 0

        };


        showToast(
            "🎉 Session terminée (" +
            loopsCompleted +
            (loopsCompleted > 1 ? " boucles) !" : " boucle) !")
        );


        renderApp();

        return;

    }


    showToast(
        "Pause terminée, nouvelle boucle ! 💪"
    );


    const workMinutes =
        Database.getSettings()
            .pomodoroWorkMinutes || 25;


    const totalSeconds =
        Math.max(
            60,
            Math.round(
                workMinutes * 60
            )
        );


    AppState.pomodoro = {

        reviewId: null,

        chapterTitle,

        phase: "work",

        secondsLeft: totalSeconds,

        totalSeconds,

        running: true,

        intervalId: null,

        totalLoops,

        loopsCompleted

    };


    renderApp();

    launchPomodoroTimerInterval();

}


/**
 * Termine la session en cours immédiatement et
 * marque le J comme révisé sans attendre la fin
 * du minuteur.
 */

function completePomodoroNow() {

    const session =
        AppState.pomodoro;


    if (
        session.phase !== "work"
    ) {

        return;

    }


    session.secondsLeft = 0;


    finishPomodoroWork();

}


function skipPomodoroBreak() {

    const session =
        AppState.pomodoro;


    if (session.phase !== "break") {

        return;

    }


    session.secondsLeft = 0;


    finishPomodoroBreak();

}


/* ======================================================
   REPROGRAMMER UNE RÉVISION
   ====================================================== */

function openRescheduleReviewForm(
    reviewId
) {

    const review =
        Database.getReview(
            reviewId
        );


    if (!review) {

        return;

    }


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    Déplacer cette révision
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="reschedule-review-form"
                class="chapter-form"
            >

                <input
                    type="hidden"
                    name="reviewId"
                    value="${escapeAttribute(reviewId)}"
                >

                <div class="info-box">

                    ${escapeHtml(
                        getChapterTitle(
                            review.chapterId
                        )
                    )}
                    · J${escapeHtml(String(review.j))}

                </div>


                <label>

                    <span>
                        Nouvelle date
                    </span>

                    <input
                        type="date"
                        name="scheduledDate"
                        value="${escapeAttribute(
                            review.scheduledDate
                        )}"
                        required
                    >

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Déplacer
                    </button>

                </div>

            </form>

        </div>

    `);

}


function rescheduleReviewFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const reviewId =
        String(
            formData.get("reviewId") || ""
        );


    const newDate =
        String(
            formData.get("scheduledDate") || ""
        ).trim();


    if (!reviewId || !newDate) {

        closeModal();

        return;

    }


    Database.rescheduleReview(
        reviewId,
        newDate
    );


    closeModal();

    renderApp();

}


/* ======================================================
COULEURS DES MATIÈRES
====================================================== */

const NO_SUBJECT_COLOR = "#9ca3af";

function getChapterColor(chapter) {

    if (!chapter || !chapter.subjectId) {

        return NO_SUBJECT_COLOR;

    }

    const subject =
        Database.getSubject(
            chapter.subjectId
        );

    return subject
        ? subject.color
        : NO_SUBJECT_COLOR;

}


/* ======================================================
FILTRES DE L'AGENDA
====================================================== */

function toggleAgendaChapterFilter(
    chapterId
) {

    if (
        AppState.agendaFilter.type ===
            "chapter"
        &&
        AppState.agendaFilter.value ===
            chapterId
    ) {

        AppState.agendaFilter = {
            type: null,
            value: null
        };

    } else {

        AppState.agendaFilter = {
            type: "chapter",
            value: chapterId
        };

    }

    renderApp();
}


function toggleAgendaSubjectFilter(
    subjectId
) {

    if (
        AppState.agendaFilter.type ===
            "subject"
        &&
        AppState.agendaFilter.value ===
            subjectId
    ) {

        AppState.agendaFilter = {
            type: null,
            value: null
        };

    } else {

        AppState.agendaFilter = {
            type: "subject",
            value: subjectId
        };

    }

    renderApp();
}


function clearAgendaFilter() {

    AppState.agendaFilter = {
        type: null,
        value: null
    };

}


function getAgendaFilterLabel() {

    const filter =
        AppState.agendaFilter;

    if (
        filter.type === "chapter"
    ) {

        return (
            "chapitre — " +
            getChapterTitle(
                filter.value
            )
        );

    }

    if (
        filter.type === "subject"
    ) {

        const subject =
            Database.getSubject(
                filter.value
            );

        return (
            "matière — " +
            (
                subject
                    ? subject.name
                    : "inconnue"
            )
        );

    }

    return "";

}


/* ======================================================
APPLICATION DU FILTRE
====================================================== */

function filterAgendaReviews(
    reviews
) {

    const filter =
        AppState.agendaFilter;

    if (!filter.type) {

        return reviews;

    }

    if (
        filter.type === "chapter"
    ) {

        return reviews.filter(
            review =>
                review.chapterId ===
                filter.value
        );

    }

    if (
        filter.type === "subject"
    ) {

        return reviews.filter(
            review => {

                const chapter =
                    Database.getChapter(
                        review.chapterId
                    );

                if (!chapter) {

                    return false;

                }

                return (
                    chapter.subjectId ===
                    filter.value
                );

            }
        );

    }

    return reviews;
}

/* ======================================================
   AGENDA
   ====================================================== */

function renderAgenda() {

    const date =
        AppState.selectedDate;


    const dateKey =
        RevisionEngine.formatDate(
            date
        );


    const allReviews =
        RevisionEngine
            .getRevisionsForDate(
                dateKey
            );


    const reviews =
        filterAgendaReviews(
            allReviews
        );


    const subjects =
        Database.getSubjects();


    const hasFilter =
        !!AppState.agendaFilter.type;


    return `

        <section class="view agenda-view">

            <div class="page-title">

                <div>

                    <h2>
                        Agenda
                    </h2>

                    <p>
                        ${formatLongDate(
                            date
                        )}
                    </p>

                </div>

                <button
                    type="button"
                    class="secondary-button"
                    data-action="go-today"
                >
                    Aujourd'hui
                </button>

            </div>


            ${
                subjects.length > 0
                    ? `

                        <div class="subject-quick-filters">

                            ${
                                subjects
                                    .map(
                                        subject => `
                                            <button
                                                type="button"
                                                class="subject-pill${
                                                    AppState.agendaFilter.type === "subject" &&
                                                    AppState.agendaFilter.value === subject.id
                                                        ? " subject-pill-active"
                                                        : ""
                                                }"
                                                data-action="filter-subject"
                                                data-subject-id="${escapeAttribute(subject.id)}"
                                            >
                                                <span
                                                    class="subject-pill-dot"
                                                    style="background:${escapeAttribute(subject.color)};"
                                                ></span>
                                                ${escapeHtml(subject.name)}
                                            </button>
                                        `
                                    )
                                    .join("")
                            }

                        </div>

                    `
                    : ""
            }


            <div class="agenda-navigation">

                <button
                    type="button"
                    data-action="previous-month"
                >
                    ← Mois précédent
                </button>

                <strong>
                    ${formatMonth(
                        date
                    )}
                </strong>

                <button
                    type="button"
                    data-action="next-month"
                >
                    Mois suivant →
                </button>

            </div>


            ${renderCalendar(date)}

            ${
                hasFilter
                    ? `

                        <div class="agenda-active-filter">

                            <span>
                                Filtre :
                                ${escapeHtml(
                                    getAgendaFilterLabel()
                                )}
                            </span>

                            <button
                                type="button"
                                data-action="clear-agenda-filter"
                            >
                                ✕ Retirer le filtre
                            </button>

                        </div>

                    `
                    : ""
            }

            ${
                hasFilter
                    ? renderUpcomingEcheances()
                    : ""
            }

            <section class="agenda-day">

                <h3>
                    Révisions du ${formatLongDate(
                        date
                    )}
                </h3>


                ${
                    reviews.length === 0

                        ? renderEmptyState(
                            "📅",
                            "Aucune révision",
                            hasFilter
                                ? "Rien pour cette matière ce jour-là."
                                : "Aucune révision prévue ce jour."
                        )

                        : reviews
                            .map(
                                review =>
                                    renderReviewCard(
                                        review,
                                        true
                                    )
                            )
                            .join("")
                }

            </section>

        </section>

    `;

}


function renderUpcomingEcheances() {

    const enrichedReviews =
        RevisionEngine
            .getEnrichedReviews();


    const filteredReviews =
        filterAgendaReviews(
            enrichedReviews
        )
        .filter(
            review =>
                !review.completed
        )
        .sort(
            (a, b) =>
                a.scheduledDate.localeCompare(
                    b.scheduledDate
                )
        );


    const todayKey =
        RevisionEngine.todayKey();


    const todayCount =
        filteredReviews.filter(
            review =>
                review.scheduledDate ===
                todayKey
        ).length;


    const lateCount =
        filteredReviews.filter(
            review =>
                review.scheduledDate <
                todayKey
        ).length;


    return `

        <section class="upcoming-echeances">

            <h3>
                Prochaines échéances
            </h3>

            <p class="upcoming-echeances-summary">

                ${
                    todayCount > 0
                        ? `
                            <span class="badge badge-today">
                                ${todayCount}
                                à faire aujourd'hui
                            </span>
                        `
                        : `
                            <span class="badge badge-none-today">
                                Rien à faire aujourd'hui
                            </span>
                        `
                }

                ${
                    lateCount > 0
                        ? `
                            <span class="badge badge-late">
                                ${lateCount}
                                en retard
                            </span>
                        `
                        : ""
                }

            </p>

            ${
                filteredReviews.length === 0

                    ? renderEmptyState(
                        "🎉",
                        "Tout est fait",
                        "Aucune échéance restante pour ce filtre."
                    )

                    : `

                        <ul class="upcoming-echeances-list">

                            ${
                                filteredReviews
                                    .slice(0, 15)
                                    .map(
                                        review => `

                                            <li>

                                                <button
                                                    type="button"
                                                    class="upcoming-echeance-item${
                                                        review.scheduledDate < todayKey
                                                            ? " upcoming-echeance-late"
                                                            : review.scheduledDate === todayKey
                                                                ? " upcoming-echeance-today"
                                                                : ""
                                                    }"
                                                    data-action="select-date"
                                                    data-date="${escapeAttribute(review.scheduledDate)}"
                                                >

                                                    <span class="upcoming-echeance-date">
                                                        ${
                                                            review.scheduledDate === todayKey
                                                                ? "Aujourd'hui"
                                                                : review.scheduledDate < todayKey
                                                                    ? "En retard — " + formatDisplayDate(review.scheduledDate)
                                                                    : formatDisplayDate(review.scheduledDate)
                                                        }
                                                    </span>

                                                    <span class="upcoming-echeance-title">
                                                        ${escapeHtml(review.chapterTitle || "Chapitre")}
                                                        · J${escapeHtml(String(review.j))}
                                                    </span>

                                                </button>

                                            </li>

                                        `
                                    )
                                    .join("")
                            }

                        </ul>

                    `
            }

        </section>

    `;

}


function renderCalendar(
    referenceDate
) {

    const year =
        referenceDate.getFullYear();


    const month =
        referenceDate.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    /*
     * Dimanche = 0.
     * On transforme pour avoir
     * lundi = 0.
     */

    let startingDay =
        firstDay.getDay() - 1;


    if (
        startingDay < 0
    ) {

        startingDay = 6;

    }


    const daysInMonth =
        lastDay.getDate();


    let html = `

        <div class="calendar">

            <div class="calendar-weekdays">

                <span>Lun</span>
                <span>Mar</span>
                <span>Mer</span>
                <span>Jeu</span>
                <span>Ven</span>
                <span>Sam</span>
                <span>Dim</span>

            </div>

            <div class="calendar-grid">

    `;


    /*
     * Cases vides avant le premier jour
     */

    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }


    /*
     * Jours du mois
     */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const currentDate =
            new Date(
                year,
                month,
                day
            );


        const key =
            RevisionEngine.formatDate(
                currentDate
            );


        const dayReviews =
            RevisionEngine.getRevisionsForDate(
                key
            );


        const hasActiveFilter =
            !!AppState.agendaFilter.type;


        const reviews =
            filterAgendaReviews(
                dayReviews
            );


        const chapterColors =
            reviews
                .map(
                    review => {

                        const chapter =
                            Database.getChapter(
                                review.chapterId
                            );


                        return getChapterColor(
                            chapter
                        );

                    }
                );


        const completed =
            reviews.length > 0 &&
            reviews.every(
                review =>
                    review.completed
            );


        const isToday =
            RevisionEngine.formatDate(
                new Date()
            ) === key;


        const isSelected =
            RevisionEngine.formatDate(
                AppState.selectedDate
            ) === key;


        /*
         * Jour qui avait des révisions,
         * mais aucune ne correspond au
         * filtre actif : on l'atténue.
         */

        const isExcludedByFilter =
            hasActiveFilter &&
            dayReviews.length > 0 &&
            reviews.length === 0;


        /*
         * Jour qui correspond au filtre :
         * on le met en évidence avec la
         * couleur de la matière/du chapitre.
         */

        const isHighlightedByFilter =
            hasActiveFilter &&
            reviews.length > 0;


        const highlightColor =
            isHighlightedByFilter
                ? chapterColors[0]
                : null;


        html += `

            <button
                type="button"
                class="
                    calendar-day
                    ${isToday ? "today" : ""}
                    ${isSelected ? "selected" : ""}
                    ${
                        reviews.length > 0
                            ? "has-reviews"
                            : ""
                    }
                    ${
                        completed
                            ? "all-completed"
                            : ""
                    }
                    ${
                        isExcludedByFilter
                            ? "calendar-day-excluded"
                            : ""
                    }
                    ${
                        isHighlightedByFilter
                            ? "calendar-day-highlighted"
                            : ""
                    }
                "
                ${
                    highlightColor
                        ? `style="--day-highlight-color:${escapeAttribute(highlightColor)};"`
                        : ""
                }
                data-calendar-date="${key}"
            >

                <span>
                    ${day}
                </span>


                ${
                    reviews.length > 0
                        ? `

                            <div class="calendar-day-info">

                                <div class="calendar-color-dots">

                                    ${
                                        chapterColors
                                            .slice(0, 8)
                                            .map(
                                                color => `

                                                    <span
                                                        class="calendar-color-dot"
                                                        style="background:${escapeAttribute(
                                                            color
                                                        )}"
                                                    ></span>

                                                `
                                            )
                                            .join("")
                                    }

                                </div>

                            </div>

                        `
                        : ""
                }

            </button>

        `;

    }


    html += `

            </div>

        </div>

    `;


    return html;

}


/* ======================================================
   NAVIGATION DU CALENDRIER
   ====================================================== */

function changeCalendarMonth(
    amount
) {

    const current =
        AppState.selectedDate;


    AppState.selectedDate =
        new Date(

            current.getFullYear(),

            current.getMonth() +
                amount,

            1

        );


    renderApp();

}


document.addEventListener(
    "click",
    event => {

        const day =
            event.target.closest(
                "[data-calendar-date]"
            );


        if (!day) {

            return;

        }


        const date =
            RevisionEngine.parseDate(
                day.dataset.calendarDate
            );


        if (!date) {

            return;

        }


        AppState.selectedDate =
            date;


        renderApp();

    }
);


/* ======================================================
   STATISTIQUES
   ====================================================== */

function renderStatistics() {

    const statistics =
        RevisionEngine.getStatistics();


    const chapters =
        Database.getChapters();


    const subjects =
        Database.getSubjects();


    const filter =
        AppState.statsSubjectFilter;


    /*
     * On regroupe les chapitres par matière
     * (dans l'ordre des matières), puis on
     * ajoute un groupe "Sans matière" à la fin
     * s'il y a des chapitres concernés.
     */

    const groups =
        subjects
            .map(
                subject => ({
                    subject,
                    chapters:
                        chapters.filter(
                            chapter =>
                                chapter.subjectId ===
                                subject.id
                        )
                })
            )
            .filter(
                group =>
                    group.chapters.length > 0
            );


    const chaptersWithoutSubject =
        chapters.filter(
            chapter => !chapter.subjectId
        );


    if (chaptersWithoutSubject.length > 0) {

        groups.push({
            subject: null,
            chapters: chaptersWithoutSubject
        });

    }


    const visibleGroups =
        filter === null
            ? groups
            : groups.filter(
                group =>
                    filter === "none"
                        ? group.subject === null
                        : group.subject &&
                          group.subject.id === filter
            );


    return `

        <section class="view statistics-view">

            <div class="page-title">

                <div>

                    <h2>
                        Statistiques
                    </h2>

                    <p>
                        Suis ta progression.
                    </p>

                </div>

            </div>


            <div class="stats-grid">

                <article class="stat-card">

                    <span>
                        Chapitres
                    </span>

                    <strong>
                        ${statistics.chapters}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        Révisions
                    </span>

                    <strong>
                        ${statistics.totalReviews}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        Terminées
                    </span>

                    <strong>
                        ${statistics.completedReviews}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        Progression
                    </span>

                    <strong>
                        ${statistics.completionRate}%
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        Aujourd'hui
                    </span>

                    <strong>
                        ${statistics.todayReviews}
                    </strong>

                </article>


                <article class="stat-card">

                    <span>
                        En retard
                    </span>

                    <strong>
                        ${statistics.lateReviews}
                    </strong>

                </article>

            </div>


            <section class="content-section">

                <h3>
                    Progression par chapitre
                </h3>

                ${
                    groups.length > 1
                        ? `
                            <div class="subject-quick-filters">

                                <button
                                    type="button"
                                    class="subject-pill${
                                        filter === null
                                            ? " subject-pill-active"
                                            : ""
                                    }"
                                    data-action="filter-stats-subject"
                                    data-subject-id=""
                                >
                                    Toutes les matières
                                </button>

                                ${
                                    groups
                                        .map(
                                            group => `
                                                <button
                                                    type="button"
                                                    class="subject-pill${
                                                        filter ===
                                                        (group.subject
                                                            ? group.subject.id
                                                            : "none")
                                                            ? " subject-pill-active"
                                                            : ""
                                                    }"
                                                    data-action="filter-stats-subject"
                                                    data-subject-id="${escapeAttribute(
                                                        group.subject
                                                            ? group.subject.id
                                                            : "none"
                                                    )}"
                                                >
                                                    <span
                                                        class="subject-pill-dot"
                                                        style="background:${escapeAttribute(
                                                            group.subject
                                                                ? group.subject.color
                                                                : NO_SUBJECT_COLOR
                                                        )};"
                                                    ></span>
                                                    ${escapeHtml(
                                                        group.subject
                                                            ? group.subject.name
                                                            : "Sans matière"
                                                    )}
                                                </button>
                                            `
                                        )
                                        .join("")
                                }

                            </div>
                        `
                        : ""
                }

                <div class="chapter-statistics">

                    ${
                        chapters.length === 0

                            ? renderEmptyState(
                                "📊",
                                "Pas encore de données",
                                "Ajoute un chapitre pour commencer."
                            )

                            : visibleGroups
                                .map(
                                    renderSubjectStatisticGroup
                                )
                                .join("")
                    }

                </div>

            </section>

        </section>

    `;

}


function renderSubjectStatisticGroup(
    group
) {

    const subject =
        group.subject;


    const chapters =
        group.chapters;


    const averageProgress =
        Math.round(
            chapters.reduce(
                (sum, chapter) =>
                    sum +
                    RevisionEngine.getChapterProgress(
                        chapter
                    ),
                0
            ) / chapters.length
        );


    return `

        <div class="stats-subject-group">

            <div class="stats-subject-group-header">

                <span
                    class="subject-color-dot"
                    style="background:${escapeAttribute(
                        subject
                            ? subject.color
                            : NO_SUBJECT_COLOR
                    )};"
                ></span>

                <h4>
                    ${escapeHtml(
                        subject
                            ? subject.name
                            : "Sans matière"
                    )}
                </h4>

                <span class="stats-subject-group-average">
                    ${averageProgress}%
                </span>

            </div>

            ${
                chapters
                    .map(
                        renderChapterStatistic
                    )
                    .join("")
            }

        </div>

    `;

}


function renderChapterStatistic(
    chapter
) {

    const progress =
        RevisionEngine
            .getChapterProgress(
                chapter
            );


    return `

        <div class="chapter-stat-row">

            <div>

                <strong>
                    ${escapeHtml(
                        chapter.title
                    )}
                </strong>

            </div>

            <div class="progress-bar">

                <div
                    class="progress-bar-fill"
                    style="width:${progress}%"
                ></div>

            </div>

            <strong>
                ${progress}%
            </strong>

        </div>

    `;

}


/* ======================================================
   PARAMÈTRES
   ====================================================== */

function renderSyncSection() {

    /*
     * Si js/sync.js n'a pas pu se charger
     * (pas de réseau au premier chargement,
     * bloqueur de script...), on masque
     * simplement la section plutôt que de
     * planter l'affichage des paramètres.
     */

    if (
        typeof Sync === "undefined"
    ) {

        return "";

    }


    const status =
        Sync.getSyncStatus();


    return `

        <section class="settings-section" id="sync-section">

            <h3>
                🔗 Synchronisation entre appareils
            </h3>

            ${
                status.active
                    ? `
                        <div class="info-box">

                            Code actif :

                            <strong class="sync-code-display">
                                ${escapeHtml(status.code)}
                            </strong>

                        </div>

                        <p class="settings-hint">
                            ${formatSyncStatusText(status)}
                        </p>

                        <div class="settings-actions">

                            <button
                                type="button"
                                data-action="copy-sync-code"
                            >
                                📋 Copier le code
                            </button>

                            <button
                                type="button"
                                data-action="sync-now"
                            >
                                🔄 Synchroniser maintenant
                            </button>

                            <button
                                type="button"
                                class="danger-button"
                                data-action="disable-sync"
                            >
                                Désactiver sur cet appareil
                            </button>

                        </div>
                    `
                    : `
                        <p class="settings-hint">
                            Relie cet appareil à un autre (ex : ton
                            tel et ton PC) pour partager automatiquement
                            tes matières et chapitres, sans créer de
                            compte.
                        </p>

                        <div class="settings-actions">

                            <button
                                type="button"
                                class="primary-button"
                                data-action="generate-sync-code"
                            >
                                ✨ Générer un nouveau code
                            </button>

                        </div>

                        <div class="sync-connect-row">

                            <label>

                                <span>
                                    J'ai déjà un code
                                </span>

                                <input
                                    type="text"
                                    id="sync-code-input"
                                    placeholder="Ex : 7F3K-9QZP"
                                >

                            </label>

                            <button
                                type="button"
                                data-action="connect-sync-code"
                            >
                                Connecter
                            </button>

                        </div>
                    `
            }

        </section>

    `;

}


function formatSyncStatusText(
    status
) {

    if (status.status === "syncing") {

        return "Synchronisation en cours...";

    }


    if (status.status === "error") {

        return (
            "⚠️ Dernière tentative en échec. " +
            "Vérifie ta connexion et réessaie."
        );

    }


    if (status.lastSyncedAt) {

        const time =
            new Date(
                status.lastSyncedAt
            ).toLocaleTimeString(
                "fr-FR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        return `Dernière synchro à ${time}.`;

    }


    return "Pas encore synchronisé.";

}


async function handleGenerateSyncCode() {

    const code =
        Sync.generateSyncCodeValue();


    Sync.setSyncCode(
        code
    );


    renderApp();


    await Sync.pushNow();


    renderApp();

}


async function handleConnectSyncCode() {

    const input =
        document.getElementById(
            "sync-code-input"
        );


    const code =
        input?.value
            .trim()
            .toUpperCase();


    if (!code) {

        return;

    }


    const hasLocalData =
        Database.getSubjects().length > 0 ||
        Database.getChapters().length > 0;


    if (hasLocalData) {

        const confirmed =
            window.confirm(

                "Cet appareil contient déjà des " +
                "matières/chapitres. Se connecter à ce " +
                "code va les REMPLACER par la version " +
                "déjà synchronisée sur ce code.\n\n" +
                "Continuer ?"

            );


        if (!confirmed) {

            return;

        }

    }


    Sync.setSyncCode(
        code
    );


    await Sync.pullFromCloud();


    renderApp();

}


function handleCopySyncCode() {

    const status =
        Sync.getSyncStatus();


    if (!status.code) {

        return;

    }


    navigator.clipboard
        ?.writeText(
            status.code
        )
        .then(
            () => {

                showToast(
                    "Code copié !"
                );

            }
        )
        .catch(
            () => {

                showToast(
                    "Impossible de copier automatiquement."
                );

            }
        );

}


async function handleSyncNow() {

    showToast(
        "Synchronisation..."
    );


    await Sync.pullFromCloud();


    renderApp();


    showToast(
        "Synchronisé !"
    );

}


function handleDisableSync() {

    const confirmed =
        window.confirm(

            "Cet appareil arrêtera de se " +
            "synchroniser. Tes données restent " +
            "en ligne sous ce code : tu pourras " +
            "reconnecter cet appareil (ou un " +
            "autre) avec le même code plus tard.\n\n" +
            "Continuer ?"

        );


    if (!confirmed) {

        return;

    }


    Sync.disableSync();

    renderApp();

}


function showToast(
    message
) {

    let toast =
        document.getElementById(
            "toast"
        );


    /*
     * Le conteneur #app est entièrement régénéré à
     * chaque renderApp(), donc le #toast statique de
     * index.html ne survit pas. On le recrée à la
     * racine du document si besoin.
     */

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;

    toast.classList.add(
        "toast-visible"
    );


    clearTimeout(
        toast._hideTimer
    );

    toast._hideTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "toast-visible"
                );

            },
            2200
        );

}


function renderSettings() {

    const settings =
        Database.getSettings();


    return `

        <section class="view settings-view">

            <div class="page-title">

                <div>

                    <h2>
                        Paramètres
                    </h2>

                    <p>
                        Personnalise ton application.
                    </p>

                </div>

            </div>


            <section class="settings-section">

                <h3>
                    Apparence
                </h3>


                <label class="setting-row">

                    <span>
                        Thème
                    </span>

                    <select
                        data-setting="theme"
                    >

                        <option
                            value="light"
                            ${
                                settings.theme ===
                                "light"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Clair
                        </option>

                        <option
                            value="dark"
                            ${
                                settings.theme ===
                                "dark"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Sombre
                        </option>

                    </select>

                </label>

            </section>


            <section class="settings-section">

                <h3>
                    Notifications
                </h3>


                <label class="setting-row">

                    <span>
                        Activer les notifications
                    </span>

                    <input
                        type="checkbox"
                        data-setting="notificationsEnabled"
                        ${
                            settings.notificationsEnabled
                                ? "checked"
                                : ""
                        }
                    >

                </label>

            </section>


            <section class="settings-section">

                <h3>
                    🍅 Pomodoro
                </h3>

                <label class="setting-row">

                    <span>
                        Durée d'une session (minutes)
                    </span>

                    <input
                        type="number"
                        min="1"
                        max="120"
                        data-setting="pomodoroWorkMinutes"
                        value="${settings.pomodoroWorkMinutes ?? 25}"
                    >

                </label>

                <label class="setting-row">

                    <span>
                        Durée d'une pause (minutes)
                    </span>

                    <input
                        type="number"
                        min="1"
                        max="60"
                        data-setting="pomodoroBreakMinutes"
                        value="${settings.pomodoroBreakMinutes ?? 5}"
                    >

                </label>

                <label class="setting-row">

                    <span>
                        Nombre de boucles (0 = illimité)
                    </span>

                    <input
                        type="number"
                        min="0"
                        max="50"
                        data-setting="pomodoroLoopCount"
                        value="${settings.pomodoroLoopCount ?? 0}"
                    >

                </label>

                <p class="settings-hint">
                    Par défaut (0), le Pomodoro enchaîne
                    travail/pause à l'infini jusqu'à ce que tu
                    arrêtes toi-même la session. Mets par exemple
                    2 pour que ça s'arrête automatiquement après
                    2 cycles (25 min + 5 min de pause + 25 min +
                    5 min de pause, puis fin).
                </p>

            </section>


            ${renderSyncSection()}


            <section class="settings-section">

                <h3>
                    Mes listes de J
                </h3>

                ${
                    Database.getIntervalPresets().length === 0
                        ? `
                            <p class="settings-hint">
                                Aucune liste de J personnalisée enregistrée
                                pour l'instant. Tu peux en créer une
                                depuis le formulaire d'ajout de chapitre.
                            </p>
                        `
                        : `
                            <div class="interval-preset-list">

                                ${
                                    Database
                                        .getIntervalPresets()
                                        .map(
                                            preset => `
                                                <div class="interval-preset-row">

                                                    <div>

                                                        <strong>
                                                            ${escapeHtml(preset.name)}
                                                        </strong>

                                                        <span>
                                                            J${preset.intervals.join(" · J")}
                                                        </span>

                                                    </div>

                                                    <button
                                                        type="button"
                                                        class="link-button"
                                                        data-action="delete-interval-preset"
                                                        data-id="${escapeAttribute(preset.id)}"
                                                    >
                                                        Supprimer
                                                    </button>

                                                </div>
                                            `
                                        )
                                        .join("")
                                }

                            </div>
                        `
                }

            </section>


            <section class="settings-section">

                <h3>
                    Données
                </h3>


                <div class="settings-actions">

                    <button
                        type="button"
                        data-action="export"
                    >
                        💾 Exporter mes données
                    </button>


                    <button
                        type="button"
                        data-action="import"
                    >
                        📥 Importer des données
                    </button>


                    <button
                        type="button"
                        data-action="delete-data"
                        class="danger-button"
                    >
                        🗑️ Supprimer mes données
                    </button>

                </div>

            </section>


            <section class="settings-section">

                <p class="app-version">
                    ${APP.name}
                    — version ${APP.version}
                </p>

            </section>

        </section>

    `;

}


/* ======================================================
   EMPLOI DU TEMPS
   ====================================================== */

const WEEKDAY_LABELS = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche"
];


function timeRangeToMinutes(
    startTime,
    endTime
) {

    const [
        startHours,
        startMinutes
    ] =
        String(startTime)
            .split(":")
            .map(Number);


    const [
        endHours,
        endMinutes
    ] =
        String(endTime)
            .split(":")
            .map(Number);


    if (
        [
            startHours,
            startMinutes,
            endHours,
            endMinutes
        ].some(Number.isNaN)
    ) {

        return 0;

    }


    const start =
        startHours * 60 +
        startMinutes;


    const end =
        endHours * 60 +
        endMinutes;


    return Math.max(
        0,
        end - start
    );

}


function formatMinutesAsHours(
    minutes
) {

    const hours =
        Math.round(
            (minutes / 60) * 10
        ) / 10;


    return (
        hours
            .toString()
            .replace(".", ",") +
        " h"
    );

}


function computeDomainWeeklyMinutes() {

    const blocks =
        Database.getScheduleBlocks();


    const totals = {};


    blocks.forEach(
        block => {

            const key =
                block.domainId ||
                "none";


            totals[key] =
                (totals[key] || 0) +
                timeRangeToMinutes(
                    block.startTime,
                    block.endTime
                );

        }
    );


    return totals;

}


function getCurrentWeekdayIndex() {

    /*
     * getDay() : dimanche = 0.
     * On veut lundi = 0.
     */

    const jsDay =
        new Date().getDay();


    return (jsDay + 6) % 7;

}


function renderSchedule() {

    const domains =
        Database.getDomains();


    const blocks =
        Database.getScheduleBlocks();


    const totalsByDomain =
        computeDomainWeeklyMinutes();


    const totalWeeklyMinutes =
        Object.values(
            totalsByDomain
        ).reduce(
            (sum, minutes) =>
                sum + minutes,
            0
        );


    return `

        <section class="view schedule-view">

            <div class="page-title">

                <div>

                    <h2>
                        Semaine type
                    </h2>

                    <p>
                        Répartis ton temps de travail sur une semaine
                        type. Coche les créneaux à reporter
                        automatiquement sur ton emploi du temps
                        (onglet « 🗓️ Emploi du temps »).
                    </p>

                </div>

                <button
                    class="primary-button"
                    data-action="add-schedule-block"
                    ${domains.length === 0 ? "disabled" : ""}
                >
                    + Ajouter un créneau
                </button>

            </div>


            <section class="content-section">

                <div class="section-header">

                    <h3>
                        Catégories
                    </h3>

                    <button
                        type="button"
                        data-action="add-domain"
                    >
                        + Nouvelle catégorie
                    </button>

                </div>


                ${
                    domains.length === 0
                        ? `

                            ${renderEmptyState(
                                "🗂️",
                                "Aucune catégorie",
                                "Crée des catégories comme « Licence », " +
                                "« Option Santé » ou « Autre travail » " +
                                "pour organiser ton emploi du temps."
                            )}

                            <button
                                type="button"
                                class="primary-button"
                                data-action="seed-default-domains"
                                style="margin-top:12px;"
                            >
                                ✨ Créer les catégories suggérées
                                (Licence, Option Santé, Autre travail)
                            </button>

                        `
                        : `
                            <div class="domain-chips">

                                ${
                                    domains
                                        .map(
                                            renderDomainChip
                                        )
                                        .join("")
                                }

                            </div>
                        `
                }

            </section>


            ${
                domains.length > 0
                    ? `

                        <section class="content-section">

                            <h3>
                                Répartition hebdomadaire
                                ${
                                    totalWeeklyMinutes > 0
                                        ? `· ${formatMinutesAsHours(totalWeeklyMinutes)} au total`
                                        : ""
                                }
                            </h3>

                            <div class="stats-grid">

                                ${
                                    domains
                                        .map(
                                            domain => {

                                                const minutes =
                                                    totalsByDomain[
                                                        domain.id
                                                    ] || 0;


                                                return `

                                                    <article
                                                        class="stat-card domain-stat-card"
                                                        style="--domain-color:${escapeAttribute(domain.color)};"
                                                    >

                                                        <span>
                                                            ${escapeHtml(domain.name)}
                                                        </span>

                                                        <strong>
                                                            ${formatMinutesAsHours(minutes)}
                                                        </strong>

                                                    </article>

                                                `;

                                            }
                                        )
                                        .join("")
                                }

                            </div>

                        </section>

                    `
                    : ""
            }


            <section class="content-section">

                <h3>
                    Semaine type
                </h3>

                <div class="schedule-week-grid">

                    ${
                        WEEKDAY_LABELS
                            .map(
                                (label, index) =>
                                    renderScheduleDay(
                                        index,
                                        label,
                                        blocks.filter(
                                            block =>
                                                block.day === index
                                        )
                                    )
                            )
                            .join("")
                    }

                </div>

            </section>

        </section>

    `;

}


function renderDomainChip(
    domain
) {

    return `

        <div
            class="domain-chip"
            style="--domain-color:${escapeAttribute(domain.color)};"
        >

            <span
                class="domain-chip-dot"
                style="background:${escapeAttribute(domain.color)};"
            ></span>

            <span>
                ${escapeHtml(domain.name)}
            </span>

            <button
                type="button"
                data-action="edit-domain"
                data-id="${escapeAttribute(domain.id)}"
                title="Modifier"
            >
                ✏️
            </button>

            <button
                type="button"
                data-action="delete-domain"
                data-id="${escapeAttribute(domain.id)}"
                title="Supprimer"
            >
                ✕
            </button>

        </div>

    `;

}


function renderScheduleDay(
    dayIndex,
    label,
    dayBlocks
) {

    const sorted =
        [...dayBlocks].sort(
            (a, b) =>
                a.startTime.localeCompare(
                    b.startTime
                )
        );


    const isToday =
        getCurrentWeekdayIndex() ===
        dayIndex;


    return `

        <div class="schedule-day-column${isToday ? " schedule-day-today" : ""}">

            <div class="schedule-day-header">

                <h4>
                    ${label}
                </h4>

                <button
                    type="button"
                    data-action="add-schedule-block"
                    data-day="${dayIndex}"
                    title="Ajouter un créneau ce jour"
                >
                    +
                </button>

            </div>


            <div class="schedule-day-blocks">

                ${
                    sorted.length === 0
                        ? `
                            <p class="schedule-day-empty">
                                Rien de prévu
                            </p>
                        `
                        : sorted
                            .map(
                                renderScheduleBlockItem
                            )
                            .join("")
                }

            </div>

        </div>

    `;

}


function renderScheduleBlockItem(
    block
) {

    const domain =
        block.domainId
            ? Database.getDomain(
                block.domainId
            )
            : null;


    const color =
        domain
            ? domain.color
            : "#9ca3af";


    const isActive =
        block.active !== false;


    return `

        <div
            class="schedule-block${isActive ? "" : " schedule-block-inactive"}"
            style="--domain-color:${escapeAttribute(color)};"
        >

            <div class="schedule-block-time">
                ${escapeHtml(block.startTime)}
                –
                ${escapeHtml(block.endTime)}
            </div>


            <div class="schedule-block-info">

                <span class="schedule-block-domain">

                    <span
                        class="schedule-block-dot"
                        style="background:${escapeAttribute(color)};"
                    ></span>

                    ${escapeHtml(
                        domain
                            ? domain.name
                            : "Sans catégorie"
                    )}

                </span>

                ${
                    block.label
                        ? `
                            <span class="schedule-block-label">
                                ${escapeHtml(block.label)}
                            </span>
                        `
                        : ""
                }

            </div>


            <label
                class="schedule-block-report-toggle"
                title="Reporter ce créneau sur l'emploi du temps"
            >

                <input
                    type="checkbox"
                    data-action="toggle-schedule-block-active"
                    data-id="${escapeAttribute(block.id)}"
                    ${isActive ? "checked" : ""}
                >

                <span>
                    Reporté sur l'emploi du temps
                </span>

            </label>


            <div class="schedule-block-actions">

                <button
                    type="button"
                    data-action="edit-schedule-block"
                    data-id="${escapeAttribute(block.id)}"
                    title="Modifier"
                >
                    ✏️
                </button>

                <button
                    type="button"
                    data-action="delete-schedule-block"
                    data-id="${escapeAttribute(block.id)}"
                    title="Supprimer"
                >
                    ✕
                </button>

            </div>

        </div>

    `;

}


/* ======================================================
   EMPLOI DU TEMPS — VUE SUR 30 JOURS
   ====================================================== */

/**
 * Retourne les créneaux de la semaine type actifs
 * (cochés "Reporté sur l'emploi du temps") pour un
 * jour de la semaine donné (0 = lundi ... 6 = dimanche),
 * triés par heure de début.
 */

function getActiveScheduleBlocksForWeekday(
    weekdayIndex
) {

    return Database
        .getScheduleBlocks()
        .filter(
            block =>
                block.day === weekdayIndex &&
                block.active !== false
        )
        .sort(
            (a, b) =>
                a.startTime.localeCompare(
                    b.startTime
                )
        );

}


function renderPlanning() {

    const domains =
        Database.getDomains();


    const totalActiveBlocks =
        Database
            .getScheduleBlocks()
            .filter(
                block =>
                    block.active !== false
            ).length;


    const date =
        AppState.selectedDate;


    const weekdayIndex =
        (date.getDay() + 6) % 7;


    const dayBlocks =
        getActiveScheduleBlocksForWeekday(
            weekdayIndex
        );


    return `

        <section class="view planning-view">

            <div class="page-title">

                <div>

                    <h2>
                        Emploi du temps
                    </h2>

                    <p>
                        ${formatLongDate(
                            date
                        )}
                    </p>

                </div>

                <button
                    type="button"
                    class="secondary-button"
                    data-action="go-today"
                >
                    Aujourd'hui
                </button>

            </div>


            <div class="agenda-navigation">

                <button
                    type="button"
                    data-action="previous-month"
                >
                    ← Mois précédent
                </button>

                <strong>
                    ${formatMonth(
                        date
                    )}
                </strong>

                <button
                    type="button"
                    data-action="next-month"
                >
                    Mois suivant →
                </button>

            </div>


            ${
                domains.length === 0 ||
                totalActiveBlocks === 0
                    ? renderEmptyState(
                        "🗓️",
                        "Rien de programmé pour l'instant",
                        "Va dans l'onglet « Semaine type », ajoute " +
                        "des créneaux et coche « Reporté sur " +
                        "l'emploi du temps » pour qu'ils apparaissent " +
                        "ici, dans ton emploi du temps."
                    )
                    : renderPlanningCalendar(date)
            }


            <section class="agenda-day">

                <h3>
                    Emploi du temps du
                    ${formatLongDate(
                        date
                    )}
                </h3>

                ${
                    dayBlocks.length === 0

                        ? renderEmptyState(
                            "🗓️",
                            "Rien de prévu",
                            "Aucun créneau reporté sur l'emploi du " +
                            "temps ce jour-là."
                        )

                        : dayBlocks
                            .map(
                                renderPlanningBlockItem
                            )
                            .join("")
                }

            </section>

        </section>

    `;

}


function renderPlanningCalendar(
    referenceDate
) {

    const year =
        referenceDate.getFullYear();


    const month =
        referenceDate.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    let startingDay =
        firstDay.getDay() - 1;


    if (
        startingDay < 0
    ) {

        startingDay = 6;

    }


    const daysInMonth =
        lastDay.getDate();


    let html = `

        <div class="calendar">

            <div class="calendar-weekdays">

                <span>Lun</span>
                <span>Mar</span>
                <span>Mer</span>
                <span>Jeu</span>
                <span>Ven</span>
                <span>Sam</span>
                <span>Dim</span>

            </div>

            <div class="calendar-grid">

    `;


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const currentDate =
            new Date(
                year,
                month,
                day
            );


        const key =
            RevisionEngine.formatDate(
                currentDate
            );


        const weekdayIndex =
            (currentDate.getDay() + 6) % 7;


        const blocks =
            getActiveScheduleBlocksForWeekday(
                weekdayIndex
            );


        const domainColors =
            blocks
                .map(
                    block =>
                        block.domainId
                            ? Database.getDomain(
                                block.domainId
                            )?.color
                            : null
                )
                .filter(Boolean);


        const isToday =
            RevisionEngine.formatDate(
                new Date()
            ) === key;


        const isSelected =
            RevisionEngine.formatDate(
                AppState.selectedDate
            ) === key;


        html += `

            <button
                type="button"
                class="
                    calendar-day
                    ${isToday ? "today" : ""}
                    ${isSelected ? "selected" : ""}
                    ${
                        blocks.length > 0
                            ? "has-reviews"
                            : ""
                    }
                "
                data-calendar-date="${key}"
            >

                <span>
                    ${day}
                </span>

                ${
                    blocks.length > 0
                        ? `

                            <div class="calendar-day-info">

                                <div class="calendar-color-dots">

                                    ${
                                        domainColors
                                            .slice(0, 8)
                                            .map(
                                                color => `

                                                    <span
                                                        class="calendar-color-dot"
                                                        style="background:${escapeAttribute(
                                                            color
                                                        )}"
                                                    ></span>

                                                `
                                            )
                                            .join("")
                                    }

                                </div>

                            </div>

                        `
                        : ""
                }

            </button>

        `;

    }


    html += `

            </div>

        </div>

    `;


    return html;

}


function renderPlanningBlockItem(
    block
) {

    const domain =
        block.domainId
            ? Database.getDomain(
                block.domainId
            )
            : null;


    const color =
        domain
            ? domain.color
            : "#9ca3af";


    return `

        <div
            class="schedule-block planning-block"
            style="--domain-color:${escapeAttribute(color)};"
        >

            <div class="schedule-block-time">
                ${escapeHtml(block.startTime)}
                –
                ${escapeHtml(block.endTime)}
            </div>


            <div class="schedule-block-info">

                <span class="schedule-block-domain">

                    <span
                        class="schedule-block-dot"
                        style="background:${escapeAttribute(color)};"
                    ></span>

                    ${escapeHtml(
                        domain
                            ? domain.name
                            : "Sans catégorie"
                    )}

                </span>

                ${
                    block.label
                        ? `
                            <span class="schedule-block-label">
                                ${escapeHtml(block.label)}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>

    `;

}


/* ======================================================
   FORMULAIRE CATÉGORIE (EMPLOI DU TEMPS)
   ====================================================== */

function openDomainForm(
    domain = null
) {

    AppState.editingDomainId =
        domain
            ? domain.id
            : null;


    const title =
        domain
            ? "Modifier la catégorie"
            : "Nouvelle catégorie";


    const currentColor =
        domain
            ? domain.color || "#4f46e5"
            : SUBJECT_COLOR_PRESETS[
                Database.getDomains().length %
                SUBJECT_COLOR_PRESETS.length
            ];


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    ${title}
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="domain-form"
                class="subject-form"
            >

                <label>

                    <span>
                        Nom de la catégorie *
                    </span>

                    <input
                        type="text"
                        name="name"
                        required
                        value="${
                            domain
                                ? escapeAttribute(domain.name)
                                : ""
                        }"
                        placeholder="Ex : Licence, Option Santé, Autre travail"
                    >

                </label>


                <label>
                    <span>Couleur</span>

                    <div class="color-picker-row">

                        <input
                            type="color"
                            id="domain-color"
                            name="color"
                            value="${escapeAttribute(currentColor)}"
                        >

                        <span
                            id="domain-color-preview"
                            class="chapter-color-preview"
                            style="background: ${escapeAttribute(currentColor)};"
                        ></span>

                        <span
                            id="domain-color-value"
                            class="chapter-color-value"
                        >
                            ${escapeHtml(currentColor)}
                        </span>

                    </div>

                    <div class="color-presets">

                        ${
                            SUBJECT_COLOR_PRESETS
                                .map(
                                    presetColor => `
                                        <button
                                            type="button"
                                            class="color-preset-swatch"
                                            data-preset-color="${presetColor}"
                                            style="background:${presetColor};"
                                        ></button>
                                    `
                                )
                                .join("")
                        }

                    </div>

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${
                            domain
                                ? "Enregistrer"
                                : "Créer la catégorie"
                        }
                    </button>

                </div>

            </form>

        </div>

    `);

    setupColorPicker(
        "domain-color",
        "domain-color-preview",
        "domain-color-value"
    );

}


function saveDomainFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const name =
        String(
            formData.get("name") || ""
        ).trim();


    const color =
        String(
            formData.get("color") || "#4f46e5"
        );


    if (!name) {

        return;

    }


    if (
        AppState.editingDomainId
    ) {

        Database.updateDomain(

            AppState.editingDomainId,

            {
                name,
                color
            }

        );

        AppState.editingDomainId =
            null;

    } else {

        Database.addDomain({
            name,
            color
        });

    }


    closeModal();

    renderApp();

}


function editDomain(
    domainId
) {

    const domain =
        Database.getDomain(
            domainId
        );


    if (!domain) {

        return;

    }


    openDomainForm(
        domain
    );

}


function deleteDomainFromUI(
    domainId
) {

    const domain =
        Database.getDomain(
            domainId
        );


    if (!domain) {

        return;

    }


    const confirmed =
        window.confirm(

            `Supprimer la catégorie "${domain.name}" ?\n\n` +
            "Les créneaux associés à cette catégorie " +
            "seront également supprimés."

        );


    if (!confirmed) {

        return;

    }


    Database.deleteDomain(
        domainId
    );


    renderApp();

}


function seedDefaultDomains() {

    if (
        Database.getDomains().length > 0
    ) {

        renderApp();

        return;

    }


    Database.addDomain({
        name: "Licence",
        color: "#4f46e5"
    });

    Database.addDomain({
        name: "Option Santé",
        color: "#ef4444"
    });

    Database.addDomain({
        name: "Autre travail",
        color: "#10b981"
    });


    renderApp();

}


/* ======================================================
   FORMULAIRE CRÉNEAU (EMPLOI DU TEMPS)
   ====================================================== */

function openScheduleBlockForm(
    block = null,
    presetDay = null
) {

    AppState.editingScheduleBlockId =
        block
            ? block.id
            : null;


    const domains =
        Database.getDomains();


    const title =
        block
            ? "Modifier le créneau"
            : "Ajouter un créneau";


    const defaultDay =
        block
            ? block.day
            : (
                presetDay !== null &&
                presetDay !== undefined &&
                presetDay !== ""
                    ? Number(presetDay)
                    : getCurrentWeekdayIndex()
            );


    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    ${title}
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="schedule-block-form"
                class="chapter-form"
            >

                <label>

                    <span>
                        Jour
                    </span>

                    <select name="day">

                        ${
                            WEEKDAY_LABELS
                                .map(
                                    (label, index) => `
                                        <option
                                            value="${index}"
                                            ${
                                                defaultDay === index
                                                    ? "selected"
                                                    : ""
                                            }
                                        >
                                            ${label}
                                        </option>
                                    `
                                )
                                .join("")
                        }

                    </select>

                </label>


                <div style="display:flex; gap:12px;">

                    <label style="flex:1;">

                        <span>
                            Heure de début
                        </span>

                        <input
                            type="time"
                            name="startTime"
                            value="${
                                block
                                    ? escapeAttribute(block.startTime)
                                    : "08:00"
                            }"
                            required
                        >

                    </label>


                    <label style="flex:1;">

                        <span>
                            Heure de fin
                        </span>

                        <input
                            type="time"
                            name="endTime"
                            value="${
                                block
                                    ? escapeAttribute(block.endTime)
                                    : "09:00"
                            }"
                            required
                        >

                    </label>

                </div>


                <label>

                    <span>
                        Catégorie
                    </span>

                    ${
                        domains.length === 0
                            ? `
                                <div class="info-box">
                                    Tu n'as pas encore de catégorie.
                                    <button
                                        type="button"
                                        class="link-button"
                                        data-action="close-modal-and-add-domain"
                                    >
                                        Créer une catégorie
                                    </button>
                                </div>
                            `
                            : `
                                <select name="domainId">

                                    ${
                                        domains
                                            .map(
                                                domainOption => `
                                                    <option
                                                        value="${escapeAttribute(domainOption.id)}"
                                                        ${
                                                            block &&
                                                            block.domainId === domainOption.id
                                                                ? "selected"
                                                                : ""
                                                        }
                                                    >
                                                        ${escapeHtml(domainOption.name)}
                                                    </option>
                                                `
                                            )
                                            .join("")
                                    }

                                </select>

                                <button
                                    type="button"
                                    class="link-button"
                                    data-action="close-modal-and-add-domain"
                                >
                                    + Nouvelle catégorie
                                </button>
                            `
                    }

                </label>


                <label>

                    <span>
                        Libellé (optionnel)
                    </span>

                    <input
                        type="text"
                        name="label"
                        value="${
                            block
                                ? escapeAttribute(block.label || "")
                                : ""
                        }"
                        placeholder="Ex : Fiches de cardiologie"
                    >

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                        ${domains.length === 0 ? "disabled" : ""}
                    >
                        ${
                            block
                                ? "Enregistrer"
                                : "Ajouter"
                        }
                    </button>

                </div>

            </form>

        </div>

    `);

}


function saveScheduleBlockFromForm(
    form
) {

    const formData =
        new FormData(
            form
        );


    const day =
        Number(
            formData.get("day")
        );


    const startTime =
        String(
            formData.get("startTime") || ""
        ).trim();


    const endTime =
        String(
            formData.get("endTime") || ""
        ).trim();


    const domainId =
        String(
            formData.get("domainId") || ""
        ).trim() || null;


    const label =
        String(
            formData.get("label") || ""
        ).trim();


    if (!startTime || !endTime) {

        return;

    }


    if (
        AppState.editingScheduleBlockId
    ) {

        Database.updateScheduleBlock(

            AppState.editingScheduleBlockId,

            {
                day,
                startTime,
                endTime,
                domainId,
                label
            }

        );

        AppState.editingScheduleBlockId =
            null;

    } else {

        Database.addScheduleBlock({
            day,
            startTime,
            endTime,
            domainId,
            label
        });

    }


    closeModal();

    renderApp();

}


function editScheduleBlock(
    blockId
) {

    const block =
        Database.getScheduleBlock(
            blockId
        );


    if (!block) {

        return;

    }


    openScheduleBlockForm(
        block
    );

}


function deleteScheduleBlockFromUI(
    blockId
) {

    const confirmed =
        window.confirm(
            "Supprimer ce créneau ?"
        );


    if (!confirmed) {

        return;

    }


    Database.deleteScheduleBlock(
        blockId
    );


    renderApp();

}


/* ======================================================
   MODALES
   ====================================================== */

function showModal(
    content
) {

    /*
     * On retire uniquement l'élément DOM d'une
     * éventuelle modale précédente, sans réinitialiser
     * les AppState.editingXxxId : ceux-ci viennent
     * d'être positionnés par l'appelant (openChapterForm,
     * openSubjectForm...) juste avant cet appel, et ne
     * doivent pas être écrasés ici.
     */

    removeModalElement();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "modal-overlay";


    overlay.className =
        "modal-overlay";


    overlay.innerHTML =
        content;


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeModal();

            }

        }
    );


    document.body.appendChild(
        overlay
    );

}


function removeModalElement() {

    const modal =
        document.getElementById(
            "modal-overlay"
        );


    if (modal) {

        modal.remove();

    }

}


function closeModal() {

    removeModalElement();


    AppState.editingChapterId =
        null;

    AppState.editingSubjectId =
        null;

    AppState.editingDomainId =
        null;

    AppState.editingScheduleBlockId =
        null;

}


/* ======================================================
   IMPORT / EXPORT
   ====================================================== */

function exportData() {

    const json =
        Database.exportDatabase();


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "methode_des_j_backup.json";


    link.click();


    URL.revokeObjectURL(
        url
    );

}


function openImportDialog() {

    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    Importer les données
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>


            <form
                id="import-form"
            >

                <label>

                    <span>
                        Fichier JSON
                    </span>

                    <input
                        type="file"
                        name="file"
                        accept=".json,application/json"
                        required
                    >

                </label>


                <div class="modal-actions">

                    <button
                        type="button"
                        data-action="close-modal"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Importer
                    </button>

                </div>

            </form>

        </div>

    `);

}


function importDataFromForm(
    form
) {

    const input =
        form.querySelector(
            '[name="file"]'
        );


    const file =
        input?.files?.[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            const success =
                Database.importDatabase(
                    event.target.result
                );


            if (!success) {

                alert(
                    "Impossible d'importer ce fichier."
                );

                return;

            }


            closeModal();

            renderApp();

        };


    reader.readAsText(
        file
    );

}


/* ======================================================
   SUPPRESSION DES DONNÉES
   ====================================================== */

function openDeleteDataDialog() {

    showModal(`

        <div class="modal">

            <div class="modal-header">

                <h2>
                    Supprimer mes données
                </h2>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    ×
                </button>

            </div>

            <p>
                Cette action supprime définitivement toutes tes
                matières, chapitres et révisions. C'est irréversible.
            </p>

            <p>
                Tu peux d'abord exporter une sauvegarde si tu veux
                pouvoir les récupérer plus tard.
            </p>

            <div class="modal-actions modal-actions-stacked">

                <button
                    type="button"
                    class="primary-button"
                    data-action="export-then-delete"
                >
                    💾 Exporter puis supprimer
                </button>

                <button
                    type="button"
                    class="danger-button"
                    data-action="delete-data-only"
                >
                    🗑️ Supprimer sans exporter
                </button>

                <button
                    type="button"
                    data-action="close-modal"
                >
                    Annuler
                </button>

            </div>

        </div>

    `);

}


function exportThenDeleteData() {

    exportData();

    /*
     * Petit délai pour laisser le
     * téléchargement démarrer avant
     * d'enchaîner sur la confirmation
     * de suppression.
     */

    setTimeout(
        () => {

            confirmAndResetApplication();

        },
        300
    );

}


function confirmAndResetApplication() {

    const confirmed =
        window.confirm(

            "⚠️ ATTENTION\n\n" +
            "Toutes tes données seront supprimées.\n\n" +
            "Cette action est irréversible."

        );


    if (!confirmed) {

        return;

    }


    Database.resetDatabase();


    AppState.currentView =
        "accueil";

    closeModal();

    renderApp();

}


/* ======================================================
   OUTILS D'AFFICHAGE
   ====================================================== */

function renderEmptyState(
    icon,
    title,
    description
) {

    return `

        <div class="empty-state">

            <div class="empty-state-icon">
                ${icon}
            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${description}
            </p>

        </div>

    `;

}


function getChapterTitle(
    chapterId
) {

    const chapter =
        Database.getChapter(
            chapterId
        );


    return chapter
        ? chapter.title
        : "Chapitre supprimé";

}


function formatDisplayDate(
    date
) {

    const parsed =
        RevisionEngine.parseDate(
            date
        );


    if (!parsed) {

        return "";

    }


    return parsed.toLocaleDateString(
        "fr-FR",
        {
            day:
                "numeric",

            month:
                "short"

        }
    );

}


function formatLongDate(
    date
) {

    return new Date(
        date
    ).toLocaleDateString(
        "fr-FR",
        {

            weekday:
                "long",

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}


function formatMonth(
    date
) {

    return new Date(
        date
    ).toLocaleDateString(
        "fr-FR",
        {

            month:
                "long",

            year:
                "numeric"

        }
    );

}


/* ======================================================
   SÉCURITÉ HTML
   ====================================================== */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* ======================================================
   THÈME
   ====================================================== */

function applyTheme() {

    const settings =
        Database.getSettings();


    document.documentElement
        .dataset.theme =
            settings.theme ||
            "light";

}


applyTheme();


/* ======================================================
   FIN
   ====================================================== */

console.log(
    "Méthode des J — app.js chargé."
);