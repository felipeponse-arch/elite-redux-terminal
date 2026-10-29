// Fonte: data/gameData.json + regras do motor atuais (instantâneo de caracterização, TK-22); regenerar só junto com mudança de regra aprovada.
// Gera o instantâneo de caracterização da liberação por Etapa (TK-22): cada pedra e item x Etapas 0-10.
// Uso: node tests/unit/fixtures/gerar_liberacao_por_etapa.mjs > tests/unit/fixtures/liberacao_por_etapa.json
import { readFileSync } from "node:fs";
import { carregarRegras } from "../carregar_regras.mjs";
export function instantaneo() {
  const R = carregarRegras();
  const g = JSON.parse(readFileSync(new URL("../../../data/gameData.json", import.meta.url), "utf8"));
  const nomes = new Set([...g.items.map((i) => i.name), ...Object.keys(R.MEGA_FORMS), ...Object.keys(R.MEGA_PEDRAS_TARDIAS)]);
  const saida = {};
  for (const n of [...nomes].sort()) {
    let item = "", pedra = "";
    for (let e = 0; e <= 10; e++) { item += R.liberadoNaRun(e, null, { item: n }) ? "1" : "0"; pedra += R.liberadoNaRun(e, null, { pedra: n }) ? "1" : "0"; }
    saida[n] = { item, pedra, etapaPedra: R.etapaDaPedra(n), etapaItem: R.etapaDoItem(n) };
  }
  return saida;
}
if (process.argv[1] && process.argv[1].endsWith("gerar_liberacao_por_etapa.mjs")) process.stdout.write(JSON.stringify(instantaneo(), null, 0) + "\n");
