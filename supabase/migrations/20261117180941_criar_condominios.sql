-- ORB-25: condomínios atendidos pelo Aciona.
CREATE TABLE condominios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  sigla VARCHAR(5) NOT NULL UNIQUE,
  cidade VARCHAR(60) NOT NULL,
  torres INT NOT NULL CHECK (torres BETWEEN 1 AND 30),
  andares INT NOT NULL CHECK (andares BETWEEN 1 AND 60),
  aptos_por_andar INT NOT NULL CHECK (aptos_por_andar BETWEEN 1 AND 20),
  -- calculado pelo próprio banco, ninguém digita
  total_apartamentos INT GENERATED ALWAYS AS (torres * andares * aptos_por_andar) STORED,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);