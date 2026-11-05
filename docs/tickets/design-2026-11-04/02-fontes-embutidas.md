# 02 - Fontes embutidas no app

Status: resolvido

## Decisão do usuário (05/11/2026)
Embutir as fontes para o app não depender do Google Fonts e o teste visual ficar determinístico (o visual falhava 19/20
mesmo contra imagens regravadas minutos antes).

## O que foi feito
- Fontes (SIL OFL 1.1), só `latin`, em `data/fontes/` (detalhe, versão e URL em `data/fontes/FONTES.md`):
  Bricolage Grotesque variável 500-800 (76.888 B), Figtree variável 400-700 (20.156 B), IBM Plex Mono 400/500/600
  (14.708 + 14.888 + 15.620 B), Potta One 400 (25.104 B). Total 167.364 B. Potta One também era carregada (títulos).
- `src/css/fontes.css` com os `@font-face`; o build troca `__FONTE_*_DATAURI__` por `data:font/woff2;base64,...`.
- Template sem link/preconnect do Google; o script `ligar-fontes` só marca `window.__fontesProntas` com `document.fonts.ready`.
- artifact_final.html: 9.297.015 B (8,87 MB) -> 9.520.574 B (9,08 MB), +223 KB.

## Critérios de aceite
- [x] artifact_final sem `fonts.googleapis.com` / `fonts.gstatic.com` (tests/unit/fontes_embutidas.test.mjs)
- [x] `@font-face` em base64 das 4 famílias (mesmo teste); template sem base64
- [x] `npm run check` e `npm run build` verdes
- [x] Visual determinístico: 2 rodadas sem update = mesmos 19 desvios, mesmos pixels
- [x] 19 imagens-base regravadas (1 já passava) em commit separado; rodada seguinte 20/20
- [x] CSP do claude.ai aceita `font-src data:`: o guia do servidor de artifacts (05/11) diz "Fonts: from fonts.gstatic.com (through a Google Fonts stylesheet), or inlined as data: URIs." Confirmar visualmente na primeira publicação.
- [x] Texto da licença OFL de cada família junto das fontes (`data/fontes/OFL-*.txt`, conferido em METADATA.pb)

## Fora do escopo / notas
- Sem latin-ext: caractere fora de Latin-1 cai na fonte de reserva da pilha.
- Teste e2e de desempenho que atrasava o Google virou "nenhuma requisição externa + fontes disponíveis".

## Imagens-base regravadas (19 de 20)
As diferenças vêm de três causas somadas: (a) design do TK-60; (b) dado novo (data do cabeçalho 03 para 04/11 e texto
de habilidade novo do TK-46); (c) fontes embutidas. O usuário VIU os diffs (relatorios/2655b/diff_visual_tk60_ab e
diff_visual_juncao) e autorizou regravar depois de provado o determinismo (duas rodadas seguidas iguais).

## Proteções restauradas/novas (05/11, decisão do usuário)
- FCP < 1.500 ms de volta em tests/e2e/desempenho.spec.mjs (era o limite do teste antigo com fonte atrasada), agora sem
  fonte externa: mediana de 3 cargas; limite não afrouxado.
- Teto de 10 MB para artifact_final.html no mesmo spec (hoje ~9,08 MB; o servidor aceita até 16 MiB).
