// ==========================================
// HYDYAR TOOLS - MODULAR SPA
// ==========================================


/**
 * ==========================================
 * STATE MANAGEMENT
 * ==========================================
 */

const AppState = {

    currentTool: 'home',

    theme: 'light',

    notes: [],


    init() {

        // Theme
        const savedTheme =
            localStorage.getItem('app-theme');

        if (
            savedTheme === 'dark' ||
            savedTheme === 'light'
        ) {
            this.theme = savedTheme;
        }


        // Notes
        const savedNotes =
            localStorage.getItem('app-notes');

        if (savedNotes) {

            try {

                const parsedNotes =
                    JSON.parse(savedNotes);

                if (Array.isArray(parsedNotes)) {
                    this.notes = parsedNotes;
                }

            } catch (error) {

                console.warn(
                    '⚠️ Không thể đọc notes:',
                    error
                );

                this.notes = [];
            }
        }
    },


    saveNotes() {

        localStorage.setItem(
            'app-notes',
            JSON.stringify(this.notes)
        );
    },


    saveTheme() {

        localStorage.setItem(
            'app-theme',
            this.theme
        );
    }
};


/**
 * ==========================================
 * ROUTER
 * ==========================================
 */

const Router = {

    homeSection: null,


    routes: {

    home:
        '/tools',

    allTools:
        '/tools/all',

    calculator:
        '/tools/calculator',

    formatter:
        '/tools/formatter',

    counter:
        '/tools/counter',

    notes:
        '/tools/notes'
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


    init() {

        this.homeSection =
            document.getElementById(
                'home-section'
            );


        /*
         * Tool cards
         */

        document
            .querySelectorAll('.tool-card-link')
            .forEach(card => {

                card.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        const toolName =
                            card.dataset.tool;


                        if (toolName) {

                            this.navigateTo(
                                toolName
                            );
                        }
                    }
                );
            });


        /*
         * App Back
         */

        const backBtn =
            document.getElementById(
                'backToHome'
            );


        if (backBtn) {

            backBtn.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    this.back();
                }
            );
        }


        /*
         * Browser Back / Forward
         */

        window.addEventListener(
            'popstate',
            event => {

                this.handlePopState(
                    event
                );
            }
        );


        /*
         * History
         */

        this.initializeHistory();


        /*
         * Load URL
         */

        this.loadFromURL();
    },


    initializeHistory() {

        const currentPath =
            window.location.pathname;


        const currentTool =
            this.getToolFromPath(
                currentPath
            );


        if (
            history.state &&
            history.state.hydyarRouter
        ) {

            return;
        }


        history.replaceState(

            {

                hydyarRouter: true,

                tool: currentTool,

                routerRoot: true

            },

            '',

            currentPath
        );
    },


    getToolFromPath(path) {

        if (
            path.includes('/calculator')
        ) {

            return 'calculator';
        }


        if (
            path.includes('/formatter')
        ) {

            return 'formatter';
        }


        if (
            path.includes('/counter')
        ) {

            return 'counter';
        }


        if (
            path.includes('/notes')
        ) {

            return 'notes';
        }


        return 'home';
    },


    navigateTo(toolName) {

        const newURL =
            this.routes[toolName];


        if (!newURL) {

            console.warn(
                '⚠️ Route không tồn tại:',
                toolName
            );

            return;
        }


        if (
            window.location.pathname ===
            newURL
        ) {

            return;
        }


        history.pushState(

            {

                hydyarRouter: true,

                tool: toolName,

                routerRoot: false

            },

            '',

            newURL
        );


        this.renderTool(
            toolName,
            true
        );
    },


    back() {

        history.back();
    },


    handlePopState(event) {

        const state =
            event.state;


        if (
            state &&
            state.hydyarRouter
        ) {

            const toolName =
                state.tool || 'home';


            this.renderTool(
                toolName,
                true
            );


            return;
        }

        /*
         * Không thuộc Router.
         *
         * Browser sẽ tiếp tục quay
         * ra trang trước.
         */
    },


    loadFromURL() {

        const path =
            window.location.pathname;


        const toolName =
            this.getToolFromPath(
                path
            );


        this.renderTool(
            toolName,
            false
        );
    },


    updateHeader(toolName) {

        const searchContent =
            document.getElementById(
                'headerSearchContent'
            );


        const toolContent =
            document.getElementById(
                'headerToolContent'
            );


        const toolNameElement =
            document.getElementById(
                'headerToolName'
            );


        const toolIcon =
            document.getElementById(
                'headerToolIcon'
            );


        if (
            !searchContent ||
            !toolContent ||
            !toolNameElement ||
            !toolIcon
        ) {

            return;
        }


        /*
         * HOME
         */

        if (
            toolName === 'home'
        ) {

            searchContent.style.display =
                'flex';

            toolContent.style.display =
                'none';

            return;
        }


        /*
         * TOOL
         */

        const info =
            this.toolInfo[toolName];


        if (!info) {
            return;
        }


        searchContent.style.display =
            'none';

        toolContent.style.display =
            'flex';


        toolNameElement.textContent =
            info.title;


        toolIcon.className =
            `fas ${info.icon}`;
    },


    renderTool(
        toolName,
        dispatchEvent = true
    ) {

        if (!this.homeSection) {
            return;
        }


        AppState.currentTool =
            toolName;


        /*
         * Header
         */

        this.updateHeader(
            toolName
        );


        /*
         * HOME
         */

        if (
            toolName === 'home'
        ) {

            this.homeSection.classList.add(
                'active'
            );

        } else {

            this.homeSection.classList.remove(
                'active'
            );
        }


        /*
         * TOOL SECTIONS
         */

        document
            .querySelectorAll('.tool-section')
            .forEach(section => {

                section.classList.toggle(

                    'active',

                    section.dataset.tool ===
                    toolName
                );
            });


        /*
         * BACK BUTTON
         */

        const backBtn =
            document.getElementById(
                'backToHome'
            );


        if (backBtn) {

            const state =
                history.state;


            const isRoot =
                state &&
                state.hydyarRouter &&
                state.routerRoot;


            backBtn.style.display =
                isRoot
                    ? 'none'
                    : 'flex';
        }


        /*
         * TOOL CHANGED EVENT
         */

        if (dispatchEvent) {

            window.dispatchEvent(

                new CustomEvent(
                    'toolChanged',
                    {
                        detail: toolName
                    }
                )
            );
        }


        /*
         * Scroll
         */

        window.scrollTo(0, 0);
    },


    showTool(
        toolName,
        dispatchEvent = true
    ) {

        const targetURL =
            this.routes[toolName];


        if (!targetURL) {
            return;
        }


        if (
            window.location.pathname ===
            targetURL
        ) {

            this.renderTool(
                toolName,
                dispatchEvent
            );

            return;
        }


        this.navigateTo(
            toolName
        );
    },


    goHome() {

        if (
            AppState.currentTool ===
            'home'
        ) {

            return;
        }


        this.back();
    },


    showHome(
        dispatchEvent = true
    ) {

        if (
            AppState.currentTool ===
            'home'
        ) {

            this.renderTool(
                'home',
                dispatchEvent
            );

            return;
        }


        this.back();
    }
};


