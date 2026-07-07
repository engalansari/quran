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
  lastVideoReady: false,
  busy: false,
};

const els = {
  surahSelect: document.getElementById("surahSelect"),
  ayahStart: document.getElementById("ayahStart"),
  ayahStartMinus: document.getElementById("ayahStartMinus"),
  ayahStartPlus: document.getElementById("ayahStartPlus"),
  surahAyahTotal: document.getElementById("surahAyahTotal"),
  selectedAyahStartLabel: document.getElementById("selectedAyahStartLabel"),
  ayahCount: document.getElementById("ayahCount"),
  ayahCountMinus: document.getElementById("ayahCountMinus"),
  ayahCountPlus: document.getElementById("ayahCountPlus"),
  maxAyahCountLabel: document.getElementById("maxAyahCountLabel"),
  selectedAyahCountLabel: document.getElementById("selectedAyahCountLabel"),
  reciterSelect: document.getElementById("reciterSelect"),
  audioMode: document.getElementById("audioMode"),
  externalAudioPanel: document.getElementById("externalAudioPanel"),
  externalAudioFile: document.getElementById("externalAudioFile"),
  externalReciterName: document.getElementById("externalReciterName"),
  externalUseAyahs: document.getElementById("externalUseAyahs"),
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
  renderJobPanel: document.getElementById("renderJobPanel"),
  renderJobTitle: document.getElementById("renderJobTitle"),
  renderJobBadge: document.getElementById("renderJobBadge"),
  renderJobProgress: document.getElementById("renderJobProgress"),
  renderJobDetail: document.getElementById("renderJobDetail"),
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
  phoneRiwayah: document.getElementById("phoneRiwayah"),
};

init();

function privateAccessToken() {
  const url = new URL(window.location.href);
  const tokenFromUrl = String(url.searchParams.get("token") || "").trim();
  if (tokenFromUrl) {
    window.localStorage.setItem("ayahPrivateToken", tokenFromUrl);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
    return tokenFromUrl;
  }
  return String(window.localStorage.getItem("ayahPrivateToken") || "").trim();
}

async function apiFetch(url, options = {}) {
  const requestOptions = withPrivateToken(options);
  let response = await fetch(url, requestOptions);
  if (response.status !== 401) return response;

  window.localStorage.removeItem("ayahPrivateToken");
  const token = window.prompt("Private access code");
  if (!token) return response;
  window.localStorage.setItem("ayahPrivateToken", token.trim());
  response = await fetch(url, withPrivateToken(options));
  return response;
}

function withPrivateToken(options = {}) {
  const token = privateAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("x-ayah-private-token", token);
  return { ...options, headers };
}

