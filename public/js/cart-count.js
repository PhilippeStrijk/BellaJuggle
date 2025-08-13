import { getCart } from './shop.js';

async function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (!cartCountEl) return;

    try {
        const cartItems = await getCart();
        const totalItems = cartItems.reduce((total, item) => total + (item.qty || 1), 0);
        cartCountEl.textContent = totalItems;
    } catch (error) {
        console.error('Failed to get cart count:', error);
        cartCountEl.textContent = '0';
    }
}

// Update the count when the page loads
document.addEventListener('DOMContentLoaded', updateCartCount);

// You may also need to call this function whenever an item is added or removed from the cart.
// You would add this call inside your addToCart and removeFromCart functions in shop.js.