/**
 * ==========================================
 * TOOL MODULE LOADER
 * ==========================================
 *
 * Script chính KHÔNG quản lý logic
 * bên trong từng tool.
 *
 * Mỗi tool tự quản lý module của nó.
 *
 * Calculator:
 * tools/cal/calculator.js
 *
 * Counter + Formatter:
 * tools/fmt/formatter.js
 *
 * ==========================================
 */

const ToolLoader = {

    modules: {},


    /*
     * ======================================
     * TOOL MODULES
     * ======================================
     */

    modulePaths: {

        calculator:
            './tools/cal/calculator.js',

        counter:
            './tools/fmt/formatter.js'

    },


    /*
     * ======================================
     * LOAD
     * ======================================
     */

    async load(toolName) {

        const path =
            this.modulePaths[toolName];


        /*
         * Không có module riêng
         */

        if (!path) {
            return null;
        }


        /*
         * Đã load
         */

        if (
            this.modules[toolName]
        ) {

            return this.modules[toolName];

        }


        try {

            const module =
                await import(path);


            this.modules[toolName] =
                module;


            console.log(
                `📦 Đã load tool: ${toolName}`
            );


            return module;

        } catch (error) {

            console.error(
                `❌ Không thể load tool "${toolName}":`,
                error
            );

            return null;

        }

    },


    /*
     * ======================================
     * INIT TOOL
     * ======================================
     */

    async init(toolName) {

        const module =
            await this.load(
                toolName
            );


        if (!module) {
            return;
        }


        /*
         * Ưu tiên default export
         */

        const tool =
            module.default ||
            module[
                `${this.capitalize(toolName)}Tool`
            ];


        if (
            tool &&
            typeof tool.init ===
            'function'
        ) {

            tool.init();

            return;

        }


        /*
         * Module có hàm init riêng
         */

        if (
            typeof module.init ===
            'function'
        ) {

            module.init();

            return;

        }


        console.warn(
            `⚠️ Tool "${toolName}" không có init()`
        );

    },


    /*
     * ======================================
     * CAPITALIZE
     * ======================================
     */

    capitalize(text) {

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }

};


