"use strict";

function resolveMessageTemplate(template, memberName, memberValue) {
    return template
        .replace("{memberName}", memberName)
        .replace("{memberValue}", memberValue);
}

function resolveMemberValue(object, memberName) {
    return memberName
        .split(".")
        .reduce((prev, value) => value = prev[value], object);
}

const Test = function(test) {
    const preconditions = [];
    const testFunction = test;
    let customMessageTemplate = null;
    
    return {
        addPrecondition(predicate) {
            preconditions.push(predicate);
        },
        resolve(ruleContext) {
            if (!preconditions.every(w => w(ruleContext.object))) {
                return [];
            }
    
            const validationContext = new ValidationContext();
            testFunction(validationContext, ruleContext.memberValue);
    
            if (validationContext.failures.length > 0 && customMessageTemplate !== null) {
                return [resolveMessageTemplate(customMessageTemplate, ruleContext.memberName, ruleContext.memberValue)];
            } else {
                return validationContext.failures.map(
                    msg => resolveMessageTemplate(msg, ruleContext.memberName, ruleContext.memberValue));
            }
        },
        set customMessageTemplate(template) {
            customMessageTemplate = template;
        }
    };
};

class Rule {
    constructor(memberName) {
        this.memberName = memberName;
        this.tests = [];
    }

    validate(object) {
        const result = [];
        const ruleContext = {
            memberName: this.memberName,
            memberValue: resolveMemberValue(object, this.memberName),
            object: object
        };

        for (const test of this.tests) {
            const failures = test.resolve(ruleContext);
            if (failures.length > 0) {
                result.push(...failures);
            }
        }

        return result;
    }

    null() {
        this.custom((context, value) => {
            if (value !== null) {
                context.addFailure("'{memberName}' must be null, but found '{memberValue}'.");
            }
        });
        return this;
    }

    notNull() {
        this.custom((context, value) => {
            if (value === null) {
                context.addFailure("'{memberName}' must be not null, but found '{memberValue}'.");
            }
        });
        return this;
    }

    must(predicate) {
        this.custom((context, value) => {
            if (!predicate(value)) {
                context.addFailure("Validation failed.");
            }
        });
        return this;
    }

    falsy() {
        this.custom((context, value) => {
            if (value) {
                context.addFailure("'{memberName}' must be falsy, but found '{memberValue}'.");
            }
        });
        return this;
    }

    truly() {
        this.custom((context, value) => {
            if (!value) {
                context.addFailure("'{memberName}' must be truly, but found '{memberValue}'.");
            }
        });
        return this;
    }

    empty() {
        this.custom((context, value) => {
            if (value && (typeof value !== "string" || !value.split("").every(c => c === " "))) {
                context.addFailure("'{memberName}' must be empty, but found '{memberValue}'.");
            }
        });
        return this;
    }

    equal(other) {
        this.custom((context, value) => {
            if (value != other) {
                const stringifiedOther = JSON.stringify(JSON.parse(other));
                context.addFailure(`'{memberName}' must be loosely equal to '${stringifiedOther}', but found '{memberValue}'.`);
            }
        });
        return this;
    }

    notEqual(other) {
        this.custom((context, value) => {
            if (value == other) {
                const stringifiedOther = JSON.stringify(JSON.parse(other));
                context.addFailure(`'{memberName}' must not be loosely equal to '${stringifiedOther}', but found '{memberValue}'.`);
            }
        });
        return this;
    }

    custom(testFunction) {
        this.tests.push(new Test(testFunction));
        return this;
    }

    withMessage(customMessageTemplate) {
        this.tests[this.tests.length - 1].customMessageTemplate = customMessageTemplate;
        return this;
    }

    when(predicate) {
        this.tests[this.tests.length - 1].addPrecondition(predicate);
        return this;
    }
}

const ValidationContext = function() {
    const failures = [];

    return {
        addFailure(message) {
            failures.push(message);
        },
        get failures() {
            return failures;
        }
    };
};

const Validator = function() {
    const rules = [];

    return {
        rule(memberName) {
            const rule = new Rule(memberName);
            rules.push(rule);
            return rule;
        },
        validate(object, options = {}) {
            const globalResult = {
                isSuccess: true,
                failures: {}
            };
    
            for (const rule of rules) {
                const ruleResult = rule.validate(object);
                if (ruleResult.length > 0) {
                    globalResult.failures[rule.memberName] = ruleResult;
                    globalResult.isSuccess = false;
                }
            }
    
            if (options.throwOnFailure && !globalResult.isSuccess) {
                const error = new Error("Validation failed.");
                error.validationResult = globalResult;
                throw error;
            }
    
            return globalResult;
        }
    };
};

export default Validator;