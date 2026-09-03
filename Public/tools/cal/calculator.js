// ==========================================
// HYDYAR TOOLS — CALCULATOR MODULE
// V3.8
//RULES | Mọi cải tiến sau đều phải ghi vào đây với phiên bản của nó ( gồm bản thân 1 cơ chế và tổng quan module ) tất cả mọi thứ được chỉnh sửa sẽ viết xuống dưới tuyệt đối không xóa cơ chế nào mà không khai báo vào RULES
// BASE:
// - Expression Tree
// - Power / Group
// - Pretty superscript
// - Mobile compact keyboard
// - Input animation
// - Result animation
//
// ADD:
// - Calculator / Equation mode
// - Equation keyboard
// - MathEngine.solveEquation()
//
// V3.7 TREE EQUATION:
// - Calculator = RootNode Expression Tree
// - Equation = EquationNode
//      ├── left  -> RootNode
//      ├── relation "="
//      └── right -> RootNode
// - Equation has TWO independent Tree sides
// - equationText is NO LONGER source of truth
// - Native keyboard uses the same Tree input pipeline
// - Display is generated from Tree
//
// V3.8 TREE MODULARIZATION:
// - Tách toàn bộ Tree logic (ExpressionNode, NumberNode, VariableNode,
//   OperatorNode, GroupNode, PowerNode, RootNode, EquationNode, CursorState)
//   ra file riêng: ./calc-tree.js
// - File calculator chính chỉ còn UI + input handling + business logic
// - Import tree classes từ module riêng
// - Cải thiện độ ổn định: _repairCursor & _repairEquationCursor được gọi
//   sau mọi thao tác thay đổi tree
// - Thêm guard null checks ở các điểm entry quan trọng
// V3.9 DISPLAY UX:
// - Calculator display tự động cuộn ngang tới cuối phép tính
//   sau mỗi lần cập nhật giá trị/cursor.
// - Không giới hạn độ dài biểu thức bằng CSS/JS.
// - Render Steps thêm dòng đầu tiên:
//      Phép tính: {phép tính}
//   Dòng phép tính không có số thứ tự.
// - Các bước giải thực tế vẫn bắt đầu từ số 1.
// - Không xóa hoặc thay đổi các cơ chế Tree, Cursor,
//   Equation, Native Input Sync và Animation hiện có.
// ==========================================

import { MathEngine } from './math.js';
import {
    ExpressionNode,
    NumberNode,
    VariableNode,
    OperatorNode,
    GroupNode,
    PowerNode,
    RootNode,
    EquationNode,
    CursorState
} from './calc-tree.js';


// ==========================================
// CALCULATOR TOOL
// ==========================================

