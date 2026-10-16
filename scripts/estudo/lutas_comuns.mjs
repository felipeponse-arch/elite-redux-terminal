// Estudo "todas as lutas" (ticket docs/tickets/todas-as-lutas/01, 16/10/2026): os treinadores COMUNS da run, com a etapa pelo
// mapa onde o jogo os coloca (o mesmo resolvedor da disponibilidade, scripts/etapa_do_mapa.mjs). Não grava nada em data/.
// Fora: chefões e opcionais (já estão em LUTAS_DA_RUN ou ficam fora do rank), revanches, sem mapa, pós-jogo e sem etapa.
// Uso: node scripts/estudo/lutas_comuns.mjs <saída.json>
import { readFileSync, writeFileSync } from "node:fs";
import { criarEtapaDoMapa } from "../etapa_do_mapa.mjs";
import { timeDoTreinador, extrairChefoes } from "../extracao/chefoes.mjs";

const saida = process.argv[2];
if (!saida) throw new Error("uso: node scripts/estudo/lutas_comuns.mjs <saída.json>");
const g = JSON.parse(readFileSync("data/gameData_2654.json", "utf8"));
const mono = JSON.parse(readFileSync("data/mono_disponibilidade.json", "utf8"));
const caps = JSON.parse(readFileSync("data/levelcaps.json", "utf8")).rows;
const REGRAS = JSON.parse(readFileSync("data/disponibilidade_regras.json", "utf8"));
const POS_JOGO = caps.length - 1;
const etapaDoMapa = criarEtapaDoMapa(mono, REGRAS, POS_JOGO);
const mapas = g.MAPST || g.mapsT;
const chefoes = new Set(extrairChefoes(g).map((b) => b.name));
const nomes = new Set(g.trainers.map((t) => t.name));

// Revanche: "Nome 2" a "Nome 5" quando existe o "Nome 1" e não é grunt (grunts são numerados por pessoa, não por revanche).
const revanche = (n) => { const m = /^(.*) ([2-9])$/.exec(n); return !!m && !/^Grunt /.test(n) && nomes.has(m[1] + " 1"); };
const motivos = { chefao: 0, revanche: 0, semMapa: 0, semEtapa: 0, posJogo: 0, semTime: 0 };
const semEtapa = {};
const lutas = [];
for (const t of g.trainers) {
  if (chefoes.has(t.name)) { motivos.chefao++; continue; }
  if (revanche(t.name)) { motivos.revanche++; continue; }
  if (t.map === undefined || t.map === null || t.map < 0 || !mapas[t.map]) { motivos.semMapa++; continue; }
  const etapa = etapaDoMapa(mapas[t.map]);
  if (etapa === undefined || etapa === null) { motivos.semEtapa++; semEtapa[mapas[t.map]] = (semEtapa[mapas[t.map]] || 0) + 1; continue; }
  if (etapa >= POS_JOGO) { motivos.posJogo++; continue; }
  const party = [].concat(timeDoTreinador(g, t.party) || []);
  if (!party.length) { motivos.semTime++; continue; }
  lutas.push({ nome: t.name + " #" + t.id, etapa, mapa: mapas[t.map], db: !!t.db, party, insane: [].concat(timeDoTreinador(g, t.insane) || []) });
}
writeFileSync(saida, JSON.stringify({ lutas, motivos, semEtapa }));
const porEtapa = {};
lutas.forEach((l) => { porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1; });
console.log("lutas comuns: " + lutas.length + " | fora: " + JSON.stringify(motivos));
console.log("por etapa: " + JSON.stringify(porEtapa));
console.log("mapas sem etapa (top 10): " + Object.entries(semEtapa).sort((a, b) => b[1] - a[1]).slice(0, 10).map((e) => e.join(":")).join(", "));
