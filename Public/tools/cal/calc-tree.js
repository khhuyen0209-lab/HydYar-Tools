// ==========================================
// HYDYAR TOOLS — CALCULATOR TREE MODULE
// V3.7
// 
// Chứa toàn bộ logic Expression Tree & Equation Tree
// Được tách ra từ file calculator chính để dễ bảo trì
// 
// BASE:
// - ExpressionNode
// - NumberNode
// - VariableNode
// - OperatorNode
// - GroupNode
// - PowerNode
// - RootNode
// - EquationNode
// - CursorState
// ==========================================


// ==========================================
// EXPRESSION NODE
// ==========================================

class ExpressionNode {

    constructor(parent = null) {

        this.parent = parent;
        this.type = 'base';
    }


    serialize() {

        return '';
    }


    clone(parent = null) {

        return new ExpressionNode(parent);
    }
}


// ==========================================
// NUMBER NODE
// ==========================================

class NumberNode extends ExpressionNode {

    constructor(value, parent = null) {

        super(parent);

        this.type = 'number';
        this.value = value;
    }


    serialize() {

        return String(this.value);
    }


    clone(parent = null) {

        return new NumberNode(
            this.value,
            parent
        );
    }
}


// ==========================================
// VARIABLE NODE
// ==========================================

class VariableNode extends ExpressionNode {

    constructor(value = 'x', parent = null) {

        super(parent);

        this.type = 'variable';
        this.value = value;
    }


    serialize() {

        return String(this.value);
    }


    clone(parent = null) {

        return new VariableNode(
            this.value,
            parent
        );
    }
}


// ==========================================
// OPERATOR NODE
// ==========================================

class OperatorNode extends ExpressionNode {

    constructor(value, parent = null) {

        super(parent);

        this.type = 'operator';
        this.value = value;
    }


    serialize() {

        return this.value;
    }


    clone(parent = null) {

        return new OperatorNode(
            this.value,
            parent
        );
    }
}


// ==========================================
// GROUP NODE
// ==========================================

class GroupNode extends ExpressionNode {

    constructor(
        children = [],
        parent = null,
        closed = false
    ) {

        super(parent);

        this.type = 'group';

        this.children = [];

        this.closed = closed;

        children.forEach(child => {

            if (!child) {
                return;
            }

            child.parent = this;

            this.children.push(child);
        });
    }


    serialize() {

        return (
            '(' +
            this.children
                .map(child =>
                    child.serialize()
                )
                .join('') +
            ')'
        );
    }


    clone(parent = null) {

        return new GroupNode(

            this.children.map(
                child =>
                    child.clone()
            ),

            parent,

            this.closed
        );
    }
}


// ==========================================
// POWER NODE
// ==========================================

class PowerNode extends ExpressionNode {

    constructor(
        base = null,
        exponentChildren = [],
        parent = null
    ) {

        super(parent);

        this.type = 'power';

        this.base = base;

        if (this.base) {

            this.base.parent = this;
        }

        this.exponentChildren = [];

        exponentChildren.forEach(child => {

            if (!child) {
                return;
            }

            child.parent = this;

            this.exponentChildren.push(child);
        });
    }


    serialize() {

        const baseStr =
            this.base
                ? this.base.serialize()
                : '';


        const expStr =
            this.exponentChildren
                .map(child =>
                    child.serialize()
                )
                .join('');


        return `${baseStr}^(${expStr})`;
    }


    clone(parent = null) {

        return new PowerNode(

            this.base
                ? this.base.clone()
                : null,

            this.exponentChildren.map(
                child =>
                    child.clone()
            ),

            parent
        );
    }
}


// ==========================================
// ROOT NODE
// ==========================================

class RootNode extends ExpressionNode {

    constructor(
        children = [],
        parent = null
    ) {

        super(parent);

        this.type = 'root';

        this.children = [];

        children.forEach(child => {

            if (!child) {
                return;
            }

            child.parent = this;

            this.children.push(child);
        });
    }


    serialize() {

        return this.children
            .map(child =>
                child.serialize()
            )
            .join('');
    }


    clone(parent = null) {

        return new RootNode(

            this.children.map(
                child =>
                    child.clone()
            ),

            parent
        );
    }
}


// ==========================================
// EQUATION NODE
// ==========================================

class EquationNode extends ExpressionNode {

    constructor(
        left = null,
        relation = '=',
        right = null,
        parent = null
    ) {

        super(parent);

        this.type = 'equation';

        this.left =
            left ||
            new RootNode();


        this.relation =
            relation;


        this.right =
            right ||
            new RootNode();


        this.left.parent =
            this;


        this.right.parent =
            this;
    }


