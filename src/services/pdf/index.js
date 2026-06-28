const fs = require('fs');
const path = require('path');
const pdfParseConverter = require('./converters/pdfParseConverter');
const fallbackConverter = require('./converters/fallbackConverter');

const converters = [pdfParseConverter, fallbackConverter];

async function convertPdfToHtml(filePath, context = {}) {
  for (const converter of converters) {
    try {
      const result = await converter.convert(filePath, context);
      if (result && result.html) {
        return {
          html: result.html,
          converter: converter.name,
          status: 'success',
        };
      }
    } catch (err) {
      console.warn(`PDF converter "${converter.name}" failed:`, err.message);
    }
  }

  return fallbackConverter.convert(filePath, context);
}

module.exports = {
  convertPdfToHtml,
  converters,
};
