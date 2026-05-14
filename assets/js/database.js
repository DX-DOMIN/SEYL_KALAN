// =====================================
// DATABASE GLOBAL
// =====================================

let db;

// =====================================
// ABRIR DATABASE
// =====================================

function initDB() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            'SEYL_KALAN_DB',
            1
        );

        // CREAR TABLAS

        request.onupgradeneeded = function (e) {

            db = e.target.result;

            // INVENTARIO

            if (
                !db.objectStoreNames.contains(
                    'inventory'
                )
            ) {

                const store =
                    db.createObjectStore(
                        'inventory',
                        {
                            keyPath: 'id',
                            autoIncrement: true
                        }
                    );

                // ÍNDICES

                store.createIndex(
                    'ubicacion',
                    'ubicacion',
                    { unique: false }
                );

                store.createIndex(
                    'upc',
                    'upc',
                    { unique: false }
                );

            }

        };

        // SUCCESS

        request.onsuccess = function (e) {

            db = e.target.result;

            console.log(
                'IndexedDB conectada'
            );

            resolve();

        };

        // ERROR

        request.onerror = function () {

            console.error(
                'Error IndexedDB'
            );

            reject();

        };

    });

}

// =====================================
// GUARDAR INVENTARIO
// =====================================

function saveInventory(data) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                ['inventory'],
                'readwrite'
            );

        const store =
            transaction.objectStore(
                'inventory'
            );

        // LIMPIAR

        const clearRequest =
            store.clear();

        clearRequest.onsuccess = () => {

            data.forEach(item => {

                store.add(item);

            });

        };

        transaction.oncomplete = () => {

            console.log(
                'Inventario guardado'
            );

            resolve();

        };

        transaction.onerror = () => {

            console.error(
                'Error guardando inventario'
            );

            reject();

        };

    });

}

// =====================================
// OBTENER INVENTARIO
// =====================================

function getInventory() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                ['inventory'],
                'readonly'
            );

        const store =
            transaction.objectStore(
                'inventory'
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(
                request.result
            );

        };

        request.onerror = () => {

            reject();

        };

    });

}