const CalculatorTool = {

    // ======================================
    // DOM
    // ======================================

    display: null,
    resultBox: null,
    stepsBox: null,
    calculatorSection: null,
    calculatorElement: null,
    displayResult: null,

    modeTitle: null,
    modeToggle: null,
    mainButtons: null,
    controls: null,


    // ======================================
    // MODE
    // ======================================

    mode: 'calculator',


    // ======================================
    // CALCULATOR TREE
    // ======================================

    root: new RootNode(),

    cursor: null,


    // ======================================
    // EQUATION TREE
    // ======================================

    equationTree:
        new EquationNode(),

    equationSide:
        'left',

    equationCursor:
        null,


    // ======================================
    // STATE
    // ======================================

    keyboardOpen: false,
    keyboardActive: false,
    keyboardTimer: null,

    justCalculated: false,

    lastExpression: '',
    lastResult: '',

    compactMode: false,

    inputAnimationTimer: null,


    // ======================================
    // NATIVE INPUT
    // ======================================

    nativeInputSyncing: false,

    nativeInputSnapshot: '',

    nativeInputSelectionStart: 0,

    nativeInputSelectionEnd: 0,


    // ======================================
    // SUPERSCRIPT
    // ======================================

    superscriptMap: {

        '0': '⁰',
        '1': '¹',
        '2': '²',
        '3': '³',
        '4': '⁴',
        '5': '⁵',
        '6': '⁶',
        '7': '⁷',
        '8': '⁸',
        '9': '⁹',

        '+': '⁺',
        '-': '⁻',

        '.': '·',

        '(': '⁽',
        ')': '⁾'
    },


    normalMap: {

        '⁰': '0',
        '¹': '1',
        '²': '2',
        '³': '3',
        '⁴': '4',
        '⁵': '5',
        '⁶': '6',
        '⁷': '7',
        '⁸': '8',
        '⁹': '9',

        '⁺': '+',
        '⁻': '-',

        '·': '.',

        '⁽': '(',
        '⁾': ')'
    },


    // ======================================
    // INPUT CAPTURE
    // ======================================

    _captureNativeInputState() {

        if (!this.display) {

            return;
        }


        this.nativeInputSnapshot =
            String(
                this.display.value ?? ''
            );


        this.nativeInputSelectionStart =
            this.display.selectionStart ??
            this.nativeInputSnapshot.length;


        this.nativeInputSelectionEnd =
            this.display.selectionEnd ??
            this.nativeInputSelectionStart;
    },


    // ======================================
    // APP KEYBOARD CHARACTERS
    // ======================================

    _getAppKeyboardCharacters() {

        if (
            this.mode === 'calculator'
        ) {

            return new Set([

                '(',
                ')',
                '%',

                '÷',
                '×',
                '−',

                '+',

                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',

                '.',

                '^',

                '='
            ]);
        }


        if (
            this.mode === 'equation'
        ) {

            return new Set([

                '(',
                ')',

                'x',
                'X',

                '−',
                '-',

                '÷',
                '/',
                '×',
                '*',

                '+',

                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',

                '.',

                '^',

                '='
            ]);
        }


        return new Set();
    },


    // ======================================
    // NATIVE CHARACTER CHECK
    // ======================================

    _isNativeCharacterSupported(char) {

        if (!char) {

            return false;
        }


        return this
            ._getAppKeyboardCharacters()
            .has(char);
    },


    _filterNativeCharacters(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return '';
        }


        const input =
            String(value);


        let result =
            '';


        for (
            const char of input
        ) {

            if (
                this._isNativeCharacterSupported(
                    char
                )
            ) {

                result += char;
            }
        }


        return result;
    },


    // ======================================
    // DISPLAY TEXT
    // ======================================

    _buildDisplayText(node) {

        if (!node) {

            return '';
        }


        if (
            node.type === 'number'
        ) {

            return String(
                node.value
            );
        }


        if (
            node.type === 'variable'
        ) {

            return String(
                node.value
            );
        }


        if (
            node.type === 'operator'
        ) {

            return (
                node.value === '*'
                    ? '×'
                    : node.value === '/'
                        ? '÷'
                        : node.value === '-'
                            ? '−'
                            : node.value
            );
        }


        if (
            node.type === 'group'
        ) {

            const content =
                node.children
                    .map(
                        child =>
                            this._buildDisplayText(
                                child
                            )
                    )
                    .join('');


            return (
                '(' +
                content +
                (
                    node.closed
                        ? ')'
                        : ''
                )
            );
        }


        if (
            node.type === 'power'
        ) {

            const base =
                node.base
                    ? this._buildDisplayText(
                        node.base
                    )
                    : '';


            const exponent =
                node.exponentChildren
                    .map(
                        child =>
                            this._buildDisplayText(
                                child
                            )
                    )
                    .join('');


            const exponentSuper =
                exponent
                    .split('')
                    .map(
                        char =>
                            this.superscriptMap[
                                char
                            ] ?? char
                    )
                    .join('');


            return (
                base +
                exponentSuper
            );
        }


        if (
            node.type === 'root'
        ) {

            return node.children
                .map(
                    child =>
                        this._buildDisplayText(
                            child
                        )
                )
                .join('');
        }


        if (
            node.type === 'equation'
        ) {

            return (
                this._buildDisplayText(
                    node.left
                ) +
                node.relation +
                this._buildDisplayText(
                    node.right
                )
            );
        }


        return '';
    },


    // ======================================
    // EQUATION ACTIVE ROOT
    // ======================================

    _getEquationRoot(side = this.equationSide) {

        if (
            !this.equationTree
        ) {

            this.equationTree =
                new EquationNode();
        }


        return side === 'right'
            ? this.equationTree.right
            : this.equationTree.left;
    },


    // ======================================
    // EQUATION ACTIVE CURSOR
    // ======================================

    _getEquationCursor() {

        if (
            !this.equationCursor
        ) {

            const root =
                this._getEquationRoot();


            this.equationCursor =
                CursorState.at(
                    root,
                    root.children.length
                );
        }


        return this.equationCursor;
    },


    // ======================================
    // EQUATION HAS EQUALS
    // ======================================

    _equationHasEquals() {

        return !!(
            this.equationTree &&
            this.equationTree.relation === '=' &&
            (
                this.equationTree.right ||
                this.equationTree.left
            )
        );
    },


    // ======================================
    // TREE CURSOR → DISPLAY CURSOR
    // ======================================

    _getTreeCursorPosition(cursor, root) {

        if (
            !cursor ||
            !Array.isArray(
                cursor.container
            )
        ) {

            return 0;
        }


        const container =
            cursor.container;


        let position =
            0;


        // ----------------------------------
        // ROOT
        // ----------------------------------

        if (
            cursor.owner === root
        ) {

            for (
                let i = 0;
                i < cursor.pos;
                i++
            ) {

                position +=
                    this._buildDisplayText(
                        container[i]
                    ).length;
            }


            return position;
        }


        // ----------------------------------
        // GROUP
        // ----------------------------------

        if (
            cursor.owner &&
            cursor.owner.type === 'group' &&
            container ===
                cursor.owner.children
        ) {

            position = 1;


            for (
                let i = 0;
                i < cursor.pos;
                i++
            ) {

                position +=
                    this._buildDisplayText(
                        container[i]
                    ).length;
            }


            return position;
        }


        // ----------------------------------
        // POWER EXPONENT
        // ----------------------------------

        if (
            cursor.owner &&
            cursor.owner.type === 'power' &&
            container ===
                cursor.owner.exponentChildren
        ) {

            position =
                cursor.owner.base
                    ? this._buildDisplayText(
                        cursor.owner.base
                    ).length
                    : 0;


            for (
                let i = 0;
                i < cursor.pos;
                i++
            ) {

                const child =
                    container[i];


                const childText =
                    this._buildDisplayText(
                        child
                    );


                position +=
                    childText
                        .split('')
                        .map(
                            char =>
                                this.superscriptMap[
                                    char
                                ] ?? char
                        )
                        .join('')
                        .length;
            }


            return position;
        }


        // ----------------------------------
        // FALLBACK
        // ----------------------------------

        for (
            let i = 0;
            i < cursor.pos;
            i++
        ) {

            position +=
                this._buildDisplayText(
                    container[i]
                ).length;
        }


        return position;
    },


    // ======================================
    // CALCULATOR CURSOR POSITION
    // ======================================

    _getDisplayCursorPosition() {

        return this._getTreeCursorPosition(
            this.cursor,
            this.root
        );
    },


    // ======================================
    // EQUATION CURSOR POSITION
    // ======================================

    _getEquationDisplayCursorPosition() {

        const tree =
            this.equationTree;


        const cursor =
            this._getEquationCursor();


        const leftText =
            this._buildDisplayText(
                tree.left
            );


        const leftLength =
            leftText.length;


        const rightStart =
            leftLength +
            tree.relation.length;


        if (
            this.equationSide === 'left'
        ) {

            return this._getTreeCursorPosition(
                cursor,
                tree.left
            );
        }


        return (
            rightStart +
            this._getTreeCursorPosition(
                cursor,
                tree.right
            )
        );
    },

       // ======================================
    // DISPLAY HORIZONTAL SCROLL
    // V3.9
    // ======================================

    _scrollDisplayToEnd() {

        if (!this.display) {

            return;
        }


        const scrollToEnd = () => {

            if (!this.display) {

                return;
            }


            this.display.scrollLeft =
                this.display.scrollWidth;
        };


        // Cập nhật ngay
        scrollToEnd();


        // Cập nhật lại sau khi browser
        // hoàn tất layout/render.
        requestAnimationFrame(
            scrollToEnd
        );
    },


        // ======================================
    // SET DISPLAY
    // V3.9:
    // - Tự động scroll ngang tới cuối
    // ======================================

    _setDisplayValue(
        value,
        cursorPosition = null
    ) {

        if (!this.display) {

            return;
        }


        this.nativeInputSyncing =
            true;


        try {

            this.display.value =
                String(
                    value ?? ''
                );


            const position =
                cursorPosition === null
                    ? this.display.value.length
                    : Math.max(
                        0,
                        Math.min(
                            cursorPosition,
                            this.display.value.length
                        )
                    );


            try {

                this.display.setSelectionRange(
                    position,
                    position
                );

            } catch (_) {}

        } finally {

            this.nativeInputSyncing =
                false;
        }


        this._captureNativeInputState();


        // ==================================
        // V3.9
        // Luôn đưa display tới cuối
        // phép tính.
        // ==================================

        this._scrollDisplayToEnd();
    },


    // ======================================
    // NATIVE CALCULATOR SYNC
    // ======================================

    _syncCalculatorNativeInput() {

        if (
            !this.display ||
            this.nativeInputSyncing
        ) {

            return;
        }


        const previous =
            String(
                this.nativeInputSnapshot ?? ''
            );


        const current =
            String(
                this.display.value ?? ''
            );


        if (
            previous === current
        ) {

            return;
        }


        let start =
            0;


        while (
            start < previous.length &&
            start < current.length &&
            previous[start] ===
                current[start]
        ) {

            start++;
        }


        let oldEnd =
            previous.length;


        let newEnd =
            current.length;


        while (
            oldEnd > start &&
            newEnd > start &&
            previous[oldEnd - 1] ===
                current[newEnd - 1]
        ) {

            oldEnd--;
            newEnd--;
        }


        const removed =
            previous.slice(
                start,
                oldEnd
            );


        const inserted =
            current.slice(
                start,
                newEnd
            );


        const isInsertion =
            inserted.length > 0 &&
            removed.length === 0;


        const isDeletion =
            inserted.length === 0 &&
            removed.length > 0;


        // ----------------------------------
        // INSERT
        // ----------------------------------

        if (isInsertion) {

            const allSupported =
                [...inserted].every(
                    char =>
                        this._isNativeCharacterSupported(
                            char
                        )
                );


            if (!allSupported) {

                this._setDisplayValue(
                    previous,
                    this._getDisplayCursorPosition()
                );

                return;
            }


            const expectedCaret =
                this._getDisplayCursorPosition();


            const rawCaret =
                this.display.selectionStart ??
                current.length;


            const insertionStart =
                rawCaret -
                inserted.length;


            if (
                insertionStart !==
                expectedCaret
            ) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            for (
                const char of inserted
            ) {

                this.handleInput(
                    char
                );
            }


            return;
        }


        // ----------------------------------
        // DELETE
        // ----------------------------------

        if (isDeletion) {

            const expectedCaret =
                this._getDisplayCursorPosition();


            const rawCaret =
                this.display.selectionStart ??
                current.length;


            if (
                rawCaret !==
                expectedCaret -
                removed.length
            ) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            const allSupported =
                [...removed].every(
                    char =>
                        this._isNativeCharacterSupported(
                            char
                        )
                );


            if (!allSupported) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            for (
                let i = 0;
                i < removed.length;
                i++
            ) {

                this.backspace();
            }


            return;
        }


        this._setDisplayValue(
            previous,
            this._getDisplayCursorPosition()
        );
    },


    // ======================================
    // NATIVE EQUATION SYNC
    // ======================================

    _syncEquationNativeInput() {

        if (
            !this.display ||
            this.nativeInputSyncing
        ) {

            return;
        }


        const previous =
            String(
                this.nativeInputSnapshot ?? ''
            );


        const current =
            String(
                this.display.value ?? ''
            );


        if (
            previous === current
        ) {

            return;
        }


        let start =
            0;


        while (
            start < previous.length &&
            start < current.length &&
            previous[start] ===
                current[start]
        ) {

            start++;
        }


        let oldEnd =
            previous.length;


        let newEnd =
            current.length;


        while (
            oldEnd > start &&
            newEnd > start &&
            previous[oldEnd - 1] ===
                current[newEnd - 1]
        ) {

            oldEnd--;
            newEnd--;
        }


        const removed =
            previous.slice(
                start,
                oldEnd
            );


        const inserted =
            current.slice(
                start,
                newEnd
            );


        // ----------------------------------
        // INSERT
        // ----------------------------------

        if (
            inserted.length > 0 &&
            removed.length === 0
        ) {

            const rawCaret =
                this.display.selectionStart ??
                current.length;


            const insertionStart =
                rawCaret -
                inserted.length;


            const expectedCaret =
                this._getEquationDisplayCursorPosition();


            if (
                insertionStart !==
                expectedCaret
            ) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            const allSupported =
                [...inserted].every(
                    char =>
                        this._isNativeCharacterSupported(
                            char
                        )
                );


            if (!allSupported) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            for (
                const char of inserted
            ) {

                this.handleEquationInput(
                    char
                );
            }


            return;
        }


        // ----------------------------------
        // DELETE
        // ----------------------------------

        if (
            inserted.length === 0 &&
            removed.length > 0
        ) {

            const rawCaret =
                this.display.selectionStart ??
                current.length;


            const expectedCaret =
                this._getEquationDisplayCursorPosition();


            if (
                rawCaret !==
                start
            ) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            // "=" là relation của EquationTree.
            // Không cho native input tự xóa relation.
            if (
                removed.includes('=')
            ) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            const allSupported =
                [...removed].every(
                    char =>
                        this._isNativeCharacterSupported(
                            char
                        )
                );


            if (!allSupported) {

                this._setDisplayValue(
                    previous,
                    expectedCaret
                );

                return;
            }


            for (
                let i = 0;
                i < removed.length;
                i++
            ) {

                this.equationBackspace();
            }


            return;
        }


        // ----------------------------------
        // REPLACEMENT / PASTE
        // ----------------------------------

        this._setDisplayValue(
            previous,
            this._getEquationDisplayCursorPosition()
        );
    },


    // ======================================
    // INIT
    // ======================================

    init() {

        this.display =
            document.getElementById(
                'calcExpression'
            );


        this.resultBox =
            document.getElementById(
                'calcResult'
            );


        this.stepsBox =
            document.getElementById(
                'calcSteps'
            );


        this.calculatorSection =
            document.getElementById(
                'calculator-tool'
            );


        this.calculatorElement =
            this.calculatorSection
                ?.querySelector(
                    '.calculator'
                );


        this.modeTitle =
            document.getElementById(
                'calcModeTitle'
            );


        this.modeToggle =
            document.getElementById(
                'calcModeToggle'
            );


        this.mainButtons =
            document.getElementById(
                'calcMainButtons'
            );


        this.controls =
            document.getElementById(
                'calcControls'
            );


        if (
            !this.display ||
            !this.calculatorElement
        ) {

            console.warn(
                '⚠️ Thiếu element calculator'
            );

            return;
        }


        // ----------------------------------
        // INLINE RESULT
        // ----------------------------------

        const displayWrapper =
            this.calculatorElement.querySelector(
                '.calc-display-wrapper'
            );


        let resultEl =
            displayWrapper
                ?.querySelector(
                    '.calc-inline-result'
                );


        if (
            !resultEl &&
            displayWrapper
        ) {

            resultEl =
                document.createElement(
                    'div'
                );


            resultEl.className =
                'calc-inline-result';


            resultEl.setAttribute(
                'aria-live',
                'polite'
            );


            displayWrapper.appendChild(
                resultEl
            );
        }


        this.displayResult =
            resultEl;


        // ----------------------------------
        // RESET CALCULATOR TREE
        // ----------------------------------

        this.root =
            new RootNode();


        this.cursor =
            CursorState.at(
                this.root,
                0
            );


        // ----------------------------------
        // RESET EQUATION TREE
        // ----------------------------------

        this.equationTree =
            new EquationNode();


        this.equationSide =
            'left';


        this.equationCursor =
            CursorState.at(
                this.equationTree.left,
                0
            );


        this.mode =
            'calculator';


        this.justCalculated =
            false;


        this.nativeInputSyncing =
            false;


        this.nativeInputSnapshot =
            '';


        this.nativeInputSelectionStart =
            0;


        this.nativeInputSelectionEnd =
            0;


        this.bindEvents();

        this.setupKeyboardHandling();


        this.renderMode();

        this.updateDisplay();
    },


    // ======================================
    // BIND EVENTS
    // ======================================

    bindEvents() {

        // ----------------------------------
        // MODE TOGGLE
        // ----------------------------------

        if (this.modeToggle) {

            this.modeToggle.addEventListener(
                'click',
                e => {

                    e.preventDefault();

                    this.toggleMode();
                }
            );
        }


        // ----------------------------------
        // MAIN BUTTONS
        // ----------------------------------

        if (this.mainButtons) {

            this.mainButtons.addEventListener(
                'mousedown',
                e => {

                    const btn =
                        e.target.closest(
                            '.calc-btn'
                        );


                    if (btn) {

                        e.preventDefault();
                    }
                }
            );


            this.mainButtons.addEventListener(
                'click',
                e => {

                    const btn =
                        e.target.closest(
                            '.calc-btn'
                        );


                    if (!btn) {

                        return;
                    }


                    e.preventDefault();


                    this.handleInput(
                        btn.dataset.value
                    );
                }
            );
        }


        // ----------------------------------
        // CONTROLS
        // ----------------------------------

        if (this.controls) {

            this.controls.addEventListener(
                'mousedown',
                e => {

                    const btn =
                        e.target.closest(
                            '.calc-btn'
                        );


                    if (btn) {

                        e.preventDefault();
                    }
                }
            );


            this.controls.addEventListener(
                'click',
                e => {

                    const btn =
                        e.target.closest(
                            '.calc-btn'
                        );


                    if (!btn) {

                        return;
                    }


                    e.preventDefault();


                    this.handleInput(
                        btn.dataset.value
                    );
                }
            );
        }


        // ----------------------------------
        // KEYBOARD
        // ----------------------------------

        this.display.addEventListener(
            'keydown',
            e => {

                // ==========================
                // EQUATION
                // ==========================

                if (
                    this.mode === 'equation'
                ) {

                    this.handleEquationKeydown(
                        e
                    );

                    return;
                }


                // ==========================
                // CALCULATOR
                // ==========================

                if (
                    e.key === 'Enter'
                ) {

                    e.preventDefault();

                    this.calculate();

                    return;
                }


                if (
                    e.key === 'ArrowLeft'
                ) {

                    e.preventDefault();

                    this.cursor.moveLeft();

                    this.updateDisplay();

                    return;
                }


                if (
                    e.key === 'ArrowRight'
                ) {

                    e.preventDefault();

                    this.cursor.moveRight();

                    this.updateDisplay();

                    return;
                }


                if (
                    e.key === 'Backspace'
                ) {

                    e.preventDefault();

                    this.backspace();

                    return;
                }
            }
        );


        // ----------------------------------
        // INPUT
        // ----------------------------------

        this.display.addEventListener(
            'input',
            () => {

                if (
                    this.nativeInputSyncing
                ) {

                    return;
                }


                if (
                    this.mode === 'equation'
                ) {

                    this._syncEquationNativeInput();

                    return;
                }


                this._syncCalculatorNativeInput();
            }
        );
    },


    // ======================================
    // MODE TOGGLE
    // ======================================

    toggleMode() {

        if (
            this.mode === 'calculator'
        ) {

            this.switchMode(
                'equation'
            );

        } else {

            this.switchMode(
                'calculator'
            );
        }
    },


    // ======================================
    // SWITCH MODE
    // ======================================

    switchMode(mode) {

        if (
            mode !== 'calculator' &&
            mode !== 'equation'
        ) {

            return;
        }


        this.mode =
            mode;


        this.justCalculated =
            false;


        this.lastExpression =
            '';


        this.lastResult =
            '';


        this.setResultOpacity(
            false
        );


        if (
            this.displayResult
        ) {

            this.displayResult.textContent =
                '';
        }


        if (
            this.resultBox
        ) {

            this.resultBox.textContent =
                '—';
        }


        if (
            mode === 'calculator'
        ) {

            this.root =
                new RootNode();


            this.cursor =
                CursorState.at(
                    this.root,
                    0
                );

        } else {

            this.equationTree =
                new EquationNode();


            this.equationSide =
                'left';


            this.equationCursor =
                CursorState.at(
                    this.equationTree.left,
                    0
                );
        }


        this.renderMode();

        this.updateDisplay();


        requestAnimationFrame(
            () => {

                try {

                    this.display.focus();

                } catch (_) {}
            }
        );
    },


    // ======================================
    // RENDER MODE
    // ======================================

    renderMode() {

        const isEquation =
            this.mode === 'equation';


        this.calculatorElement
            ?.classList
            .toggle(
                'calculator-mode',
                !isEquation
            );


        this.calculatorElement
            ?.classList
            .toggle(
                'equation-mode',
                isEquation
            );


        if (this.modeTitle) {

            this.modeTitle.textContent =
                isEquation
                    ? 'Phương trình'
                    : 'Máy tính';
        }


        if (this.modeToggle) {

            this.modeToggle.innerHTML =
                isEquation
                    ? `<svg viewBox="0 0 24 24" aria-hidden="true">
                           <rect x="5" y="2.5" width="14" height="19" rx="2"></rect>
                           <rect x="8" y="5.5" width="8" height="3"></rect>
                           <path d="M8 12h2M14 12h2M8 16h2M14 16h2"></path>
                       </svg>`
                    : `<span class="math-mode-icon">𝑥</span>`;
        }


        if (isEquation) {

            this.renderEquationKeyboard();

        } else {

            this.renderCalculatorKeyboard();
        }
    },


    // ======================================
    // CALCULATOR KEYBOARD
    // ======================================

    renderCalculatorKeyboard() {

        if (!this.mainButtons) {

            return;
        }


        this.mainButtons.innerHTML = `

            <button
                class="calc-btn function"
                data-value="("
            >(</button>

            <button
                class="calc-btn function"
                data-value=")"
            >)</button>

            <button
                class="calc-btn operator"
                data-value="%"
            >%</button>

            <button
                class="calc-btn operator"
                data-value="÷"
            >÷</button>


            <button
                class="calc-btn number"
                data-value="7"
            >7</button>

            <button
                class="calc-btn number"
                data-value="8"
            >8</button>

            <button
                class="calc-btn number"
                data-value="9"
            >9</button>

            <button
                class="calc-btn operator"
                data-value="×"
            >×</button>


            <button
                class="calc-btn number"
                data-value="4"
            >4</button>

            <button
                class="calc-btn number"
                data-value="5"
            >5</button>

            <button
                class="calc-btn number"
                data-value="6"
            >6</button>

            <button
                class="calc-btn operator"
                data-value="−"
            >−</button>


            <button
                class="calc-btn number"
                data-value="1"
            >1</button>

            <button
                class="calc-btn number"
                data-value="2"
            >2</button>

            <button
                class="calc-btn number"
                data-value="3"
            >3</button>

            <button
                class="calc-btn operator"
                data-value="+"
            >+</button>


            <button
                class="calc-btn number"
                data-value="0"
            >0</button>

            <button
                class="calc-btn number"
                data-value="."
            >.</button>

            <button
                class="calc-btn operator"
                data-value="^"
            >^</button>

            <button
                class="calc-btn equals"
                data-value="="
            >=</button>
        `;
    },


    // ======================================
    // EQUATION KEYBOARD
    // ======================================

    renderEquationKeyboard() {

        if (!this.mainButtons) {

            return;
        }


        this.mainButtons.innerHTML = `

            <button
                class="calc-btn function"
                data-value="("
            >(</button>

            <button
                class="calc-btn function"
                data-value=")"
            >)</button>

            <button
                class="calc-btn function"
                data-value="x"
            >x</button>

            <button
                class="calc-btn operator"
                data-value="−"
            >−</button>


            <button
                class="calc-btn number"
                data-value="7"
            >7</button>

            <button
                class="calc-btn number"
                data-value="8"
            >8</button>

            <button
                class="calc-btn number"
                data-value="9"
            >9</button>

            <button
                class="calc-btn operator"
                data-value="÷"
            >÷</button>


            <button
                class="calc-btn number"
                data-value="4"
            >4</button>

            <button
                class="calc-btn number"
                data-value="5"
            >5</button>

            <button
                class="calc-btn number"
                data-value="6"
            >6</button>

            <button
                class="calc-btn operator"
                data-value="×"
            >×</button>


            <button
                class="calc-btn number"
                data-value="1"
            >1</button>

            <button
                class="calc-btn number"
                data-value="2"
            >2</button>

            <button
                class="calc-btn number"
                data-value="3"
            >3</button>

            <button
                class="calc-btn operator"
                data-value="+"
            >+</button>


            <button
                class="calc-btn number"
                data-value="0"
            >0</button>

            <button
                class="calc-btn number"
                data-value="."
            >.</button>

            <button
               class="calc-btn operator"
               data-value="^"
            >^</button>

            <button
                class="calc-btn operator"
                data-value="="
            >=</button>

            <button
                class="calc-btn equals"
                data-value="solve"
            >Giải</button>
        `;
    },


    // ======================================
    // KEYBOARD HANDLING
    // ======================================

    setupKeyboardHandling() {

        const input =
            this.display;


        if (!input) {

            return;
        }


        const activate = () => {

            this.keyboardActive =
                true;


            this.calculatorSection
                ?.classList
                .add(
                    'keyboard-active'
                );


            document.body
                .classList
                .add(
                    'keyboard-open'
                );


            this.setCompactMode(
                true
            );
        };


        const deactivate = () => {

            this.keyboardActive =
                false;


            this.calculatorSection
                ?.classList
                .remove(
                    'keyboard-active'
                );


            document.body
                .classList
                .remove(
                    'keyboard-open'
                );


            this.setCompactMode(
                false
            );
        };


        input.addEventListener(
            'focus',
            () => {

                clearTimeout(
                    this.keyboardTimer
                );

                activate();
            }
        );


        input.addEventListener(
            'blur',
            () => {

                clearTimeout(
                    this.keyboardTimer
                );


                this.keyboardTimer =
                    setTimeout(
                        () => {

                            if (
                                !document
                                    .activeElement
                                    ?.closest(
                                        '#calculator-tool'
                                    )
                            ) {

                                deactivate();
                            }

                        },
                        350
                    );
            }
        );
    },


    // ======================================
    // COMPACT MODE
    // ======================================

    setCompactMode(enabled) {

        this.compactMode =
            enabled;


        this.calculatorSection
            ?.classList
            .toggle(
                'calculator-compact',
                enabled
            );
    },


    // ======================================
    // HANDLE INPUT
    // ======================================

    handleInput(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return;
        }


        value =
            String(value);


        // ==================================
        // EQUATION
        // ==================================
