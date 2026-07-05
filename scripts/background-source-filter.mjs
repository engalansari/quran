const BLOCKED_TEXT = [
  "taj mahal",
  "mawlid",
  "milad",
  "birthday",
  "calligraphy",
  "holy book",
  "holy spirit",
  "islamic background",
  "islamic design",
  "islamic new year",
  "greeting",
  "culture",
  "eid mubarak",
  "eid al-fitr",
  "quran",
  "koran",
  "reading",
  "holybook",
  "family",
  "couple",
  "daughter",
  "father",
  "hijab",
  "cartoon",
  "ai is generated",
  "black hole",
  "space",
  "pyramid",
  "pyramids",
  "dubai",
  "burj al arab",
  "burj khalifa",
  "emirate",
  "uae",
  "future museum",
  "jerusalem",
  "aqsa",
  "palestine",
  "israel",
  "islamabad",
  "pakistan",
  "beer",
  "alcohol",
  "bar",
  "pub",
  "people",
  "person",
  "woman",
  "man",
  "girl",
  "boy",
  "party",
  "concert",
  "dance",
  "drink",
  "toasting",
  "campfire",
  "yacht",
  "car",
  "cars",
  "traffic",
  "highway",
  "road",
  "bridge",
  "city",
  "building",
  "office",
  "street",
];

const CURATED_ALLOW_IDS = new Set([
  "makkah",
  "madinah",
  "nature",
  "pixabay-198048-makkah-haram",
  "pixabay-198047-makkah-kaaba",
  "pixabay-112360-madinah-nabawi",
]);

export function normalizedText(...parts) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasBlockedBackgroundTerms(text) {
  return BLOCKED_TEXT.some((term) => text.includes(term));
}

export function inferStrictCategory(value) {
  const text = normalizedText(value);
  if (isMakkahText(text)) return "makkah";
  if (isMadinahText(text)) return "madinah";
  if (/(mosque|masjid|islamic architecture|islamic mosque|ramadan mosque)/.test(text)) return "mosque";
  if (/(sea|ocean|wave|beach|water)/.test(text)) return "sea";
  if (/(sky|cloud|sun|moon|star|sunset|sunrise)/.test(text)) return "sky";
  return "nature";
}

export function isSuitableBackgroundEntry(entry, requestedCategory = "") {
  if (CURATED_ALLOW_IDS.has(entry.id)) return true;
  const text = normalizedText(entry.title, entry.tags, entry.sourceUrl, entry.author, entry.user);
  if (!text || hasBlockedBackgroundTerms(text)) return false;

  const category = requestedCategory || entry.category || inferStrictCategory(text);
  if (category === "makkah") return isMakkahText(text);
  if (category === "madinah") return isMadinahText(text);
  if (category === "mosque") return isMosqueText(text);
  if (category === "nature") return isCalmNatureText(text);
  if (category === "sea") return isCalmSeaText(text);
  if (category === "sky") return isCalmSkyText(text);
  return true;
}

function isMakkahText(text) {
  const hasPlace = /(makkah|mekkah|mecca|kaaba|kaba|al kaaba|masjid al haram|makkah tower)/.test(text);
  const hasVisualAnchor = /(kaaba|kaba|al kaaba|masjid al haram|clock tower|makkah tower|mecca madina|saudia arabia|masjid|mosque|hajj|umrah|minaret)/.test(text);
  return hasPlace && hasVisualAnchor;
}

function isMadinahText(text) {
  const hasPlace = /(madinah|medina|madina|nabawi|nabvi|prophet mosque)/.test(text);
  const hasVisualAnchor = /(madinah|medina|madina|nabawi|nabvi|prophet mosque|masjide nabvi|gunbad|umrah)/.test(text);
  return hasPlace && hasVisualAnchor;
}

function isMosqueText(text) {
  if (!/(mosque|masjid|islamic architecture|ramadan mosque|prayer|pray)/.test(text)) return false;
  return !hasBlockedBackgroundTerms(text);
}

function isCalmNatureText(text) {
  return /(meadow|creek|forest|flower|flowers|sunflower|tree|trees|mountain|mountains|hill|hills|waterfall|rain|cloud|clouds|leaf|leaves|green|valley|river|lake|landscape|field|garden|bush)/.test(text);
}

function isCalmSeaText(text) {
  return /(sea|ocean|wave|waves|beach|shore|coast|water|lake|river|sunset|sunrise)/.test(text);
}

function isCalmSkyText(text) {
  return /(sky|cloud|clouds|sun|moon|star|stars|sunset|sunrise|night|dawn)/.test(text);
}
