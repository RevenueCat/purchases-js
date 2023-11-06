class RCBilling {
  _API_KEY: string | null = null;
  _APP_USER_ID: string | null = null;
  private static readonly _RC_ENDPOINT: string = "http://localhost:8000";
  private static readonly _RC_STRIPE_PUB_KEY: string =
    "pk_test_GCVUxZOBMRwyU6LbfLLunWj8"; // load this from backend

  private static readonly _CONNECTED_ACCOUNT_ID: string =
    "acct_1JTpQVIH87UcPban"; // garimberas, load this from backend

  isStripeDefined = typeof window.Stripe === "function";
  stripeInstance: any;

  constructor(apiKey: string, appUserId: string) {
    this._API_KEY = apiKey;
    this._APP_USER_ID = appUserId;

    fetch(`${RCBilling._RC_ENDPOINT}/v1/subscribers/${this._APP_USER_ID}`, {
      method: "GET", // GET is the default method, so this is optional
      headers: {
        Authorization: `Bearer ${this._API_KEY}`,
      },
    })
      .then(async (response) => {
        if (response.ok) {
          // Check if status code is 200
          // You might want to return response.json() if the response is JSON
          return await response.text(); // Assuming response is text, not JSON
        } else {
          throw new Error(
            `Failed to fetch details for user: ${this._APP_USER_ID}`,
          );
        }
      })
      // @ts-expect-error // eslint-disable-line
      .then((data) => {
        // get the connected account ID from the response
        RCBilling.loadStripe(() => {
          if (window.Stripe != null) {
            this.stripeInstance = window.Stripe(RCBilling._RC_STRIPE_PUB_KEY, {
              stripeAccount: RCBilling._CONNECTED_ACCOUNT_ID,
            });
          }
        });
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  // TODO: move this code somewhere Payment Gateway specific
  private static loadStripe(callback: () => void): void {
    if (window.Stripe != null) {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = callback;
    document.body.appendChild(script);
  }

  public subscribeToProduct(cardToken: string, productId: string): void {
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
        console.error(
          "Error occurred during fetch for payment processing:",
          error,
        );
      });
  }

  public renderForm(domNode: HTMLElement, productId: string): void {
    // TODO: Make generic for multiple payment gateways
    // TODO: add automatic retry mechanism
    if (window.Stripe == null) {
      console.error(
        "Stripe hasn't been initialized yet. Make sure to call initialize first.",
      );
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

      stripe.createToken(card).then((result: any) => {
        if (result.error) { // eslint-disable-line
          console.error(result.error.message);
        } else {
          // Forward the token to our server
          this.subscribeToProduct(result.token.id, productId);
        }
      });
    });
  }

  public subscribe(plan: string): void {
    if (plan !== "monthly") {
      console.error("Only 'monthly' plan is supported currently.");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.revenuecat.com/v1/users/${this._APP_USER_ID}/subscribe`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${this._API_KEY}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      if (xhr.status !== 200) {
        console.error(
          `Failed to subscribe user: ${this._APP_USER_ID} ${xhr.status}`,
        );
      }
    };
    xhr.onerror = function () {
      console.error(
        "Error occurred during the XMLHttpRequest for subscription.",
      );
    };
    xhr.send(JSON.stringify({ plan }));
  }
}

if (typeof window !== "undefined") {
  window.RCBilling = RCBilling;
}

export default RCBilling;
