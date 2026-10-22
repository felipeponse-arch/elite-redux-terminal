// Treinadores COMUNS da run (ticket todas-as-lutas/01 e /02), com a etapa pelo mapa onde o jogo os coloca (o mesmo resolvedor da
// disponibilidade, scripts/etapa_do_mapa.mjs). Não grava nada em data/. Usado pelo rank (scripts/calcular_rank_v2.mjs) e pelo estudo.
// Fora: chefões e opcionais (já estão em LUTAS_DA_RUN ou ficam fora do rank), revanches, sem mapa, pós-jogo e sem etapa.
// Uso: node scripts/estudo/lutas_comuns.mjs <saída.json>
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { criarEtapaDoMapa, chaveDoMapa } from "../etapa_do_mapa.mjs";
import { timeDoTreinador, extrairChefoes } from "../extracao/chefoes.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Mapas que a planilha põe na etapa errada ou não cita, para os TREINADORES (a disponibilidade de espécie e de item não muda).
// Ginásio de Petalburg: a planilha põe a cidade na etapa 0 (o jogador passa por lá cedo), mas quem luta no ginásio é o Norman, que
// em LUTAS_DA_RUN acontece na etapa 4 (5º ginásio); sem isto a etapa 4 ficava sem nenhuma luta comum (estudo de 16/10).
// Mt Chimney: sem etapa na planilha; Tabitha e Maxie Mt Chimney (LUTAS_DA_RUN) acontecem na etapa 3.
// SS Tidal fica sem etapa de propósito: nenhuma fonte diz em que ponto da run o navio abre.
export const ETAPA_DO_MAPA_DE_TREINADOR = { PETALBURGCITYGYM: 4, MTCHIMNEY: 3 };

export function lutasComunsDaRun(raiz = RAIZ) {
  const ler = (a) => JSON.parse(readFileSync(join(raiz, "data", a), "utf8"));
  const g = ler("gameData_2654.json"), mono = ler("mono_disponibilidade.json"), caps = ler("levelcaps.json").rows, REGRAS = ler("disponibilidade_regras.json");
  const POS_JOGO = caps.length - 1;
  const etapaPlanilha = criarEtapaDoMapa(mono, REGRAS, POS_JOGO);
  const etapaDoMapa = (m) => { const k = chaveDoMapa(m); return k in ETAPA_DO_MAPA_DE_TREINADOR ? ETAPA_DO_MAPA_DE_TREINADOR[k] : etapaPlanilha(m); };
  const mapas = g.MAPST || g.mapsT;
  const chefoes = new Set(extrairChefoes(g).map((b) => b.name));
  const nomes = new Set(g.trainers.map((t) => t.name));
  // Revanche: "Nome 2" a "Nome 5" quando existe o "Nome 1" e não é grunt (grunts são numerados por pessoa, não por revanche).
  const revanche = (n) => { const m = /^(.*) ([2-9])$/.exec(n); return !!m && !/^Grunt /.test(n) && nomes.has(m[1] + " 1"); };
  const motivos = { chefao: 0, revanche: 0, semMapa: 0, semEtapa: 0, posJogo: 0, semTime: 0 };
  const semEtapa = {}, lutas = [];
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
  return { lutas, motivos, semEtapa };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const saida = process.argv[2];
  if (!saida) throw new Error("uso: node scripts/estudo/lutas_comuns.mjs <saída.json>");
  const r = lutasComunsDaRun();
  writeFileSync(saida, JSON.stringify(r));
  const porEtapa = {};
  r.lutas.forEach((l) => { porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1; });
  console.log("lutas comuns: " + r.lutas.length + " | fora: " + JSON.stringify(r.motivos));
  console.log("por etapa: " + JSON.stringify(porEtapa));
  console.log("mapas sem etapa (top 10): " + Object.entries(r.semEtapa).sort((a, b) => b[1] - a[1]).slice(0, 10).map((e) => e.join(":")).join(", "));
}
