document.addEventListener('DOMContentLoaded', () => {
    if (!window.KhaironAuth || !KhaironAuth.requirePage()) return;

    const currentUser = KhaironAuth.getCurrentUser();
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar || !currentUser) return;

    const collapseKey = 'khaironSidebarCollapsed';
    const isCollapsed = localStorage.getItem(collapseKey) === 'true';
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);

    const currentPage = window.location.pathname.split('/').pop();
    const groups = ['Inventarios', 'Operaciones', 'Administracion'];
    const allowedModules = KhaironAuth.modules.filter(module =>
        KhaironAuth.hasPermission(module.key, currentUser)
    );

    sidebar.innerHTML = `
        <aside class="sidebar">
            <div>
                <div class="sidebar-header sidebar-header-row">
                    <div class="sidebar-logo">
                        <div class="sidebar-logo-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
                        <div class="sidebar-brand-copy"><h3>KHAIRON</h3><span>WMS Platform</span></div>
                    </div>
                    <button class="sidebar-toggle" type="button" id="sidebarToggle" title="Ocultar menu" aria-label="Ocultar menu">
                        <i class="fa-solid fa-angles-left"></i>
                    </button>
                </div>
                <nav id="authorizedNavigation" aria-label="Navegacion principal"></nav>
            </div>
            <div class="sidebar-footer">
                <div class="sidebar-user-summary">
                    <strong></strong>
                    <span></span>
                </div>
                <div class="sidebar-logout">
                    <button class="logout-btn" type="button" id="logoutButton">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Cerrar Sesion</span>
                    </button>
                </div>
                <div class="system-status"><div class="status-dot"></div><span>Sistema Operativo</span></div>
            </div>
        </aside>
    `;

    const navigation = document.getElementById('authorizedNavigation');
    groups.forEach(group => {
        const groupModules = allowedModules.filter(module => module.group === group);
        if (!groupModules.length) return;

        const section = document.createElement('section');
        section.className = 'sidebar-group';
        const menuId = `menu-${group.toLowerCase()}`;

        const title = document.createElement('button');
        title.type = 'button';
        title.className = 'sidebar-group-title';
        title.setAttribute('aria-controls', menuId);
        title.setAttribute('aria-expanded', 'true');
        title.innerHTML = '<span></span><i class="fa-solid fa-chevron-down"></i>';
        title.querySelector('span').textContent = group.toUpperCase();

        const list = document.createElement('ul');
        list.id = menuId;
        list.className = 'sidebar-menu open';

        groupModules.forEach(module => {
            const item = document.createElement('li');
            if (currentPage === module.page) item.className = 'active';

            const link = document.createElement('a');
            link.href = module.page;
            link.title = module.label;
            link.innerHTML = `<i class="fa-solid ${module.icon}"></i><span></span>`;
            link.querySelector('span').textContent = module.label;
            item.appendChild(link);
            list.appendChild(item);
        });

        title.addEventListener('click', () => {
            list.classList.toggle('open');
            title.setAttribute('aria-expanded', String(list.classList.contains('open')));
        });

        section.append(title, list);
        navigation.appendChild(section);
    });

    sidebar.querySelector('.sidebar-user-summary strong').textContent = currentUser.name;
    sidebar.querySelector('.sidebar-user-summary span').textContent = currentUser.roleName;
    document.getElementById('logoutButton').addEventListener('click', () => KhaironAuth.logout());

    const toggleButton = document.getElementById('sidebarToggle');
    const syncToggle = () => {
        const collapsed = document.body.classList.contains('sidebar-collapsed');
        toggleButton.title = collapsed ? 'Mostrar menu' : 'Ocultar menu';
        toggleButton.setAttribute('aria-label', toggleButton.title);
        toggleButton.querySelector('i').className = collapsed
            ? 'fa-solid fa-angles-right'
            : 'fa-solid fa-angles-left';
    };
    toggleButton.addEventListener('click', () => {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem(collapseKey, String(collapsed));
        syncToggle();
    });
    syncToggle();

    document.querySelectorAll('.user-box').forEach(box => {
        if (box.id !== 'currentUserBox') box.textContent = `${currentUser.name} · ${currentUser.roleName}`;
    });

    const message = sessionStorage.getItem('khaironAccessMessage');
    if (message) {
        sessionStorage.removeItem('khaironAccessMessage');
        setTimeout(() => alert(message), 50);
    }
});
