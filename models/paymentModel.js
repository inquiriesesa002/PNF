// models/paymentModel.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use environment variable for Stripe secret key

const createPaymentIntent = async (amount, currency, paymentMethodId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
        });
        return paymentIntent;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createPaymentIntent,
};
