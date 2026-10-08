class EcommerceApp {
  constructor() {
    this.init();
  }

  init() {
    if (typeof reviewManager === "undefined" || typeof cartManager === "undefined") return;
    if (!database.getProducts().length && typeof seedProducts !== "undefined") {
      database.syncProducts(seedProducts);
    }
    database.getProducts().forEach(product => {
      product.rating = Number(reviewManager.getProductAverageRating(product.id)) || 0;
      product.reviews = reviewManager.getProductReviews(product.id).length;
    });
    this.setupEventListeners();
    this.updateUI();
    this.updateHeroGreeting();
    this.setupScrollAnimations();
    database.syncAll()
      .then(() => {
        reviewManager.reviews = reviewManager.loadReviews();
        database.getProducts().forEach(product => {
          product.rating = Number(reviewManager.getProductAverageRating(product.id)) || 0;
          product.reviews = reviewManager.getProductReviews(product.id).length;
        });
        window.dispatchEvent(new CustomEvent("databaseUpdated", { detail: { table: "products" } }));
      })
      .catch(error => console.warn("Supabase catalog sync failed; showing starter products:", error.message));
    cartManager.syncOrdersFromSupabase();
  }

  updateHeroGreeting() {
    const greeting = document.getElementById("heroGreeting");
    const subtitle = document.getElementById("heroSubtitle");
    if (!greeting) return;

    if (authManager.isAdmin()) {
      greeting.textContent = `Welcome back, Admin ${authManager.getCurrentUser().firstName || ""}`.trim();
      greeting.className = "hero-content h1 greeting-admin";
      if (subtitle) subtitle.textContent = "Manage your store inventory and sales dashboard";
    } else if (authManager.isLoggedIn()) {
      greeting.textContent = `Welcome back, ${authManager.getCurrentUser().firstName || "User"}`;
      greeting.className = "hero-content h1 greeting-user";
      if (subtitle) subtitle.textContent = "Continue your shopping journey";
    } else {
      greeting.textContent = "Welcome to Byte Cart";
      greeting.className = "hero-content h1";
      if (subtitle) subtitle.textContent = "Discover premium electronics, wearables, and accessories at unbeatable prices";
    }
  }

  setupEventListeners() {
    window.addEventListener("cartUpdated", () => this.updateCartUI());
    window.addEventListener("databaseUpdated", () => this.updateHeroGreeting());
  }

  setupScrollAnimations() {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const revealSelector = ".hero-content, .product-card, .category-card, .footer-section, .admin-panel, .checkout-summary";
    this.scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    const revealElements = root => {
      const elements = [];
      if (root.nodeType === Node.ELEMENT_NODE && root.matches(revealSelector)) elements.push(root);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll(revealSelector));
      elements.forEach((element, index) => {
        if (element.classList.contains("reveal-on-scroll")) return;
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 45}ms`);
        this.scrollObserver.observe(element);
      });
    };

    revealElements(document);
    this.animationMutationObserver = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => revealElements(node)));
    });
    this.animationMutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  updateUI() {
    this.updateCartUI();
    this.updateAuthUI();
  }

  updateCartUI() {
    const cartCount = document.getElementById("cartCount");
    if (cartCount) {
      cartCount.textContent = cartManager.getCartCount();
    }
  }

  updateAuthUI() {
    const userMenu = document.getElementById("userMenu");
    const authButtons = document.getElementById("authButtons");

    if (authManager.isLoggedIn()) {
      const user = authManager.getCurrentUser();
      if (userMenu) {
        const isAdmin = authManager.isAdmin();
        const initials = ((user.firstName || user.email || "U")[0] + (user.lastName ? user.lastName[0] : "")).toUpperCase();
        const roleLabel = isAdmin ? "Admin" : "User";
        userMenu.innerHTML = `
          <div class="user-profile${isAdmin ? " avatar-admin" : ""}" id="userProfile" tabindex="0" role="button" aria-haspopup="menu" aria-expanded="false">
            <div class="user-avatar${isAdmin ? " avatar-admin" : ""}">
              ${initials}
              <span class="avatar-status" title="Online"></span>
            </div>
            <div class="user-label">
              <span class="user-name">${user.firstName || "User"}</span>
              <span class="user-role${isAdmin ? " role-admin" : ""}">${roleLabel}</span>
            </div>
            <svg class="user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <div class="user-dropdown" role="menu">
              <div class="user-dropdown-header">
                <div class="dd-name">${user.firstName || ""} ${user.lastName || ""}</div>
                <div class="dd-email">${user.email || ""}</div>
              </div>
              <a href="account.html" class="user-dropdown-item" role="menuitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Account
              </a>
              ${isAdmin ? `
              <a href="admin.html" class="user-dropdown-item" role="menuitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                Admin Dashboard
              </a>` : ""}
              <button type="button" class="user-dropdown-item danger" role="menuitem" onclick="handleLogout()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        `;

        const profile = document.getElementById("userProfile");
        profile.addEventListener("click", event => {
          const dropdown = event.target.closest("a, button");
          if (dropdown) return;
          const open = profile.classList.toggle("is-open");
          profile.setAttribute("aria-expanded", open);
        });
        profile.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const open = profile.classList.toggle("is-open");
            profile.setAttribute("aria-expanded", open);
          }
        });
        if (!this._outsideClickHandler) {
          this._outsideClickHandler = event => {
            document.querySelectorAll(".user-profile.is-open").forEach(menu => {
              if (!menu.contains(event.target)) {
                menu.classList.remove("is-open");
                menu.setAttribute("aria-expanded", "false");
              }
            });
          };
          document.addEventListener("click", this._outsideClickHandler);
        }


        const cartIcon = document.querySelector(".nav-right > .cart-icon");
        if (cartIcon && cartIcon.nextElementSibling !== userMenu) {
          cartIcon.insertAdjacentElement("afterend", userMenu);
        }
      }
      if (authButtons) authButtons.style.display = "none";
    } else {
      if (authButtons) authButtons.style.display = "";
      if (userMenu) userMenu.innerHTML = "";
    }
  }

  displayProductDetail(product) {
    const container = document.getElementById("productDetail");
    if (!container) return;

    const productReviews = reviewManager.getProductReviews(product.id);
    const reviewCount = productReviews.length;
    const avgRating = reviewManager.getProductAverageRating(product.id);
    const fmtPrice = n => {
      const [intPart, decPart] = Number(n).toFixed(2).split(".");
      return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + decPart;
    };

    let ratingHTML = "";
    if (reviewCount > 0) {
      const stars = '★'.repeat(Math.floor(avgRating)) + (avgRating % 1 >= 0.5 ? '★' : '');
      ratingHTML = `
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(30, 42, 76, 0.85); border: 1px solid #334166; border-radius: 0.65rem; padding: 0.6rem 1rem; align-self: center;">
          <span style="font-size: 1.1rem; color: #f59e0b; letter-spacing: -0.05em;">
            ${stars}${'☆'.repeat(5 - Math.floor(avgRating))}
          </span>
          <span style="font-size: 0.95rem; font-weight: 700; color: #F8FAFC;">${avgRating}</span>
          <span style="font-size: 0.82rem; color: #A5B4D4;">(${reviewCount} review${reviewCount !== 1 ? 's' : ''})</span>
        </div>
      `;
    } else {
      ratingHTML = `
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(96, 165, 250, 0.1); border: 1px dashed rgba(96, 165, 250, 0.45); border-radius: 0.65rem; padding: 0.6rem 1rem; align-self: center;">
          <span style="font-size: 0.95rem; color: #94A3B8;">☆</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: #CBD5E1;">No reviews yet</span>
        </div>
      `;
    }

    const priceFormat = value => `₱${fmtPrice(value)}`;
    const formattedPrice = priceFormat(product.price);
    const formattedBase = priceFormat(product.base_price || product.price);

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start;">
        <div style="position: sticky; top: 100px; border: 2px solid #ffffff; border-radius: 1rem;">
          <div style="background: #f9fafb; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <img src="${product.image_url || 'assets/default-tech-placeholder.svg'}" alt="${product.name}" class="product-detail-image">
          </div>
        </div>

        <div style="border: 2px solid #ffffff; border-radius: 1rem; padding: 1.75rem; background: linear-gradient(180deg, #1B2440 0%, #1E293B 100%);">
          <div style="display: inline-block;">
            <span style="background: rgba(59, 130, 246, 0.12); color: #93C5FD; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.45rem 1rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.4);">${product.categories.join(", ")}</span>
          </div>

          <h1 style="font-size: 2.25rem; font-weight: 700; color: #F8FAFC; margin-top: 0.85rem; line-height: 1.2;">
            ${product.name}
          </h1>

          <p style="font-size: 1rem; color: #B7C2D8; line-height: 1.75; margin-top: 1.25rem; background: #141D33; border: 1px solid #2C3A5C; border-radius: 0.65rem; padding: 1rem 1.25rem;">
            ${product.description}
          </p>

          <div style="margin-top: 1.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; background: #141D33; border: 1px solid #2C3A5C; border-radius: 0.65rem; padding: 1.1rem 1.25rem;">
            <div style="display: flex; align-items: baseline; gap: 0.65rem; flex-wrap: wrap;">
              ${product.discount_percent > 0
                ? `<span style="font-size: 2rem; font-weight: 800; color: #F87171;">${formattedPrice}</span>
                 <span style="font-size: 0.9rem; color: #7B88A3; text-decoration: line-through;">${formattedBase}</span>
                 <span style="background: rgba(239, 68, 68, 0.16); color: #FCA5A5; padding: 0.2rem 0.65rem; border-radius: 9999px; font-weight: 700; font-size: 0.72rem;">${product.discount_percent}% OFF</span>`
                : `<span style="font-size: 2rem; font-weight: 800; color: #60A5FA;">${formattedPrice}</span>`}
            </div>
            <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(16, 185, 129, 0.14); color: #6EE7B7; padding: 0.4rem 0.9rem; border-radius: 9999px; font-weight: 600; font-size: 0.82rem; border: 1px solid rgba(16, 185, 129, 0.35);">
                <span style="font-size: 0.95rem;">●</span>
                ${product.stock} in stock
              </span>
              <span style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(96, 165, 250, 0.12); color: #93C5FD; padding: 0.4rem 0.9rem; border-radius: 9999px; font-weight: 600; font-size: 0.82rem; border: 1px solid rgba(96, 165, 250, 0.35);">
                ${salesManager.getSalesCount(product.id)} bought
              </span>
            </div>
          </div>

          <div style="margin-top: 1.25rem; display: flex; gap: 1rem; align-items: stretch; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; background: #141D33; border-radius: 0.65rem; border: 1px solid #2C3A5C; width: fit-content; align-self: stretch;">
              <button onclick="decreaseQuantity()" style="background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-size: 1.2rem; color: #94A3B8; transition: all 0.2s;" onmouseover="this.style.color='#F1F5F9'" onmouseout="this.style.color='#94A3B8'">−</button>
              <input type="number" id="quantity" value="1" min="1" max="${product.stock}" style="width: 60px; text-align: center; border: none; background: #1E2A4C; color: #F1F5F9; font-weight: 600; font-size: 1rem; outline: none;">
              <button onclick="increaseQuantity(${product.stock})" style="background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-size: 1.2rem; color: #94A3B8; transition: all 0.2s;" onmouseover="this.style.color='#F1F5F9'" onmouseout="this.style.color='#94A3B8'">+</button>
            </div>

            ${ratingHTML}

            <button onclick="addProductToCart(${product.id}, parseInt(document.getElementById('quantity').value))" style="flex: 1; min-width: 160px; padding: 1rem 2rem; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border: none; border-radius: 0.65rem; font-size: 1.05rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span>Add to Cart</span>
            </button>
          </div>

          <button onclick="buyNowProduct(${product.id}, parseInt(document.getElementById('quantity').value))" style="width: 100%; margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.08); color: #93C5FD; border: 2px solid #3B82F6; border-radius: 0.65rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>Buy Now</span>
          </button>

        </div>
      </div>

      <style>
        @media (max-width: 768px) {
          #productDetail > div {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          #productDetail h1 {
            font-size: 1.75rem !important;
          }
        }
      </style>
    `;
  }

  displayCart() {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    const cart = cartManager.getCart();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet. Explore our latest tech finds!</p>
          <a href="products.html" class="btn btn-primary">Continue Shopping</a>
        </div>
      `;
      return;
    }

    const subtotal = cartManager.getCartTotal();
    const total = subtotal;
    const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const cartHTML = `
      <div class="cart-layout">
        <div class="cart-items-col">
          <div class="cart-items-header">
            <h2>Your Items</h2>
            <span class="cart-items-count">${itemCount} item${itemCount === 1 ? "" : "s"}</span>
          </div>
          <div class="cart-items-list">
            ${cart.map(item => `
              <div class="cart-item-card">
                <a href="product.html?id=${item.id}" class="cart-item-img-wrap">
                  <img src="${item.image_url || 'assets/default-tech-placeholder.svg'}" alt="${item.name}" class="cart-item-img">
                </a>
                <div class="cart-item-info">
                  <a href="product.html?id=${item.id}" class="cart-item-name">${item.name}</a>
                  <p class="cart-item-price">₱${Number(item.price).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} each</p>
                  <div class="cart-item-controls">
                    <div class="cart-qty-stepper">
                      <button type="button" aria-label="Decrease quantity" onclick="updateCartItem(${item.id}, ${Math.max(1, Number(item.quantity) - 1)})">−</button>
                      <input type="number" value="${item.quantity}" min="1" onchange="updateCartItem(${item.id}, this.value)">
                      <button type="button" aria-label="Increase quantity" onclick="updateCartItem(${item.id}, ${Number(item.quantity) + 1})">+</button>
                    </div>
                    <button type="button" class="cart-item-remove" onclick="removeCartItem(${item.id})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Remove
                    </button>
                  </div>
                </div>
                <div class="cart-item-total">
                  <span class="cart-item-total-label">Total</span>
                  <span>₱${(item.price * item.quantity).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        <aside class="cart-summary-card">
          <h2>Order Summary</h2>
          <div class="cart-summary-rows">
            <div class="cart-summary-row"><span>Subtotal (${itemCount} item${itemCount === 1 ? "" : "s"})</span><span>₱${subtotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span></div>
            <div class="cart-summary-row"><span>Shipping</span><span class="cart-summary-free">FREE</span></div>
          </div>
          <div class="cart-summary-total">
            <span>Total</span>
            <span>₱${total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
          </div>
          <button onclick="proceedToCheckout()" class="btn btn-primary cart-checkout-btn">
            Proceed to Checkout
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
          <div class="cart-summary-perks">
            <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> Free nationwide shipping</div>
            <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg> Secure checkout</div>
            <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 3v6h6"/></svg> 7-day easy returns</div>
          </div>
          <a href="products.html" class="cart-continue-link">← Continue Shopping</a>
        </aside>
      </div>
    `;

    container.innerHTML = cartHTML;
  }
}

function addProductToCart(productId, quantity = 1) {
  const product = database.getProducts().find(p => Number(p.id) === Number(productId));
  if (product) {
    const result = cartManager.addToCart(product, quantity);
    showAddToCartPopup(product, quantity);
  }
}

function removeCartItem(productId) {
  cartManager.removeFromCart(productId);
  app.displayCart();
  showNotification("Item removed from cart", "success");
}

function updateCartItem(productId, quantity) {
  cartManager.updateQuantity(productId, parseInt(quantity));
  app.displayCart();
}

function proceedToCheckout() {
  if (!authManager.isLoggedIn()) {
    showLoginModal("Please log in to proceed with checkout");
  } else {
    window.location.href = "checkout.html";
  }
}

function handleLogout() {
  authManager.logout();
  showNotification("Logged out successfully", "success");
  setTimeout(() => window.location.href = "index.html", 1000);
}

function showAddToCartPopup(product, quantity = 1) {
  let popup = document.getElementById("addToCartPopup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "addToCartPopup";
    popup.className = "modal";
    popup.addEventListener("click", e => {
      if (e.target === popup) closeAddToCartPopup();
    });
    document.body.appendChild(popup);
  }

  popup.innerHTML = `
    <div class="modal-content atc-popup" style="max-width: 26rem; text-align: center;">
      <button class="close-btn" onclick="closeAddToCartPopup()" aria-label="Close">&times;</button>
      <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3 style="font-size: 1.35rem; font-weight: 700; color: #F8FAFC; margin: 0 0 0.35rem;">Added to Cart!</h3>
      <p style="color: #A5B4D4; font-size: 0.9rem; margin: 0 0 1.25rem; line-height: 1.5;">
        <strong style="color: #F1F5F9;">${product.name}</strong><br>
        <span style="color: #93C5FD; font-weight: 600;">${quantity} item${quantity > 1 ? "s" : ""} · ₱${(Number(product.price) * quantity).toLocaleString("en-PH", { maximumFractionDigits: 2 })}</span>
      </p>
      <img src="${product.image_url || 'assets/default-tech-placeholder.svg'}" alt="${product.name}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1.25rem;">
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeAddToCartPopup()">Continue Shopping</button>
        <a href="cart.html" class="btn btn-primary" style="flex: 1; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center;">View Cart</a>
      </div>
    </div>
  `;

  popup.classList.add("show");
}

function closeAddToCartPopup() {
  const popup = document.getElementById("addToCartPopup");
  if (popup) popup.classList.remove("show");
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
    }`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

function showLoginModal(message = "Please log in to continue") {
  const modal = document.getElementById("loginModal");
  if (modal) {
    document.getElementById("loginMessage").textContent = message;
    modal.classList.add("show");
  }
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) modal.classList.remove("show");
}

function decreaseQuantity() {
  const quantityInput = document.getElementById("quantity");
  if (quantityInput && parseInt(quantityInput.value) > 1) {
    quantityInput.value = parseInt(quantityInput.value) - 1;
  }
}

function increaseQuantity(maxStock) {
  const quantityInput = document.getElementById("quantity");
  if (quantityInput && parseInt(quantityInput.value) < maxStock) {
    quantityInput.value = parseInt(quantityInput.value) + 1;
  }
}

function buyNowProduct(productId, quantity) {
  const product = database.getProducts().find(p => Number(p.id) === Number(productId));
  if (!product) return;

  if (!authManager.isLoggedIn()) {
    showGuestPurchasePopup(product, quantity);
    return;
  }

  cartManager.addToCart(product, quantity);
  showNotification("Added to cart! Redirecting to checkout...", "success");
  setTimeout(() => {
    proceedToCheckout();
  }, 1000);
}

function showGuestPurchasePopup(product, quantity) {
  const redirect = encodeURIComponent(`product.html?id=${product.id}`);
  let popup = document.getElementById("guestPurchasePopup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "guestPurchasePopup";
    popup.className = "modal";
    popup.addEventListener("click", e => {
      if (e.target === popup) popup.classList.remove("show");
    });
    document.body.appendChild(popup);
  }

  popup.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Create an Account to Buy</h2>
        <button class="close-btn" onclick="document.getElementById('guestPurchasePopup').classList.remove('show')">&times;</button>
      </div>
      <p style="margin-bottom: 1.5rem; color: #CBD5E1; font-size: 0.95rem; line-height: 1.6;">
        You need an account to buy <strong style="color: #FCD34D;">${product.name}</strong>.
        Sign up now, or log in if you already have one, to continue with your purchase.
      </p>
      <div style="display: flex; gap: 1rem;">
        <a href="login.html?redirect=${redirect}" class="btn btn-warning" style="flex: 1; text-align: center; text-decoration: none;">Go to Login</a>
        <a href="login.html?redirect=${redirect}#register" class="btn btn-save" style="flex: 1; text-align: center; text-decoration: none;">Create Account</a>
      </div>
      <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" onclick="document.getElementById('guestPurchasePopup').classList.remove('show')">Continue Shopping</button>
    </div>
  `;

  popup.classList.add("show");
}

let reviewSortMode = "recent";
let editingReviewId = null;

function escapeHTML(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function editProductReview(reviewId) {
  editingReviewId = Number(reviewId);
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get("id"));
  displayReviewSection(productId).then(() => {
    const form = document.getElementById("reviewForm");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function cancelEditReview(productId) {
  editingReviewId = null;
  displayReviewSection(productId);
}

function sortReviews(reviews, mode) {
  const copy = [...reviews];
  if (mode === "highest") return copy.sort((a, b) => Number(b.rating) - Number(a.rating) || new Date(b.createdAt) - new Date(a.createdAt));
  if (mode === "lowest") return copy.sort((a, b) => Number(a.rating) - Number(b.rating) || new Date(b.createdAt) - new Date(a.createdAt));
  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function changeReviewSort(productId) {
  reviewSortMode = document.getElementById("reviewSort").value;
  displayReviewSection(productId);
}

async function displayReviewSection(productId) {
  const reviewSection = document.getElementById("reviewsSection");
  if (!reviewSection) return;

  await reviewManager.syncRemoteReviews();
  const productReviews = reviewManager.getProductReviews(productId);
  const canReview = await reviewManager.canUserReview(productId);
  const isLoggedIn = authManager.isLoggedIn();
  const editingReview = editingReviewId ? productReviews.find(r => Number(r.id) === Number(editingReviewId)) : null;

  let reviewsHTML = `
    <div style="margin-top: 3rem; padding-top: 3rem; border-top: 2px solid #334166;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #F8FAFC; margin: 0;">Customer Reviews</h2>
        ${productReviews.length > 0 ? `
        <div style="display: flex; align-items: center; gap: 0.5rem; background: #1E2A4C; border: 1px solid #334166; border-radius: 9999px; padding: 0.4rem 0.6rem 0.4rem 1rem;">
          <label for="reviewSort" style="font-size: 0.85rem; color: #A5B4D4; font-weight: 600;">Sort by</label>
          <select id="reviewSort" onchange="changeReviewSort(${productId})" style="background: #16203A; color: #F1F5F9; border: 1px solid #334166; border-radius: 9999px; padding: 0.3rem 0.75rem; font-size: 0.85rem; cursor: pointer; outline: none;">
            <option value="recent" ${reviewSortMode === "recent" ? "selected" : ""}>Most Recent</option>
            <option value="highest" ${reviewSortMode === "highest" ? "selected" : ""}>Highest Rating</option>
            <option value="lowest" ${reviewSortMode === "lowest" ? "selected" : ""}>Lowest Rating</option>
          </select>
        </div>` : ""}
      </div>
  `;

  if (isLoggedIn && (canReview || editingReview)) {
    const currentRating = editingReview ? Math.round(Number(editingReview.rating)) : 0;
    const currentComment = editingReview ? escapeHTML(String(editingReview.comment || "")) : "";
    reviewsHTML += `
      <div style="background: #16203A; padding: 2rem; border-radius: 0.75rem; margin-bottom: 2rem; border: 1px solid #334166;">
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #F8FAFC; margin-bottom: 1rem;">${editingReview ? "Edit Your Review" : "Write a Review"}</h3>
        <form id="reviewForm" onsubmit="submitProductReview(event, ${productId})">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; color: #E2E8F0; margin-bottom: 0.5rem;">Rating <span style="color: #f87171;">*</span></label>
            <div style="display: flex; gap: 0.5rem;">
              ${[1, 2, 3, 4, 5].map(star => `
                <input type="radio" id="rating${star}" name="rating" value="${star}" style="display: none;" ${editingReview && currentRating === star ? "checked" : ""}>
                <label for="rating${star}" style="font-size: 2rem; cursor: pointer; opacity: ${(editingReview ? star <= currentRating : false) ? '1' : '0.4'}; transition: opacity 0.2s;" onmouseover="previewRating(${star})" onmouseout="resetRating()">★</label>
              `).join('')}
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; color: #E2E8F0; margin-bottom: 0.5rem;">Your Review <span style="color: #f87171;">*</span></label>
            <textarea name="comment" placeholder="Share your experience with this product..." required style="width: 100%; min-height: 120px; padding: 0.75rem; border: 1px solid #334166; border-radius: 0.5rem; font-family: inherit; font-size: 1rem; resize: vertical; background: #1E2A4C; color: #F1F5F9;">${currentComment}</textarea>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="submit" style="padding: 0.75rem 2rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s;">${editingReview ? "Update Review" : "Submit Review"}</button>
            ${editingReview ? `<button type="button" onclick="cancelEditReview(${productId})" style="padding: 0.75rem 1.5rem; background: transparent; color: #94A3B8; border: 1px solid #334166; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Cancel</button>` : ''}
          </div>
        </form>
      </div>
    `;
  } else if (isLoggedIn && !canReview) {
    reviewsHTML += `
      <div style="background: rgba(245, 158, 11, 0.12); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
        <p style="font-size: 0.95rem; color: #FCD34D;"><strong>Verified Buyer Eligible</strong></p>
        <p style="font-size: 0.9rem; color: #FDE68A; margin-top: 0.25rem;">You have already reviewed this product.</p>
      </div>
    `;
  } else if (!isLoggedIn) {
    reviewsHTML += `
      <div style="background: rgba(37, 99, 235, 0.12); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem; border-left: 4px solid #2563eb;">
        <p style="font-size: 0.95rem; color: #93C5FD;"><strong>Only verified buyers can leave a review for this product.</strong></p>
        <p style="font-size: 0.9rem; color: #BFDBFE; margin-top: 0.5rem;"><a href="login.html" style="color: #7FB0F5; text-decoration: underline; font-weight: 600;">Log in</a> to review if you've purchased this item.</p>
      </div>
    `;
  }

  if (productReviews.length > 0) {
    const sortedReviews = sortReviews(productReviews, reviewSortMode);
    reviewsHTML += `
      <div style="margin-top: 2rem;">
        <h3 style="font-size: 1.1rem; font-weight: 600; color: #F1F5F9; margin-bottom: 1.5rem;">${productReviews.length} review${productReviews.length !== 1 ? 's' : ''}</h3>
        ${sortedReviews.map(review => `
          <div class="review-card" style="padding: 1.5rem; border: 1px solid #47598233; border-radius: 0.75rem; margin-bottom: 1rem; background: linear-gradient(180deg, #1E2A4C 0%, #16203A 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem; gap: 0.75rem;">
              <div>
                <span class="review-user" style="display: inline-block; background: #1E2A4C; color: #F8FAFC; font-weight: 600; padding: 0.2rem 0.7rem; border-radius: 9999px; font-size: 0.9rem; border: 1px solid #334166;">${review.userName}</span>
                <p class="review-date" style="font-size: 0.85rem; color: #94A3B8; margin-top: 0.3rem;">${new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <span style="display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); font-size: 1.1rem; color: #f59e0b; padding: 0.2rem 0.7rem; border-radius: 9999px;">${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}</span>
            </div>
            <p class="review-comment" style="color: #E2E8F0; line-height: 1.6; font-size: 1rem; background: rgba(30, 42, 76, 0.6); padding: 0.85rem 1rem; border-radius: 0.5rem; border-left: 3px solid #47598266; margin: 0;">${review.comment}</p>
            ${review.userId === (authManager.isLoggedIn() ? authManager.getCurrentUser().id : null) ? `
              <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                <button class="review-delete" onclick="editProductReview(${review.id})" style="padding: 0.35rem 0.75rem; background: rgba(37, 99, 235, 0.15); color: #93C5FD; border: 1px solid rgba(37, 99, 235, 0.4); border-radius: 0.25rem; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">Edit</button>
                <button class="review-delete" onclick="deleteProductReview(${review.id})" style="padding: 0.35rem 0.75rem; background: rgba(220, 38, 38, 0.15); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.4); border-radius: 0.25rem; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">Delete</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    reviewsHTML += `
      <div style="text-align: center; padding: 2rem; color: #94A3B8; background: #16203A; border: 1px dashed #334166; border-radius: 0.5rem;">
        <p style="font-size: 0.95rem;">Be the first to review this product after purchase.</p>
      </div>
    `;
  }

  reviewsHTML += `</div>`;
  reviewSection.innerHTML = reviewsHTML;
}

function previewRating(rating) {
  const labels = document.querySelectorAll('label[for^="rating"]');
  labels.forEach((label, index) => {
    label.style.opacity = index < rating ? '1' : '0.4';
  });
}

function resetRating() {
  const labels = document.querySelectorAll('label[for^="rating"]');
  const checked = document.querySelector('input[name="rating"]:checked');
  if (!checked) {
    labels.forEach(label => label.style.opacity = '0.4');
  } else {
    labels.forEach((label, index) => {
      label.style.opacity = index < parseInt(checked.value) ? '1' : '0.4';
    });
  }
}

async function submitProductReview(event, productId) {
  event.preventDefault();

  const form = event.target;
  const rating = form.querySelector('input[name="rating"]:checked')?.value;
  const comment = form.querySelector('textarea[name="comment"]').value;

  if (!rating) {
    showNotification("Please select a rating", "error");
    return;
  }

  if (!comment.trim()) {
    showNotification("Please write a review", "error");
    return;
  }

  const result = editingReviewId
    ? await reviewManager.updateReview(editingReviewId, rating, comment)
    : await reviewManager.submitReview(productId, rating, comment);

  if (result.success) {
    showNotification(editingReviewId ? "Review updated successfully!" : "Review submitted successfully!", "success");
    editingReviewId = null;
    displayReviewSection(productId);
  } else {
    showNotification(result.error || "Failed to submit review", "error");
  }
}

async function deleteProductReview(reviewId) {
  if (!confirm("Are you sure you want to delete this review?")) return;

  const result = await reviewManager.deleteReview(reviewId);
  if (result.success) {
    if (editingReviewId === Number(reviewId)) editingReviewId = null;
    showNotification("Review deleted successfully", "success");
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get("id"));
    displayReviewSection(productId);
  } else {
    showNotification(result.error || "Failed to delete review", "error");
  }
}

let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new EcommerceApp();
});
