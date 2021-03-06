"use strict";

import * as testFactories from "./tests.mjs"

const Rule = function(memberName) {
    const tests = [];

    return {
        get memberName() {
            return memberName;
        },
        validate(context) {
            const value = context.resolveMemberValue(memberName);
            context.currentRule = this;
    
            for (const test of tests) {
                const isValid = test.isValid(value, context);
                if (!isValid) {
                    context.addFailure(test.messageTemplate, memberName);
                }
            }
        },
        null() {
            tests.push(testFactories.Null());
            return this;
        },
        notNull() {
            tests.push(testFactories.NotNull());
            return this;
        },
        must(predicate) {
            tests.push(testFactories.Must(predicate));
            return this;
        },
        falsy() {
            tests.push(testFactories.Falsy());
            return this;
        },
        truly() {
            tests.push(testFactories.Truly());
            return this;
        },
        empty() {
            tests.push(testFactories.Empty());
            return this;
        },
        equal(other) {
            tests.push(testFactories.Equal(other));
            return this;
        },
        notEqual(other) {
            tests.push(testFactories.NotEqual(other));
            return this;
        },
        custom(customContextFunction) {
            tests.push(testFactories.Custom(customContextFunction));
            return this;
        },
        withMessage(template) {
            tests[tests.length - 1].defineMessageTemplate(template);
            return this;
        },
        when(predicate) {
            tests[tests.length - 1].addPrecondition(predicate);
            return this;
        }
    };
};

const ValidationContext = function(object) {
    const failures = {};
    let currentRule;

    return {
        addFailure(message) {
            const memberName = currentRule.memberName;
            if (!failures[memberName]) {
                failures[memberName] = [];
            }
            failures[memberName].push(resolveMessageTemplate(message, memberName));
        },
        get failures() {
            return failures;
        },
        resolveMemberValue(memberName) {
            return memberName
                .split(".")
                .reduce((prev, value) => value = prev[value], object);
        },
        set currentRule(rule) {
            currentRule = rule;
        }
    };
};

function resolveMessageTemplate(template, memberName) {
    return template.replace("{memberName}", memberName);
}

export { Rule, ValidationContext };