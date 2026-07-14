const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function run() {
  const filePath = path.join(__dirname, 'temp_test.pdf');
  fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Constituicao Federal) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000282 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n377\n%%EOF');

  const dataBuffer = fs.readFileSync(filePath);

  try {
    console.log('Instanciando PDFParse...');
    const parser = new pdf.PDFParse();
    
    console.log('Chamando load...');
    await parser.load(dataBuffer);
    
    console.log('Chamando getText...');
    const text = await parser.getText();
    console.log('Texto extraído com sucesso! Conteúdo:', JSON.stringify(text));
  } catch (e) {
    console.error('Erro na extração:', e);
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
run();
