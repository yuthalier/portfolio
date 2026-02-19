const state = {
  media: [],
  activeTags: new Set(),
};

const galleryGrid = document.getElementById("galleryGrid");
const tagFilters = document.getElementById("tagFilters");
const modal = document.getElementById("mediaModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

/**
 * Safely maps a filename to a root-relative URL so media with spaces still loads.
 * @param {string} filename
 * @returns {string}
 */
function rootMediaUrl(filename) {
  return encodeURI(filename);
}

/**
 * Fetch media metadata and initialize page interactions.
 */
async function initPortfolio() {
  try {
    const response = await fetch("media.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load media.json (${response.status})`);
    }

    state.media = await response.json();
    renderTagFilters(state.media);
    renderGallery(state.media);
    setupRevealAnimations();
  } catch (error) {
    galleryGrid.innerHTML = `<p>Unable to load gallery data. ${error.message}</p>`;
  }
}

function uniqueTags(mediaItems) {
  return [...new Set(mediaItems.flatMap((item) => item.tags || []).map((tag) => tag.toLowerCase()))].sort();
}

function renderTagFilters(mediaItems) {
  const tags = uniqueTags(mediaItems);
  const allBtn = buildTagButton("All", true);
  allBtn.addEventListener("click", () => {
    state.activeTags.clear();
    setActiveTagStyles();
    filterGallery();
  });
  tagFilters.appendChild(allBtn);

  tags.forEach((tag) => {
    const button = buildTagButton(tag);
    button.addEventListener("click", () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      setActiveTagStyles();
      filterGallery();
    });
    tagFilters.appendChild(button);
  });
}

function buildTagButton(label, isAll = false) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tag-btn";
  btn.dataset.tag = isAll ? "all" : label.toLowerCase();
  btn.textContent = isAll ? "All" : `#${label}`;
  if (isAll) btn.classList.add("active");
  return btn;
}

function setActiveTagStyles() {
  const buttons = tagFilters.querySelectorAll(".tag-btn");
  buttons.forEach((btn) => {
    const { tag } = btn.dataset;
    if (tag === "all") {
      btn.classList.toggle("active", state.activeTags.size === 0);
    } else {
      btn.classList.toggle("active", state.activeTags.has(tag));
    }
  });
}

function renderGallery(mediaItems) {
  galleryGrid.innerHTML = "";

  mediaItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "media-item";
    card.dataset.tags = (item.tags || []).map((tag) => tag.toLowerCase()).join("|");

    const thumb = createMediaElement(item, true);
    thumb.classList.add("media-thumb");

    const meta = document.createElement("div");
    meta.className = "media-meta";
    meta.innerHTML = `<h3>${item.title}</h3><p>${item.description}</p>`;

    card.append(thumb, meta);
    card.style.animationDelay = `${index * 35}ms`;

    card.addEventListener("click", () => openModal(item));
    galleryGrid.appendChild(card);
  });
}

function createMediaElement(item, preview = false) {
  const src = rootMediaUrl(item.file);
  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    if (preview) {
      video.autoplay = true;
      video.setAttribute("preload", "metadata");
    } else {
      video.controls = true;
      video.autoplay = true;
    }
    return video;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = item.title;
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function filterGallery() {
  const items = galleryGrid.querySelectorAll(".media-item");

  items.forEach((card) => {
    const tags = card.dataset.tags.split("|");
    const isVisible =
      state.activeTags.size === 0 ||
      [...state.activeTags].every((tag) => tags.includes(tag));

    card.classList.toggle("hidden", !isVisible);
    card.setAttribute("aria-hidden", String(!isVisible));
  });
}

function openModal(item) {
  modalContent.innerHTML = "";
  const mediaEl = createMediaElement(item);
  const detailWrap = document.createElement("div");
  detailWrap.className = "modal-details";
  detailWrap.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.description}</p>
    <div class="badges">${(item.tags || []).map((tag) => `<span>#${tag}</span>`).join("")}</div>
  `;

  modalContent.append(mediaEl, detailWrap);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
}

function setupRevealAnimations() {
  const revealables = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealables.forEach((el) => observer.observe(el));
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

initPortfolio();
