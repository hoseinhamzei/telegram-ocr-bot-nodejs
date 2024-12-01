import { Telegraf } from 'telegraf';
import { recognize } from 'tesseract.js';
import 'dotenv/config';

// load your bot token
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not specified');
}

const bot = new Telegraf(BOT_TOKEN);

// handle bot start
bot.start((ctx) => {
  ctx.reply('Welcome to the OCR bot! Send me an image, and I will extract the text from it.');
});

// handle image upload
bot.on('photo', async (ctx) => {
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply('Processing the image... Please wait.');

    // perform OCR using Tesseract.js
    const result = await recognize(fileLink.toString(), 'eng');

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

bot.launch().then(() => {
  console.log('OCR bot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
