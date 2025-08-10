document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    const productList = document.getElementById('products');

    if (!sortSelect || !productList) {
        console.error('Required elements not found: sort-select or products.');
        return;
    }

    sortSelect.addEventListener('change', () => {
        const products = Array.from(productList.querySelectorAll('.product'));
        const sortValue = sortSelect.value;

        products.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('div').textContent.replace(/[^0-9.]/g, ''));
            const priceB = parseFloat(b.querySelector('div').textContent.replace(/[^0-9.]/g, ''));
            const nameA = a.querySelector('h3').textContent.trim().toUpperCase();
            const nameB = b.querySelector('h3').textContent.trim().toUpperCase();

            // The main change is here: 'default' now falls into the 'price-asc' logic
            if (sortValue === 'price-asc') {
                return priceA - priceB;
            } else if (sortValue === 'price-desc' || sortValue === 'default') {
                return priceB - priceA;
            } else if (sortValue === 'name-asc') {
                return nameA.localeCompare(nameB);
            } else if (sortValue === 'name-desc') {
                return nameB.localeCompare(nameA);
            } else {
                // Fallback for any other unexpected value
                return 0;
            }
        });

        // Clear the existing product list
        while (productList.firstChild) {
            productList.removeChild(productList.firstChild);
        }

        // Append the sorted products back to the list
        products.forEach(product => productList.appendChild(product));
    });
});