const Test = function({ isValid, defaultMessageTemplate }) {
    const preconditions = [];

    return {
        addPrecondition(predicate) {
            preconditions.push(predicate);
        },
        defineMessageTemplate: function(template) {
            this.messageTemplate = template;
        },
        isValid,
        messageTemplate: defaultMessageTemplate || "No error message defined."
    };
};

const Null = function() {
    return Test({
        isValid: function(value) {
            return value === null;
        },
        defaultMessageTemplate: "'{memberName}' must be null."
    });
};

const NotNull = function() {
    return Test({
        isValid: function(value, context) {
            return value !== null;
        },
        defaultMessageTemplate: "'{memberName}' must not be null."
    });
};

const Must = function(predicate) {
    return Test({
        isValid: function(value, context) {
            return predicate(value);
        }
    });
};

const Falsy = function() {
    return Test({
        isValid: function(value, context) {
            return !value;
        },
        defaultMessageTemplate: "'{memberName}' must be falsy."
    });
};

const Truly = function() {
    return Test({
        isValid: function(value, context) {
            return !!value;
        },
        defaultMessageTemplate: "'{memberName}' must be truly."
    });
};

const Empty = function() {
    return Test({
        isValid: function(value, context) {
            return !value ||
                (typeof value === "string" && isWhitespaces(value)) ||
                (Array.isArray(value) && value.length === 0);
        },
        defaultMessageTemplate: "'{memberName}' must be empty."
    });
};

const NotEmpty = function() {
    return Test({
        isValid: function(value, context) {
            return !!value &&
                (typeof value !== "string" || !isWhitespaces(value)) &&
                (!Array.isArray(value) || value.length > 0);
        },
        defaultMessageTemplate: "'{memberName}' must not be empty."
    });
};

const Equal = function(other) {
    return Test({
        isValid: function(value, context) {
            return value == other;
        },
        defaultMessageTemplate: `'{memberName}' must be loosely equal to '${other}'.`
    });
};

const NotEqual = function(other) {
    return Test({
        isValid: function(value, context) {
            return value != other;
        },
        defaultMessageTemplate: `'{memberName}' must not be loosely equal to '${other}'.`
    });
};

const Custom = function(customTestFunction) {
    return Test({
        isValid: function(value, context) {
            customTestFunction(value, context);
            return true;
        }
    });
};

function isWhitespaces(str) {
    return str.split("").every(c => c === " ");
}

export {
    Null,
    NotNull,
    Must,
    Truly,
    Falsy,
    Empty,
    NotEmpty,
    Equal,
    NotEqual,
    Custom
};