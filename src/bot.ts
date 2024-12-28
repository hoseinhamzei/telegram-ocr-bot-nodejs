import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { recognize } from "tesseract.js";
import dotenv from "dotenv";
//
import { LANGUAGES } from "./utils/languages";
import { replies } from "./utils/constants";

console.log("OCR bot is starting...");

dotenv.config();

// load your bot token (get your token from the BotFather bot in telegram and set it as environment variable in the .env file)
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

const bot = new Telegraf(BOT_TOKEN);

// Store user-specific language preferences
const userLanguages: Record<number, string> = {};

// Start command handler
bot.start((ctx) => {
  ctx.reply(
    replies.WELCOME,
    Markup.inlineKeyboard([
      [Markup.button.callback("Set OCR Language", "set_language")],
      [Markup.button.callback("Help", "help")],
    ])
  );
});

// Inline keyboard for language selection
bot.action("set_language", async (ctx) => {
  ctx.reply(
    replies.SET_LANGUAGE,
    Markup.inlineKeyboard(
      LANGUAGES.map((lang) =>
        Markup.button.callback(lang.name, `lang_${lang.code}`)
      ),
      { columns: 2 }
    )
  );
  ctx.answerCbQuery();
});

// Handle language selection
LANGUAGES.forEach((lang) => {
  bot.action(`lang_${lang.code}`, (ctx) => {
    userLanguages[ctx.from.id] = lang.code;
    ctx.reply(replies.LANG_BUTTON(lang.name));
    ctx.answerCbQuery();
  });
});

// Handle image uploads
bot.on(message("photo"), async (ctx) => {
  try {
    const language = userLanguages[ctx.from.id] || "eng";
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply(replies.PROCESSING_IMAGE);

    // Perform OCR using Tesseract.js
    const result = await recognize(fileLink.toString(), language);

    if (result.data.text.trim()) {
      ctx.reply(replies.EXTRACTED_TEXT(result.data.text));
    } else {
      ctx.reply(replies.NO_TEXT_DETECTED);
    }
  } catch (error) {
    console.error("Error during OCR processing:", error);
    ctx.reply(replies.ERROR_OCR_PROCESSING);
  }
});

// handle image file
bot.on(message("document"), async (ctx, next) => {
  try {
    const language = userLanguages[ctx.from.id] || "eng";
    const fileId = ctx.message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // check if file is image
    if (
      ctx?.message?.document?.mime_type &&
      ctx?.message?.document?.mime_type.startsWith("image/") &&
      // handle svg files
      !ctx?.message?.document?.mime_type.startsWith("image/svg+xml")
    ) {
      ctx.reply(replies.PROCESSING_IMAGE);

      // Perform OCR using Tesseract.js
      const result = await recognize(fileLink.toString(), language);

      if (result.data.text.trim()) {
        ctx.reply(replies.EXTRACTED_TEXT(result.data.text));
      } else {
        ctx.reply(replies.NO_TEXT_DETECTED);
      }
    } else {
      ctx.reply(replies.NOT_AN_IMAGE);
    }
  } catch (error) {
    console.error("Error during OCR processing:", error);
    ctx.reply(replies.ERROR_OCR_PROCESSING);
    return next();
  }
});

// Help command handler via inline button
bot.action("help", (ctx) => {
  ctx.reply(replies.HELP);
  ctx.answerCbQuery();
});

// Gracefully stop the bot on SIGINT or SIGTERM
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Launch the bot
bot
  .launch()
  .then(() => {
    console.log("OCR bot is running...");
  })
  .catch((error) => {
    console.error("Error starting the bot:", error);

    // Gracefully stop the bot on error
    process.exit(1);
  });
