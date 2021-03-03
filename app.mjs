import Validator from "./validate.mjs"

class SampleValidator extends Validator {
    constructor() {
        super();
        this.rule("nullRef").null().when(x => x.n === 9);
        this.rule("n").null();
        this.rule("s").custom((context, value) => {
            if (value.length > 3) {
                context.addFailure("'{memberName}' string too long!!");
            }
            if (value.includes("a")) {
                context.addFailure("string cannot contain an 'a'");
            }
        });
        this.rule("o.a").null().when(x => x.o);
        this.rule("arr").truly().withMessage("arr is not truly sorry");
        this.rule("s").equal(false);
    }
}

(function test() {
    const obj = {
        n: 10,
        nullRef: 3,
        s: "azerty",
        o: {
            a: 10
        },
        arr: 0
    };

    try {
        new SampleValidator().validate(obj, { throwOnFailure: true });
    } catch (err) {
        console.log(err);
    }

    console.log(new SampleValidator().validate(obj));
})();