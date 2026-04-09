import { TYPE_LIBRARY, NORMAL_TYPES, RESULT_TYPE_CODES } from "./data.js";
import { getTypeHref, getTypeImage, getTypeSlug } from "./type-media.js";

const typesGrid = document.getElementById("typesGrid");
const typeDetailList = document.getElementById("type-detail-list");

const normalSet = new Set(NORMAL_TYPES.map((type) => type.code));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTypeMode(code) {
  if (code === "DRUNK") {
    return "隐藏人格";
  }

  if (code === "HHHH") {
    return "系统兜底人格";
  }

  if (normalSet.has(code)) {
    return "标准人格";
  }

  return "特殊人格";
}

function getTypeEntries() {
  return RESULT_TYPE_CODES.map((code) => TYPE_LIBRARY[code]).filter(Boolean);
}

function renderGrid(entries) {
  typesGrid.innerHTML = entries
    .map((type) => {
      const slug = getTypeSlug(type.code);

      return `
        <a class="type-card" href="#${slug}">
          <div class="type-card-image">
            <img src="${escapeHtml(getTypeImage(type.code))}" alt="${escapeHtml(type.code)} 人格配图" width="96" height="96" loading="lazy">
          </div>
          <div>
            <span class="type-card-code">${escapeHtml(type.code)}</span>
            <span class="type-card-name">${escapeHtml(type.cn)}</span>
            <p class="type-card-intro">${escapeHtml(type.intro)}</p>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderDetails(entries) {
  typeDetailList.innerHTML = entries
    .map((type) => {
      const slug = getTypeSlug(type.code);
      const mode = getTypeMode(type.code);
      const resultHref = getTypeHref(type.code);

      return `
        <article class="type-detail-card card" id="${slug}">
          <div class="type-detail-grid">
            <figure class="type-detail-visual">
              <img src="${escapeHtml(getTypeImage(type.code))}" alt="${escapeHtml(type.code)}（${escapeHtml(type.cn)}）人格配图" width="320" height="320" loading="lazy">
            </figure>
            <div>
              <div class="type-header">
                <div>
                  <h2 class="type-title">${escapeHtml(type.code)}（${escapeHtml(type.cn)}）</h2>
                  <div class="type-tags">
                    <span class="type-tag">${escapeHtml(mode)}</span>
                    <a class="type-tag" href="/#quiz">去测这个结果</a>
                    <a class="type-tag" href="${escapeHtml(resultHref)}">类型锚点</a>
                  </div>
                </div>
              </div>
              <p class="type-intro">${escapeHtml(type.intro)}</p>
              <p class="type-desc">${escapeHtml(type.desc)}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function injectStructuredData(entries) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SBTI 27种人格类型一览",
    numberOfItems: entries.length,
    itemListElement: entries.map((type, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://sbti.how${getTypeHref(type.code)}`,
      name: `${type.code}（${type.cn}）`
    }))
  });
  document.head.append(script);
}

function syncHashScroll() {
  if (!location.hash) {
    return;
  }

  const target = document.getElementById(location.hash.slice(1));
  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function renderPage() {
  const entries = getTypeEntries();

  renderGrid(entries);
  renderDetails(entries);
  injectStructuredData(entries);
  syncHashScroll();
}

window.addEventListener("hashchange", syncHashScroll);

renderPage();
