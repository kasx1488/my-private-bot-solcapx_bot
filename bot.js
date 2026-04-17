const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN || '8724941769:AAGFuNDFWCFzHjL6s4vBhxZlQ_PqD4YHCVE';
const ADMIN_ID = '587704400';
const FREE_CHANNEL = 'https://t.me/solcapx';
const LANDING = 'https://solcap.lol';
let PHOTO_INTRO_ID = process.env.PHOTO_INTRO_ID || '';
let VOICE_ID = process.env.VOICE_ID || '';
let RESULTS_IDS = process.env.RESULTS_IDS ? process.env.RESULTS_IDS.split(',') : [];

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
const ANALYTICS_URL = 'https://script.google.com/macros/s/AKfycbyrXIZWo82znDiMCmNQONO9DYjsCsVjJlKY0LcxC_w6oSeeJ4zUJh8bxNjaRywwqj61/exec';

function logEvent(userId, username, event, step, data = '') {
  try {
    const payload = JSON.stringify({
      user_id: String(userId),
      username: username || '',
      event: event,
      step: step,
      data: String(data)
    });

    function postToUrl(urlString, body) {
      const url = new URL(urlString);
      const lib = url.protocol === 'https:' ? require('https') : require('http');
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      const req = lib.request(options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          postToUrl(res.headers.location, body);
          return;
        }
        res.resume();
      });
      req.on('error', (e) => console.log('Analytics error:', e.message));
      req.write(body);
      req.end();
    }

    postToUrl(ANALYTICS_URL, payload);
  } catch (e) {
    console.log('Analytics error:', e.message);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const bot = new TelegramBot(TOKEN, { polling: true });
const userState = new Map();
const followUpTimers = new Map();
const setupBuffer = new Map();

const KB_EXPERIENCE = {
  inline_keyboard: [
    [{ text: '🔰 Just getting started', callback_data: 'exp_beginner' }],
    [{ text: '📈 6-12 months', callback_data: 'exp_mid' }],
    [{ text: '🔥 1+ year in the trenches', callback_data: 'exp_pro' }]
  ]
};
const KB_PAIN = {
  inline_keyboard: [
    [{ text: '⏰ Always late to entries', callback_data: 'pain_late' }],
    [{ text: '📣 Following wrong CT callers', callback_data: 'pain_ct' }],
    [{ text: '🐋 Cant track smart money', callback_data: 'pain_sm' }],
    [{ text: '🎢 Missing pumps, catching dumps', callback_data: 'pain_pump' }]
  ]
};
const KB_OFFER = {
  inline_keyboard: [
    [{ text: '✅ Lets do it', callback_data: 'offer_yes' }],
    [{ text: '❓ I have a question', callback_data: 'offer_question' }]
  ]
};
const KB_PAYMENT = {
  inline_keyboard: [
    [{ text: '💳 Monthly — $99/mo', url: LANDING }],
    [{ text: '♾️ Lifetime — $499', url: LANDING }]
  ]
};

const INTRO_TEXT =
  "Hey, how's it going? Captain Sol here.\n\n" +
  "I'm a trader on Solana. I track smart money wallets and get into trades before the market even knows what's happening.\n\n" +
  "Glad you stopped by. I started from nothing — small town, no connections, lost a hundred grand trying to figure this out. Now I run a system that just keeps printing.\n\n" +
  "I'm selective about who gets in. Check out my results and listen to the voice message 👇";
const RESULTS_TEXT =
  "My recent trades 👇\n\n" +
  "+$80,300 on $PURCH (+190%)\n" +
  "+$8,158 on $BLOXX (+67%)\n" +
  "+$4,129 on $ISO (+158%)\n" +
  "+$2,371 on $VAULT (+537%)\n\n" +
  "Not lucky trades. A system.\n" +
  "Built after losing $100K learning how smart money actually moves.";
const TRANSITION_TEXT = "Ready to move with me bro? Answer a few questions below 👇";
const BEGINNER_TEXT =
  "Appreciate the honesty.\n\n" +
  "Real talk — the private group isn't where you wanna start. We don't do basics in there, we trade.\n\n" +
  "But the free channel is exactly where you should be right now.\n\n" +
  "Real calls, full breakdowns, zero noise. Watch how I move for a few weeks.\n\n" +
  "→ " + FREE_CHANNEL + "\n\n" +
  "When you're ready to go deeper, you'll know where to find me. 🤙";
const MID_PRO_TEXT =
  "Solid. You know enough to know what you've been missing.\n\n" +
  "What's your biggest problem right now when trading? 👇";
const PAIN_TEXTS = {
  pain_late:
    "Yeah. That's the game when you're watching price instead of wallets.\n\n" +
    "By the time CT posts about it — smart money already exited. You're buying their bags.\n\n" +
    "Inside the private group you see exactly when the right wallets start moving — before the announcement, before the pump.\n\n" +
    "That's the edge. 🎯",
  pain_ct:
    "Classic. You ape in, they've already closed their position. You're the exit liquidity.\n\n" +
    "I don't post calls based on vibes. Every move is based on wallet data — the same wallets that consistently print.\n\n" +
    "No hype. Just the system. 📊",
  pain_sm:
    "Most people can't — it takes hours of manual wallet analysis every day.\n\n" +
    "That's why I built the bot.\n\n" +
    "It monitors the wallets that consistently print 24/7 and alerts you in real time when they start moving.\n\n" +
    "You see the move as it happens. Not after. 🔍",
  pain_pump:
    "That's what happens when you're reacting instead of positioning.\n\n" +
    "Inside the group — you get the call before the move. Entry point, logic, risk level. All laid out.\n\n" +
    "No more panic buys at the top. 📈"
};
const OFFER_TEXT =
  "Here's what's inside the private group:\n\n" +
  "→ My personal calls — every project I'm personally aping into, with full reasoning\n" +
  "→ The alpha bot — real-time smart money wallet tracking\n" +
  "→ Full trade breakdowns — wins AND losses, no sugarcoating\n" +
  "→ Elite community — traders who actually print\n\n" +
  "$99/month or $499 lifetime.\n\n" +
  "I review every application. Not everyone gets in.\n\n" +
  "You in? 👇";
const PAYMENT_TEXT =
  "Let's go. 🔥\n\n" +
  "Choose your plan:\n\n" +
  "💳 Monthly — $99/month\n" +
  "♾️ Lifetime — $499 one-time\n\n" +
  "Once confirmed — you're in within the hour.\n" +
  "Any issues — reply here, I'll sort it personally.\n\n" +
  "See you inside. 🫡";
const QUESTION_TEXT = "Go ahead — what's on your mind? 👇";
const FOLLOWUP_TEXT =
  "Hey — checking in.\n\n" +
  "Had a solid call in the group today. +180% in 31 hours.\n\n" +
  "The system works. When you're ready 👇\n\n" +
  LANDING + "\n\n" +
  "Catch you in the trenches. 🤙";

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function scheduleFollowUp(userId) {
  if (followUpTimers.has(userId)) clearTimeout(followUpTimers.get(userId));
  const timer = setTimeout(async () => {
    if (userState.get(userId) !== 'purchased') {
      try {
        await bot.sendMessage(userId, FOLLOWUP_TEXT);
        logEvent(userId, '', 'followup_sent', 'followup'); // ANALYTICS
      } catch (e) {
        console.log('Follow-up error:', e.message);
      }
    }
    followUpTimers.delete(userId);
  }, 24 * 60 * 60 * 1000);
  followUpTimers.set(userId, timer);
}

bot.onText(/\/start/, async (msg) => {
  const id = msg.from.id;
  userState.set(id, 'experience');

  logEvent(id, msg.from.username, 'bot_start', 'start'); // ANALYTICS

  try {
    if (PHOTO_INTRO_ID) {
      await bot.sendPhoto(id, PHOTO_INTRO_ID, { caption: INTRO_TEXT });
    } else {
      await bot.sendMessage(id, INTRO_TEXT);
    }
    await delay(1500);
    if (VOICE_ID) {
      await bot.sendVoice(id, VOICE_ID);
      const randomDelay = Math.floor(Math.random() * 10000) + 30000;
      await delay(randomDelay);
    }
    if (RESULTS_IDS.length > 0) {
      if (RESULTS_IDS.length === 1) {
        await bot.sendPhoto(id, RESULTS_IDS[0], { caption: RESULTS_TEXT });
      } else {
        const media = RESULTS_IDS.map((rid, i) => ({
          type: 'photo',
          media: rid,
          ...(i === 0 ? { caption: RESULTS_TEXT } : {})
        }));
        await bot.sendMediaGroup(id, media);
      }
    } else {
      await bot.sendMessage(id, RESULTS_TEXT);
    }
    await delay(10000);
    await bot.sendMessage(id, TRANSITION_TEXT, {
      reply_markup: KB_EXPERIENCE
    });
  } catch (e) {
    console.error('Start error:', e.message);
  }
});

bot.onText(/\/setup/, async (msg) => {
  const id = msg.from.id;
  if (String(id) !== ADMIN_ID) return;
  setupBuffer.set(id, { results: [] });
  userState.set(id, 'setup_photo');
  await bot.sendMessage(id, '🛠 Начинаем настройку медиа.\n\nШаг 1/3: Отправь мне фото которое будет в первом сообщении.');
});

bot.onText(/\/done/, async (msg) => {
  const id = msg.from.id;
  if (String(id) !== ADMIN_ID) return;
  if (userState.get(id) !== 'setup_results') return;
  const buffer = setupBuffer.get(id) || {};
  const resultsIds = buffer.results || [];
  RESULTS_IDS = resultsIds;
  await bot.sendMessage(id,
    '✅ Настройка завершена!\n\nСохрани эти значения:\n\n' +
    'PHOTO_INTRO_ID=' + PHOTO_INTRO_ID + '\n' +
    'VOICE_ID=' + VOICE_ID + '\n' +
    'RESULTS_IDS=' + resultsIds.join(',') + '\n\nДобавь их в переменные окружения на Railway.'
  );
  userState.set(id, 'done');
  setupBuffer.delete(id);
});

bot.on('message', async (msg) => {
  const id = msg.from.id;
  const state = userState.get(id);

  if (state === 'setup_photo' && msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    PHOTO_INTRO_ID = fileId;
    const buffer = setupBuffer.get(id) || { results: [] };
    buffer.photoId = fileId;
    setupBuffer.set(id, buffer);
    userState.set(id, 'setup_voice');
    await bot.sendMessage(id, '✅ Фото сохранено!\n\nШаг 2/3: Теперь отправь голосовое сообщение.');
    return;
  }
  if (state === 'setup_voice' && msg.voice) {
    const fileId = msg.voice.file_id;
    VOICE_ID = fileId;
    const buffer = setupBuffer.get(id) || { results: [] };
    buffer.voiceId = fileId;
    setupBuffer.set(id, buffer);
    userState.set(id, 'setup_results');
    await bot.sendMessage(id, '✅ Голосовое сохранено!\n\nШаг 3/3: Отправляй скрины результатов по одному.\nКогда закончишь — напиши /done');
    return;
  }
  if (state === 'setup_results' && msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const buffer = setupBuffer.get(id) || { results: [] };
    buffer.results.push(fileId);
    setupBuffer.set(id, buffer);
    await bot.sendMessage(id, '✅ Скрин ' + buffer.results.length + ' добавлен. Отправляй следующий или напиши /done');
    return;
  }
  if (state === 'question' && msg.text && !msg.text.startsWith('/')) {
    logEvent(id, msg.from.username, 'question_asked', 'question', msg.text.substring(0, 100)); // ANALYTICS
    await bot.sendMessage(ADMIN_ID, '❓ Вопрос от @' + (msg.from.username || id) + ':\n\n' + msg.text);
    await bot.sendMessage(id, "Got it. I'll get back to you shortly. 🤙");
  }
});

bot.on('callback_query', async (query) => {
  const id = query.from.id;
  const data = query.data;
  await bot.answerCallbackQuery(query.id);

  if (data === 'exp_beginner') {
    userState.set(id, 'beginner');
    logEvent(id, query.from.username, 'button_click', 'experience', 'beginner'); // ANALYTICS
    await bot.sendMessage(id, BEGINNER_TEXT);
    return;
  }
  if (data === 'exp_mid' || data === 'exp_pro') {
    userState.set(id, 'pain');
    logEvent(id, query.from.username, 'button_click', 'experience', data === 'exp_mid' ? 'mid' : 'pro'); // ANALYTICS
    await bot.sendMessage(id, MID_PRO_TEXT, { reply_markup: KB_PAIN });
    return;
  }
  if (PAIN_TEXTS[data]) {
    userState.set(id, 'offer');
    logEvent(id, query.from.username, 'button_click', 'pain', data); // ANALYTICS
    await bot.sendMessage(id, PAIN_TEXTS[data]);
    await delay(1000);
    await bot.sendMessage(id, OFFER_TEXT, { reply_markup: KB_OFFER });
    scheduleFollowUp(id);
    return;
  }
  if (data === 'offer_yes') {
    if (userState.get(id) === 'payment') return;
    userState.set(id, 'payment');
    logEvent(id, query.from.username, 'hot_lead', 'offer', 'yes'); // ANALYTICS
    await bot.sendMessage(id, PAYMENT_TEXT, { reply_markup: KB_PAYMENT });
    await bot.sendMessage(ADMIN_ID, '🔥 Горячий лид!\n@' + (query.from.username || id) + ' нажал "Lets do it"');
    return;
  }
  if (data === 'offer_question') {
    userState.set(id, 'question');
    logEvent(id, query.from.username, 'button_click', 'offer', 'question'); // ANALYTICS
    await bot.sendMessage(id, QUESTION_TEXT);
    await bot.sendMessage(ADMIN_ID, '❓ Лид с вопросом: @' + (query.from.username || id));
    return;
  }
});

console.log('🤖 SolCap Bot started...');
