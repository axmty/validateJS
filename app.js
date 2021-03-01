function Test(predicate, template) {
    this.predicate = predicate;
    this.message = template || "Test failed";
}

function Rule(memberName) {
    this.memberName = memberName;
    this.tests = [];
}

Rule.prototype.Validate = function(object) {
    const result = [];
    for (const test of this.tests) {
        if (!test.predicate(object[this.memberName])) {
            result.push(test.message);
        }
    }
    return result;
};

Rule.prototype.Null = function() {
    this.tests.push(new Test(x => x === null, "value is not null"));
    return this;
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
    for (const rule of this.rules) {
        console.log(rule.Validate(object));
    }
};

function MyValidator() {
    Validator.call(this);
    this.RuleFor("nullRef").Null();
}

MyValidator.prototype = Object.create(Validator.prototype);

(function test() {
    const obj = {
        n: 10,
        nullRef: null,
        s: "azerty",
        o: { },
        arr: []
    };
    const v1 = new MyValidator().Validate(obj);
})();