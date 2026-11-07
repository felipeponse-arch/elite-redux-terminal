# Exportar e importar o save por arquivo

Status: pronto-para-agente
Pacote: 03 (junto com `dois-iguais/01` depois da sabatina). Tamanho: P/M.

Origem: decisão do usuário (06/11/2026). A sincronização entre aparelhos só funciona dentro do Artifact do claude.ai (`claude.use("db")`, src/ui/sync.js). No site público (GitHub Pages) o app mostra "só neste aparelho" e guarda o progresso no navegador.

Entrega: dois botões (por exemplo na aba Progresso): **Baixar save** (arquivo .json do `buildSave`, com a soma de verificação) e **Carregar save** (lê o arquivo, valida formato e soma, confirma antes de sobrescrever e aplica por `applySave`). Sem servidor, sem conta. Migração de save antigo vale como no carregamento normal.

Pronto quando: teste unitário do ciclo baixar→carregar (save igual), teste de arquivo corrompido ou com soma errada (recusa com mensagem), teste e2e simples dos dois botões, README atualizado.
Depende de: arquiteta-de-dados (formato do save e soma de verificação).
