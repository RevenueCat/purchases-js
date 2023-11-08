export class RCBilling {
    constructor(apiKey, appUserId) {
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
        this._APP_USER_ID = appUserId;
        if (RCBilling._RC_ENDPOINT === undefined ||
            RCBilling._RC_STRIPE_PUB_KEY === undefined) {
            console.error("Project was build without some of the environment variables set");
            return;
        }
        fetch(`${RCBilling._RC_ENDPOINT}/v1/subscribers/${this._APP_USER_ID}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this._API_KEY}`,
            },
        })
            .then(async (response) => {
            if (response.ok) {
                // Check if status code is 200
                // You might want to return response.json() if the response is JSON
                return await response.text(); // Assuming response is text, not JSON
            }
            else {
                throw new Error(`Failed to fetch details for user: ${this._APP_USER_ID}`);
            }
        })
            // @ts-expect-error // eslint-disable-line
            .then((data) => {
            // TODO: get the connected account ID from the response
            const connectedAccountId = "acct_1JTpQVIH87UcPban";
            RCBilling.loadStripe(() => {
                if (window.Stripe != null) {
                    this.stripeInstance = window.Stripe(RCBilling._RC_STRIPE_PUB_KEY, {
                        stripeAccount: connectedAccountId,
                    });
                }
            });
        })
            .catch((error) => {
            console.error(error.message);
        });
    }
    // TODO: move this code somewhere Payment Gateway specific
    static loadStripe(callback) {
        if (window.Stripe != null) {
            callback();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.onload = callback;
        document.body.appendChild(script);
    }
    subscribeToProduct(cardToken, productId) {
        fetch(`${RCBilling._RC_ENDPOINT}/v2/billing/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this._API_KEY}`,
            },
            body: JSON.stringify({
                card_token: cardToken,
                app_user_id: this._APP_USER_ID,
                product_id: productId,
            }),
        })
            .then(async (response) => {
            if (!response.ok) {
                // If the response status code is not in the range 200-299,
                // we still need to process the response to read the text.
                return await response.text().then((text) => {
                    throw new Error(`Error processing payment: ${text}`);
                });
            }
            return await response.text();
        })
            .then((text) => {
            console.log("Payment processed successfully:", text);
        })
            .catch((error) => {
            console.error("Error occurred during fetch for payment processing:", error);
        });
    }
    renderForm(domNode, productId) {
        // TODO: Make generic for multiple payment gateways
        // TODO: add automatic retry mechanism
        if (window.Stripe == null) {
            console.error("Stripe hasn't been initialized yet. Make sure to call initialize first.");
            return;
        }
        const stripe = this.stripeInstance;
        const elements = stripe.elements();
        const card = elements.create("card");
        card.mount(domNode);
        // Create a submit button and form wrapper
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Payment";
        domNode.appendChild(submitBtn);
        submitBtn.addEventListener("click", (event) => {
            event.preventDefault();
            stripe.createToken(card).then((result) => {
                if (result.error) { // eslint-disable-line
                    console.error(result.error.message);
                }
                else {
                    // Forward the token to our server
                    this.subscribeToProduct(result.token.id, productId);
                }
            });
        });
    }
    subscribe(plan) {
        if (plan !== "monthly") {
            console.error("Only 'monthly' plan is supported currently.");
            return;
        }
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${RCBilling._RC_ENDPOINT}/v1/users/${this._APP_USER_ID}/subscribe`);
        xhr.setRequestHeader("Authorization", `Bearer ${this._API_KEY}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            if (xhr.status !== 200) {
                console.error(`Failed to subscribe user: ${this._APP_USER_ID} ${xhr.status}`);
            }
        };
        xhr.onerror = function () {
            console.error("Error occurred during the XMLHttpRequest for subscription.");
        };
        xhr.send(JSON.stringify({ plan }));
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
