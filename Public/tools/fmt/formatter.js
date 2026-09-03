// ============================================================
// HYDYAR TOOLS — COUNTER + FORMATTER
// V4.0
//
// RULES
// - Không xóa cơ chế cũ nếu chưa khai báo.
// - Mọi cải tiến mới ghi version bên dưới.
// - Counter + Formatter dùng chung một textarea.
// - Sau mỗi lần Formatter thay đổi text → phân tích lại.
// - Progressive Analyzer: 800 ký tự / chunk.
// - Không block UI khi xử lý văn bản dài.
// ============================================================


// ============================================================
// V4.0 — TEXT FORMATTER CORE
// ============================================================

class TextFormatterCore {

    /**
     * Định dạng văn bản.
     *
     * @param {string} text
     * @param {string} action
     * @returns {string}
     */
    static format(text = "", action = "") {

        if (!text) {
            return "";
        }


        switch (action) {

            // ------------------------------------------------
            // Xóa khoảng trắng đầu/cuối
            // ------------------------------------------------

            case "trim":

                return text
                    .split(/\r\n|\r|\n/)
                    .map(line => line.trim())
                    .join("\n")
                    .trim();


            // ------------------------------------------------
            // Gộp khoảng trắng
            // ------------------------------------------------

            case "spaces":

                return text.replace(
                    /[ \t]{2,}/g,
                    " "
                );


            // ------------------------------------------------
            // Xóa dòng trống
            // ------------------------------------------------

            case "emptyLines":

                return text
                    .split(/\r\n|\r|\n/)
                    .filter(line => line.trim() !== "")
                    .join("\n");


            // ------------------------------------------------
            // Chuẩn hóa xuống dòng
            // ------------------------------------------------

            case "lineBreaks":

                return text
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n")
                    .replace(/\n{3,}/g, "\n\n");


            // ------------------------------------------------
            // VIẾT HOA
            // ------------------------------------------------

            case "upper":

                return text.toLocaleUpperCase();


            // ------------------------------------------------
            // viết thường
            // ------------------------------------------------

            case "lower":

                return text.toLocaleLowerCase();


            // ------------------------------------------------
            // Viết Hoa Chữ Đầu
            // ------------------------------------------------

            case "capitalize":

                return text.replace(
                    /(^|[\s.!?;:]+)(\p{L})/gu,
                    (
                        match,
                        separator,
                        letter
                    ) => {

                        return (
                            separator +
                            letter.toLocaleUpperCase()
                        );

                    }
                );


            // ------------------------------------------------
            // Xóa ký tự đặc biệt
            // ------------------------------------------------

            case "removeSpecial":

                return text.replace(
                    /[^\p{L}\p{N}\s]/gu,
                    ""
                );


            // ------------------------------------------------
            // Xóa số
            // ------------------------------------------------

            case "removeNumbers":

                return text.replace(
                    /\p{N}/gu,
                    ""
                );


            // ------------------------------------------------
            // Không có action
            // ------------------------------------------------

            default:

                return text;

        }

    }

}


// ============================================================
// V4.0 — WORD COUNTER CORE
//
// Progressive-safe analyzer.
//
// State được giữ giữa các chunk:
// - inWord
// - spaceRun
//
// Vì vậy:
//   "abc" + "def"
// vẫn được tính là 1 từ.
//
// Và:
//   "  " + "  "
// vẫn có thể phát hiện khoảng trắng dài.
// ============================================================

class WordCounterCore {

    constructor() {

        this.characters = 0;

        this.words = 0;

        this.letters = 0;

        this.numbers = 0;

        this.special = 0;

        this.spaces = 0;

        this.longSpaces = 0;

        this.lines = 0;


        // Trạng thái từ
        this.inWord = false;


        // Chuỗi khoảng trắng liên tiếp
        this.spaceRun = 0;

    }


    // --------------------------------------------------------
    // PROCESS
    // --------------------------------------------------------

