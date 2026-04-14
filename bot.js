const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN || '8724941769:AAGFuNDFWCFzHjL6s4vBhxZlQ_PqD4YHCVE';
const ADMIN_ID = '587704400';
const FREE_CHANNEL = '@solcapx';
const LANDING = 'https://solcap.lol';

let VOICE_FILE_ID = '';

const bot = new TelegramBot(TOKEN, { polling: true });
const userState = new Map();
const followUpTimers = new Map();

// КНОПКИ
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

// ЗАПУСК
bot.onText(/\/start/, async (msg) => {
  const id = msg.from.id;
  userState.set(id, 'experience');

  if (VOICE_FILE_ID) {
    await bot.sendVoice(id, VOICE_FILE_ID);
    await delay(1500);
  } else {
    await bot.sendMessage(id,
      "Hey, what's up. Captain Sol here.\n\nI'm a Solana trader. I track smart money wallets and get in before the market even sniffs it.\n\nStarted from nothing — lost a hundred grand figuring this out. Now I run a system that consistently prints.\n\nI'm selective about who gets in. Let me ask you a couple quick questions."
    );
  }

  await bot.sendMessage(id, 'How long have you been trading crypto? 👇', {
    reply_markup: KB_EXPERIENCE
  });
});

// SETUP — получить file_id голосового
bot.onText(/\/setup/, async (msg) => {
  const id = msg.from.id;
  if (String(id) !== ADMIN_ID) return;
  userState.set(id, 'setup_voice');
  await bot.sendMessage(id, 'Отправь голосовое — верну file_id.');
});

// ВХОДЯЩИЕ СООБЩЕНИЯ
bot.on('message', async (msg) => {
  const id = msg.from.id;
  const state = userState.get(id);

  if (state === 'setup_voice' && msg.voice) {
    VOICE_FILE_ID = msg.voice.file_id;
    await bot.sendMessage(id, 'file_id голосового:\n\n' + VOICE_FILE_ID + '\n\nСохрани это значение.');
    userState.set(id, 'done');
    return;
  }

  if (state === 'question' && msg.text && !msg.text.startsWith('/')) {
    await bot.sendMessage(ADMIN_ID,
      'Вопрос от @' + (msg.from.username || id) + ':\n\n' + msg.text
    );
    await bot.sendMessage(id, "Got it. I'll get back to you shortly. 🤙");
  }
});

// КНОПКИ
bot.on('callback_query', async (query) => {
  const id = query.from.id;
  const data = query.data;
  await bot.answerCallbackQuery(query.id);

  // ОПЫТ
  if (data === 'exp_beginner') {
    userState.set(id, 'beginner');
    await bot.sendMessage(id,
      "Appreciate the honesty.\n\nReal talk — the private group isn't where you wanna start. We don't do basics in there, we trade.\n\nBut the free channel? That's exactly where you should be right now.\n\nReal calls, full breakdowns, zero noise. Watch how I move for a few weeks.\n\n→ " + FREE_CHANNEL + "\n\nWhen you're ready to go deeper, you'll know where to find me. 🤙"
    );
    return;
  }

  if (data === 'exp_mid' || data === 'exp_pro') {
    userState.set(id, 'pain');
    await bot.sendMessage(id,
      "Solid. You know enough to know what you've been missing.\n\nWhat's your biggest problem right now when trading? 👇",
      { reply_markup: KB_PAIN }
    );
    return;
  }

  // БОЛЬ
  const painMessages = {
    pain_late: "Yeah. That's the game when you're watching price instead of wallets.\n\nBy the time CT posts about it — smart money already exited. You're buying their bags.\n\nInside the private group you see exactly when the right wallets start moving — before the announcement, before the pump.\n\nThat's the edge. 🎯",
    pain_ct: "Classic. You ape in, they've already closed their position. You're the exit liquidity.\n\nI don't post calls based on vibes. Every move is based on wallet data — the same wallets that consistently print.\n\nNo hype. Just the system. 📊",
    pain_sm: "Most people can't — it takes hours of manual wallet analysis every day.\n\nThat's why I built the bot.\n\nIt monitors the wallets that consistently print 24/7 and alerts you in real time when they start moving.\n\nYou see the move as it happens. Not after. 🔍",
    pain_pump: "That's what happens when you're reacting instead of positioning.\n\nInside the group — you get the call before the move. Entry point, logic, risk level. All laid out.\n\nNo more panic buys at the top. 📈"
  };

  if (painMessages[data]) {
    userState.set(id, 'offer');
    await bot.sendMessage(id, painMessages[data]);
    await delay(1000);
    await bot.sendMessage(id,
      "Here's what's inside the private group:\n\n→ My personal calls — every project I'm personally aping into, with full reasoning\n→ The alpha bot — real-time smart money wallet tracking\n→ Full trade breakdowns — wins AND losses, no sugarcoating\n→ Elite community — traders who actually print\n\n$99/month or $499 lifetime.\n\nI review every application. Not everyone gets in.\n\nYou in? 👇",
      { reply_markup: KB_OFFER }
    );
    scheduleFollowUp(id);
    return;
  }

  // ОФФЕР
  if (data === 'offer_yes') {
    userState.set(id, 'payment');
    await bot.sendMessage(id,
      "Let's go. 🔥\n\nChoose your plan below 👇\n\nOnce confirmed — you're in within the hour.\nAny issues — just reply here, I'll sort it personally.\n\nSee you inside. 🫡",
      { reply_markup: KB_PAYMENT }
    );
    await bot.sendMessage(ADMIN_ID,
      '🔥 Горячий лид! @' + (query.from.username || id) + ' нажал "Lets do it"'
    );
    return;
  }

  if (data === 'offer_question') {
    userState.set(id, 'question');
    await bot.sendMessage(id, "Go ahead — what's on your mind? 👇");
    await bot.sendMessage(ADMIN_ID,
      '❓ Лид с вопросом: @' + (query.from.username || id)
    );
    return;
  }
});

// ДОЖИМ ЧЕРЕЗ 24 ЧАСА
function scheduleFollowUp(userId) {
  if (followUpTimers.has(userId)) clearTimeout(followUpTimers.get(userId));
  const timer = setTimeout(async () => {
    if (userState.get(userId) !== 'purchased') {
      try {
        await bot.sendMessage(userId,
          "Hey — checking in.\n\nSaw you didn't grab a spot yet. No pressure.\n\nJust wanted to drop this — had a solid call in the group today. +180% in 31 hours.\n\nThe system works. When you're ready 👇\n\n" + LANDING + "\n\nCatch you in the trenches. 🤙"
        );
      } catch (e) {
        console.log('Follow-up error:', e.message);
      }
    }
    followUpTimers.delete(userId);
  }, 24 * 60 * 60 * 1000);
  followUpTimers.set(userId, timer);
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

console.log('Bot started...');
