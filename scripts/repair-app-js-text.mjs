#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const targetPath = resolve(process.argv[2] || "app.js");
let text = readFileSync(targetPath, "utf8");

const start = text.indexOf("const SURAH_NAMES");
if (start > 0) text = text.slice(start);

const surahNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

const surahBlock = `const SURAH_NAMES = ${JSON.stringify(surahNames, null, 2)};\n\nconst BACKGROUND_FILES`;
text = replaceOrFail(text, /const SURAH_NAMES = \[[\s\S]*?\];\s*const BACKGROUND_FILES/, surahBlock, "SURAH_NAMES");

const importHelpBlock = `const BACKGROUND_IMPORT_HELP = {
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
};\n\nconst FEATURED_BACKGROUNDS`;
text = replaceOrFail(text, /const BACKGROUND_IMPORT_HELP = \{[\s\S]*?\};\s*const FEATURED_BACKGROUNDS/, importHelpBlock, "BACKGROUND_IMPORT_HELP");

const featuredBlock = `const FEATURED_BACKGROUNDS = [
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
];\n\nconst state`;
text = replaceOrFail(text, /const FEATURED_BACKGROUNDS = \[[\s\S]*?\];\s*const state/, featuredBlock, "FEATURED_BACKGROUNDS");

replaceFunction("renderBackgroundCards", `function renderBackgroundCards() {
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

      const title = document.createElement("strong");
      title.textContent = item.title;

      const meta = document.createElement("span");
      meta.textContent = backgroundCategoryName(item.category);

      button.append(image, title, meta);
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
}`);

replaceFunction("backgroundCountLabel", `function backgroundCountLabel(visibleCount, totalCount) {
  const category = state.backgroundFilter === "all" ? "كل الخلفيات" : backgroundCategoryName(state.backgroundFilter);
  return \`يعرض \${visibleCount} من \${totalCount} - \${category}\`;
}`);

replaceFunction("init", `async function init() {
  unregisterLocalServiceWorkers();
  setStatus("جاري تحميل بيانات القرآن والقراء...", "info");
  await Promise.all([loadQuran(), loadReciters(), loadBackgrounds(), loadFreeReels()]);
  bindEvents();
  renderAll();
  setStatus("جاهز للتجربة. اختر الآيات ثم اضغط توليد.", "info");
}`);

replaceFunction("loadQuran", `async function loadQuran() {
  const response = await fetch("data/quran-uthmani.json", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل ملف القرآن.");
  state.quran = await response.json();
}`);

replaceFunction("loadReciters", `async function loadReciters() {
  const response = await fetch("assets/recitation-catalog.json", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل مكتبة القراء.");
  const catalog = await response.json();
  state.reciters = catalog.reciters || [];
}`);

replaceFunction("renderFreeReels", `function renderFreeReels() {
  if (!els.freeReelsGrid || !els.freeReelsCount) return;

  const filter = state.backgroundFilter;
  const categoryItems = state.freeReels.filter((item) => filter === "all" || filter === "suggested" || item.category === filter);
  const items = categoryItems.length ? categoryItems : state.freeReels;
  els.freeReelsCount.textContent = \`مصادر مجانية مؤكدة: \${items.length}\`;

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
    meta.textContent = \`\${item.provider} - \${backgroundCategoryName(item.category)} - \${item.quality || "HD"} - \${item.duration || ""}\`;

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
}`);

replaceFunction("bindEvents", `function bindEvents() {
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
  els.backgroundSelect.addEventListener("change", renderPhonePreview);
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
      setStatus(\`تم تحديث المكتبة. تمت إضافة \${result.added} فيديو.\`, "ok");
    } catch (error) {
      setStatus(\`لم يزد العدد: \${error.message}\`, "error");
    }
    await loadBackgrounds();
    renderBackgroundOptions({ force: true });
    renderBackgroundCards();
    renderPhonePreview();
  });
  els.generateButton.addEventListener("click", generateVideo);
  els.backgroundPreview.addEventListener("error", () => {
    setStatus("تعذر تشغيل فيديو الخلفية في المعاينة، لذلك ظهرت صورة احتياطية. التوليد نفسه سيستخدم ملف الخلفية.", "error");
  });
}`);

replaceFunction("updateRangeSummary", `function updateRangeSummary() {
  const surah = selectedSurah();
  if (!surah || !els.rangeSummary) return;
  const start = Number(els.ayahStart.value || 1);
  const count = Number(els.ayahCount.value || 1);
  const end = start + count - 1;
  els.rangeSummary.textContent = \`سيتم توليد \${surahName(surah.number)} من الآية \${start}\${end > start ? \` إلى \${end}\` : ""} - عدد الآيات: \${count}\`;
}`);

