// ==========================================
// HYDYAR TOOLS — MATH ENGINE (V2.4)
// ==========================================
// MathEngine = TOÀN BỘ LOGIC TOÁN HỌC
//
// V2.4 — EXPLAINED SOLUTION:
// - Giữ nguyên toàn bộ cơ chế V2.3
// - Thêm tiêu đề bước giải:
//      Phép tính: ...
//      Phương trình: ...
// - Thêm giải thích ngữ nghĩa cho từng phép toán
// - Calculator:
//      Mũ
//      Cộng
//      Trừ
//      Nhân
//      Chia
//      Phần trăm
//      Tính trong ngoặc
// - Equation:
//      Chuyển về dạng chuẩn
//      Rút gọn
//      Đổi vế
//      Chia hai vế
//      Nhân hai vế
//      Khai triển
//      Phân tích nhân tử
//      HĐT
//      Tính biệt thức
//      Tính nghiệm
//      Kết luận
// - Không hiển thị bước giải không thực sự được sử dụng
// - stepTitle tách khỏi steps để UI không đánh số tiêu đề
//
// V2.3:
// - Giữ nguyên Calculator số
// - Phương trình hỗ trợ tối đa BẬC 2
// - Polynomial representation: [c, b, a]
//   tương ứng c + bx + ax²
// - Hỗ trợ:
//      x
//      2x
//      x²
//      x^2
//      2x² + 3x - 5
//      (x + 1)²
//      x(x + 2)
//      (x - 3)(x + 3)
// - Hỗ trợ implicit multiplication
// - Chia cho hằng số
// - Unary + / -
// - Ưu tiên phương pháp nhanh
// - Nhận diện HĐT:
//      1. (a+b)²
//      2. (a-b)²
//      3. a²-b²
// - Nếu không phân tích nhanh được → công thức nghiệm
//
// CHƯA HỖ TRỢ:
// - Phương trình bậc 3
// - Căn thức tổng quát
// - Lũy thừa chứa x
// - Chia cho biểu thức chứa x
//
// ==========================================

// ==========================================
// MAIN
// ==========================================

