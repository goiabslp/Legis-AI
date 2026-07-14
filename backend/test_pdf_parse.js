const pdf = require('pdf-parse');
console.log('Construtor PDFParse:', pdf.PDFParse.toString());
console.log('Propriedades do prototype de PDFParse:', Object.getOwnPropertyNames(pdf.PDFParse.prototype));
