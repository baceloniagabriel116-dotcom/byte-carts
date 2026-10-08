class SiteSettingsManager {
  constructor() {
    this.cacheKey = "site-settings-cache";
    this.teamKey = "team-members-cache";
    this.defaults = {
      brand_name: "ByteCart",
      announcement_text: "Welcome to Byte Cart",
      announcement_media_url: "",
      announcement_media_type: "",
      copyright_text: "© 2026 ByteCart. All rights reserved.",
      social_links: [
        { label: "Facebook", url: "https://facebook.com" },
        { label: "X", url: "https://x.com" },
        { label: "Instagram", url: "https://instagram.com" }
      ]
    };
    document.addEventListener("DOMContentLoaded", async () => {
      this.renderFooter();
      this.renderAnnouncement();
      await this.loadSettings();
      this.renderFooter();
      this.renderAnnouncement();
    });
  }

  getCachedSettings() {
    try { return JSON.parse(localStorage.getItem(this.cacheKey)) || null; } catch { return null; }
  }

  getSettings() {
    return { ...this.defaults, ...(this.getCachedSettings() || {}) };
  }

  async loadSettings() {
    let data;
    try { data = await database.fetchAPI('get_site_settings'); }
    catch (error) { console.warn("site_settings load failed:", error.message); return this.getSettings(); }
    const settings = { ...this.defaults };
    (data || []).forEach(row => {
      if (row.key === "social_links") {
        try { settings.social_links = JSON.parse(row.value); } catch { }
      } else {
        settings[row.key] = row.value;
      }
    });
    localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    return settings;
  }

  async saveSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    try {
      return await database.fetchAPI('save_site_setting', { method: 'POST', body: { key, value } });
    } catch (error) { return { success: false, error: error.message }; }
  }

  async saveSettings(patch) {
    const results = [];
    for (const [key, value] of Object.entries(patch)) results.push(await this.saveSetting(key, value));
    return results.every(r => r.success) ? { success: true } : { success: false, error: results.find(r => r.error)?.error };
  }

  getCachedTeam() {
    try { return JSON.parse(localStorage.getItem(this.teamKey)) || []; } catch { return []; }
  }

  async loadTeam() {
    let data;
    try { data = await database.fetchAPI('get_team_members'); }
    catch (error) { console.warn("team_members load failed:", error.message); return this.getCachedTeam(); }
    const team = data || [];
    localStorage.setItem(this.teamKey, JSON.stringify(team));
    return team;
  }

  async saveTeamMember(member) {
    try { return await database.fetchAPI('save_team_member', { method: 'POST', body: member }); }
    catch (error) { return { success: false, error: error.message }; }
  }

  async deleteTeamMember(id) {
    try { return await database.fetchAPI('delete_team_member', { method: 'POST', body: { id } }); }
    catch (error) { return { success: false, error: error.message }; }
  }

  renderFooter() {
    const settings = this.getSettings();
    document.querySelectorAll(".footer-bottom p").forEach(element => {
      element.textContent = settings.copyright_text;
    });

    document.querySelectorAll('.footer a[href="#"]').forEach(link => {
      const label = link.textContent.trim().toLowerCase();
      if (label.includes("shop")) link.href = "products.html";
      else if (label.includes("about")) link.href = "about.html";
      else if (label.includes("contact")) link.href = "about.html#contact";
      else if (label.includes("faq")) link.href = "faq.html";
      else if (label.includes("help")) link.href = "faq.html";
      else if (label.includes("return")) link.href = "faq.html#returns";
      else if (label.includes("shipping")) link.href = "faq.html#shipping";
    });

    const copyrightEl = document.getElementById("footerCopyright");
    if (copyrightEl) copyrightEl.textContent = settings.copyright_text;
    const socialEl = document.getElementById("footerSocial");
    if (socialEl) this.renderSocialLinks(socialEl, settings.social_links);
  }

  renderSocialLinks(container, socialLinks) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const icons = {
      facebook: [["path", { d: "M13.5 21v-8h2.75l.4-3h-3.15V8.08c0-.87.24-1.46 1.5-1.46h1.78V3.94c-.31-.04-1.37-.14-2.6-.14-2.57 0-4.33 1.57-4.33 4.45V10H7v3h2.85v8h3.65Z" }]],
      x: [["path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" }]],
      instagram: [["path", { d: "M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" }]],
      youtube: [["path", { d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" }]],
      linkedin: [["path", { d: "M5.2 3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.2 0h3.6v1.6h.1a4 4 0 0 1 3.6-2c3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.5V9Z" }]],
      tiktok: [["path", { d: "M19.6 7.1a6.7 6.7 0 0 1-4.1-1.4v8.1a6.2 6.2 0 1 1-5.4-6.1v3.2a3.1 3.1 0 1 0 2.2 3V2h3.2a6.7 6.7 0 0 0 4.1 4.1v1Z" }]],
      pinterest: [["path", { d: "M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.9.2-2.8l1.3-5.5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.4.7 1.4 1.5 0 .9-.6 2.2-.9 3.5-.3 1 .5 1.9 1.5 1.9 1.8 0 3.2-1.9 3.2-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.9.8 2.4.1.1.1.3.1.4l-.3 1.1c0 .2-.2.3-.4.2-1.3-.6-2.1-2.3-2.1-3.8 0-3.1 2.3-6 6.6-6 3.5 0 6.2 2.5 6.2 5.8 0 3.5-2.2 6.4-5.3 6.4-1 0-2-.6-2.4-1.2l-.6 2.3c-.2.9-.8 2-1.2 2.7A10 10 0 1 0 12 2Z" }]]
    };
    const aliases = {
      facebook: "facebook",
      x: "x",
      twitter: "x",
      instagram: "instagram",
      youtube: "youtube",
      linkedin: "linkedin",
      tiktok: "tiktok",
      pinterest: "pinterest"
    };
    const links = Array.isArray(socialLinks) ? socialLinks : [];
    const fragment = document.createDocumentFragment();

    links.forEach(item => {
      if (!item || typeof item !== "object") return;
      const label = String(item.label ?? "").trim();
      if (!label) return;

      const platform = aliases[label.toLowerCase().replace(/[^a-z0-9]/g, "")];
      const itemElement = document.createElement("span");
      itemElement.className = "footer-social-item";
      const rawUrl = String(item.url ?? "").trim();
      let safeUrl = "";
      if (rawUrl) {
        try {
          const parsedUrl = new URL(rawUrl, document.baseURI);
          if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") safeUrl = parsedUrl.href;
        } catch { }
      }

      const link = safeUrl ? document.createElement("a") : document.createElement("span");
      link.className = "footer-social-link";
      link.setAttribute("aria-label", label);
      if (safeUrl) {
        link.href = safeUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      if (platform) {
        const icon = document.createElementNS(svgNamespace, "svg");
        icon.setAttribute("class", "social-icon");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("aria-hidden", "true");
        icon.setAttribute("focusable", "false");
        icons[platform].forEach(([tagName, attributes]) => {
          const shape = document.createElementNS(svgNamespace, tagName);
          Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, value));
          icon.appendChild(shape);
        });
        link.appendChild(icon);
      }
      link.appendChild(document.createTextNode(label));
      itemElement.appendChild(link);
      fragment.appendChild(itemElement);
    });

    container.replaceChildren(fragment);
  }

  renderAnnouncement() {
    const announcement = document.getElementById("heroAnnouncement");
    const subtitle = document.getElementById("heroSubtitle");
    const settings = this.getSettings();
    const text = settings.announcement_text;
    if (announcement && text) announcement.textContent = text;
    if (subtitle && text) subtitle.textContent = "Latest store announcement";


    const hero = document.querySelector(".hero");
    if (!hero) return;
    const existingBg = document.getElementById("heroMediaBackground");
    if (existingBg) existingBg.remove();
    const existingShade = document.getElementById("heroMediaShade");
    if (existingShade) existingShade.remove();
    hero.style.background = "";

    const mediaUrl = settings.announcement_media_url;
    if (!mediaUrl) return;

    const isVideo = settings.announcement_media_type === "video" || /\.(mp4|webm)(\?|$)/i.test(mediaUrl);
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (isVideo && !prefersReducedMotion) {
      const video = document.createElement("video");
      video.id = "heroMediaBackground";
      video.src = mediaUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.tabIndex = -1;
      video.setAttribute("aria-hidden", "true");
      video.setAttribute("disablepictureinpicture", "");
      video.style.cssText = "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none;";
      hero.style.position = "relative";
      hero.style.overflow = "hidden";
      hero.insertBefore(video, hero.firstChild);
      const restoreFallback = () => {
        video.remove();
        hero.style.background = "";
      };
      video.addEventListener("error", restoreFallback, { once: true });
      try {
        video.play().catch(restoreFallback);
      } catch {
        restoreFallback();
      }
    } else if (!isVideo) {
      hero.style.position = "relative";
      hero.style.overflow = "hidden";
      hero.style.background = `url('${mediaUrl}') center / cover no-repeat`;
    }

    let shade = document.getElementById("heroMediaShade");
    if (!shade) {
      shade = document.createElement("div");
      shade.id = "heroMediaShade";
      shade.style.cssText = "position:absolute; inset:0; z-index:1; pointer-events:none; background:rgba(2,6,23,0.62);";
      hero.insertBefore(shade, hero.firstChild);
    }
    const heroContent = hero.querySelector(".hero-content");
    if (heroContent) heroContent.style.position = "relative", heroContent.style.zIndex = "2";
  }

  async renderTeam(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const team = await this.loadTeam();
    if (!team.length) {
      container.innerHTML = '<p style="color:#6b7280; text-align:center;">Our team section is coming soon.</p>';
      return;
    }
    container.innerHTML = team.map(member => `
      <div class="team-card">
        <img class="team-photo" src="${member.image_url || 'assets/default-tech-placeholder.svg'}" alt="Portrait of ${member.name}">
        <h3>${member.name}</h3>
        <p class="team-role">${member.role}</p>
        <p class="team-bio">${member.bio}</p>
      </div>
    `).join("");
  }
}

const siteSettings = new SiteSettingsManager();