/**
 * ==========================================
 * HEADER BUTTON MANAGER
 * ==========================================
 */

const HeaderButtonManager = {

    buttons: [],


    init() {

        this.buttons =
            document.querySelectorAll(

                '.app-header .header-btn, ' +
                '.app-header .avatar-wrapper'

            );


        if (!this.buttons.length) {
            return;
        }


        this.buttons.forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation();


                    this.playBounce(
                        button
                    );


                    this.select(
                        button
                    );
                }
            );
        });


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


    playBounce(button) {

        button.classList.remove(
            'click-bounce'
        );


        void button.offsetWidth;


        button.classList.add(
            'click-bounce'
        );
    },


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
 * ==========================================
 * THEME MANAGER
 * ==========================================
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


    applyInitialTheme(theme) {

        this.updateButtonIcon(theme);

        this.applyTheme(theme);
    },


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


        this.toggleBtn.classList.add(
            'switching'
        );


        this.toggleBtn.classList.add(

            newTheme === 'dark'
                ? 'switching-dark'
                : 'switching-light'

        );


        this.updateButtonIcon(
            newTheme
        );


        this.applyTheme(
            newTheme
        );


        AppState.theme =
            newTheme;

        AppState.saveTheme();


        setTimeout(() => {

            this.toggleBtn.classList.remove(

                'switching',

                'switching-dark',

                'switching-light'

            );

        }, this.duration);
    },


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


        if (
            !moon ||
            !sun
        ) {

            return;
        }


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
    }
};



/**
 * ==========================================
 * NOTES
 * ==========================================
 */

const NotesTool = {

    input: null,

    container: null,


    init() {

        this.input =
            document.getElementById(
                'noteInput'
            );


        this.container =
            document.getElementById(
                'notesContainer'
            );


        if (
            !this.input ||
            !this.container
        ) {

            console.warn(
                '⚠️ Không tìm thấy Notes'
            );

            return;
        }


        this.bindEvents();

        this.renderNotes();
    },


    bindEvents() {

        const saveBtn =
            document.getElementById(
                'saveNote'
            );


        const clearBtn =
            document.getElementById(
                'clearNote'
            );


        if (saveBtn) {

            saveBtn.addEventListener(
                'click',
                () => this.saveNote()
            );
        }


        if (clearBtn) {

            clearBtn.addEventListener(
                'click',
                () => this.clearInput()
            );
        }
    },


    saveNote() {

        const text =
            this.input.value.trim();


        if (!text) {
            return;
        }


        AppState.notes.push({

            id:
                Date.now(),

            text:
                text,

            createdAt:
                new Date()
                    .toLocaleString(
                        'vi-VN'
                    )
        });


        AppState.saveNotes();

        this.renderNotes();

        this.clearInput();
    },


    deleteNote(id) {

        AppState.notes =
            AppState.notes.filter(
                note =>
                    note.id !== id
            );


        AppState.saveNotes();

        this.renderNotes();
    },


    renderNotes() {

        this.container.innerHTML =
            '';


        AppState.notes.forEach(
            note => {

                const li =
                    document.createElement(
                        'li'
                    );


                const noteText =
                    document.createElement(
                        'div'
                    );


                noteText.className =
                    'note-text';


                const date =
                    document.createElement(
                        'small'
                    );


                date.textContent =
                    note.createdAt;


                date.style.color =
                    'var(--text-secondary)';


                date.style.fontSize =
                    '0.8rem';


                const text =
                    document.createElement(
                        'p'
                    );


                text.textContent =
                    note.text;


                noteText.appendChild(
                    date
                );


                noteText.appendChild(
                    text
                );


                const deleteBtn =
                    document.createElement(
                        'button'
                    );


                deleteBtn.className =
                    'note-delete';


                deleteBtn.dataset.id =
                    note.id;


                deleteBtn.innerHTML =
                    '<i class="fas fa-trash"></i>';


                deleteBtn.addEventListener(
                    'click',
                    () => {

                        this.deleteNote(
                            note.id
                        );
                    }
                );


                li.appendChild(
                    noteText
                );


                li.appendChild(
                    deleteBtn
                );


                this.container.appendChild(
                    li
                );
            }
        );
    },


    clearInput() {

        this.input.value =
            '';
    }
};


