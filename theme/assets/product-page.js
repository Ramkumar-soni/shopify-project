class ProductGrid {
  constructor(parent) {
    this.parent = parent;
    if (!this.parent) return;
    this.init();
  }

  init = () => {
    this.sliderCode();
    this.bindSubscriptionChange();
    this.bindInputCardChange();
    this.bindAddToCart();
    this.bindVariantChange();
  };

  sliderCode = () => {
    const thumbSwiper = new Swiper('.thumb-swiper', {
      spaceBetween: 10,
      slidesPerView: 4,
      loop: true,
      freeMode: true,
      watchSlidesProgress: true,
    });

    // Store mainSwiper instance for later use
    this.mainSwiper = new Swiper('.main-swiper', {
      spaceBetween: 10,
      loop: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      thumbs: {
        swiper: thumbSwiper,
      },
    });
  }

  // Helper: Extract selected option values from a NodeList
  getSelectedOptions = (inputs) => {
    return Array.from(inputs).map(input => input.value.trim());
  };

  // Helper: Find matching variants based on selected options
  getMatchedVariants = (productJson, selectedOptions) => {
    return productJson?.variants?.filter(variant =>
      variant.options.every(option => selectedOptions.includes(option))
    ) || [];
  };

  // Helper: Set data-vid attribute on ATC button
  updateAtcButton = (matchedVariantIds) => {
    const atcButton = document.querySelector(".add-to-cart-button-js");
    if (!atcButton) return;
    if (matchedVariantIds.length > 1) {
      atcButton.setAttribute('data-vid', JSON.stringify(matchedVariantIds));
    } else {
      atcButton.setAttribute('data-vid', matchedVariantIds[0] ?? '');
    }
  };

  // Subscription radio change event
  bindSubscriptionChange = () => {
    document.querySelectorAll('input[name="subscription"]')?.forEach(radio => {
      radio.addEventListener('change', (e) => {
        // Remove all active classes
        document.querySelectorAll(".subscription-list-container .tab-wrapper")?.forEach(item =>
          item.classList.remove('active')
        );
        e.target.closest(".tab-wrapper")?.classList.add("active");

        const productJson = JSON.parse(document.querySelector(".product-main-js .product-json-js")?.innerText || '{}');
        let matchedVariantIds = [];

        if (e.target.value === 'double') {
          const checkedInputs = document.querySelectorAll(".inner-content-wrapper.double-drink-variant-selection input:checked");
          const selectedOptions = this.getSelectedOptions(checkedInputs);
          const matchedVariants = this.getMatchedVariants(productJson, selectedOptions);
          matchedVariantIds = matchedVariants.map(v => v.id);
          if (selectedOptions.length === 2 && selectedOptions.every(val => val === selectedOptions[0])) {
            matchedVariantIds = [matchedVariantIds[0], matchedVariantIds[0]];
          }
        } else if (e.target.value === 'try-once') {
          let checkedInputs;
          if (document.querySelector(".show-result-wrapper")?.classList.contains("active-double-drink")) {
            checkedInputs = document.querySelectorAll(".double-drink.double-drink-variant-selection input:checked");
          } else {
            checkedInputs = document.querySelectorAll(".single-drink input:checked");
          }
          const selectedOptions = this.getSelectedOptions(checkedInputs);
          const matchedVariants = this.getMatchedVariants(productJson, selectedOptions);
          matchedVariantIds = matchedVariants.map(v => v.id);
          if (selectedOptions.length === 2 && selectedOptions.every(val => val === selectedOptions[0])) {
            matchedVariantIds = [matchedVariantIds[0], matchedVariantIds[0]];
          }
        } else {
          const wrapper = e.target.closest(".tab-wrapper");
          const checkedInputs = wrapper?.querySelectorAll("variant-radios input:checked") || [];
          const selectedOptions = this.getSelectedOptions(checkedInputs);
          const matchedVariants = this.getMatchedVariants(productJson, selectedOptions);
          matchedVariantIds = matchedVariants.map(v => v.id);
        }
        this.updateAtcButton(matchedVariantIds);
      });
    });
  };

  // Input card radio change event
  bindInputCardChange = () => {
    document.querySelectorAll('input[name="input-card"]')?.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const showResultWrapper = document.querySelector(".inner-content-wrapper .show-result-wrapper");
        showResultWrapper?.classList.remove('active-double-drink', 'active-single-drink');
        const productJson = JSON.parse(document.querySelector(".product-main-js .product-json-js")?.innerText || '{}');
        let matchedVariantIds = [];
        let tabWrapper = e.target.closest(".tab-wrapper");
        if (e.target.value === 'double-drink') {
          if(tabWrapper) {
            tabWrapper.querySelector(".label-wrapper .double-drink-price-wrapper").style.display = 'block';
            tabWrapper.querySelector(".label-wrapper .single-drink-price-wrapper").style.display = 'none';
          }
          showResultWrapper?.classList.add("active-double-drink");
          const checkedInputs = document.querySelectorAll(".double-drink.double-drink-variant-selection input:checked");
          const selectedOptions = this.getSelectedOptions(checkedInputs);
          const matchedVariants = this.getMatchedVariants(productJson, selectedOptions);
          matchedVariantIds = matchedVariants.map(v => v.id);
          if (selectedOptions.length === 2 && selectedOptions.every(val => val === selectedOptions[0])) {
            matchedVariantIds = [matchedVariantIds[0], matchedVariantIds[0]];
          }
          this.updateAtcButton(matchedVariantIds);
        } else if (e.target.value === 'single-drink') {
          if(tabWrapper) {
            tabWrapper.querySelector(".label-wrapper .double-drink-price-wrapper").style.display = 'none';
            tabWrapper.querySelector(".label-wrapper .single-drink-price-wrapper").style.display = 'block';
          }
          showResultWrapper?.classList.add("active-single-drink");
          const checkedInputs = document.querySelectorAll(".single-drink input:checked");
          const selectedOptions = this.getSelectedOptions(checkedInputs);
          const matchedVariants = this.getMatchedVariants(productJson, selectedOptions);
          matchedVariantIds = matchedVariants.map(v => v.id);
          this.updateAtcButton(matchedVariantIds);
        }
      });
    });
  };

  // Add to cart button click event
  bindAddToCart = () => {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest(".add-to-cart-button-js");
      if (!btn) return;
      let vId;
      try {
        vId = JSON.parse(btn.getAttribute('data-vid'));
      } catch {
        vId = btn.getAttribute('data-vid');
      }
      if (!vId) return false;

      btn.querySelector('.atc-text').innerText = "Adding...";
      let formData;
      if (Array.isArray(vId) && vId.length > 1) {
        formData = { items: vId.map(id => ({ id, quantity: 1 })) };
      } else {
        formData = { items: [{ id: Array.isArray(vId) ? vId[0] : vId, quantity: 1 }] };
      }

      fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(response => response.json())
        .then(() => {
          document.querySelectorAll(".add-to-cart-button-js .atc-text").forEach(item => {
            item.innerText = "ADD TO CART";
          });
          const successText = document.querySelector(".sucess-text");
          successText?.classList.add("show");
          setTimeout(() => successText?.classList.remove("show"), 900);
          window.location.href = '/cart';
        })
        .catch(error => console.error('Error:', error));
    });
  };

  // Variant radios change event
  bindVariantChange = () => {
    document.querySelectorAll("variant-radios input", this.parent)?.forEach(input => {
      input.addEventListener('change', (e) => {
        const product = input.closest(".product-main-js");
        this.variantChange(product, input);
      });
    });
  };

