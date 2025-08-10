document.addEventListener('DOMContentLoaded', () => {
    const priceSlider = document.getElementById('price-slider');
    const minDisplay = document.getElementById('price-min-display');
    const maxDisplay = document.getElementById('price-max-display');
    const productList = document.getElementById('products');

    // This check is crucial. The script will only proceed if the main product container exists.
    if (!productList) {
        console.error('Required element not found: products or featured-products');
        return;
    }

    // This is the new conditional block. The slider-specific code will only run
    // if the price-slider HTML element is found.
    if (priceSlider) {
        // Initialize noUiSlider
        noUiSlider.create(priceSlider, {
            start: [0, 500],
            connect: true,
            range: { min: 0, max: 500 },
            step: 1,
            tooltips: [true, true],
            format: {
                to: value => '$' + Math.round(value),
                from: value => Number(value.replace('$', ''))
            }
        });

        // Add the event listener to the slider
        priceSlider.noUiSlider.on('update', (values) => {
            const minPrice = parseFloat(values[0].replace('$', ''));
            const maxPrice = parseFloat(values[1].replace('$', ''));

            if (minDisplay) minDisplay.textContent = values[0];
            if (maxDisplay) maxDisplay.textContent = values[1];

            const products = productList.querySelectorAll('.product');
            products.forEach(product => {
                const priceText = product.querySelector('div').textContent;
                const price = parseFloat(priceText.replace('€', '').trim());

                if (price >= minPrice && price <= maxPrice) {
                    product.style.display = ''; // Show the product
                } else {
                    product.style.display = 'none'; // Hide the product
                }
            });
        });
    }
});