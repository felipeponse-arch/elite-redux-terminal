// Varredura dos dados de TODOS os chefes (membros de party/insane/hell): pedra sem Mega, habilidade/golpe sem id,
// item sem descrição, membro que não monta no simulador. Uso: node scripts/varrer_chefoes.mjs
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";
const R = carregarRegras({ milestone: 9 });
const probs = {};
const add = (k, v) => { (probs[k] = probs[k] || new Set()).add(v); };
let membros = 0;
for (const b of R.BOSSES) for (const tier of ["party", "insane", "hell"]) for (const m of (b[tier] || [])) {
  membros++;
  const ref = b.name + "/" + tier + "/" + m.n;
  if (m.item && /ite( [XYZ])?$/.test(m.item) && !/Berry|Orb|Plate/.test(m.item) && !R.MEGA_FORMS[m.item]) add("pedra sem forma mega no dado", m.item + " (" + ref + ")");
  if (m.abi && R.ABILITY_ID_BY_NAME[m.abi] === undefined) add("habilidade sem id", m.abi + " (" + ref + ")");
  (m.mv || []).forEach((mv) => { if (mv && R.MOVE_ID_BY_NAME[mv] === undefined) add("golpe sem id", mv + " (" + ref + ")"); });
  if (m.item && !R.ITEM_DESC[m.item]) add("item sem descrição", m.item);
  let foe = null;
  try { foe = R.foeDeDuelo(m, 60, null); } catch (e) { add("foeDeDuelo estoura", e.message + " (" + ref + ")"); }
  if (foe && !(foe.golpesProntos || []).length) add("sem golpe de dano pronto", ref);
}
console.log("membros conferidos:", membros);
for (const [k, v] of Object.entries(probs)) { console.log("\n## " + k + " (" + v.size + ")"); [...v].slice(0, 12).forEach((x) => console.log("  " + x)); }
