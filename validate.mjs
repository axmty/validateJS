"use strict";

function resolveMessageTemplate(template, testContext) {
    return template
        .replace("{memberName}", testContext.memberName)
        .replace("{memberValue}", testContext.memberValue);
}

function resolveObjectMember(object, memberName) {
    return memberName
        .split(".")
        .reduce((prev, value) => value = prev[value], object);
}

class Test {
    constructor() {
        this.whens = [];
    }
    
    addWhen(predicate) {
        this.whens.push(predicate);
    }
}

class PredicateTest extends Test {
    constructor(predicate, messageTemplate) {
        super();
        this.predicate = predicate;
        this.messageTemplate = messageTemplate;
    }

    resolve(testContext) {
        const result = [];
        if (!this.predicate(testContext.memberValue)) {
            result.push(resolveMessageTemplate(this.messageTemplate, testContext));
        }
        return result;
    }
}

class CustomTest extends Test {
    constructor(testFunction) {
        super();
        this.testFunction = testFunction;
    }

    resolve(testContext) {
        const context = new ValidationContext();
        this.testFunction(context, testContext.memberValue);
        return context.failures.map(message => resolveMessageTemplate(message, testContext));
    }
}

class Rule {
    constructor(memberName) {
        this.memberName = memberName;
        this.tests = [];
    }

    validate(object) {
        const result = [];
        for (const test of this.tests) {
            if (!test.whens.every(w => w(object))) {
                continue;
            }

            const failures = test.resolve({
                memberName: this.memberName,
                memberValue: resolveObjectMember(object, this.memberName)
            });

            if (failures.length > 0) {
                result.push(...failures);
            }
        }
        return result;
    }

    null() {
        const predicate = x => x === null;
        const template = "'{memberName}' must be null, but found '${memberValue}'";
        this.tests.push(new PredicateTest(predicate, template));
        return this;
    }

    notNull() {
        const predicate = x => x !== null;
        const template = "'{memberName}' must be not null, but found '${memberValue}'";
        this.tests.push(new PredicateTest(predicate, template));
        return this;
    }

    must(predicate) {
        const template = value => "Validation failed.";
        this.tests.push(new PredicateTest(predicate, template));
        return this;
    }

    custom(testFunction) {
        this.tests.push(new CustomTest(testFunction));
        return this;
    }

    withMessage(messageTemplate) {
        this.tests[this.tests.length - 1].messageTemplate = messageTemplate;
        return this;
    }

    when(predicate) {
        this.tests[this.tests.length - 1].whens.push(predicate);
        return this;
    }
}

class ValidationContext {
    constructor() {
        this.failures = [];
    }

    addFailure(message) {
        this.failures.push(message);
    }
}

class Validator {
    constructor() {
        this.rules = [];
    }

    rule(memberName) {
        const rule = new Rule(memberName);
        this.rules.push(rule);
        return rule;
    }

    validate(object, options = {}) {
        const globalResult = {
            isSuccess: true,
            failures: {}
        };

        for (const rule of this.rules) {
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
}

export default Validator;