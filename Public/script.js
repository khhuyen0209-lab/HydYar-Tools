// ============================================================
// HYDYAR TOOLS — MODULAR SPA
// FULL SCRIPT
// ============================================================


/**
 * ============================================================
 * STATE MANAGEMENT
 * ============================================================
 */

const AppState = {

    currentTool: 'home',

    theme: 'light',

    notes: [],


    init() {

        // ------------------------------------------
        // Theme
        // ------------------------------------------

        const savedTheme =
            localStorage.getItem('app-theme');

        if (savedTheme === 'dark' ||
            savedTheme === 'light') {

            this.theme = savedTheme;

        }


        // ------------------------------------------
        // Notes
        // ------------------------------------------

        try {

            const savedNotes =
                localStorage.getItem('hydyar-notes');

            this.notes =
                savedNotes
                    ? JSON.parse(savedNotes)
                    : [];

        } catch (error) {

            console.warn(
                '⚠️ Không thể đọc notes:',
                error
            );

            this.notes = [];

        }

    },


    saveNotes() {

        try {

            localStorage.setItem(
                'hydyar-notes',
                JSON.stringify(this.notes)
            );

        } catch (error) {

            console.warn(
                '⚠️ Không thể lưu notes:',
                error
            );

        }

    },


    saveTheme() {

        localStorage.setItem(
            'app-theme',
            this.theme
        );

    }

};



/**
 * ============================================================
 * ROUTER
 * ============================================================
 */

