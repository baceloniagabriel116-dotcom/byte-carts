class CartManager {
  constructor() {
    this.cartKey = "shopping-cart";
    this.ordersKey = "user-orders";
    this.cart = this.loadCart();
  }

  loadCart() {
    try {
      const cart = localStorage.getItem(this.cartKey);
      return cart ? JSON.parse(cart).map(item => database.normalizeProduct(item)).filter(Boolean) : [];
    } catch {
      localStorage.removeItem(this.cartKey);
      return [];
    }
  }

  saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
    this.dispatchCartUpdate();
  }

  addToCart(product, quantity = 1) {
    const existingItem = this.cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({
        ...product,
        quantity,
        addedAt: new Date().toISOString()
      });
    }

    this.saveCart();
    return { success: true, message: `${product.name} added to cart` };
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  getCart() {
    return this.cart;
  }

  getCartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  async syncOrdersFromSupabase() {
    try {
      const remoteOrders = await database.fetchAPI('get_orders');
      if (!remoteOrders || !remoteOrders.length) return;
      const existing = this.getAllOrders();
      const merged = [...existing];
      for (const remoteOrder of remoteOrders) {
        if (!merged.some(order => String(order.id) === String(remoteOrder.id))) {
          merged.push({
            ...remoteOrder,
            userId: remoteOrder.user_id,
            shippingDetails: remoteOrder.shipping_details,
            orderNumber: remoteOrder.order_number,
            createdAt: remoteOrder.created_at
          });
        }
      }
      localStorage.setItem(this.ordersKey, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { cart: this.cart, count: this.getCartCount() } }));
    } catch (e) {
      console.warn("Supabase orders sync failed:", e.message);
    }
  }

  async checkout(shippingDetails) {
    if (!authManager.isLoggedIn()) {
      return { success: false, error: "Please log in to checkout" };
    }

    if (this.cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const order = {
      id: Date.now(),
      userId: authManager.getCurrentUser().id,
      items: [...this.cart],
      total: this.getCartTotal(),
      shippingDetails,
      status: "completed",
      createdAt: new Date().toISOString(),
      orderNumber: `ORD-${Date.now()}`
    };

    try {
      const savedOrder = await database.fetchAPI('create_order', {
        method: 'POST',
        body: {
          items: order.items,
          shippingDetails: order.shippingDetails,
          orderNumber: order.orderNumber
        }
      });
      order.id = savedOrder.id;
      order.total = Number(savedOrder.total);
      order.items = savedOrder.items || order.items;
      order.createdAt = savedOrder.created_at || order.createdAt;
      const orders = this.getAllOrders();
      orders.push(order);
      localStorage.setItem(this.ordersKey, JSON.stringify(orders));
      salesManager.recordOrder(order);
      await database.syncAll().catch(error => {
        console.warn("Supabase refresh after checkout failed:", error.message);
      });
    } catch (e) {
      console.warn("Supabase order save failed:", e.message);
      return { success: false, error: "The order could not be saved to the database. Please try again." };
    }

    this.clearCart();

    return { success: true, order };
  }

  getAllOrders() {
    const orders = localStorage.getItem(this.ordersKey);
    return orders ? JSON.parse(orders) : [];
  }

  getUserOrders() {
    if (!authManager.isLoggedIn()) return [];
    const userId = authManager.getCurrentUser().id;
    return this.getAllOrders().filter(order => order.userId === userId);
  }

  getOrder(orderId) {
    return this.getAllOrders().find(order => order.id == orderId);
  }

  dispatchCartUpdate() {
    window.dispatchEvent(new CustomEvent("cartUpdated", {
      detail: { cart: this.cart, count: this.getCartCount() }
    }));
  }
}

class SalesManager {
  constructor() {
    this.salesKey = "product-sales-counts";
    this.sales = this.loadSales();
  }

  loadSales() {
    const sales = localStorage.getItem(this.salesKey);
    return sales ? JSON.parse(sales) : {};
  }

  saveSales() {
    localStorage.setItem(this.salesKey, JSON.stringify(this.sales));
  }

  getSalesCount(productId) {
    return this.sales[productId] || 0;
  }

  recordOrder(order) {
    order.items.forEach(item => {
      this.sales[item.id] = this.getSalesCount(item.id) + item.quantity;
    });
    this.saveSales();
  }
}

class ReviewManager {
  constructor() {
    this.reviewsKey = "product-reviews";
    this.resetKey = "product-reviews-reset-v1";
    if (!localStorage.getItem(this.resetKey)) {
      localStorage.removeItem(this.reviewsKey);
      localStorage.setItem(this.resetKey, "true");
    }
    this.reviews = this.loadReviews();
  }

  loadReviews() {
    const reviews = database.getReviews();
    if (reviews.length) return reviews.map(review => this.normalizeReview(review));
    const legacyReviews = localStorage.getItem(this.reviewsKey);
    return legacyReviews ? JSON.parse(legacyReviews).map(review => this.normalizeReview(review)) : [];
  }

  async syncRemoteReviews() {
    try {
      const remoteReviews = await database.fetchAPI("get_reviews");
      this.reviews = (remoteReviews || []).map(review => this.normalizeReview(review));
      localStorage.setItem(this.reviewsKey, JSON.stringify(this.reviews));
    } catch (error) {
      console.warn("Review sync failed:", error.message);
    }
    return this.reviews;
  }

