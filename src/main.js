export class RCBilling {
    constructor(apiKey) {
        Object.defineProperty(this, "_API_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_APP_USER_ID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "isStripeDefined", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: typeof window.Stripe === "function"
        });
        Object.defineProperty(this, "stripeInstance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._API_KEY = apiKey;
        if (RCBilling._RC_ENDPOINT === undefined ||
            RCBilling._RC_STRIPE_PUB_KEY === undefined) {
            console.error("Project was build without some of the environment variables set");
        }
    }
    async logIn(appUserId) {
        this._APP_USER_ID = appUserId;
        const response = await fetch(`${RCBilling._RC_ENDPOINT}/v1/subscribers/${this._APP_USER_ID}`, {
            headers: {
                Authorization: `Bearer ${this._API_KEY}`,
            },
        });
        const data = await response.text();
        console.log(data);
    }
}
Object.defineProperty(RCBilling, "_RC_ENDPOINT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: import.meta.env
        .VITE_RC_ENDPOINT
});
Object.defineProperty(RCBilling, "_RC_STRIPE_PUB_KEY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: import.meta.env
        .VITE_RC_STRIPE_PUB_KEY
});
if (typeof window !== "undefined") {
    window.RCBilling = RCBilling;
}