    serialize() {

        return (
            this.left.serialize() +
            this.relation +
            this.right.serialize()
        );
    }


    clone(parent = null) {

        return new EquationNode(

            this.left.clone(),

            this.relation,

            this.right.clone(),

            parent
        );
    }
}


// ==========================================
// CURSOR STATE
// ==========================================

class CursorState {

    constructor(
        container,
        position = 0,
        owner = null
    ) {

        this.container =
            Array.isArray(container)
                ? container
                : [];


        this.pos =
            Math.max(
                0,
                Math.min(
                    position,
                    this.container.length
                )
            );


        this.owner =
            owner;
    }


    isInExponent() {

        let node = this.owner;

        while (node) {

            if (node.type === 'power') {

                return true;
            }

            node = node.parent;
        }

        return false;
    }


    getCurrentExponentContainer() {

        let node = this.owner;

        while (node) {

            if (node.type === 'power') {

                return node;
            }

            node = node.parent;
        }

        return null;
    }


    _getParentArray(node) {

        if (
            !node ||
            !node.parent
        ) {

            return null;
        }


        const parent =
            node.parent;


        if (
            Array.isArray(parent.children) &&
            parent.children.includes(node)
        ) {

            return parent.children;
        }


        if (
            Array.isArray(parent.exponentChildren) &&
            parent.exponentChildren.includes(node)
        ) {

            return parent.exponentChildren;
        }


        return null;
    }


    _enterExponent(
        power,
        position = 0
    ) {

        if (
            !power ||
            power.type !== 'power'
        ) {

            return false;
        }


        this.container =
            power.exponentChildren;


        this.owner =
            power;


        this.pos =
            Math.max(
                0,
                Math.min(
                    position,
                    power.exponentChildren.length
                )
            );


        return true;
    }


    _exitExponent(
        power,
        afterPower
    ) {

        if (!power) {

            return false;
        }


        const parentArray =
            this._getParentArray(power);


        if (!parentArray) {

            return false;
        }


        const index =
            parentArray.indexOf(power);


        if (index === -1) {

            return false;
        }


        this.container =
            parentArray;


        this.owner =
            power.parent;


        this.pos =
            afterPower
                ? index + 1
                : index;


        return true;
    }


    _enterGroup(
        group,
        position = 0
    ) {

        if (
            !group ||
            group.type !== 'group'
        ) {

            return false;
        }


        this.container =
            group.children;


        this.owner =
            group;


        this.pos =
            Math.max(
                0,
                Math.min(
                    position,
                    group.children.length
                )
            );


        return true;
    }


    _exitGroup(
        group,
        afterGroup
    ) {

        if (
            !group ||
            group.type !== 'group'
        ) {

            return false;
        }


        const parentArray =
            this._getParentArray(group);


        if (!parentArray) {

            return false;
        }


        const index =
            parentArray.indexOf(group);


        if (index === -1) {

            return false;
        }


        this.container =
            parentArray;


        this.owner =
            group.parent;


        this.pos =
            afterGroup
                ? index + 1
                : index;


        return true;
    }


    moveLeft() {

        if (
            !Array.isArray(
                this.container
            )
        ) {

            return;
        }


        // ----------------------------------
        // TRONG POWER
        // ----------------------------------

        if (
            this.owner &&
            this.owner.type === 'power' &&
            this.container ===
                this.owner.exponentChildren
        ) {

            if (this.pos > 0) {

                const previous =
                    this.container[
                        this.pos - 1
                    ];


                if (
                    previous &&
                    previous.type === 'group'
                ) {

                    this._enterGroup(
                        previous,
                        previous.children.length
                    );

                    return;
                }


                this.pos--;

                return;
            }


            this._exitExponent(
                this.owner,
                false
            );

            return;
        }


        // ----------------------------------
        // TRONG GROUP
        // ----------------------------------

        if (
            this.owner &&
            this.owner.type === 'group' &&
            this.container ===
                this.owner.children
        ) {

            if (this.pos > 0) {

                const previous =
                    this.container[
                        this.pos - 1
                    ];


                if (
                    previous &&
                    previous.type === 'power'
                ) {

                    this._enterExponent(
                        previous,
                        previous.exponentChildren.length
                    );

                    return;
                }


                if (
                    previous &&
                    previous.type === 'group'
                ) {

                    this._enterGroup(
                        previous,
                        previous.children.length
                    );

                    return;
                }


                this.pos--;

                return;
            }


            this._exitGroup(
                this.owner,
                false
            );

            return;
        }


        // ----------------------------------
        // NGOÀI
        // ----------------------------------

        if (this.pos > 0) {

            const previous =
                this.container[
                    this.pos - 1
                ];


            if (
                previous &&
                previous.type === 'power'
            ) {

                this._enterExponent(
                    previous,
                    previous.exponentChildren.length
                );

                return;
            }


            if (
                previous &&
                previous.type === 'group'
            ) {

                this._enterGroup(
                    previous,
                    previous.children.length
                );

                return;
            }


            this.pos--;

            return;
        }


        this._moveUpParent(-1);
    }


