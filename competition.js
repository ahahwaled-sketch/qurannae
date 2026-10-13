import { supabaseConfig, supabaseConfigured } from "./supabase-config.js";

const QUESTIONS = [
  { category: "العبادات", question: "كم عدد الصلوات المفروضة في اليوم والليلة؟", answers: ["ثلاث", "أربع", "خمس", "ست"], correct: 2 },
  { category: "العبادات", question: "إلى أي جهة يتوجه المسلمون في الصلاة؟", answers: ["المسجد النبوي", "المسجد الأقصى", "الكعبة المشرفة", "جبل عرفات"], correct: 2 },
  { category: "القرآن الكريم", question: "كم عدد سور القرآن الكريم؟", answers: ["112 سورة", "113 سورة", "114 سورة", "115 سورة"], correct: 2 },
  { category: "معلومات إسلامية", question: "من أول الخلفاء الراشدين؟", answers: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان"], correct: 2 },
  { category: "العبادات", question: "في أي شهر يصوم المسلمون؟", answers: ["شعبان", "رمضان", "شوال", "محرم"], correct: 1 },
  { category: "القرآن الكريم", question: "ما أطول سورة في القرآن الكريم؟", answers: ["آل عمران", "البقرة", "النساء", "المائدة"], correct: 1 },
  { category: "القرآن الكريم", question: "ما السورة التي لا تبدأ بالبسملة؟", answers: ["الأنفال", "التوبة", "يونس", "هود"], correct: 1 },
  { category: "القرآن الكريم", question: "في أي سورة توجد آية الكرسي؟", answers: ["آل عمران", "البقرة", "النساء", "المائدة"], correct: 1 },
  { category: "الأنبياء", question: "من النبي الذي ابتلعه الحوت؟", answers: ["أيوب عليه السلام", "يونس عليه السلام", "إدريس عليه السلام", "هود عليه السلام"], correct: 1 },
  { category: "الأنبياء", question: "من النبي الذي أُرسل إلى قوم عاد؟", answers: ["صالح عليه السلام", "شعيب عليه السلام", "هود عليه السلام", "لوط عليه السلام"], correct: 2 },
  { category: "القرآن الكريم", question: "كم عدد أجزاء القرآن الكريم؟", answers: ["20 جزءًا", "25 جزءًا", "30 جزءًا", "40 جزءًا"], correct: 2 },
  { category: "الأنبياء", question: "من النبي الذي آتاه الله الزبور؟", answers: ["سليمان عليه السلام", "داود عليه السلام", "عيسى عليه السلام", "إبراهيم عليه السلام"], correct: 1 },
  { category: "السيرة النبوية", question: "ما اسم الغار الذي نزل فيه الوحي أول مرة؟", answers: ["غار ثور", "غار حراء", "غار أحد", "غار النور"], correct: 1 },
  { category: "السيرة النبوية", question: "إلى أي مدينة هاجر النبي ﷺ؟", answers: ["الطائف", "خيبر", "المدينة المنورة", "دمشق"], correct: 2 },
  { category: "الحديث الشريف", question: "بماذا تبدأ الأعمال بحسب الحديث النبوي؟", answers: ["بالأقوال", "بالنيات", "بالأموال", "بالأنساب"], correct: 1 },
];

const MAX_PLAYERS = 2;
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const clientId = typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : createClientId();

function createClientId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const ui = {
  name: document.querySelector("#competition-name"),
  roomCode: document.querySelector("#competition-room-code"),
  createRoom: document.querySelector("#competition-create-room"),
  joinRoom: document.querySelector("#competition-join-room"),
  returnRoom: document.querySelector("#competition-return-room"),
  lobby: document.querySelector(".competition-lobby"),
  status: document.querySelector("#competition-status"),
  gameStatus: document.querySelector("#competition-game-status"),
  room: document.querySelector("#competition-room"),
  roomTitle: document.querySelector("#competition-room-title"),
  roomCodeDisplay: document.querySelector("#competition-room-code-display"),
  copyInvite: document.querySelector("#competition-copy-invite"),
  whatsapp: document.querySelector("#competition-whatsapp"),
  playerCount: document.querySelector("#competition-player-count"),
  players: document.querySelector("#competition-players"),
  start: document.querySelector("#competition-start"),
  leave: document.querySelector("#competition-leave"),
  game: document.querySelector("#competition-game"),
  level: document.querySelector("#competition-level"),
  levelCount: document.querySelector("#competition-level-count"),
  levelSteps: [...document.querySelectorAll("[data-level-step]")],
  scoreboard: document.querySelector("#competition-scoreboard"),
  questionCategory: document.querySelector("#competition-question-category"),
  question: document.querySelector("#competition-question"),
  answers: document.querySelector("#competition-answers"),
  answerStatus: document.querySelector("#competition-answer-status"),
  reveal: document.querySelector("#competition-reveal"),
  next: document.querySelector("#competition-next"),
  results: document.querySelector("#competition-results"),
  leaderboard: document.querySelector("#competition-leaderboard"),
  leaveResults: document.querySelector("#competition-leave-results"),
};

let supabase;
let supabaseClientPromise;
let channel;
let roomCode = null;
let role = null;
let hostClientId = null;
let gameState = null;
let waitingForRoomState = false;
let roomActionPending = false;
let joinRetryTimer = null;

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.classList.toggle("is-error", isError);
  ui.gameStatus.textContent = message;
  ui.gameStatus.classList.toggle("is-error", isError);
}

