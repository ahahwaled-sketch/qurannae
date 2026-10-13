const API_BASE = "https://mp3quran.net/api/v3";
const SAYYED_SAEED_SERVER = "https://server12.mp3quran.net/sayed/";
const SAYYED_SAEED_MOSHAF_ID = "sayyed-saeed-fallback";
const OFFLINE_DB_NAME = "wird-quran-offline";
const OFFLINE_DB_VERSION = 2;

const elements = {
  audio: document.querySelector("#audio-player"),
  sidebarToggle: document.querySelector("#sidebar-toggle"),
  sidebar: document.querySelector("#sidebar"),
  themeToggle: document.querySelector("#theme-toggle"),
  browserThemeColor: document.querySelector("#browser-theme-color"),
  adhkarList: document.querySelector("#adhkar-list"),
  allReciterCount: document.querySelector("#all-reciter-count"),
  allReciterEmpty: document.querySelector("#all-reciter-empty"),
  allReciterList: document.querySelector("#all-reciter-list"),
  allReciterSearch: document.querySelector("#all-reciter-search"),
  audioDownloadButton: document.querySelector("#download-audio-button"),
  audioDownloadStatus: document.querySelector("#audio-download-status"),
  audioMoshafSelect: document.querySelector("#audio-moshaf-select"),
  audioReciterSelect: document.querySelector("#audio-reciter-select"),
  audioSurahSelect: document.querySelector("#audio-surah-select"),
  currentReciter: document.querySelector("#current-reciter"),
  currentSurah: document.querySelector("#current-surah"),
  downloadQuranButton: document.querySelector("#download-quran-button"),
  moshafSelect: document.querySelector("#moshaf-select"),
  playerStatus: document.querySelector("#player-status"),
  reciterCount: document.querySelector("#reciter-count"),
  reciterList: document.querySelector("#reciter-list"),
  reciterSearch: document.querySelector("#reciter-search"),
  readerStatus: document.querySelector("#reader-status"),
  readerSurahSelect: document.querySelector("#reader-surah-select"),
  mushafPageSelect: document.querySelector("#mushaf-page-select"),
  mushafPrevious: document.querySelector("#mushaf-previous"),
  mushafNext: document.querySelector("#mushaf-next"),
  pageTafsir: document.querySelector("#page-tafsir"),
  tafsirToggle: document.querySelector("#tafsir-toggle"),
  offlineStatus: document.querySelector("#offline-status"),
  offlineAudioCount: document.querySelector("#offline-audio-count"),
  offlineAudioList: document.querySelector("#offline-audio-list"),
  prophetStories: document.querySelector("#prophet-stories"),
  sayyedSaeedShortcut: document.querySelector("#sayyed-saeed-shortcut"),
  tasbeehCount: document.querySelector("#tasbeeh-count"),
  tasbeehCountButton: document.querySelector("#tasbeeh-count-button"),
  tasbeehPhrase: document.querySelector("#tasbeeh-phrase"),
  tasbeehReset: document.querySelector("#tasbeeh-reset"),
  tasbeehStatus: document.querySelector("#tasbeeh-status"),
  quranVerses: document.querySelector("#quran-verses"),
  hadithText: document.querySelector("#hadith-text"),
  hadithSource: document.querySelector("#hadith-source"),
  nextHadith: document.querySelector("#next-hadith"),
  surahEmpty: document.querySelector("#surah-empty"),
  surahList: document.querySelector("#surah-list"),
  surahSearch: document.querySelector("#surah-search"),
  surahCount: document.querySelector("#surah-count"),
  surahType: document.querySelector("#surah-type"),
};

let reciters = [];
let surahs = [];
let selectedReciter = null;
let selectedMoshaf = null;
let selectedSurah = null;
let fallbackAttempted = false;
let pendingFeaturedPlayback = false;
let currentTasbeehCount = 0;
let tasbeehCounts = {};
let currentHadithIndex = -1;
let offlineQuranDbPromise;
let offlineQuranReady = false;
let offlineSurahs = [];
let offlineAudioRecords = [];
let audioDownloadInProgress = false;
let activeOfflineAudioUrl = null;
let playbackRequestId = 0;

const adhkar = [
  {
    text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    repeat: 100,
    source: "من قالها حين يصبح وحين يمسي مائة مرة كان له فضل عظيم — صحيح مسلم (2692).",
  },
  {
    text: "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    repeat: 3,
    source: "يقال ثلاث مرات صباحًا ومساءً — سنن أبي داود (5088)، وجامع الترمذي (3388).",
  },
  {
    text: "رَضِيتُ بِاللهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ نَبِيًّا",
    repeat: 3,
    source: "يقال ثلاث مرات صباحًا ومساءً — سنن أبي داود (5072)، وجامع الترمذي (3389).",
  },
  {
    text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
    repeat: 10,
    source: "الصلاة على النبي ﷺ — ورد فضلها في صحيح مسلم (408).",
  },
];

const hadiths = [
  {
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.",
    source: "صحيح البخاري (1)، وصحيح مسلم (1907).",
  },
  {
    text: "مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ.",
    source: "صحيح البخاري (6018)، وصحيح مسلم (47).",
  },
  {
    text: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.",
    source: "صحيح البخاري (13)، وصحيح مسلم (45).",
  },
  {
    text: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ.",
    source: "صحيح البخاري (2989)، وصحيح مسلم (1009).",
  },
  {
    text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ.",
    source: "صحيح مسلم (2699).",
  },
];

