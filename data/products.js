const seedProducts = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    slug: "wireless-noise-cancelling-headphones",
    image_url: "assets/default-tech-placeholder.svg",
    price: 11399.00,
    description: "Premium wireless headphones with active noise cancellation.",
    stock: 15,
    categories: ["electronics"]
  },
  {
    id: 2,
    name: "Smart Watch Series 5",
    slug: "smart-watch-series-5",
    image_url: "assets/default-tech-placeholder.svg",
    price: 28499.00,
    description: "Advanced smartwatch with health monitoring and GPS.",
    stock: 8,
    categories: ["electronics", "wearables"]
  },
  {
    id: 3,
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    image_url: "assets/default-tech-placeholder.svg",
    price: 19949.00,
    description: "RGB mechanical keyboard with programmable macros.",
    stock: 22,
    categories: ["electronics", "accessories"]
  },
  {
    id: 4,
    name: "27-inch 4K IPS Monitor",
    slug: "27-inch-4k-ips-monitor",
    image_url: "assets/default-tech-placeholder.svg",
    price: 24999.00,
    description: "Ultra-sharp 4K display with 99% sRGB color coverage.",
    stock: 10,
    categories: ["electronics", "accessories"]
  },
  {
    id: 5,
    name: "Bluetooth Gaming Mouse",
    slug: "bluetooth-gaming-mouse",
    image_url: "assets/default-tech-placeholder.svg",
    price: 249.00,
    description: "Lightweight wireless mouse with 16,000 DPI sensor.",
    stock: 35,
    categories: ["electronics", "accessories"]
  },
  {
    id: 6,
    name: "USB-C Fast Charger 65W",
    slug: "usb-c-fast-charger-65w",
    image_url: "assets/default-tech-placeholder.svg",
    price: 1799.00,
    description: "GaN charger with dual USB-C ports for laptops and phones.",
    stock: 40,
    categories: ["electronics", "accessories"]
  },
  {
    id: 7,
    name: "Noise-Cancelling Earbuds",
    slug: "noise-cancelling-earbuds",
    image_url: "assets/default-tech-placeholder.svg",
    price: 6499.00,
    description: "True wireless earbuds with transparency mode and IPX5 rating.",
    stock: 25,
    categories: ["electronics"]
  },
  {
    id: 8,
    name: "Portable SSD 1TB",
    slug: "portable-ssd-1tb",
    image_url: "assets/default-tech-placeholder.svg",
    price: 789.00,
    description: "USB 3.2 external SSD with 1,050 MB/s transfer speeds.",
    stock: 18,
    categories: ["electronics", "accessories"]
  },
  {
    id: 9,
    name: "Laptop Cooling Pad",
    slug: "laptop-cooling-pad",
    image_url: "assets/default-tech-placeholder.svg",
    price: 1299.00,
    description: "Five-fan cooling pad with adjustable height and RGB lighting.",
    stock: 30,
    categories: ["accessories"]
  },
  {
    id: 10,
    name: "Webcam 1080p Pro",
    slug: "webcam-1080p-pro",
    image_url: "assets/default-tech-placeholder.svg",
    price: 349.00,
    description: "Full HD webcam with auto-focus and built-in noise-reducing mic.",
    stock: 20,
    categories: ["electronics", "accessories"]
  },
  {
    id: 11,
    name: "Ergonomic Office Chair",
    slug: "ergonomic-office-chair",
    image_url: "assets/default-tech-placeholder.svg",
    price: 12999.00,
    description: "Mesh-back chair with lumbar support and adjustable armrests.",
    stock: 7,
    categories: ["accessories"]
  },
  {
    id: 12,
    name: "Standing Desk Converter",
    slug: "standing-desk-converter",
    image_url: "assets/default-tech-placeholder.svg",
    price: 9499.00,
    description: "Height-adjustable desk riser that fits dual monitors.",
    stock: 9,
    categories: ["accessories"]
  },
  {
    id: 13,
    name: "Fitness Tracker Band",
    slug: "fitness-tracker-band",
    image_url: "assets/default-tech-placeholder.svg",
    price: 289.00,
    description: "Slim band with heart-rate monitor, sleep tracking and 14-day battery.",
    stock: 28,
    categories: ["electronics", "wearables"]
  },
  {
    id: 14,
    name: "Wireless Charging Pad",
    slug: "wireless-charging-pad",
    image_url: "assets/default-tech-placeholder.svg",
    price: 1099.00,
    description: "15W Qi fast charging pad with anti-slip silicone surface.",
    stock: 45,
    categories: ["electronics", "accessories"]
  },
  {
    id: 15,
    name: "External HDD 2TB",
    slug: "external-hdd-2tb",
    image_url: "assets/default-tech-placeholder.svg",
    price: 569.00,
    description: "Portable 2.5-inch hard drive with shock-resistant casing.",
    stock: 16,
    categories: ["electronics", "accessories"]
  },
  {
    id: 16,
    name: "Streaming Microphone",
    slug: "streaming-microphone",
    image_url: "assets/default-tech-placeholder.svg",
    price: 5299.00,
    description: "USB condenser mic with cardioid pickup and zero-latency monitoring.",
    stock: 14,
    categories: ["electronics"]
  },
  {
    id: 17,
    name: "Gaming Headset with Mic",
    slug: "gaming-headset-with-mic",
    image_url: "assets/default-tech-placeholder.svg",
    price: 3999.00,
    description: "Surround-sound headset with detachable noise-cancelling boom mic.",
    stock: 19,
    categories: ["electronics", "accessories"]
  },
  {
    id: 18,
    name: "Smart Light Bulb (4-Pack)",
    slug: "smart-light-bulb-4-pack",
    image_url: "assets/default-tech-placeholder.svg",
    price: 2199.00,
    description: "WiFi bulbs with 16M colors, app and voice control.",
    stock: 26,
    categories: ["electronics"]
  },
  {
    id: 19,
    name: "Tablet 10.1-inch 64GB",
    slug: "tablet-10-1-inch-64gb",
    image_url: "assets/default-tech-placeholder.svg",
    price: 11499.00,
    description: "10.1-inch FHD tablet with octa-core CPU and dual speakers.",
    stock: 11,
    categories: ["electronics"]
  },
  {
    id: 20,
    name: "Power Bank 20,000mAh",
    slug: "power-bank-20000mah",
    image_url: "assets/default-tech-placeholder.svg",
    price: 1899.00,
    description: "Dual-output power bank with USB-C PD fast charging.",
    stock: 33,
    categories: ["electronics", "accessories"]
  },
  {
    id: 21,
    name: "HDMI 2.1 Cable 2m",
    slug: "hdmi-2-1-cable-2m",
    image_url: "assets/default-tech-placeholder.svg",
    price: 749.00,
    description: "8K-ready braided HDMI cable with eARC support.",
    stock: 50,
    categories: ["electronics", "accessories"]
  }
];