    process(text = "") {

        for (const char of text) {

            this.characters++;


            // ================================================
            // Xuống dòng
            // ================================================

            if (char === "\n") {

                this.lines++;

                this.finishWord();

                this.finishSpaceRun();

                continue;

            }


            // ================================================
            // CR
            //
            // CRLF:
            // \r không tạo thêm dòng.
            // \n mới tăng lines.
            // ================================================

            if (char === "\r") {

                continue;

            }


            // ================================================
            // Khoảng trắng
            // ================================================

            if (
                char === " " ||
                char === "\t"
            ) {

                this.spaces++;

                this.finishWord();

                this.spaceRun++;

                continue;

            }


            // Ký tự hiện tại không phải space
            this.finishSpaceRun();


            // ================================================
            // Chữ
            // ================================================

            if (
                WordCounterCore.isLetter(char)
            ) {

                this.letters++;

                this.startWord();

                continue;

            }


            // ================================================
            // Số
            // ================================================

            if (
                WordCounterCore.isNumber(char)
            ) {

                this.numbers++;

                this.startWord();

                continue;

            }


            // ================================================
            // Ký tự đặc biệt
            // ================================================

            this.special++;

            this.finishWord();

        }

    }


    // --------------------------------------------------------
    // START WORD
    // --------------------------------------------------------

    startWord() {

        if (!this.inWord) {

            this.words++;

            this.inWord = true;

        }

    }


    // --------------------------------------------------------
    // FINISH WORD
    // --------------------------------------------------------

    finishWord() {

        this.inWord = false;

    }


    // --------------------------------------------------------
    // FINISH SPACE RUN
    // --------------------------------------------------------

    finishSpaceRun() {

        if (this.spaceRun >= 3) {

            this.longSpaces++;

        }

        this.spaceRun = 0;

    }


    // --------------------------------------------------------
    // LETTER
    // --------------------------------------------------------

    static isLetter(char) {

        return /\p{L}/u.test(char);

    }


    // --------------------------------------------------------
    // NUMBER
    // --------------------------------------------------------

    static isNumber(char) {

        return /\p{N}/u.test(char);

    }


    // --------------------------------------------------------
    // FINISH
    // --------------------------------------------------------

    finish() {

        this.finishSpaceRun();

    }


    // --------------------------------------------------------
    // RESULT
    // --------------------------------------------------------

    result() {

        return {

            characters: this.characters,

            words: this.words,

            letters: this.letters,

            numbers: this.numbers,

            special: this.special,

            spaces: this.spaces,

            longSpaces: this.longSpaces,

            lines: this.lines

        };

    }


    // --------------------------------------------------------
    // EMPTY
    // --------------------------------------------------------

    static empty() {

        return {

            characters: 0,

            words: 0,

            letters: 0,

            numbers: 0,

            special: 0,

            spaces: 0,

            longSpaces: 0,

            lines: 0

        };

    }


    // --------------------------------------------------------
    // ANALYZE SMALL TEXT
    // --------------------------------------------------------

    static analyze(text = "") {

        const analyzer =
            new WordCounterCore();

        analyzer.process(text);

        analyzer.finish();

        return analyzer.result();

    }

}


// ============================================================
// V4.0 — COUNTER TOOL
// ============================================================

class CounterTool {

