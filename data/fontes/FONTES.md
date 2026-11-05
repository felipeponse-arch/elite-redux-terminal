# Fontes embutidas

Licença de todas: SIL Open Font License 1.1 (uso e redistribuição livres, inclusive embutidas). Baixadas em 05/11/2026
do Google Fonts (mesma origem que o app usava), só o subconjunto `latin`. O build (`scripts/build.mjs`) embute cada
arquivo em base64 no `@font-face` de `src/css/fontes.css`.

| Arquivo | Família / pesos | Versão (gstatic) | URL de origem |
|---|---|---|---|
| bricolage-grotesque-500-800-latin.woff2 | Bricolage Grotesque, variável (eixos wght e opsz), 500-800 | v9 | https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGIInE.woff2 |
| figtree-400-700-latin.woff2 | Figtree, variável (wght), 400-700 | v9 | https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2 |
| ibm-plex-mono-400-latin.woff2 | IBM Plex Mono 400 | v20 | https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2 |
| ibm-plex-mono-500-latin.woff2 | IBM Plex Mono 500 | v20 | https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgg.woff2 |
| ibm-plex-mono-600-latin.woff2 | IBM Plex Mono 600 | v20 | https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgg.woff2 |
| potta-one-400-latin.woff2 | Potta One 400 (só títulos: `--fonte-display`) | v19 | https://fonts.gstatic.com/s/pottaone/v19/FeVSS05Bp6cy7xI-Yfxg2pRm.woff2 |

Fora do subconjunto latin: latin-ext, cirílico, grego, vietnamita e japonês (Potta One). O app só mostra português e
nomes de espécie (Latin-1); caractere fora cai na fonte de reserva da pilha (`--fonte-*` em `src/css/tokens.css`).
Para trocar/atualizar: baixar o CSS de fonts.googleapis.com com User-Agent de Chrome, pegar o bloco `/* latin */`.

## Licença conferida (05/11/2026)
O texto da OFL de cada família está ao lado dos woff2 (`OFL-<familia>.txt`, copiado de
https://github.com/google/fonts/tree/main/ofl/<pasta>/OFL.txt). Conferido nos próprios arquivos (cabeçalho
"SIL OPEN FONT LICENSE Version 1.1") e em `METADATA.pb` de cada pasta (`license: "OFL"`):
- Bricolage Grotesque (`ofl/bricolagegrotesque`): Copyright 2022 The Bricolage Grotesque Project Authors
- Figtree (`ofl/figtree`): Copyright 2022 The Figtree Project Authors
- IBM Plex Mono (`ofl/ibmplexmono`): Copyright © 2017 IBM Corp. with Reserved Font Name "Plex"
- Potta One (`ofl/pottaone`): Copyright 2020 The Potta Project Authors
