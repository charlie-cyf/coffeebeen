/* tslint:disable:no-unused-expression */
import {expect} from "chai";
import CoffeeMaker from "../src/CoffeeMaker";
import {CoffeeKind} from "../src/CoffeeMaker";

enum CupSize {
    Small = 200,
    Medium = 400,
    Large = 600,
}


class  RequestTest implements IRequest {
    private code: number;
    private body: string;
    constructor(code: number, body: string){
        this.code = code;
        this.body = body;
    }
    public async post(hostname: string, path: string, content: object): Promise<Response>{
        return Promise.resolve({code: 200, body: "OK"});
    }
}

describe("CoffeeMaker", () => {
    let brewer: CoffeeMaker;

    before(() => {
        brewer = new CoffeeMaker();
    });

    it("Should brew a small cup of medium roast coffee", () => {
        let result: any;
        try {
            result = brewer.brew(CupSize.Small, CoffeeKind.Medium);
        } catch (err) {
            result = err;
        } finally {
            expect(result).to.be.undefined;
        }
    });

    it("Should brew a small cup of coffee when a small cup is requsted)");
    it("should send a request and turn on refill light if hopper < 30 %");
    it("should construct machine with unique serial number");
    it("should only refill when machine is not brewing", () => {
        let result: any;
        result = null;
    });
});
