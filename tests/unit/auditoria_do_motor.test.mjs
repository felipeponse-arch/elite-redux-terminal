// Auditoria permanente do motor do duelo (revisão da equipe, 2026-09-30, pedido do
// usuário: "minimizar" as vezes em que um erro só aparece no meio do trabalho).
// As auditorias que eram feitas à mão viraram teste: uma habilidade ou efeito de
// golpe NOVO sem regra (versão nova do jogo, dado atualizado) faz o teste falhar e
// obriga a decidir - implementar ou registrar aqui com o motivo. E se um item da
// lista passar a ser lido, o teste também avisa, pra lista não mentir.
// Na criação, este teste já achou um erro: o Embody Aspect do Ogerpon ("+1 Attack
// on Entry") não era lido nas formas de Ataque e Defesa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();

// Habilidades em uso que o motor NÃO lê, e por quê (memória: project_habilidades_sem_regra).
const HABILIDADES_SEM_REGRA = {
  "Angel's Wrath": "efeito extra por golpe (Tackle, String Shot...; código oficial) - não modelado, 1 espécie",
  "Temporal Rupture": "Roar of Time põe Slow Start por 5 turnos (código oficial) - status por golpe não modelado, só Dialga",
  "Hollow Ice Zone": "golpe Ice vira o alvo tipo Ice e o usuário sai (código oficial) - troca de tipo do alvo não modelada",
  "Flammable Coat": "troca de forma sem forma alternativa no dado",
  "Spiteful": "mexe em PP sem dizer quanto; o simulador não gasta PP",
  "Symbiosis": "passa item ao aliado; o 2x2 não controla item gasto",
  "Honey Gather": "acha item fora de batalha",
  "Tag": "Pursuit em quem troca; o jogador não troca contra o chefão no modelo",
  "Multitype": "cada placa é uma espécie própria no dado",
};

// A conta mora no motor (habilidadeSemRegraNoDuelo): é a mesma que decide o selo "estimada" do pipeline de build (versao-nova/03).
function habilidadesNaoLidas() {
  const emUso = new Set();
  R.SPECIES.forEach((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).forEach((id) => emUso.add(id)));
  return [...emUso].filter((id) => R.habilidadeSemRegraNoDuelo(id)).map((id) => R.ABILITIES[id][0]);
}

test("habilidades em uso sem regra: só as registradas, cada uma com motivo", () => {
  const naoLidas = [...new Set(habilidadesNaoLidas())].sort();
  const novas = naoLidas.filter((n) => !HABILIDADES_SEM_REGRA[n]);
  const jaLidas = Object.keys(HABILIDADES_SEM_REGRA).filter((n) => naoLidas.indexOf(n) === -1);
  assert.equal(novas.length, 0, "habilidade SEM regra que não está na lista (implementar ou registrar com motivo): " + novas.join(", "));
  assert.equal(jaLidas.length, 0, "habilidade da lista que o motor agora lê (tirar da lista): " + jaLidas.join(", "));
});

test("habilidade composta ('A + B') aplica o efeito de TODAS as partes", () => {
  const semClimas = (k, v) => (k === "climasProprios" ? undefined : v);
  const base = R.efeitoDasHabilidadesNoDuelo([], "AUD_BASE", null);
  const diff = (e) => { const o = {}; for (const k of Object.keys(e)) if (JSON.stringify(e[k], semClimas) !== JSON.stringify(base[k], semClimas)) o[k] = 1; return o; };
  const faltas = [];
  R.DATA.abilities.forEach((a, id) => {
    if (!a || !/^[A-Z][\w' ]+ \+ [A-Z]/.test(a[1] || "")) return;
    const dc = diff(R.efeitoDasHabilidadesNoDuelo([id], "AUDC_" + id, null));
    a[1].split(/[.;]/)[0].split(/\s*\+\s*/).forEach((p) => {
      const pid = R.ABILITY_ID_BY_NAME[p.trim()];
      if (pid === undefined) return;
      const perdidos = Object.keys(diff(R.efeitoDasHabilidadesNoDuelo([pid], "AUDP_" + pid, null))).filter((k) => !(k in dc) && k !== "climasProprios");
      if (perdidos.length) faltas.push(a[0] + " perde " + p.trim() + " (" + perdidos.join(",") + ")");
    });
  });
  assert.equal(faltas.length, 0, faltas.join("; "));
});

// Efeitos de golpe de dano do dado (move_categorias.ef) que nenhuma regra do motor cita
// pelo nome. Parte é tratada por outro caminho (texto do golpe, marcação); os outros são
// lacunas conhecidas, a revisar (planner de 30/09). Efeito NOVO faz o teste falhar.
const EFEITOS_DE_GOLPE_SEM_REGRA_EXPLICITA = ["Accuracy Down Hit", "Argument Hit", "Argument Hit If Stat Up", "Bug Bite", "Bulldoze", "Burn Up",
  "Creeping Thorns Hit", "Curse Hit", "Fairy Terrain Hit", "Feint",
  "Flame Burst", "Flinch Recoil 33", "Fling", "Freeze Dry", "Grassy Terrain Hit", "Grav Apple", "Hit",
  "Hit Prevent Escape", "Hyperspace Fury", "Incinerate", "Leech Seed Hit",
  "Mind Blown", "Misc Hit", "Mortal Spin", "Natural Gift", "Nightmare", "Pay Day", "Rain Hit",
  "Recoil 33", "Remove Terrain No Fail", "Rip And Tear", "Round", "Sandstorm Hit", "Sleep Hit",
  "Smack Down", "Snap Jaw", "Snore", "Sparkling Aria", "Spike Hit", "Stealth Rock Hit", "Sticky Web Hit", "Tailwind Hit",
  "Thief", "Trepidation", "Two Turn Retaliation", "Wake Up Slap"];

test("efeitos de golpe sem regra explícita: só os já conhecidos", () => {
  const src = readdirSync("src/regras").map((f) => readFileSync("src/regras/" + f, "utf8")).join("\n");
  const efs = new Set();
  Object.keys(R.MOVE_CATEGORIAS).forEach((i) => { const e = R.MOVE_CATEGORIAS[i] && R.MOVE_CATEGORIAS[i].ef, m = R.MOVES[i]; if (e && m && m[3] > 0) efs.add(e); });
  const semRegra = [...efs].filter((e) => !src.includes('"' + e + '"'));
  const novos = semRegra.filter((e) => EFEITOS_DE_GOLPE_SEM_REGRA_EXPLICITA.indexOf(e) === -1);
  const tratados = EFEITOS_DE_GOLPE_SEM_REGRA_EXPLICITA.filter((e) => semRegra.indexOf(e) === -1);
  assert.equal(novos.length, 0, "efeito de golpe NOVO sem regra (decidir: implementar ou registrar): " + novos.join(", "));
  assert.equal(tratados.length, 0, "efeito da lista que o motor agora cita (tirar da lista): " + tratados.join(", "));
});
