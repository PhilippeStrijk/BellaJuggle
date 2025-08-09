document.addEventListener('DOMContentLoaded', () => {
  const priceSlider = document.getElementById('price-slider');
  const minDisplay = document.getElementById('price-min-display');
  const maxDisplay = document.getElementById('price-max-display');

  if (!priceSlider) {
    console.error('price-slider element not found');
    return;
  }

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

  priceSlider.noUiSlider.on('update', (values) => {
    minDisplay.textContent = values[0];
    maxDisplay.textContent = values[1];
  });
});
