import { Telegraf, Markup } from 'telegraf';
import { recognize } from 'tesseract.js';
import dotenv from 'dotenv';
//
import { LANGUAGES } from './languages';

dotenv.config();

// load your bot token (get your token from the BotFather bot in telegram and set it as environment variable)
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not defined in environment variables');
}

const bot = new Telegraf(BOT_TOKEN);

// Store user-specific language preferences
const userLanguages: Record<number, string> = {};

// Start command handler
bot.start((ctx) => {
  ctx.reply(
    `Welcome! Send me an image, and I will extract the text from it.\n\nSelect a language for OCR using the button below.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Set OCR Language', 'set_language')],
      [Markup.button.callback('Help', 'help')],
    ])
  );
});

// Inline keyboard for language selection
bot.action('set_language', async (ctx) => {
  ctx.reply(
    'Choose a language for OCR:',
    Markup.inlineKeyboard(
      LANGUAGES.map((lang) =>
        Markup.button.callback(lang.name, `lang_${lang.code}`)
      ),
      { columns: 2 }
    )
  );
  ctx.answerCbQuery(); // Acknowledge callback
});

// Handle language selection
LANGUAGES.forEach((lang) => {
  bot.action(`lang_${lang.code}`, (ctx) => {
    userLanguages[ctx.from.id] = lang.code;
    ctx.reply(`Language set to "${lang.name}". Now you can send your image.`);
    ctx.answerCbQuery(); // Acknowledge callback
  });
});

// Handle image uploads
bot.on('photo', async (ctx) => {
  try {
    // Get the user's preferred language or default to English
    const language = userLanguages[ctx.from.id] || 'eng';

    // Get the highest resolution image
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    // Get the file URL
    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply(`Processing the image with language "${language}"... Please wait.`);

    // Perform OCR using Tesseract.js
    const result = await recognize(fileLink.toString(), language);

    if (result.data.text.trim()) {
      ctx.reply(`Extracted Text:\n${result.data.text}`);
    } else {
      ctx.reply('No text was detected in the image.');
    }
  } catch (error) {
    console.error('Error during OCR processing:', error);
    ctx.reply('An error occurred while processing the image. Please try again.');
  }
});

// Help command handler via inline button
bot.action('help', (ctx) => {
  ctx.reply(
    `Commands:\n\n1. Send an image to extract text.\n2. Use the "Set OCR Language" button to choose a language.`
  );
  ctx.answerCbQuery(); // Acknowledge callback
});

// Gracefully stop the bot on SIGINT or SIGTERM
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Launch the bot
bot.launch().then(() => {
  console.log('OCR bot is running...');
});
