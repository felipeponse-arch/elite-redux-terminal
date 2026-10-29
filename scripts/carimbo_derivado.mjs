// TK-24: grava em data/carimbo_derivados.json de que versão do jogo/config cada derivado foi gerado.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export function carimbarDerivado(arquivo, { origem = "data/carimbo_dados.json", saida = "data/carimbo_derivados.json", hoje = new Date().toISOString().slice(0, 10) } = {}) {
  const c = JSON.parse(readFileSync(origem, "utf8"));
  const reg = existsSync(saida) ? JSON.parse(readFileSync(saida, "utf8")) : {};
  reg[arquivo] = { jogo: c.jogo, "er-repo": c["er-repo"], "er-config": c["er-config"], dadosDe: c.data, geradoEm: hoje };
  writeFileSync(saida, JSON.stringify(reg, null, 2) + "\n");
}
