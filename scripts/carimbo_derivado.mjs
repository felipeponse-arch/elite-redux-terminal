// TK-24: grava em data/carimbo_derivados.json de que versão do jogo/config cada derivado foi gerado.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export function carimbarDerivado(arquivo, { origem = "data/carimbo_dados.json", saida = "data/carimbo_derivados.json", hoje = new Date().toISOString().slice(0, 10) } = {}) {
  const c = JSON.parse(readFileSync(origem, "utf8"));
  const reg = existsSync(saida) ? JSON.parse(readFileSync(saida, "utf8")) : {};
  reg[arquivo] = { jogo: c.jogo, "er-repo": c["er-repo"], "er-config": c["er-config"], dadosDe: c.data, geradoEm: hoje };
  writeFileSync(saida, JSON.stringify(reg, null, 2) + "\n");
}

// Derivados gerados pelo rank/extração que ainda não passaram pelo gerador carimbado (TK-24).
export const PENDENTES_DO_GERADOR = ["species_rank.json", "lutas_comuns_run.json", "bosses.json", "rank_medicao.json"];

// Frescor: derivado cujo `dadosDe` é anterior à data do dado de origem está velho. Só olha entradas geradas (com dadosDe).
export function avisosDeFrescor(reg, carimboDados) {
  return Object.entries(reg)
    .filter(([, e]) => e.dadosDe && e.dadosDe < carimboDados.data)
    .map(([f, e]) => `${f} foi gerado de dados de ${e.dadosDe}, mas o dado de origem é de ${carimboDados.data}: regerar`);
}

// Pendente sem entrada = gerador ainda não rodou depois do TK-24. Informativo no build comum; barra com ER_PUBLICAR=1.
export function pendentesSemCarimbo(reg) {
  return PENDENTES_DO_GERADOR.filter((f) => !reg[f]).map((f) => `${f} sem carimbo em carimbo_derivados.json: rode o gerador antes de publicar`);
}

// Padrão do projeto para dado provisório (guarda_lutas_comuns): avisa sempre, barra só com ER_PUBLICAR=1.
export function problemasDeCarimbo(reg, carimboDados, publicar) {
  const avisos = [...avisosDeFrescor(reg, carimboDados), ...pendentesSemCarimbo(reg)];
  return { avisos, barra: publicar && avisos.length > 0 };
}