    constructor() {

        // ----------------------------------------------------
        // DOM
        // ----------------------------------------------------

        this.section =
            document.getElementById(
                "counter-tool"
            );


        this.input =
            document.getElementById(
                "counterInput"
            );


        // ----------------------------------------------------
        // Main stats
        // ----------------------------------------------------

        this.charCount =
            document.getElementById(
                "charCount"
            );


        this.wordCount =
            document.getElementById(
                "wordCount"
            );


        this.lineCount =
            document.getElementById(
                "lineCount"
            );


        // ----------------------------------------------------
        // Extended stats
        // ----------------------------------------------------

        this.letterCount =
            document.getElementById(
                "letterCount"
            );


        this.numberCount =
            document.getElementById(
                "numberCount"
            );


        this.specialCount =
            document.getElementById(
                "specialCount"
            );


        this.spaceCount =
            document.getElementById(
                "spaceCount"
            );


        this.longSpaceCount =
            document.getElementById(
                "longSpaceCount"
            );


        // ----------------------------------------------------
        // Buttons
        // ----------------------------------------------------

        this.undoButton =
            document.getElementById(
                "counterUndo"
            );


        this.copyButton =
            document.getElementById(
                "counterCopy"
            );


        this.clearButton =
            document.getElementById(
                "counterClear"
            );


        // ----------------------------------------------------
        // Status
        // ----------------------------------------------------

        this.status =
            document.getElementById(
                "counterStatus"
            );


        // ----------------------------------------------------
        // Progressive processing
        // ----------------------------------------------------

        this.chunkSize = 800;

        this.analysisToken = 0;

        this.processing = false;


        // ----------------------------------------------------
        // Undo
        // ----------------------------------------------------

        this.lastText = "";

        this.hasUndo = false;


        // ----------------------------------------------------
        // Init
        // ----------------------------------------------------

        this.bindEvents();

        this.updateButtons();

        this.update();

    }


    // ========================================================
    // V4.0 — EVENT BINDING
    // ========================================================

    bindEvents() {

        if (!this.input) {

            return;

        }


        // ----------------------------------------------------
        // Text input
        // ----------------------------------------------------

        this.input.addEventListener(
            "input",
            () => {

                this.hasUndo = false;

                this.lastText = "";

                this.updateButtons();

                this.update();

            }
        );


        // ----------------------------------------------------
        // Formatter delegation
        // ----------------------------------------------------

        if (this.section) {

            this.section.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-format]"
            );

        if (!button) {
            return;
        }

        if (
            !this.section.contains(button)
        ) {
            return;
        }

        // Không để textarea giữ focus
        // → nút Formatter không làm bàn phím bật lại
        if (this.input) {
            this.input.blur();
        }

        const action =
            button.dataset.format;

