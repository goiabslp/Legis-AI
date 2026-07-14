-- =====================================================================
-- CONFIGURAÇÃO DO SUPABASE (Banco de Dados RAG com pgvector)
-- Executar este script no editor SQL do Supabase (SQL Editor)
-- =====================================================================

-- 1. Habilitar a extensão pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Garantir que a tabela documents (chunks) existe com suporte a vetores
-- Nota: O Prisma db push já cria esta tabela automaticamente a partir do schema.prisma.
-- Caso esteja criando o banco do zero de forma manual, execute:
/*
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fonte TEXT NOT NULL, -- 'NACIONAL', 'MUNICIPAL', 'USUARIO'
  tipo TEXT NOT NULL,
  numero TEXT,
  artigo TEXT,
  texto TEXT NOT NULL,
  metadata JSONB,
  embedding vector(384),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
*/

-- 3. Criar a RPC (Remote Procedure Call) para inserção a partir da Edge Function
-- Isso permite contornar restrições complexas e realizar inserções em lote de forma otimizada
CREATE OR REPLACE FUNCTION public.insert_document_chunk(
  p_id TEXT,
  p_titulo TEXT,
  p_categoria TEXT,
  p_fonte TEXT,
  p_tipo TEXT,
  p_artigo TEXT,
  p_texto TEXT,
  p_metadata JSONB,
  p_embedding vector(384)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deleta o chunk existente se houver (para evitar duplicatas ao re-indexar o PDF)
  DELETE FROM public.documents WHERE id = p_id;

  -- Insere o novo chunk
  INSERT INTO public.documents (
    id,
    titulo,
    categoria,
    fonte,
    tipo,
    artigo,
    texto,
    metadata,
    embedding,
    data_criacao
  ) VALUES (
    p_id,
    p_titulo,
    p_categoria,
    p_fonte,
    p_tipo,
    p_artigo,
    p_texto,
    p_metadata,
    p_embedding,
    now()
  );
END;
$$;

-- 4. Criar um índice vetorial de Cosseno (HNSW) para otimizar pesquisas
-- HNSW é altamente recomendado para buscas rápidas aproximadas (ANN) no pgvector
CREATE INDEX IF NOT EXISTS documents_embedding_cosine_idx 
ON public.documents 
USING hnsw (embedding vector_cosine_ops);

-- 5. Criar políticas de segurança RLS (Row Level Security) básicas
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Permite leitura de documentos de conhecimento para qualquer usuário autenticado
CREATE POLICY "Permitir leitura de chunks para usuários autenticados" 
ON public.documents 
FOR SELECT 
TO authenticated 
USING (true);

-- Permite inserção/atualização apenas para a role de serviço (Edge Functions)
CREATE POLICY "Permitir modificação apenas para service_role" 
ON public.documents 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
