// Atualiza data/gameData_2654.json a partir do er-config (código/config do jogo é a verdade).
// Uso: node scripts/atualizar_de_config.mjs <pasta-er-config> [--aplicar] [--saida=relatorio.json]
// Só sobrepõe campos que mapeiam sem ambiguidade (nome, texto, números, tipo, alvo, split, habilidades, inatas,
// stats base). Efeito/flags/evoluções/learnsets de espécie existente NÃO são tocados (ver relatório).
import fs from 'node:fs';
import path from 'node:path';

const [, , cfg, ...flags] = process.argv;
const aplicar = flags.includes('--aplicar');
const saida = (flags.find((f) => f.startsWith('--saida=')) || '').slice(8);
const arq = path.resolve('data/gameData_2654.json');

// textproto: \NNN (octal) são bytes UTF-8 (ex.: Poké), \xHH idem, \n quebra de linha, \c = c
function desescapar(s) {
  const b = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '\\') { b.push(...Buffer.from(s[i])); continue; }
    const o = s.slice(i + 1, i + 4), h = s.slice(i + 2, i + 4);
    if (/^[0-7]{3}$/.test(o)) { b.push(parseInt(o, 8)); i += 3; } else if (s[i + 1] === 'x' && /^[0-9a-f]{2}$/i.test(h)) { b.push(parseInt(h, 16)); i += 3; } else { const c = s[++i]; b.push(...Buffer.from(c === 'n' ? '\n' : c)); }
  }
  return Buffer.from(b).toString('utf8');
}
function parse(txt) {
  const raiz = {}; const pilha = [raiz];
  for (let l of txt.split(/\r?\n/)) {
    l = l.trim();
    if (!l || l[0] === '#') continue;
    if (l === '}') { pilha.pop(); continue; }
    let m;
    if ((m = l.match(/^([\w]+)\s*\{$/))) {
      const o = {}; (pilha.at(-1)[m[1]] ||= []).push(o); pilha.push(o);
    } else if ((m = l.match(/^([\w]+):\s*(.*)$/))) {
      let v = m[2];
      if (v[0] === '"') v = desescapar(v.slice(1, -1));
      else if (v[0] !== undefined && /^-?\d+(\.\d+)?$/.test(v)) v = Number(v); else if (v === 'true') v = true; else if (v === 'false') v = false;
      (pilha.at(-1)[m[1]] ||= []).push(v);
    }
  }
  return raiz;
}
const ler = (f) => fs.readFileSync(path.join(cfg, f), 'utf8');
function enumMap(f) {
  const m = {};
  for (const x of ler(f).matchAll(/^\s*(\w+)\s*=\s*(\d+);/gm)) m[x[1]] = Number(x[2]);
  return m;
}
const E = { ab: enumMap('AbilityEnum.proto'), mv: enumMap('MoveEnum.proto'), sp: enumMap('SpeciesEnum.proto'), it: enumMap('ItemEnum.proto') };
const g = JSON.parse(fs.readFileSync(arq, 'utf8'));
const idx = (t, n) => t.indexOf(n);
const rel = { carimbo: {}, abilities: { novas: [], texto: [] }, moves: { novos: [], mudou: [] }, items: { novos: [] }, species: { novas: [], mudou: [], incompletas: [] } };

// habilidades
const AL = parse(ler('AbilityList.textproto')).ability;
const porId = (arr) => new Map(arr.map((x) => [x.id, x]));
const ab = porId(g.abilities);
for (const a of AL) {
  const id = E.ab[a.id?.[0]]; if (id == null) continue;
  const nome = a.name[0], desc = a.description?.[0] ?? '';
  const o = ab.get(id);
  if (!o) { const n = { name: nome, desc, id }; g.abilities.push(n); ab.set(id, n); rel.abilities.novas.push({ id, nome, desc }); continue; }
  if (o.name !== nome || o.desc !== desc) { rel.abilities.texto.push({ id, nomeAntigo: o.name, nomeNovo: nome, antigo: o.desc, novo: desc }); o.name = nome; o.desc = desc; }
}
// golpes
const ML = parse(ler('MoveList.textproto')).moves;
const mv = porId(g.moves);
for (const m of ML) {
  const NAME = m.id?.[0], id = E.mv[NAME]; if (id == null) continue;
  const novo = {
    name: m.name[0], sName: m.short_name?.[0] ?? m.name[0], pwr: m.power?.[0] ?? 0, acc: m.accuracy?.[0] ?? 0, pp: m.pp?.[0] ?? 0,
    prio: m.priority?.[0] ?? 0, chance: m.effect_chance?.[0] ?? 0, desc: m.short_description?.[0] ?? '', lDesc: m.description?.[0] ?? '',
    types: [idx(g.typeT, (m.type?.[0] ?? 'TYPE_NORMAL').slice(5).replace(/^./, (c) => c) .toLowerCase().replace(/^./, (c) => c.toUpperCase()))],
    target: idx(g.targetT, m.target?.[0]), split: idx(g.splitT, m.split?.[0]),
  };
  const o = mv.get(id);
  if (!o) { const n = { ...novo, NAME, eff: 0, flags: [], arg: '', id, usesHpType: false }; g.moves.push(n); mv.set(id, n); rel.moves.novos.push({ id, nome: novo.name }); continue; }
  const dif = {};
  for (const k of Object.keys(novo)) if (JSON.stringify(o[k]) !== JSON.stringify(novo[k])) { dif[k] = [o[k], novo[k]]; o[k] = novo[k]; }
  if (Object.keys(dif).length) rel.moves.mudou.push({ id, nome: o.name, dif });
}
// itens
const IT = [];
for (const f of fs.readdirSync(path.join(cfg, 'items'))) IT.push(...(parse(ler('items/' + f)).item || []));
const it = porId(g.items);
for (const i of IT) {
  const NAME = i.id?.[0], id = E.it[NAME]; if (id == null) continue;
  const o = it.get(id);
  if (!o) { const n = { name: i.name[0], NAME, id }; g.items.push(n); it.set(id, n); rel.items.novos.push({ id, nome: n.name }); }
  else if (o.name !== i.name[0]) { rel.items.novos.push({ id, nome: i.name[0], antigo: o.name, renomeado: true }); o.name = i.name[0]; }
}
// espécies
const SL = parse(ler('SpeciesList.textproto')).species || [];
const sp = porId(g.species);
const novasObj = [];
for (const s of SL) {
  const NAME = s.id?.[0], id = E.sp[NAME]; if (id == null) continue;
  const tipo = (n) => idx(g.typeT, n.slice(5).toLowerCase().replace(/^./, (c) => c.toUpperCase()));
  const t = s.type2 ? [...s.type, ...s.type2].map(tipo) : []; // config omite type2 em vários: só vale com type2
  const base = [s.hp?.[0], s.atk?.[0], s.def?.[0], s.spatk?.[0], s.spdef?.[0], s.spe?.[0]];
  const abis = (s.ability || []).length === 3 ? s.ability.map((x) => E.ab[x] ?? 0) : [], inns = (s.innate || []).length === 3 ? s.innate.map((x) => E.ab[x] ?? 0) : [];
  const o = sp.get(id);
  if (!o) {
    // Espécie nova: só entra se a config traz tudo (6 stats, tipo, 3 habilidades, 3 inatas). Incompleta (ex.: Bruxish/Jellicent Mega
    // sem spe) fica de fora = escondida, e é listada. SPECIES_EGG não está no SpeciesEnum (placeholder), então nem chega aqui.
    const info = { id, nome: NAME, NAME, base, types: t, abis, inns };
    if (!base.every((x) => x != null) || !t.length || !abis.length || !inns.length) { rel.species.incompletas.push(info); continue; }
    const mae = sp.get(E.sp[s.form_of?.[0]]) ; // forma-base (de onde vêm dex, grupo de ovo, cor)
    const fonte = s.mega ? sp.get(E.sp[s.mega[0].from?.[0]]) : null; // Mega herda golpes da forma Redux de origem
    const L = s.learnset?.[0] || {};
    const lv = []; for (const l of L.level || []) for (const m of l.move || []) lv.push({ id: E.mv[m] ?? -1, lv: l.level[0] });
    const tut = (L.tutor || []).map((m) => E.mv[m]);
    const evolutions = (s.evo || []).map((e) => ({ kd: 0, rs: String(e.level?.[0] ?? 0), in: E.sp[e.to[0]] }));
    const n = { name: NAME.slice(8).toLowerCase().split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), NAME,
      stats: { base, types: t, catchR: 0, exp: 0, EVY: [0, 0, 0, 0, 0, 0], gender: (s.percent_female?.[0] ?? 50) * 254, eggC: 0, fren: 0, grow: 0, eggG: mae ? mae.stats.eggG : [], abis, inns, col: mae ? mae.stats.col : 0, noFlip: false, flags: '' },
      evolutions, eggMoves: [], levelUpMoves: s.mega && fonte ? fonte.levelUpMoves : lv, TMHMMoves: [], tutor: s.mega && fonte ? fonte.tutor : tut, forms: [], SEnc: [], dex: mae ? mae.dex : { id: 0, desc: '', hw: [0, 0] }, id };
    if (lv.some((m) => m.id < 0) || tut.some((m) => m == null)) { rel.species.incompletas.push({ ...info, motivo: 'golpe fora do MoveEnum' }); continue; }
    g.species.push(n); sp.set(id, n); rel.species.novas.push(info); novasObj.push(n);
    // Mega: a forma de origem ganha a evolução por pedra (in = índice da Mega em g.species, como o dado bruto)
    if (s.mega && fonte) { const kd = g.evoKindT.indexOf('EVO_MEGA_EVOLUTION'); if (!fonte.evolutions.some((e) => e.kd === kd)) fonte.evolutions.push({ kd, rs: s.mega[0].item[0], in: g.species.length - 1 }); }
    continue;
  }
  const dif = {};
  const cmp = (k, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) { dif[k] = [a, b]; return true; } };
  if (base.every((x) => x != null) && cmp('base', o.stats.base, base)) o.stats.base = base;
  if (t.length && cmp('types', o.stats.types, t)) o.stats.types = t;
  if (abis.length && cmp('abis', o.stats.abis, abis)) o.stats.abis = abis;
  if (inns.length && cmp('inns', o.stats.inns, inns)) o.stats.inns = inns;
  if (Object.keys(dif).length) rel.species.mudou.push({ id, nome: o.name, dif });
}
// evolução por nível: `in` é o ÍNDICE em g.species (não o id), e o alvo pode vir depois na lista
for (const n of novasObj) for (const e of n.evolutions) if (e.kd === 0) e.in = g.species.findIndex((x) => x.id === e.in);
rel.carimbo = { origem: 'er-config', pasta: cfg };
console.log(JSON.stringify({ abNovas: rel.abilities.novas.length, abTexto: rel.abilities.texto.length, mvNovos: rel.moves.novos.length, mvMudou: rel.moves.mudou.length, itNovos: rel.items.novos.length, spNovas: rel.species.novas.length, spIncompletas: rel.species.incompletas.length, spMudou: rel.species.mudou.length }));
if (saida) fs.writeFileSync(saida, JSON.stringify(rel, null, 1));
if (aplicar) fs.writeFileSync(arq, JSON.stringify(g));
