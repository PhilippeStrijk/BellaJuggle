import { getCart, removeFromCart } from '/static/js/shop.js';

async function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const shippingCost = 10;

  cartContainer.innerHTML = 'Loading...';

  try {
    const cartItems = await getCart();

    if (cartItems.length === 0) {
      cartContainer.innerHTML = '<p>Your cart is empty.</p>';
      subtotalEl.textContent = '€0.00';
      totalEl.textContent = '€0.00';
      return;
    }

    cartContainer.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
      const price = Number(item.products.price);
      const totalPrice = price * item.qty;
      subtotal += totalPrice;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="item-details">
          <img src="${item.products.image_url || 'placeholder.png'}" alt="${item.products.title}" class="cart-item-image">
          <div class="item-info">
            <h4>${item.products.title}</h4>
            <p>Price: <span class="price">€${price.toFixed(2)}</span></p>
          </div>
        </div>
        <div class="item-quantity">
          <input type="number" value="${item.qty}" min="1">
        </div>
        <div class="item-total">
          €${totalPrice.toFixed(2)}
        </div>
        <button class="remove-item">Remove</button>
      `;

      div.querySelector('.remove-item').onclick = async () => {
        await removeFromCart(item.id);
        await renderCart();
      };

      cartContainer.appendChild(div);
    });

    subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
    totalEl.textContent = `€${(subtotal + shippingCost).toFixed(2)}`;

  } catch (err) {
    cartContainer.innerHTML = `<p style="color:red;">Error loading cart: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', renderCart);