function navigateToCompetitionPage(viewId) {
  const currentView = window.location.hash.slice(1).split("?")[0];
  if (currentView !== viewId) window.location.hash = viewId;
}

function normalizeRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function getInvitationRoomCode() {
  const hashQuery = window.location.hash.split("?")[1] || "";
  return normalizeRoomCode(new URLSearchParams(hashQuery).get("room") || "");
}

function makeRoomCode() {
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => ROOM_CODE_CHARACTERS[value % ROOM_CODE_CHARACTERS.length]).join("");
}

async function getSupabaseClient() {
  if (supabase) return supabase;
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => {
        supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey);
        return supabase;
      })
      .catch((error) => {
        supabaseClientPromise = null;
        throw error;
      });
  }
  return supabaseClientPromise;
}

function getInviteUrl(code) {
  const url = new URL(window.location.href);
  url.hash = `competition?room=${encodeURIComponent(code)}`;
  return url.href;
}

function makeInitialState(hostName) {
  return {
    status: "lobby",
    questionIndex: 0,
    players: [{ id: clientId, name: hostName }],
    scores: [0, 0],
    answers: [null, null],
    revealed: false,
  };
}

async function send(event, payload) {
  if (!channel) throw new Error("لا يوجد اتصال بغرفة المسابقة.");
  const result = await channel.send({
    type: "broadcast",
    event,
    payload: { sender: clientId, ...payload },
  });
  if (result !== "ok") throw new Error("تعذّر إرسال التحديث للضيف الآخر. تحقّق من الاتصال وحاول مجددًا.");
}

function leaveChannel() {
  if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
  joinRetryTimer = null;
  if (channel && supabase) supabase.removeChannel(channel);
  channel = null;
  roomCode = null;
  role = null;
  hostClientId = null;
  gameState = null;
  waitingForRoomState = false;
  ui.room.hidden = true;
  ui.game.hidden = true;
  ui.results.hidden = true;
  ui.lobby.hidden = false;
}

