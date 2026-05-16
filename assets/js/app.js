// =====================================
// LOGIN WMS
// =====================================

document
    .getElementById('loginForm')

    .addEventListener(

        'submit',

        function (e) {

            e.preventDefault();

            const username =
                document
                    .getElementById('username')
                    .value
                    .trim();

            const password =
                document
                    .getElementById('password')
                    .value
                    .trim();

            // =====================================
            // USUARIOS
            // =====================================

            const users = {

                contador1: {
                    password: 'conteo101',
                    name: 'Contador 1'
                },

                contador2: {
                    password: 'conteo202',
                    name: 'Contador 2'
                },

                contador3: {
                    password: 'conteo303',
                    name: 'Contador 3'
                },

                supervisor: {
                    password: 'admin404',
                    name: 'Supervisor Operativo'
                }

            };

            // =====================================
            // VALIDAR
            // =====================================

            if (

                users[username] &&

                users[username].password === password

            ) {

                // GUARDAR SESION

                localStorage.setItem(

                    'currentUser',

                    JSON.stringify({

                        username: username,

                        name: users[username].name

                    })

                );

                // REDIRECCION

                window.location.href =
                    'modules/dashboard.html';

            }

            else {

                alert(
                    'Usuario o contraseña incorrectos'
                );

            }

        }

    );