// checkout.js
import { getCart, getCurrentUser } from './shop.js';

const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const taxesEl = document.getElementById('taxes');
const totalEl = document.getElementById('total');
const proceedPaymentBtn = document.getElementById('proceed-payment');

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCartSummary(cartItems) {
  cartItemsContainer.innerHTML = '';

  if (!cartItems || cartItems.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    subtotalEl.textContent = '$0.00';
    taxesEl.textContent = '$0.00';
    totalEl.textContent = '$0.00';
    proceedPaymentBtn.disabled = true;
    return;
  }

  let subtotal = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const cartItemDiv = document.createElement('div');
    cartItemDiv.className = 'cart-item';

    cartItemDiv.innerHTML = `
      <div class="item-details">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>Price: ${formatCurrency(item.price)}</p>
          <p>Quantity: ${item.quantity}</p>
        </div>
      </div>
      <div class="item-total">${formatCurrency(itemTotal)}</div>
    `;

    cartItemsContainer.appendChild(cartItemDiv);
  });

  const taxes = subtotal * 0.10;
  const total = subtotal + taxes;

  subtotalEl.textContent = formatCurrency(subtotal);
  taxesEl.textContent = formatCurrency(taxes);
  totalEl.textContent = formatCurrency(total);

  proceedPaymentBtn.disabled = false;
}

function handlePayment() {
  // Placeholder for payment integration

  // --- PayPal Integration ---
  // TODO: Add PayPal payment API calls here.
  // Example: open PayPal checkout modal or redirect to PayPal payment page.

  // --- Cryptocurrency Integration ---
  // TODO: Add crypto payment provider API calls here (e.g., CoinGate, Coinbase Commerce).
  // Example: redirect user to crypto payment gateway or open payment widget.

  alert('Payment functionality coming soon!');
}

window.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  renderCartSummary(cart);

  proceedPaymentBtn.addEventListener('click', handlePayment);
});