  normalizeReview(review) {
    return {
      ...review,
      id: Number(review.id),
      productId: Number(review.productId ?? review.product_id),
      userId: String(review.userId ?? review.user_id ?? ""),
      userName: review.userName || review.user_name || "Customer",
      rating: Number(review.rating),
      createdAt: review.createdAt || review.created_at
    };
  }

  saveReviews() {
    database.write("reviews", this.reviews);
    localStorage.setItem(this.reviewsKey, JSON.stringify(this.reviews));
  }

  async hasRemoteVerifiedPurchase(productId) {
    if (!authManager.isLoggedIn()) return false;
    try {
      const transactions = await database.fetchAPI('get_transactions');
      return transactions.some(transaction =>
        String(transaction.user_id) === String(authManager.getCurrentUser().id) &&
        Number(transaction.product_id) === Number(productId) &&
        transaction.status === 'completed'
      );
    } catch (e) {
      return false;
    }
  }

  async canUserReview(productId) {
    if (!authManager.isLoggedIn()) return false;

    const currentUser = authManager.getCurrentUser();
    const localTransactions = database.getTransactions();
    const hasVerifiedPurchase = localTransactions.some(transaction =>
      transaction.user_id === currentUser.id && transaction.product_id === productId && transaction.status === "completed"
    );

    if (!hasVerifiedPurchase) {
      const remote = await this.hasRemoteVerifiedPurchase(productId);
      if (!remote) return false;
    }

    const alreadyReviewed = this.reviews.some(
      review => review.userId === currentUser.id && review.productId === productId
    );

    return !alreadyReviewed;
  }

  async submitReview(productId, rating, comment) {
    if (!authManager.isLoggedIn()) {
      return { success: false, error: "Please log in to submit a review" };
    }

    if (!(await this.canUserReview(productId))) {
      return { success: false, error: "You are not eligible to review this product" };
    }

    const currentUser = authManager.getCurrentUser();
    const review = {
      id: Date.now(),
      productId,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      rating: parseFloat(rating),
      rating_stars: parseInt(rating, 10),
      comment,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.reviews.push(review);
    this.saveReviews();
    try {
      const savedReview = await database.fetchAPI('create_review', { method: 'POST', body: review });
      if (savedReview?.id) {
        review.id = Number(savedReview.id);
        review.userId = String(savedReview.user_id || currentUser.id);
        review.createdAt = savedReview.created_at || review.createdAt;
        this.saveReviews();
      }
    } catch (e) {
      console.warn("Supabase review save failed:", e.message);
      this.reviews = this.reviews.filter(item => item !== review);
      this.saveReviews();
      return { success: false, error: "The review could not be saved. Please try again." };
    }
    return { success: true, review };
  }

  async updateReview(reviewId, rating, comment) {
    if (!authManager.isLoggedIn()) {
      return { success: false, error: "Please log in to edit your review" };
    }

    const currentUser = authManager.getCurrentUser();
    const existing = this.reviews.find(r => Number(r.id) === Number(reviewId));
    if (!existing) return { success: false, error: "Review not found" };
    if (!currentUser || existing.userId !== currentUser.id) {
      return { success: false, error: "You can only edit your own reviews" };
    }

    const updated = {
      ...existing,
      rating: parseFloat(rating),
      rating_stars: parseInt(rating, 10),
      comment
    };
    this.reviews = this.reviews.map(r => Number(r.id) === Number(reviewId) ? updated : r);
    this.saveReviews();
    try {
      await database.fetchAPI('update_review', {
        method: 'POST',
        body: {
          id: updated.id,
          productId: updated.productId,
          rating: updated.rating,
          rating_stars: updated.rating_stars,
          comment: updated.comment
        }
      });
    } catch (e) {
      console.warn("Supabase review update failed:", e.message);
      return { success: false, error: "Could not save your changes. Please try again." };
    }
    return { success: true, review: updated };
  }

  getProductReviews(productId) {
    return this.reviews.filter(review => review.productId === productId);
  }

  getProductAverageRating(productId) {
    const productReviews = this.getProductReviews(productId);
    if (productReviews.length === 0) return 0;

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / productReviews.length).toFixed(1);
  }

  async deleteReview(reviewId) {
    const review = this.reviews.find(r => Number(r.id) === Number(reviewId));
    if (!review) return { success: false, error: "Review not found" };

    const currentUser = authManager.getCurrentUser();
    if (!currentUser || review.userId !== currentUser.id) {
      return { success: false, error: "You can only delete your own reviews" };
    }

    this.reviews = this.reviews.filter(r => Number(r.id) !== Number(reviewId));
    this.saveReviews();
    try {
      await database.fetchAPI('delete_review', { method: 'POST', body: { id: Number(reviewId) } });
    } catch (e) {
      console.warn("Supabase review delete failed:", e.message);
      return { success: false, error: "The review could not be deleted. Please try again." };
    }
    return { success: true };
  }
}

try {
  window.salesManager = new SalesManager();
  window.cartManager = new CartManager();
  window.reviewManager = new ReviewManager();
} catch (error) {
  console.error("Cart module initialization failed:", error);
  window.cartInitError = error.message;
}