        this.format(action);

    }
);

        }


        // ----------------------------------------------------
        // Undo
        // ----------------------------------------------------

        if (this.undoButton) {

            this.undoButton.addEventListener(
                "click",
                () => {

                    this.undo();

                }
            );

        }


        // ----------------------------------------------------
        // Copy
        // ----------------------------------------------------

        if (this.copyButton) {

            this.copyButton.addEventListener(
                "click",
                () => {

                    this.copy();

                }
            );

        }


        // ----------------------------------------------------
        // Clear
        // ----------------------------------------------------

        if (this.clearButton) {

            this.clearButton.addEventListener(
                "click",
                () => {

                    this.clear();

                }
            );

        }

    }


    // ========================================================
    // V4.0 — FORMAT
    // ========================================================

    format(action) {

        if (!this.input) {

            return;

        }


        const currentText =
            this.input.value;


        // Không có nội dung
        if (!currentText) {

            this.setStatus(
                "Chưa có nội dung."
            );

            return;

        }


        // ----------------------------------------------------
        // Tạo kết quả
        // ----------------------------------------------------

        const result =
            TextFormatterCore.format(
                currentText,
                action
            );


        // Không thay đổi
        if (result === currentText) {

            this.setStatus(
                "Văn bản không thay đổi."
            );

            return;

        }


        // ----------------------------------------------------
        // Lưu undo
        // ----------------------------------------------------

        this.lastText =
            currentText;

        this.hasUndo = true;


        // ----------------------------------------------------
        // Apply
        // ----------------------------------------------------

        this.input.value =
            result;


        // ----------------------------------------------------
        // UI
        // ----------------------------------------------------

        this.updateButtons();

        this.setStatus(
            "Đã định dạng."
        );


        // ----------------------------------------------------
        // Phân tích lại
        // ----------------------------------------------------

        this.update();

    }


    // ========================================================
    // V4.0 — UNDO
    // ========================================================

    undo() {

        if (
            !this.input ||
            !this.hasUndo
        ) {

            return;

        }


        const currentText =
            this.input.value;


        const previousText =
            this.lastText;


        // ----------------------------------------------------
        // Swap
        // ----------------------------------------------------

        this.input.value =
            previousText;


        this.lastText =
            currentText;


        // ----------------------------------------------------
        // Single-level undo
        //
        // Sau khi undo:
        // - không cho undo tiếp
        // ----------------------------------------------------

        this.hasUndo = false;


        this.updateButtons();


        this.setStatus(
            "Đã hoàn tác."
        );


        this.update();

    }


    // ========================================================
    // V4.0 — COPY
    // ========================================================

    async copy() {

        if (!this.input) {

            return;

        }


        const text =
            this.input.value;


        if (!text) {

            return;

        }


        // ----------------------------------------------------
        // Clipboard API
        // ----------------------------------------------------

        try {

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    text
                );

                this.setStatus(
                    "Đã sao chép."
                );

                return;

            }

        } catch (_) {

            // fallback bên dưới

        }


        // ----------------------------------------------------
        // Fallback
        // ----------------------------------------------------

        try {

            this.input.select();

            const success =
                document.execCommand(
                    "copy"
                );


            if (success) {

                this.setStatus(
                    "Đã sao chép."
                );

            } else {

                this.setStatus(
                    "Không thể sao chép."
                );

            }

        } catch (_) {

            this.setStatus(
                "Không thể sao chép."
            );

        }

    }


    // ========================================================
    // V4.0 — CLEAR
    // ========================================================

    clear() {

        if (!this.input) {

            return;

        }


        const currentText =
            this.input.value;


        if (!currentText) {

            return;

        }


        // ----------------------------------------------------
        // Lưu để undo
        // ----------------------------------------------------

        this.lastText =
            currentText;

        this.hasUndo = true;


        // ----------------------------------------------------
        // Hủy analysis đang chạy
        // ----------------------------------------------------

        this.analysisToken++;


        this.processing = false;


        // ----------------------------------------------------
        // Clear
        // ----------------------------------------------------

        this.input.value = "";


        // ----------------------------------------------------
        // Reset
        // ----------------------------------------------------

        this.renderResult(
            WordCounterCore.empty()
        );


        this.updateButtons();


        this.setStatus(
            "Đã xóa nội dung."
        );

    }


    // ========================================================
    // V4.0 — PROGRESSIVE UPDATE
    // ========================================================

    update() {

        if (!this.input) {

            return;

        }


        const text =
            this.input.value;


        // ----------------------------------------------------
        // Token chống race condition
        // ----------------------------------------------------

        this.analysisToken++;

        const token =
            this.analysisToken;


        // ----------------------------------------------------
        // Empty
        // ----------------------------------------------------

        if (!text) {

            this.processing = false;

            this.renderResult(
                WordCounterCore.empty()
            );

            this.setStatus(
                "Sẵn sàng."
            );

            this.updateButtons();

            return;

        }


        // ----------------------------------------------------
        // Processing
        // ----------------------------------------------------

        this.processing = true;


        this.setStatus(
            "Đang xử lý..."
        );


        // ----------------------------------------------------
        // Reset stats
        // ----------------------------------------------------

        this.renderResult(
            WordCounterCore.empty()
        );


        const analyzer =
            new WordCounterCore();


        let position = 0;


        // ----------------------------------------------------
        // Process chunk
        // ----------------------------------------------------

        const processChunk = () => {

            // Request cũ
            if (
                token !== this.analysisToken
            ) {

                return;

            }


            // ------------------------------------------------
            // Hoàn thành
            // ------------------------------------------------

            if (
                position >= text.length
            ) {

                analyzer.finish();


                this.processing = false;


                this.renderResult(
                    analyzer.result()
                );


                this.setStatus(
                    `Đã xử lý ${text.length.toLocaleString("vi-VN")} ký tự.`
                );


                this.updateButtons();

                return;

            }


            // ------------------------------------------------
            // Chunk
            // ------------------------------------------------

            const end =
                Math.min(
                    position +
                    this.chunkSize,
                    text.length
                );


            const chunk =
                text.slice(
                    position,
                    end
                );


            analyzer.process(chunk);


            position = end;


            // ------------------------------------------------
            // Render tiến trình
            // ------------------------------------------------

            this.renderResult(
                analyzer.result()
            );


            // ------------------------------------------------
            // Nhường main thread
            // ------------------------------------------------

            setTimeout(
                processChunk,
                0
            );

        };


        processChunk();

    }


    // ========================================================
    // V4.0 — RENDER RESULT
    // ========================================================

    renderResult(result) {

        if (this.charCount) {

            this.charCount.textContent =
                Number(
                    result.characters || 0
                ).toLocaleString("vi-VN");

        }


        if (this.wordCount) {

            this.wordCount.textContent =
                Number(
                    result.words || 0
                ).toLocaleString("vi-VN");

        }


        if (this.letterCount) {

            this.letterCount.textContent =
                Number(
                    result.letters || 0
                ).toLocaleString("vi-VN");

        }


        if (this.numberCount) {

            this.numberCount.textContent =
                Number(
                    result.numbers || 0
                ).toLocaleString("vi-VN");

        }


        if (this.specialCount) {

            this.specialCount.textContent =
                Number(
                    result.special || 0
                ).toLocaleString("vi-VN");

        }


        if (this.spaceCount) {

            this.spaceCount.textContent =
                Number(
                    result.spaces || 0
                ).toLocaleString("vi-VN");

        }


        if (this.longSpaceCount) {

            this.longSpaceCount.textContent =
                Number(
                    result.longSpaces || 0
                ).toLocaleString("vi-VN");

        }


        if (this.lineCount) {

            this.lineCount.textContent =
                Number(
                    result.lines || 0
                ).toLocaleString("vi-VN");

        }

    }


    // ========================================================
    // V4.0 — BUTTON STATE
    // ========================================================

    updateButtons() {

        const hasText =
            !!(
                this.input &&
                this.input.value
            );


        if (this.copyButton) {

            this.copyButton.disabled =
                !hasText;

        }


        if (this.clearButton) {

            this.clearButton.disabled =
                !hasText;

        }


        if (this.undoButton) {

            this.undoButton.disabled =
                !this.hasUndo;

        }

    }


    // ========================================================
    // V4.0 — STATUS
    // ========================================================

    setStatus(message) {

        if (!this.status) {

            return;

        }


        this.status.textContent =
            message;

    }

}


// ============================================================
// V4.0 — AUTO INITIALIZATION
// ============================================================

(function initCounterTool() {

    const start = () => {

        if (
            !document.getElementById(
                "counter-tool"
            )
        ) {

            return;

        }


        // Tránh khởi tạo 2 lần
        if (
            window.HydYarCounterTool
        ) {

            return;

        }


        window.HydYarCounterTool =
            new CounterTool();

    };


    // DOM đã sẵn sàng
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    } else {

        start();

    }

})();


// ============================================================
// V4.0 — PUBLIC API
//
// Cho phép module khác sử dụng:
//
// HydYarTextFormatter.format(...)
// HydYarWordCounter.analyze(...)
//
// ============================================================

window.HydYarTextFormatter = {

    format(
        text,
        action
    ) {

        return TextFormatterCore.format(
            text,
            action
        );

    }

};


window.HydYarWordCounter = {

    analyze(text) {

        return WordCounterCore.analyze(
            text
        );

    }

};


// ============================================================
// V4.0 — END
// ============================================================