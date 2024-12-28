export const replies = {
  WELCOME: `Welcome! Send me an image, and I will extract the text from it.\n\nSelect a language for OCR using the button below.`,
  HELP: `Commands:\n\n1. Send an image to extract text.\n2. Use the "Set OCR Language" button to choose a language.`,
  SET_LANGUAGE: `Choose a language for OCR:`,
  LANG_BUTTON: (lang: string) =>
    `Set OCR Language: ${lang}. Now you can send your image.`,
  PROCESSING_IMAGE: `Processing the image. Please wait...`,
  NO_TEXT_DETECTED: `No text was detected in the image.`,
  EXTRACTED_TEXT: (text: string) => `Extracted Text:\n${text}`,
  ERROR_OCR_PROCESSING: `An error occurred while processing the image. Please try again.`,
  NOT_AN_IMAGE: `The uploaded file is not an image. Please upload an image file.`,
};
