class ProductPage {
  constructor(parent) {
    if (parent.length === 0) {
      return
    }
    this.parent = parent;
    this.init();
  }

  inputQutityClick = () => {
    // Swiper call
    new Swiper(".mySwiper", {
      loop: true,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });

    // Plus and Minus Quantity click event
    var quantityInput = document.querySelector('input[name="quantity"]');
    var minusBtn = document.getElementById("qty-minus");
    var plusBtn = document.getElementById("qty-plus");
    var maxQty = quantityInput ? parseInt(quantityInput.getAttribute('max'), 10) : 0;
    var minQty = 1;
    if (quantityInput && minusBtn && plusBtn) {
      minusBtn.addEventListener("click", function () {
        var val = parseInt(quantityInput.value, 10);
        if (val > minQty) {
          quantityInput.value = val - 1;
        } else {
          quantityInput.value = minQty;
        }
      });
      plusBtn.addEventListener("click", function () {
        var val = parseInt(quantityInput.value, 10);
        if (val < maxQty) {
          quantityInput.value = val + 1;
        } else {
          alert("Only " + maxQty + " in stock.");
          quantityInput.value = maxQty;
        }
      });
    }

    //Use add.js to add Item in cart
    var form = document.getElementById("add-to-cart-form");
    if (form && quantityInput && maxQty > 0) {
      form.addEventListener("submit", function(e) {
        document.querySelector('.add-to-cart-btn-wrapper').classList.add('active');
        e.preventDefault();
        var val = parseInt(quantityInput.value, 10);
        if (val > maxQty) {
          alert("You cannot add more than " + maxQty + " of this product to your cart. Limit reached.");
          quantityInput.value = maxQty;
          return;
        }
        var formData = new FormData(form);
        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.status && data.status !== 200) {
            document.querySelector('.add-to-cart-btn-wrapper').classList.remove('active');
            alert(data.description || 'Error adding to cart.');
          } else {
            document.querySelector('.add-to-cart-btn-wrapper').classList.remove('active');
            alert('Product added to cart!');
            window.location.href = '/cart';
          }
        })
        .catch(() => {
          document.querySelector('.add-to-cart-btn-wrapper').classList.remove('active');
          console.log('Error adding to cart.');
        });
      });
    }
  }

  clickEvent = () => {
    this.bindButtonEvents();
  }

  bindButtonEvents = () => {
    const buttons = document.querySelectorAll('.button-group .link-text');
    const productContainer = document.querySelector('#shopify-section-template--18529811628186__main');
    const sectionId = 'main-product';
    if (buttons && buttons.length > 0 && productContainer && sectionId) {
      buttons.forEach(button => {
        // Remove previous event listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', () => {
          const url = newButton.getAttribute('data-url');
          if (!url || !productContainer) return;
          const fetchUrl = `${url}?section_id=${sectionId}`;
          if(document.querySelector(".websiteLoader.loading__spinner")) {
            document.querySelector(".websiteLoader.loading__spinner").classList.add("active");
          }
          fetch(fetchUrl)
            .then(response => response.text())
            .then(html => {
              // Parse HTML and extract the section content
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const newSection = doc.querySelector(`#shopify-section-${sectionId}`);
              if (newSection) {
                productContainer.innerHTML = newSection.innerHTML;
                history.pushState({}, '', url);
                // re call evrnts after DOM update
                this.inputQutityClick();
                this.bindButtonEvents();
              } else {
                console.warn('Section not found in response');
              }
              
              if(document.querySelector(".websiteLoader.loading__spinner")) {
                document.querySelector(".websiteLoader.loading__spinner").classList.remove("active");
              }
            })
            .catch(error => {
              if(document.querySelector(".websiteLoader.loading__spinner")) {
                document.querySelector(".websiteLoader.loading__spinner").classList.remove("active");
              }
              console.error('Error fetching product section:', error);
            });
        });
      });
    }
  }

  init = () => {
    this.inputQutityClick();
    this.clickEvent();
  } 
}

document.addEventListener('DOMContentLoaded', () => {
  new ProductPage(document.querySelectorAll('.main-product-wrapper'));
}, false);