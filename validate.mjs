"use strict";

import { Rule, ValidationContext } from "./internal.mjs"

const ValidationStrategy = function() {
    const options = new ValidationOptions();

    return {
        throwOnFailures() {
            options.throwOnFailures = true;
        },
        includeRuleSets(...ruleSetNames) {
            options.ruleSetNames.push(...ruleSetNames);
        },
        includeDefaultRuleSet() {
            options.ruleSetNames.push("default");
        },
        get options() {
            return options;
        }
    };
};

const Validator = function() {
    function buildOptions(strategyConfiguration) {
        const config = strategyConfiguration || (options => options);
        const strategy = ValidationStrategy();
        config(strategy);
        return strategy.options;
    }

    function getRulesToValidate(ruleSetNames) {
        let filterPredicate = ruleSetNames.length === 0
            ? s => s
            : s => ruleSetNames.includes(s.name);
        return ruleSets.filter(filterPredicate).flatMap(s => s.rules);
    }

    const ruleSets = [];
    let currentRuleSetName = "default";

    return {
        ruleSet(name, ruleSetBuilder) {
            currentRuleSetName = name;
            ruleSetBuilder();
            currentRuleSetName = "default";
        },
        rule(memberName) {
            let set = ruleSets.find(s => s.name === currentRuleSetName);
            if (!set) {
                set = { name: currentRuleSetName, rules: [] };
                ruleSets.push(set);
            }
            const rule = Rule(memberName);
            set.rules.push(rule);
            return rule;
        },
        validate(object, strategyConfiguration) {
            const options = buildOptions(strategyConfiguration);

            const context = ValidationContext(object);
            const rulesToValidate = getRulesToValidate(options.ruleSetNames);
            for (const rule of rulesToValidate) {
                rule.validate(context);
            }

            const failures = context.failures;
            const isValid = Object.getOwnPropertyNames(failures).length === 0;
            const globalResult = new ValidationResult(isValid, failures);

            if (options.throwOnFailures && !globalResult.isValid) {
                const error = new Error("Validation failed.");
                error.validationResult = globalResult;
                throw error;
            }
    
            return globalResult;
        }
    };
};

function ValidationOptions() {
    this.throwOnFailures = false;
    this.ruleSetNames = [];
}

function ValidationResult(isValid, errors) {
    this.isValid = isValid;
    this.errors = errors;
}

export default Validator;