const Router = {

    routes: {

        home: '/tools',

        allTools: '/tools/all',

        calculator: '/tools/calculator',

        formatter: '/tools/formatter',

        counter: '/tools/counter',

        notes: '/tools/notes'

    },


    toolInfo: {

        home: {

            title: 'Công cụ',

            icon: 'fa-wrench'

        },


        allTools: {

            title: 'Tất cả công cụ',

            icon: 'fa-toolbox'

        },


        calculator: {

            title: 'Máy tính cơ bản',

            icon: 'fa-calculator'

        },


        formatter: {

            title: 'Định dạng văn bản',

            icon: 'fa-align-left'

        },


        counter: {

            title: 'Đếm kí tự & từ',

            icon: 'fa-text-width'

        },


        notes: {

            title: 'Note nhanh',

            icon: 'fa-sticky-note'

        }

    },


    /**
     * --------------------------------------------------------
     * INIT
     * --------------------------------------------------------
     */

    init() {

        this.homeSection =
            document.getElementById('home-section');


        // ------------------------------------------
        // Navigation cards
        //
        // IMPORTANT:
        // Chỉ .tool-card-link được Router xử lý.
        //
        // Home dùng .home-tool-card riêng.
        // ------------------------------------------

        document
            .querySelectorAll('.tool-card-link')
            .forEach(card => {

                card.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        const toolName =
                            card.dataset.tool;

                        if (!toolName) return;

                        this.showTool(toolName);

                    }
                );

            });


        // ------------------------------------------
        // Back button
        // ------------------------------------------

        const backButton =
            document.getElementById('backToHome');

        if (backButton) {

            backButton.addEventListener(
                'click',
                () => this.back()
            );

        }


        // ------------------------------------------
        // Browser back / forward
        // ------------------------------------------

        window.addEventListener(
            'popstate',
            () => this.handlePopState()
        );


        // ------------------------------------------
        // History
        // ------------------------------------------

        this.initializeHistory();


        // ------------------------------------------
        // Load current URL
        // ------------------------------------------

        this.loadFromURL();

    },


    /**
     * --------------------------------------------------------
     * INITIALIZE HISTORY
     * --------------------------------------------------------
     */

    initializeHistory() {

        const currentPath =
            window.location.pathname;

        const currentTool =
            this.getToolFromPath(currentPath);


        if (!history.state ||
            !history.state.router) {

            history.replaceState(

                {
                    router: true,

                    tool: currentTool,

                    routerRoot: currentTool === 'home'

                },

                '',

                this.routes[currentTool]

            );

        }

    },


    /**
     * --------------------------------------------------------
     * GET TOOL FROM PATH
     * --------------------------------------------------------
     */

    getToolFromPath(path) {

        // ------------------------------------------
        // All Tools
        // ------------------------------------------

        if (
            path === '/tools/all' ||
            path.endsWith('/tools/all/')
        ) {

            return 'allTools';

        }


        // ------------------------------------------
        // Calculator
        // ------------------------------------------

        if (
            path === '/tools/calculator' ||
            path.endsWith('/tools/calculator/')
        ) {

            return 'calculator';

        }


        // ------------------------------------------
        // Formatter
        // ------------------------------------------

        if (
            path === '/tools/formatter' ||
            path.endsWith('/tools/formatter/')
        ) {

            return 'formatter';

        }


        // ------------------------------------------
        // Counter
        // ------------------------------------------

        if (
            path === '/tools/counter' ||
            path.endsWith('/tools/counter/')
        ) {

            return 'counter';

        }


        // ------------------------------------------
        // Notes
        // ------------------------------------------

        if (
            path === '/tools/notes' ||
            path.endsWith('/tools/notes/')
        ) {

            return 'notes';

        }


        // ------------------------------------------
        // Default
        // ------------------------------------------

        return 'home';

    },


    /**
     * --------------------------------------------------------
     * NAVIGATE
     * --------------------------------------------------------
     */

    navigateTo(toolName) {

        if (!this.routes[toolName]) {

            console.warn(
                '⚠️ Route không tồn tại:',
                toolName
            );

            return;

        }


        const targetPath =
            this.routes[toolName];


        // ------------------------------------------
        // Không push duplicate URL
        // ------------------------------------------

        if (
            window.location.pathname === targetPath
        ) {

            this.renderTool(toolName);

            return;

        }


        history.pushState(

            {
                router: true,

                tool: toolName,

                routerRoot: false

            },

            '',

            targetPath

        );


        this.renderTool(toolName);

    },


    /**
     * --------------------------------------------------------
     * BACK
     * --------------------------------------------------------
     */

    back() {

        if (history.state?.routerRoot) {

            return;

        }


        history.back();

    },


    /**
     * --------------------------------------------------------
     * HANDLE POPSTATE
     * --------------------------------------------------------
     */

    handlePopState() {

        const toolName =
            history.state?.tool ||
            this.getToolFromPath(
                window.location.pathname
            );


        this.renderTool(toolName);

    },


    /**
     * --------------------------------------------------------
     * LOAD FROM URL
     * --------------------------------------------------------
     */

    loadFromURL() {

        const toolName =
            this.getToolFromPath(
                window.location.pathname
            );


        this.renderTool(toolName);

    },


    /**
     * --------------------------------------------------------
     * UPDATE HEADER
     * --------------------------------------------------------
     */

    updateHeader(toolName) {

        const titleElement =
            document.getElementById(
                'toolTitle'
            );


        const iconElement =
            document.getElementById(
                'toolTitleIcon'
            );


        const searchButton =
            document.getElementById(
                'headerSearch'
            );


        const info =
            this.toolInfo[toolName] ||
            this.toolInfo.home;


        // ------------------------------------------
        // Title
        // ------------------------------------------

        if (titleElement) {

            titleElement.textContent =
                info.title;

        }


        // ------------------------------------------
        // Icon
        // ------------------------------------------

        if (iconElement) {

            iconElement.className =
                `fas ${info.icon}`;

        }


        // ------------------------------------------
        // Search
        //
        // Search chỉ hiện ở Home.
        // ------------------------------------------

        if (searchButton) {

            searchButton.style.display =
                toolName === 'home'
                    ? ''
                    : 'none';

        }

    },


    /**
     * --------------------------------------------------------
     * RENDER TOOL
     * --------------------------------------------------------
     */

    renderTool(toolName) {

        // ------------------------------------------
        // Safety
        // ------------------------------------------

        if (!this.routes[toolName]) {

            toolName = 'home';

        }


        AppState.currentTool =
            toolName;


        // ------------------------------------------
        // Header
        // ------------------------------------------

        this.updateHeader(toolName);


        // ------------------------------------------
        // Home active state
        // ------------------------------------------

        if (this.homeSection) {

            this.homeSection.classList.toggle(

                'active',

                toolName === 'home'

            );


            this.homeSection.hidden =
                toolName !== 'home';

        }


        // ------------------------------------------
        // Tool sections
        //
        // hidden rất quan trọng vì All Tools HTML
        // đang có hidden mặc định.
        // ------------------------------------------

        document
            .querySelectorAll('.tool-section')
            .forEach(section => {

                const isActive =
                    section.dataset.tool ===
                    toolName;


                section.classList.toggle(
                    'active',
                    isActive
                );


                section.hidden =
                    !isActive;

            });


        // ------------------------------------------
        // Back button
        // ------------------------------------------

        const backButton = document.getElementById('backToHome');

if (backButton) {
    backButton.hidden = toolName === 'home';
}


        // ------------------------------------------
        // Drawer active item
        // ------------------------------------------

        if (
            typeof DrawerManager !== 'undefined'
        ) {

            DrawerManager.updateActiveTool(
                toolName
            );

        }


        // ------------------------------------------
        // Notify modules
        // ------------------------------------------

        document.dispatchEvent(

            new CustomEvent(
                'toolChanged',
                {
                    detail: {
                        tool: toolName
                    }
                }
            )

        );


        // ------------------------------------------
        // Scroll top
        // ------------------------------------------

        window.scrollTo({

            top: 0,

            behavior: 'auto'

        });

    },


    /**
     * --------------------------------------------------------
     * SHOW TOOL
     * --------------------------------------------------------
     */

    showTool(toolName) {

        if (!this.routes[toolName]) {

            console.warn(
                '⚠️ Tool không tồn tại:',
                toolName
            );

            return;

        }


        this.navigateTo(toolName);

    },


    /**
     * --------------------------------------------------------
     * SHOW HOME
     * --------------------------------------------------------
     */

    showHome() {

        if (
            window.location.pathname ===
            this.routes.home
        ) {

            this.renderTool('home');

            return;

        }


        this.showTool('home');

    },



    /**
     * --------------------------------------------------------
     * GO HOME
     * --------------------------------------------------------
     */

    goHome() {

        this.showHome();

    }

};

