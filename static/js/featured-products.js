import { fetchFeaturedProducts, addToCart } from './shop.js';

document.addEventListener('DOMContentLoaded', async () => {
  const featuredProductsList = document.getElementById('featured-products');

  if (!featuredProductsList) {
    console.warn('featured-products element not found on this page.');
    return;
  }

  // Function to render the featured products
  async function renderFeaturedProducts() {
    featuredProductsList.innerHTML = 'Loading...';

    try {
      const products = await fetchFeaturedProducts(); // <-- Calling the imported function
      featuredProductsList.innerHTML = '';

      if (products.length === 0) {
        featuredProductsList.innerHTML = '<p>No featured products available.</p>';
        return;
      }

      products.forEach(p => {
        const item = document.createElement('div');
        item.className = 'product';
        item.dataset.id = p.id;
        item.innerHTML = `
          <img src="${p.image_url || ''}" alt="${p.title || ''}" />
          <h3>${p.title}</h3>
          <p>${p.description || ''}</p>
          <div>€${Number(p.price).toFixed(2)}</div>
          <button class="add-to-cart-btn">Add to cart</button>
        `;
        featuredProductsList.appendChild(item);
      });

      // Attach add-to-cart click handlers here
      featuredProductsList.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const productId = btn.closest('.product').dataset.id;
            await addToCart(productId, 1);
            showCartMessage('Item added to cart!');
          } catch (e) {
            alert(e.message);
          }
        });
      });

    } catch (e) {
      console.error('Error rendering featured products:', e);
      featuredProductsList.innerHTML = '<p>Failed to load products.</p>';
    }
  }

  function showCartMessage(msg) {
    let el = document.getElementById('cart-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cart-message';
      el.style.color = 'green';
      el.style.marginTop = '10px';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    setTimeout(() => el.textContent = '', 3000);
  }

  await renderFeaturedProducts();
});