    moveRight() {

        if (
            !Array.isArray(
                this.container
            )
        ) {

            return;
        }


        // ----------------------------------
        // TRONG POWER
        // ----------------------------------

        if (
            this.owner &&
            this.owner.type === 'power' &&
            this.container ===
                this.owner.exponentChildren
        ) {

            if (
                this.pos <
                this.container.length
            ) {

                const next =
                    this.container[
                        this.pos
                    ];


                if (
                    next &&
                    next.type === 'group'
                ) {

                    this._enterGroup(
                        next,
                        0
                    );

                    return;
                }


                this.pos++;

                return;
            }


            this._exitExponent(
                this.owner,
                true
            );

            return;
        }


        // ----------------------------------
        // TRONG GROUP
        // ----------------------------------

        if (
            this.owner &&
            this.owner.type === 'group' &&
            this.container ===
                this.owner.children
        ) {

            if (
                this.pos <
                this.container.length
            ) {

                const next =
                    this.container[
                        this.pos
                    ];


                if (
                    next &&
                    next.type === 'power'
                ) {

                    this._enterExponent(
                        next,
                        0
                    );

                    return;
                }


                if (
                    next &&
                    next.type === 'group'
                ) {

                    this._enterGroup(
                        next,
                        0
                    );

                    return;
                }


                this.pos++;

                return;
            }


            this._exitGroup(
                this.owner,
                true
            );

            return;
        }


        // ----------------------------------
        // NGOÀI
        // ----------------------------------

        if (
            this.pos <
            this.container.length
        ) {

            const next =
                this.container[
                    this.pos
                ];


            if (
                next &&
                next.type === 'power'
            ) {

                this._enterExponent(
                    next,
                    0
                );

                return;
            }


            if (
                next &&
                next.type === 'group'
            ) {

                this._enterGroup(
                    next,
                    0
                );

                return;
            }


            this.pos++;

            return;
        }


        this._moveUpParent(+1);
    }


    _moveUpParent(delta) {

        const owner =
            this.owner;


        if (
            !owner ||
            !owner.parent
        ) {

            return;
        }


        const parent =
            owner.parent;


        let parentArray =
            null;


        if (
            Array.isArray(parent.children) &&
            parent.children.includes(owner)
        ) {

            parentArray =
                parent.children;
        }


        else if (
            Array.isArray(
                parent.exponentChildren
            ) &&
            parent.exponentChildren.includes(owner)
        ) {

            parentArray =
                parent.exponentChildren;
        }


        if (!parentArray) {

            return;
        }


        const index =
            parentArray.indexOf(owner);


        if (index === -1) {

            return;
        }


        this.container =
            parentArray;


        this.owner =
            parent;


        this.pos =
            index + delta;


        this.pos =
            Math.max(
                0,
                Math.min(
                    this.pos,
                    parentArray.length
                )
            );
    }


    static at(
        node,
        position = 0
    ) {

        if (!node) {

            return new CursorState(
                [],
                0,
                null
            );
        }


        if (
            Array.isArray(
                node.children
            )
        ) {

            return new CursorState(
                node.children,
                position,
                node
            );
        }


        if (
            Array.isArray(
                node.exponentChildren
            )
        ) {

            return new CursorState(
                node.exponentChildren,
                position,
                node
            );
        }


        return new CursorState(
            [],
            0,
            node
        );
    }
}


// ==========================================
// EXPORT
// ==========================================

export {
    ExpressionNode,
    NumberNode,
    VariableNode,
    OperatorNode,
    GroupNode,
    PowerNode,
    RootNode,
    EquationNode,
    CursorState
};

export default {
    ExpressionNode,
    NumberNode,
    VariableNode,
    OperatorNode,
    GroupNode,
    PowerNode,
    RootNode,
    EquationNode,
    CursorState
};
