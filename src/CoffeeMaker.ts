/* tslint:disable:no-console */
import * as http from "http";
import {hostname} from "os";

enum CoffeeMakerState {
    Ready,
    Brewing,
}

export enum CoffeeKind {
    Medium,
    Dark,
    Decaf,
}

enum LightState {
    Off,
    On,
    Blink,
}

interface Hopper {
    kind: CoffeeKind;
    refillLight: LightState;
    quantity: number;
}

interface IRequest {
    Resonpse: {};
}

/* An IoT coffee marker that orders its own coffee beans and makes maintenance requests */
export default class CoffeeMaker {
    private static brewSpeed: number = 100;  // milliseconds per mL
    private static groundsPerMilliliter: number = 0.06;  // grams
    private static reservoirCapacity: number = 1000;  // milliliters
    private static hopperCapacity: number = 1000;  // grams

    private maintenanceLight: LightState;
    private quantityBrewed: number;
    private serialNumber: string;
    private state: CoffeeMakerState;

    private hoppers: Hopper[];

    constructor() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 12; i++) {
            this.serialNumber += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.state = CoffeeMakerState.Ready;
        const initHopper = {refillLight: LightState.Off, quantity: CoffeeMaker.hopperCapacity};
        this.hoppers = [
            Object.assign({kind: CoffeeKind.Medium}, initHopper),
            Object.assign({kind: CoffeeKind.Dark}, initHopper),
            Object.assign({kind: CoffeeKind.Decaf}, initHopper),
        ];
        this.quantityBrewed = 0;
    }

    /**
     * Brews coffee. If the hoppers go below 30% capacity, orders more beans. After brewing 10L of coffee, makes a
     * maintenance request.
     * @param amount The amount of coffee to brew in milliliters.
     * @param kind The type of coffee to brew.
     */
    public brew(amount: number, kind: CoffeeKind) {
        if (this.state !== CoffeeMakerState.Ready) {
            throw new Error("Not ready to brew coffee.");
        }
        // Heat water
        if (amount > CoffeeMaker.reservoirCapacity) {
            throw new Error("Sorry, you can't brew more than " + CoffeeMaker.reservoirCapacity + " mL of coffee.");
        }

        // Grind coffee
        const requiredGrounds: number = amount * CoffeeMaker.groundsPerMilliliter;
        const hopper: Hopper = this.hoppers[kind];
        if (requiredGrounds > hopper.quantity) {
            throw new Error("Please add more beans to the hopper.");
        }
        console.log("Starting to brew.");
        this.state = CoffeeMakerState.Brewing;
        const brewTime: number = amount * CoffeeMaker.brewSpeed;
        setTimeout(() => { this.state = CoffeeMakerState.Ready; console.log("Brewing complete"); }, brewTime);
        hopper.quantity = hopper.quantity - requiredGrounds;
        let orderPromise;
        if (hopper.quantity < 0.3 * CoffeeMaker.hopperCapacity) {
            hopper.refillLight = LightState.On;
            orderPromise = new Promise<{code: number, body: string}>((resolve, reject) => {
                const order: string = JSON.stringify({
                    serialNo: this.serialNumber,
                    kind,
                    qty: CoffeeMaker.hopperCapacity - hopper.quantity,
                });
                const options: http.RequestOptions = {
                    hostname: `http://jsonplaceholder.typicode.com/`,
                    port: 80,
                    path: `/orders`,
                    method: `POST`,
                    headers: {
                       "Content-Type": `application/json`,
                       "Content-Length": Buffer.byteLength(order),
                    },
                };

                const req = http.request(options, (res) => {
                    let body: string = "";
                    res.on(`data`, (chunk) => {
                        body += chunk.toString();
                    });
                    res.on(`end`, () => {
                        resolve({code: res.statusCode, body});
                    });
                });
                req.on(`error`, (err) => {
                    hopper.refillLight = LightState.Blink;
                    resolve({ code: 500, body: err.message });
                });
                req.write(order);
                req.end();
            });
        }

        // Brew
        this.quantityBrewed += amount;
        let maintenancePromise;
        if (this.quantityBrewed > 10000) {
            this.maintenanceLight = LightState.On;
            maintenancePromise = new Promise<{code: number, body: string}>((resolve, reject) => {
                const reqBody: string = JSON.stringify({serialNo: this.serialNumber});
                const options: http.RequestOptions = {
                    hostname: `http://jsonplaceholder.typicode.com/`,
                    port: 80,
                    path: `/maintenanceRequests`,
                    method: `POST`,
                    headers: {
                       "Content-Type": `application/json`,
                       "Content-Length": Buffer.byteLength(reqBody),
                    },
                };

                const req = http.request(options, (res) => {
                    let body: string = "";
                    res.on(`data`, (chunk) => {
                        body += chunk.toString();
                    });
                    res.on(`end`, () => {
                        resolve({code: res.statusCode, body});
                    });
                });
                req.on(`error`, (err) => {
                    this.maintenanceLight = LightState.Blink;
                    resolve({ code: 500, body: err.message });
                });
                req.write(reqBody);
                req.end();
            });
        }
    }

    /**
     * Add coffee beans to a hopper.
     * @param amount Amount of beans to add to the hopper in grams.
     * @param kind The type of coffee bean to add.
     */
    public addBeans(amount: number, kind: CoffeeKind) {
        const hopper: Hopper = this.hoppers[kind];
        if (this.state !== CoffeeMakerState.Ready) {
            throw new Error("Beans can't be added when the coffee maker is not ready.");
        }
        if (hopper.quantity + amount > CoffeeMaker.hopperCapacity) {
            throw new Error("The amount of beans added exceeds hopper capacity.");
        }

        hopper.quantity += amount;
        hopper.refillLight = LightState.Off;
    }

    /**
     * Reset the quantity brewed counter and turn off the maintenance light.
     */
    public reset() {
        this.quantityBrewed = 0;
        this.maintenanceLight = LightState.Off;
    }
}
    // mprivate post(hostname: string )
