import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Interface para o evento do Storage do Supabase
interface StorageWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    bucket_id: string;
    name: string; // Ex: "nacional/constituicao.pdf"
    metadata: {
      mimetype: string;
      size: number;
    };
  };
  old_record: any;
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Variáveis de ambiente do Supabase não configuradas." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: StorageWebhookPayload = await req.json();

    // Processa apenas inserções no bucket "knowledge-base"
    if (payload.record?.bucket_id !== "knowledge-base") {
      return new Response(
        JSON.stringify({ message: "Ignorado. Evento não pertence ao bucket knowledge-base." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const filePath = payload.record.name; // Ex: "nacional/123456_lei-14133.pdf"
    const fileMime = payload.record.metadata.mimetype;

    if (!filePath.endsWith(".pdf") && !fileMime.includes("pdf")) {
      return new Response(
        JSON.stringify({ message: "Ignorado. Apenas arquivos PDF são suportados." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Download do PDF do Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-base")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Erro ao baixar PDF:", downloadError);
      return new Response(
        JSON.stringify({ error: `Falha ao baixar PDF: ${downloadError?.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Extração de texto do PDF
    // Nota: Como rodamos em Deno e queremos evitar dependências externas pesadas no Deno Deploy,
    // usamos uma biblioteca leve ou fazemos requisição a uma API de OCR/Parser se disponível.
    // Para simplificar no Deno, usamos um parser leve em JS puro.
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfText = await parsePdfText(arrayBuffer);

    if (!pdfText.trim()) {
      return new Response(
        JSON.stringify({ error: "Texto extraído do PDF está vazio." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determina a categoria e fonte baseados no caminho do arquivo
    const pathParts = filePath.split("/");
    const sourceFolder = pathParts[0]?.toUpperCase() || "NACIONAL"; // NACIONAL, MUNICIPAL, USUARIO
    const fileNameWithExt = pathParts[pathParts.length - 1];
    const fileName = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf("."));
    const title = fileName.replace(/^\d+_/g, "").replace(/_/g, " ");
    
    // Inferencia de categoria amigável baseada no nome
    let category = "Geral";
    if (title.toLowerCase().includes("constitui")) category = "Constituição";
    else if (title.toLowerCase().includes("licita")) category = "Licitações";
    else if (title.toLowerCase().includes("decreto")) category = "Decretos";
    else if (title.toLowerCase().includes("redacao") || title.toLowerCase().includes("redação")) category = "Redação Oficial";

    // 3. Chunking inteligente (respeitando a estrutura da lei)
    const chunks = chunkText(pdfText, title, category, sourceFolder);

    // 4. Inicializar modelo de Embedding da Supabase AI (se disponível)
    // O Supabase AI fornece o modelo gte-small de 384 dimensões de graça nas Edge Functions
    let session: any = null;
    try {
      // @ts-ignore: Supabase.ai está disponível no ambiente Supabase Edge Runtime
      session = new Supabase.ai.Session("gte-small");
    } catch (e) {
      console.warn("Modelo local Supabase.ai não disponível. Usando fallback de embedding matemático.");
    }

    // 5. Inserir chunks no banco de dados pgvector
    let chunksIndexed = 0;
    for (const chunk of chunks) {
      let embedding: number[] = [];

      if (session) {
        // Gera embedding real de 384 dimensões
        const res = await session.run(chunk.content, { mean_pool: true, normalize: true });
        embedding = Array.from(res);
      } else {
        // Fallback matemático de 384 dimensões
        embedding = generateEmbeddingMath(chunk.content);
      }

      const embeddingString = `[${embedding.join(",")}]`;

      // Deleta chunks anteriores com o mesmo id
      await supabase.from("documents").delete().eq("id", chunk.id);

      // Insere o chunk com o vetor de embedding
      const { error: insertError } = await supabase.rpc("insert_document_chunk", {
        p_id: chunk.id,
        p_titulo: chunk.title,
        p_categoria: chunk.category,
        p_fonte: chunk.source,
        p_tipo: chunk.type,
        p_artigo: chunk.article,
        p_texto: chunk.content,
        p_metadata: chunk.metadata,
        p_embedding: embeddingString,
      });

      if (insertError) {
        // Fallback se a RPC insert_document_chunk não existir: tenta inserção direta no Postgres
        // pgvector aceita strings de vetores no formato '[x,y,z]'
        const { error: directError } = await supabase.from("documents").insert({
          id: chunk.id,
          titulo: chunk.title,
          categoria: chunk.category,
          fonte: chunk.source,
          tipo: chunk.type,
          artigo: chunk.article,
          texto: chunk.content,
          metadata: chunk.metadata,
          embedding: embeddingString
        });

        if (directError) {
          console.error(`Erro ao inserir chunk ${chunk.id}:`, directError);
          continue;
        }
      }

      chunksIndexed++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído com sucesso.`,
        file: filePath,
        chunksCount: chunksIndexed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no processamento da Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Parser simples para extração de texto de PDF no ambiente Deno
// Baseado no formato textual básico do PDF. Para ambiente de produção real do Supabase,
// é recomendável usar a biblioteca pdfjs-dist instalada.
async function parsePdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  // Nota: Como ler arquivos PDF brutos exige processamento complexo,
  // na Edge Function nós importamos um parser compacto de PDF escrito em JS puro
  // ou usamos uma chamada rápida.
  // Em Deno, podemos carregar dinamicamente o pdfjs-dist da CDN:
  try {
    const pdfjs = await import("https://esm.sh/pdfjs-dist@3.4.120/build/pdf?bundle");
    // Configura o worker
    pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@3.4.120/build/pdf.worker.entry?bundle";
    
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // @ts-ignore
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (err) {
    console.error("Erro ao rodar pdfjs-dist na Edge Function, usando parser de texto bruto fallback:", err);
    // Fallback de strings ASCII simples para recuperar textos legíveis em caso de falha de import do pdfjs
    const bytes = new Uint8Array(arrayBuffer);
    let text = "";
    let inText = false;
    let currentStr = "";

    for (let i = 0; i < bytes.length - 1; i++) {
      // Procura marcas de texto no fluxo do PDF (Tj ou TJ)
      if (bytes[i] === 40) { // '('
        inText = true;
        currentStr = "";
      } else if (bytes[i] === 41 && inText) { // ')'
        inText = false;
        text += currentStr + " ";
      } else if (inText) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
          text += String.fromCharCode(bytes[i]);
        }
      }
    }
    return text;
  }
}

// Algoritmo de chunking estrito (espelho do backend)
function chunkText(text: string, title: string, category: string, source: string) {
  const lines = text.split("\n");
  const units: string[] = [];
  let currentUnit = "";

  const articleRegex = /^\s*(Art\.\s*\d+|Artigo\s*\d+)/i;
  const paragraphRegex = /^\s*(§\s*\d+|Parágrafo\s*único)/i;
  const clauseRegex = /^\s*([IVXLCDM]+\s*[-–]\s*)/i;
  const sectionRegex = /^\s*(CAPÍTULO|TÍTULO|SEÇÃO|SECCÃO)\s+[IVXLCDM\d+]/i;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (
      articleRegex.test(trimmed) ||
      paragraphRegex.test(trimmed) ||
      clauseRegex.test(trimmed) ||
      sectionRegex.test(trimmed)
    ) {
      if (currentUnit.trim()) units.push(currentUnit.trim());
      currentUnit = line;
    } else {
      currentUnit += (currentUnit ? " " : "") + line;
    }
  });

  if (currentUnit.trim()) units.push(currentUnit.trim());

  if (units.length <= 1) {
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    let temp = "";
    sentences.forEach((s) => {
      if (temp.length + s.length > 800) {
        units.push(temp.trim());
        temp = s;
      } else {
        temp += s;
      }
    });
    if (temp.trim()) units.push(temp.trim());
  }

  const chunks: any[] = [];
  let currentChunk = "";
  let activeArticle = "Preâmbulo";

  units.forEach((unit) => {
    const artMatch = unit.match(/(Art\.\s*\d+|Artigo\s*\d+|CAPÍTULO\s+[IVXLCDM\d+]+|SEÇÃO\s+[IVXLCDM\d+]+)/i);
    if (artMatch) activeArticle = artMatch[1];

    if (unit.length > 1000) {
      if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), article: activeArticle });
        currentChunk = "";
      }
      chunks.push({ content: unit.trim(), article: activeArticle });
      return;
    }

    if (currentChunk.length + unit.length > 1000) {
      if (currentChunk.trim()) chunks.push({ content: currentChunk.trim(), article: activeArticle });
      currentChunk = unit;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + unit;
    }
  });

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), article: activeArticle });
  }

  return chunks.map((c, index) => {
    const headerContext = `[${title}] | Categoria: ${category} | Seção/Artigo: ${c.article}\n\n`;
    return {
      id: `${title.replace(/[^a-zA-Z0-9]/g, "_")}-chunk-${index}`,
      title,
      category,
      source,
      type: category.toUpperCase().includes("CONSTITUIÇÃO") ? "CONSTITUICAO" : "LEI",
      article: c.article,
      content: headerContext + c.content,
      metadata: {
        original_length: c.content.length,
        chunk_index: index,
        total_chunks: chunks.length,
        article: c.article,
      },
    };
  });
}

// Algoritmo matemático para gerar vetor de 384 dimensões em Deno
function generateEmbeddingMath(text: string): number[] {
  const dimensions = 384;
  const embedding = new Array(dimensions).fill(0);
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, "");
  const words = cleanText.split(/\s+/).filter((w) => w.length > 2);

  for (let i = 0; i < dimensions; i++) {
    let val = 0;
    words.forEach((word, wordIdx) => {
      for (let charIdx = 0; charIdx < word.length; charIdx++) {
        val += Math.sin(word.charCodeAt(charIdx) * (i + 1) + wordIdx);
      }
    });
    embedding[i] = Math.tanh(val / (words.length || 1));
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
}