async function init() {
  unregisterLocalServiceWorkers();
  setStatus("جاري تحميل بيانات القرآن والقراء...", "info");
  await Promise.all([loadQuran(), loadReciters(), loadBackgrounds(), loadFreeReels()]);
  bindEvents();
  renderAll();
  setStatus("جاهز للتجربة. اختر الآيات ثم اضغط إنشاء.", "info");
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
  const response = await fetch("assets/background-library/catalog.json?v=20260706-background-ready-v2", { cache: "no-store" });
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
  els.ayahStartMinus?.addEventListener("click", () => {
    setAyahStartByStep(-1);
  });
  els.ayahStartPlus?.addEventListener("click", () => {
    setAyahStartByStep(1);
  });
  els.ayahCountMinus?.addEventListener("click", () => {
    setAyahCountByStep(-1);
  });
  els.ayahCountPlus?.addEventListener("click", () => {
    setAyahCountByStep(1);
  });
  bindNumericStepperInput(els.ayahStart);
  bindNumericStepperInput(els.ayahCount);
  els.ayahStart.addEventListener("input", () => {
    sanitizeNumericInput(els.ayahStart);
    clampAyahInputs({ commit: false });
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.ayahStart.addEventListener("change", () => {
    clampAyahInputs();
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.ayahCount.addEventListener("input", () => {
    sanitizeNumericInput(els.ayahCount);
    clampAyahInputs({ commit: false });
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.ayahCount.addEventListener("change", () => {
    clampAyahInputs();
    updateBackgroundSuggestions({ selectFirst: false });
    renderAll();
  });
  els.reciterSelect.addEventListener("change", () => {
    renderAyahPreview();
    renderPhonePreview();
  });
  els.audioMode?.addEventListener("change", () => {
    updateAudioModeUi();
    renderPhonePreview();
    updateQuickGenerateBar();
  });
  els.externalAudioFile?.addEventListener("change", () => {
    renderPhonePreview();
    updateQuickGenerateBar();
  });
  els.externalReciterName?.addEventListener("input", renderPhonePreview);
  els.externalUseAyahs?.addEventListener("change", renderPhonePreview);
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
      const response = await apiFetch("/api/refresh-background-library", {
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
    setStatus("تعذر تشغيل فيديو الخلفية في المعاينة، لذلك ظهرت صورة احتياطية. الإنشاء نفسه سيستخدم ملف الخلفية.", "error");
  });
}

function bindNumericStepperInput(input) {
  if (!input) return;
  input.addEventListener("focus", () => {
    input.dataset.replaceNextDigit = "1";
    window.setTimeout(() => input.select(), 0);
  });
  input.addEventListener("click", () => {
    input.dataset.replaceNextDigit = "1";
    input.select();
  });
  input.addEventListener("beforeinput", (event) => {
    const incoming = normalizeNumericInput(event.data || "");
    if (event.inputType !== "insertText" || !incoming) return;

    const selectedAll = input.selectionStart === 0 && input.selectionEnd === input.value.length;
    if (input.dataset.replaceNextDigit === "1" || selectedAll) {
      event.preventDefault();
      input.value = incoming.slice(-1);
      input.dataset.replaceNextDigit = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  input.addEventListener("keydown", (event) => {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)) {
      input.dataset.replaceNextDigit = "";
      return;
    }
    if (event.key === "Enter") {
      input.blur();
    }
  });
  input.addEventListener("blur", () => {
    input.dataset.replaceNextDigit = "";
  });
}

function sanitizeNumericInput(input) {
  if (!input) return;
  const cleaned = normalizeNumericInput(input.value);
  if (input.value !== cleaned) input.value = cleaned;
  if (cleaned) input.dataset.replaceNextDigit = "";
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
  updateAudioModeUi();
  updateQuickGenerateBar();
}

function updateAudioModeUi() {
  const external = isExternalAudioMode();
  if (els.externalAudioPanel) els.externalAudioPanel.hidden = !external;
  if (els.reciterSelect) els.reciterSelect.disabled = external;
  if (els.suggestBackgrounds) els.suggestBackgrounds.disabled = external && !useExternalAyahMetadata();
}

function isExternalAudioMode() {
  return els.audioMode?.value === "external";
}

function useExternalAyahMetadata() {
  return Boolean(els.externalUseAyahs?.checked);
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
  groupedRecitersByRiwayah(state.reciters).forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.riwayah;
    group.reciters.forEach((reciter) => {
      const option = document.createElement("option");
      option.value = reciter.id;
      option.textContent = reciter.name;
      optgroup.appendChild(option);
    });
    els.reciterSelect.appendChild(optgroup);
  });
}

function groupedRecitersByRiwayah(reciters) {
  const groups = new Map();
  reciters.forEach((reciter) => {
    const riwayah = reciter.riwayah || "رواية غير محددة";
    if (!groups.has(riwayah)) groups.set(riwayah, []);
    groups.get(riwayah).push(reciter);
  });

  return [...groups.entries()]
    .map(([riwayah, items]) => ({
      riwayah,
      reciters: items,
      priority: riwayah.includes("حفص") ? 0 : riwayah.includes("ورش") ? 1 : 2,
    }))
    .sort((a, b) => a.priority - b.priority || a.riwayah.localeCompare(b.riwayah, "ar"));
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
        remoteBadge.textContent = state.preparingBackgroundIds.has(item.id) ? "جاري التجهيز" : "تنزل عند الاختيار";
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

function clampAyahInputs(options = {}) {
  const surah = selectedSurah();
  if (!surah) return;
  const commit = options.commit !== false;
  const maxAyah = surah.ayahs.length;
  const start = clampNumber(els.ayahStart.value || "1", 1, maxAyah);
  const maxCount = maxAyahCountForSelection(surah, start);
  const count = clampNumber(els.ayahCount.value || "1", 1, maxCount);
  els.ayahStart.max = String(maxAyah);
  els.ayahCount.max = String(maxCount);
  if (commit) {
    els.ayahStart.value = String(start);
    els.ayahCount.value = String(count);
  }
  syncAyahStartControls(start, maxAyah);
  syncAyahCountControls(count, maxCount);
  updateRangeSummary();
}

function setAyahStartByStep(step) {
  const surah = selectedSurah();
  if (!surah) return;
  const maxAyah = surah.ayahs.length;
  const next = clampNumber(readAyahStart() + step, 1, maxAyah);
  els.ayahStart.value = String(next);
  clampAyahInputs();
  updateBackgroundSuggestions({ selectFirst: false });
  renderAll();
}

function syncAyahStartControls(start, maxAyah) {
  if (els.surahAyahTotal) els.surahAyahTotal.textContent = String(maxAyah);
  if (els.selectedAyahStartLabel) els.selectedAyahStartLabel.textContent = String(start);
  if (els.ayahStartMinus) els.ayahStartMinus.disabled = start <= 1;
  if (els.ayahStartPlus) els.ayahStartPlus.disabled = start >= maxAyah;
}

function setAyahCountByStep(step) {
  const surah = selectedSurah();
  if (!surah) return;
  const maxCount = maxAyahCountForSelection(surah, readAyahStart());
  const next = clampNumber(readAyahCount() + step, 1, maxCount);
  els.ayahCount.value = String(next);
  clampAyahInputs();
  updateBackgroundSuggestions({ selectFirst: false });
  renderAll();
}

function syncAyahCountControls(count, maxCount) {
  if (els.maxAyahCountLabel) els.maxAyahCountLabel.textContent = String(maxCount);
  if (els.selectedAyahCountLabel) els.selectedAyahCountLabel.textContent = String(count);
  if (els.ayahCountMinus) els.ayahCountMinus.disabled = count <= 1;
  if (els.ayahCountPlus) els.ayahCountPlus.disabled = count >= maxCount;
}

function maxAyahCountForSelection(surah, start) {
  const maxAyah = surah?.ayahs?.length || 286;
  return Math.min(20, maxAyah - start + 1, surah ? recommendedAyahLimit(surah, start) : 20);
}

function updateRangeSummary() {
  const surah = selectedSurah();
  if (!surah || !els.rangeSummary) return;
  const start = readAyahStart();
  const count = readAyahCount();
  const end = start + count - 1;
  const profile = ayahTextProfile(selectedAyahs());
  const warning = ayahLengthWarning(profile);
  els.rangeSummary.classList.toggle("warning", Boolean(warning));
  els.rangeSummary.textContent = `سيتم إنشاء ${surahName(surah.number)} من الآية ${start}${end > start ? ` إلى ${end}` : ""} - عدد الآيات: ${count}${warning ? ` - ${warning}` : ""}`;
}

function renderAyahPreview() {
  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  if (!surah || !ayahs.length) {
    els.referenceLine.textContent = "لم يتم اختيار آيات صالحة.";
    els.ayahPreview.textContent = "";
    return;
  }

  const start = readAyahStart();
  const end = start + ayahs.length - 1;
  const profile = ayahTextProfile(ayahs);
  els.referenceLine.textContent = `${surahName(surah.number)} من الآية ${start}${end > start ? ` إلى ${end}` : ""}`;
  els.ayahPreview.classList.toggle("is-long", profile.severity === "long");
  els.ayahPreview.classList.toggle("is-very-long", profile.severity === "very-long");
  els.ayahPreview.replaceChildren(
    ...ayahs.map((ayah) => {
      const row = document.createElement("div");
      row.className = "ayah-row";
      row.textContent = `${ayah.text} ﴿${ayah.number}﴾`;
      return row;
    })
  );

  const source = state.quran?.source;
  const reciter = selectedReciter();
  const riwayah = String(reciter?.riwayah || "");
  const riwayahNote = riwayah && !riwayah.includes("حفص")
    ? ` - تنبيه: الصوت برواية ${riwayah}، والنص المعروض من مصدر المصحف الحالي.`
    : "";
  els.sourceLine.textContent = source
    ? `المصدر: ${source.name} - ${source.edition || "رسم عثماني"}${riwayahNote}`
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
  const ayahs = isExternalAudioMode() && !useExternalAyahMetadata() ? [] : selectedAyahs();
  const surah = isExternalAudioMode() && !useExternalAyahMetadata() ? null : selectedSurah();
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

  const profile = applyPhoneAyahFit(ayahs);
  els.phoneAyah.textContent = ayahs.length ? ayahs.map((ayah) => `${ayah.text} ﴿${ayah.number}﴾`).join(" ") : "تلاوة قرآنية";
  els.phoneAyah.title = ayahLengthWarning(profile) || "";
  els.phoneReciter.textContent = phoneReciterLabel(reciter);
  els.phoneReference.textContent = surah ? formatReferenceLabel(surah, ayahs) : "";
  els.phoneRiwayah.textContent = phoneRiwayahLabel(reciter);
  updateQuickGenerateBar();
}

function updateQuickGenerateBar() {
  if (!els.quickGenerateTitle || !els.quickGenerateSummary || !els.quickGenerateButton) return;

  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  const reciter = selectedReciter();
  const background = selectedBackground();
  const external = isExternalAudioMode();
  const externalSource = Boolean(els.externalAudioFile?.files?.[0]);
  const ready = external ? externalSource : Boolean(surah && ayahs.length && reciter);

  if (state.busy) {
    els.quickGenerateTitle.textContent = "جاري الإنشاء";
    setFancyButtonText(els.quickGenerateButton, "جاري الإنشاء...");
  } else if (state.lastVideoReady) {
    els.quickGenerateTitle.textContent = "الفيديو جاهز";
    setFancyButtonText(els.quickGenerateButton, "إنشاء نسخة جديدة");
  } else if (external && !externalSource) {
    els.quickGenerateTitle.textContent = "ارفع ملف صوت أو فيديو";
    setFancyButtonText(els.quickGenerateButton, "اختر الملف أولا");
  } else if (!ready) {
    els.quickGenerateTitle.textContent = "أكمل الاختيارات";
    setFancyButtonText(els.quickGenerateButton, "أكمل الاختيارات");
  } else {
    els.quickGenerateTitle.textContent = "جاهز للإنشاء";
    setFancyButtonText(els.quickGenerateButton, "إنشاء الفيديو");
  }

  const reference = external && !useExternalAyahMetadata() ? "صوت خارجي" : surah && ayahs.length ? formatReferenceLabel(surah, ayahs) : "اختر الآيات";
  const reciterName = external ? externalReciterName() || "قارئ اختياري" : reciter?.name?.split(" - ")[0] || "اختر القارئ";
  const backgroundName = background?.category ? backgroundCategoryName(background.category) : "اختر الخلفية";
  els.quickGenerateSummary.textContent = `${reference} | ${reciterName} | ${backgroundName}`;
  els.quickGenerateButton.disabled = state.busy || !ready;
}

function setFancyButtonText(button, label) {
  if (!button) return;
  const text = String(label || "").trim();
  button.dataset.actionText = text;
  button.setAttribute("aria-label", text);
  const primaryText = button.querySelector(".txt:first-child");
  if (primaryText) {
    primaryText.textContent = text;
  } else {
    button.textContent = text;
  }
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

function phoneReciterLabel(reciter) {
  if (isExternalAudioMode()) return externalReciterName() || "قارئ القرآن";
  return cleanReciterName(reciter);
}

function phoneRiwayahLabel(reciter) {
  if (isExternalAudioMode()) return "صوت خارجي";
  return String(reciter?.riwayah || "حفص عن عاصم").trim();
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
  if (isExternalAudioMode()) {
    await generateExternalAudioVideo();
    return;
  }
  const surah = selectedSurah();
  const reciter = selectedReciter();
  if (!surah || !reciter) {
    setStatus("اختر السورة والقارئ أولا.", "error");
    return;
  }
  let background = selectedBackground();
  if (background?.remoteOnly && !background.localFileReady) {
    setStatus("الخلفية المختارة تحتاج تجهيز قبل الإنشاء. جاري التجهيز الآن...", "info");
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
  showRenderJobStatus({ status: "pending" }, "تم إرسال الطلب. يبدأ الإنشاء الآن.");
  setStatus("تم إنشاء طلب الإنشاء. جاري المعالجة...", "info");

  try {
    const payload = {
      surah: surah.number,
      ayahStart: readAyahStart(),
      ayahCount: readAyahCount(),
      reciter: reciter.id,
      background: background.id,
    };
    const response = await apiFetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ready) {
      throw new Error(formatGenerationFailure(result));
    }
    showRenderJobStatus(result, "تم إنشاء رقم الطلب. نتابع حالة المعالجة.");
    const job = await waitForRenderJob(result);
    if (job.status !== "completed" || !job.videoUrl) {
      showRenderJobStatus(job, job.error || "تعذر اكتمال طلب الإنشاء.");
      throw new Error(job.error || "فشل طلب الإنشاء.");
    }
    showRenderJobStatus(job, "اكتمل الطلب وأصبح الفيديو جاهزا.");
    setStatus("تم إنشاء الفيديو بنجاح.", "ok");
    showVideoResult({
      ...result,
      outUrl: job.videoUrl,
      jobId: job.jobId,
      status: job.status,
    });
  } catch (error) {
    showRenderJobStatus({ status: "failed", error: error.message }, error.message);
    setStatus(`لم ينجح الإنشاء: ${error.message}`, "error");
  } finally {
    state.busy = false;
    els.generateButton.disabled = false;
    updateQuickGenerateBar();
  }
}

async function waitForRenderJob(initialJob) {
  let job = normalizeRenderJob(initialJob);
  showRenderJobStatus(job, "تم استلام طلب الإنشاء.");
  if (job.status === "completed" || job.status === "failed") return job;
  if (!job.jobId) return job;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    setStatus(`جاري المعالجة... الحالة: ${renderStatusLabel(job.status)}`, "info");
    showRenderJobStatus(job, `جاري المعالجة... محاولة متابعة ${attempt + 1}.`);
    await delay(1500);
    const response = await apiFetch(`/api/render/${encodeURIComponent(job.jobId)}`, { cache: "no-store" });
    const next = await response.json();
    if (!response.ok || !next.ready) {
      throw new Error(formatGenerationFailure(next));
    }
    job = normalizeRenderJob(next);
    showRenderJobStatus(job, job.status === "completed" ? "اكتمل الطلب وأصبح الفيديو جاهزا." : "ما زال الطلب تحت المعالجة.");
    if (job.status === "completed" || job.status === "failed") return job;
  }

  return {
    ...job,
    status: "failed",
    error: "استغرق الإنشاء وقتا أطول من المتوقع. جرّب فتح النتيجة لاحقا من حالة الطلب.",
  };
}

function normalizeRenderJob(value) {
  return {
    jobId: String(value?.jobId || ""),
    status: String(value?.status || ""),
    videoUrl: String(value?.videoUrl || value?.outUrl || ""),
    error: String(value?.error || ""),
    code: String(value?.code || ""),
    hint: String(value?.hint || ""),
  };
}

function renderStatusLabel(status) {
  const labels = {
    pending: "بالانتظار",
    processing: "قيد المعالجة",
    completed: "اكتمل",
    failed: "فشل",
  };
  return labels[status] || status || "غير معروفة";
}

function renderStatusProgress(status) {
  const progress = {
    pending: 22,
    processing: 68,
    completed: 100,
    failed: 100,
  };
  return progress[status] || 12;
}

function showRenderJobStatus(jobLike, detail) {
  if (!els.renderJobPanel) return;
  const job = normalizeRenderJob(jobLike);
  const status = job.status || "pending";
  const label = renderStatusLabel(status);
  els.renderJobPanel.hidden = false;
  els.renderJobPanel.className = `render-job-panel ${status === "failed" ? "failed" : ""}`;
  els.renderJobBadge.textContent = label;
  els.renderJobBadge.className = `render-job-badge ${status}`;
  els.renderJobProgress.style.width = `${renderStatusProgress(status)}%`;
  els.renderJobTitle.textContent = job.jobId ? `طلب الإنشاء ${job.jobId}` : "حالة طلب الإنشاء";
  els.renderJobDetail.textContent = detail || formatGenerationFailure(job) || `الحالة الحالية: ${label}`;
}

function hideRenderJobStatus() {
  if (!els.renderJobPanel) return;
  els.renderJobPanel.hidden = true;
  els.renderJobPanel.className = "render-job-panel";
  els.renderJobBadge.textContent = "";
  els.renderJobBadge.className = "render-job-badge";
  els.renderJobProgress.style.width = "0";
  els.renderJobTitle.textContent = "حالة طلب الإنشاء";
  els.renderJobDetail.textContent = "";
}

function delay(ms) {
  return new Promise((resolveDelay) => window.setTimeout(resolveDelay, ms));
}

async function generateExternalAudioVideo() {
  const file = els.externalAudioFile?.files?.[0];
  if (!file) {
    setStatus("ارفع ملف صوت أو فيديو أولا.", "error");
    return;
  }

  let background = selectedBackground();
  if (background?.remoteOnly && !background.localFileReady) {
    setStatus("الخلفية المختارة تحتاج تجهيز قبل الإنشاء. جاري التجهيز الآن...", "info");
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
  setStatus("جاري استخراج الصوت من الملف الخارجي وإنشاء الفيديو...", "info");

  try {
    const form = new FormData();
    if (file) form.append("audio", file);
    form.append("background", background.id);
    form.append("reciterName", externalReciterName());
    form.append("useAyahs", useExternalAyahMetadata() ? "1" : "0");
    if (useExternalAyahMetadata()) {
      form.append("surah", String(selectedSurah()?.number || ""));
      form.append("ayahStart", String(readAyahStart() || ""));
      form.append("ayahCount", String(readAyahCount() || ""));
    }

    const response = await apiFetch("/api/compose-external-audio-video", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    if (!response.ok || !result.ready) {
      throw new Error(formatGenerationFailure(result));
    }
    setStatus("تم إنشاء الفيديو من الصوت الخارجي بنجاح.", "ok");
    showVideoResult(result);
  } catch (error) {
    setStatus(`لم ينجح الإنشاء: ${error.message}`, "error");
  } finally {
    state.busy = false;
    els.generateButton.disabled = false;
    updateQuickGenerateBar();
  }
}

function externalReciterName() {
  return String(els.externalReciterName?.value || "").trim();
}

function formatGenerationFailure(result) {
  const code = String(result?.code || "").trim();
  const message = String(result?.error || "فشل إنشاء الفيديو.").trim();
  const hint = String(result?.hint || "").trim();
  const prefix = generationFailurePrefix(code);
  return [prefix, message, hint].filter(Boolean).join(" ");
}

function generationFailurePrefix(code) {
  const labels = {
    "ffmpeg-missing": "مشكلة FFmpeg:",
    "ffmpeg-failed": "مشكلة FFmpeg:",
    "font-missing": "مشكلة الخط:",
    "background-missing": "مشكلة الخلفية:",
    "background-not-ready": "مشكلة الخلفية:",
    "recitation-audio-failed": "مشكلة صوت القارئ:",
    "reciter-not-supported": "مشكلة القارئ:",
  };
  return labels[code] || "";
}

function showVideoResult(result) {
  const href = normalizeVideoHref(result.outUrl || result.out || "");
  const fileName = href.split("/").filter(Boolean).pop() || "ayah-studio-video.mp4";
  state.lastVideoReady = true;
  els.videoLink.href = href;
  els.videoLink.hidden = false;
  els.videoDownloadLink.href = href;
  els.videoDownloadLink.download = fileName;
  els.videoResultName.textContent = `الملف جاهز: ${fileName}`;
  els.videoResultPanel.hidden = false;
  showInstagramCaption();
  showQuickVideoActions(href, fileName);
}

function normalizeVideoHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const clean = raw
    .replace(/^\/?app\/outputs\//i, "/outputs/")
    .replace(/^outputs\//i, "/outputs/");
  return new URL(clean, window.location.origin).href;
}

function hideVideoResult() {
  state.lastVideoReady = false;
  els.videoResultPanel.hidden = true;
  els.videoResultName.textContent = "";
  els.videoDownloadLink.href = "#";
  els.videoDownloadLink.removeAttribute("download");
  hideRenderJobStatus();
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
  const surah = captionSurah();
  const ayahs = captionAyahs();
  const reciterName = captionReciterName();
  const content = buildInstagramFallbackTafsirText(ayahs);
  const lines = [
    `القارئ/ ${reciterName}`,
    `السورة/ ${surah ? surahName(surah.number) : "آيات من القرآن الكريم"}`,
    formatInstagramAyahLine(ayahs),
    content,
    "",
    buildInstagramHashtags(surah, reciterName).join(" "),
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
  const ayahs = captionAyahs();
  if (ayahs.length) return buildInstagramCaptionWithContent("تفسير السعدي: جاري جلب تفسير الآيات المختارة...");
  return buildInstagramCaption();
}

async function buildInstagramCaptionAsync() {
  const ayahs = captionAyahs();
  if (!ayahs.length) return buildInstagramCaption();
  const tafsir = await fetchSaadiTafsirForAyahs(ayahs);
  return buildInstagramCaptionWithContent(tafsir || buildInstagramFallbackTafsirText(ayahs));
}

function buildInstagramCaptionWithContent(content) {
  const surah = captionSurah();
  const ayahs = captionAyahs();
  const reciterName = captionReciterName();
  const lines = [
    `القارئ/ ${reciterName}`,
    `السورة/ ${surah ? surahName(surah.number) : "آيات من القرآن الكريم"}`,
    formatInstagramAyahLine(ayahs),
    content,
    "",
    buildInstagramHashtags(surah, reciterName).join(" "),
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
  const surah = captionSurah();
  if (!surah || !ayah?.number) return "";
  try {
    const verseKey = `${surah.number}:${ayah.number}`;
    const response = await apiFetch(`/api/saadi-tafsir?verse_key=${encodeURIComponent(verseKey)}`, { cache: "no-store" });
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
  const reciterTag = normalizeHashtagPart(typeof reciter === "string" ? reciter : cleanReciterName(reciter));
  if (reciterTag) tags.push(`#${reciterTag}`);
  tags.push("#Quran");
  return uniqueValues(tags).slice(0, 5);
}

function cleanReciterName(reciter) {
  return String(reciter?.name || "قارئ القرآن").split(" - ")[0].trim();
}

function captionSurah() {
  return isExternalAudioMode() && !useExternalAyahMetadata() ? null : selectedSurah();
}

function captionAyahs() {
  return isExternalAudioMode() && !useExternalAyahMetadata() ? [] : selectedAyahs();
}

function captionReciterName() {
  if (isExternalAudioMode()) return externalReciterName() || "قارئ القرآن";
  return cleanReciterName(selectedReciter());
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

const MAX_PHONE_TEXT_CHARS = 360;
const MAX_PHONE_AYAH_COUNT = 8;

function cleanQuranTextLength(text) {
  return String(text || "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\s+/g, "")
    .length;
}

function recommendedAyahLimit(surah, start) {
  const remaining = Math.max(1, surah.ayahs.length - start + 1);
  const hardLimit = Math.min(MAX_PHONE_AYAH_COUNT, remaining);
  let totalLength = 0;
  let allowed = 0;

  for (let offset = 0; offset < hardLimit; offset += 1) {
    const ayah = surah.ayahs.find((item) => item.number === start + offset);
    const length = cleanQuranTextLength(ayah?.text);
    if (allowed > 0 && totalLength + length > MAX_PHONE_TEXT_CHARS) break;
    totalLength += length;
    allowed += 1;
    if (length > MAX_PHONE_TEXT_CHARS) break;
  }

  return Math.max(1, allowed);
}

function ayahTextProfile(ayahs) {
  const lengths = ayahs.map((ayah) => cleanQuranTextLength(ayah.text));
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const longestAyah = Math.max(0, ...lengths);
  let severity = "";

  if (totalLength > 430 || longestAyah > 260 || ayahs.length > 6) {
    severity = "very-long";
  } else if (totalLength > 280 || longestAyah > 180 || ayahs.length > 4) {
    severity = "long";
  }

  return { totalLength, longestAyah, ayahCount: ayahs.length, severity };
}

function ayahLengthWarning(profile) {
  if (!profile?.severity) return "";
  if (profile.severity === "very-long") {
    return "تنبيه: النص طويل جداً لفيديو قصير؛ الأفضل تقليل عدد الآيات أو اختيار آية أقصر.";
  }
  return "تنبيه: النص طويل وقد يظهر مزدحماً داخل إطار الهاتف.";
}

function applyPhoneAyahFit(ayahs) {
  const profile = ayahTextProfile(ayahs);
  els.phoneAyah.classList.toggle("is-long", profile.severity === "long");
  els.phoneAyah.classList.toggle("is-very-long", profile.severity === "very-long");
  els.phoneAyah.style.setProperty("--phone-ayah-width", phoneAyahBoxWidth(profile));
  return profile;
}

function phoneAyahBoxWidth(profile) {
  if (profile.severity === "very-long") return "88%";
  if (profile.severity === "long") return "84%";
  if (profile.totalLength <= 42 && profile.ayahCount <= 1) return "58%";
  if (profile.totalLength <= 90 && profile.ayahCount <= 2) return "72%";
  return "82%";
}

function selectedAyahs() {
  const surah = selectedSurah();
  if (!surah) return [];
  const start = readAyahStart();
  const count = readAyahCount();
  return surah.ayahs.filter((ayah) => ayah.number >= start && ayah.number < start + count);
}

function readAyahStart() {
  const surah = selectedSurah();
  const maxAyah = surah?.ayahs?.length || 286;
  return clampNumber(els.ayahStart.value || "1", 1, maxAyah);
}

function readAyahCount() {
  const surah = selectedSurah();
  const start = readAyahStart();
  const maxCount = maxAyahCountForSelection(surah, start);
  return clampNumber(els.ayahCount.value || "1", 1, maxCount);
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
  return true;
}

function isGenerationReadyBackground(item) {
  if (!item) return false;
  if (item.localFileReady === true) return true;
  if (item.remoteOnly === false && item.localFile) return true;
  if (["makkah", "madinah", "nature"].includes(String(item.id || ""))) return true;
  return false;
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
    const suffix = "";
    els.suggestionLine.textContent = `تم اختيار الخلفية: ${item.title}${suffix}`;
    setStatus("تم اختيار الخلفية. اضغط إنشاء الفيديو للمتابعة.", "info");
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
    const response = await apiFetch("/api/prepare-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background: item.id }),
    });
    const result = await response.json();
    if (!response.ok || !result.ready) {
      throw new Error(result.error || "تعذر تجهيز الخلفية.");
    }
    applyPreparedBackground(result.item);
    setStatus("تم تجهيز الخلفية للمعاينة والإنشاء.", "ok");
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
  const numeric = Number(normalizeNumericInput(value));
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
}

function normalizeNumericInput(value) {
  return String(value || "")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[^\d]/g, "");
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