// ==========================================
// HYDYAR TOOLS — TOOL LOADER
// Modular Dynamic Tool System
// ==========================================

const ToolLoader = {

    // ======================================
    // STATE
    // ======================================

    modules: {},

    loading: {},

    initialized: {},


    // ======================================
    // MODULE PATHS
    // ======================================

    modulePaths: {

        calculator:
            './tools/cal/calculator.js',

        counter:
            './tools/fmt/formatter.js'

    },


    // ======================================
    // LOAD TOOL
    // ======================================

    async init(toolName) {

        // ----------------------------------
        // INVALID TOOL
        // ----------------------------------

        if (!toolName) {

            console.warn(
                '⚠️ ToolLoader: toolName không hợp lệ.'
            );

            return null;
        }


        // ----------------------------------
        // ALREADY INITIALIZED
        // ----------------------------------

        if (
            this.initialized[toolName] &&
            this.modules[toolName]
        ) {

            console.info(
                `♻️ Tool đã được khởi tạo: ${toolName}`
            );

            return this.modules[toolName];
        }


        // ----------------------------------
        // CURRENTLY LOADING
        // ----------------------------------

        if (this.loading[toolName]) {

            console.info(
                `⏳ Tool đang được load: ${toolName}`
            );

            return this.loading[toolName];
        }


        // ----------------------------------
        // MODULE PATH
        // ----------------------------------

        const modulePath =
            this.modulePaths[toolName];


        if (!modulePath) {

            console.error(
                `❌ Không tìm thấy module path cho tool "${toolName}".`
            );

            return null;
        }


        // ==================================
        // CREATE LOADING PROMISE
        // ==================================

        this.loading[toolName] =
            this._loadModule(
                toolName,
                modulePath
            );


        try {

            const module =
                await this.loading[toolName];


            return module;

        } finally {

            delete this.loading[toolName];
        }
    },


    // ======================================
    // INTERNAL MODULE LOADER
    // ======================================

    async _loadModule(
        toolName,
        modulePath
    ) {

        try {

            console.info(
                `📦 Đang load tool: ${toolName}`
            );


            console.info(
                `↳ ${modulePath}`
            );


            // --------------------------------
            // IMPORT MODULE
            // --------------------------------

            const module =
                await import(
                    modulePath
                );


            if (!module) {

                throw new Error(
                    'Module trả về null/undefined.'
                );
            }


            console.info(
                `📥 Module "${toolName}" đã import.`
            );


            // --------------------------------
            // SAVE RAW MODULE
            // --------------------------------

            this.modules[toolName] =
                module;


            // ==================================
            // INITIALIZATION
            // ==================================

            let instance = null;


            // ----------------------------------
            // PRIORITY 1
            // module.init()
            // ----------------------------------

            if (
                typeof module.init ===
                'function'
            ) {

                console.info(
                    `🔧 ${toolName}: gọi module.init()`
                );


                instance =
                    await module.init();
            }


            // ----------------------------------
            // PRIORITY 2
            // default.init()
            // ----------------------------------

            else if (
                module.default &&
                typeof module.default.init ===
                'function'
            ) {

                console.info(
                    `🔧 ${toolName}: gọi default.init()`
                );


                instance =
                    await module.default.init();
            }


            // ----------------------------------
            // PRIORITY 3
            // default function
            // ----------------------------------

            else if (
                typeof module.default ===
                'function'
            ) {

                console.info(
                    `🔧 ${toolName}: gọi default()`
                );


                instance =
                    await module.default();
            }


            // ----------------------------------
            // PRIORITY 4
            // named Tool class
            // ----------------------------------

            else {

                const toolClass =
                    this._findToolClass(
                        module,
                        toolName
                    );


                if (toolClass) {

                    console.info(
                        `🏗️ ${toolName}: tạo instance từ class.`
                    );


                    instance =
                        new toolClass();


                    if (
                        typeof instance.init ===
                        'function'
                    ) {

                        await instance.init();
                    }

                }

            }


            // ==================================
            // INSTANCE HANDLING
            // ==================================

            if (instance) {

                this.modules[toolName] =
                    instance;

            }


            this.initialized[toolName] =
                true;


            console.info(
                `✅ Tool loaded: ${toolName}`
            );


            return this.modules[toolName];


        } catch (error) {

            // --------------------------------
            // CLEAN FAILED STATE
            // --------------------------------

            delete this.modules[toolName];

            this.initialized[toolName] =
                false;


            console.error(
                `❌ Không thể load tool "${toolName}":`,
                error
            );


            console.error(
                `📍 Module path: ${modulePath}`
            );


            return null;
        }
    },


    // ======================================
    // FIND TOOL CLASS
    // ======================================

    _findToolClass(
        module,
        toolName
    ) {

        if (!module) {

            return null;
        }


        // ----------------------------------
        // Common naming
        // ----------------------------------

        const names = [

            `${this._capitalize(toolName)}Tool`,

            `${this._capitalize(toolName)}`,

            'Tool'

        ];


        for (
            const name of names
        ) {

            const candidate =
                module[name];


            if (
                typeof candidate ===
                'function'
            ) {

                return candidate;
            }
        }


        // ----------------------------------
        // Search exported functions/classes
        // ----------------------------------

        for (
            const key of Object.keys(module)
        ) {

            const candidate =
                module[key];


            if (
                typeof candidate !==
                'function'
            ) {

                continue;
            }


            // Tránh lấy init()
            if (
                key === 'init'
            ) {

                continue;
            }


            // Class / constructor heuristic
            if (
                /^[A-Z]/.test(key)
            ) {

                return candidate;
            }
        }


        return null;
    },


    // ======================================
    // CAPITALIZE
    // ======================================

    _capitalize(value) {

        if (!value) {

            return '';
        }


        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );
    },


    // ======================================
    // GET TOOL
    // ======================================

    get(toolName) {

        return (
            this.modules[toolName] ??
            null
        );
    },


    // ======================================
    // CHECK LOADED
    // ======================================

    isLoaded(toolName) {

        return !!(
            this.modules[toolName]
        );
    },


    // ======================================
    // CHECK INITIALIZED
    // ======================================

    isInitialized(toolName) {

        return !!(
            this.initialized[toolName]
        );
    },


    // ======================================
    // UNLOAD
    // ======================================

    unload(toolName) {

        if (!toolName) {

            return;
        }


        delete this.modules[toolName];

        delete this.initialized[toolName];

        delete this.loading[toolName];


        console.info(
            `🗑️ Tool unloaded: ${toolName}`
        );
    },


    // ======================================
    // RELOAD
    // ======================================

    async reload(toolName) {

        this.unload(
            toolName
        );


        return await this.init(
            toolName
        );
    },


    // ======================================
    // LOAD MULTIPLE
    // ======================================

    async initAll(
        toolNames = Object.keys(
            this.modulePaths
        )
    ) {

        const results = {};


        for (
            const toolName of toolNames
        ) {

            results[toolName] =
                await this.init(
                    toolName
                );
        }


        return results;
    }

};



