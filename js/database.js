const PRODUCT_CATEGORIES = Object.freeze(["electronics", "wearables", "accessories"]);
const SUPABASE_URL = "https://humpzihhxsvmxxdkhhco.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_kEO_dnT8sPcbcOaccNfzpg_h2WnDEYD";
const AUTH_SESSION_KEY = "bytecart-supabase-session";

class Database {
  constructor() {
    this.keys = {
      users: "db-users",
      products: "db-products",
      transactions: "db-transactions",
      reviews: "db-reviews",
      orders: "user-orders"
    };
  }

  read(table) {
    try {
      const value = localStorage.getItem(this.keys[table]);
      return value ? JSON.parse(value) : [];
    } catch {
      localStorage.removeItem(this.keys[table]);
      return [];
    }
  }

  write(table, rows) {
    localStorage.setItem(this.keys[table], JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("databaseUpdated", { detail: { table } }));
    return rows;
  }

  nextId(rows) {
    return rows.reduce((highest, row) => Math.max(highest, Number(row.id) || 0), 0) + 1;
  }

  normalizeProduct(product) {
    if (!product || typeof product !== "object") return null;
    const normalizeCategory = category => String(category || "").trim().toLowerCase();
    const categories = Array.isArray(product.categories)
      ? product.categories.map(normalizeCategory).filter(category => PRODUCT_CATEGORIES.includes(category))
      : PRODUCT_CATEGORIES.includes(normalizeCategory(product.category)) ? [normalizeCategory(product.category)] : [];
    const { category, ...productWithoutLegacyCategory } = product;
    const price = Number(product.price ?? product.price_php ?? 0);
    const discountPercent = Math.max(0, Math.min(90, Number(product.discount_percent) || 0));
    const effectivePrice = discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100) * 100) / 100 : price;
    const imageUrl = String(product.image_url || "");
    const safeImageUrl = /^(file:|[a-zA-Z]:[\\/]|\\\\)/.test(imageUrl)
      ? "assets/default-tech-placeholder.svg"
      : imageUrl;
    return { ...productWithoutLegacyCategory, image_url: safeImageUrl, price: effectivePrice, base_price: price, discount_percent: discountPercent, categories };
  }

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  }

  saveSession(session) {
    if (!session) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    const saved = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : null),
      token_type: session.token_type || "bearer",
      user: session.user
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(saved));
    return saved;
  }

  async refreshSession() {
    const session = this.getSession();
    if (!session?.refresh_token) return null;
    if (session.expires_at && session.expires_at > Math.floor(Date.now() / 1000) + 30) return session;

    try {
      const renewed = await this.request(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        body: { refresh_token: session.refresh_token },
        accessToken: SUPABASE_PUBLISHABLE_KEY
      });
      return this.saveSession(renewed);
    } catch (error) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem("currentUser");
      throw new Error(`Your Supabase session expired and could not be renewed: ${error.message}`);
    }
  }

  async request(url, options = {}) {
    const session = options.accessToken ? null : await this.refreshSession();
    const accessToken = options.accessToken || session?.access_token || SUPABASE_PUBLISHABLE_KEY;
    const headers = {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    };
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined
        ? undefined
        : options.rawBody ? options.body : JSON.stringify(options.body)
    });
    const text = await response.text();
    let result = null;
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Supabase returned an invalid response.");
      }
    }
    if (!response.ok) {
      const message = result?.message || result?.msg || result?.error_description || result?.error || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return result;
  }

  async signUp(email, password, firstName, lastName) {
    const result = await this.request(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      accessToken: SUPABASE_PUBLISHABLE_KEY,
      body: {
        email,
        password,
        data: { first_name: firstName, last_name: lastName },
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
      }
    });
    if (result.session) this.saveSession(result.session);
    return result;
  }

  async signIn(email, password) {
    const result = await this.request(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      accessToken: SUPABASE_PUBLISHABLE_KEY,
      body: { email, password }
    });
    this.saveSession(result);
    return result;
  }

  async signOut() {
    const session = this.getSession();
    if (session?.access_token) {
      try {
        await this.request(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST" });
      } finally {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }

  async uploadFile(file) {
    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 2 * 1024 * 1024;
    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "video/mp4": "mp4",
      "video/webm": "webm"
    };
    const extension = extensions[file.type];
    if (!extension) throw new Error("Only JPG, PNG, GIF, WEBP, SVG, MP4, or WEBM files are allowed.");
    if (file.size > maxBytes) throw new Error(isVideo ? "Video must be under 50 MB." : "Image must be under 2 MB.");

    const filename = `${crypto.randomUUID()}.${extension}`;
    const response = await this.request(
      `${SUPABASE_URL}/storage/v1/object/bytecart-assets/${filename}`,
      {
        method: "POST",
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        body: file,
        rawBody: true
      }
    );
    return {
      success: true,
      url: `${SUPABASE_URL}/storage/v1/object/public/bytecart-assets/${filename}`,
      path: response?.Key || `bytecart-assets/${filename}`
    };
  }

  async fetchAPI(action, options = {}) {
    const body = options.body || {};
    const query = new URLSearchParams();
    const rest = (table, params = query, method = "GET", data, headers = {}) => {
      const suffix = params.toString();
      return this.request(`${SUPABASE_URL}/rest/v1/${table}${suffix ? `?${suffix}` : ""}`, {
        method, body: data, headers
      });
    };
    const setQuery = values => {
      const params = new URLSearchParams();
      Object.entries(values).forEach(([key, value]) => params.set(key, value));
      return params;
    };
    const one = rows => Array.isArray(rows) ? rows[0] : rows;
    const productFields = product => {
      const fields = {};
      for (const key of ["name", "slug", "image_url", "price_php", "discount_percent", "description", "stock", "categories", "active"]) {
        if (product[key] !== undefined) fields[key] = product[key];
      }
      if (fields.price_php === undefined && product.base_price !== undefined) fields.price_php = product.base_price;
      if (fields.price_php === undefined && product.price !== undefined) fields.price_php = product.price;
      return fields;
    };

    switch (action) {
      case "get_users":
        if (!this.getSession()) return [];
        return rest("profiles", setQuery({ select: "id,email,first_name,last_name,role,created_at", order: "created_at.desc" }));
      case "get_user":
        return one(await rest("profiles", setQuery({ select: "*", email: `eq.${options.query?.email || ""}`, limit: "1" })));
      case "create_user":
        return this.signUp(body.email, body.password, body.firstName || "", body.lastName || "");
      case "update_user": {
        const fields = {};
        if (body.firstName !== undefined) fields.first_name = body.firstName;
        if (body.lastName !== undefined) fields.last_name = body.lastName;
        if (!Object.keys(fields).length) return { success: true };
        await rest("profiles", setQuery({ id: `eq.${this.getSession()?.user?.id || ""}` }), "PATCH", fields, { Prefer: "return=minimal" });
        return { success: true };
      }
      case "get_products": {
        const params = setQuery({ select: "*", order: "created_at.desc,id.desc" });
        let isAdmin = false;
        try {
          isAdmin = JSON.parse(localStorage.getItem("currentUser") || "{}").role === "admin";
        } catch {
          localStorage.removeItem("currentUser");
        }
        if (!isAdmin) {
          params.set("active", "eq.true");
        }
        return rest("products", params);
      }
      case "get_product":
        return one(await rest("products", setQuery({ select: "*", id: `eq.${options.query?.id || ""}`, limit: "1" })));
      case "create_product":
        return one(await rest("products", setQuery({ select: "*" }), "POST", productFields(body), { Prefer: "return=representation" }));
      case "update_product":
        await rest("products", setQuery({ id: `eq.${body.id || ""}` }), "PATCH", productFields(body), { Prefer: "return=minimal" });
        return { success: true };
      case "bulk_discount":
        return this.request(`${SUPABASE_URL}/rest/v1/rpc/set_bulk_discount`, {
          method: "POST",
          body: { p_scope: body.scope || "all", p_percent: Math.max(0, Math.min(90, Number(body.percent) || 0)) }
        });
      case "delete_product":
        await rest("products", setQuery({ id: `eq.${options.query?.id || ""}` }), "DELETE");
        return { success: true };
      case "get_transactions":
        return this.getSession() ? rest("transactions", setQuery({ select: "*", order: "transaction_date.desc" })) : [];
      case "create_transaction":
        return one(await rest("transactions", setQuery({ select: "*" }), "POST", body, { Prefer: "return=representation" }));
      case "login_user":
        return this.signIn(body.email, body.password);
      case "get_reviews":
        return rest("reviews", setQuery({ select: "*", order: "created_at.desc" }));
      case "create_review":
        return one(await rest("reviews", setQuery({ select: "*" }), "POST", {
          product_id: body.productId,
          user_name: body.userName,
          rating: body.rating,
          rating_stars: body.rating_stars ?? Math.round(Number(body.rating)),
          comment: body.comment
        }, { Prefer: "return=representation" }));
      case "update_review":
        await rest("reviews", setQuery({ id: `eq.${body.id}` }), "PATCH", {
          rating: body.rating,
          rating_stars: body.rating_stars ?? Math.round(Number(body.rating)),
          comment: body.comment
        }, { Prefer: "return=minimal" });
        return { success: true };
      case "delete_review":
        await rest("reviews", setQuery({ id: `eq.${body.id}` }), "DELETE");
        return { success: true };
      case "get_orders":
        return this.getSession() ? rest("orders", setQuery({ select: "*", order: "created_at.desc" })) : [];
      case "create_order":
        return this.request(`${SUPABASE_URL}/rest/v1/rpc/place_order`, {
          method: "POST",
          body: {
            p_items: body.items || [],
            p_shipping_details: body.shippingDetails || {},
            p_order_number: body.orderNumber || `ORD-${Date.now()}`
          }
        });
      case "get_site_settings":
        return rest("site_settings", setQuery({ select: "key,value", order: "key" }));
      case "save_site_setting":
        await rest("site_settings", setQuery({ on_conflict: "key" }), "POST", {
          key: body.key,
          value: typeof body.value === "string" ? body.value : JSON.stringify(body.value)
        }, {
          Prefer: "resolution=merge-duplicates,return=minimal"
        });
        return { success: true };
      case "get_team_members":
        return rest("team_members", setQuery({ select: "*", order: "sort_order,id" }));
      case "save_team_member": {
        const member = {
          name: body.name,
          role: body.role || "",
          bio: body.bio || "",
          image_url: body.image_url || "",
          sort_order: body.sort_order || 0
        };
        if (body.id) {
          await rest("team_members", setQuery({ id: `eq.${body.id}` }), "PATCH", member, { Prefer: "return=minimal" });
          return { success: true, id: body.id };
        }
        const saved = one(await rest("team_members", setQuery({ select: "id" }), "POST", member, { Prefer: "return=representation" }));
        return { success: true, id: saved.id };
      }
      case "delete_team_member":
        await rest("team_members", setQuery({ id: `eq.${body.id ?? options.query?.id ?? 0}` }), "DELETE");
        return { success: true };
      default:
        throw new Error(`Unsupported Supabase action: ${action}`);
    }
  }

  syncProducts(seedProducts) {
    const stored = this.read("products");
    if (stored.length) return stored.map(product => this.normalizeProduct(product)).filter(Boolean);
    const seeded = seedProducts.map(product => this.normalizeProduct({
      ...product,
      price_php: product.price,
      active: true,
      created_at: new Date().toISOString()
    }));
    return this.write("products", seeded.filter(Boolean));
  }

  async syncAll() {
    try {
      const [products, users, transactions, reviews, orders] = await Promise.all([
        this.fetchAPI("get_products"),
        this.fetchAPI("get_users"),
        this.fetchAPI("get_transactions"),
        this.fetchAPI("get_reviews"),
        this.fetchAPI("get_orders")
      ]);
      this.write("products", products.map(product => this.normalizeProduct(product)).filter(Boolean));
      this.write("users", users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        role: user.role || "user",
        createdAt: user.created_at
      })));
      this.write("transactions", transactions);
      this.write("reviews", reviews);
      this.write("orders", orders);
      localStorage.setItem("user-orders", JSON.stringify(orders.map(order => ({
        ...order,
        userId: order.user_id,
        shippingDetails: order.shipping_details,
        orderNumber: order.order_number,
        createdAt: order.created_at
      }))));
      return { products, users, transactions, reviews, orders };
    } catch (error) {
      console.warn("Supabase sync failed; keeping cached data:", error.message);
      throw error;
    }
  }

  getProducts() { return this.read("products").map(product => this.normalizeProduct(product)); }
  saveProducts(products) {
    const normalizedProducts = products.map(product => this.normalizeProduct(product)).filter(Boolean);
    if (!normalizedProducts.every(product => product.categories.length > 0)) {
      throw new Error("Every product must have at least one valid category.");
    }
    return this.write("products", normalizedProducts);
  }
  getTransactions() { return this.read("transactions"); }
  getReviews() { return this.read("reviews"); }
  getOrders() { return this.read("orders"); }
}

const database = new Database();
