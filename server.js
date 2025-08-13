// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const nunjucks = require('nunjucks');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configure Nunjucks templates
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  watch: true, // reload templates on change
});
app.set('view engine', 'njk');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use('/static', express.static(path.join(__dirname, 'public')));

// Routes using Nunjucks templates
app.get('/', (req, res) => res.render('home.njk', { title: 'Home' }));
app.get('/shop', (req, res) => res.render('shop.njk', { title: 'Shop' }));
app.get('/about', (req, res) => res.render('about.njk', { title: 'About' }));
app.get('/contact', (req, res) => res.render('contact.njk', { title: 'Contact' }));
app.get('/cart', (req, res) => res.render('cart.njk', { title: 'Cart' }));
app.get('/checkout', (req, res) => res.render('checkout.njk', { title: 'Checkout' }));
app.get('/payment-confirmation', (req, res) => res.render('payment-confirmation', { title: 'Payment Confirmation' }));


// Create Stripe PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { cart = [], customerEmail } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cart) {
      if (!item.product_id) {
        return res.status(400).json({ error: 'Invalid cart format: each item must have a "product_id"' });
      }
    }

    // Fetch product prices securely from Supabase
    const productIds = cart.map(item => item.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Error fetching products' });
    }

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p.price;
    });

    // Calculate total amount in cents
    let amount = 0;
    for (const item of cart) {
      const price = productMap[item.product_id] || 0;
      amount += Math.round(price * item.qty * 100);
    }
    amount += 1000; // €10 shipping

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid cart amount' });
    }

    // Create PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail,
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Error creating PaymentIntent:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