replaceFunction("renderAyahPreview", `function renderAyahPreview() {
  const surah = selectedSurah();
  const ayahs = selectedAyahs();
  if (!surah || !ayahs.length) {
    els.referenceLine.textContent = "لم يتم اختيار آيات صالحة.";
    els.ayahPreview.textContent = "";
    return;
  }

  const start = Number(els.ayahStart.value);
  const end = start + ayahs.length - 1;
  els.referenceLine.textContent = \`\${surahName(surah.number)} من الآية \${start}\${end > start ? \` إلى \${end}\` : ""}\`;
  els.ayahPreview.replaceChildren(
    ...ayahs.map((ayah) => {
      const row = document.createElement("div");
      row.className = "ayah-row";
      row.textContent = \`\${ayah.text} ﴿\${ayah.number}﴾\`;
      return row;
    })
  );

  const source = state.quran?.source;
  els.sourceLine.textContent = source
    ? \`المصدر: \${source.name} - \${source.edition || "رسم عثماني"}\`
    : "";
}`);

replaceFunction("updateBackgroundSuggestions", `function updateBackgroundSuggestions({ selectFirst }) {
  const scored = scoreBackgroundsForAyahs();
  const suggested = scored.filter((item) => item.score > 0).slice(0, 3);
  state.suggestedBackgroundIds = new Set(suggested.map((item) => item.background.id));

  if (suggested.length) {
    els.suggestionLine.textContent = \`الأقرب للمعنى الآن: \${suggested.map((item) => item.background.title).join("، ")}\`;
    if (selectFirst) selectBackground(suggested[0].background.id, { silent: true });
    return;
  }

  els.suggestionLine.textContent = "لم أجد معنى واضحا يكفي للاقتراح، لذلك اختر الخلفية يدويا من الصور.";
}`);

replaceFunction("generateVideo", `async function generateVideo() {
  if (state.busy) return;
  const surah = selectedSurah();
  const reciter = selectedReciter();
  if (!surah || !reciter) {
    setStatus("اختر السورة والقارئ أولا.", "error");
    return;
  }

  state.busy = true;
  els.generateButton.disabled = true;
  els.videoLink.hidden = true;
  setStatus("جاري تنزيل الصوت وتوليد الفيديو. قد يستغرق ذلك قليلا لأول مرة...", "info");

  try {
    const payload = {
      surah: surah.number,
      ayahStart: Number(els.ayahStart.value),
      ayahCount: Number(els.ayahCount.value),
      reciter: reciter.id,
      background: selectedBackground().id,
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
    els.videoLink.href = result.outUrl || result.out;
    els.videoLink.hidden = false;
  } catch (error) {
    setStatus(\`لم ينجح التوليد: \${error.message}\`, "error");
  } finally {
    state.busy = false;
    els.generateButton.disabled = false;
  }
}`);

replaceFunction("scoreBackground", `function scoreBackground(background, text) {
  const category = background.category || "";
  const title = normalizeArabic(background.title || "");
  const haystack = \`\${category} \${title}\`;
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
}`);

replaceFunction("selectBackground", `function selectBackground(id, options = {}) {
  const item = state.backgrounds.find((background) => background.id === id);
  if (!item) return;
  els.backgroundSelect.value = item.id;
  if (!options.silent) {
    els.suggestionLine.textContent = \`تم اختيار الخلفية: \${item.title}\`;
  }
  renderBackgroundCards();
  renderPhonePreview();
}`);

replaceFunction("legacyFallbackBackgrounds", `function legacyFallbackBackgrounds() {
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
}`);

replaceFunction("backgroundCategoryName", `function backgroundCategoryName(category) {
  return {
    makkah: "مكة",
    madinah: "المدينة",
    mosque: "مسجد",
    nature: "طبيعة",
    sea: "بحر",
    sky: "سماء",
  }[category] || "خلفية";
}`);

text = text.replace(/ï´¿/g, "﴿").replace(/ï´¾/g, "﴾");
text = text.replace(/function surahName\(number\) \{[\s\S]*?\n\}/, `function surahName(number) {
  return SURAH_NAMES[number - 1] || \`سورة \${number}\`;
}`);
text = text.replace(/els\.suggestionLine\.textContent = `[^`]*\$\{item\.title\}`;/, 'els.suggestionLine.textContent = `تم اختيار الخلفية: ${item.title}`;');

writeFileSync(targetPath, text, "utf8");
console.log(`Repaired Arabic UI text in: ${targetPath}`);

function replaceFunction(name, replacement) {
  const match = new RegExp(`(?:async\\s+)*function ${name}\\(`).exec(text);
  if (!match) {
    throw new Error(`Could not find ${name}`);
  }
  const startIndex = match.index;
  const startToken = match[0];
  const rest = text.slice(startIndex + startToken.length);
  const nextMatch = /\n(?:async\s+)?function\s+/.exec(rest);
  if (!nextMatch) {
    throw new Error(`Could not find end of ${name}`);
  }
  const nextIndex = startIndex + startToken.length + nextMatch.index;
  text = `${text.slice(0, startIndex)}${replacement}\n\n${text.slice(nextIndex + 1)}`;
}

function replaceOrFail(input, pattern, replacement, label) {
  if (!pattern.test(input)) {
    throw new Error(`Could not find ${label}`);
  }
  return input.replace(pattern, replacement);
}
