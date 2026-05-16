document.addEventListener(
    'DOMContentLoaded',
    () => {

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

                <!-- LOGO -->

                <div class="sidebar-header">

                    <div class="sidebar-logo">

                        <div class="sidebar-logo-icon">

                            <i class="fa-solid fa-boxes-stacked"></i>

                        </div>

                        <div>

                            <h3>SEYL_KALAN</h3>

                            <span>Warehouse Control System</span>

                        </div>

                    </div>

                </div>

                <!-- INVENTARIOS -->

                <div class="sidebar-group">

                    <div
                        class="sidebar-group-title"
                        onclick="toggleMenu('inventariosMenu')">

                        <span>

                            INVENTARIOS

                        </span>

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

<li class="${currentPage === 'heatmap.html' ? 'active' : ''}"
    onclick="window.location.href='heatmap.html'">

    <i class="fa-solid fa-fire"></i>

    Heatmap

</li>

                        </li>

                    </ul>

                </div>

                <!-- OPERACIONES -->

<div class="sidebar-group">

    <div
        class="sidebar-group-title"
        onclick="toggleMenu('operacionesMenu')">

        <span>

            OPERACIONES

        </span>

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

                <!-- ADMIN -->

                <div class="sidebar-group">

                    <div
                        class="sidebar-group-title"
                        onclick="toggleMenu('adminMenu')">

                        <span>

                            ADMINISTRACIÓN

                        </span>

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

            <!-- FOOTER -->

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

    }
);

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