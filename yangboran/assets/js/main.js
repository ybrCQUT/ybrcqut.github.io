
const $ = (selector) => document.querySelector(selector);
const EMAIL = (window.SITE_DATA && SITE_DATA.email) || "yangbr@cqut.edu.cn";

function normalizeText(text) {
  return String(text || "")
    .replace(/，/g, ", ")
    .replace(/。/g, ". ")
    .replace(/：/g, ": ")
    .replace(/；/g, "; ")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/【/g, "[")
    .replace(/】/g, "]")
    .replace(/、/g, ", ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .replace(/[—–－]/g, "-")
    .replace(/\s+([,.;:!?\)\]])/g, "$1")
    .replace(/([,;:])\s{2,}/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}
function shortUrlLabel(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const compactPath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.split("/").filter(Boolean).slice(0, 1).join("/") : "";
    return compactPath ? `${host}/${compactPath}` : `${host}`;
  } catch (error) {
    return "Link";
  }
}

function linkify(text) {
  return normalizeText(text).replace(/(https?:\/\/[^\s<>"']+)/g, (match) => {
    let url = match;
    let trailing = "";
    while (/[),.;:!?]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    const label = shortUrlLabel(url);
    return `<a href="${url}" title="${url}" target="_blank" rel="noopener noreferrer">${label}</a>${trailing}`;
  });
}

function publicationMetaClass(label, index) {
  const value = String(label || "");
  if (index === 0) return "meta-chip year";
  if (/journal|conference/i.test(value)) return "meta-chip type";
  if (/selected/i.test(value)) return "meta-chip selected";
  if (/best paper/i.test(value)) return "meta-chip award";
  return "meta-chip misc";
}

function renderParagraphs(target, paragraphs) {
  const el = $(target); if (!el) return;
  el.innerHTML = (paragraphs || []).map((p) => `<p>${linkify(p)}</p>`).join("");
}

function renderNews() {
  const el = $("#newsList"); if (!el) return;
  el.innerHTML = (SITE_DATA.news || []).map((item) => `
    <article class="news-item">
      <div class="news-date">${normalizeText(item.date || "")}</div>
      <div class="news-text">${linkify(item.text || "")}</div>
    </article>
  `).join("");
}

function renderProjects() {
  const el = $("#projects"); if (!el) return;
  el.innerHTML = (SITE_DATA.projects || []).map((project) => `
    <article class="project-item project-minimal">
      <div class="project-meta" aria-label="Project metadata">
        <span class="project-chip year">${project.year || "Project"}</span>
        <span class="project-chip role">${project.role || ""}</span>
        <span class="project-chip status ${project.status === "已结题" ? "done" : "active"}">${project.status || ""}</span>
      </div>
      <p>${linkify(project.text)}</p>
    </article>
  `).join("");
}
function listTypeLabel(type, item) {
  const text = String(item || "");
  if (type === "service") {
    if (/Workshop|Co-Chair/i.test(text)) return "Workshop";
    if (/Special Issue|Guest|特邀编辑/i.test(text)) return "Editor";
    if (/Standards|P3363/i.test(text)) return "Standard";
    if (/TPC|程序委员会/i.test(text)) return "TPC";
    return "Service";
  }
  if (type === "talk") {
    const year = text.match(/20\d{2}/);
    return year ? year[0] : "Talk";
  }
  if (type === "award") {
    const year = text.match(/20\d{2}/);
    return year ? year[0] : "Honor";
  }
  return "Item";
}

function infoChipClass(type, index) {
  const palettes = {
    service: ["chip-blue", "chip-red", "chip-gold", "chip-gray"],
    talk: ["chip-gold", "chip-blue", "chip-red", "chip-gray"],
    award: ["chip-red", "chip-gold", "chip-blue", "chip-gray"],
    default: ["chip-blue", "chip-red", "chip-gold", "chip-gray"]
  };
  return (palettes[type] || palettes.default)[index % 4];
}

function renderList(target, list, type = "default") {
  const el = $(target); if (!el) return;
  el.innerHTML = (list || []).map((item, index) => {
    const number = String(index + 1).padStart(2, "0");
    const label = listTypeLabel(type, item);
    const chipClass = infoChipClass(type, index);
    return `
      <article class="info-card ${type}-card">
        <div class="info-card-head">
          <span class="info-number">${number}</span>
          <span class="info-chip ${chipClass}">${normalizeText(label)}</span>
        </div>
        <p>${linkify(item)}</p>
      </article>
    `;
  }).join("");
}
function initPublicationFilters() {
  const yearFilter = $("#yearFilter");
  const search = $("#pubSearch");
  const typeFilter = $("#typeFilter");
  if (!yearFilter || !search || !typeFilter) return;
  const years = [...new Set((SITE_DATA.publications || []).map((p) => p.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year; option.textContent = year; yearFilter.appendChild(option);
  });
  search.addEventListener("input", renderPublications);
  yearFilter.addEventListener("change", renderPublications);
  typeFilter.addEventListener("change", renderPublications);
  renderPublications();
}
function renderPublications() {
  const keyword = ($("#pubSearch")?.value || "").trim().toLowerCase();
  const year = $("#yearFilter")?.value || "all";
  const type = $("#typeFilter")?.value || "all";
  const pubs = SITE_DATA.publications || [];
  const filtered = pubs.filter((pub) => {
    const matchKeyword = !keyword || [pub.text, pub.summary, ...(pub.keywords || [])].join(" ").toLowerCase().includes(keyword);
    return matchKeyword && (year === "all" || pub.year === year) && (type === "all" || pub.type === type);
  });
  const count = $("#pubCount"); if (count) count.textContent = `Showing ${filtered.length} of ${pubs.length} publications.`;
  const list = $("#publicationsList"); if (!list) return;
  list.innerHTML = filtered.map((pub) => {
    const labels = [
      ...(pub.year ? [pub.year] : []),
      pub.type,
      ...(/Best Paper Award/i.test(pub.text) ? ["Best Paper Award"] : []),
      ...(pub.highlight ? ["Selected"] : [])
    ];
    return `
    <article class="publication-item ${pub.highlight ? "selected" : ""}">
      <div class="pub-index">[${pub.id}]</div>
      <div>
        <p class="pub-text">${linkify(pub.text)}</p>
        <div class="pub-meta">
          ${labels.map((label, index) => `<span class="${publicationMetaClass(label, index)}">${label}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
  }).join("");
}
async function copyEmail() {
  const message = $("#copyMessage");
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(EMAIL);
    else {
      const textarea = document.createElement("textarea");
      textarea.value = EMAIL; textarea.style.position = "fixed"; textarea.style.left = "-9999px";
      document.body.appendChild(textarea); textarea.focus(); textarea.select(); document.execCommand("copy"); textarea.remove();
    }
    if (message) message.textContent = `Email copied: ${EMAIL}`;
    alert(`Email copied: ${EMAIL}`);
  } catch (error) {
    if (message) message.textContent = `Copy failed. Please copy manually: ${EMAIL}`;
    alert(`Please copy manually: ${EMAIL}`);
  }
}
function initEmailCopy() {
  $("#copyEmailTop")?.addEventListener("click", copyEmail);
  $("#copyEmailBottom")?.addEventListener("click", copyEmail);
}
function initMenu() {
  const button = $(".menu-button"); const links = $("#navLinks");
  if (!button || !links) return;
  button.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    links.classList.remove("open"); button.setAttribute("aria-expanded", "false");
  }));
}
function boot() {
  renderParagraphs("#bioEN", SITE_DATA.bioEN);
  renderNews();
  renderProjects();
  renderList("#awardsList", SITE_DATA.awards, "award");
  renderList("#serviceList", SITE_DATA.service, "service");
  renderList("#talkList", SITE_DATA.talks, "talk");
  initPublicationFilters();
  initEmailCopy();
  initMenu();
  const year = $("#yearNow"); if (year) year.textContent = new Date().getFullYear();
}
document.addEventListener("DOMContentLoaded", boot);
