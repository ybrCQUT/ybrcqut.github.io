
const $ = (selector) => document.querySelector(selector);

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
function parsePublication(pub) {
  const raw = normalizeText(pub.text || "");
  const marker = raw.match(/\[(J|C)\]/);
  const typeMark = marker ? marker[1] : (pub.type === "Conference" ? "C" : "J");
  const beforeMarker = marker ? raw.slice(0, marker.index).trim() : raw;
  const afterMarker = marker ? raw.slice(marker.index + marker[0].length).replace(/^\.?\s*/, "").trim() : "";
  const firstPeriod = beforeMarker.indexOf(". ");
  let authors = beforeMarker;
  let title = beforeMarker;
  if (firstPeriod > -1) {
    authors = beforeMarker.slice(0, firstPeriod).trim();
    title = beforeMarker.slice(firstPeriod + 2).trim();
  }
  const venue = afterMarker.replace(/^[,，]\s*/, "");
  const badges = [];
  const ccf = raw.match(/CCF-[ABC]/i);
  const ifText = raw.match(/IF[:：]\s*\d+(?:\.\d+)?/i);
  if (ccf) badges.push(ccf[0].toUpperCase());
  if (ifText) badges.push(ifText[0].replace("：", ":"));
  if (/Best Paper Award/i.test(raw)) badges.push("Best Paper Award");
  return { authors, title, venue, typeMark, badges };
}

function badgeClass(label) {
  const value = String(label || "");
  if (/CCF-[ABC]/i.test(value)) return "chip-red";
  if (/IF\s*:/i.test(value)) return "chip-gold";
  if (/Best Paper/i.test(value)) return "chip-gray";
  return "chip-blue";
}

function detectDoiLink(text) {
  const match = String(text || "").match(/DOI[:：]\s*([^\s（)]+)/i);
  return match ? `https://doi.org/${match[1]}` : "";
}
function linkButton(label, url, extraClass = "") {
  if (url) return `<a class="paper-link ${extraClass}" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  return `<span class="paper-link disabled ${extraClass}" title="Add this link in assets/js/data.js">${label}<small>Coming soon</small></span>`;
}
function matchesPub(pub, keyword, year, type) {
  const parsed = parsePublication(pub);
  const haystack = [pub.text, pub.summary, parsed.title, parsed.authors, parsed.venue, ...(pub.keywords || [])].join(" ").toLowerCase();
  return (!keyword || haystack.includes(keyword)) && (year === "all" || pub.year === year) && (type === "all" || pub.type === type);
}
function renderYearOptions() {
  const select = $("#detailYearFilter"); if (!select) return;
  const years = [...new Set((SITE_DATA.publications || []).map((p) => p.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  years.forEach((year) => { const option = document.createElement("option"); option.value = year; option.textContent = year; select.appendChild(option); });
}
function renderDetailedPublications() {
  const keyword = ($("#detailSearch")?.value || "").trim().toLowerCase();
  const year = $("#detailYearFilter")?.value || "all";
  const type = $("#detailTypeFilter")?.value || "all";
  const pubs = SITE_DATA.publications || [];
  const filtered = pubs.filter((pub) => matchesPub(pub, keyword, year, type));
  $("#detailCount").textContent = `Showing ${filtered.length} of ${pubs.length} publications.`;
  const grouped = filtered.reduce((acc, pub) => { const key = pub.year || "Other"; (acc[key] ||= []).push(pub); return acc; }, {});
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  $("#publicationListDetailed").innerHTML = years.map((yearKey) => `
    <section class="paper-year-group" aria-label="${yearKey} publications">
      <h3>${yearKey}</h3>
      <div class="paper-card-list">${grouped[yearKey].map(renderPaperCard).join("")}</div>
    </section>
  `).join("");
}
function renderPaperCard(pub) {
  const parsed = parsePublication(pub);
  const links = pub.links || {};
  const doi = detectDoiLink(pub.text);
  const keywords = (pub.keywords || []).map((k) => `<span class="keyword-chip chip-gray">${normalizeText(k)}</span>`).join("");
  return `
    <article class="paper-card ${pub.highlight ? "selected" : ""}">
      <div class="paper-number">${pub.id}</div>
      <div class="paper-content">
        <div class="paper-topline">
          <span class="venue-mark chip-blue">${parsed.typeMark === "C" ? "Conference" : "Journal"}</span>
          ${parsed.badges.map((badge) => `<span class="badge ${badgeClass(badge)}">${badge}</span>`).join("")}
          ${pub.highlight ? `<span class="badge selected-badge chip-gold">Selected</span>` : ""}
        </div>
        <h4>${normalizeText(parsed.title)}</h4>
        <p class="paper-authors">${normalizeText(parsed.authors)}</p>
        <p class="paper-venue">${linkify(parsed.venue)}</p>
        <p class="paper-summary">${linkify(pub.summary || "Summary to be updated.")}</p>
        ${keywords ? `<div class="keyword-row">${keywords}</div>` : ""}
        <div class="paper-actions" aria-label="Paper links">
          ${linkButton("HTML", links.html)}
          ${linkButton("PDF", links.pdf || doi)}
          ${linkButton("Code", links.code, "important")}
          ${linkButton("Project", links.project, "important")}
          ${linkButton("Poster", links.poster)}
          ${linkButton("Video", links.video)}
        </div>
      </div>
    </article>`;
}
function initMenu() {
  const button = $(".menu-button"); const links = $("#navLinks"); if (!button || !links) return;
  button.addEventListener("click", () => { const open = links.classList.toggle("open"); button.setAttribute("aria-expanded", String(open)); });
  links.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { links.classList.remove("open"); button.setAttribute("aria-expanded", "false"); }));
}
function boot() {
  renderYearOptions(); renderDetailedPublications();
  $("#detailSearch")?.addEventListener("input", renderDetailedPublications);
  $("#detailYearFilter")?.addEventListener("change", renderDetailedPublications);
  $("#detailTypeFilter")?.addEventListener("change", renderDetailedPublications);
  initMenu();
  const year = $("#yearNow"); if (year) year.textContent = new Date().getFullYear();
}
document.addEventListener("DOMContentLoaded", boot);
