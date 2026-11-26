-- ORB-25: liga a RLS nas tabelas.
-- Sem política nenhuma, ninguém lê nem grava pela API do Supabase (anon e authenticated).
-- As regras por condomínio entram com os vínculos de morador e síndico (ORB-18).
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;