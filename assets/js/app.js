// LOGIN

document
    .getElementById('loginForm')
    .addEventListener(
        'submit',
        function (e) {

            e.preventDefault();

            // INPUTS

            const username =
                document
                .getElementById(
                    'username'
                )
                .value
                .trim();

            const password =
                document
                .getElementById(
                    'password'
                )
                .value
                .trim();

            const operator =
                document
                .getElementById(
                    'operatorInput'
                )
                .value
                .trim();

            // VALIDAR VACÍOS

            if (
                !username ||
                !password ||
                !operator
            ) {

                alert(
                    'Completa todos los campos'
                );

                return;

            }

            // USUARIOS

            const users = [

                {
                    username: 'admin',
                    password: 'admin123'
                },

                {
                    username: 'contador1',
                    password: 'conteo101'
                },

                {
                    username: 'contador2',
                    password: 'conteo202'
                },

                {
                    username: 'contador3',
                    password: 'conteo303'
                }

            ];

            // VALIDAR LOGIN

            const validUser =
                users.find(user =>

                    user.username === username
                    &&
                    user.password === password

                );

            // LOGIN CORRECTO

            if (validUser) {

                // GUARDAR OPERADOR

                sessionStorage.setItem(

                    'operator',

                    operator

                );

                // GUARDAR USUARIO

                sessionStorage.setItem(

                    'username',

                    username

                );

                // ENTRAR

                window.location.href =
                    'modules/dashboard.html';

            }

            // LOGIN INCORRECTO

            else {

                alert(
                    'Usuario o contraseña incorrectos'
                );

            }

        }
    );