/**
 * ============================================================
 * HEADER BUTTON MANAGER
 * ============================================================
 */

const HeaderButtonManager = {

    buttons: [],


    init() {

        /*
         * ------------------------------------------------------
         * HEADER BUTTONS
         *
         * menuToggle được loại ra vì DrawerManager
         * là nơi duy nhất quản lý click của Menu.
         * ------------------------------------------------------
         */

        this.buttons =
            document.querySelectorAll(

                '.app-header .header-btn:not(#menuToggle), ' +
                '.app-header .avatar-wrapper'

            );


        if (!this.buttons.length) {

            return;

        }


        /*
         * ------------------------------------------------------
         * CLICK EFFECT
         * ------------------------------------------------------
         */

        this.buttons.forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation();


                    /*
                     * Bounce animation
                     */

                    this.playBounce(
                        button
                    );


                    /*
                     * Selected state
                     */

                    this.select(
                        button
                    );

                }
            );

        });


        /*
         * ------------------------------------------------------
         * CLICK OUTSIDE
         * ------------------------------------------------------
         */

        document.addEventListener(
            'click',
            event => {

                const clickedButton =
                    Array.from(
                        this.buttons
                    ).some(
                        button =>
                            button.contains(
                                event.target
                            )
                    );


                if (!clickedButton) {

                    this.buttons.forEach(
                        button => {

                            button.classList.remove(
                                'is-selected'
                            );

                        }
                    );

                }

            }
        );

    },


    /**
     * --------------------------------------------------------
     * BOUNCE
     * --------------------------------------------------------
     */

    playBounce(button) {

        button.classList.remove(
            'click-bounce'
        );


        /*
         * Force reflow
         *
         * Cho phép animation chạy lại
         * ngay cả khi click liên tục.
         */

        void button.offsetWidth;


        button.classList.add(
            'click-bounce'
        );

    },


    /**
     * --------------------------------------------------------
     * SELECT
     * --------------------------------------------------------
     */

    select(button) {

        this.buttons.forEach(
            otherButton => {

                if (
                    otherButton !== button
                ) {

                    otherButton.classList.remove(
                        'is-selected'
                    );

                }

            }
        );


        button.classList.add(
            'is-selected'
        );

    }

};



