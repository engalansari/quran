const SURAH_NAMES = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس"
];

const BACKGROUND_FILES = {
  makkah: "assets/background-library/processed/pixabay-198048-makkah-haram.mp4",
  madinah: "assets/background-library/processed/pixabay-112360-madinah-nabawi.mp4",
  nature: "assets/production/nature.mp4",
};

const BACKGROUND_POSTERS = {
  makkah: "assets/background-library/posters/pixabay-198048-makkah-haram.jpg",
  madinah: "assets/background-library/posters/pixabay-112360-madinah-nabawi.jpg",
  nature: "assets/bg-nature.svg",
};

const BACKGROUND_IMPORT_HELP = {
  makkah: {
    minimumReadyCount: 6,
    title: "مكتبة مكة تحتاج استيراد فيديوهات مجانية",
    message: "الموجود الآن داخل البرنامج عينة محلية واحدة فقط. أضف مفتاح Pexels أو Pixabay المجاني ثم شغل أداة الاستيراد حتى تمتلئ هذه القائمة بفيديوهات مكة.",
    links: [
      ["Pexels Makkah", "https://www.pexels.com/search/videos/makkah/"],
      ["Pixabay Makkah", "https://pixabay.com/videos/search/makkah/"],
    ],
  },
  madinah: {
    minimumReadyCount: 6,
    title: "مكتبة المدينة تحتاج استيراد فيديوهات مجانية",
    message: "الموجود الآن داخل البرنامج عينة محلية واحدة فقط. أضف مفتاح Pexels أو Pixabay المجاني ثم شغل أداة الاستيراد حتى تمتلئ هذه القائمة بفيديوهات المدينة.",
    links: [
      ["Pexels Madinah", "https://www.pexels.com/search/videos/madinah/"],
      ["Pixabay Madinah", "https://pixabay.com/videos/search/madinah/"],
    ],
  },
};

const FEATURED_BACKGROUNDS = [
  {
    id: "makkah",
    title: "مكة - الحرم المكي",
    category: "makkah",
    localFile: BACKGROUND_FILES.makkah,
    poster: BACKGROUND_POSTERS.makkah,
    provider: "Ayah Studio",
    licenseScope: "free-commercial",
    licenseName: "Project-owned local background",
    licenseUrl: "https://local.ayah-studio/background-policy",
    tags: ["makkah", "mecca", "kaaba", "haram", "mosque", "مكة", "الحرم"],
  },
  {
    id: "madinah",
    title: "المدينة - المسجد النبوي",
    category: "madinah",
    localFile: BACKGROUND_FILES.madinah,
    poster: BACKGROUND_POSTERS.madinah,
    provider: "Ayah Studio",
    licenseScope: "free-commercial",
    licenseName: "Project-owned local background",
    licenseUrl: "https://local.ayah-studio/background-policy",
    tags: ["madinah", "medina", "prophet mosque", "mosque", "المدينة", "المسجد النبوي"],
  },
  {
    id: "nature",
    title: "طبيعة هادئة",
    category: "nature",
    localFile: BACKGROUND_FILES.nature,
    poster: BACKGROUND_POSTERS.nature,
    provider: "Ayah Studio",
    licenseScope: "free-commercial",
    licenseName: "Project-owned local background",
    licenseUrl: "https://local.ayah-studio/background-policy",
    tags: ["nature", "calm", "green", "طبيعة", "هدوء"],
  },
];

const state = {
  quran: null,
  reciters: [],
  backgrounds: [],
  freeReels: [],
  freeReelSearchPages: [],
  suggestedBackgroundIds: new Set(),
  preparingBackgroundIds: new Set(),
  unavailableBackgroundIds: new Set(),
  backgroundFilter: "all",
  visibleBackgroundLimit: 48,
  backgroundBatchSize: 48,
  captionRequestId: 0,
  busy: false,
};

const els = {
  surahSelect: document.getElementById("surahSelect"),
  ayahStart: document.getElementById("ayahStart"),
  ayahCount: document.getElementById("ayahCount"),
  reciterSelect: document.getElementById("reciterSelect"),
  backgroundSelect: document.getElementById("backgroundSelect"),
  backgroundSearch: document.getElementById("backgroundSearch"),
  backgroundCategoryFilters: document.getElementById("backgroundCategoryFilters"),
  backgroundRefresh: document.getElementById("backgroundRefresh"),
  backgroundLoadMore: document.getElementById("backgroundLoadMore"),
  backgroundCount: document.getElementById("backgroundCount"),
  backgroundGrid: document.getElementById("backgroundGrid"),
  freeReelsCount: document.getElementById("freeReelsCount"),
  freeReelsGrid: document.getElementById("freeReelsGrid"),
  suggestBackgrounds: document.getElementById("suggestBackgrounds"),
  suggestionLine: document.getElementById("suggestionLine"),
  rangeSummary: document.getElementById("rangeSummary"),
  referenceLine: document.getElementById("referenceLine"),
  ayahPreview: document.getElementById("ayahPreview"),
  sourceLine: document.getElementById("sourceLine"),
  generateButton: document.getElementById("generateButton"),
  statusBox: document.getElementById("statusBox"),
  videoLink: document.getElementById("videoLink"),
  videoResultPanel: document.getElementById("videoResultPanel"),
  videoResultName: document.getElementById("videoResultName"),
  videoDownloadLink: document.getElementById("videoDownloadLink"),
  copyVideoLink: document.getElementById("copyVideoLink"),
  instagramCaptionPanel: document.getElementById("instagramCaptionPanel"),
  instagramCaptionText: document.getElementById("instagramCaptionText"),
  copyInstagramCaption: document.getElementById("copyInstagramCaption"),
  quickGenerateTitle: document.getElementById("quickGenerateTitle"),
  quickGenerateSummary: document.getElementById("quickGenerateSummary"),
  quickGenerateButton: document.getElementById("quickGenerateButton"),
  quickOpenVideo: document.getElementById("quickOpenVideo"),
  quickDownloadVideo: document.getElementById("quickDownloadVideo"),
  quickShareVideo: document.getElementById("quickShareVideo"),
  quickCopyCaption: document.getElementById("quickCopyCaption"),
  phonePreview: document.querySelector(".phone-preview"),
  backgroundPreview: document.getElementById("backgroundPreview"),
  phoneAyah: document.getElementById("phoneAyah"),
  phoneReference: document.getElementById("phoneReference"),
  phoneReciter: document.getElementById("phoneReciter"),
};

