function Test() {
    this.whens = [];
}

Test.prototype.addWhen = function(predicate) {
    this.whens.push(predicate);
};

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

function PredicateTest(predicate, messageTemplate) {
    Test.call(this);
    this.predicate = predicate;
    this.messageTemplate = messageTemplate;
}

PredicateTest.prototype = Object.create(Test);

PredicateTest.prototype.resolve = function(testContext) {
    const result = [];
    if (!this.predicate(testContext.memberValue)) {
        result.push(resolveMessageTemplate(this.messageTemplate, testContext));
    }
    return result;
};

function CustomTest(testFunction) {
    Test.call(this);
    this.testFunction = testFunction;
}

CustomTest.prototype = Object.create(Test);

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
    return this;
};

Rule.prototype.withMessage = function(messageTemplate) {
    this.tests[this.tests.length - 1].messageTemplate = messageTemplate;
    return this;
};

Rule.prototype.when = function(predicate) {
    this.tests[this.tests.length - 1].whens.push(predicate);
    return this;
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






function SampleValidator() {
    Validator.call(this);
    this.ruleFor("nullRef").null().withMessage("it's not null!!").when(x => x.n === 9);
    this.ruleFor("n").null().withMessage("'{memberName}' is '{memberValue}', but it should be null!!");
    this.ruleFor("s").custom((context, value) => {
        if (value.length > 3) {
            context.addFailure("'{memberName}' string too long!!");
        }
        if (value.includes("a")) {
            context.addFailure("string cannot contain an 'a'");
        }
    });
    this.ruleFor("o.a").null().withMessage("'{memberName}' is '{memberValue}', but it should be null!!");
}

SampleValidator.prototype = Object.create(Validator.prototype);

(function test() {
    const obj = {
        n: 10,
        nullRef: 3,
        s: "azerty",
        o: {
            a: 10
        },
        arr: []
    };
    console.log(new SampleValidator().validate(obj));
})();