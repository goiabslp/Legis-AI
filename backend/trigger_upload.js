async function test() {
  const fs = require('fs');
  const path = require('path');

  const filePath = path.join(__dirname, 'temp_test.pdf');
  fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Constituicao Federal) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000282 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n377\n%%EOF');

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });

  const form = new FormData();
  form.append('file', blob, 'temp_test.pdf');
  form.append('category', 'Geral');
  form.append('source', 'NACIONAL');

  try {
    console.log('Enviando upload via fetch nativo...');
    const response = await fetch('http://localhost:3001/knowledge/upload', {
      method: 'POST',
      body: form,
    });
    console.log('Status da resposta:', response.status);
    const data = await response.json();
    console.log('Corpo da resposta:', data);
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
test();
