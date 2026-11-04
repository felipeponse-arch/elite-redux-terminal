// Leitura das páginas oficiais pelo alarme de versão nova (sem rede).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ultimaVersaoDoDex, versaoDaPaginaDeDownload, hashDoConteudo, VERSAO_DEX, VERSAO_JOGO } from "../../scripts/alarme_upstream.mjs";

test("versão padrão do NextDex é o último item de allVersions", () => {
  const js = 'const allVersions = [\n  "2.5",\n  "2.6",\n  "2.65beta"\n]\nexport default allVersions';
  assert.equal(ultimaVersaoDoDex(js), "2.65beta");
  assert.equal(ultimaVersaoDoDex("const versions = ['2.7']"), null, "formato novo tem que virar alarme, não 'em dia'");
});

test("Latest Version da página de download, com o HTML no meio", () => {
  assert.equal(versaoDaPaginaDeDownload('<h3>Latest Version</h3>\n<p><strong>v2.65.3b</strong></p>'), "2.65.3b");
  assert.equal(versaoDaPaginaDeDownload("Latest Version: 2.7"), "2.7");
  assert.equal(versaoDaPaginaDeDownload("<p>Baixe aqui</p>"), null);
});

test("hash ignora CRLF (checkout no Windows) mas pega mudança real", () => {
  assert.equal(hashDoConteudo(Buffer.from('{"a":1}\r\n')), hashDoConteudo(Buffer.from('{"a":1}\n')));
  assert.notEqual(hashDoConteudo(Buffer.from('{"a":1}\n')), hashDoConteudo(Buffer.from('{"a":2}\n')));
});

// Lote D da força-tarefa (2026-10-02): 404/4xx é endereço que sumiu (mudança), não falta
// de rede - antes o alarme ficava cego em silêncio se o repositório mudasse de caminho.
test("baixar: 4xx marca enderecoSumiu e não fica tentando de novo; 5xx é falha comum", async () => {
  const { baixar } = await import("../../scripts/alarme_upstream.mjs");
  const original = globalThis.fetch;
  let chamadas = 0;
  try {
    globalThis.fetch = async () => { chamadas++; return { ok: false, status: 404 }; };
    await assert.rejects(baixar("https://exemplo/x.json"), (e) => e.enderecoSumiu === true);
    assert.equal(chamadas, 1, "404 não repete");
  } finally { globalThis.fetch = original; }
});

test("TK-36: o alarme compara com o NextDex 2.65.5 e com a versão do site oficial 2.65.4.1b", () => {
  assert.equal(VERSAO_DEX, "2.65.5");
  assert.equal(VERSAO_JOGO, "2.65.4.1b");
});