/**
 * ============================================================
 * THEME MANAGER
 * ============================================================
 */

const ThemeManager = {

    toggleBtn: null,

    duration: 550,


    init() {

        this.toggleBtn =
            document.getElementById(
                'themeToggle'
            );


        if (!this.toggleBtn) {

            console.warn(
                '⚠️ Không tìm thấy themeToggle'
            );

            return;

        }


        this.applyInitialTheme(
            AppState.theme
        );


        this.toggleBtn.addEventListener(
            'click',
            () => this.toggle()
        );

    },


    /**
     * --------------------------------------------------------
     * INITIAL THEME
     * --------------------------------------------------------
     */

    applyInitialTheme(theme) {

        this.updateButtonIcon(
            theme
        );

        this.applyTheme(
            theme
        );

    },


    /**
     * --------------------------------------------------------
     * TOGGLE
     * --------------------------------------------------------
     */

    toggle() {

        if (
            this.toggleBtn.classList.contains(
                'switching'
            )
        ) {

            return;

        }


        const newTheme =
            AppState.theme === 'light'
                ? 'dark'
                : 'light';


        /*
         * Start animation
         */

        this.toggleBtn.classList.add(
            'switching'
        );


        this.toggleBtn.classList.add(

            newTheme === 'dark'
                ? 'switching-dark'
                : 'switching-light'

        );


        /*
         * Update icon
         */

        this.updateButtonIcon(
            newTheme
        );


        /*
         * Apply theme
         */

        this.applyTheme(
            newTheme
        );


        AppState.theme =
            newTheme;


        AppState.saveTheme();


        /*
         * Remove animation classes
         */

        setTimeout(() => {

            this.toggleBtn.classList.remove(

                'switching',

                'switching-dark',

                'switching-light'

            );

        }, this.duration);

    },


    /**
     * --------------------------------------------------------
     * APPLY THEME
     * --------------------------------------------------------
     */

    applyTheme(theme) {

        if (
            theme === 'dark'
        ) {

            document.documentElement
                .setAttribute(
                    'data-theme',
                    'dark'
                );

        } else {

            document.documentElement
                .removeAttribute(
                    'data-theme'
                );

        }

    },


    /**
     * --------------------------------------------------------
     * ICON
     * --------------------------------------------------------
     */

    updateButtonIcon(theme) {

        if (!this.toggleBtn) {

            return;

        }


        const moon =
            this.toggleBtn.querySelector(
                '.theme-moon'
            );


        const sun =
            this.toggleBtn.querySelector(
                '.theme-sun'
            );


        /*
         * Nếu HTML dùng moon/sun riêng
         */

        if (moon && sun) {

            if (
                theme === 'dark'
            ) {

                moon.style.opacity =
                    '0';

                sun.style.opacity =
                    '1';

            } else {

                moon.style.opacity =
                    '1';

                sun.style.opacity =
                    '0';

            }

            return;

        }


        /*
         * Fallback nếu HTML chỉ có <i>
         */

        const icon =
            this.toggleBtn.querySelector(
                'i'
            );


        if (!icon) {

            return;

        }


        icon.className =
            theme === 'dark'
                ? 'fas fa-sun'
                : 'fas fa-moon';

    }

};



/**
 * ============================================================
 * NOTES TOOL
 * ============================================================
 */

const NotesTool = {

    initialized: false,


    init() {

        if (this.initialized) {

            return;

        }


        this.initialized = true;


        document.addEventListener(
            'toolChanged',
            event => {

                if (
                    event.detail?.tool ===
                    'notes'
                ) {

                    this.render();

                }

            }
        );


        this.render();

    },


    render() {

        // ------------------------------------------
        // Tìm container
        // ------------------------------------------

        const section =
            document.querySelector(
                '[data-tool="notes"]'
            );


        if (!section) {

            return;

        }


        // ------------------------------------------
        // Nếu HTML đã có UI notes riêng
        // thì không render đè.
        // ------------------------------------------

        const textarea =
            section.querySelector(
                'textarea'
            );


        if (!textarea) {

            return;

        }


        // ------------------------------------------
        // Restore
        // ------------------------------------------

        if (
            document.activeElement !==
            textarea
        ) {

            textarea.value =
                AppState.notes
                    .map(note => note.text || '')
                    .join('\n');

        }


        // ------------------------------------------
        // Save
        // ------------------------------------------

        if (
            textarea.dataset.notesBound ===
            'true'
        ) {

            return;

        }


        textarea.dataset.notesBound =
            'true';


        textarea.addEventListener(
            'input',
            () => {

                AppState.notes = [

                    {
                        text: textarea.value,

                        updatedAt:
                            Date.now()

                    }

                ];


                AppState.saveNotes();

            }
        );

    }

};



