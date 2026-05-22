export const paypalService = {
    isScriptLoaded: false,

    loadScript(clientId) {
        return new Promise((resolve, reject) => {
            if (this.isScriptLoaded) {
                resolve();
                return;
            }

            if (!clientId) {
                reject(new Error("PayPal Client ID not found. Check VITE_PAYPAL_CLIENT_ID"));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons,marks,funding-eligibility`;
            script.async = true;
            script.onload = () => {
                this.isScriptLoaded = true;
                resolve();
            };
            script.onerror = (err) => {
                reject(err);
            };

            document.body.appendChild(script);
        });
    },

    // Validates if the window object has paypal
    isReady() {
        return window.paypal !== undefined;
    }
};