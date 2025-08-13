const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

// --- Auth helpers ---
export async function signUp(email, password, fullName = '') {
  const { data, error } = await supabase.auth.signUp({
    email, password,
  }, { data: { full_name: fullName }});
  if (error) throw error;
  if (data?.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName });
  }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// return profile row (contains is_admin)
export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) console.warn(error);
  return data;
}

// --- Products ---
export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Keep this function here. It will now be the centralized way to fetch
// featured products, which other scripts can call.
export async function fetchFeaturedProducts() {
  const { data, error } = await supabase.from('products').select('*').limit(3);
  if (error) throw new Error(error.message);
  return data;
}

export async function addProduct({ title, description, price, image_url }) {
  const { data, error } = await supabase.from('products').insert([{ title, description, price, image_url }]);
  if (error) throw error;
  return data[0];
}

export async function deleteProduct(productId) {
  const { data, error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return data;
}

// --- Cart (per-user) ---
function getGuestCart() {
  // This is a placeholder for your actual function.
  // It should retrieve a cart from local storage or another source.
  try {
    // Corrected to use the 'guest_cart' key
    const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    return cart;
  } catch (e) {
    console.error("Error parsing guest cart from local storage", e);
    return [];
  }
}

function saveGuestCart(cart) {
  localStorage.setItem('guest_cart', JSON.stringify(cart));
}

export async function addToCart(productId, qty = 1) {
  const user = await getCurrentUser();
  
  if (!user) {
    // Guest cart
    let cart = getGuestCart();
    const existing = cart.find(item => item.product_id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ product_id: productId, qty });
    }
    saveGuestCart(cart);
    window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
    return;
  }

  // Logged-in cart (Supabase)
  const { data: existing } = await supabase.from('carts').select('*')
    .eq('user_id', user.id).eq('product_id', productId).maybeSingle();

  if (existing) {
    const { data, error } = await supabase.from('carts')
      .update({ qty: existing.qty + qty }).eq('id', existing.id);
    if (error) throw error;
    window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
    return data[0];
  } else {
    const { data, error } = await supabase.from('carts')
      .insert([{ user_id: user.id, product_id: productId, qty }]);
    if (error) throw error;
    window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
    return data[0];
  }
}

export async function getCart() {
  const user = await getCurrentUser();
  if (!user) {
    // Guest cart: fetch product details manually
    const cart = getGuestCart();
    if (!Array.isArray(cart) || cart.length === 0) return [];

    // Filter to ensure only valid items are included before mapping
    const validCart = cart.filter(item => item && item.product_id && item.qty);
    if (validCart.length === 0) return [];
    
    const ids = validCart.map(item => item.product_id);
    const { data: products, error } = await supabase.from('products')
      .select('*')
      .in('id', ids);
    
    if (error) {
      console.error("Supabase fetch error:", error);
      throw error;
    }
    
    // Create the final cart object with product details
    return validCart.map(item => ({
      id: item.product_id,
      qty: item.qty,
      products: products.find(p => p.id === item.product_id)
    }));
  }

  // Logged-in cart from DB
  const { data, error } = await supabase
    .from('carts')
    .select('id, product_id, qty, added_at, products(*)')
    .eq('user_id', user.id);
  if (error) throw error;
  return data;
}

export async function removeFromCart(cartRowId) {
  const user = await getCurrentUser();
  if (!user) {
    // Remove from guest cart
    let cart = getGuestCart().filter(item => item.product_id !== cartRowId);
    saveGuestCart(cart);
    window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
    return;
  }
  const { data, error } = await supabase.from('carts').delete().eq('id', cartRowId);
  if (error) throw error;
  window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
  return data;
}

// And also add it to your clearCart function
export async function clearCart() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('carts').delete().eq('user_id', user.id);
  if (error) throw error;
  window.dispatchEvent(new Event('cart-updated')); // Dispatch the event
  return data;
}

// --- Render products dynamically ---
export async function renderProducts() {
  const list = document.getElementById('products');
  if (!list) return;
  list.innerHTML = 'Loading...';

  const products = await fetchProducts();
  list.innerHTML = '';

  if (products.length === 0) {
    list.innerHTML = '<p>No products available.</p>';
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
      <button data-delete="${p.id}" class="admin-only">Delete</button>
    `;
    list.appendChild(item);
  });

  // Attach handlers
  list.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        const productId = btn.closest('.product').dataset.id;
        await addToCart(productId, 1);

        // Fetch updated cart and calculate total count
        const cart = await getCart();
        const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

        showCartMessage(`Cart updated! Total items: ${totalCount}`);
      } catch (e) { alert(e.message); }
    };
  });

  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete product?')) return;
      try {
        await deleteProduct(btn.dataset.delete);
        await renderProducts();
      } catch (e) { alert(e.message); }
    };
  });

  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
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

// Toggle admin UI
export async function applyAdminUI() {
  try {
    const user = await getCurrentUser();
    if (!user) return; // skip for guests

    const profile = await getProfile();
    const isAdmin = profile?.is_admin;
    document.querySelectorAll('.admin-only').forEach(el =>
      el.style.display = isAdmin ? 'inline-block' : 'none'
    );
  } catch (err) {
    console.warn('applyAdminUI error:', err.message);
  }
}

// Init
window.addEventListener('DOMContentLoaded', async () => {
  await renderProducts();
  await applyAdminUI();
});