/**
 * ============================================================
 * SEARCH MANAGER
 * ============================================================
 */

const SearchManager = {

    init() {

        this.searchOverlay =
            document.getElementById(
                'searchOverlay'
            );


        this.searchInput =
            document.getElementById(
                'toolSearchInput'
            );


        this.searchClose =
            document.getElementById(
                'searchClose'
            );


        if (this.searchInput) {

            this.searchInput.addEventListener(
                'input',
                () => this.search(
                    this.searchInput.value
                )
            );

        }


        if (this.searchClose) {

            this.searchClose.addEventListener(
                'click',
                () => this.close()
            );

        }


        document.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Escape'
                ) {

                    this.close();

                }

            }
        );

    },


    /**
     * --------------------------------------------------------
     * OPEN
     * --------------------------------------------------------
     */

    open() {

        if (!this.searchOverlay) {

            return;

        }


        this.searchOverlay.classList.add(
            'open'
        );


        this.searchOverlay.setAttribute(
            'aria-hidden',
            'false'
        );


        setTimeout(() => {

            this.searchInput?.focus();

        }, 50);

    },


    /**
     * --------------------------------------------------------
     * CLOSE
     * --------------------------------------------------------
     */

    close() {

        if (!this.searchOverlay) {

            return;

        }


        this.searchOverlay.classList.remove(
            'open'
        );


        this.searchOverlay.setAttribute(
            'aria-hidden',
            'true'
        );


        if (this.searchInput) {

            this.searchInput.value = '';

            this.search('');

        }

    },


    /**
     * --------------------------------------------------------
     * SEARCH
     * --------------------------------------------------------
     */

    search(query) {

        const normalized =
            query
                .trim()
                .toLowerCase();


        // ------------------------------------------
        // Search Home cards
        //
        // Home dùng .home-tool-card
        // ------------------------------------------

        document
            .querySelectorAll(
                '.home-tool-card'
            )
            .forEach(card => {

                const title =
                    card.querySelector('h3')
                        ?.textContent
                        ?.toLowerCase() || '';


                const description =
                    card.querySelector('p')
                        ?.textContent
                        ?.toLowerCase() || '';


                const matched =
                    !normalized ||
                    title.includes(normalized) ||
                    description.includes(normalized);


                card.style.display =
                    matched
                        ? ''
                        : 'none';

            });


        // ------------------------------------------
        // Search All Tools cards
        //
        // All Tools dùng:
        // .tool-card.tool-card-link
        // ------------------------------------------

        document
            .querySelectorAll(
                '#allToolsSection .tool-card-link'
            )
            .forEach(card => {

                const title =
                    card.querySelector('h3')
                        ?.textContent
                        ?.toLowerCase() || '';


                const description =
                    card.querySelector('p')
                        ?.textContent
                        ?.toLowerCase() || '';


                const matched =
                    !normalized ||
                    title.includes(normalized) ||
                    description.includes(normalized);


                card.style.display =
                    matched
                        ? ''
                        : 'none';

            });

    }

};



/**
 * ============================================================
 * DRAWER MANAGER
 * ============================================================
 */