variantChange = (parent, item) => {
  let options = [];
  const productJson = JSON.parse(parent?.querySelector('.product-json-js')?.innerText || '{}');
  if (item.closest(".double-drink-variant-selection")) {
    item.closest(".double-drink-variant-selection")?.querySelectorAll('.variant-selector-wrapper input:checked')?.forEach(option => {
      options.push(option.value);
    });
  } else {
    parent?.querySelectorAll(`variant-radios input[name='${item.name}']:checked`)?.forEach(option => {
      options.push(option.value);
    });
  }

  const matchedVariants = this.getMatchedVariants(productJson, options);
  if (!matchedVariants.length) {
    parent?.querySelector('.error-text')?.classList.add('show');
    return;
  }
  if (!matchedVariants[0]?.available) {
    parent?.querySelector('.soldout-text')?.classList.add('show');
  }

  let matchedVariantIds = matchedVariants.map(v => v.id);
  if (options.length === 2 && options.every(val => val === options[0])) {
    matchedVariantIds = [matchedVariantIds[0], matchedVariantIds[0]];
  }
  this.updateAtcButton(matchedVariantIds);

  // --- NEW CODE: Slide to matched variant image ---
  if (matchedVariants[0]?.featured_media?.id && this.mainSwiper) {
    const mediaId = matchedVariants[0].featured_media.id;
    // Find the index of the slide with this media id
    const slides = this.mainSwiper.slides;
    let targetIndex = -1;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].dataset.mediaId == mediaId) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex !== -1) {
      this.mainSwiper.slideToLoop(targetIndex);
    }
  }
  // --- Hide/show thumbnail slider based on device ---
  const thumbSwiperEl = document.querySelector('.thumb-swiper');
  if (thumbSwiperEl) {
    if (window.innerWidth >= 768) {
      // Desktop: hide thumbnails
      thumbSwiperEl.style.display = 'none';
    } else {
      // Mobile: show thumbnails
      thumbSwiperEl.style.display = '';
    }
  }
};
}

new ProductGrid(document.querySelector('.product-page-container'));