/**
 * ==========================================
 * SEARCH
 * ==========================================
 */

const SearchManager = {

    init() {

        const input =
            document.querySelector(
                '.search-input'
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            'input',
            () => {

                const keyword =
                    input.value
                        .trim()
                        .toLowerCase();


                this.search(
                    keyword
                );
            }
        );
    },


    search(keyword) {

        const cards =
            document.querySelectorAll(
                '.tool-card-link'
            );


        cards.forEach(card => {

            const title =
                card
                    .querySelector('h3')
                    ?.textContent
                    .toLowerCase() || '';


            const description =
                card
                    .querySelector('p')
                    ?.textContent
                    .toLowerCase() || '';


            const matched =
                !keyword ||
                title.includes(keyword) ||
                description.includes(keyword);


            card.style.display =
                matched
                    ? ''
                    : 'none';
        });
    }
};




/**
 * ==========================================
 * DRAWER MANAGER
 * ==========================================
 *
 * Quản lý:
 * - Mở / đóng Drawer
 * - Overlay
 * - Nút đóng
 * - ESC
 * - Khóa scroll khi Drawer mở
 * - Click item điều hướng
 *
 * Drawer HTML:
 *
 * #menuToggle
 * #appDrawer
 * #drawerOverlay
 * #drawerClose
 *
 * ==========================================
 */

const DrawerManager = {

    drawer: null,

    overlay: null,

    menuBtn: null,

    closeBtn: null,


    init() {

        this.drawer =
            document.getElementById(
                'appDrawer'
            );

        this.overlay =
            document.getElementById(
                'drawerOverlay'
            );

        this.menuBtn =
            document.getElementById(
                'menuToggle'
            );

        this.closeBtn =
            document.getElementById(
                'drawerClose'
            );


        /*
         * Kiểm tra
         */

        if (
            !this.drawer ||
            !this.overlay ||
            !this.menuBtn
        ) {

            console.warn(
                '⚠️ Không tìm thấy thành phần Drawer'
            );

            return;
        }


        /*
         * Menu button
         */

        this.menuBtn.addEventListener(
            'click',
            event => {

                event.preventDefault();

                event.stopPropagation();

                this.toggle();

            }
        );


        /*
         * Close button
         */

        if (this.closeBtn) {

            this.closeBtn.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    this.close();

                }
            );
        }


        /*
         * Overlay
         */

        this.overlay.addEventListener(
            'click',
            () => {

                this.close();

            }
        );


        /*
         * ESC
         */

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


        /*
         * Drawer navigation
         */

        this.bindNavigation();


        /*
         * Accessibility
         */

        this.updateAccessibility();

    },


    /*
     * ======================================
     * OPEN
     * ======================================
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


        this.drawer.setAttribute(
            'aria-hidden',
            'false'
        );

        this.overlay?.setAttribute(
            'aria-hidden',
            'false'
        );


        this.menuBtn?.setAttribute(
            'aria-expanded',
            'true'
        );

    },


    /*
     * ======================================
     * CLOSE
     * ======================================
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


        this.drawer.setAttribute(
            'aria-hidden',
            'true'
        );

        this.overlay?.setAttribute(
            'aria-hidden',
            'true'
        );


        this.menuBtn?.setAttribute(
            'aria-expanded',
            'false'
        );

    },


    /*
     * ======================================
     * TOGGLE
     * ======================================
     */

    toggle() {

        if (
            this.isOpen()
        ) {

            this.close();

        } else {

            this.open();

        }

    },


    /*
     * ======================================
     * STATE
     * ======================================
     */

    isOpen() {

        return (
            this.drawer?.classList.contains(
                'open'
            ) || false
        );

    },


    /*
     * ======================================
     * NAVIGATION
     * ======================================
     */

    bindNavigation() {

        /*
         * Tool buttons
         */

        document
            .querySelectorAll(
                '[data-drawer-tool]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        const toolName =
                            button.dataset.drawerTool;


                        if (!toolName) {
                            return;
                        }


                        this.setActive(
                            button
                        );


                        this.close();


                        Router.showTool(
                            toolName
                        );

                    }
                );

            });


        /*
         * General actions
         */

        document
            .querySelectorAll(
                '[data-drawer-action]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        const action =
                            button.dataset.drawerAction;


                        this.close();


                        this.handleAction(
                            action,
                            button
                        );

                    }
                );

            });

    },


    /*
     * ======================================
     * ACTIONS
     * ======================================
     */

    handleAction(
        action,
        button
    ) {

        switch (action) {

            case 'home':

                this.setActive(
                    button
                );

                Router.showHome();

                break;


            case 'tools':

                this.setActive(
                    button
                );

                Router.showHome();

                /*
                 * Đưa người dùng tới khu vực
                 * danh sách công cụ trên Home.
                 */

                setTimeout(() => {

                    document
                        .querySelector(
                            '.home-tools'
                        )
                        ?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                }, 50);

                break;


            case 'recent':

                this.setActive(
                    button
                );

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


            case 'settings':

                console.info(
                    '⚙️ Settings chưa được triển khai.'
                );

                break;


            case 'about':

                console.info(
                    'ℹ️ About chưa được triển khai.'
                );

                break;


            default:

                console.warn(
                    '⚠️ Drawer action không tồn tại:',
                    action
                );

        }

    },


    /*
     * ======================================
     * ACTIVE ITEM
     * ======================================
     */

    setActive(button) {

        document
            .querySelectorAll(
                '.drawer-item'
            )
            .forEach(item => {

                item.classList.remove(
                    'active'
                );

            });


        button?.classList.add(
            'active'
        );

    },


    /*
     * ======================================
     * ACCESSIBILITY
     * ======================================
     */

    updateAccessibility() {

        this.menuBtn?.setAttribute(
            'aria-expanded',
            'false'
        );

        this.menuBtn?.setAttribute(
            'aria-controls',
            'appDrawer'
        );

    }

};


