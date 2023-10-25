(function(global) {
    let _API_KEY = null;
    let _APP_USER_ID = null;
    let _RC_ENDPOINT = "http://localhost:8000/v1";
    let _STRIPE_PUB_KEY = "pk_test_GCVUxZOBMRwyU6LbfLLunWj8"; // load this from backend

    function loadStripe(callback) {
        if (window.Stripe) {
            callback();
            return;
        }

        const script = document.createElement('script');
        script.src = "https://js.stripe.com/v3/";
        script.onload = callback;
        document.body.appendChild(script);
    }

    function sendTokenToServer(token) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${_RC_ENDPOINT}/v1/billing/subscribe`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function() {
            if (xhr.status !== 200) {
                console.error("Error processing payment:", xhr.responseText);
            } else {
                console.log("Payment processed successfully:", xhr.responseText);
            }
        };
        xhr.onerror = function() {
            console.error("Error occurred during the XMLHttpRequest for payment processing.");
        };
        xhr.send(JSON.stringify({ cardToken: token.id }));
    }

    const RCBilling = {
        initialize: function(apiKey, appUserId) {
            _API_KEY = apiKey;
            _APP_USER_ID = appUserId;

            const xhr = new XMLHttpRequest();
            xhr.open("GET", `${_RC_ENDPOINT}/subscribers/${_APP_USER_ID}`);
            xhr.setRequestHeader("Authorization", `Bearer ${_API_KEY}`);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    // Our Billing endpoint will return the payment gateway to use so we can load dynamically
                    loadStripe(function() {
                        window.stripeInstance = window.Stripe(_STRIPE_PUB_KEY)
                    });
                } else {
                    console.error(`Failed to fetch details for user: ${_APP_USER_ID}`);
                }
            };
            xhr.onerror = function() {
                console.error("Error occurred during the XMLHttpRequest");
            };
            xhr.send();
        },

        renderForm: function(domNode) {
            // Make generic for multiple payment gateways
            if (!window.Stripe) {
                console.error("Stripe hasn't been initialized yet. Make sure to call initialize first.");
                return;
            }

            var stripe = window.stripeInstance;
            const elements = stripe.elements();

            const card = elements.create('card');
            card.mount(domNode);

            // Create a submit button and form wrapper
            const submitBtn = document.createElement('button');
            submitBtn.textContent = 'Submit Payment';
            domNode.appendChild(submitBtn);

            submitBtn.addEventListener('click', function(event) {
                event.preventDefault();

                window.stripeInstance.createToken(card).then(function(result) {
                    if (result.error) {
                        console.error(result.error.message);
                    } else {
                        // Forward the token to our server
                        sendTokenToServer(result.token.id);
                    }
                });
            });
        },

        subscribe: function(plan) {
            if (plan !== "monthly") {
                console.error("Only 'monthly' plan is supported currently.");
                return;
            }

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.revenuecat.com/v1/users/${_APP_USER_ID}/subscribe`);
            xhr.setRequestHeader("Authorization", `Bearer ${_API_KEY}`);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function() {
                if (xhr.status !== 200) {
                    console.error(`Failed to subscribe user: ${_APP_USER_ID} ${xhr.status}`);
                }
            };
            xhr.onerror = function() {
                console.error("Error occurred during the XMLHttpRequest for subscription.");
            };
            xhr.send(JSON.stringify({ plan: plan }));
        }
    };

    global.RCBilling = RCBilling;
}(this));