const prophetStories = [
  {
    name: "آدم عليه السلام",
    story: "خلق الله آدم وعلّمه، وأسكنه الجنة، ثم تاب عليه بعد أن تلقّى كلمات من ربه. وتذكر قصته عظمة التوبة والرجوع إلى الله.",
    references: "البقرة: 30–39، طه: 115–123.",
  },
  {
    name: "إدريس عليه السلام",
    story: "أثنى الله على إدريس بالصدق والنبوة، وذكر أنه رفعه مكانًا عليًّا.",
    references: "مريم: 56–57، الأنبياء: 85–86.",
  },
  {
    name: "نوح عليه السلام",
    story: "دعا نوح قومه إلى عبادة الله زمنًا طويلًا، وصبر على أذاهم، ثم نجّاه الله ومن آمن معه في السفينة.",
    references: "هود: 25–49، نوح: 1–28.",
  },
  {
    name: "هود عليه السلام",
    story: "أرسل الله هودًا إلى عاد، فدعاهم إلى توحيد الله وترك الطغيان، فكذّبوه فأهلك الله المكذبين ونجّى هودًا والمؤمنين.",
    references: "الأعراف: 65–72، هود: 50–60.",
  },
  {
    name: "صالح عليه السلام",
    story: "دعا صالح ثمود إلى عبادة الله، وجعل الله لهم الناقة آية، فلما عقرها المكذبون أخذتهم الرجفة ونجّى الله صالحًا ومن آمن معه.",
    references: "الأعراف: 73–79، هود: 61–68.",
  },
  {
    name: "إبراهيم عليه السلام",
    story: "جادل قومه بالحجة في عبادة الله وحده، وابتُلي فصبر، وجعل الله من ذريته النبوة، ورفع مع إسماعيل قواعد الكعبة.",
    references: "الأنبياء: 51–73، الصافات: 99–111، البقرة: 124–129.",
  },
  {
    name: "لوط عليه السلام",
    story: "أرسل الله لوطًا إلى قومه يدعوهم إلى التقوى وترك الفاحشة، فنجّى الله لوطًا وأهله إلا امرأته، وأهلك القوم الظالمين.",
    references: "الأعراف: 80–84، هود: 77–83.",
  },
  {
    name: "إسماعيل عليه السلام",
    story: "وعد إسماعيل أباه بالصبر والطاعة في الابتلاء، وأثنى الله عليه بصدق الوعد والحرص على الصلاة والزكاة.",
    references: "الصافات: 101–107، مريم: 54–55.",
  },
  {
    name: "إسحاق عليه السلام",
    story: "بشّر الله إبراهيم وزوجه بإسحاق، وجعله نبيًّا من الصالحين، وبارك في ذريته.",
    references: "هود: 71–73، الصافات: 112–113.",
  },
  {
    name: "يعقوب عليه السلام",
    story: "كان يعقوب نبيًّا صالحًا، وصبر على فراق يوسف، وحثّ أبناءه على التوحيد، وردّ الله إليه بصره وجمعه بأهله.",
    references: "يوسف: 83–101.",
  },
  {
    name: "يوسف عليه السلام",
    story: "ابتُلي يوسف بفراق أبيه والظلم والسجن، فصبر واستعفّ، ثم مكّنه الله في الأرض وجمع شمله بأهله.",
    references: "سورة يوسف: 4–101.",
  },
  {
    name: "أيوب عليه السلام",
    story: "ابتُلي أيوب في جسده وأهله، فصبر ودعا ربه، فكشف الله ضره وردّ عليه أهله ومثلهم معهم.",
    references: "الأنبياء: 83–84، ص: 41–44.",
  },
  {
    name: "شعيب عليه السلام",
    story: "دعا شعيب أهل مدين إلى توحيد الله وإيفاء الكيل والميزان، فنجّى الله شعيبًا والمؤمنين وأخذ المكذبين.",
    references: "الأعراف: 85–93، هود: 84–95.",
  },
  {
    name: "موسى عليه السلام",
    story: "أرسله الله إلى فرعون، وأيّده بالآيات، ونجّاه وبني إسرائيل من فرعون، وكلّمه وهداه.",
    references: "طه: 9–98، القصص: 3–46.",
  },
  {
    name: "هارون عليه السلام",
    story: "سأل موسى ربّه أن يجعل هارون أخاه وزيرًا له، فأيّده الله به في الدعوة، وكان هارون نبيًّا من الصالحين.",
    references: "طه: 29–36، مريم: 53.",
  },
  {
    name: "ذو الكفل عليه السلام",
    story: "ذكره الله في جملة الصابرين والأخيار، وأثنى عليه بالصلاح.",
    references: "الأنبياء: 85–86، ص: 48.",
  },
  {
    name: "داود عليه السلام",
    story: "آتاه الله الملك والحكمة، وأنزل عليه الزبور، وسخّر معه الجبال والطير، وأمره بالحق والعدل.",
    references: "ص: 17–26، سبأ: 10–11.",
  },
  {
    name: "سليمان عليه السلام",
    story: "وهب الله سليمان ملكًا عظيمًا وعلّمه منطق الطير، فشكر نعمة ربه ودعا ملكة سبأ إلى الإسلام.",
    references: "النمل: 15–44، ص: 30–40.",
  },
  {
    name: "إلياس عليه السلام",
    story: "دعا إلياس قومه إلى عبادة الله وحده وترك عبادة بعل، وأثنى الله عليه بأنه من عباده المؤمنين.",
    references: "الصافات: 123–132.",
  },
  {
    name: "اليسع عليه السلام",
    story: "ذكر الله اليسع في جملة الأخيار والفضلاء من أنبيائه.",
    references: "الأنعام: 86، ص: 48.",
  },
  {
    name: "يونس عليه السلام",
    story: "خرج يونس مغاضبًا، ثم نادى ربه في الظلمات، فاستجاب الله له ونجّاه، وجعل قصته آية للمؤمنين.",
    references: "الأنبياء: 87–88، الصافات: 139–148.",
  },
  {
    name: "زكريا عليه السلام",
    story: "دعا زكريا ربه أن يرزقه ولدًا صالحًا، فبشّره الله بيحيى على كبر سنه، واستجاب دعاءه.",
    references: "آل عمران: 37–41، مريم: 2–11.",
  },
  {
    name: "يحيى عليه السلام",
    story: "آتاه الله الحكم صبيًّا، وجعله بارًّا بوالديه، نقيًّا تقيًّا، وسلام عليه يوم ولد ويوم يموت ويوم يبعث حيًّا.",
    references: "آل عمران: 39، مريم: 12–15.",
  },
  {
    name: "عيسى عليه السلام",
    story: "بشّر الله مريم بعيسى، وجعله آية للناس، وأيّده بالبينات، ودعا بني إسرائيل إلى عبادة الله ربه وربهم.",
    references: "آل عمران: 45–55، مريم: 16–36.",
  },
  {
    name: "محمد ﷺ",
    story: "بعث الله محمدًا ﷺ رحمة للعالمين، وأنزل عليه القرآن، فدعا إلى التوحيد ومكارم الأخلاق، وصبر حتى أظهر الله دينه.",
    references: "الأنبياء: 107، الأحزاب: 21، سورة الفتح.",
  },
];

function normalizeArabic(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase("ar");
}

function isSayyedSaeed(reciter) {
  const name = normalizeArabic(reciter.name);
  return name.includes("سيد") && name.includes("سعيد");
}

function makeSayyedSaeedFallback() {
  return {
    id: "sayyed-saeed",
    name: "الشيخ السيد سعيد",
    moshaf: [
      {
        id: SAYYED_SAEED_MOSHAF_ID,
        name: "المصحف المرتل — مصدر احتياطي",
        server: SAYYED_SAEED_SERVER,
        surah_list: Array.from({ length: 114 }, (_, index) => index + 1).join(","),
      },
    ],
  };
}