if (value === '−') {
    value = '-';
}

if (value === '×') {
    value = '*';
}

if (value === '÷') {
    value = '/';
}
        if (
            this.mode === 'equation'
        ) {

            this.handleEquationInput(
                value
            );

            return;
        }


        // ==================================
        // CALCULATOR
        // ==================================

        if (
            this.justCalculated
        ) {

            if (
                /^[+\-*/×÷^%.)]$/
                    .test(value)
            ) {

                this.root =
                    this._parse(
                        this.lastResult
                    );


                this.cursor =
                    CursorState.at(
                        this.root,
                        this.root.children.length
                    );
            }


            else if (
                /^[0-9(]$/
                    .test(value)
            ) {

                this.clear();
            }


            this.justCalculated =
                false;


            this.setResultOpacity(
                false
            );
        }


        // ----------------------------------
        // CONTROL
        // ----------------------------------

        if (value === 'C') {

            this.clear();

            return;
        }


        if (
            value === 'backspace'
        ) {

            this.backspace();

            return;
        }


        if (
            value === '←'
        ) {

            this.cursor.moveLeft();

            this.updateDisplay();

            return;
        }


        if (
            value === '→'
        ) {

            this.cursor.moveRight();

            this.updateDisplay();

            return;
        }


        if (
            value === '='
        ) {

            this.calculate();

            return;
        }


        // ----------------------------------
        // POWER
        // ----------------------------------

        if (
            value === '^'
        ) {

            this._createPower();

            this._repairCursor();

            this.updateDisplay();

            this.playInputAnimation();

            return;
        }


        this._insertValue(
            value
        );


        this._repairCursor();

        this.updateDisplay();

        this.playInputAnimation();
    },


    // ======================================
    // EQUATION INPUT
    // ======================================

    handleEquationInput(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return;
        }


        value =
            String(value);


        // ----------------------------------
        // CONTROL
        // ----------------------------------

        if (value === 'C') {

            this.clearEquation();

            return;
        }


        if (
            value === 'backspace'
        ) {

            this.equationBackspace();

            return;
        }


        // ----------------------------------
        // LEFT
        // ----------------------------------

        if (
            value === '←'
        ) {

            this.equationMoveLeft();

            return;
        }


        // ----------------------------------
        // RIGHT
        // ----------------------------------

        if (
            value === '→'
        ) {

            this.equationMoveRight();

            return;
        }


        // ----------------------------------
        // SOLVE
        // ----------------------------------

        if (
            value === 'solve'
        ) {

            this.solveEquation();

            return;
        }


        // ----------------------------------
        // EQUALS
        // ----------------------------------

        if (
            value === '='
        ) {

            this.equationInsertEquals();

            return;
        }


        // ----------------------------------
        // NORMALIZE DISPLAY INPUT
        // ----------------------------------

        if (
            value === '−'
        ) {

            value = '-';
        }


        if (
            value === '×'
        ) {

            value = '*';
        }


        if (
            value === '÷'
        ) {

            value = '/';
        }


        if (
            value === 'X'
        ) {

            value = 'x';
        }


        // ----------------------------------
        // POWER
        // ----------------------------------

        if (
            value === '^'
        ) {

            this._createEquationPower();

            this._repairEquationCursor();

            this.updateEquationDisplay();

            this.playInputAnimation();

            return;
        }


        // ----------------------------------
        // VALID CHARACTER
        // ----------------------------------

        if (
            /^[0-9x+\-*/().]$/.test(
                value
            )
        ) {

            this._insertEquationValue(
                value
            );


            this._repairEquationCursor();

            this.updateEquationDisplay();

            this.playInputAnimation();
        }
    },


    // ======================================
    // EQUATION KEYDOWN
    // ======================================

    handleEquationKeydown(e) {

        if (
            e.key === 'Enter'
        ) {

            e.preventDefault();

            this.solveEquation();

            return;
        }


        if (
            e.key === 'Backspace'
        ) {

            e.preventDefault();

            this.equationBackspace();

            return;
        }


        if (
            e.key === 'ArrowLeft'
        ) {

            e.preventDefault();

            this.equationMoveLeft();

            return;
        }


        if (
            e.key === 'ArrowRight'
        ) {

            e.preventDefault();

            this.equationMoveRight();

            return;
        }


        if (
            e.key === '='
        ) {

            e.preventDefault();

            this.equationInsertEquals();

            return;
        }


        // Native characters are intentionally
        // NOT prevented.
    },


    // ======================================
    // EQUATION INSERT EQUALS
    // ======================================

    equationInsertEquals() {

        if (
            this.equationTree.relation !== '='
        ) {

            this.equationTree.relation =
                '=';

        }


        // "=" đã tồn tại.
        // Chỉ cho chuyển từ LEFT → RIGHT.
        if (
            this.equationSide === 'left'
        ) {

            const left =
                this.equationTree.left;


            this.equationSide =
                'right';


            this.equationCursor =
                CursorState.at(
                    this.equationTree.right,
                    this.equationTree.right.children.length
                );


            this.updateEquationDisplay();

            this.playInputAnimation();

            return;
        }


        // Không tạo "=" thứ hai.
        this.updateEquationDisplay();
    },


    // ======================================
    // EQUATION MOVE LEFT
    // ======================================

    equationMoveLeft() {

        const cursor =
            this._getEquationCursor();


        const root =
            this._getEquationRoot();


        const wasAtStart =
            cursor.owner === root &&
            cursor.pos === 0;


        if (
            wasAtStart &&
            this.equationSide === 'right'
        ) {

            this.equationSide =
                'left';


            const left =
                this.equationTree.left;


            this.equationCursor =
                CursorState.at(
                    left,
                    left.children.length
                );


            this.updateEquationDisplay();

            return;
        }


        cursor.moveLeft();

        this.updateEquationDisplay();
    },


    // ======================================
    // EQUATION MOVE RIGHT
    // ======================================

    equationMoveRight() {

        const cursor =
            this._getEquationCursor();


        const root =
            this._getEquationRoot();


        const wasAtEnd =
            cursor.owner === root &&
            cursor.pos ===
                root.children.length;


        if (
            wasAtEnd &&
            this.equationSide === 'left'
        ) {

            // Chưa có "=" thì không
            // nhảy sang vế phải.
            if (
                !this._equationHasEquals()
            ) {

                return;
            }


            this.equationSide =
                'right';


            const right =
                this.equationTree.right;


            this.equationCursor =
                CursorState.at(
                    right,
                    0
                );


            this.updateEquationDisplay();

            return;
        }


        cursor.moveRight();

        this.updateEquationDisplay();
    },


    // ======================================
    // INSERT EQUATION VALUE
    // ======================================

    _insertEquationValue(value) {

        const cursor =
            this._getEquationCursor();


        const container =
            cursor.container;


        if (
            !Array.isArray(container)
        ) {

            return;
        }


        // ----------------------------------
        // GROUP (
        // ----------------------------------

        if (
            value === '('
        ) {

            const group =
                new GroupNode(
                    [],
                    cursor.owner,
                    false
                );


            container.splice(
                cursor.pos,
                0,
                group
            );


            cursor.container =
                group.children;


            cursor.owner =
                group;


            cursor.pos =
                0;


            return;
        }


        // ----------------------------------
        // GROUP )
        // ----------------------------------

        if (
            value === ')'
        ) {

            let group =
                cursor.owner;


            while (
                group &&
                group.type !== 'group'
            ) {

                group =
                    group.parent;
            }


            if (
                !group ||
                group.type !== 'group'
            ) {

                return;
            }


            group.closed =
                true;


            const parent =
                group.parent;


            if (!parent) {

                return;
            }


            let parentArray =
                null;


            if (
                Array.isArray(
                    parent.children
                ) &&
                parent.children.includes(
                    group
                )
            ) {

                parentArray =
                    parent.children;
            }


            else if (
                Array.isArray(
                    parent.exponentChildren
                ) &&
                parent.exponentChildren.includes(
                    group
                )
            ) {

                parentArray =
                    parent.exponentChildren;
            }


            if (!parentArray) {

                return;
            }


            const index =
                parentArray.indexOf(
                    group
                );


            if (
                index === -1
            ) {

                return;
            }


            cursor.container =
                parentArray;


            cursor.owner =
                parent;


            cursor.pos =
                index + 1;


            return;
        }


        // ----------------------------------
        // VARIABLE
        // ----------------------------------

        if (
            value === 'x'
        ) {

            const node =
                new VariableNode(
                    'x',
                    cursor.owner
                );


            const insertPos =
                cursor.pos;


            container.splice(
                insertPos,
                0,
                node
            );


            cursor.pos =
                insertPos + 1;


            return;
        }


        // ----------------------------------
        // NUMBER
        // ----------------------------------

        if (
            /^[0-9.]$/.test(value)
        ) {

            const node =
                new NumberNode(
                    value,
                    cursor.owner
                );


            const insertPos =
                cursor.pos;


            container.splice(
                insertPos,
                0,
                node
            );


            cursor.pos =
                insertPos + 1;


            return;
        }


        // ----------------------------------
        // OPERATOR
        // ----------------------------------

        if (
            [
                '+',
                '-',
                '*',
                '/',
                '×',
                '÷'
            ].includes(value)
        ) {

            const operator =
                value === '×'
                    ? '*'
                    : value === '÷'
                        ? '/'
                        : value;


            const node =
                new OperatorNode(
                    operator,
                    cursor.owner
                );


            const insertPos =
                cursor.pos;


            container.splice(
                insertPos,
                0,
                node
            );


            cursor.pos =
                insertPos + 1;
        }
    },


    // ======================================
    // CREATE EQUATION POWER
    // ======================================

    _createEquationPower() {

        const cursor =
            this._getEquationCursor();


        const container =
            cursor.container;


        const pos =
            cursor.pos;


        if (
            !Array.isArray(container)
        ) {

            return;
        }


        if (
            cursor.owner &&
            cursor.owner.type === 'power' &&
            cursor.container ===
                cursor.owner.exponentChildren
        ) {

            return;
        }


        if (
            pos <= 0
        ) {

            return;
        }


        const base =
            container[
                pos - 1
            ];


        if (!base) {

            return;
        }


        if (
            base.type === 'power'
        ) {

            return;
        }


        const power =
            new PowerNode(
                base,
                [],
                cursor.owner
            );


        container.splice(
            pos - 1,
            1,
            power
        );


        cursor.container =
            power.exponentChildren;


        cursor.owner =
            power;


        cursor.pos =
            0;
    },


    // ======================================
    // EQUATION BACKSPACE
    // ======================================

    equationBackspace() {

        const cursor =
            this._getEquationCursor();


        const root =
            this._getEquationRoot();


        // ----------------------------------
        // ĐẦU VẾ PHẢI
        // ----------------------------------

        if (
            this.equationSide === 'right' &&
            cursor.owner === root &&
            cursor.pos === 0
        ) {

            // Chuyển cursor về cuối vế trái.
            // Không xóa "=" vì "=" là relation
            // của EquationNode.
            this.equationSide =
                'left';


            const left =
                this.equationTree.left;


            this.equationCursor =
                CursorState.at(
                    left,
                    left.children.length
                );


            this.updateEquationDisplay();

            return;
        }


        // ----------------------------------
        // TREE BACKSPACE
        // ----------------------------------

        this._backspaceEquationTree();

        this._repairEquationCursor();

        this.justCalculated =
            false;


        this.setResultOpacity(
            false
        );


        this.updateEquationDisplay();

        this.playInputAnimation();
    },


    // ======================================
    // BACKSPACE EQUATION TREE
    // ======================================

    _backspaceEquationTree() {

        const cursor =
            this._getEquationCursor();


        const container =
            cursor.container;


        const pos =
            cursor.pos;


        if (
            !Array.isArray(container) ||
            pos <= 0
        ) {

            return;
        }


        const target =
            container[
                pos - 1
            ];


        if (!target) {

            return;
        }


        container.splice(
            pos - 1,
            1
        );


        if (
            target.type === 'power' ||
            target.type === 'group'
        ) {

            cursor.container =
                container;


            cursor.pos =
                pos - 1;


            if (
                cursor.owner === target
            ) {

                cursor.owner =
                    target.parent;
            }

        } else {

            cursor.pos =
                pos - 1;
        }
    },


    // ======================================
    // REPAIR EQUATION CURSOR
    // ======================================

    _repairEquationCursor() {

        if (
            !this.equationCursor
        ) {

            const root =
                this._getEquationRoot();


            this.equationCursor =
                CursorState.at(
                    root,
                    root.children.length
                );

            return;
        }


        const root =
            this._getEquationRoot();


        const owner =
            this.equationCursor.owner;


        if (
            owner === root
        ) {

            this.equationCursor.container =
                root.children;


            this.equationCursor.pos =
                Math.max(
                    0,
                    Math.min(
                        this.equationCursor.pos,
                        root.children.length
                    )
                );

            return;
        }


        if (!owner) {

            this.equationCursor =
                CursorState.at(
                    root,
                    root.children.length
                );

            return;
        }


        let node =
            owner;


        let attached =
            false;


        while (node) {

            if (
                node === root
            ) {

                attached = true;

                break;
            }


            node =
                node.parent;
        }


        if (!attached) {

            this.equationCursor =
                CursorState.at(
                    root,
                    root.children.length
                );
        }
    },


    // ======================================
    // EQUATION DISPLAY
    // ======================================

    updateEquationDisplay() {

        if (!this.display) {

            return;
        }


        const text =
            this._buildDisplayText(
                this.equationTree
            );


        const cursorPosition =
            this._getEquationDisplayCursorPosition();


        this._setDisplayValue(
            text,
            cursorPosition
        );


        if (
            this.displayResult &&
            !this.justCalculated
        ) {

            this.displayResult.textContent =
                '';
        }
    },


    // ======================================
    // SOLVE EQUATION
    // ======================================

    solveEquation() {

        const left =
            this._serializeForMathEngine(
                this.equationTree.left
            );


        const right =
            this._serializeForMathEngine(
                this.equationTree.right
            );


        if (
            !left ||
            !right
        ) {

            this.renderError(
                'Hãy nhập đầy đủ hai vế của phương trình.'
            );

            return;
        }


        const expression =
            `${left}=${right}`;


        try {

            const solved =
                MathEngine.solveEquation(
                    expression
                );


            this.lastExpression =
                expression;


            this.lastResult =
                solved.result ?? '';


            if (
                this.resultBox
            ) {

                this.resultBox.textContent =
                    solved.result ?? '—';
            }


            if (
                this.displayResult
            ) {

                this.displayResult.textContent =
                    solved.result ?? '';


                this.displayResult.classList
                    .remove(
                        'result-pop'
                    );


                void this.displayResult.offsetWidth;


                this.displayResult.classList
                    .add(
                        'result-pop'
                    );
            }


            this.justCalculated =
                true;


            this.setResultOpacity(
                true
            );


            this.renderSteps(
                solved.steps
            );


        } catch (err) {

            this.lastResult =
                '';


            this.justCalculated =
                false;


            if (
                this.resultBox
            ) {

                this.resultBox.textContent =
                    'Lỗi';
            }


            if (
                this.displayResult
            ) {

                this.displayResult.textContent =
                    'Lỗi';
            }


            this.setResultOpacity(
                false
            );


            this.renderError(
                err?.message ||
                'Không thể giải phương trình.'
            );
        }
    },


    // ======================================
    // CREATE POWER — CALCULATOR
    // ======================================

    _createPower() {

        const container =
            this.cursor.container;


        const pos =
            this.cursor.pos;


        if (
            !Array.isArray(container)
        ) {

            return;
        }


        if (
            this.cursor.owner &&
            this.cursor.owner.type === 'power' &&
            this.cursor.container ===
                this.cursor.owner.exponentChildren
        ) {

            return;
        }


        if (
            pos <= 0
        ) {

            return;
        }


        const base =
            container[pos - 1];


        if (!base) {

            return;
        }


        if (
            base.type === 'power'
        ) {

            return;
        }


        const power =
            new PowerNode(
                base,
                [],
                this.cursor.owner
            );


        container.splice(
            pos - 1,
            1,
            power
        );


        this.cursor.container =
            power.exponentChildren;


        this.cursor.owner =
            power;


        this.cursor.pos =
            0;
    },


    // ======================================
    // INSERT VALUE — CALCULATOR
    // ======================================

    _insertValue(value) {

        const container =
            this.cursor.container;


        if (
            !Array.isArray(container)
        ) {

            return;
        }


        // ----------------------------------
        // (
        // ----------------------------------

        if (
            value === '('
        ) {

            const group =
                new GroupNode(
                    [],
                    this.cursor.owner,
                    false
                );


            container.splice(
                this.cursor.pos,
                0,
                group
            );


            this.cursor.container =
                group.children;


            this.cursor.owner =
                group;


            this.cursor.pos =
                0;


            return;
        }


        // ----------------------------------
        // )
        // ----------------------------------

        if (
            value === ')'
        ) {

            let group =
                this.cursor.owner;


            while (
                group &&
                group.type !== 'group'
            ) {

                group =
                    group.parent;
            }


            if (
                !group ||
                group.type !== 'group'
            ) {

                return;
            }


            group.closed =
                true;


            const parent =
                group.parent;


            if (!parent) {

                return;
            }


            let parentArray =
                null;


            if (
                Array.isArray(
                    parent.children
                ) &&
                parent.children.includes(
                    group
                )
            ) {

                parentArray =
                    parent.children;
            }


            else if (
                Array.isArray(
                    parent.exponentChildren
                ) &&
                parent.exponentChildren.includes(
                    group
                )
            ) {

                parentArray =
                    parent.exponentChildren;
            }


            if (!parentArray) {

                return;
            }


            const index =
                parentArray.indexOf(
                    group
                );


            if (
                index === -1
            ) {

                return;
            }


            this.cursor.container =
                parentArray;


            this.cursor.owner =
                parent;


            this.cursor.pos =
                index + 1;


            return;
        }


        // ----------------------------------
        // NUMBER
        // ----------------------------------

        let node =
            null;


        if (
            /^[0-9.]+$/.test(value)
        ) {

            node =
                new NumberNode(
                    value,
                    this.cursor.owner
                );
        }


        // ----------------------------------
        // OPERATOR
        // ----------------------------------

        else if (
            [
                '+',
                '-',
                '*',
                '/',
                '×',
                '÷',
                '%'
            ].includes(value)
        ) {

            const operator =
                value === '×'
                    ? '*'
                    : value === '÷'
                        ? '/'
                        : value;


            node =
                new OperatorNode(
                    operator,
                    this.cursor.owner
                );
        }


        else {

            return;
        }


        const insertPos =
            this.cursor.pos;


        container.splice(
            insertPos,
            0,
            node
        );


        this.cursor.pos =
            insertPos + 1;
    },


    // ======================================
    // BACKSPACE — CALCULATOR
    // ======================================

    backspace() {

        const container =
            this.cursor.container;


        const pos =
            this.cursor.pos;


        if (
            !Array.isArray(container) ||
            pos <= 0
        ) {

            return;
        }


        const target =
            container[pos - 1];


        if (!target) {

            return;
        }


        container.splice(
            pos - 1,
            1
        );


        if (
            target.type === 'power' ||
            target.type === 'group'
        ) {

            this.cursor.container =
                container;


            this.cursor.pos =
                pos - 1;


            if (
                this.cursor.owner ===
                target
            ) {

                this.cursor.owner =
                    target.parent;
            }

        } else {

            this.cursor.pos =
                pos - 1;
        }


        this._repairCursor();


        this.justCalculated =
            false;


        this.setResultOpacity(
            false
        );


        this.updateDisplay();

        this.playInputAnimation();
    },


    // ======================================
    // REPAIR CALCULATOR CURSOR
    // ======================================

    _repairCursor() {

        if (!this.cursor) {

            return;
        }


        const owner =
            this.cursor.owner;


        if (
            owner === this.root
        ) {

            this.cursor.container =
                this.root.children;


            this.cursor.pos =
                Math.max(
                    0,
                    Math.min(
                        this.cursor.pos,
                        this.root.children.length
                    )
                );

            return;
        }


        if (!owner) {

            this.cursor =
                CursorState.at(
                    this.root,
                    this.root.children.length
                );

            return;
        }


        let node =
            owner;


        let attached =
            false;


        while (node) {

            if (
                node === this.root
            ) {

                attached = true;

                break;
            }

            node =
                node.parent;
        }


        if (attached) {

            return;
        }


        this.cursor =
            CursorState.at(
                this.root,
                this.root.children.length
            );
    },


    // ======================================
    // BALANCE PARENTHESES
    // ======================================

    _balanceParentheses(expression) {

        if (!expression) {

            return expression;
        }


        let depth =
            0;


        let result =
            '';


        for (
            let i = 0;
            i < expression.length;
            i++
        ) {

            const char =
                expression[i];


            if (
                char === '('
            ) {

                depth++;

                result += char;

                continue;
            }


            if (
                char === ')'
            ) {

                if (
                    depth > 0
                ) {

                    depth--;

                    result += char;
                }

                continue;
            }


            result += char;
        }


        if (
            depth > 0
        ) {

            result +=
                ')'.repeat(depth);
        }


        return result;
    },


    // ======================================
    // CALCULATE
    // ======================================

    calculate() {

        let expression =
            this._serializeForMathEngine(
                this.root
            );


        if (!expression) {

            return;
        }


        expression =
            this._balanceParentheses(
                expression
            );


        try {

            const solved =
                MathEngine.solve(
                    expression
                );


            const formatted =
                MathEngine.formatNumber(
                    solved.result
                );


            this.lastExpression =
                expression;


            this.lastResult =
                String(
                    formatted
                );


            if (
                this.resultBox
            ) {

                this.resultBox.textContent =
                    formatted;
            }


            if (
                this.displayResult
            ) {

                this.displayResult.textContent =
                    formatted;


                this.displayResult.classList
                    .remove(
                        'result-pop'
                    );


                void this.displayResult.offsetWidth;


                this.displayResult.classList
                    .add(
                        'result-pop'
                    );
            }


            this.justCalculated =
                true;


            this.setResultOpacity(
                true
            );


            this.renderSteps(
                solved.steps
            );


        } catch (err) {

            this.lastResult =
                '';


            this.justCalculated =
                false;


            if (
                this.resultBox
            ) {

                this.resultBox.textContent =
                    'Lỗi';
            }


            if (
                this.displayResult
            ) {

                this.displayResult.textContent =
                    'Lỗi';
            }


            this.setResultOpacity(
                false
            );


            this.renderError(
                err?.message ||
                'Không thể tính.'
            );
        }
    },


    // ======================================
    // SERIALIZE TREE
    // ======================================

    _serializeForMathEngine(node) {

        if (!node) {

            return '';
        }


        if (
            node.type === 'number'
        ) {

            return String(
                node.value
            );
        }


        if (
            node.type === 'variable'
        ) {

            return String(
                node.value
            );
        }


        if (
            node.type === 'operator'
        ) {

            return node.value;
        }


        if (
            node.type === 'group'
        ) {

            return (
                '(' +
                node.children
                    .map(
                        child =>
                            this._serializeForMathEngine(
                                child
                            )
                    )
                    .join('') +
                ')'
            );
        }


        if (
            node.type === 'power'
        ) {

            const base =
                node.base
                    ? this._serializeForMathEngine(
                        node.base
                    )
                    : '';


            const exponent =
                node.exponentChildren
                    .map(
                        child =>
                            this._serializeForMathEngine(
                                child
                            )
                    )
                    .join('');


            return (
                base +
                '^(' +
                exponent +
                ')'
            );
        }


        if (
            node.type === 'root'
        ) {

            return node.children
                .map(
                    child =>
                        this._serializeForMathEngine(
                            child
                        )
                )
                .join('');
        }


        if (
            node.type === 'equation'
        ) {

            return (
                this._serializeForMathEngine(
                    node.left
                ) +
                node.relation +
                this._serializeForMathEngine(
                    node.right
                )
            );
        }


        return '';
    },


    // ======================================
    // DISPLAY
    // ======================================

    updateDisplay() {

        if (
            this.mode === 'equation'
        ) {

            this.updateEquationDisplay();

            return;
        }


        const text =
            this._buildDisplayText(
                this.root
            );


        const cursorPosition =
            this._getDisplayCursorPosition();


        this._setDisplayValue(
            text,
            cursorPosition
        );


        if (
            this.displayResult &&
            !this.justCalculated
        ) {

            this.displayResult.textContent =
                '';
        }
    },


    // ======================================
    // PARSE
    // ======================================

    _parse(str) {

        const root =
            new RootNode();


        if (!str) {

            return root;
        }


        const normalized =
            MathEngine.normalize(
                String(str)
            );


        let tokens;


        try {

            tokens =
                MathEngine.tokenize(
                    normalized
                );

        } catch (_) {

            return root;
        }


        const stack = [
            root
        ];


        const getContainer =
            () => {

                const owner =
                    stack[
                        stack.length - 1
                    ];


                return {
                    owner,

                    array:
                        owner.type === 'power'
                            ? owner.exponentChildren
                            : owner.children
                };
            };


        tokens.forEach(token => {

            const {
                owner,
                array
            } =
                getContainer();


            if (
                token.type === 'number'
            ) {

                array.push(
                    new NumberNode(
                        String(
                            token.value
                        ),
                        owner
                    )
                );

                return;
            }


            if (
                token.type === 'variable'
            ) {

                array.push(
                    new VariableNode(
                        String(
                            token.value
                        ),
                        owner
                    )
                );

                return;
            }


            if (
                token.type === 'operator'
            ) {

                array.push(
                    new OperatorNode(
                        token.value,
                        owner
                    )
                );

                return;
            }


            if (
                token.type === 'leftParen'
            ) {

                const group =
                    new GroupNode(
                        [],
                        owner,
                        false
                    );


                array.push(
                    group
                );


                stack.push(
                    group
                );

                return;
            }


            if (
                token.type === 'rightParen'
            ) {

                if (
                    stack.length > 1
                ) {

                    const group =
                        stack.pop();


                    group.closed =
                        true;
                }
            }
        });


        return root;
    },


    // ======================================
    // RESULT OPACITY
    // ======================================

    setResultOpacity(calc) {

        this.display
            ?.classList
            .toggle(
                'expression-calculated',
                calc
            );


        this.displayResult
            ?.classList
            .toggle(
                'result-visible',
                calc
            );
    },


    // ======================================
    // INPUT ANIMATION
    // ======================================

    playInputAnimation() {

        if (!this.display) {

            return;
        }


        this.display.classList
            .remove(
                'calc-input-pop'
            );


        void this.display.offsetWidth;


        this.display.classList
            .add(
                'calc-input-pop'
            );


        clearTimeout(
            this.inputAnimationTimer
        );


        this.inputAnimationTimer =
            setTimeout(
                () => {

                    this.display
                        ?.classList
                        .remove(
                            'calc-input-pop'
                        );

                },
                250
            );
    },


    // ======================================
    // RENDER STEPS
    // ======================================

    renderSteps(steps) {

        if (!this.stepsBox) {

            return;
        }


        this.stepsBox.innerHTML =
            '';


        if (!steps?.length) {

            this.stepsBox.innerHTML =
                '<li>Biểu thức đã được tính.</li>';

            return;
        }


        steps.forEach(step => {

            const li =
                document.createElement(
                    'li'
                );


            li.textContent =
                String(step)
                    .replaceAll(
                        '*',
                        '×'
                    )
                    .replaceAll(
                        '/',
                        '÷'
                    )
                    .replaceAll(
                        '-',
                        '−'
                    );


            this.stepsBox.appendChild(
                li
            );
        });
    },


    // ======================================
    // ERROR
    // ======================================

    renderError(msg) {

        if (!this.stepsBox) {

            return;
        }


        this.stepsBox.innerHTML =
            '';


        const li =
            document.createElement(
                'li'
            );


        li.textContent =
            msg;


        this.stepsBox.appendChild(
            li
        );
    },


    // ======================================
    // CLEAR
    // ======================================

    clear() {

        if (
            this.mode === 'equation'
        ) {

            this.clearEquation();

            return;
        }


        this.root =
            new RootNode();


        this.cursor =
            CursorState.at(
                this.root,
                0
            );


        this.lastExpression =
            '';


        this.lastResult =
            '';


        this.justCalculated =
            false;


        if (
            this.resultBox
        ) {

            this.resultBox.textContent =
                '—';
        }


        if (
            this.displayResult
        ) {

            this.displayResult.textContent =
                '';
        }


        this.setResultOpacity(
            false
        );


        if (
            this.stepsBox
        ) {

            this.stepsBox.innerHTML =
                '<li class="calc-step-empty">Nhập biểu thức để xem cách giải.</li>';
        }


        this.updateDisplay();
    },


    // ======================================
    // CLEAR EQUATION
    // ======================================

    clearEquation() {

        this.equationTree =
            new EquationNode();


        this.equationSide =
            'left';


        this.equationCursor =
            CursorState.at(
                this.equationTree.left,
                0
            );


        this.lastExpression =
            '';


        this.lastResult =
            '';


        this.justCalculated =
            false;


        if (
            this.resultBox
        ) {

            this.resultBox.textContent =
                '—';
        }


        if (
            this.displayResult
        ) {

            this.displayResult.textContent =
                '';
        }


        this.setResultOpacity(
            false
        );


        if (
            this.stepsBox
        ) {

            this.stepsBox.innerHTML =
                '<li class="calc-step-empty">Nhập phương trình để xem cách giải.</li>';
        }


        this.updateEquationDisplay();
    }
};


let calculatorInstance = null;

async function init() {
    if (calculatorInstance) {
        return calculatorInstance;
    }

    calculatorInstance = CalculatorTool;

    calculatorInstance.init();

    return calculatorInstance;
}

export {
    CalculatorTool,
    init
};

export default CalculatorTool;

