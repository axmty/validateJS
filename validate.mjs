"use strict";

const Test = function(testFunction) {
    function resolveMessageTemplate(template, memberName, memberValue) {
        return template
            .replace("{memberName}", memberName)
            .replace("{memberValue}", memberValue);
    }
    
    const preconditions = [];
    let customMessageTemplate = null;
    
    return {
        addPrecondition(predicate) {
            preconditions.push(predicate);
        },
        resolve(ruleContext) {
            if (!preconditions.every(w => w(ruleContext.object))) {
                return [];
            }

            const validationContext = ValidationContext();
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

const Rule = function(memberName) {
    function resolveMemberValue(object, memberName) {
        return memberName
            .split(".")
            .reduce((prev, value) => value = prev[value], object);
    }

    const tests = [];

    return {
        get memberName() {
            return memberName;
        },
        validate(object) {
            const result = [];
            const ruleContext = {
                memberName: memberName,
                memberValue: resolveMemberValue(object, memberName),
                object: object
            };
    
            for (const test of tests) {
                const failures = test.resolve(ruleContext);
                if (failures.length > 0) {
                    result.push(...failures);
                }
            }
    
            return result;
        },
        null() {
            this.custom((context, value) => {
                if (value !== null) {
                    context.addFailure("'{memberName}' must be null, but found '{memberValue}'.");
                }
            });
            return this;
        },
        notNull() {
            this.custom((context, value) => {
                if (value === null) {
                    context.addFailure("'{memberName}' must be not null, but found '{memberValue}'.");
                }
            });
            return this;
        },
        must(predicate) {
            this.custom((context, value) => {
                if (!predicate(value)) {
                    context.addFailure("Validation failed.");
                }
            });
            return this;
        },
        falsy() {
            this.custom((context, value) => {
                if (value) {
                    context.addFailure("'{memberName}' must be falsy, but found '{memberValue}'.");
                }
            });
            return this;
        },
        truly() {
            this.custom((context, value) => {
                if (!value) {
                    context.addFailure("'{memberName}' must be truly, but found '{memberValue}'.");
                }
            });
            return this;
        },
        empty() {
            this.custom((context, value) => {
                if (value && (typeof value !== "string" || !value.split("").every(c => c === " "))) {
                    context.addFailure("'{memberName}' must be empty, but found '{memberValue}'.");
                }
            });
            return this;
        },
        equal(other) {
            this.custom((context, value) => {
                if (value != other) {
                    const stringifiedOther = JSON.stringify(JSON.parse(other));
                    context.addFailure(`'{memberName}' must be loosely equal to '${stringifiedOther}', but found '{memberValue}'.`);
                }
            });
            return this;
        },
        notEqual(other) {
            this.custom((context, value) => {
                if (value == other) {
                    const stringifiedOther = JSON.stringify(JSON.parse(other));
                    context.addFailure(`'{memberName}' must not be loosely equal to '${stringifiedOther}', but found '{memberValue}'.`);
                }
            });
            return this;
        },
        custom(testFunction) {
            tests.push(Test(testFunction));
            return this;
        },
        withMessage(customMessageTemplate) {
            tests[tests.length - 1].customMessageTemplate = customMessageTemplate;
            return this;
        },
        when(predicate) {
            tests[tests.length - 1].addPrecondition(predicate);
            return this;
        }
    };
};

function ValidationOptions() {
    this.throwOnFailures = false;
}

const ValidationStrategy = function() {
    const options = new ValidationOptions();

    return {
        throwOnFailures() {
            options.throwOnFailures = true;
        },
        get options() {
            return options;
        }
    };
};

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

function ValidationResult() {
    this.isValid = true;
    this.errors = {};
}

const Validator = function() {
    const rules = [];

    function buildOptions(strategyConfiguration) {
        const config = strategyConfiguration || (options => options);
        const strategy = ValidationStrategy();
        config(strategy);
        return strategy.options;
    }

    return {
        rule(memberName) {
            const rule = Rule(memberName);
            rules.push(rule);
            return rule;
        },
        validate(object, strategyConfiguration) {
            const options = strategyConfiguration === undefined
                ? new ValidationOptions()
                : buildOptions(strategyConfiguration);

            const globalResult = new ValidationResult();

            for (const rule of rules) {
                const ruleResult = rule.validate(object);
                if (ruleResult.length > 0) {
                    globalResult.errors[rule.memberName] = ruleResult;
                    globalResult.isValid = false;
                }
            }
    
            if (options.throwOnFailures && !globalResult.isSuccess) {
                const error = new Error("Validation failed.");
                error.validationResult = globalResult;
                throw error;
            }
    
            return globalResult;
        }
    };
};

export default Validator;