function renderRoom() {
  if (!roomCode || !gameState) return;
  const players = gameState.players || [];
  ui.room.hidden = false;
  ui.roomTitle.textContent = `غرفة ${roomCode}`;
  ui.roomCodeDisplay.textContent = roomCode;
  ui.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`انضم إلى مسابقة الأسئلة الدينية عبر هذا الرابط: ${getInviteUrl(roomCode)}`)}`;
  ui.playerCount.textContent = `(${players.length} / ${MAX_PLAYERS})`;
  ui.players.replaceChildren();

  players.forEach((player, index) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = player.name;
    item.append(name);
    ui.players.append(item);
  });

  ui.start.hidden = role !== "host" || gameState.status !== "lobby";
  ui.start.disabled = players.length !== MAX_PLAYERS || roomActionPending;
  ui.leave.textContent = "مغادرة الغرفة";

  if (gameState.status === "lobby") {
    ui.game.hidden = true;
    ui.results.hidden = true;
    navigateToCompetitionPage("competition");
    setStatus(players.length < MAX_PLAYERS
      ? "أرسل رابط الدعوة وانتظر انضمام الضيف الثاني."
      : "الضيفان جاهزان؛ ابدأوا المسابقة.");
  } else if (gameState.status === "finished") {
    ui.game.hidden = true;
    renderResults();
    navigateToCompetitionPage("competition-game-page");
    setStatus("انتهت المسابقة.");
  } else {
    ui.results.hidden = true;
    renderQuestion();
    navigateToCompetitionPage("competition-game-page");
    setStatus("المسابقة جارية — أجيبا عن السؤال.");
  }
}

function renderQuestion() {
  if (!gameState || gameState.status !== "playing") return;
  const question = QUESTIONS[gameState.questionIndex];
  if (!question) return;

  ui.game.hidden = false;
  const index = gameState.questionIndex;
  const difficultyIndex = Math.floor(index / 5);
  const difficulty = ["تمهيدي", "متوسط", "متقدم"][difficultyIndex];
  const players = gameState.players;
  const ownIndex = players.findIndex((player) => player.id === clientId);
  ui.level.textContent = difficulty;
  ui.level.className = `competition-level-badge level-${difficultyIndex + 1}`;
  ui.levelCount.textContent = `السؤال ${index + 1} من ${QUESTIONS.length}`;
  ui.levelSteps.forEach((step, stepIndex) => {
    step.classList.toggle("is-current", stepIndex === difficultyIndex);
    step.classList.toggle("is-complete", stepIndex < difficultyIndex);
    if (stepIndex === difficultyIndex) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  ui.scoreboard.replaceChildren();
  players.forEach((player, playerIndex) => {
    const scoreCard = document.createElement("div");
    scoreCard.className = `competition-score${playerIndex === ownIndex ? " is-self" : ""}`;
    const name = document.createElement("span");
    name.className = "competition-score-name";
    name.textContent = player.name;
    const score = document.createElement("strong");
    score.textContent = `${gameState.scores[playerIndex].toLocaleString("ar")} نقطة`;
    scoreCard.append(name, score);
    ui.scoreboard.append(scoreCard);
  });
  ui.questionCategory.textContent = question.category;
  ui.question.textContent = question.question;
  ui.answers.replaceChildren();

  const ownAnswer = ownIndex >= 0 ? gameState.answers[ownIndex] : null;
  const hasAnswered = ownAnswer !== null;
  ui.answerStatus.textContent = gameState.revealed
    ? "أجاب الضيفان. راجعا الإجابة قبل الانتقال."
    : hasAnswered
      ? "تم تسجيل إجابتك. انتظر إجابة الضيف الآخر."
      : "اختر إجابتك.";

  question.answers.forEach((answer, answerIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "competition-answer";
    button.textContent = answer;
    button.disabled = hasAnswered || gameState.revealed || ownIndex < 0;
    if (gameState.revealed && answerIndex === question.correct) button.classList.add("correct");
    if (gameState.revealed && ownAnswer === answerIndex && answerIndex !== question.correct) {
      button.classList.add("incorrect");
    }
    if (ownAnswer === answerIndex) button.classList.add("chosen");
    button.addEventListener("click", () => submitAnswer(answerIndex));
    ui.answers.append(button);
  });

  ui.reveal.hidden = !gameState.revealed;
  if (gameState.revealed) {
    const explanation = document.createElement("p");
    explanation.textContent = `الإجابة الصحيحة: ${question.answers[question.correct]}`;
    ui.reveal.replaceChildren(explanation);
  } else {
    ui.reveal.replaceChildren();
  }

  ui.next.hidden = role !== "host" || !gameState.revealed;
  ui.next.disabled = roomActionPending;
  ui.next.textContent = index === QUESTIONS.length - 1 ? "عرض النتيجة" : "السؤال التالي";
}

async function broadcastState() {
  if (role === "host" && gameState) {
    await send("state", { state: gameState });
  }
}

async function handleMessage(event, received) {
  const payload = received?.payload && typeof received.payload === "object"
    ? received.payload
    : received;
  const message = { ...payload, event };
  if (!message || message.sender === clientId) return;

  if (role === "host" && message.event === "join") {
    if (gameState.status !== "lobby") {
      await send("room-error", { target: message.sender, message: "بدأت المسابقة ولا يمكن الانضمام الآن." });
      return;
    }
    if (gameState.players.some((player) => player.id === message.sender)) {
      await broadcastState();
      return;
    }
    if (gameState.players.length >= MAX_PLAYERS) {
      await send("room-error", { target: message.sender, message: "الغرفة مكتملة." });
      return;
    }
    if (typeof message.name !== "string" || !message.name.trim()) {
      await send("room-error", { target: message.sender, message: "أدخل اسمك ثم حاول الانضمام مجددًا." });
      return;
    }
    gameState.players.push({ id: message.sender, name: message.name });
    await broadcastState();
    renderRoom();
    return;
  }

  if (role === "host" && message.event === "answer") {
    const playerIndex = gameState.players.findIndex((player) => player.id === message.sender);
    if (
      playerIndex < 0 ||
      gameState.status !== "playing" ||
      gameState.revealed ||
      gameState.answers[playerIndex] !== null ||
      !Number.isInteger(message.choice) ||
      message.choice < 0 ||
      message.choice > 3
    ) return;

    gameState.answers[playerIndex] = message.choice;
    if (message.choice === QUESTIONS[gameState.questionIndex].correct) {
      gameState.scores[playerIndex] += 100;
    }
    gameState.revealed = gameState.answers.every((answer) => answer !== null);
    await broadcastState();
    renderRoom();
    return;
  }

  if (role === "guest" && message.event === "state" && message.sender !== clientId) {
    if (hostClientId && message.sender !== hostClientId) return;
    hostClientId ||= message.sender;
    if (!message.state || !Array.isArray(message.state.players)) return;
    if (!message.state.players.some((player) => player.id === clientId)) return;
    if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
    joinRetryTimer = null;
    gameState = message.state;
    waitingForRoomState = false;
    renderRoom();
    return;
  }

  if (role === "guest" && message.event === "room-error" && message.target === clientId) {
    if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
    joinRetryTimer = null;
    waitingForRoomState = false;
    setStatus(message.message || "تعذّر الانضمام إلى الغرفة.", true);
  }
}

function requestRoomJoin(code, name, attempt = 1) {
  if (!waitingForRoomState || roomCode !== code) return;
  send("join", { name })
    .then(() => {
      setStatus(`طلب الانضمام أُرسل (${attempt}/5). جارٍ انتظار صاحب الغرفة...`);
    })
    .catch((error) => setStatus(error.message, true));

  if (attempt < 5) {
    joinRetryTimer = window.setTimeout(() => requestRoomJoin(code, name, attempt + 1), 2000);
  } else {
    joinRetryTimer = window.setTimeout(() => {
      if (waitingForRoomState && roomCode === code) {
        setStatus("لم يصل رد من الغرفة. تأكد أن صاحبها أبقى الصفحة مفتوحة ثم حاول الانضمام مجددًا.", true);
      }
    }, 2000);
  }
}

function connectRoom(code, nextRole, name) {
  if (!supabase) throw new Error("تعذّر تهيئة خدمة الغرف. أعد المحاولة.");
  leaveChannel();
  roomCode = code;
  role = nextRole;
  waitingForRoomState = nextRole === "guest";
  ui.lobby.hidden = true;
  ui.room.hidden = false;
  ui.roomTitle.textContent = `غرفة ${code}`;
  ui.roomCodeDisplay.textContent = code;
  setStatus("جارٍ الاتصال بغرفة المسابقة...");

  channel = supabase.channel(`wird-${code}`, {
    config: { broadcast: { self: false, ack: true } },
  });
  for (const event of ["join", "answer", "state", "room-error"]) {
    channel.on("broadcast", { event }, (message) => {
      handleMessage(event, message).catch((error) => setStatus(error.message || "تعذّر تحديث غرفة المسابقة.", true));
    });
  }
  channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        if (nextRole === "host") {
          hostClientId = clientId;
          gameState = makeInitialState(name);
          renderRoom();
        } else {
          requestRoomJoin(code, name);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus(`تعذّر الاتصال بخدمة الغرف: ${error?.message || status}`, true);
      }
  });
}

async function startRoom() {
  const name = ui.name.value.trim().slice(0, 24);
  if (!name) {
    ui.name.focus();
    setStatus("اكتب اسمك أولًا.", true);
    return;
  }
  try {
    setStatus("جارٍ تجهيز خدمة الغرف...");
    await getSupabaseClient();
    connectRoom(makeRoomCode(), "host", name);
  } catch (error) {
    setStatus(`تعذّر تجهيز خدمة الغرف: ${error.message || "تحقّق من اتصال الإنترنت ثم أعد المحاولة."}`, true);
  }
}

async function joinRoom() {
  const name = ui.name.value.trim().slice(0, 24);
  const code = normalizeRoomCode(ui.roomCode.value);
  ui.roomCode.value = code;
  if (!name) {
    ui.name.focus();
    setStatus("اكتب اسمك أولًا.", true);
    return;
  }
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    ui.roomCode.focus();
    setStatus("أدخل رمز غرفة صحيحًا من 6 أحرف أو أرقام.", true);
    return;
  }
  try {
    setStatus("جارٍ تجهيز خدمة الغرف...");
    await getSupabaseClient();
    connectRoom(code, "guest", name);
  } catch (error) {
    setStatus(`تعذّر تجهيز خدمة الغرف: ${error.message || "تحقّق من اتصال الإنترنت ثم أعد المحاولة."}`, true);
  }
}

function startGame() {
  if (role !== "host" || gameState?.players.length !== MAX_PLAYERS || gameState.status !== "lobby") return;
  const previousState = structuredClone(gameState);
  gameState.status = "playing";
  gameState.questionIndex = 0;
  gameState.scores = [0, 0];
  gameState.answers = [null, null];
  gameState.revealed = false;
  broadcastState()
    .then(renderRoom)
    .catch((error) => {
      gameState = previousState;
      setStatus(error.message, true);
      renderRoom();
    });
}

async function submitAnswer(choice) {
  if (!gameState || gameState.revealed) return;
  const ownIndex = gameState.players.findIndex((player) => player.id === clientId);
  if (ownIndex < 0 || gameState.answers[ownIndex] !== null) return;
  if (role === "host") {
    const previousScore = gameState.scores[ownIndex];
    gameState.answers[ownIndex] = choice;
    if (choice === QUESTIONS[gameState.questionIndex].correct) gameState.scores[ownIndex] += 100;
    gameState.revealed = gameState.answers.every((answer) => answer !== null);
    try {
      await broadcastState();
      renderRoom();
    } catch (error) {
      gameState.answers[ownIndex] = null;
      gameState.scores[ownIndex] = previousScore;
      gameState.revealed = false;
      setStatus(error.message, true);
    }
  } else {
    try {
      await send("answer", { choice });
      gameState.answers[ownIndex] = choice;
      renderQuestion();
    } catch (error) {
      setStatus(error.message, true);
    }
  }
}

async function nextQuestion() {
  if (role !== "host" || !gameState?.revealed || roomActionPending) return;
  roomActionPending = true;
  const previousState = structuredClone(gameState);
  try {
    if (gameState.questionIndex === QUESTIONS.length - 1) {
      gameState.status = "finished";
    } else {
      gameState.questionIndex += 1;
      gameState.answers = [null, null];
      gameState.revealed = false;
    }
    await broadcastState();
    renderRoom();
  } catch (error) {
    gameState = previousState;
    setStatus(error.message || "تعذّر الانتقال للسؤال التالي.", true);
  } finally {
    roomActionPending = false;
    renderRoom();
  }
}

function renderResults() {
  ui.results.hidden = false;
  ui.leaderboard.replaceChildren();
  gameState.players
    .map((player, index) => ({ ...player, score: gameState.scores[index] }))
    .sort((first, second) => second.score - first.score)
    .forEach((player, index) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = `${index + 1}. ${player.name}`;
      const score = document.createElement("strong");
      score.textContent = `${player.score} نقطة`;
      item.append(name, score);
      ui.leaderboard.append(item);
    });
}

async function returnToLobby() {
  if (channel && supabase) await supabase.removeChannel(channel);
  channel = null;
  roomCode = null;
  role = null;
  hostClientId = null;
  gameState = null;
  ui.room.hidden = true;
  ui.game.hidden = true;
  ui.results.hidden = true;
  ui.lobby.hidden = false;
  setStatus("");
  navigateToCompetitionPage("competition");
}

function setup() {
  if (!supabaseConfigured) {
    setStatus("أضف رابط مشروع Supabase ومفتاحه العام إلى supabase-config.js لتفعيل الغرف بين الأجهزة.", true);
    ui.createRoom.disabled = true;
    ui.joinRoom.disabled = true;
    return;
  }

  ui.createRoom.addEventListener("click", startRoom);
  ui.joinRoom.addEventListener("click", joinRoom);
  ui.roomCode.addEventListener("input", () => {
    ui.roomCode.value = normalizeRoomCode(ui.roomCode.value);
  });
  ui.roomCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });
  ui.start.addEventListener("click", startGame);
  ui.next.addEventListener("click", nextQuestion);
  ui.leave.addEventListener("click", returnToLobby);
  ui.leaveResults.addEventListener("click", returnToLobby);
  ui.returnRoom.addEventListener("click", () => navigateToCompetitionPage("competition"));
  ui.copyInvite.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(roomCode));
      setStatus("نُسخ رابط الدعوة. أرسله إلى صديقك.");
    } catch {
      setStatus("تعذّر النسخ التلقائي. انسخ الرابط من شريط العنوان.", true);
    }
  });

  const invitationCode = getInvitationRoomCode();
  if (invitationCode) {
    ui.roomCode.value = invitationCode;
    setStatus("أدخل اسمك ثم اضغط «انضمام» لدخول غرفة الدعوة.");
    ui.name.focus();
  }
}

setup();
