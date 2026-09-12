/* =========================================================
   MÉTHODE DES J
   service-worker.js
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CACHE_NAME = "methode-des-j-v2";


const APP_FILES = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/style.css",

    "./js/app.js",

    "./js/db.js",

    "./js/revision.js"

];


/* =========================================================
   INSTALLATION
   ========================================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "[SW] Installation..."
        );


        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache => {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

        );


        /*
         * Permet au nouveau Service Worker
         * de prendre immédiatement le contrôle.
         */

        self.skipWaiting();

    }
);


/* =========================================================
   ACTIVATION
   ========================================================= */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "[SW] Activation..."
        );


        event.waitUntil(

            caches
                .keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    cacheName =>
                                        cacheName !==
                                        CACHE_NAME
                                )
                                .map(
                                    cacheName =>
                                        caches.delete(
                                            cacheName
                                        )
                                )

                        );

                    }
                )

        );


        self.clients.claim();

    }
);


/* =========================================================
   INTERCEPTION DES REQUÊTES
   ========================================================= */

self.addEventListener(
    "fetch",
    event => {

        /*
         * On ne traite que les requêtes GET.
         */

        if (
            event.request.method !==
            "GET"
        ) {

            return;

        }


        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(
                    cachedResponse => {

                        /*
                         * Si le fichier existe
                         * dans le cache, on l'utilise.
                         */

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;

                        }


                        /*
                         * Sinon on va le chercher
                         * sur le serveur.
                         */

                        return fetch(
                            event.request
                        )
                        .then(
                            networkResponse => {

                                /*
                                 * On fait une copie
                                 * de la réponse.
                                 */

                                const responseClone =
                                    networkResponse.clone();


                                caches
                                    .open(
                                        CACHE_NAME
                                    )
                                    .then(
                                        cache => {

                                            cache.put(
                                                event.request,
                                                responseClone
                                            );

                                        }
                                    );


                                return networkResponse;

                            }
                        )
                        .catch(
                            () => {

                                /*
                                 * Si Internet est coupé
                                 * et que la ressource n'est
                                 * pas encore en cache,
                                 * on renvoie la page principale.
                                 */

                                return caches.match(
                                    "./index.html"
                                );

                            }
                        );

                    }
                )

        );

    }
);


/* =========================================================
   MESSAGE DEPUIS L'APPLICATION
   ========================================================= */

self.addEventListener(
    "message",
    event => {

        if (
            event.data &&
            event.data.type ===
                "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }

    }
);