const DrawerManager = {

    drawer: null,

    overlay: null,

    menuButton: null,

    closeButton: null,


    /**
     * --------------------------------------------------------
     * INIT
     * --------------------------------------------------------
     */

    init() {

        this.drawer =
            document.getElementById(
                'appDrawer'
            );


        this.overlay =
            document.getElementById(
                'drawerOverlay'
            );


        this.menuButton =
            document.getElementById(
                'menuToggle'
            );


        this.closeButton =
            document.getElementById(
                'drawerClose'
            );


        if (!this.drawer) {

            return;

        }


        // ------------------------------------------
        // Menu button
        // ------------------------------------------

        this.menuButton?.addEventListener(
            'click',
            () => this.toggle()
        );


        // ------------------------------------------
        // Close
        // ------------------------------------------

        this.closeButton?.addEventListener(
            'click',
            () => this.close()
        );


        // ------------------------------------------
        // Overlay
        // ------------------------------------------

        this.overlay?.addEventListener(
            'click',
            () => this.close()
        );


        // ------------------------------------------
        // ESC
        // ------------------------------------------

        document.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Escape' &&
                    this.isOpen()
                ) {

                    this.close();

                }

            }
        );


        // ------------------------------------------
        // Navigation
        // ------------------------------------------

        this.bindNavigation();


        // ------------------------------------------
        // Initial state
        // ------------------------------------------

        this.updateAccessibility();

    },


    /**
     * --------------------------------------------------------
     * OPEN
     * --------------------------------------------------------
     */

    open() {

        if (!this.drawer) {

            return;

        }


        this.drawer.classList.add(
            'open'
        );


        this.overlay?.classList.add(
            'open'
        );


        document.body.classList.add(
            'drawer-open'
        );


        this.updateAccessibility();

    },


    /**
     * --------------------------------------------------------
     * CLOSE
     * --------------------------------------------------------
     */

    close() {

        if (!this.drawer) {

            return;

        }


        this.drawer.classList.remove(
            'open'
        );


        this.overlay?.classList.remove(
            'open'
        );


        document.body.classList.remove(
            'drawer-open'
        );


        this.updateAccessibility();

    },


    /**
     * --------------------------------------------------------
     * TOGGLE
     * --------------------------------------------------------
     */

    toggle() {

        if (this.isOpen()) {

            this.close();

        } else {

            this.open();

        }

    },


    /**
     * --------------------------------------------------------
     * IS OPEN
     * --------------------------------------------------------
     */

    isOpen() {

        return this.drawer?.classList.contains(
            'open'
        ) || false;

    },


    /**
     * --------------------------------------------------------
     * BIND NAVIGATION
     * --------------------------------------------------------
     */

    bindNavigation() {

        // ------------------------------------------
        // Tool buttons
        // ------------------------------------------

        this.drawer
            ?.querySelectorAll(
                '[data-drawer-tool]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const tool =
                            button.dataset.drawerTool;

                        if (!tool) return;

                        this.setActive(button);

                        Router.showTool(tool);

                        this.close();

                    }
                );

            });


        // ------------------------------------------
        // Actions
        // ------------------------------------------

        this.drawer
            ?.querySelectorAll(
                '[data-drawer-action]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const action =
                            button.dataset.drawerAction;

                        this.handleAction(
                            action,
                            button
                        );

                        this.close();

                    }
                );

            });

    },


    /**
     * --------------------------------------------------------
     * HANDLE ACTION
     * --------------------------------------------------------
     */

    handleAction(action, button) {

        switch (action) {

            // --------------------------------------
            // HOME
            // --------------------------------------

            case 'home':

                this.setActive(button);

                Router.showHome();

                break;


            // --------------------------------------
            // TOOLS
            //
            // Drawer "Công cụ"
            // → All Tools
            // --------------------------------------

            case 'tools':

                this.setActive(button);

                Router.showTool(
                    'allTools'
                );

                break;


            // --------------------------------------
            // RECENT
            // --------------------------------------

            case 'recent':

                this.setActive(button);

                Router.showHome();


                setTimeout(() => {

                    document
                        .querySelector(
                            '.home-recent'
                        )
                        ?.scrollIntoView({

                            behavior: 'smooth',

                            block: 'start'

                        });

                }, 50);

                break;


            // --------------------------------------
            // SETTINGS
            // --------------------------------------

            case 'settings':

                console.info(
                    '⚙️ Settings chưa được triển khai.'
                );

                break;


            // --------------------------------------
            // ABOUT
            // --------------------------------------

            case 'about':

                console.info(
                    'ℹ️ About chưa được triển khai.'
                );

                break;


            // --------------------------------------
            // DEFAULT
            // --------------------------------------

            default:

                console.warn(
                    '⚠️ Drawer action không tồn tại:',
                    action
                );

        }

    },


    /**
     * --------------------------------------------------------
     * SET ACTIVE
     * --------------------------------------------------------
     */

    setActive(button) {

        if (!this.drawer || !button) {

            return;

        }


        this.drawer
            .querySelectorAll(
                '.drawer-item'
            )
            .forEach(item => {

                item.classList.remove(
                    'active'
                );

            });


        button.classList.add(
            'active'
        );

    },


    /**
     * --------------------------------------------------------
     * UPDATE ACTIVE TOOL
     * --------------------------------------------------------
     */

    updateActiveTool(toolName) {

        if (!this.drawer) {

            return;

        }


        // ------------------------------------------
        // Remove old active
        // ------------------------------------------

        this.drawer
            .querySelectorAll(
                '.drawer-item'
            )
            .forEach(item => {

                item.classList.remove(
                    'active'
                );

            });


        // ------------------------------------------
        // Tool item
        // ------------------------------------------

        const toolButton =
            this.drawer.querySelector(
                `[data-drawer-tool="${toolName}"]`
            );


        if (toolButton) {

            toolButton.classList.add(
                'active'
            );

            return;

        }


        // ------------------------------------------
        // Home
        // ------------------------------------------

        if (toolName === 'home') {

            this.drawer
                .querySelector(
                    '[data-drawer-action="home"]'
                )
                ?.classList.add(
                    'active'
                );

            return;

        }


        // ------------------------------------------
        // All Tools
        // ------------------------------------------

        if (toolName === 'allTools') {

            this.drawer
                .querySelector(
                    '[data-drawer-action="tools"]'
                )
                ?.classList.add(
                    'active'
                );

        }

    },


    /**
     * --------------------------------------------------------
     * ACCESSIBILITY
     * --------------------------------------------------------
     */

    updateAccessibility() {

        const open =
            this.isOpen();


        this.drawer?.setAttribute(
            'aria-hidden',
            String(!open)
        );


        this.overlay?.setAttribute(
            'aria-hidden',
            String(!open)
        );


        this.menuButton?.setAttribute(
            'aria-expanded',
            String(open)
        );

    }

};



