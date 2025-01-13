const express = require('express');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const cors = require('cors');

dotenv.config();

const app = express();
const stripe = Stripe('sk_test_51OnhTkLaKTIuF5B7WjAWRTPrJwxoXdr7pk9GJXLzKzdogFGjKaPuzObrMhknVKjmBfT12NnFCNuzgETPQglnLf92006i0gRGvO');

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { packageName, description, priceAmount } = req.body;

  try {
    const product = await stripe.products.create({
      name: packageName,
      description: description,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceAmount,
      currency: 'aed',
      recurring: {
        interval: 'month',
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // subscription_data: {
      //   trial_period_days: 7,
      // },
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
