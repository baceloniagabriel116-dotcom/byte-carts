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
      else if (label.includes("facebook")) link.href = "https://facebook.com";
      else if (label === "x") link.href = "https://x.com";
      else if (label.includes("instagram")) link.href = "https://instagram.com";
    });

    const copyrightEl = document.getElementById("footerCopyright");
    if (copyrightEl) copyrightEl.textContent = settings.copyright_text;
    const socialEl = document.getElementById("footerSocial");
    if (socialEl) {
      socialEl.innerHTML = (settings.social_links || []).map(link =>
        `<a href="${link.url}" target="_blank" rel="noopener" aria-label="${link.label}">${link.label}</a>`
      ).join("");
    }
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
    const mediaUrl = settings.announcement_media_url;
    if (!mediaUrl) {
      hero.style.background = "";
      return;
    }
    const isVideo = settings.announcement_media_type === "video" || /\.(mp4|webm)(\?|$)/i.test(mediaUrl);
    if (isVideo) {
      const video = document.createElement("video");
      video.id = "heroMediaBackground";
      video.src = mediaUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.style.cssText = "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none;";
      hero.style.position = "relative";
      hero.style.overflow = "hidden";
      hero.insertBefore(video, hero.firstChild);
    } else {
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
