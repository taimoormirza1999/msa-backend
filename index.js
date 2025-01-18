import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const stripe = Stripe('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');

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
      unit_amount: (priceAmount * 100),
      currency: 'usd',
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
      success_url: process.env.FRONTEND+'success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.FRONTEND,
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mailchimp subscription route (new)
app.post('/subscribe', async (req, res) => {
  const { email } = req.body; 

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const API_KEY = "a6c55cce99cb7ae8e1a4820ab79daf43-us8"; // Set this in your .env file
  const AUDIENCE_ID = 'a28be1907e'; // Set this in your .env file
  const DATACENTER = 'us8'; // Extract from your API key (e.g., us1, us2)

  const url = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;
  const options = {
    method: 'POST',
    headers: {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      tags: ["Customer"],
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.status === 'subscribed') {
      res.json({ message: 'Successfully subscribed!' });
    } else {
      res.status(400).json({ error: data.detail || 'Subscription failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', async (req, res) => {
  res.status(200).json({ message: "error.message" });
})


const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