init();

async function init() {
  unregisterLocalServiceWorkers();
  setStatus("جاري تحميل بيانات القرآن والقراء...", "info");
  await Promise.all([loadQuran(), loadReciters(), loadBackgrounds(), loadFreeReels()]);
  bindEvents();
  renderAll();
  setStatus("جاهز للتجربة. اختر الآيات ثم اضغط توليد.", "info");
}

async function loadQuran() {
  const response = await fetch("data/quran-uthmani.json", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل ملف القرآن.");
  state.quran = await response.json();
}

async function loadReciters() {
  const response = await fetch("assets/recitation-catalog.json", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل مكتبة القراء.");
  const catalog = await response.json();
  state.reciters = catalog.reciters || [];
}

async function loadBackgrounds() {
  const response = await fetch("assets/background-library/catalog.json?v=20260704-pexels-makkah-madinah", { cache: "no-store" });
  if (!response.ok) {
    state.backgrounds = uniqueBackgrounds(featuredBackgrounds()).filter(isUsableBackground);
    return;
  }
  const catalog = await response.json();
  const ready = (catalog.items || []).filter((item) => item.licenseScope === "free-commercial");
  state.backgrounds = uniqueBackgrounds(mergeFeaturedBackgrounds(ready.length ? ready : [])).filter(isUsableBackground);
}

async function loadFreeReels() {
  try {
    const response = await fetch("assets/free-reels-catalog.json?v=20260703-free-reels-sources", { cache: "no-store" });
    if (!response.ok) return;
    const catalog = await response.json();
    state.freeReels = (catalog.items || []).filter((item) => item.verifiedFree && item.sourceUrl && item.poster);
    state.freeReelSearchPages = catalog.searchPages || [];
  } catch {
    state.freeReels = [];
    state.freeReelSearchPages = [];
  }
}

function bindEvents() {
  els.surahSelect.addEventListener("change", () => {
    clampAyahInputs();
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.ayahStart.addEventListener("input", () => {
    clampAyahInputs();
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.ayahCount.addEventListener("input", () => {
    clampAyahInputs();
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.reciterSelect.addEventListener("change", renderPhonePreview);
  els.backgroundSelect.addEventListener("change", () => {
    selectBackground(els.backgroundSelect.value);
  });
  els.suggestBackgrounds.addEventListener("click", () => {
    updateBackgroundSuggestions({ selectFirst: true });
    renderAll();
  });
  els.backgroundSearch.addEventListener("input", () => {
    state.visibleBackgroundLimit = state.backgroundBatchSize;
    renderBackgroundCards();
  });
  els.backgroundCategoryFilters.addEventListener("change", () => {
    state.backgroundFilter = els.backgroundCategoryFilters.value || "all";
    state.visibleBackgroundLimit = state.backgroundBatchSize;
    els.backgroundSearch.value = "";
    const firstMatch = filteredRankedBackgrounds()[0];
    if (firstMatch) {
      selectBackground(firstMatch.id, { silent: true });
      return;
    }
    renderBackgroundCards();
  });
  els.backgroundLoadMore.addEventListener("click", () => {
    state.visibleBackgroundLimit += state.backgroundBatchSize;
    renderBackgroundCards();
  });
  els.backgroundRefresh?.addEventListener("click", async () => {
    setStatus("جاري تحديث مكتبة الخلفيات المجانية...", "info");
    try {
      const response = await fetch("/api/refresh-background-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: state.backgroundFilter === "all" || state.backgroundFilter === "suggested" ? "makkah" : state.backgroundFilter,
          wanted: 30,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ready) {
        throw new Error(result.error || "لم يتم تحديث المكتبة.");
      }
      if (result.configured === false) {
        const keys = result.missingApiKeys?.join(" أو ") || "PIXABAY_API_KEY أو PEXELS_API_KEY";
        setStatus(`زيادة المصادر تحتاج مفتاح ${keys}. المكتبة الحالية ستبقى كما هي.`, "error");
      } else {
        setStatus(`تم تحديث المكتبة. تمت إضافة ${result.added} فيديو.`, "ok");
      }
    } catch (error) {
      setStatus(`لم يزد العدد: ${error.message}`, "error");
    }
    await loadBackgrounds();
    renderBackgroundOptions({ force: true });
    renderBackgroundCards();
    renderPhonePreview();
  });
  els.generateButton.addEventListener("click", generateVideo);
  els.quickGenerateButton?.addEventListener("click", () => {
    if (els.generateButton.disabled) return;
    els.generateButton.click();
  });
  els.quickShareVideo?.addEventListener("click", shareGeneratedVideo);
  els.quickCopyCaption?.addEventListener("click", copyInstagramCaption);
  els.copyInstagramCaption?.addEventListener("click", copyInstagramCaption);
  els.copyVideoLink.addEventListener("click", copyGeneratedVideoLink);
  els.backgroundPreview.addEventListener("error", () => {
    setStatus("تعذر تشغيل فيديو الخلفية في المعاينة، لذلك ظهرت صورة احتياطية. التوليد نفسه سيستخدم ملف الخلفية.", "error");
  });
}

function renderAll() {
  renderSurahOptions();
  renderReciterOptions();
  renderBackgroundOptions();
  updateBackgroundSuggestions({ selectFirst: false });
  clampAyahInputs();
  renderAyahPreview();
  renderBackgroundCards();
  renderFreeReels();
  renderPhonePreview();
  updateQuickGenerateBar();
}

function renderSurahOptions() {
  if (els.surahSelect.options.length || !state.quran) return;
  state.quran.surahs.forEach((surah) => {
    const option = document.createElement("option");
    option.value = String(surah.number);
    option.textContent = `${surah.number}. ${surahName(surah.number)} (${surah.ayahs.length})`;
    els.surahSelect.appendChild(option);
  });
}

function renderReciterOptions() {
  if (els.reciterSelect.options.length || !state.reciters.length) return;
  state.reciters.forEach((reciter) => {
    const option = document.createElement("option");
    option.value = reciter.id;
    option.textContent = `${reciter.name} - ${reciter.riwayah}`;
    els.reciterSelect.appendChild(option);
  });
}

function renderBackgroundOptions(options = {}) {
  if (!options.force && (els.backgroundSelect.options.length > 3 || !state.backgrounds.length)) return;
  els.backgroundSelect.replaceChildren();
  rankedBackgrounds().filter(isUsableBackground).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${backgroundCategoryName(item.category)} - ${item.title}`;
    els.backgroundSelect.appendChild(option);
  });
}

function renderBackgroundCards() {
  if (!els.backgroundGrid || !state.backgrounds.length) return;
  const selected = selectedBackground().id;
  const allItems = filteredRankedBackgrounds();
  const visibleLimit = Math.max(state.backgroundBatchSize, state.visibleBackgroundLimit);
  const visibleItems = allItems.slice(0, visibleLimit);
  els.backgroundLoadMore.hidden = visibleItems.length >= allItems.length;
  els.backgroundCount.textContent = backgroundCountLabel(visibleItems.length, allItems.length);
  els.backgroundGrid.replaceChildren(
    ...visibleItems.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = [
        "background-card",
        item.id === selected ? "is-selected" : "",
        state.suggestedBackgroundIds.has(item.id) ? "is-suggested" : "",
      ].filter(Boolean).join(" ");
      button.dataset.backgroundId = item.id;
      button.setAttribute("aria-pressed", item.id === selected ? "true" : "false");
      button.addEventListener("click", () => selectBackground(item.id));

      const image = document.createElement("img");
      image.src = displayPoster(item);
      image.alt = item.title;
      image.loading = "lazy";
      image.addEventListener("error", () => {
        state.unavailableBackgroundIds.add(item.id);
        const replacement = filteredRankedBackgrounds().find((background) => background.id !== item.id);
        if (item.id === selected && replacement) {
          els.backgroundSelect.value = replacement.id;
          renderPhonePreview();
        }
        renderBackgroundOptions({ force: true });
        renderBackgroundCards();
      });

      const title = document.createElement("strong");
      title.textContent = item.title;

      const meta = document.createElement("span");
      meta.textContent = backgroundCategoryName(item.category);

      button.append(image, title, meta);
      if (item.remoteOnly && !item.localFileReady) {
        const remoteBadge = document.createElement("em");
        remoteBadge.className = "remote-badge";
        remoteBadge.textContent = state.preparingBackgroundIds.has(item.id) ? "جاري التجهيز" : "ينزل عند الاختيار";
        button.append(remoteBadge);
      }
      if (state.suggestedBackgroundIds.has(item.id)) {
        const badge = document.createElement("em");
        badge.className = "suggestion-badge";
        badge.textContent = "مقترح";
        button.append(badge);
      }
      return button;
    })
  );
  const notice = renderBackgroundImportNotice(allItems.length);
  if (notice) els.backgroundGrid.append(notice);
}

function filteredRankedBackgrounds() {
  const query = normalizeArabic(els.backgroundSearch.value || "");
  let items = rankedBackgrounds().filter(isUsableBackground);
  if (state.backgroundFilter === "suggested") {
    items = items.filter((item) => state.suggestedBackgroundIds.has(item.id));
  } else if (state.backgroundFilter !== "all") {
    items = items.filter((item) => item.category === state.backgroundFilter);
  }
  if (!query) return items;
  return items.filter((item) =>
    normalizeArabic(`${item.title || ""} ${item.category || ""} ${item.tags || ""} ${item.provider || ""}`).includes(query)
  );
}

function renderBackgroundImportNotice(currentCount) {
  return null;
  const help = BACKGROUND_IMPORT_HELP[state.backgroundFilter];
  if (!help || currentCount >= help.minimumReadyCount) return null;

  const article = document.createElement("article");
  article.className = "background-import-notice";

  const title = document.createElement("strong");
  title.textContent = help.title;

  const message = document.createElement("p");
  message.textContent = help.message;

  const links = document.createElement("div");
  links.className = "background-import-links";
  help.links.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  });

  article.append(title, message, links);
  return article;
}

function backgroundCountLabel(visibleCount, totalCount) {
  const category = state.backgroundFilter === "all" ? "كل الخلفيات" : backgroundCategoryName(state.backgroundFilter);
  return `يعرض ${visibleCount} من ${totalCount} - ${category}`;
}

function renderFreeReels() {
  if (!els.freeReelsGrid || !els.freeReelsCount) return;

  const filter = state.backgroundFilter;
  const categoryItems = state.freeReels.filter((item) => filter === "all" || filter === "suggested" || item.category === filter);
  const items = categoryItems.length ? categoryItems : state.freeReels;
  els.freeReelsCount.textContent = `مصادر مجانية مؤكدة: ${items.length}`;

  const cards = items.map((item) => {
    const card = document.createElement("article");
    card.className = "free-reel-card";

    const image = document.createElement("img");
    image.src = item.poster;
    image.alt = item.title;
    image.loading = "lazy";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("span");
    meta.textContent = `${item.provider} - ${backgroundCategoryName(item.category)} - ${item.quality || "HD"} - ${item.duration || ""}`;

    const actions = document.createElement("div");
    actions.className = "free-reel-actions";

    const source = document.createElement("a");
    source.href = item.sourceUrl;
    source.target = "_blank";
    source.rel = "noreferrer";
    source.textContent = "فتح الفيديو";

    const license = document.createElement("a");
    license.href = item.licenseUrl;
    license.target = "_blank";
    license.rel = "noreferrer";
    license.textContent = "الرخصة";

    actions.append(source, license);
    card.append(image, title, meta, actions);
    return card;
  });

  if (state.freeReelSearchPages.length) {
    const sourceList = document.createElement("article");
    sourceList.className = "free-reel-source-list";
    const title = document.createElement("strong");
    title.textContent = "صفحات بحث مجانية إضافية";
    const links = document.createElement("div");
    links.className = "free-reel-actions";
    state.freeReelSearchPages.forEach((page) => {
      const link = document.createElement("a");
      link.href = page.sourceUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = page.title;
      links.append(link);
    });
    sourceList.append(title, links);
    cards.push(sourceList);
  }

  els.freeReelsGrid.replaceChildren(...cards);
}

function clampAyahInputs() {
  const surah = selectedSurah();
  if (!surah) return;
  const maxAyah = surah.ayahs.length;
  const start = clampNumber(els.ayahStart.value, 1, maxAyah);
  const count = clampNumber(els.ayahCount.value, 1, Math.min(20, maxAyah - start + 1));
  els.ayahStart.max = String(maxAyah);
  els.ayahCount.max = String(Math.min(20, maxAyah - start + 1));
  els.ayahStart.value = String(start);
  els.ayahCount.value = String(count);
  updateRangeSummary();
}

function updateRangeSummary() {
  const surah = selectedSurah();
  if (!surah || !els.rangeSummary) return;
  const start = Number(els.ayahStart.value || 1);
  const count = Number(els.ayahCount.value || 1);
  const end = start + count - 1;
  els.rangeSummary.textContent = `سيتم توليد ${surahName(surah.number)} من الآية ${start}${end > start ? ` إلى ${end}` : ""} - عدد الآيات: ${count}`;
}

function renderAyahPreview() {
  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  if (!surah || !ayahs.length) {
    els.referenceLine.textContent = "لم يتم اختيار آيات صالحة.";
    els.ayahPreview.textContent = "";
    return;
  }

  const start = Number(els.ayahStart.value);
  const end = start + ayahs.length - 1;
  els.referenceLine.textContent = `${surahName(surah.number)} من الآية ${start}${end > start ? ` إلى ${end}` : ""}`;
  els.ayahPreview.replaceChildren(
    ...ayahs.map((ayah) => {
      const row = document.createElement("div");
      row.className = "ayah-row";
      row.textContent = `${ayah.text} ﴿${ayah.number}﴾`;
      return row;
    })
  );

  const source = state.quran?.source;
  els.sourceLine.textContent = source
    ? `المصدر: ${source.name} - ${source.edition || "رسم عثماني"}`
    : "";
}

function updateBackgroundSuggestions({ selectFirst }) {
  const scored = scoreBackgroundsForAyahs();
  const suggested = scored.filter((item) => item.score > 0).slice(0, 3);
  state.suggestedBackgroundIds = new Set(suggested.map((item) => item.background.id));

  if (suggested.length) {
    els.suggestionLine.textContent = `الأقرب للمعنى الآن: ${suggested.map((item) => item.background.title).join("، ")}`;
    if (selectFirst) selectBackground(suggested[0].background.id, { silent: true });
    return;
  }

  els.suggestionLine.textContent = "لم أجد معنى واضحا يكفي للاقتراح، لذلك اختر الخلفية يدويا من الصور.";
}

function renderPhonePreview() {
  const ayahs = selectedAyahs();
  const surah = selectedSurah();
  const reciter = selectedReciter();
  const background = selectedBackground();
  els.phonePreview.style.backgroundImage = `url("${displayPoster(background)}")`;
  els.phonePreview.style.backgroundSize = "cover";
  els.phonePreview.style.backgroundPosition = "center";

  const previewSource = previewVideoSource(background);
  els.backgroundPreview.poster = displayPoster(background);
  if (!previewSource) {
    els.backgroundPreview.pause();
    els.backgroundPreview.removeAttribute("src");
    els.backgroundPreview.load();
  } else if (els.backgroundPreview.getAttribute("src") !== previewSource) {
    els.backgroundPreview.src = previewSource;
    els.backgroundPreview.load();
    ensurePreviewVideoPlays();
  }

  els.phoneAyah.textContent = ayahs.map((ayah) => `${ayah.text} ﴿${ayah.number}﴾`).join(" ");
  els.phoneReference.textContent = surah ? formatReferenceLabel(surah, ayahs) : "";
  els.phoneReciter.textContent = reciter?.name?.split(" - ")[0] || "";
  updateQuickGenerateBar();
}

function updateQuickGenerateBar() {
  if (!els.quickGenerateTitle || !els.quickGenerateSummary || !els.quickGenerateButton) return;

  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  const reciter = selectedReciter();
  const background = selectedBackground();
  const ready = Boolean(surah && ayahs.length && reciter);
  const needsBackgroundPrep = Boolean(background?.remoteOnly && !background.localFileReady);

  if (state.busy) {
    els.quickGenerateTitle.textContent = "جاري التوليد";
    els.quickGenerateButton.textContent = "جاري التوليد...";
  } else if (!ready) {
    els.quickGenerateTitle.textContent = "أكمل الاختيارات";
    els.quickGenerateButton.textContent = "أكمل الاختيارات";
  } else if (needsBackgroundPrep) {
    els.quickGenerateTitle.textContent = "الخلفية تحتاج تجهيز";
    els.quickGenerateButton.textContent = "تجهيز ثم توليد";
  } else {
    els.quickGenerateTitle.textContent = "جاهز للتوليد";
    els.quickGenerateButton.textContent = "توليد الفيديو";
  }

  const reference = surah && ayahs.length ? formatReferenceLabel(surah, ayahs) : "اختر الآيات";
  const reciterName = reciter?.name?.split(" - ")[0] || "اختر القارئ";
  const backgroundName = background?.category ? backgroundCategoryName(background.category) : "اختر الخلفية";
  els.quickGenerateSummary.textContent = `${reference} | ${reciterName} | ${backgroundName}`;
  els.quickGenerateButton.disabled = state.busy || !ready;
}

function formatReferenceLabel(surah, ayahs) {
  if (!surah || !ayahs.length) return "";
  const first = ayahs[0].number;
  const last = ayahs[ayahs.length - 1].number;
  return `${surahName(surah.number)} ${formatAyahRange(first, last)}`;
}

function formatAyahRange(first, last) {
  return first === last ? String(first) : `\u200e${last}-${first}\u200e`;
}

function ensurePreviewVideoPlays() {
  els.backgroundPreview.muted = true;
  els.backgroundPreview.playsInline = true;
  const attempt = () => els.backgroundPreview.play().catch(() => {});
  attempt();
  window.setTimeout(attempt, 300);
  window.setTimeout(attempt, 1200);
}

async function generateVideo() {
  if (state.busy) return;
  const surah = selectedSurah();
  const reciter = selectedReciter();
  if (!surah || !reciter) {
    setStatus("اختر السورة والقارئ أولا.", "error");
    return;
  }
  let background = selectedBackground();
  if (background?.remoteOnly && !background.localFileReady) {
    setStatus("الخلفية المختارة تحتاج تجهيز قبل التوليد. جاري التجهيز الآن...", "info");
    await prepareBackgroundForPreview(background);
    background = selectedBackground();
    if (background?.remoteOnly && !background.localFileReady) {
      setStatus("الخلفية لم تجهز بعد. اختر خلفية أخرى ظاهرة بصورة حقيقية أو حاول تجهيزها مرة أخرى.", "error");
      return;
    }
  }

  state.busy = true;
  els.generateButton.disabled = true;
  els.videoLink.hidden = true;
  hideVideoResult();
  setStatus("جاري تنزيل الصوت وتوليد الفيديو. قد يستغرق ذلك قليلا لأول مرة...", "info");

  try {
    const payload = {
      surah: surah.number,
      ayahStart: Number(els.ayahStart.value),
      ayahCount: Number(els.ayahCount.value),
      reciter: reciter.id,
      background: background.id,
    };
    const response = await fetch("/api/compose-selected-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ready) {
      throw new Error(result.error || "فشل توليد الفيديو.");
    }
    setStatus("تم توليد الفيديو بنجاح.", "ok");
    showVideoResult(result);
  } catch (error) {
    setStatus(`لم ينجح التوليد: ${error.message}`, "error");
  } finally {
    state.busy = false;
    els.generateButton.disabled = false;
    updateQuickGenerateBar();
  }
}

function showVideoResult(result) {
  const href = result.outUrl || result.out || "";
  const fileName = href.split("/").filter(Boolean).pop() || "ayah-studio-video.mp4";
  els.videoLink.href = href;
  els.videoLink.hidden = false;
  els.videoDownloadLink.href = href;
  els.videoDownloadLink.download = fileName;
  els.videoResultName.textContent = `الملف جاهز: ${fileName}`;
  els.videoResultPanel.hidden = false;
  showInstagramCaption();
  showQuickVideoActions(href, fileName);
}

function hideVideoResult() {
  els.videoResultPanel.hidden = true;
  els.videoResultName.textContent = "";
  els.videoDownloadLink.href = "#";
  els.videoDownloadLink.removeAttribute("download");
  hideInstagramCaption();
  hideQuickVideoActions();
}

function showQuickVideoActions(href, fileName) {
  if (!href) return;
  if (els.quickOpenVideo) {
    els.quickOpenVideo.href = href;
    els.quickOpenVideo.hidden = false;
  }
  if (els.quickDownloadVideo) {
    els.quickDownloadVideo.href = href;
    els.quickDownloadVideo.download = fileName || "ayah-studio-video.mp4";
    els.quickDownloadVideo.hidden = false;
  }
  if (els.quickShareVideo) {
    els.quickShareVideo.hidden = false;
  }
  if (els.quickCopyCaption) {
    els.quickCopyCaption.hidden = false;
  }
}

function hideQuickVideoActions() {
  if (els.quickOpenVideo) {
    els.quickOpenVideo.href = "#";
    els.quickOpenVideo.hidden = true;
  }
  if (els.quickDownloadVideo) {
    els.quickDownloadVideo.href = "#";
    els.quickDownloadVideo.removeAttribute("download");
    els.quickDownloadVideo.hidden = true;
  }
  if (els.quickShareVideo) {
    els.quickShareVideo.hidden = true;
  }
  if (els.quickCopyCaption) {
    els.quickCopyCaption.hidden = true;
  }
}

async function shareGeneratedVideo() {
  const href = els.videoLink.href;
  if (!href || href.endsWith("#")) {
    setStatus("ولّد الفيديو أولا، ثم استخدم إرسال.", "error");
    return;
  }

  const fileName = href.split("/").filter(Boolean).pop() || "ayah-studio-video.mp4";
  try {
    if (navigator.canShare && navigator.share && window.File) {
      const response = await fetch(href, { cache: "no-store" });
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || "video/mp4" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Ayah Studio",
          text: await buildInstagramCaptionAsync(),
        });
        setStatus("تم فتح المشاركة. اختر Instagram إذا كان متاحا في الهاتف.", "ok");
        return;
      }
    }

    if (navigator.share) {
      await navigator.share({
        title: "Ayah Studio",
        text: await buildInstagramCaptionAsync(),
        url: href,
      });
      setStatus("تم فتح المشاركة. اختر Instagram إذا كان متاحا في الهاتف.", "ok");
      return;
    }

    await navigator.clipboard.writeText(href);
    setStatus("المشاركة غير متاحة في هذا المتصفح؛ تم نسخ رابط الفيديو.", "ok");
  } catch (error) {
    if (error?.name === "AbortError") return;
    setStatus("لم أستطع فتح المشاركة. حمّل الفيديو ثم ارفعه من تطبيق Instagram.", "error");
  }
}

function showInstagramCaption() {
  if (!els.instagramCaptionPanel || !els.instagramCaptionText) return;
  els.instagramCaptionPanel.hidden = false;
  renderInstagramCaption();
}

function hideInstagramCaption() {
  if (!els.instagramCaptionPanel || !els.instagramCaptionText) return;
  els.instagramCaptionPanel.hidden = true;
  els.instagramCaptionText.value = "";
}

async function copyInstagramCaption() {
  const caption = await buildInstagramCaptionAsync();
  if (els.instagramCaptionText) els.instagramCaptionText.value = caption;
  if (!caption) return;
  try {
    await navigator.clipboard.writeText(caption);
    setStatus("تم نسخ وصف إنستغرام والهاشتاقات.", "ok");
  } catch {
    setStatus("لم أستطع نسخ الوصف تلقائيا. حدده من مربع الوصف وانسخه يدويا.", "error");
  }
}

function buildInstagramCaption() {
  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  const reciter = selectedReciter();
  const reciterName = cleanReciterName(reciter);
  const content = buildInstagramFallbackTafsirText(ayahs);
  const lines = [
    `القارئ/ ${reciterName}`,
    `السورة/ ${surah ? surahName(surah.number) : "آيات من القرآن الكريم"}`,
    formatInstagramAyahLine(ayahs),
    content,
    "",
    buildInstagramHashtags(surah, reciter).join(" "),
  ];
  return lines.join("\n").trim();
}

async function renderInstagramCaption() {
  if (!els.instagramCaptionText) return;
  const requestId = state.captionRequestId + 1;
  state.captionRequestId = requestId;
  els.instagramCaptionText.value = buildInstagramLoadingCaption();
  const caption = await buildInstagramCaptionAsync();
  if (state.captionRequestId === requestId) {
    els.instagramCaptionText.value = caption;
  }
}

function buildInstagramLoadingCaption() {
  const ayahs = selectedAyahs();
  if (ayahs.length) return buildInstagramCaptionWithContent("تفسير السعدي: جاري جلب تفسير الآيات المختارة...");
  return buildInstagramCaption();
}

async function buildInstagramCaptionAsync() {
  const ayahs = selectedAyahs();
  if (!ayahs.length) return buildInstagramCaption();
  const tafsir = await fetchSaadiTafsirForAyahs(ayahs);
  return buildInstagramCaptionWithContent(tafsir || buildInstagramFallbackTafsirText(ayahs));
}

function buildInstagramCaptionWithContent(content) {
  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  const reciter = selectedReciter();
  const reciterName = cleanReciterName(reciter);
  const lines = [
    `القارئ/ ${reciterName}`,
    `السورة/ ${surah ? surahName(surah.number) : "آيات من القرآن الكريم"}`,
    formatInstagramAyahLine(ayahs),
    content,
    "",
    buildInstagramHashtags(surah, reciter).join(" "),
  ];
  return lines.join("\n").trim();
}

async function fetchSaadiTafsirForAyahs(ayahs) {
  const items = [];
  for (const ayah of ayahs) {
    const tafsir = await fetchSaadiTafsirForAyah(ayah);
    if (tafsir) items.push(tafsir);
  }
  if (!items.length) return "";
  return ["تفسير السعدي:", ...items].join("\n");
}

async function fetchSaadiTafsirForAyah(ayah) {
  const surah = selectedSurah();
  if (!surah || !ayah?.number) return "";
  try {
    const verseKey = `${surah.number}:${ayah.number}`;
    const response = await fetch(`/api/saadi-tafsir?verse_key=${encodeURIComponent(verseKey)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ready || !result.tafsir?.text) return "";
    return `آية ${ayah.number}: ${result.tafsir.text}`;
  } catch {
    return "";
  }
}

function buildInstagramFallbackTafsirText(ayahs) {
  if (!ayahs.length) return "تفسير السعدي: غير محدد";
  if (ayahs.length === 1) return "تفسير السعدي: تعذر جلب تفسير الآية الآن.";
  return "تفسير السعدي: تعذر جلب تفسير الآيات المختارة الآن.";
}

function formatInstagramAyahLine(ayahs) {
  if (!ayahs.length) return "الآيات/ غير محددة";
  const first = ayahs[0].number;
  const last = ayahs[ayahs.length - 1].number;
  if (first === last) return `آية/ ${first}`;
  return `الآيات/ ${first} - ${last}`;
}

function buildInstagramHashtags(surah, reciter) {
  const tags = ["#قرآن", "#تلاوة"];
  if (surah) tags.push(`#سورة_${normalizeHashtagPart(surahName(surah.number))}`);
  const reciterTag = normalizeHashtagPart(cleanReciterName(reciter));
  if (reciterTag) tags.push(`#${reciterTag}`);
  tags.push("#Quran");
  return uniqueValues(tags).slice(0, 5);
}

function cleanReciterName(reciter) {
  return String(reciter?.name || "قارئ القرآن").split(" - ")[0].trim();
}

function normalizeHashtagPart(value) {
  return String(value || "")
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s_]/g, "")
    .replace(/\s+/g, "_");
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

async function copyGeneratedVideoLink() {
  const href = els.videoLink.href;
  if (!href || href.endsWith("#")) return;
  try {
    await navigator.clipboard.writeText(href);
    setStatus("تم نسخ رابط الفيديو.", "ok");
  } catch {
    setStatus("لم أستطع نسخ الرابط تلقائيا. افتح الفيديو ثم انسخ الرابط من المتصفح.", "error");
  }
}

function selectedSurah() {
  const number = Number(els.surahSelect.value || 1);
  return state.quran?.surahs?.find((surah) => surah.number === number);
}

function selectedAyahs() {
  const surah = selectedSurah();
  if (!surah) return [];
  const start = Number(els.ayahStart.value || 1);
  const count = Number(els.ayahCount.value || 1);
  return surah.ayahs.filter((ayah) => ayah.number >= start && ayah.number < start + count);
}

function selectedReciter() {
  const id = els.reciterSelect.value;
  return state.reciters.find((reciter) => reciter.id === id) || state.reciters[0];
}

function selectedBackground() {
  const id = els.backgroundSelect.value;
  return state.backgrounds.find((item) => item.id === id) || state.backgrounds[0] || fallbackBackgrounds()[0];
}

function displayPoster(item) {
  if (!item) return BACKGROUND_POSTERS.nature;
  const poster = String(item.poster || "");
  if (isFallbackPoster(poster)) return "";
  if (item.localPoster && !item.remoteOnly && !isFallbackPoster(item.localPoster)) return item.localPoster;
  if (poster.startsWith("http")) return poster;
  if (item.localPoster && !isFallbackPoster(item.localPoster)) return item.localPoster;
  if (poster && !isFallbackPoster(poster) && !poster.includes("assets/background-library/posters/mixkit-")) return poster;
  return fallbackPosterForCategory(item.category);
}

function isUsableBackground(item) {
  if (!item || state.unavailableBackgroundIds.has(item.id)) return false;
  if (item.hiddenDuplicate) return false;
  if (!hasRealPoster(item)) return false;
  if (!isQuranAppropriateBackground(item)) return false;
  if (item.remoteOnly && !hasRealPoster(item)) return false;
  return true;
}

function hasRealPoster(item) {
  const poster = String(item?.poster || "");
  const localPoster = String(item?.localPoster || "");
  if (isFallbackPoster(poster)) return false;
  if (poster.startsWith("http")) return true;
  if (localPoster && !item.remoteOnly && !isFallbackPoster(localPoster)) return true;
  if (localPoster && !isFallbackPoster(localPoster)) return true;
  if (poster && !isFallbackPoster(poster) && !poster.includes("assets/background-library/posters/mixkit-")) return true;
  return false;
}

function isFallbackPoster(path) {
  const value = String(path || "");
  return value.startsWith("assets/bg-") || value === "assets/background-library/posters/mixkit-placeholder.jpg";
}

function isQuranAppropriateBackground(item) {
  const category = String(item?.category || "");
  const text = normalizeArabic(`${item?.title || ""} ${item?.tags || ""}`);
  const blockedWords = [
    "people",
    "person",
    "woman",
    "man",
    "girl",
    "boy",
    "couple",
    "party",
    "concert",
    "dance",
    "drink",
    "toasting",
    "beer",
    "wine",
    "campfire",
    "car",
    "cars",
    "traffic",
    "highway",
    "road",
    "bridge",
    "yacht",
    "city",
    "building",
    "office",
    "street",
  ];
  if (blockedWords.some((word) => text.includes(word))) return false;
  if (category !== "nature") return true;

  const calmNatureWords = [
    "meadow",
    "creek",
    "forest",
    "flower",
    "flowers",
    "sunflower",
    "tree",
    "trees",
    "mountain",
    "mountains",
    "hill",
    "hills",
    "waterfall",
    "rain",
    "cloud",
    "clouds",
    "leaf",
    "leaves",
    "green",
    "valley",
    "river",
    "lake",
    "landscape",
    "field",
    "garden",
    "bush",
  ];
  return calmNatureWords.some((word) => text.includes(word));
}

function fallbackPosterForCategory(category) {
  if (category === "makkah" || category === "mosque") return BACKGROUND_POSTERS.makkah;
  if (category === "madinah") return BACKGROUND_POSTERS.madinah;
  if (category === "sky" || category === "sea") return "assets/bg-calm.svg";
  return BACKGROUND_POSTERS.nature;
}

function previewVideoSource(item) {
  if (!item) return BACKGROUND_FILES.nature;
  if (item.localFile && !item.remoteOnly) return item.localFile;
  if (item.remoteOnly) return "";
  if (item.category === "makkah" || item.category === "mosque") return BACKGROUND_FILES.makkah;
  if (item.category === "madinah") return BACKGROUND_FILES.madinah;
  return BACKGROUND_FILES.nature;
}

function selectBackground(id, options = {}) {
  const item = state.backgrounds.find((background) => background.id === id);
  if (!item) return;
  els.backgroundSelect.value = item.id;
  if (!options.silent) {
    const suffix = item.remoteOnly ? " - سيتم تجهيزها عند الاختيار، ولن يبدأ التوليد قبل جاهزيتها." : "";
    els.suggestionLine.textContent = `تم اختيار الخلفية: ${item.title}${suffix}`;
  }
  renderBackgroundCards();
  renderPhonePreview();
  prepareBackgroundForPreview(item);
}

async function prepareBackgroundForPreview(item) {
  if (!item?.remoteOnly || !item.downloadUrl || state.preparingBackgroundIds.has(item.id)) return;
  state.preparingBackgroundIds.add(item.id);
  renderBackgroundCards();
  setStatus(`جاري تجهيز الخلفية: ${item.title}`, "info");

  try {
    const response = await fetch("/api/prepare-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background: item.id }),
    });
    const result = await response.json();
    if (!response.ok || !result.ready) {
      throw new Error(result.error || "تعذر تجهيز الخلفية.");
    }
    applyPreparedBackground(result.item);
    setStatus("تم تجهيز الخلفية للمعاينة والتوليد.", "ok");
    renderBackgroundCards();
    renderPhonePreview();
  } catch (error) {
    state.unavailableBackgroundIds.add(item.id);
    setStatus(`لم يتم تجهيز الخلفية: ${error.message}`, "error");
    const replacement = filteredRankedBackgrounds().find((background) => background.id !== item.id);
    if (replacement) {
      els.backgroundSelect.value = replacement.id;
      renderPhonePreview();
    }
  } finally {
    state.preparingBackgroundIds.delete(item.id);
    renderBackgroundCards();
  }
}

function applyPreparedBackground(prepared) {
  if (!prepared?.id) return;
  state.backgrounds = state.backgrounds.map((item) => {
    if (item.id !== prepared.id) return item;
    return {
      ...item,
      ...prepared,
      remoteOnly: false,
      localFileReady: true,
    };
  });
  const selected = state.backgrounds.find((item) => item.id === prepared.id);
  if (selected) els.backgroundSelect.value = selected.id;
}

function rankedBackgrounds() {
  const scores = new Map(scoreBackgroundsForAyahs().map((item) => [item.background.id, item.score]));
  return [...state.backgrounds].sort((a, b) => {
    const suggestedDiff = Number(state.suggestedBackgroundIds.has(b.id)) - Number(state.suggestedBackgroundIds.has(a.id));
    if (suggestedDiff) return suggestedDiff;
    const scoreDiff = (scores.get(b.id) || 0) - (scores.get(a.id) || 0);
    if (scoreDiff) return scoreDiff;
    return backgroundCategoryPriority(a.category) - backgroundCategoryPriority(b.category);
  });
}

function backgroundCategoryPriority(category) {
  return {
    makkah: 0,
    madinah: 1,
    mosque: 2,
    sky: 3,
    nature: 4,
    sea: 5,
  }[category] ?? 6;
}

function scoreBackgroundsForAyahs() {
  const text = normalizeArabic(selectedAyahs().map((ayah) => ayah.text).join(" "));
  return state.backgrounds
    .map((background) => ({
      background,
      score: scoreBackground(background, text),
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreBackground(background, text) {
  const category = background.category || "";
  const title = normalizeArabic(background.title || "");
  const haystack = `${category} ${title}`;
  let score = 0;

  if (containsAny(text, ["مسجد", "صلاه", "صلوه", "ركع", "سجد", "قبله", "بيت", "حرام"])) {
    if (category === "mosque") score += 9;
    if (["makkah", "madinah"].includes(category)) score += 10;
  }
  if (containsAny(text, ["ماء", "ما", "بحر", "موج", "انهار", "نهر", "يمطر", "مطر"])) {
    if (["sea", "nature"].includes(category)) score += 8;
    if (haystack.includes("water") || haystack.includes("waves") || haystack.includes("creek") || haystack.includes("waterfall")) score += 4;
  }
  if (containsAny(text, ["سماء", "سماوات", "سحاب", "شمس", "قمر", "ليل", "نهار", "نجوم", "نور"])) {
    if (category === "sky") score += 8;
    if (["sea", "nature"].includes(category)) score += 2;
  }
  if (containsAny(text, ["ارض", "جبال", "جبل", "شجر", "نبات", "جنات", "زروع", "ثمر", "انهار"])) {
    if (category === "nature") score += 8;
    if (category === "sea") score += 2;
  }
  if (containsAny(text, ["رحمن", "رحيم", "سلام", "سكينه", "اطمئن", "هدي", "نور"])) {
    if (["sky", "nature", "sea"].includes(category)) score += 3;
  }
  return score;
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

function normalizeArabic(value) {
  return String(value || "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0625\u0623\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .toLowerCase();
}

function surahName(number) {
  return SURAH_NAMES[number - 1] || `سورة ${number}`;
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
}

function setStatus(message, level) {
  els.statusBox.textContent = message;
  els.statusBox.className = `status-box ${level === "ok" ? "ok" : level === "error" ? "error" : ""}`;
  updateQuickGenerateBar();
}

function fallbackBackgrounds() {
  return featuredBackgrounds();
}

function featuredBackgrounds() {
  return FEATURED_BACKGROUNDS.map((item) => ({ ...item, isFeatured: true }));
}

function mergeFeaturedBackgrounds(backgrounds) {
  const byId = new Map();
  backgrounds.forEach((item) => {
    byId.set(item.id, item);
  });
  featuredBackgrounds().forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item);
  });
  return [...byId.values()];
}

function uniqueBackgrounds(backgrounds) {
  const seen = new Set();
  return backgrounds.filter((item) => {
    const key = backgroundIdentityKey(item);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function backgroundIdentityKey(item) {
  return String(item?.localFile || item?.localSource || item?.sourceUrl || item?.downloadUrl || "").toLowerCase();
}

function legacyFallbackBackgrounds() {
  return [
    {
      id: "makkah",
      title: "الحرم المكي",
      category: "mosque",
      localFile: BACKGROUND_FILES.makkah,
      poster: BACKGROUND_POSTERS.makkah,
      licenseScope: "local-prototype",
    },
    {
      id: "madinah",
      title: "المسجد النبوي",
      category: "mosque",
      localFile: BACKGROUND_FILES.madinah,
      poster: BACKGROUND_POSTERS.madinah,
      licenseScope: "local-prototype",
    },
    {
      id: "nature",
      title: "طبيعة هادئة",
      category: "nature",
      localFile: BACKGROUND_FILES.nature,
      poster: BACKGROUND_POSTERS.nature,
      licenseScope: "local-prototype",
    },
  ];
}

function backgroundCategoryName(category) {
  return {
    makkah: "مكة",
    madinah: "المدينة",
    mosque: "مسجد",
    nature: "طبيعة",
    sea: "بحر",
    sky: "سماء",
  }[category] || "خلفية";
}

function unregisterLocalServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

