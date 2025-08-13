// checkout.js
import { getCart, getCurrentUser } from './shop.js';

// DOM elements
const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('cart-subtotal');
const shippingEl = document.getElementById('cart-shipping');
const totalEl = document.getElementById('cart-total');
const paymentForm = document.getElementById('checkoutForm');
const paymentElement = document.getElementById('payment-element');
const paymentMessage = document.getElementById('payment-message');
const submitButton = document.getElementById('payment-submit-button');
const buttonText = document.getElementById('button-text');

// Stripe variables
let stripe = null;
let elements = null;

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

function renderCartSummary(cartItems) {
  if (!Array.isArray(cartItems)) {
    console.error('Cart is not an array:', cartItems);
    cartItems = []; // Fallback to empty array to prevent errors
  }

  cartItemsContainer.innerHTML = ''; // Clear existing items
  let subtotal = 0;
  cartItems.forEach(item => {
    // Adjust based on actual cart structure from getCart()
    // For guests: { product_id, qty }
    // For logged-in: { id, product_id, qty, added_at, products: { ... } }
    const product = item.products || item; // Handle both structures
    const price = product.price || 0;
    const quantity = item.qty || 0;
    const name = product.title || product.name || 'Unknown Product';

    subtotal += price * quantity;
    const itemEl = document.createElement('div');
    itemEl.classList.add('cart-item');
    itemEl.textContent = `${name} x ${quantity}: ${formatCurrency(price * quantity)}`;
    cartItemsContainer.appendChild(itemEl);
  });
  subtotalEl.textContent = formatCurrency(subtotal);
  // Assume fixed shipping of €10
  shippingEl.textContent = formatCurrency(10);
  totalEl.textContent = formatCurrency(subtotal + 10);
}

// Initialize Stripe
function initializeStripe() {
  // Initialize Stripe with your publishable key (replace with your actual key)
  stripe = Stripe('pk_test_51Rucs1QkRyv1ibfnDZ0suFKa8ezIeWzLUzDHMxgNiiFpbJcMtDN6Xje4z7sS2x30Gl4XAO02SXbWb1bMDIpkTgo700SgSHaymH'); // Use your real Stripe publishable key
}

// Create PaymentIntent and set up Payment Element
async function setupPaymentElement() {
  let cart = await getCart(); // Await here
  if (!Array.isArray(cart)) {
    console.error('Cart is not an array:', cart);
    cart = []; // Fallback to empty array
  }
  const user = await getCurrentUser(); // Await here
  
  try {
    // Calculate amount client-side for the request, but backend will verify
    const amount = cart.reduce((sum, item) => {
      const product = item.products || item;
      return sum + (product.price || 0) * (item.qty || 0);
    }, 0) + 10; // + shipping

    if (amount <= 0) {
      showMessage('Your cart is empty. Add items to proceed.');
      return;
    }

    // 1. Create a PaymentIntent on your server
    const response = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Now that getCart is more robust, we don't need a filter here.
        cart: cart.map(item => ({
          product_id: item.id,
          qty: item.qty
        })), // Send minimal data; backend fetches full details
        customerEmail: user?.email,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create payment intent: ${response.statusText}`);
    }
    
    const { clientSecret } = await response.json();
    
    // 2. Create Elements instance using the client secret
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        // You can customize the appearance further
      },
    });
    
    // 3. Create and mount the Payment Element
    const paymentElementInstance = elements.create('payment');
    paymentElementInstance.mount('#payment-element');
    
    // Enable the form
    submitButton.disabled = false;
    
  } catch (error) {
    console.error('Error setting up payment:', error);
    showMessage('Unable to initialize payment system. Please try again later.');
  }
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  
  if (!stripe || !elements) {
    // Stripe hasn't been initialized yet
    return;
  }
  
  // Disable the submit button to prevent multiple clicks
  setLoading(true);
  
  const fullName = document.getElementById('fullName').value;
  const address = document.getElementById('address').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;

  // Basic validation
  if (!fullName || !address || !email || !phone) {
    showMessage('Please fill in all fields.');
    setLoading(false);
    return;
  }
  
  // Confirm the payment
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Return to this page after payment
      return_url: `${window.location.origin}/payment-confirmation`,
      payment_method_data: {
        billing_details: {
          name: fullName,
          email: email,
          phone: phone,
          address: {
            line1: address, // Expand if you have more address fields
          }
        }
      },
      shipping: {
        name: fullName,
        phone: phone,
        address: {
          line1: address, // Assuming shipping same as billing; adjust if needed
        }
      }
    },
  });
  
  // This point will only be reached if there's an immediate error
  if (error) {
    showMessage(error.message || 'An unexpected error occurred.');
    setLoading(false);
  }
  // Otherwise, customer is redirected to the return_url
}

// Helper function for displaying error messages
function showMessage(messageText) {
  paymentMessage.textContent = messageText;
  paymentMessage.classList.remove('hidden');
}

// Helper function to update the loading state
function setLoading(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    buttonText.textContent = 'Processing...';
    // You could also show a spinner here
  } else {
    submitButton.disabled = false;
    buttonText.textContent = 'Pay now';
  }
}

// Initialize page
window.addEventListener('DOMContentLoaded', async () => { // Make async
  const cart = await getCart(); // Await here
  renderCartSummary(cart);
  
  // Initialize Stripe as soon as the page loads
  initializeStripe();
  
  // Set up payment element directly (single-step checkout)
  await setupPaymentElement(); // Await here
  
  // Set up form submission handler
  paymentForm.addEventListener('submit', handleSubmit);
});
