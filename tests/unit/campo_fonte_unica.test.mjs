// TK-16 (campo, fase 1): src/regras/campo.js é a fonte única de clima, terreno, telas, hazards e durações de campo.
// Paridade entre os consumidores (dados_base, condicoes_habilidade, time_pelo_motor_papeis, mono_run, duelo, prompts_ia)
// e durações iguais às do código do jogo (include/battle_util.h, ramo upcoming do er-repo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const J = (a) => JSON.stringify(Array.from(a));
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nome) => R.efeitoDasHabilidadesNoDuelo([idHab(nome)], "TK16_" + nome, null);

test("clima: a lista e os rótulos do campo.js são os que os consumidores usam", () => {
  assert.equal(J(R.CLIMAS_DE_ESTRATEGIA), J(R.CLIMAS_DO_CAMPO));
  assert.equal(J(Object.keys(R.MOTOR_ROTULO_CLIMA)), J(R.CLIMAS_DO_CAMPO));
  // todo clima que um arquétipo mapeia existe no motor, e todo clima do motor tem arquétipo
  const doArquetipo = Object.values(R.CONDICAO_DO_ARQUETIPO).filter((c) => !c.startsWith("terreno"));
  assert.equal(J([...doArquetipo].sort()), J([...R.CLIMAS_DO_CAMPO].sort()));
  // climaQueCombina (mono_run) só aponta para arquétipo existente
  Object.keys(R.CLIMA_QUE_COMBINA).forEach((t) => assert.ok(R.WEATHER_ARCHETYPES.includes(R.CLIMA_QUE_COMBINA[t].clima), t));
});

test("terreno: id, tipo reforçado e arquétipo batem entre campo.js, condições e duelo", () => {
  assert.equal(J(Object.values(R.TERRENO_DO_TEXTO).sort()), J([...R.TERRENOS_DO_CAMPO].sort()));
  assert.equal(J(Object.keys(R.TIPO_DO_TERRENO).sort()), J([...R.TERRENOS_DO_CAMPO].sort()));
  const condTerreno = Object.values(R.CONDICAO_DO_ARQUETIPO).filter((c) => c.startsWith("terreno"));
  // Psychic Terrain não tem condição de habilidade no mapa (comportamento existente, fora do TK-16): 4 de 5.
  assert.equal(condTerreno.length, R.TERRENOS_DO_CAMPO.length - 1);
  assert.equal(R.WEATHER_ARCHETYPES.length, R.ARQUETIPOS_DE_CAMPO.length);
  // cada habilidade que arma terreno resolve para um id do campo.js
  ["Electro Surge", "Grassy Surge", "Psychic Surge", "Misty Surge", "Toxic Surge"].forEach((h) => {
    assert.ok(R.TERRENOS_DO_CAMPO.includes(efDe(h).armaTerreno), h);
  });
});

test("duração de campo vem do código do jogo e as habilidades de entrada a usam", () => {
  const D = R.DURACAO_CAMPO;
  assert.equal(J([D.clima, D.terreno, D.sala, D.salaCurta, D.inversaCurta, D.tela, D.telaLightClay, D.telaCurta, D.vento]), J([8, 8, 5, 3, 3, 5, 8, 3, 3]));
  assert.equal(R.CLIMA_OFICIAL.duracaoTurnos, D.clima);
  assert.equal(efDe("Twist. Dimension").sala, D.salaCurta);
  assert.equal(efDe("Air Blower").vento, D.vento);
});

test("prompt: terreno cita a duração do campo.js e o clima sai em português, sem chave inglesa crua", () => {
  assert.match(R.WEATHER_BUILD_GUIDANCE["Grassy Terrain"], new RegExp("^" + R.DURACAO_CAMPO.terreno + " turnos"));
  assert.equal(R.rotuloDoArquetipoDeCampo("Sand"), "Areia");
  assert.equal(R.rotuloDoArquetipoDeCampo("Electric Terrain"), "Terreno Elétrico");
  R.ARQUETIPOS_DE_CAMPO.forEach((a) => assert.ok(R.ROTULO_ARQUETIPO_CAMPO[a], a));
});

test("hazard: golpe e habilidade usam o mesmo caminho (camadas máximas do campo.js)", () => {
  const lado = { rocha: false, espinho: 0, toxico: 0, teia: false };
  for (let i = 0; i < 5; i++) Object.values(R.HAZARD_DO_GOLPE).forEach((h) => R.poeHazardNoLado(lado, h));
  assert.equal(J([lado.rocha, lado.espinho, lado.toxico, lado.teia]), J([true, 3, 2, true]));
  Object.values(R.HAZARD_DO_GOLPE).forEach((h) => assert.ok(R.hazardCheioNoLado(lado, h), h));
  assert.equal(R.hazardCheioNoLado({ espinho: 2 }, "espinho"), false);
  assert.equal(R.planoDoGolpeStatus(R.MOVE_ID_BY_NAME["Spikes"]).hazard, "espinho");
});
