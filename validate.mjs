"use strict";

import { Rule, ValidationContext } from "./internal.mjs"

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

const Validator = function() {
    const rules = [];

    return {
        rule(memberName) {
            const rule = Rule(memberName);
            rules.push(rule);
            return rule;
        },
        validate(object, strategyConfiguration) {
            const options = buildOptions(strategyConfiguration);
            const context = ValidationContext(object);
            for (const rule of rules) {
                rule.validate(context);
            }

            const failures = context.failures;
            const isValid = Object.getOwnPropertyNames(failures).length === 0;
            const globalResult = new ValidationResult(isValid, failures);

            if (options.throwOnFailures && !globalResult.isSuccess) {
                const error = new Error("Validation failed.");
                error.validationResult = globalResult;
                throw error;
            }
    
            return globalResult;
        }
    };
};

function buildOptions(strategyConfiguration) {
    const config = strategyConfiguration || (options => options);
    const strategy = ValidationStrategy();
    config(strategy);
    return strategy.options;
}

function ValidationOptions() {
    this.throwOnFailures = false;
}

function ValidationResult(isValid, errors) {
    this.isValid = isValid;
    this.errors = errors;
}

export default Validator;