const MathEngine = {

    // ======================================
    // MAIN — CALCULATOR
    // ======================================

    solve(expression) {

        if (
            typeof expression !== 'string' ||
            !expression.trim()
        ) {
            throw new Error('Biểu thức trống.');
        }

        const normalized =
            this.normalize(expression);

        const tokens =
            this.tokenize(normalized);

        const rpn =
            this.toRPN(tokens);

        const result =
            this.evaluateRPN(rpn);

        const steps =
            this.generateSteps(tokens);

        return {
            expression: normalized,
            result,
            steps
        };
    },


    // ======================================
    // MAIN — EQUATION
    // ======================================

    solveEquation(expression) {

        if (
            typeof expression !== 'string' ||
            !expression.trim()
        ) {
            throw new Error(
                'Vui lòng nhập phương trình.'
            );
        }


        const normalized =
            this.normalizeEquation(expression);


        // ----------------------------------
        // KIỂM TRA =
        // ----------------------------------

        const equalIndex =
            normalized.indexOf('=');


        if (equalIndex < 0) {

            throw new Error(
                'Phương trình phải có dấu =.'
            );
        }


        if (
            equalIndex !==
            normalized.lastIndexOf('=')
        ) {

            throw new Error(
                'Phương trình chỉ được có một dấu =.'
            );
        }


        const left =
            normalized
                .slice(0, equalIndex)
                .trim();


        const right =
            normalized
                .slice(equalIndex + 1)
                .trim();


        if (!left || !right) {

            throw new Error(
                'Hai vế của phương trình không được để trống.'
            );
        }


        // ----------------------------------
        // PARSE POLYNOMIAL
        // ----------------------------------

        const leftPoly =
            this.parsePolynomialExpression(left);


        const rightPoly =
            this.parsePolynomialExpression(right);


        // ----------------------------------
        // CHUYỂN:
        //
        // LEFT = RIGHT
        //
        // → LEFT - RIGHT = 0
        // ----------------------------------

        const poly =
            this.subtractPolynomials(
                leftPoly,
                rightPoly
            );


        this.trimPolynomial(poly);


        const degree =
            this.polynomialDegree(poly);


        const steps = [];


        // ----------------------------------
        // Hiển thị dạng chuẩn
        // ----------------------------------

        steps.push(
            `${this.formatPolynomial(leftPoly)} = ${this.formatPolynomial(rightPoly)}`
        );


        steps.push(
            `${this.formatPolynomial(poly)} = 0`
        );


        // ==================================
        // BẬC 0
        // ==================================

        if (degree === 0) {

            if (
                Math.abs(poly[0]) < 1e-12
            ) {

                steps.push(
                    'Hai vế tương đương nhau.'
                );

                return {
                    type: 'infinite',
                    variable: 'x',
                    value: null,
                    degree: 0,
                    method: 'identity',
                    expression: normalized,
                    steps,
                    result: 'Vô số nghiệm'
                };
            }


            steps.push(
                'Hai vế không thể bằng nhau.'
            );


            return {
                type: 'none',
                variable: 'x',
                value: null,
                degree: 0,
                method: 'constant',
                expression: normalized,
                steps,
                result: 'Vô nghiệm'
            };
        }


        // ==================================
        // BẬC 1
        // ==================================

        if (degree === 1) {

            return this.solveLinearPolynomial(
                poly,
                normalized,
                steps
            );
        }


        // ==================================
        // BẬC 2
        // ==================================

        if (degree === 2) {

            return this.solveQuadraticPolynomial(
                poly,
                normalized,
                steps
            );
        }


        // ==================================
        // > BẬC 2
        // ==================================

        throw new Error(
            'Phương trình bậc lớn hơn 2 hiện chưa được hỗ trợ.'
        );
    },


    // ======================================
    // NORMALIZE — CALCULATOR
    // ======================================

    normalize(expression) {

        return expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\s+/g, '')
            .trim();
    },


    // ======================================
    // NORMALIZE — EQUATION
    // ======================================

    normalizeEquation(expression) {

        return expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
    },


    // ======================================
    // TOKENIZER
    // ======================================

    tokenize(expression) {

        const tokens = [];
        let number = '';


        const flushNumber = () => {

            if (number === '') {
                return;
            }


            if (
                (number.match(/\./g) || [])
                    .length > 1
            ) {

                throw new Error(
                    `Số không hợp lệ: ${number}`
                );
            }


            const value =
                Number(number);


            if (Number.isNaN(value)) {

                throw new Error(
                    `Số không hợp lệ: ${number}`
                );
            }


            tokens.push({
                type: 'number',
                value
            });


            number = '';
        };


        const canStartUnary = () => {

            if (!tokens.length) {
                return true;
            }


            const previous =
                tokens[tokens.length - 1];


            return (
                previous.type === 'operator' ||
                previous.type === 'leftParen'
            );
        };


        for (
            let i = 0;
            i < expression.length;
            i++
        ) {

            const char =
                expression[i];


            if (/[0-9.]/.test(char)) {

                number += char;

                continue;
            }


            if (
                char === '+' ||
                char === '-'
            ) {

                flushNumber();


                if (canStartUnary()) {

                    let sign = char;
                    let j = i + 1;


                    while (
                        j < expression.length &&
                        (
                            expression[j] === '+' ||
                            expression[j] === '-'
                        )
                    ) {

                        if (
                            expression[j] === '-'
                        ) {

                            sign =
                                sign === '-'
                                    ? '+'
                                    : '-';
                        }

                        j++;
                    }


                    if (
                        expression[j] === '('
                    ) {

                        tokens.push({
                            type: 'number',
                            value:
                                sign === '-'
                                    ? -1
                                    : 1
                        });


                        tokens.push({
                            type: 'operator',
                            value: '*'
                        });


                        i = j - 1;

                        continue;
                    }


                    let valueString = '';


                    while (
                        j < expression.length &&
                        /[0-9.]/.test(
                            expression[j]
                        )
                    ) {

                        valueString +=
                            expression[j];

                        j++;
                    }


                    if (!valueString) {

                        throw new Error(
                            `Dấu ${char} phải đi trước một số hoặc biểu thức.`
                        );
                    }


                    if (
                        (
                            valueString.match(/\./g) ||
                            []
                        ).length > 1
                    ) {

                        throw new Error(
                            `Số không hợp lệ: ${valueString}`
                        );
                    }


                    let value =
                        Number(valueString);


                    if (Number.isNaN(value)) {

                        throw new Error(
                            `Số không hợp lệ: ${valueString}`
                        );
                    }


                    if (sign === '-') {
                        value = -value;
                    }


                    tokens.push({
                        type: 'number',
                        value
                    });


                    i = j - 1;

                    continue;
                }


                tokens.push({
                    type: 'operator',
                    value: char
                });

                continue;
            }


            flushNumber();


            if (
                [
                    '*',
                    '/',
                    '^',
                    '%'
                ].includes(char)
            ) {

                tokens.push({
                    type: 'operator',
                    value: char
                });

                continue;
            }


            if (char === '(') {

                tokens.push({
                    type: 'leftParen',
                    value: char
                });

                continue;
            }


            if (char === ')') {

                tokens.push({
                    type: 'rightParen',
                    value: char
                });

                continue;
            }


            throw new Error(
                `Ký tự không hợp lệ: ${char}`
            );
        }


        flushNumber();


        if (!tokens.length) {

            throw new Error(
                'Không có dữ liệu để tính.'
            );
        }


        return tokens;
    },


    // ======================================
    // PRECEDENCE
    // ======================================

    precedence(operator) {

        switch (operator) {

            case '%':
                return 4;

            case '^':
                return 3;

            case '*':
            case '/':
                return 2;

            case '+':
            case '-':
                return 1;

            default:
                return 0;
        }
    },


    // ======================================
    // ASSOCIATIVITY
    // ======================================

    isRightAssociative(operator) {

        return operator === '^';
    },


    // ======================================
    // SHUNTING YARD
    // ======================================

    toRPN(tokens) {

        const output = [];
        const operators = [];


        for (const token of tokens) {

            if (token.type === 'number') {

                output.push(token);

                continue;
            }


            if (token.type === 'leftParen') {

                operators.push(token);

                continue;
            }


            if (token.type === 'rightParen') {

                while (
                    operators.length &&
                    operators[
                        operators.length - 1
                    ].type !== 'leftParen'
                ) {

                    output.push(
                        operators.pop()
                    );
                }


                if (!operators.length) {

                    throw new Error(
                        'Thiếu dấu "("'
                    );
                }


                operators.pop();

                continue;
            }


            if (token.type === 'operator') {

                while (operators.length) {

                    const top =
                        operators[
                            operators.length - 1
                        ];


                    if (
                        top.type !== 'operator'
                    ) {
                        break;
                    }


                    const currentPrecedence =
                        this.precedence(
                            token.value
                        );


                    const topPrecedence =
                        this.precedence(
                            top.value
                        );


                    const shouldPop =
                        this.isRightAssociative(
                            token.value
                        )
                            ? currentPrecedence <
                              topPrecedence
                            : currentPrecedence <=
                              topPrecedence;


                    if (!shouldPop) {
                        break;
                    }


                    output.push(
                        operators.pop()
                    );
                }


                operators.push(token);
            }
        }


        while (operators.length) {

            const operator =
                operators.pop();


            if (
                operator.type === 'leftParen'
            ) {

                throw new Error(
                    'Thiếu dấu ")"'
                );
            }


            output.push(operator);
        }


        return output;
    },


    // ======================================
    // EVALUATE RPN
    // ======================================

    evaluateRPN(rpn) {

        const stack = [];


        for (const token of rpn) {

            if (token.type === 'number') {

                stack.push(token.value);

                continue;
            }


            const operator =
                token.value;


            if (operator === '%') {

                if (stack.length < 1) {

                    throw new Error(
                        'Phần trăm không hợp lệ.'
                    );
                }


                const value =
                    stack.pop();


                stack.push(
                    value / 100
                );

                continue;
            }


            if (stack.length < 2) {

                throw new Error(
                    'Biểu thức không hợp lệ.'
                );
            }


            const right =
                stack.pop();


            const left =
                stack.pop();


            let result;


            switch (operator) {

                case '+':
                    result =
                        left + right;
                    break;

                case '-':
                    result =
                        left - right;
                    break;

                case '*':
                    result =
                        left * right;
                    break;

                case '/':

                    if (right === 0) {

                        throw new Error(
                            'Không thể chia cho 0.'
                        );
                    }

                    result =
                        left / right;

                    break;

                case '^':

                    result =
                        Math.pow(
                            left,
                            right
                        );

                    break;

                default:

                    throw new Error(
                        `Toán tử không hỗ trợ: ${operator}`
                    );
            }


            if (!Number.isFinite(result)) {

                throw new Error(
                    'Kết quả vượt quá giới hạn số.'
                );
            }


            stack.push(result);
        }


        if (stack.length !== 1) {

            throw new Error(
                'Biểu thức không hợp lệ.'
            );
        }


        return this.cleanNumber(
            stack[0]
        );
    },


    // ======================================
    // POLYNOMIAL CONSTANTS
    // ======================================

    MAX_DEGREE: 2,


    // ======================================
    // POLYNOMIAL PARSER
    //
    // Polynomial = [c0, c1, c2]
    //
    // c0 + c1*x + c2*x²
    // ======================================

    parsePolynomialExpression(expression) {

        const text =
            this.normalizeEquation(
                expression
            );


        let index = 0;


        const peek = () =>
            text[index];


        const isNumberStart = char =>
            !!char &&
            /[0-9.]/.test(char);


        const parseExpression = () => {

            let result =
                parseTerm();


            while (true) {

                if (peek() === '+') {

                    index++;

                    result =
                        this.addPolynomials(
                            result,
                            parseTerm()
                        );

                    continue;
                }


                if (peek() === '-') {

                    index++;

                    result =
                        this.subtractPolynomials(
                            result,
                            parseTerm()
                        );

                    continue;
                }


                break;
            }


            return result;
        };


        const parseTerm = () => {

            let result =
                parseUnary();


            while (true) {

                if (peek() === '*') {

                    index++;

                    const right =
                        parseUnary();


                    result =
                        this.multiplyPolynomials(
                            result,
                            right
                        );

                    continue;
                }


                if (peek() === '/') {

                    index++;

                    const right =
                        parseUnary();


                    result =
                        this.dividePolynomial(
                            result,
                            right
                        );

                    continue;
                }


                if (
                    this.isPolynomialImplicitStart(
                        peek()
                    )
                ) {

                    const right =
                        parseUnary();


                    result =
                        this.multiplyPolynomials(
                            result,
                            right
                        );

                    continue;
                }


                break;
            }


            return result;
        };


        const parseUnary = () => {

            if (peek() === '+') {

                index++;

                return parseUnary();
            }


            if (peek() === '-') {

                index++;

                return this.scalePolynomial(
                    parseUnary(),
                    -1
                );
            }


            return parsePower();
        };


        const parsePower = () => {

            let base =
                parsePrimary();


            if (peek() === '^') {

                index++;


                const exponent =
                    parsePower();


                const exponentDegree =
                    this.polynomialDegree(
                        exponent
                    );


                if (
                    exponentDegree !== 0
                ) {

                    throw new Error(
                        'Số mũ không được chứa x.'
                    );
                }


                const exponentValue =
                    exponent[0];


                if (
                    !Number.isInteger(
                        exponentValue
                    )
                ) {

                    throw new Error(
                        'Số mũ của phương trình phải là số nguyên.'
                    );
                }


                if (
                    exponentValue < 0
                ) {

                    throw new Error(
                        'Phương trình đa thức không hỗ trợ số mũ âm.'
                    );
                }


                base =
                    this.powerPolynomial(
                        base,
                        exponentValue
                    );
            }


            return base;
        };


        const parsePrimary = () => {

            // ------------------------------
            // NUMBER
            // ------------------------------

            if (
                isNumberStart(
                    peek()
                )
            ) {

                let numberText = '';


                while (
                    index < text.length &&
                    /[0-9.]/.test(
                        text[index]
                    )
                ) {

                    numberText +=
                        text[index++];
                }


                if (
                    (
                        numberText.match(/\./g) ||
                        []
                    ).length > 1
                ) {

                    throw new Error(
                        `Số không hợp lệ: ${numberText}`
                    );
                }


                const value =
                    Number(numberText);


                if (
                    !Number.isFinite(value)
                ) {

                    throw new Error(
                        `Số không hợp lệ: ${numberText}`
                    );
                }


                return [
                    value,
                    0,
                    0
                ];
            }


            // ------------------------------
            // VARIABLE
            // ------------------------------

            if (peek() === 'x') {

                index++;


                return [
                    0,
                    1,
                    0
                ];
            }


            // ------------------------------
            // PARENTHESES
            // ------------------------------

            if (peek() === '(') {

                index++;


                const inside =
                    parseExpression();


                if (peek() !== ')') {

                    throw new Error(
                        'Thiếu dấu ")" trong phương trình.'
                    );
                }


                index++;


                return inside;
            }


            throw new Error(
                `Biểu thức không hợp lệ tại vị trí ${index + 1}.`
            );
        };


        const result =
            parseExpression();


        if (index < text.length) {

            throw new Error(
                `Không thể đọc ký tự "${text[index]}".`
            );
        }


        this.assertPolynomialDegree(result);


        return this.normalizePolynomial(
            result
        );
    },


    // ======================================
    // IMPLICIT MULTIPLICATION
    // ======================================

    isPolynomialImplicitStart(char) {

        if (!char) {
            return false;
        }


        return (
            char === 'x' ||
            char === '(' ||
            /[0-9.]/.test(char)
        );
    },


    // ======================================
    // POLYNOMIAL OPERATIONS
    // ======================================

    createZeroPolynomial() {

        return [0, 0, 0];
    },


    normalizePolynomial(poly) {

        const result = [
            poly[0] || 0,
            poly[1] || 0,
            poly[2] || 0
        ];


        for (
            let i = 0;
            i <= this.MAX_DEGREE;
            i++
        ) {

            result[i] =
                this.cleanNumber(
                    result[i]
                );
        }


        return result;
    },


    trimPolynomial(poly) {

        for (let i = 2; i >= 0; i--) {

            if (
                Math.abs(poly[i] || 0) >
                1e-12
            ) {

                for (
                    let j = i + 1;
                    j < poly.length;
                    j++
                ) {

                    poly[j] = 0;
                }

                return poly;
            }
        }


        poly[0] = 0;
        poly[1] = 0;
        poly[2] = 0;

        return poly;
    },


    polynomialDegree(poly) {

        for (
            let i = this.MAX_DEGREE;
            i >= 0;
            i--
        ) {

            if (
                Math.abs(poly[i] || 0) >
                1e-12
            ) {

                return i;
            }
        }


        return 0;
    },


    assertPolynomialDegree(poly) {

        for (
            let i = this.MAX_DEGREE + 1;
            i < poly.length;
            i++
        ) {

            if (
                Math.abs(poly[i]) >
                1e-12
            ) {

                throw new Error(
                    'Phương trình có bậc lớn hơn 2, hiện chưa được hỗ trợ.'
                );
            }
        }
    },


    addPolynomials(left, right) {

        return this.normalizePolynomial([

            left[0] + right[0],

            left[1] + right[1],

            left[2] + right[2]

        ]);
    },


    subtractPolynomials(left, right) {

        return this.normalizePolynomial([

            left[0] - right[0],

            left[1] - right[1],

            left[2] - right[2]

        ]);
    },


    scalePolynomial(poly, scalar) {

        return this.normalizePolynomial([

            poly[0] * scalar,

            poly[1] * scalar,

            poly[2] * scalar

        ]);
    },


    multiplyPolynomials(left, right) {

        const result =
            this.createZeroPolynomial();


        for (let i = 0; i <= 2; i++) {

            for (let j = 0; j <= 2; j++) {

                if (
                    Math.abs(left[i]) < 1e-12 ||
                    Math.abs(right[j]) < 1e-12
                ) {
                    continue;
                }


                const degree =
                    i + j;


                if (
                    degree >
                    this.MAX_DEGREE
                ) {

                    throw new Error(
                        'Phương trình có bậc lớn hơn 2, hiện chưa được hỗ trợ.'
                    );
                }


                result[degree] +=
                    left[i] *
                    right[j];
            }
        }


        return this.normalizePolynomial(
            result
        );
    },


    dividePolynomial(left, right) {

        const rightDegree =
            this.polynomialDegree(
                right
            );


        if (rightDegree !== 0) {

            throw new Error(
                'Không thể chia cho một biểu thức chứa x.'
            );
        }


        if (
            Math.abs(right[0]) <
            1e-12
        ) {

            throw new Error(
                'Không thể chia cho 0.'
            );
        }


        return this.scalePolynomial(
            left,
            1 / right[0]
        );
    },


    powerPolynomial(poly, exponent) {

        if (exponent === 0) {

            return [1, 0, 0];
        }


        if (exponent === 1) {

            return this.normalizePolynomial(
                poly
            );
        }


        let result = [1, 0, 0];


        for (
            let i = 0;
            i < exponent;
            i++
        ) {

            result =
                this.multiplyPolynomials(
                    result,
                    poly
                );
        }


        return result;
    },


    // ======================================
    // LINEAR SOLVER
    // ======================================

    solveLinearPolynomial(
        poly,
        normalized,
        steps
    ) {

        const b =
            this.cleanNumber(
                poly[1]
            );


        const c =
            this.cleanNumber(
                poly[0]
            );


        steps.push(
            `${this.formatCoeff(b)}x = ${this.formatNumber(-c)}`
        );


        if (
            Math.abs(b) <
            1e-12
        ) {

            throw new Error(
                'Phương trình không xác định.'
            );
        }


        const x =
            this.cleanNumber(
                -c / b
            );


        steps.push(
            `x = ${this.formatNumber(-c)} ÷ ${this.formatCoeff(b)}`
        );


        steps.push(
            `x = ${this.formatNumber(x)}`
        );


        return {
            type: 'unique',
            variable: 'x',
            value: x,
            degree: 1,
            method: 'linear',
            expression: normalized,
            steps,
            result:
                `x = ${this.formatNumber(x)}`
        };
    },


    // ======================================
    // QUADRATIC SOLVER
    // ======================================

    solveQuadraticPolynomial(
        poly,
        normalized,
        steps
    ) {

        let a =
            this.cleanNumber(
                poly[2]
            );


        let b =
            this.cleanNumber(
                poly[1]
            );


        let c =
            this.cleanNumber(
                poly[0]
            );


        // ==================================
        // RÚT GỌN HỆ SỐ
        // ==================================

        const gcd =
            this.integerGCD3(
                a,
                b,
                c
            );


        if (
            Math.abs(gcd) > 1e-12
        ) {

            a =
                this.cleanNumber(
                    a / gcd
                );

            b =
                this.cleanNumber(
                    b / gcd
                );

            c =
                this.cleanNumber(
                    c / gcd
                );


            poly = [
                c,
                b,
                a
            ];


            steps.push(
                `Rút gọn: ${this.formatPolynomial(poly)} = 0`
            );
        }


        // ==================================
        // PHƯƠNG PHÁP NHANH
        // ==================================

        const fast =
            this.tryFastQuadratic(
                a,
                b,
                c
            );


        if (fast) {

            for (const step of fast.steps) {

                steps.push(step);
            }


            return {
                type: fast.type,
                variable: 'x',
                value: fast.value,
                values: fast.values,
                degree: 2,
                method: fast.method,
                expression: normalized,
                steps,
                result: fast.result
            };
        }


        // ==================================
        // CÔNG THỨC NGHIỆM
        // ==================================

        const delta =
            this.cleanNumber(
                b * b -
                4 * a * c
            );


        steps.push(
            `Δ = b² − 4ac = ${this.formatNumber(delta)}`
        );


        // ----------------------------------
        // Δ < 0
        // ----------------------------------

        if (delta < -1e-12) {

            steps.push(
                'Δ < 0 nên phương trình vô nghiệm trong tập số thực.'
            );


            return {
                type: 'none',
                variable: 'x',
                value: null,
                values: [],
                degree: 2,
                method: 'quadratic-formula',
                expression: normalized,
                steps,
                result: 'Vô nghiệm'
            };
        }


        // ----------------------------------
        // Δ = 0
        // ----------------------------------

        if (
            Math.abs(delta) <
            1e-12
        ) {

            const x =
                this.cleanNumber(
                    -b / (2 * a)
                );


            steps.push(
                'Δ = 0 nên phương trình có nghiệm kép.'
            );


            steps.push(
                `x = −b ÷ 2a = ${this.formatNumber(x)}`
            );


            return {
                type: 'unique',
                variable: 'x',
                value: x,
                values: [x],
                degree: 2,
                method: 'quadratic-formula',
                expression: normalized,
                steps,
                result:
                    `x = ${this.formatNumber(x)}`
            };
        }


        // ----------------------------------
        // Δ > 0
        // ----------------------------------

        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            this.cleanNumber(
                (-b + sqrtDelta) /
                (2 * a)
            );


        const x2 =
            this.cleanNumber(
                (-b - sqrtDelta) /
                (2 * a)
            );


        steps.push(
            `√Δ = ${this.formatNumber(sqrtDelta)}`
        );


        steps.push(
            `x₁ = (−b + √Δ) ÷ 2a = ${this.formatNumber(x1)}`
        );


        steps.push(
            `x₂ = (−b − √Δ) ÷ 2a = ${this.formatNumber(x2)}`
        );


        return {
            type: 'two',
            variable: 'x',
            value: null,
            values: [x1, x2],
            degree: 2,
            method: 'quadratic-formula',
            expression: normalized,
            steps,
            result:
                `x₁ = ${this.formatNumber(x1)}, x₂ = ${this.formatNumber(x2)}`
        };
    },


    // ======================================
    // FAST QUADRATIC SOLVER
    //
    // Ưu tiên:
    // 1. (x + p)²
    // 2. (x - p)²
    // 3. a² - b²
    // 4. Phân tích nhân tử đơn giản
    // ======================================

    tryFastQuadratic(a, b, c) {

        // ==================================
        // HĐT 1:
        //
        // (x + p)²
        // = x² + 2px + p²
        // ==================================

        if (
            Math.abs(a - 1) <
            1e-12 &&
            Math.abs(c) >= 0
        ) {

            const p =
                this.cleanNumber(
                    b / 2
                );


            if (
                Math.abs(
                    c - p * p
                ) < 1e-12
            ) {

                const x =
                    this.cleanNumber(
                        -p
                    );


                return {

                    type: 'unique',

                    value: x,

                    values: [x],

                    method:
                        'identity-square-plus',

                    steps: [

                        `Nhận dạng HĐT: (x + ${this.formatSigned(p)})² = 0`,

                        `x + ${this.formatNumber(p)} = 0`,

                        `x = ${this.formatNumber(x)}`
                    ],

                    result:
                        `x = ${this.formatNumber(x)}`
                };
            }
        }


        // ==================================
        // HĐT 2:
        //
        // (x - p)²
        // = x² - 2px + p²
        // ==================================

        if (
            Math.abs(a - 1) <
            1e-12
        ) {

            const p =
                this.cleanNumber(
                    -b / 2
                );


            if (
                Math.abs(
                    c - p * p
                ) < 1e-12
            ) {

                const x =
                    this.cleanNumber(
                        p
                    );


                return {

                    type: 'unique',

                    value: x,

                    values: [x],

                    method:
                        'identity-square-minus',

                    steps: [

                        `Nhận dạng HĐT: (x − ${this.formatNumber(p)})² = 0`,

                        `x − ${this.formatNumber(p)} = 0`,

                        `x = ${this.formatNumber(x)}`
                    ],

                    result:
                        `x = ${this.formatNumber(x)}`
                };
            }
        }


        // ==================================
        // HĐT 3:
        //
        // a² - b²
        // = (a-b)(a+b)
        //
        // Trường hợp:
        // x² - p² = 0
        // ==================================

        if (
            Math.abs(a - 1) <
            1e-12 &&
            Math.abs(b) <
            1e-12 &&
            c < 0
        ) {

            const p =
                this.cleanNumber(
                    Math.sqrt(-c)
                );


            if (
                Math.abs(
                    p * p + c
                ) < 1e-12
            ) {

                const x1 =
                    this.cleanNumber(-p);


                const x2 =
                    this.cleanNumber(p);


                return {

                    type: 'two',

                    value: null,

                    values: [x1, x2],

                    method:
                        'identity-difference-squares',

                    steps: [

                        `Nhận dạng HĐT: x² − ${this.formatNumber(p)}² = 0`,

                        `(x − ${this.formatNumber(p)})(x + ${this.formatNumber(p)}) = 0`,

                        `x − ${this.formatNumber(p)} = 0 hoặc x + ${this.formatNumber(p)} = 0`,

                        `x₁ = ${this.formatNumber(x1)}, x₂ = ${this.formatNumber(x2)}`
                    ],

                    result:
                        `x₁ = ${this.formatNumber(x1)}, x₂ = ${this.formatNumber(x2)}`
                };
            }
        }


        // ==================================
        // PHÂN TÍCH NHÂN TỬ
        //
        // x² + bx + c
        // = (x + m)(x + n)
        //
        // m+n=b
        // mn=c
        // ==================================

        if (
            Math.abs(a - 1) <
            1e-12
        ) {

            const factor =
                this.findIntegerFactors(
                    b,
                    c
                );


            if (factor) {

                const m =
                    factor.m;


                const n =
                    factor.n;


                const x1 =
                    this.cleanNumber(-m);


                const x2 =
                    this.cleanNumber(-n);


                return {

                    type:
                        Math.abs(
                            x1 - x2
                        ) < 1e-12
                            ? 'unique'
                            : 'two',

                    value:
                        Math.abs(
                            x1 - x2
                        ) < 1e-12
                            ? x1
                            : null,

                    values:
                        Math.abs(
                            x1 - x2
                        ) < 1e-12
                            ? [x1]
                            : [x1, x2],

                    method:
                        'factorization',

                    steps: [

                        `Phân tích nhân tử: (x ${this.formatSigned(m)})(x ${this.formatSigned(n)}) = 0`,

                        `x ${this.formatSigned(m)} = 0 hoặc x ${this.formatSigned(n)} = 0`,

                        Math.abs(x1 - x2) < 1e-12

                            ? `x = ${this.formatNumber(x1)}`

                            : `x₁ = ${this.formatNumber(x1)}, x₂ = ${this.formatNumber(x2)}`
                    ],

                    result:
                        Math.abs(x1 - x2) < 1e-12

                            ? `x = ${this.formatNumber(x1)}`

                            : `x₁ = ${this.formatNumber(x1)}, x₂ = ${this.formatNumber(x2)}`
                };
            }
        }


        return null;
    },


    // ======================================
    // INTEGER FACTORS
    // ======================================

    findIntegerFactors(b, c) {

        if (
            !Number.isInteger(b) ||
            !Number.isInteger(c)
        ) {
            return null;
        }


        if (c === 0) {

            return {
                m: 0,
                n: b
            };
        }


        const absC =
            Math.abs(c);


        for (
            let i = 1;
            i <= Math.sqrt(absC);
            i++
        ) {

            if (
                absC % i !== 0
            ) {
                continue;
            }


            const candidates = [
                [i, c / i],
                [-i, -c / i],
                [c / i, i],
                [-c / i, -i]
            ];


            for (
                const [m, n]
                of candidates
            ) {

                if (
                    Math.abs(
                        m + n - b
                    ) < 1e-12
                ) {

                    return {
                        m,
                        n
                    };
                }
            }
        }


        return null;
    },


    // ======================================
    // INTEGER GCD
    // ======================================

    integerGCD(a, b) {

        a =
            Math.abs(
                Math.round(a)
            );


        b =
            Math.abs(
                Math.round(b)
            );


        while (b !== 0) {

            const temp =
                a % b;


            a = b;
            b = temp;
        }


        return a;
    },


    integerGCD3(a, b, c) {

        if (
            !Number.isInteger(a) ||
            !Number.isInteger(b) ||
            !Number.isInteger(c)
        ) {

            return 1;
        }


        return this.integerGCD(
            this.integerGCD(a, b),
            c
        ) || 1;
    },


    // ======================================
    // FORMAT POLYNOMIAL
    // ======================================

    formatPolynomial(poly) {

        const parts = [];


        const c =
            this.cleanNumber(
                poly[0] || 0
            );


        const b =
            this.cleanNumber(
                poly[1] || 0
            );


        const a =
            this.cleanNumber(
                poly[2] || 0
            );


        // x²
        if (
            Math.abs(a) >
            1e-12
        ) {

            if (
                Math.abs(a - 1) <
                1e-12
            ) {

                parts.push('x²');

            } else if (
                Math.abs(a + 1) <
                1e-12
            ) {

                parts.push('−x²');

            } else {

                parts.push(
                    `${this.formatNumber(a)}x²`
                );
            }
        }


        // x
        if (
            Math.abs(b) >
            1e-12
        ) {

            if (parts.length) {

                if (b > 0) {

                    parts.push(
                        `+ ${this.formatNumber(b)}x`
                    );

                } else {

                    parts.push(
                        `− ${this.formatNumber(
                            Math.abs(b)
                        )}x`
                    );
                }

            } else {

                if (
                    Math.abs(b + 1) <
                    1e-12
                ) {

                    parts.push('−x');

                } else if (
                    Math.abs(b - 1) <
                    1e-12
                ) {

                    parts.push('x');

                } else {

                    parts.push(
                        `${this.formatNumber(b)}x`
                    );
                }
            }
        }


        // constant
        if (
            Math.abs(c) >
            1e-12
        ) {

            if (parts.length) {

                if (c > 0) {

                    parts.push(
                        `+ ${this.formatNumber(c)}`
                    );

                } else {

                    parts.push(
                        `− ${this.formatNumber(
                            Math.abs(c)
                        )}`
                    );
                }

            } else {

                parts.push(
                    this.formatNumber(c)
                );
            }
        }


        if (!parts.length) {
            return '0';
        }


        return parts.join(' ');
    },


    // ======================================
    // FORMAT SIGNED
    // ======================================

    formatSigned(value) {

        const number =
            this.formatNumber(
                Math.abs(value)
            );


        return value >= 0
            ? `+ ${number}`
            : `− ${number}`;
    },


    // ======================================
    // FORMAT COEFFICIENT
    // ======================================

    formatCoeff(value) {

        if (
            Math.abs(value - 1) <
            1e-12
        ) {
            return '1';
        }


        if (
            Math.abs(value + 1) <
            1e-12
        ) {
            return '-1';
        }


        return this.formatNumber(value);
    },


    // ======================================
    // FORMAT NUMBER
    // ======================================

    formatNumber(value) {

        if (
            !Number.isFinite(value)
        ) {

            return String(value);
        }


        if (
            Math.abs(value) <
            1e-12
        ) {

            return '0';
        }


        if (
            Math.abs(
                value -
                Math.round(value)
            ) < 1e-12
        ) {

            return String(
                Math.round(value)
            );
        }


        return Number(
            value.toFixed(12)
        ).toString();
    },


    // ======================================
    // CLEAN FLOAT
    // ======================================

    cleanNumber(value) {

        if (
            Math.abs(value) <
            1e-12
        ) {

            return 0;
        }


        if (
            Number.isInteger(value)
        ) {

            return value;
        }


        return Number(
            value.toFixed(12)
        );
    },


    // ======================================
    // GENERATE CALCULATOR STEPS
    // ======================================

    generateSteps(tokens) {

        const working =
            tokens.map(token => {

                if (
                    token.type === 'number'
                ) {
                    return String(token.value);
                }

                return token.value;
            });


        const steps = [];


        while (
            working.includes('(')
        ) {

            let openIndex = -1;


            for (
                let i = working.length - 1;
                i >= 0;
                i--
            ) {

                if (
                    working[i] === '('
                ) {

                    openIndex = i;

                    break;
                }
            }


            if (openIndex === -1) {
                break;
            }


            let closeIndex = -1;


            for (
                let i = openIndex + 1;
                i < working.length;
                i++
            ) {

                if (
                    working[i] === ')'
                ) {

                    closeIndex = i;

                    break;
                }
            }


            if (closeIndex === -1) {

                throw new Error(
                    'Thiếu dấu ")"'
                );
            }


            const inside =
                working.slice(
                    openIndex + 1,
                    closeIndex
                );


            if (!inside.length) {

                throw new Error(
                    'Ngoặc rỗng.'
                );
            }


            const insideTokens =
                inside
                    .map(value => {

                        if (
                            /^[0-9.]+$/.test(
                                value
                            )
                        ) {

                            return {
                                type: 'number',
                                value:
                                    Number(value)
                            };
                        }


                        if (
                            [
                                '+',
                                '-',
                                '*',
                                '/',
                                '^',
                                '%'
                            ].includes(value)
                        ) {

                            return {
                                type: 'operator',
                                value
                            };
                        }


                        return null;
                    })
                    .filter(Boolean);


            const insideResult =
                this.evaluateRPN(
                    this.toRPN(
                        insideTokens
                    )
                );


            const readable =
                this.formatTokens(
                    inside
                );


            steps.push(
                `${readable} = ${this.formatNumber(insideResult)}`
            );


            working.splice(
                openIndex,
                closeIndex -
                    openIndex +
                    1,
                String(insideResult)
            );
        }


        this.generateFlatSteps(
            working,
            steps
        );


        return steps;
    },


    // ======================================
    // FLAT STEPS
    // ======================================

    generateFlatSteps(
        working,
        steps
    ) {

        while (true) {

            let found = false;


            for (
                let i = 0;
                i < working.length;
                i++
            ) {

                if (
                    working[i] === '%'
                ) {

                    if (i === 0) {

                        throw new Error(
                            'Phần trăm không hợp lệ.'
                        );
                    }


                    const value =
                        Number(
                            working[i - 1]
                        );


                    if (
                        Number.isNaN(value)
                    ) {

                        throw new Error(
                            'Phần trăm không hợp lệ.'
                        );
                    }


                    const result =
                        value / 100;


                    steps.push(
                        `${this.formatNumber(value)}% = ${this.formatNumber(result)}`
                    );


                    working.splice(
                        i - 1,
                        2,
                        String(result)
                    );


                    found = true;

                    break;
                }
            }


            if (!found) break;
        }


        while (true) {

            let powerIndex = -1;


            for (
                let i = working.length - 1;
                i >= 0;
                i--
            ) {

                if (
                    working[i] === '^'
                ) {

                    powerIndex = i;

                    break;
                }
            }


            if (powerIndex === -1) {
                break;
            }


            this.applyBinaryStep(
                working,
                powerIndex,
                '^',
                steps
            );
        }


        while (true) {

            let found = false;


            for (
                let i = 0;
                i < working.length;
                i++
            ) {

                if (
                    working[i] === '*' ||
                    working[i] === '/'
                ) {

                    this.applyBinaryStep(
                        working,
                        i,
                        working[i],
                        steps
                    );


                    found = true;

                    break;
                }
            }


            if (!found) break;
        }


        while (true) {

            let found = false;


            for (
                let i = 0;
                i < working.length;
                i++
            ) {

                if (
                    working[i] === '+' ||
                    working[i] === '-'
                ) {

                    this.applyBinaryStep(
                        working,
                        i,
                        working[i],
                        steps
                    );


                    found = true;

                    break;
                }
            }


            if (!found) break;
        }
    },


    // ======================================
    // APPLY BINARY STEP
    // ======================================

    applyBinaryStep(
        working,
        index,
        operator,
        steps
    ) {

        if (
            index === 0 ||
            index >= working.length - 1
        ) {

            throw new Error(
                'Biểu thức không hợp lệ.'
            );
        }


        const left =
            Number(
                working[index - 1]
            );


        const right =
            Number(
                working[index + 1]
            );


        if (
            Number.isNaN(left) ||
            Number.isNaN(right)
        ) {

            throw new Error(
                'Biểu thức không hợp lệ.'
            );
        }


        let result;


        switch (operator) {

            case '+':
                result = left + right;
                break;

            case '-':
                result = left - right;
                break;

            case '*':
                result = left * right;
                break;

            case '/':
                if (right === 0) {
                    throw new Error(
                        'Không thể chia cho 0.'
                    );
                }

                result = left / right;
                break;

            case '^':
                result =
                    Math.pow(
                        left,
                        right
                    );
                break;

            default:
                throw new Error(
                    'Toán tử không hợp lệ.'
                );
        }


        if (
            !Number.isFinite(result)
        ) {

            throw new Error(
                'Kết quả vượt quá giới hạn số.'
            );
        }


        const readableOperator =
            operator === '*'
                ? '×'
                : operator === '/'
                    ? '÷'
                    : operator;


        steps.push(
            `${this.formatNumber(left)} ${readableOperator} ${this.formatNumber(right)} = ${this.formatNumber(result)}`
        );


        working.splice(
            index - 1,
            3,
            String(result)
        );
    },


    // ======================================
    // FORMAT TOKENS
    // ======================================

    formatTokens(tokens) {

        return tokens
            .map(value => {

                if (value === '*') {
                    return '×';
                }

                if (value === '/') {
                    return '÷';
                }

                return value;
            })
            .join(' ');
    }
};


export { MathEngine };

export default MathEngine;