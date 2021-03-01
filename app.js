function PredicateTest(predicate, messageTemplate) {
    this.predicate = predicate;
    this.messageTemplate = messageTemplate;
}

function resolveMessageTemplate(template, testContext) {
    return template
        .replace("{memberName}", testContext.memberName)
        .replace("{memberValue}", testContext.memberValue);
}

PredicateTest.prototype.resolve = function(testContext) {
    const result = [];
    if (!this.predicate(testContext.memberValue)) {
        result.push(resolveMessageTemplate(this.messageTemplate, testContext));
    }
    return result;
};

function CustomTest(testFunction) {
    this.testFunction = testFunction;
}

CustomTest.prototype.resolve = function(testContext) {
    const context = new ValidationContext();
    this.testFunction(context, testContext.memberValue);
    return context.failures.map(message => resolveMessageTemplate(message, testContext));
};

function Rule(memberName) {
    this.memberName = memberName;
    this.tests = [];
}

Rule.prototype.validate = function(object) {
    const result = [];
    for (const test of this.tests) {
        const failures = test.resolve({
            memberName: this.memberName,
            memberValue: object[this.memberName]
        });
        if (failures.length > 0) {
            result.push(...failures);
        }
    }
    return result;
};

Rule.prototype.null = function() {
    const predicate = x => x === null;
    const template = "'{memberName}' must be null, but found '${memberValue}'";
    this.tests.push(new PredicateTest(predicate, template));
    return this;
};

Rule.prototype.notNull = function() {
    const predicate = x => x !== null;
    const template = "'{memberName}' must be not null, but found '${memberValue}'";
    this.tests.push(new PredicateTest(predicate, template));
    return this;
};

Rule.prototype.must = function(predicate) {
    const template = value => "Validation failed.";
    this.tests.push(new PredicateTest(predicate, template));
    return this;
};

Rule.prototype.custom = function(testFunction) {
    this.tests.push(new CustomTest(testFunction));
};

Rule.prototype.withMessage = function(messageTemplate) {
    this.tests[this.tests.length - 1].messageTemplate = messageTemplate;
};

function ValidationContext() {
    this.failures = [];
}

ValidationContext.prototype.addFailure = function(message) {
    this.failures.push(message);
};

function Validator() {
    this.rules = [];
}

Validator.prototype.ruleFor = function(memberName) {
    const rule = new Rule(memberName);
    this.rules.push(rule);
    return rule;
};

Validator.prototype.validate = function(object) {
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
    return globalResult;
};

function MyValidator() {
    Validator.call(this);
    this.ruleFor("nullRef").null().withMessage("it's not null!!");
    this.ruleFor("n").null().withMessage("'{memberName}' is '{memberValue}', but it should be null!!");
    this.ruleFor("s").custom((context, value) => {
        if (value.length > 3) {
            context.addFailure("'{memberName}' string too long!!");
        }
        if (value.includes("a")) {
            context.addFailure("string cannot contain an 'a'");
        }
    });
}

MyValidator.prototype = Object.create(Validator.prototype);

(function test() {
    const obj = {
        n: 10,
        nullRef: 3,
        s: "azerty",
        o: { },
        arr: []
    };
    console.log(new MyValidator().validate(obj));
})();