const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN || 'ВОТ_ТВОЙ_ТОКЕН';
const ADMIN_ID = '587704400';
const FREE_CHANNEL = 'https://t.me/buytrenchess';
const LANDING = 'https://solcap.lol';

let PHOTO_INTRO_ID = process.env.PHOTO_INTRO_ID || '';
let VOICE_ID = process.env.VOICE_ID || '';
let RESULTS_IDS = process.env.RESULTS_IDS ? process.env.RESULTS_IDS.split(',') : [];

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
  "What's your biggest problem right now when