function ensureSayyedSaeedFallback() {
  let reciter = reciters.find(isSayyedSaeed);
  if (!reciter) {
    reciter = makeSayyedSaeedFallback();
    reciters.push(reciter);
  } else {
    reciter.moshaf ||= [];
    if (!reciter.moshaf.some((moshaf) => moshaf.id === SAYYED_SAEED_MOSHAF_ID)) {
      reciter.moshaf.push(makeSayyedSaeedFallback().moshaf[0]);
    }
  }
  return reciter;
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}/${path}`);
  if (!response.ok) {
    throw new Error(`تعذّر تحميل البيانات (HTTP ${response.status}).`);
  }
  return response.json();
}

function showError(container, message, retry) {
  container.replaceChildren();
  const box = document.createElement("div");
  box.className = "error-box";
  box.append(document.createTextNode(message));
  const button = document.createElement("button");
  button.className = "retry-button";
  button.type = "button";
  button.textContent = "إعادة المحاولة";
  button.addEventListener("click", retry);
  box.append(button);
  container.append(box);
}

function renderReciters() {
  const query = normalizeArabic(elements.reciterSearch.value.trim());
  const matches = reciters
    .filter((reciter) => normalizeArabic(reciter.name).includes(query))
    .sort((first, second) => {
      const firstFeatured = isSayyedSaeed(first);
      const secondFeatured = isSayyedSaeed(second);
      return Number(secondFeatured) - Number(firstFeatured);
    });
  elements.reciterCount.textContent = String(reciters.length);
  elements.reciterList.replaceChildren();

  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sidebar-loading";
    empty.textContent = "لا يوجد قارئ بهذا الاسم.";
    elements.reciterList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const reciter of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `reciter-button${selectedReciter?.id === reciter.id ? " selected" : ""}`;
    button.setAttribute("aria-pressed", String(selectedReciter?.id === reciter.id));

    const avatar = document.createElement("span");
    avatar.className = "reciter-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = reciter.name.trim().charAt(0) || "ق";

    const name = document.createElement("span");
    name.className = "reciter-name";
    name.textContent = reciter.name;
    button.append(avatar, name);
    button.addEventListener("click", () => selectReciter(reciter));
    fragment.append(button);
  }
  elements.reciterList.append(fragment);
}

function renderAllReciters() {
  const query = normalizeArabic(elements.allReciterSearch.value.trim());
  const matches = reciters.filter((reciter) =>
    normalizeArabic(reciter.name).includes(query),
  );
  elements.allReciterCount.textContent = `(${reciters.length.toLocaleString("ar")} قارئ)`;
  elements.allReciterEmpty.hidden = matches.length !== 0;

  const fragment = document.createDocumentFragment();
  for (const reciter of matches) {
    const moshafs = (reciter.moshaf || []).filter(
      (moshaf) => moshaf.server && moshaf.surah_list,
    );
    const card = document.createElement("article");
    card.className = `practice-card all-reciter-card${selectedReciter?.id === reciter.id ? " selected" : ""}`;

    const avatar = document.createElement("span");
    avatar.className = "all-reciter-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = reciter.name.trim().charAt(0) || "ق";

    const name = document.createElement("h3");
    name.className = "all-reciter-name";
    name.textContent = reciter.name;

    const details = document.createElement("p");
    details.className = "all-reciter-details";
    const availableSurahs = moshafs.reduce((ids, moshaf) => {
      for (const id of moshaf.surah_list.split(",")) ids.add(id.trim());
      return ids;
    }, new Set()).size;
    details.textContent = `${moshafs.length.toLocaleString("ar")} ${moshafs.length === 1 ? "رواية متاحة" : "روايات متاحة"} · ${availableSurahs.toLocaleString("ar")} سورة`;

    const moshafNames = document.createElement("p");
    moshafNames.className = "all-reciter-moshafs";
    moshafNames.textContent = moshafs.map((moshaf) => moshaf.name).join(" · ") || "لا توجد روايات متاحة";

    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "primary-button";
    choose.textContent = selectedReciter?.id === reciter.id ? "القارئ المختار" : "اختر هذا القارئ";
    choose.setAttribute("aria-pressed", String(selectedReciter?.id === reciter.id));
    choose.disabled = moshafs.length === 0;
    choose.addEventListener("click", () => {
      if (!selectReciter(reciter)) return;
      activateView("listen");
      elements.moshafSelect.focus({ preventScroll: true });
    });

    card.append(avatar, name, details, moshafNames, choose);
    fragment.append(card);
  }
  elements.allReciterList.replaceChildren(fragment);
}

function populateAudioReciters() {
  const availableReciters = reciters.filter((reciter) =>
    (reciter.moshaf || []).some((moshaf) => moshaf.server && moshaf.surah_list),
  );
  elements.audioReciterSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = availableReciters.length ? "اختر القارئ" : "لا يوجد قرّاء متاحون";
  elements.audioReciterSelect.append(placeholder);

  for (const reciter of availableReciters) {
    const option = document.createElement("option");
    option.value = String(reciter.id);
    option.textContent = reciter.name;
    elements.audioReciterSelect.append(option);
  }

  const selectedId = availableReciters.some(
    (reciter) => String(reciter.id) === elements.audioReciterSelect.value,
  )
    ? elements.audioReciterSelect.value
    : selectedReciter && availableReciters.some(
      (reciter) => String(reciter.id) === String(selectedReciter.id),
    )
      ? String(selectedReciter.id)
      : String(availableReciters[0]?.id || "");
  elements.audioReciterSelect.value = selectedId;
  populateAudioMoshafs();
}

function populateAudioMoshafs() {
  const reciter = reciters.find(
    (item) => String(item.id) === elements.audioReciterSelect.value,
  );
  const moshafs = (reciter?.moshaf || []).filter(
    (moshaf) => moshaf.server && moshaf.surah_list,
  );
  elements.audioMoshafSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = moshafs.length ? "اختر الرواية" : "لا توجد روايات متاحة";
  elements.audioMoshafSelect.append(placeholder);

  for (const moshaf of moshafs) {
    const option = document.createElement("option");
    option.value = String(moshaf.id);
    option.textContent = moshaf.name;
    elements.audioMoshafSelect.append(option);
  }

  const preferredMoshaf = moshafs.find(
    (moshaf) =>
      String(selectedReciter?.id) === elements.audioReciterSelect.value &&
      String(moshaf.id) === String(selectedMoshaf?.id),
  );
  elements.audioMoshafSelect.value = String(preferredMoshaf?.id || moshafs[0]?.id || "");
  elements.audioMoshafSelect.disabled = moshafs.length === 0;
  populateAudioSurahs();
}

function populateAudioSurahs() {
  const moshaf = reciters
    .find((reciter) => String(reciter.id) === elements.audioReciterSelect.value)
    ?.moshaf?.find((item) => String(item.id) === elements.audioMoshafSelect.value);
  const availableIds = new Set(
    (moshaf?.surah_list || "").split(",").map((id) => id.trim()),
  );
  const availableSurahs = surahs.filter((surah) => availableIds.has(String(surah.id)));
  elements.audioSurahSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = availableSurahs.length ? "اختر السورة" : "لا توجد سور متاحة";
  elements.audioSurahSelect.append(placeholder);

  for (const surah of availableSurahs) {
    const option = document.createElement("option");
    option.value = String(surah.id);
    option.textContent = surah.name;
    elements.audioSurahSelect.append(option);
  }
  elements.audioSurahSelect.disabled = availableSurahs.length === 0;
  updateAudioDownloadControls();
}

function selectedDownloadAudio() {
  const reciter = reciters.find(
    (item) => String(item.id) === elements.audioReciterSelect.value,
  );
  const moshaf = reciter?.moshaf?.find(
    (item) => String(item.id) === elements.audioMoshafSelect.value,
  );
  const surah = surahs.find(
    (item) => String(item.id) === elements.audioSurahSelect.value,
  );
  return reciter && moshaf && surah ? { reciter, moshaf, surah } : null;
}

function offlineAudioId(reciterId, moshafId, surahId) {
  return JSON.stringify([String(reciterId), String(moshafId), Number(surahId)]);
}

function updateAudioDownloadControls() {
  const selected = selectedDownloadAudio();
  const alreadySaved = selected && offlineAudioRecords.some(
    (record) => record.id === offlineAudioId(
      selected.reciter.id,
      selected.moshaf.id,
      selected.surah.id,
    ),
  );
  elements.audioDownloadButton.disabled =
    !selected || audioDownloadInProgress || Boolean(alreadySaved);
  elements.audioDownloadButton.textContent = alreadySaved ? "تم تنزيل السورة" : "تنزيل السورة";
  if (selected && alreadySaved && !audioDownloadInProgress) {
    elements.audioDownloadStatus.textContent = "هذه السورة محفوظة بالفعل ويمكن تشغيلها دون إنترنت.";
  } else if (selected && !audioDownloadInProgress) {
    elements.audioDownloadStatus.textContent = "سيُحفظ ملف التلاوة على هذا الجهاز للاستماع دون إنترنت.";
  }
}

function renderOfflineAudioLibrary() {
  elements.offlineAudioCount.textContent = `(${offlineAudioRecords.length.toLocaleString("ar")} سورة)`;
  elements.offlineAudioList.replaceChildren();
  if (offlineAudioRecords.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtle-note";
    empty.textContent = "لم تُنزّل أي تلاوات بعد.";
    elements.offlineAudioList.append(empty);
    updateAudioDownloadControls();
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of offlineAudioRecords) {
    const item = document.createElement("article");
    item.className = "offline-audio-item";
    const details = document.createElement("div");
    details.className = "offline-audio-details";
    const title = document.createElement("strong");
    title.textContent = `${record.surahName} · ${record.reciterName}`;
    const subtitle = document.createElement("span");
    subtitle.textContent = `${record.moshafName} · ${(record.audio.size / (1024 * 1024)).toLocaleString("ar", { maximumFractionDigits: 1 })} م.ب`;
    details.append(title, subtitle);

    const play = document.createElement("button");
    play.className = "secondary-button";
    play.type = "button";
    play.textContent = "تشغيل دون إنترنت";
    play.addEventListener("click", () => playSavedAudio(record));

    const remove = document.createElement("button");
    remove.className = "secondary-button offline-audio-remove";
    remove.type = "button";
    remove.textContent = "حذف";
    remove.setAttribute("aria-label", `حذف تلاوة ${record.surahName} بصوت ${record.reciterName}`);
    remove.addEventListener("click", () => removeSavedAudio(record));
    item.append(details, play, remove);
    fragment.append(item);
  }
  elements.offlineAudioList.append(fragment);
  updateAudioDownloadControls();
}

function renderSurahs() {
  const query = elements.surahSearch.value.trim().toLocaleLowerCase("ar");
  const matchingSurahs = surahs.filter((surah) =>
    surah.name.toLocaleLowerCase("ar").includes(query),
  );

  elements.surahList.replaceChildren();
  elements.surahEmpty.hidden = matchingSurahs.length !== 0;

  const fragment = document.createDocumentFragment();
  for (const surah of matchingSurahs) {
    const isAvailable =
      !selectedMoshaf ||
      selectedMoshaf.surah_list.split(",").includes(String(surah.id));
    const button = document.createElement("button");
    button.type = "button";
    button.className = `surah-card${selectedSurah?.id === surah.id ? " selected" : ""}${isAvailable ? "" : " unavailable"}`;
    button.disabled = !isAvailable;
    button.setAttribute("aria-pressed", String(selectedSurah?.id === surah.id));

    const number = document.createElement("span");
    number.className = "surah-number";
    number.textContent = String(surah.id).padStart(3, "0");

    const copy = document.createElement("span");
    copy.className = "surah-card-copy";
    const name = document.createElement("span");
    name.className = "surah-name";
    name.textContent = surah.name;
    const meta = document.createElement("span");
    meta.className = "surah-meta";
    meta.textContent = isAvailable
      ? surah.type || "سورة"
      : "غير متاحة بهذه الرواية";
    copy.append(name, meta);

    const play = document.createElement("span");
    play.className = "surah-play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = selectedSurah?.id === surah.id ? "♫" : "▶";

    button.append(number, copy, play);
    button.addEventListener("click", () => selectSurah(surah));
    fragment.append(button);
  }
  elements.surahList.append(fragment);
}

function renderAdhkar() {
    const fragment = document.createDocumentFragment();
    for (const dhikr of adhkar) {
      const card = document.createElement("article");
      card.className = "practice-card dhikr-card";

      const text = document.createElement("p");
      text.className = "dhikr-text";
      text.textContent = dhikr.text;

      const source = document.createElement("p");
      source.className = "dhikr-source";
      source.textContent = dhikr.source;

      const progress = document.createElement("span");
      progress.className = "dhikr-progress";
      progress.setAttribute("aria-live", "polite");
      let count = 0;
      const updateProgress = () => {
        progress.textContent = `${count.toLocaleString("ar")} / ${dhikr.repeat.toLocaleString("ar")}`;
      };
      updateProgress();

      const button = document.createElement("button");
      button.className = "primary-button";
      button.type = "button";
      button.textContent = "تم الذكر";
      button.addEventListener("click", () => {
        count = Math.min(count + 1, dhikr.repeat);
        updateProgress();
        button.disabled = count === dhikr.repeat;
        if (button.disabled) button.textContent = "اكتمل الورد";
      });

      card.append(text, source, progress, button);
      fragment.append(card);
    }
    elements.adhkarList.replaceChildren(fragment);
  }

  function saveTasbeehState() {
    try {
      tasbeehCounts[elements.tasbeehPhrase.value] = currentTasbeehCount;
      localStorage.setItem("wird-tasbeeh", JSON.stringify({
        phrase: elements.tasbeehPhrase.value,
        counts: tasbeehCounts,
      }));
      elements.tasbeehStatus.textContent = "يُحفظ عدّادك على هذا الجهاز.";
    } catch (error) {
      console.error("تعذّر حفظ عدّاد التسبيح:", error);
      elements.tasbeehStatus.textContent = "تعذّر حفظ العدّاد على هذا الجهاز؛ سيبقى ظاهرًا حتى إغلاق الصفحة.";
    }
    elements.tasbeehCount.textContent = currentTasbeehCount.toLocaleString("ar");
  }

  function loadTasbeehState() {
    try {
      const saved = JSON.parse(localStorage.getItem("wird-tasbeeh") || "{}");
      if (saved.counts && typeof saved.counts === "object") {
        tasbeehCounts = Object.fromEntries(
          Object.entries(saved.counts).filter(([, count]) => Number.isSafeInteger(count) && count >= 0),
        );
      }
      if ([...elements.tasbeehPhrase.options].some((option) => option.value === saved.phrase)) {
        elements.tasbeehPhrase.value = saved.phrase;
      }
      currentTasbeehCount = tasbeehCounts[elements.tasbeehPhrase.value] || 0;
    } catch (error) {
      console.error("تعذّر استعادة عدّاد التسبيح:", error);
      elements.tasbeehStatus.textContent = "تعذّرت استعادة العدّاد المحفوظ؛ يمكنك بدء عدّ جديد.";
    }
    elements.tasbeehCount.textContent = currentTasbeehCount.toLocaleString("ar");
  }

  function renderHadith() {
    let nextIndex = Math.floor(Math.random() * hadiths.length);
    if (hadiths.length > 1 && nextIndex === currentHadithIndex) {
      nextIndex = (nextIndex + 1) % hadiths.length;
    }
    currentHadithIndex = nextIndex;
    elements.hadithText.textContent = hadiths[nextIndex].text;
    elements.hadithSource.textContent = hadiths[nextIndex].source;
  }

  function renderProphetStories() {
    const fragment = document.createDocumentFragment();
    for (const prophet of prophetStories) {
      const card = document.createElement("article");
      card.className = "practice-card prophet-card";

      const title = document.createElement("h3");
      title.textContent = prophet.name;

      const story = document.createElement("p");
      story.textContent = prophet.story;

      const references = document.createElement("p");
      references.className = "prophet-references";
      references.textContent = `مواضع قرآنية: ${prophet.references}`;

      card.append(title, story, references);
      fragment.append(card);
    }
    elements.prophetStories.replaceChildren(fragment);
  }

  function openOfflineQuranDatabase() {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("هذا المتصفح لا يدعم حفظ البيانات للاستخدام دون إنترنت."));
    }
    if (!offlineQuranDbPromise) {
      offlineQuranDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
        request.addEventListener("upgradeneeded", () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("surahs")) {
            database.createObjectStore("surahs", { keyPath: "number" });
          }
          if (!database.objectStoreNames.contains("metadata")) {
            database.createObjectStore("metadata", { keyPath: "key" });
          }
          if (!database.objectStoreNames.contains("audio")) {
            database.createObjectStore("audio", { keyPath: "id" });
          }
        });
        request.addEventListener("success", () => resolve(request.result), { once: true });
        request.addEventListener("error", () => reject(request.error || new Error("تعذّر فتح التخزين المحلي.")), { once: true });
      });
    }
    return offlineQuranDbPromise;
  }

  async function readOfflineAudio(id) {
    const database = await openOfflineQuranDatabase();
    const transaction = database.transaction("audio", "readonly");
    return requestValue(transaction.objectStore("audio").get(id));
  }

  async function saveOfflineAudio(record) {
    const database = await openOfflineQuranDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("audio", "readwrite");
      transaction.objectStore("audio").put(record);
      transaction.addEventListener("complete", resolve, { once: true });
      transaction.addEventListener("abort", () => reject(transaction.error || new Error("تعذّر حفظ التلاوة على هذا الجهاز.")), { once: true });
      transaction.addEventListener("error", () => reject(transaction.error || new Error("تعذّر حفظ التلاوة على هذا الجهاز.")), { once: true });
    });
  }

  async function refreshOfflineAudioLibrary() {
    try {
      const database = await openOfflineQuranDatabase();
      const transaction = database.transaction("audio", "readonly");
      const records = await requestValue(transaction.objectStore("audio").getAll());
      offlineAudioRecords = records.sort((first, second) =>
        first.reciterName.localeCompare(second.reciterName, "ar") ||
        first.surahId - second.surahId,
      );
      renderOfflineAudioLibrary();
    } catch (error) {
      console.error("تعذّر استعادة التلاوات المحفوظة:", error);
      elements.offlineAudioList.textContent = `تعذّر فحص التلاوات المحفوظة: ${error.message}`;
      elements.audioDownloadStatus.textContent = "تعذّر الوصول إلى التخزين المحلي لهذا الجهاز.";
    }
  }

  async function removeSavedAudio(record) {
    try {
      const database = await openOfflineQuranDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction("audio", "readwrite");
        transaction.objectStore("audio").delete(record.id);
        transaction.addEventListener("complete", resolve, { once: true });
        transaction.addEventListener("abort", () => reject(transaction.error || new Error("تعذّر حذف التلاوة.")), { once: true });
        transaction.addEventListener("error", () => reject(transaction.error || new Error("تعذّر حذف التلاوة.")), { once: true });
      });
      if (
        selectedReciter &&
        selectedMoshaf &&
        selectedSurah &&
        record.id === offlineAudioId(selectedReciter.id, selectedMoshaf.id, selectedSurah.id)
      ) {
        playbackRequestId += 1;
        elements.audio.pause();
        elements.audio.removeAttribute("src");
        elements.audio.load();
        releaseOfflineAudioUrl();
        elements.playerStatus.textContent = "حُذفت التلاوة المحفوظة.";
      }
      await refreshOfflineAudioLibrary();
      elements.audioDownloadStatus.textContent = `حُذفت تلاوة ${record.surahName}.`;
    } catch (error) {
      console.error("تعذّر حذف التلاوة المحفوظة:", error);
      elements.audioDownloadStatus.textContent = error.message;
    }
  }

  function releaseOfflineAudioUrl() {
    if (!activeOfflineAudioUrl) return;
    URL.revokeObjectURL(activeOfflineAudioUrl);
    activeOfflineAudioUrl = null;
  }

  function setAudioSource(source, isOffline = false) {
    elements.audio.pause();
    releaseOfflineAudioUrl();
    elements.audio.src = source;
    if (isOffline) activeOfflineAudioUrl = source;
    elements.audio.load();
  }

  function playSavedAudio(record) {
    playbackRequestId += 1;
    const reciter = reciters.find(
      (item) => String(item.id) === String(record.reciterId),
    );
    const moshaf = reciter?.moshaf?.find(
      (item) => String(item.id) === String(record.moshafId),
    ) || {
      id: record.moshafId,
      name: record.moshafName,
      server: "",
      surah_list: String(record.surahId),
    };
    selectedReciter = reciter
      ? {
        ...reciter,
        moshaf: reciter.moshaf?.some(
          (item) => String(item.id) === String(moshaf.id),
        )
          ? reciter.moshaf
          : [moshaf],
      }
      : {
        id: record.reciterId,
        name: record.reciterName,
        moshaf: [moshaf],
      };
    selectedMoshaf = moshaf;
    selectedSurah = surahs.find((item) => item.id === record.surahId) || {
      id: record.surahId,
      name: record.surahName,
      type: "القرآن الكريم",
    };
    elements.currentReciter.textContent = record.reciterName;
    elements.currentSurah.textContent = record.surahName;
    elements.surahType.textContent = selectedSurah.type || "القرآن الكريم";
    elements.moshafSelect.replaceChildren();
    const option = document.createElement("option");
    option.value = String(moshaf.id);
    option.textContent = record.moshafName;
    elements.moshafSelect.append(option);
    elements.moshafSelect.value = String(moshaf.id);
    elements.moshafSelect.disabled = false;
    const source = URL.createObjectURL(record.audio);
    setAudioSource(source, true);
    elements.playerStatus.textContent = "تشغيل التلاوة المحفوظة دون إنترنت.";
    activateView("listen");
    elements.audio.play().catch((error) => {
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        elements.playerStatus.textContent = "تعذّر تشغيل ملف التلاوة المحفوظ.";
      }
    });
    renderReciters();
    renderAllReciters();
    renderSurahs();
  }

  async function downloadSelectedAudio() {
    const selected = selectedDownloadAudio();
    if (!selected || audioDownloadInProgress) return;
    audioDownloadInProgress = true;
    updateAudioDownloadControls();
    elements.audioDownloadStatus.textContent = `جارٍ تنزيل سورة ${selected.surah.name} بصوت ${selected.reciter.name}...`;
    try {
      const response = await fetch(audioUrlFor(selected.moshaf, selected.surah));
      if (!response.ok) {
        throw new Error(`تعذّر تنزيل التلاوة (HTTP ${response.status}).`);
      }
      const audio = await response.blob();
      if (audio.size === 0) throw new Error("ملف التلاوة الذي وصل فارغ.");

      await saveOfflineAudio({
        id: offlineAudioId(selected.reciter.id, selected.moshaf.id, selected.surah.id),
        reciterId: String(selected.reciter.id),
        reciterName: selected.reciter.name,
        moshafId: String(selected.moshaf.id),
        moshafName: selected.moshaf.name,
        surahId: selected.surah.id,
        surahName: selected.surah.name,
        audio,
      });
      await refreshOfflineAudioLibrary();
      elements.audioDownloadStatus.textContent = `تم تنزيل سورة ${selected.surah.name}. يمكنك تشغيلها دون إنترنت.`;
    } catch (error) {
      console.error("تعذّر تنزيل التلاوة للاستخدام دون إنترنت:", error);
      elements.audioDownloadStatus.textContent = `${error.message} تحقّق من الاتصال والمساحة المتاحة ثم أعد المحاولة.`;
    } finally {
      audioDownloadInProgress = false;
      updateAudioDownloadControls();
    }
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error || new Error("تعذّرت قراءة البيانات المحلية.")), { once: true });
    });
  }

  async function restoreOfflineQuran() {
    try {
      const database = await openOfflineQuranDatabase();
      const transaction = database.transaction(["surahs", "metadata"], "readonly");
      const [savedSurahs, metadata] = await Promise.all([
        requestValue(transaction.objectStore("surahs").getAll()),
        requestValue(transaction.objectStore("metadata").get("complete")),
      ]);
      const validDataset =
        savedSurahs.length === 114 &&
        savedSurahs.every((surah, index) =>
          surah.number === index + 1 &&
          Array.isArray(surah.ayahs) &&
          surah.ayahs.length > 0 &&
          surah.ayahs.every((ayah, ayahIndex) =>
            ayah.numberInSurah === ayahIndex + 1 &&
            typeof ayah.text === "string" &&
            typeof ayah.tafsir === "string" &&
            Number.isInteger(ayah.page) &&
            ayah.page >= 1 &&
            ayah.page <= 604,
          ),
        );
      if (metadata?.value === true && validDataset) {
        offlineSurahs = savedSurahs.sort((first, second) => first.number - second.number);
        offlineQuranReady = true;
        elements.offlineStatus.textContent = "القرآن والتفسير محفوظان على هذا الجهاز، ويمكن قراءتهما دون إنترنت.";
        populateReaderSurahs();
      } else if (metadata?.value === true) {
        elements.offlineStatus.textContent = "البيانات المحفوظة غير مكتملة. أعد تنزيل القرآن والتفسير قبل القراءة دون اتصال.";
      }
    } catch (error) {
      console.error("تعذّر استعادة القرآن والتفسير المحفوظين:", error);
      elements.offlineStatus.textContent = `${error.message} يمكنك متابعة الأذكار والسير المحفوظة داخل الموقع.`;
    }
  }

  async function saveOfflineQuran(surahsToSave) {
    const database = await openOfflineQuranDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(["surahs", "metadata"], "readwrite");
      const surahStore = transaction.objectStore("surahs");
      for (const surah of surahsToSave) surahStore.put(surah);
      transaction.objectStore("metadata").put({ key: "complete", value: true });
      transaction.addEventListener("complete", resolve, { once: true });
      transaction.addEventListener("abort", () => reject(transaction.error || new Error("تعذّر حفظ البيانات على هذا الجهاز.")), { once: true });
      transaction.addEventListener("error", () => reject(transaction.error || new Error("تعذّر حفظ البيانات على هذا الجهاز.")), { once: true });
    });
  }

  async function downloadOfflineQuran() {
    elements.downloadQuranButton.disabled = true;
    elements.offlineStatus.textContent = "جارٍ تنزيل نص القرآن والتفسير...";
    try {
      const [quranResponse, tafsirResponse] = await Promise.all([
        fetch("https://api.alquran.cloud/v1/quran/quran-uthmani"),
        fetch("https://api.alquran.cloud/v1/quran/ar.muyassar"),
      ]);
      if (!quranResponse.ok || !tafsirResponse.ok) {
        throw new Error("تعذّر الاتصال بمصدر القرآن والتفسير.");
      }

      const [quranResult, tafsirResult] = await Promise.all([
        quranResponse.json(),
        tafsirResponse.json(),
      ]);
      const quranData = quranResult.data?.surahs;
      const tafsirData = tafsirResult.data?.surahs;
      if (
        quranResult.code !== 200 ||
        tafsirResult.code !== 200 ||
        !Array.isArray(quranData) ||
        !Array.isArray(tafsirData) ||
        quranData.length !== 114 ||
        tafsirData.length !== 114
      ) {
        throw new Error("وصلت بيانات القرآن أو التفسير بتنسيق غير متوقع.");
      }

      const localSurahs = quranData.map((surah, index) => {
        const tafsirSurah = tafsirData[index];
        if (
          surah.number !== tafsirSurah.number ||
          !Array.isArray(surah.ayahs) ||
          !Array.isArray(tafsirSurah.ayahs) ||
          surah.ayahs.length !== tafsirSurah.ayahs.length
        ) {
          throw new Error(`تعذّر التحقق من تطابق سورة ${surah.name}.`);
        }
        return {
          number: surah.number,
          name: surah.name,
          ayahs: surah.ayahs.map((ayah, ayahIndex) => {
            const tafsirAyah = tafsirSurah.ayahs[ayahIndex];
            if (
              ayah.numberInSurah !== tafsirAyah.numberInSurah ||
              typeof ayah.text !== "string" ||
              typeof tafsirAyah.text !== "string" ||
              !Number.isInteger(ayah.page) ||
              ayah.page < 1 ||
              ayah.page > 604
            ) {
              throw new Error(`تعذّر التحقق من تطابق آيات سورة ${surah.name}.`);
            }
            return {
              numberInSurah: ayah.numberInSurah,
              text: ayah.text,
              tafsir: tafsirAyah.text,
              page: ayah.page,
            };
          }),
        };
      });

      await saveOfflineQuran(localSurahs);
      offlineSurahs = localSurahs;
      offlineQuranReady = true;
      elements.offlineStatus.textContent = "اكتمل الحفظ: القرآن الكريم وتفسير الميسّر متاحان الآن دون إنترنت.";
      populateReaderSurahs();
    } catch (error) {
      console.error("تعذّر تنزيل القرآن والتفسير للاستخدام دون إنترنت:", error);
      elements.offlineStatus.textContent = `${error.message} تحقّق من الاتصال والمساحة المتاحة ثم حاول مجددًا.`;
    } finally {
      elements.downloadQuranButton.disabled = false;
    }
  }

  function populateReaderSurahs() {
    elements.readerSurahSelect.replaceChildren();
    const availableSurahs = offlineQuranReady ? offlineSurahs : surahs;
    for (const surah of availableSurahs) {
      const id = offlineQuranReady ? surah.number : surah.id;
      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = `${surah.name} — ${id.toLocaleString("ar")}`;
      elements.readerSurahSelect.append(option);
    }
    elements.readerSurahSelect.disabled = availableSurahs.length === 0 || !offlineQuranReady;
    elements.mushafPageSelect.replaceChildren();
    if (offlineQuranReady) {
      for (let page = 1; page <= 604; page += 1) {
        const option = document.createElement("option");
        option.value = String(page);
        option.textContent = page.toLocaleString("ar");
        elements.mushafPageSelect.append(option);
      }
    }
    elements.mushafPageSelect.disabled = !offlineQuranReady;
    elements.mushafPrevious.disabled = !offlineQuranReady;
    elements.mushafNext.disabled = !offlineQuranReady;
    if (offlineQuranReady) {
      elements.mushafPageSelect.value = "1";
      renderMushafPage(1);
    } else if (surahs.length === 0) {
      elements.readerStatus.textContent = "حمّل القرآن والتفسير أولًا؛ يتطلب ذلك اتصالًا بالإنترنت لمرة واحدة.";
    } else {
      elements.readerStatus.textContent = "قائمة السور جاهزة. حمّل القرآن والتفسير لتقرأ دون إنترنت.";
    }
  }

  function renderMushafPage(pageNumber) {
    if (!offlineQuranReady || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 604) {
      elements.readerStatus.textContent = "صفحة المصحف غير متاحة. أعد تنزيل القرآن والتفسير.";
      return;
    }
    const pageAyahs = offlineSurahs.flatMap((surah) =>
      surah.ayahs
        .filter((ayah) => ayah.page === pageNumber)
        .map((ayah) => ({ ...ayah, surahNumber: surah.number, surahName: surah.name })),
    );
    if (pageAyahs.length === 0) {
      elements.readerStatus.textContent = "لم يُعثر على آيات لهذه الصفحة في التخزين المحلي.";
      return;
    }
    const fragment = document.createDocumentFragment();
    const tafsirFragment = document.createDocumentFragment();
    let currentSurahNumber = null;
    for (const ayah of pageAyahs) {
      if (ayah.surahNumber !== currentSurahNumber) {
        currentSurahNumber = ayah.surahNumber;
        const heading = document.createElement("h3");
        heading.className = "mushaf-surah-heading";
        heading.textContent = `سورة ${ayah.surahName}`;
        fragment.append(heading);
        if (ayah.numberInSurah === 1 && ayah.surahNumber !== 1 && ayah.surahNumber !== 9) {
          const basmala = document.createElement("p");
          basmala.className = "mushaf-basmala";
          basmala.textContent = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
          fragment.append(basmala);
        }
      }

      const verse = document.createElement("span");
      verse.className = "quran-verse";
      verse.append(document.createTextNode(`${ayah.text} `));

      const number = document.createElement("span");
      number.className = "verse-number";
      number.setAttribute("aria-label", `الآية ${ayah.numberInSurah}`);
      number.textContent = `۞ ${Number(ayah.numberInSurah).toLocaleString("ar")} `;
      verse.append(number);

      fragment.append(verse);

      const tafsir = document.createElement("article");
      tafsir.className = "tafsir-ayah";
      const tafsirHeading = document.createElement("h4");
      tafsirHeading.textContent = `${ayah.surahName} · الآية ${Number(ayah.numberInSurah).toLocaleString("ar")}`;
      const tafsirText = document.createElement("p");
      tafsirText.textContent = ayah.tafsir;
      tafsir.append(tafsirHeading, tafsirText);
      tafsirFragment.append(tafsir);
    }
    elements.quranVerses.replaceChildren(fragment);
    elements.pageTafsir.replaceChildren(tafsirFragment);
    elements.pageTafsir.hidden = !elements.tafsirToggle.checked;
    elements.readerSurahSelect.value = String(pageAyahs[0].surahNumber);
    elements.mushafPageSelect.value = String(pageNumber);
    elements.mushafPrevious.disabled = pageNumber <= 1;
    elements.mushafNext.disabled = pageNumber >= 604;
    elements.readerStatus.textContent = `صفحة ${pageNumber.toLocaleString("ar")} من ٦٠٤ · ${pageAyahs.length.toLocaleString("ar")} آية`;
  }
function selectReciter(reciter) {
  const moshafs = (reciter.moshaf || []).filter(
    (moshaf) => moshaf.server && moshaf.surah_list,
  );
  if (moshafs.length === 0) {
    elements.playerStatus.textContent = "لا توجد تلاوات متاحة لهذا القارئ.";
    return false;
  }

  playbackRequestId += 1;
  selectedReciter = reciter;
  elements.currentReciter.textContent = reciter.name;
  elements.playerStatus.textContent = "اختر سورة للاستماع";
  elements.audio.pause();
  elements.audio.removeAttribute("src");
  releaseOfflineAudioUrl();

  elements.moshafSelect.replaceChildren();
  for (const moshaf of moshafs) {
    const option = document.createElement("option");
    option.value = String(moshaf.id);
    option.textContent = moshaf.name;
    elements.moshafSelect.append(option);
  }
  elements.moshafSelect.disabled = false;
  selectedMoshaf = moshafs[0];
  elements.moshafSelect.value = String(selectedMoshaf.id);
  renderReciters();
  renderAllReciters();
  renderSurahs();
  if (selectedSurah) {
    if (selectedMoshaf.surah_list.split(",").includes(String(selectedSurah.id))) {
      selectSurah(selectedSurah);
    } else {
      elements.playerStatus.textContent = "السورة المختارة غير متاحة لهذا القارئ.";
    }
  } else {
    elements.currentSurah.textContent = "اختر سورة";
  }
  return true;
}

function selectSurah(surah) {
  if (!selectedReciter || !selectedMoshaf) {
    selectedSurah = surah;
    elements.currentSurah.textContent = surah.name;
    elements.surahType.textContent = surah.type || "القرآن الكريم";
    elements.playerStatus.textContent = "اختر قارئًا من القائمة لبدء التلاوة.";
    renderSurahs();
    return;
  }
  if (!selectedMoshaf.surah_list.split(",").includes(String(surah.id))) {
    elements.playerStatus.textContent = "هذه السورة غير متاحة بهذه الرواية.";
    return;
  }

  selectedSurah = surah;
  fallbackAttempted = selectedMoshaf.id === SAYYED_SAEED_MOSHAF_ID;
  elements.currentSurah.textContent = surah.name;
  elements.surahType.textContent = surah.type || "القرآن الكريم";
  elements.playerStatus.textContent = `جارٍ تجهيز ${surah.name} بصوت ${selectedReciter.name}`;
  playCurrentSurah();
  renderSurahs();
}

function audioUrlFor(moshaf, surah) {
  const server = moshaf.server.trim().replace(/^http:/i, "https:");
  const serverBase = server.endsWith("/") ? server : `${server}/`;
  return new URL(`${String(surah.id).padStart(3, "0")}.mp3`, serverBase).href;
}

async function playCurrentSurah() {
  if (!selectedSurah || !selectedMoshaf) return;
  const requestId = ++playbackRequestId;
  elements.audio.pause();
  let savedAudio = null;
  try {
    savedAudio = await readOfflineAudio(
      offlineAudioId(selectedReciter.id, selectedMoshaf.id, selectedSurah.id),
    );
  } catch (error) {
    console.error("تعذّر فحص النسخة المحفوظة من التلاوة:", error);
  }
  if (requestId !== playbackRequestId) return;

  if (!savedAudio && !selectedMoshaf.server) {
    elements.playerStatus.textContent = "الملف المحفوظ غير متاح؛ اتصل بالإنترنت لتنزيله من جديد.";
    return;
  }
  const source = savedAudio
    ? URL.createObjectURL(savedAudio.audio)
    : audioUrlFor(selectedMoshaf, selectedSurah);
  setAudioSource(source, Boolean(savedAudio));
  if (savedAudio) {
    elements.playerStatus.textContent = "تشغيل التلاوة المحفوظة دون إنترنت.";
  } else {
    elements.playerStatus.textContent = "جارٍ تحميل التلاوة عبر الإنترنت...";
  }
  elements.audio.play().catch((error) => {
    if (error.name === "NotAllowedError") {
      elements.playerStatus.textContent = "اضغط تشغيل لبدء التلاوة.";
    } else if (error.name !== "AbortError") {
      elements.playerStatus.textContent = savedAudio
        ? "تعذّر تشغيل التلاوة المحفوظة."
        : "تعذّر بدء التلاوة. جرّب مصدرًا آخر أو تحقّق من اتصالك.";
    }
  });
}

function selectSayyedSaeed() {
  const reciter = ensureSayyedSaeedFallback();
  if (!selectReciter(reciter)) return;
  pendingFeaturedPlayback = true;
  const firstSurahId = selectedMoshaf.surah_list.split(",")[0].trim();
  const firstSurah = surahs.find((surah) => String(surah.id) === firstSurahId);
  if (firstSurah) {
    pendingFeaturedPlayback = false;
    selectSurah(firstSurah);
  } else {
    elements.playerStatus.textContent = "تم اختيار الشيخ السيد سعيد. جارٍ تحميل قائمة السور...";
  }
  document
    .querySelector(".player-card")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

async function loadReciters() {
  elements.reciterList.innerHTML =
    '<div class="sidebar-loading"><span class="spinner"></span> جاري تحميل القرّاء</div>';
  try {
    const data = await fetchJson("reciters?language=ar");
    if (!Array.isArray(data.reciters)) {
      throw new Error("لم تصل قائمة القرّاء بالتنسيق المتوقع.");
    }
    reciters = data.reciters;
    ensureSayyedSaeedFallback();
    renderReciters();
    renderAllReciters();
    populateAudioReciters();
  } catch (error) {
    ensureSayyedSaeedFallback();
    renderReciters();
    renderAllReciters();
    populateAudioReciters();
    showError(
      elements.reciterList,
      `تعذّر تحميل القرّاء: ${error.message}`,
      loadReciters,
    );
    showError(
      elements.allReciterList,
      `تعذّر تحميل قائمة القرّاء: ${error.message}`,
      loadReciters,
    );
  }
}

async function loadSurahs() {
  elements.surahList.innerHTML =
    '<div class="loading-card"><span class="spinner"></span> جاري تحميل سور القرآن الكريم</div>';
  try {
    const data = await fetchJson("suwar?language=ar");
    if (!Array.isArray(data.suwar)) {
      throw new Error("لم تصل قائمة السور بالتنسيق المتوقع.");
    }
    surahs = data.suwar;
    elements.surahCount.textContent = `(${surahs.length.toLocaleString("ar")} سورة)`;
    populateAudioSurahs();
    populateReaderSurahs();
    renderSurahs();
    if (pendingFeaturedPlayback && isSayyedSaeed(selectedReciter)) {
      const firstSurahId = selectedMoshaf?.surah_list.split(",")[0].trim();
      const firstSurah = surahs.find((surah) => String(surah.id) === firstSurahId);
      if (firstSurah) {
        pendingFeaturedPlayback = false;
        selectSurah(firstSurah);
      }
    }
  } catch (error) {
    showError(
      elements.surahList,
      `تعذّر تحميل السور: ${error.message}`,
      loadSurahs,
    );
    populateReaderSurahs();
  }
}

elements.reciterSearch.addEventListener("input", renderReciters);
elements.allReciterSearch.addEventListener("input", renderAllReciters);
elements.surahSearch.addEventListener("input", renderSurahs);
elements.audioReciterSelect.addEventListener("change", populateAudioMoshafs);
elements.audioMoshafSelect.addEventListener("change", populateAudioSurahs);
elements.audioSurahSelect.addEventListener("change", updateAudioDownloadControls);
elements.audioDownloadButton.addEventListener("click", downloadSelectedAudio);
elements.sayyedSaeedShortcut.addEventListener("click", selectSayyedSaeed);
elements.mushafPageSelect.addEventListener("change", () => {
  renderMushafPage(Number(elements.mushafPageSelect.value));
});
elements.mushafPrevious.addEventListener("click", () => {
  renderMushafPage(Number(elements.mushafPageSelect.value) - 1);
});
elements.mushafNext.addEventListener("click", () => {
  renderMushafPage(Number(elements.mushafPageSelect.value) + 1);
});
elements.readerSurahSelect.addEventListener("change", () => {
  const surah = offlineSurahs.find((item) => item.number === Number(elements.readerSurahSelect.value));
  const firstAyah = surah?.ayahs[0];
  if (firstAyah) renderMushafPage(firstAyah.page);
});
elements.tafsirToggle.addEventListener("change", () => {
  elements.pageTafsir.hidden = !elements.tafsirToggle.checked;
});
elements.downloadQuranButton.addEventListener("click", downloadOfflineQuran);
elements.tasbeehCountButton.addEventListener("click", () => {
  currentTasbeehCount += 1;
  saveTasbeehState();
});
elements.tasbeehReset.addEventListener("click", () => {
  currentTasbeehCount = 0;
  saveTasbeehState();
});
elements.tasbeehPhrase.addEventListener("change", () => {
  currentTasbeehCount = tasbeehCounts[elements.tasbeehPhrase.value] || 0;
  saveTasbeehState();
});
elements.nextHadith.addEventListener("click", renderHadith);

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  elements.browserThemeColor.content = isDark ? "#121a16" : "#102a24";
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  elements.themeToggle.setAttribute(
    "aria-label",
    isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن",
  );
  elements.themeToggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
  elements.themeToggle.querySelector(".theme-toggle-label").textContent = isDark
    ? "الوضع الفاتح"
    : "الوضع الداكن";

  if (persist) {
    try {
      localStorage.setItem("wird-theme", isDark ? "dark" : "light");
    } catch (error) {
      console.error("تعذّر حفظ تفضيل المظهر:", error);
    }
  }
}

function restoreTheme() {
  try {
    const savedTheme = localStorage.getItem("wird-theme");
    applyTheme(savedTheme === "dark" ? "dark" : "light");
  } catch (error) {
    console.error("تعذّرت استعادة تفضيل المظهر:", error);
    applyTheme("light");
  }
}

elements.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});
restoreTheme();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("تعذّر تفعيل وضع الموقع دون إنترنت:", error);
  });
}

function applySidebarState(isCollapsed, persist = false) {
  document.querySelector(".app-shell").classList.toggle("sidebar-collapsed", isCollapsed);
  elements.sidebar.inert = isCollapsed;
  elements.sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  elements.sidebarToggle.setAttribute(
    "aria-label",
    isCollapsed ? "إظهار القائمة الجانبية" : "طيّ القائمة الجانبية",
  );
  elements.sidebarToggle.querySelector(".sidebar-toggle-icon").textContent = isCollapsed ? "⇤" : "⇥";
  elements.sidebarToggle.querySelector(".sidebar-toggle-label").textContent = isCollapsed
    ? "إظهار القائمة"
    : "طيّ القائمة";

  if (persist) {
    try {
      localStorage.setItem("wird-sidebar-collapsed", String(isCollapsed));
    } catch (error) {
      console.error("تعذّر حفظ تفضيل القائمة الجانبية:", error);
    }
  }
}

function restoreSidebarState() {
  try {
    applySidebarState(localStorage.getItem("wird-sidebar-collapsed") === "true");
  } catch (error) {
    console.error("تعذّرت استعادة تفضيل القائمة الجانبية:", error);
    applySidebarState(false);
  }
}

elements.sidebarToggle.addEventListener("click", () => {
  const isCollapsed = !document.querySelector(".app-shell").classList.contains("sidebar-collapsed");
  applySidebarState(isCollapsed, true);
});
restoreSidebarState();

function activateView(viewId, updateHistory = false) {
  viewId = viewId.split("?")[0];
  const targetView = document.getElementById(viewId);
  if (!targetView?.classList.contains("app-view")) return;

  document.querySelectorAll(".app-view").forEach((view) => {
    const isActive = view === targetView;
    view.hidden = !isActive;
    view.classList.toggle("active", isActive);
  });

  const navigationViewId = viewId === "competition-game-page" ? "competition" : viewId;
  document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
    const isActive = link.dataset.view === navigationViewId;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const activeLink = document.querySelector(`.side-nav .nav-link[data-view="${navigationViewId}"]`);
  const title = activeLink?.dataset.viewTitle ||
    targetView.querySelector("h2")?.textContent.trim() ||
    "استمع الآن";
  document.querySelector("#current-view-title").textContent = title;

  if (updateHistory && window.location.hash !== `#${viewId}`) {
    window.history.pushState(null, "", `#${viewId}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    activateView(link.dataset.view, true);
  });
});

window.addEventListener("hashchange", () => {
  activateView(window.location.hash.slice(1) || "listen");
});
window.addEventListener("popstate", () => {
  activateView(window.location.hash.slice(1) || "listen");
});
activateView(window.location.hash.slice(1) || "listen");

elements.moshafSelect.addEventListener("change", () => {
  if (!selectedReciter) return;
  const moshaf = selectedReciter.moshaf.find(
    (item) => String(item.id) === elements.moshafSelect.value,
  );
  if (!moshaf) return;
  playbackRequestId += 1;
  selectedMoshaf = moshaf;
  elements.audio.pause();
  elements.audio.removeAttribute("src");
  releaseOfflineAudioUrl();
  renderSurahs();
  if (selectedSurah && selectedMoshaf.surah_list.split(",").includes(String(selectedSurah.id))) {
    selectSurah(selectedSurah);
  } else if (selectedSurah) {
    elements.currentSurah.textContent = selectedSurah.name;
    elements.playerStatus.textContent = "السورة المختارة غير متاحة بهذه الرواية.";
  } else {
    elements.currentSurah.textContent = "اختر سورة";
    elements.playerStatus.textContent = "اختر سورة للاستماع";
  }
});

elements.audio.addEventListener("playing", () => {
  elements.playerStatus.textContent = activeOfflineAudioUrl
    ? `تلاوة ${selectedSurah?.name || ""} بصوت ${selectedReciter?.name || ""} · دون إنترنت`
    : `تلاوة ${selectedSurah?.name || ""} بصوت ${selectedReciter?.name || ""}`;
});
elements.audio.addEventListener("waiting", () => {
  elements.playerStatus.textContent = "جارٍ تحميل التلاوة...";
});
elements.audio.addEventListener("canplay", () => {
  if (elements.audio.paused) {
    elements.playerStatus.textContent = "التلاوة جاهزة. اضغط تشغيل.";
  }
});
elements.audio.addEventListener("error", () => {
  if (!elements.audio.currentSrc || !selectedSurah || !selectedMoshaf) return;
  if (activeOfflineAudioUrl) {
    elements.playerStatus.textContent = "تعذّر قراءة ملف التلاوة المحفوظ؛ أعد تنزيل السورة.";
    return;
  }
  if (
    isSayyedSaeed(selectedReciter) &&
    !fallbackAttempted &&
    selectedMoshaf.id !== SAYYED_SAEED_MOSHAF_ID
  ) {
    fallbackAttempted = true;
    selectedMoshaf = selectedReciter.moshaf.find(
      (moshaf) => moshaf.id === SAYYED_SAEED_MOSHAF_ID,
    );
    if (selectedMoshaf) {
      elements.moshafSelect.value = String(selectedMoshaf.id);
      elements.playerStatus.textContent = "المصدر الأول لا يستجيب؛ نجرب مصدرًا احتياطيًا...";
      playCurrentSurah();
      renderSurahs();
      return;
    }
  }
  elements.playerStatus.textContent = "تعذّر تحميل التلاوة من المصدر. تحقّق من اتصالك أو اختر رواية أخرى.";
});

loadReciters();
loadSurahs();
restoreOfflineQuran();
refreshOfflineAudioLibrary();
renderAdhkar();
loadTasbeehState();
renderHadith();
renderProphetStories();
