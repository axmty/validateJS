import Validator from "./module/validate.mjs"

class SamplePersonValidator extends Validator {
    constructor() {
        super();
        this.ruleSet("address", () => {
            this.rule("address").notNull();
            this.rule("address.city").notEmpty();
            this.rule("address.country").notEmpty();
        });

        this.ruleSet("names", () => {
            this.rule("surname").notEmpty();
            this.rule("forename").notEmpty();
        });

        this.rule("age").notEmpty();
        this.rule("pets").notEmpty().when(p => p.hasPets);
    }
}

(function test() {
    const person = {
        surname: "John",
        forename: "Doe",
        age: 23,
        address: {
            city: "Paris",
            country: null
        },
        hasPets: true,
        pets: []
    };

    console.log(new SamplePersonValidator().validate(person));
    console.log(new SamplePersonValidator().validate(person, options => options.includeRuleSets("address")));
    console.log(new SamplePersonValidator().validate(person, options => options.includeDefaultRuleSet()));
    try {
        new SamplePersonValidator().validate(person, options => options.throwOnFailures());
    } catch (err) {
        console.log(err);
    }
})();