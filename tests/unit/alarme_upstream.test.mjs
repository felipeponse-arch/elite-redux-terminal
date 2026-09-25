// Leitura das páginas oficiais pelo alarme de versão nova (sem rede).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ultimaVersaoDoDex, versaoDaPaginaDeDownload, hashDoConteudo } from "../../scripts/alarme_upstream.mjs";

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
