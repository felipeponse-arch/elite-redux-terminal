// Servidor estático dos testes (fase 6 da refatoração, 2026-09-24): serve a raiz
// do projeto (artifact_final.html + scripts/smoke_tests/) pro Playwright. O
// playwright.config.mjs sobe este servidor sozinho (webServer) - ninguém precisa
// abrir nada antes de rodar os testes.
//
// Por que não o scripts/dev_server.ps1: aquele atende UMA requisição por vez e
// só roda no Windows - com vários workers em paralelo ele vira gargalo, e o CI
// Linux (fase 8) não tem PowerShell 5.1. O dev_server.ps1 continua sendo o do
// preview manual (launch.json), com o mock de sincronização via ?mock_db=1; nos
// testes o mock entra por page.addInitScript (tests/e2e/apoio.mjs).
//
// Uso: node scripts/servidor_estatico.mjs [porta]   (padrão 8101)
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTA = Number(process.argv[2] || process.env.PORTA_TESTES || 8101);
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
};

createServer((req, res) => {
  let caminho;
  try {
    caminho = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (caminho === "/") caminho = "/artifact_final.html";
  const arquivo = normalize(join(RAIZ, caminho));
  // Nunca sai da pasta do projeto (../ na URL).
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end();
    return;
  }
  let info;
  try {
    info = statSync(arquivo);
  } catch {
    info = null;
  }
  if (!info || !info.isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": TIPOS[extname(arquivo).toLowerCase()] || "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": "no-store",
  });
  createReadStream(arquivo).pipe(res);
}).listen(PORTA, "127.0.0.1", () => {
  console.log(`servidor de testes em http://localhost:${PORTA}/ (raiz: ${RAIZ})`);
});