/**
 * ============================================================
 * HOME TOOL CARD MANAGER
 * ============================================================
 *
 * IMPORTANT:
 *
 * Home:
 *     .home-tool-card
 *
 * All Tools:
 *     .tool-card.tool-card-link
 *
 * Hai hệ này KHÔNG dùng chung event click.
 * ============================================================
 */

const HomeToolCardManager = {

    init() {

        // ------------------------------------------
        // Home tool cards
        // ------------------------------------------

        document
            .querySelectorAll(
                '.home-tool-card'
            )
            .forEach(card => {

                card.addEventListener(
                    'click',
                    event => {

                        // Không trigger nếu click
                        // vào một link/button con
                        // có logic riêng.

                        if (
                            event.target.closest(
                                'a, button'
                            )
                        ) {

                            return;

                        }


                        const toolName =
                            card.dataset.tool;


                        if (!toolName) {

                            return;

                        }


                        Router.showTool(
                            toolName
                        );

                    }
                );


                // ----------------------------------
                // Keyboard accessibility
                // ----------------------------------

                card.addEventListener(
                    'keydown',
                    event => {

                        if (
                            event.key !== 'Enter' &&
                            event.key !== ' '
                        ) {

                            return;

                        }


                        event.preventDefault();


                        const toolName =
                            card.dataset.tool;


                        if (!toolName) {

                            return;

                        }


                        Router.showTool(
                            toolName
                        );

                    }
                );


            });


        // ------------------------------------------
        // Explore tools
        // ------------------------------------------

        const exploreButton =
            document.getElementById(
                'homeExploreTools'
            );


        exploreButton?.addEventListener(
            'click',
            () => {

                document
                    .querySelector(
                        '.home-tools'
                    )
                    ?.scrollIntoView({

                        behavior: 'smooth',

                        block: 'start'

                    });

            }
        );


        // ------------------------------------------
        // See All
        // ------------------------------------------

        const seeAllButton =
            document.getElementById(
                'homeSeeAllTools'
            );


        seeAllButton?.addEventListener(
            'click',
            () => {

                Router.showTool(
                    'allTools'
                );

            }
        );

    }

};



/**
 * ============================================================
 * APP
 * ============================================================
 */

const App = {

    async init() {

        console.log(
            '🚀 HydYar Tools đang khởi động...'
        );


        // ------------------------------------------
        // State
        // ------------------------------------------

        AppState.init();


        // ------------------------------------------
        // Router
        // ------------------------------------------

        Router.init();


        // ------------------------------------------
        // Header
        // ------------------------------------------

        HeaderButtonManager.init();


        // ------------------------------------------
        // Theme
        // ------------------------------------------

        ThemeManager.init();


        // ------------------------------------------
        // Load calculator
        // ------------------------------------------

        await ToolLoader.init(
            'calculator'
        );


        // ------------------------------------------
        // Load formatter / counter
        // ------------------------------------------

        await ToolLoader.init(
            'counter'
        );


        // ------------------------------------------
        // Notes
        // ------------------------------------------

        NotesTool.init();


        // ------------------------------------------
        // Search
        // ------------------------------------------

        SearchManager.init();


        // ------------------------------------------
        // Drawer
        // ------------------------------------------

        DrawerManager.init();


        // ------------------------------------------
        // Home cards
        // ------------------------------------------

        HomeToolCardManager.init();


        // ------------------------------------------
        // Final active drawer state
        // ------------------------------------------

        DrawerManager.updateActiveTool(
            AppState.currentTool
        );


        console.log(
            '✅ HydYar Tools ready.'
        );

    }

};



/**
 * ============================================================
 * START APP
 * ============================================================
 */

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        () => App.init()
    );

} else {

    App.init();

}



/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {

    AppState,

    Router,

    ToolLoader,

    HeaderButtonManager,

    ThemeManager,

    NotesTool,

    SearchManager,

    DrawerManager,

    HomeToolCardManager

};