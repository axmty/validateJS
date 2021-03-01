function Test(predicate, template) {
    this.predicate = predicate;
    this.template = template;
}

function Rule(memberName) {
    this.memberName = memberName;
    this.tests = [];
}

Rule.prototype.Validate = function(object) {
    const result = [];
    for (const test of this.tests) {
        const memberValue = object[this.memberName]
        if (!test.predicate(memberValue)) {
            const message = test.template(memberValue);
            result.push(message);
        }
    }
    return result;
};

Rule.prototype.Null = function() {
    const predicate = x => x === null;
    const template = value => `'${this.memberName}' must be null, but found '${value}'`;
    this.tests.push(new Test(predicate, template));
    return this;
};

Rule.prototype.NotNull = function() {
    const predicate = x => x !== null;
    const template = value => `'${this.memberName}' must not be null, but found '${value}'`;
    this.tests.push(new Test(predicate, template));
    return this;
};

Rule.prototype.WithMessage = function(message) {
    let template;
    if (typeof message === "function") {
        template = message;
    } else if (typeof message === "string") {
        template = value => message;
    } else {
        throw new Error("Expected message to be a string or a function of the found value.");
    }
    this.tests[this.tests.length - 1].template = template;
};

function Validator() {
    this.rules = [];
}

Validator.prototype.RuleFor = function(memberName) {
    const rule = new Rule(memberName);
    this.rules.push(rule);
    return rule;
};

Validator.prototype.Validate = function(object) {
    const globalResult = {
        isSuccess: true
    };
    for (const rule of this.rules) {
        const ruleResult = rule.Validate(object);
        if (ruleResult.length > 0) {
            globalResult[rule.memberName] = ruleResult;
            globalResult.isSuccess = false;
        }
    }
    return globalResult;
};

function MyValidator() {
    Validator.call(this);
    this.RuleFor("nullRef").Null().WithMessage("it's not null!!");
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
    console.log(new MyValidator().Validate(obj));
})();