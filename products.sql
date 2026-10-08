-- Run this in the Supabase SQL Editor to add the ByteCart catalog products.
-- Re-running it will not duplicate existing products with the same slug.

insert into public.products (name, slug, image_url, price_php, description, stock, categories)
values
  ('Wireless Noise-Cancelling Headphones', 'wireless-noise-cancelling-headphones', 'assets/default-tech-placeholder.svg', 11399.00, 'Premium wireless headphones with active noise cancellation.', 15, '["electronics"]'::jsonb),
  ('Smart Watch Series 5', 'smart-watch-series-5', 'assets/default-tech-placeholder.svg', 28499.00, 'Advanced smartwatch with health monitoring and GPS.', 8, '["electronics", "wearables"]'::jsonb),
  ('Mechanical Gaming Keyboard', 'mechanical-gaming-keyboard', 'assets/default-tech-placeholder.svg', 19949.00, 'RGB mechanical keyboard with programmable macros.', 22, '["electronics", "accessories"]'::jsonb),
  ('27-inch 4K IPS Monitor', '27-inch-4k-ips-monitor', 'assets/default-tech-placeholder.svg', 24999.00, 'Ultra-sharp 4K display with 99% sRGB color coverage.', 10, '["electronics", "accessories"]'::jsonb),
  ('Bluetooth Gaming Mouse', 'bluetooth-gaming-mouse', 'assets/default-tech-placeholder.svg', 249.00, 'Lightweight wireless mouse with 16,000 DPI sensor.', 35, '["electronics", "accessories"]'::jsonb),
  ('USB-C Fast Charger 65W', 'usb-c-fast-charger-65w', 'assets/default-tech-placeholder.svg', 1799.00, 'GaN charger with dual USB-C ports for laptops and phones.', 40, '["electronics", "accessories"]'::jsonb),
  ('Noise-Cancelling Earbuds', 'noise-cancelling-earbuds', 'assets/default-tech-placeholder.svg', 6499.00, 'True wireless earbuds with transparency mode and IPX5 rating.', 25, '["electronics"]'::jsonb),
  ('Portable SSD 1TB', 'portable-ssd-1tb', 'assets/default-tech-placeholder.svg', 789.00, 'USB 3.2 external SSD with 1,050 MB/s transfer speeds.', 18, '["electronics", "accessories"]'::jsonb),
  ('Laptop Cooling Pad', 'laptop-cooling-pad', 'assets/default-tech-placeholder.svg', 1299.00, 'Five-fan cooling pad with adjustable height and RGB lighting.', 30, '["accessories"]'::jsonb),
  ('Webcam 1080p Pro', 'webcam-1080p-pro', 'assets/default-tech-placeholder.svg', 349.00, 'Full HD webcam with auto-focus and built-in noise-reducing mic.', 20, '["electronics", "accessories"]'::jsonb),
  ('Ergonomic Office Chair', 'ergonomic-office-chair', 'assets/default-tech-placeholder.svg', 12999.00, 'Mesh-back chair with lumbar support and adjustable armrests.', 7, '["accessories"]'::jsonb),
  ('Standing Desk Converter', 'standing-desk-converter', 'assets/default-tech-placeholder.svg', 9499.00, 'Height-adjustable desk riser that fits dual monitors.', 9, '["accessories"]'::jsonb),
  ('Fitness Tracker Band', 'fitness-tracker-band', 'assets/default-tech-placeholder.svg', 289.00, 'Slim band with heart-rate monitor, sleep tracking and 14-day battery.', 28, '["electronics", "wearables"]'::jsonb),
  ('Wireless Charging Pad', 'wireless-charging-pad', 'assets/default-tech-placeholder.svg', 1099.00, '15W Qi fast charging pad with anti-slip silicone surface.', 45, '["electronics", "accessories"]'::jsonb),
  ('External HDD 2TB', 'external-hdd-2tb', 'assets/default-tech-placeholder.svg', 569.00, 'Portable 2.5-inch hard drive with shock-resistant casing.', 16, '["electronics", "accessories"]'::jsonb),
  ('Streaming Microphone', 'streaming-microphone', 'assets/default-tech-placeholder.svg', 5299.00, 'USB condenser mic with cardioid pickup and zero-latency monitoring.', 14, '["electronics"]'::jsonb),
  ('Gaming Headset with Mic', 'gaming-headset-with-mic', 'assets/default-tech-placeholder.svg', 3999.00, 'Surround-sound headset with detachable noise-cancelling boom mic.', 19, '["electronics", "accessories"]'::jsonb),
  ('Smart Light Bulb (4-Pack)', 'smart-light-bulb-4-pack', 'assets/default-tech-placeholder.svg', 2199.00, 'WiFi bulbs with 16M colors, app and voice control.', 26, '["electronics"]'::jsonb),
  ('Tablet 10.1-inch 64GB', 'tablet-10-1-inch-64gb', 'assets/default-tech-placeholder.svg', 11499.00, '10.1-inch FHD tablet with octa-core CPU and dual speakers.', 11, '["electronics"]'::jsonb),
  ('Power Bank 20,000mAh', 'power-bank-20000mah', 'assets/default-tech-placeholder.svg', 1899.00, 'Dual-output power bank with USB-C PD fast charging.', 33, '["electronics", "accessories"]'::jsonb),
  ('HDMI 2.1 Cable 2m', 'hdmi-2-1-cable-2m', 'assets/default-tech-placeholder.svg', 749.00, '8K-ready braided HDMI cable with eARC support.', 50, '["electronics", "accessories"]'::jsonb)
on conflict (slug) do nothing;
