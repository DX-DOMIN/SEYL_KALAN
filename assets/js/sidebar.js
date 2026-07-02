document.addEventListener(
    'DOMContentLoaded',
    () => {

        const currentUser = readCurrentUser();

        if (!currentUser) {
            window.location.replace('../index.html');
            return;
        }

        const sidebar =
            document.getElementById(
                'sidebar-container'
            );

        if (!sidebar) return;

        const currentPage =
            window.location.pathname
                .split('/')
                .pop();

        sidebar.innerHTML = `

        <div class="sidebar">

            <div>

                <div class="sidebar-header">

                    <div class="sidebar-logo">

                        <div class="sidebar-logo-icon">
                            <i class="fa-solid fa-boxes-stacked"></i>
                        </div>

                        <div>
                            <h3>KHAIRON</h3>
                            <span>WMS Platform</span>
                        </div>

                    </div>

                </div>

                <div class="sidebar-group">

                    <div
                        class="sidebar-group-title"
                        onclick="toggleMenu('inventariosMenu')">

                        <span>INVENTARIOS</span>
                        <i class="fa-solid fa-chevron-down"></i>

                    </div>

                    <ul
                        id="inventariosMenu"
                        class="sidebar-menu open">

                        <li class="${currentPage === 'dashboard.html' ? 'active' : ''}"
                            onclick="window.location.href='dashboard.html'">
                            <i class="fa-solid fa-chart-line"></i>
                            Dashboard
                        </li>

                        <li class="${currentPage === 'inventory.html' ? 'active' : ''}"
                            onclick="window.location.href='inventory.html'">
                            <i class="fa-solid fa-file-import"></i>
                            Carga Inventario
                        </li>

                        <li class="${currentPage === 'locations.html' ? 'active' : ''}"
                            onclick="window.location.href='locations.html'">
                            <i class="fa-solid fa-location-dot"></i>
                            Consulta Inventario
                        </li>

                        <li class="${currentPage === 'scanner.html' ? 'active' : ''}"
                            onclick="window.location.href='scanner.html'">
                            <i class="fa-solid fa-barcode"></i>
                            Barrido Físico
                        </li>

                        <li class="${currentPage === 'analytics.html' ? 'active' : ''}"
                            onclick="window.location.href='analytics.html'">
                            <i class="fa-solid fa-chart-column"></i>
                            Análisis
                        </li>

                        <li class="${currentPage === 'reports.html' ? 'active' : ''}"
                            onclick="window.location.href='reports.html'">
                            <i class="fa-solid fa-file-export"></i>
                            Reportes
                        </li>

                        <li class="${currentPage === 'progress.html' ? 'active' : ''}"
                            onclick="window.location.href='progress.html'">
                            <i class="fa-solid fa-list-check"></i>
                            Avance
                        </li>

                        <li class="${currentPage === 'heatmap.html' ? 'active' : ''}"
                            onclick="window.location.href='heatmap.html'">
                            <i class="fa-solid fa-fire"></i>
                            Heatmap
                        </li>

                    </ul>

                </div>

                <div class="sidebar-group">

                    <div
                        class="sidebar-group-title"
                        onclick="toggleMenu('operacionesMenu')">

                        <span>OPERACIONES</span>
                        <i class="fa-solid fa-chevron-down"></i>

                    </div>

                    <ul
                        id="operacionesMenu"
                        class="sidebar-menu open">

                        <li class="${currentPage === 'validation.html' ? 'active' : ''}"
                            onclick="window.location.href='validation.html'">
                            <i class="fa-solid fa-clipboard-check"></i>
                            Validación
                        </li>

                    </ul>

                </div>

                <div class="sidebar-group">

                    <div
                        class="sidebar-group-title"
                        onclick="toggleMenu('adminMenu')">

                        <span>ADMINISTRACIÓN</span>
                        <i class="fa-solid fa-chevron-down"></i>

                    </div>

                    <ul
                        id="adminMenu"
                        class="sidebar-menu">

                        <li>
                            <i class="fa-solid fa-users"></i>
                            Usuarios
                        </li>

                        <li>
                            <i class="fa-solid fa-gear"></i>
                            Configuración
                        </li>

                        <li>
                            <i class="fa-solid fa-shield-halved"></i>
                            Auditoría
                        </li>

                    </ul>

                </div>

            </div>

            <div class="sidebar-footer">

                <div class="sidebar-logout">

                    <button
                        class="logout-btn"
                        onclick="logout()">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        Cerrar Sesión
                    </button>

                </div>

                <div class="system-status">
                    <div class="status-dot"></div>
                    Sistema Operativo
                </div>

            </div>

        </div>

        `;

        document
            .getElementById('adminMenu')
            ?.closest('.sidebar-group')
            ?.remove();

        document.querySelectorAll('.user-box').forEach(box => {
            if (box.id !== 'currentUserBox') {
                box.textContent = currentUser.name || currentUser.username;
            }
        });

    }
);

function readCurrentUser() {

    try {
        const value = JSON.parse(localStorage.getItem('currentUser'));
        return value && (value.username || value.name) ? value : null;
    }
    catch {
        return null;
    }

}

// =====================================
// TOGGLE MENU
// =====================================

function toggleMenu(menuId) {

    const menu =
        document.getElementById(menuId);

    menu.classList.toggle('open');

}

// =====================================
// LOGOUT
// =====================================

function logout() {

    localStorage.removeItem(
        'currentUser'
    );

    window.location.href =
        '../index.html';

}
