// Cache de "arquivo lembrado" da sabotagem (tests/.sabotagem_cache.json, fora do git).
// 15/10/2026: rodadas parciais ou --completo sobrescreviam o arquivo só com as mutações da rodada e o portão
// do master passou a rodar a suíte INTEIRA em cada uma das 383 (98 min contra ~20). Regra agora: gravar é
// MESCLAR - lê o disco na hora de gravar e só mexe nas entradas desta rodada. Nunca perder cobertura.
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";

// Função pura. `base` = cache lido do disco; `atualizacoes` = Map id -> arquivo (string, passa a valer)
// ou null (nenhum arquivo pegou: a entrada é removida). Ids fora de `atualizacoes` ficam intactos.
export function mesclarCache(base, atualizacoes) {
  const saida = { ...(base && typeof base === "object" ? base : {}) };
  for (const [id, arq] of atualizacoes) {
    if (typeof arq === "string" && arq) saida[id] = arq;
    else delete saida[id];
  }
  return saida;
}

function ler(caminho) {
  try { if (existsSync(caminho)) { const j = JSON.parse(readFileSync(caminho, "utf8")); return j && typeof j === "object" ? j : {}; } } catch { /* corrompido: trata como vazio */ }
  return {};
}

// Lê o disco AGORA (não o que foi lido na partida: outra rodada pode ter gravado no meio), aplica as
// atualizações e grava por arquivo temporário + rename. `emprestado` = entradas conhecidas que o disco
// ainda não tem (worktree novo que herdou o cache do checkout principal).
export function gravarCacheMesclando(caminho, atualizacoes, emprestado = {}) {
  const mesclado = mesclarCache({ ...emprestado, ...ler(caminho) }, atualizacoes);
  const tmp = caminho + "." + process.pid + ".tmp";
  try { writeFileSync(tmp, JSON.stringify(mesclado, null, 1)); renameSync(tmp, caminho); } catch { /* cache é só atalho */ }
  return mesclado;
}