/**
 * ==========================================
 * HOME TOOL CARD MANAGER
 * ==========================================
 *
 * Xử lý các card:
 *
 * .home-tool-card
 *
 * data-tool="calculator"
 * data-tool="counter"
 * data-tool="notes"
 *
 * ==========================================
 */

const HomeToolCardManager = {

    init() {

        document
            .querySelectorAll(
                '.home-tool-card'
            )
            .forEach(card => {

                card.setAttribute(
                    'role',
                    'button'
                );

                card.setAttribute(
                    'tabindex',
                    '0'
                );


                /*
                 * Click
                 */

                card.addEventListener(
                    'click',
                    event => {

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


                /*
                 * Keyboard
                 */

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


        /*
         * Khám phá
         */

        const exploreBtn =
            document.getElementById(
                'homeExploreTools'
            );


        if (exploreBtn) {

            exploreBtn.addEventListener(
                'click',
                event => {

                    event.preventDefault();


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

        }


        /*
         * Xem tất cả
         */

        const seeAllBtn =
            document.getElementById(
                'homeSeeAllTools'
            );


        if (seeAllBtn) {

            seeAllBtn.addEventListener(
                'click',
                event => {

                    event.preventDefault();


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

        }

    }

};


/**
 * ==========================================
 * APP
 * ==========================================
 */

const App = {

    async init() {

        console.log(
            '🚀 HydYar Tools SPA đang khởi tạo...'
        );


        /*
         * State
         */

        AppState.init();


        /*
         * Router
         */

        Router.init();


        /*
         * Header
         */

        HeaderButtonManager.init();


        /*
         * Theme
         */

        ThemeManager.init();


        /*
         * ==================================
         * LOAD CALCULATOR MODULE
         * ==================================
         *
         * Script chính chỉ load module.
         *
         * Logic calculator nằm hoàn toàn
         * trong:
         *
         * tools/cal/calculator.js
         *
         */

        /*
 * ==================================
 * LOAD CALCULATOR MODULE
 * ==================================
 */

await ToolLoader.init(
    'calculator'
);


/*
 * ==================================
 * LOAD COUNTER + FORMATTER MODULE
 * ==================================
 *
 * Counter và Formatter dùng chung
 * một module:
 *
 * tools/fmt/formatter.js
 *
 */

await ToolLoader.init(
    'counter'
);


/*
 * ==================================
 * OTHER TOOLS
 * ==================================
 */

NotesTool.init();


        /*
         * UI
         */

        SearchManager.init();

DrawerManager.init();

HomeToolCardManager.init();


        console.log(
            '✅ HydYar Tools đã sẵn sàng!'
        );
    }
};


/**
 * ==========================================
 * START
 * ==========================================
 */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        () => App.init()
    );

} else {

    App.init();
}


/**
 * ==========================================
 * EXPORT
 * ==========================================
 */

export {

    AppState,

    Router,

    ToolLoader,

    HeaderButtonManager,

    ThemeManager,

    NotesTool

};