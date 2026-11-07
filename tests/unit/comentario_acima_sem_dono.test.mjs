// TK-33b item 9: comentário "NOME_EM_CAIXA_ALTA acima" não pode apontar para algo declarado em OUTRO arquivo
// (em itens_do_time.js ele apontava ITEM_STAT_MODS, que mora em calc_stat.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { lerComMutacao } from "./carregar_regras.mjs";

const declara = (texto, id) => new RegExp("\\b(var|let|const|function)\\s+" + id + "\\b").test(texto);

test("'NOME acima' num comentário não aponta para algo declarado em OUTRO arquivo de src", () => {
  const arquivos = [];
  for (const dir of ["src/regras", "src/ui"]) {
    for (const nome of readdirSync(dir).filter((f) => f.endsWith(".js"))) arquivos.push({ caminho: dir + "/" + nome, texto: lerComMutacao(dir + "/" + nome, dir === "src/ui" ? "ui/" + nome : nome) });
  }
  const problemas = [];
  arquivos.forEach(({ caminho, texto }) => {
    texto.split("\n").forEach((linha, i) => {
      const m = linha.match(/\/\/.*?\b([A-Z][A-Z0-9_]{3,}(?:\/[A-Z][A-Z0-9_]{3,})*) acima/);
      if (!m) return;
      m[1].split("/").forEach((id) => {
        if (!declara(texto, id) && arquivos.some((o) => o.caminho !== caminho && declara(o.texto, id))) problemas.push(caminho + ":" + (i + 1) + " " + id);
      });
    });
  });
  assert.deepEqual(problemas, []);
});
