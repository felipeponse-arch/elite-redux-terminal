// Depende de dado: nome de habilidade das lutas comuns e versão gravada pelo build (muda quando o jogo troca de versão).
// TK-36: o gerador de lutas comuns lia "Sun Basking" do gameData.json e o rank regravava o nome velho em data/lutas_comuns_run.json.
import test from "node:test";
import assert from "node:assert/strict";
import { lutasComunsDaRun, comNomeAtualDeHabilidade } from "../../scripts/estudo/lutas_comuns.mjs";

test("comNomeAtualDeHabilidade troca Sun Basking por Basking e não mexe no resto", () => {
  const r = comNomeAtualDeHabilidade([{ x: 1, abi: "Sun Basking", abiId: 7 }, { x: 2, abi: "Intimidate" }, null]);
  assert.deepEqual(r, [{ x: 1, abi: "Basking", abiId: 7 }, { x: 2, abi: "Intimidate" }, null]);
});

test("lutasComunsDaRun (dado real) não devolve nenhum membro com o nome velho", () => {
  const { lutas } = lutasComunsDaRun();
  const velhos = lutas.flatMap((l) => [...l.party, ...l.insane]).filter((m) => m && m.abi === "Sun Basking");
  assert.equal(velhos.length, 0);
});
