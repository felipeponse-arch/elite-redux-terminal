# Elite Redux Terminal

Dex e montador de builds e times para o hack Elite Redux (tudo em português do Brasil). O app é um arquivo único (`artifact_final.html`) gerado por `npm run build`; o Modo Motor monta o time contra os chefões só com o simulador de duelo, sem IA.

- **Site:** publicado pelo GitHub Pages a cada push no `master` (workflow `.github/workflows/pages.yml`).
- **Atenção:** a sincronização entre aparelhos só funciona dentro do Artifact do claude.ai. No site público o app mostra "só neste aparelho" e guarda o progresso no navegador.
- **Levar o save para outro aparelho:** aba Progresso > "Save em arquivo": **Baixar save** gera um .json (com soma de verificação) e **Carregar save** o lê de volta. A importação valida antes de aplicar, pede confirmação, guarda o save atual e tem **Desfazer importação**; builds suas que o arquivo não tem viram variantes.
- **Rank:** o site usa `data/species_rank.json` atual. O rank novo (só os 29 chefões, incremental) ainda não foi regerado.

## Rotina (rápida)
```
npm run check            # travas (~20 s)
npm run test:unit        # testes rápidos (~25 s)
npm run build            # monta artifact_final.html (~1 s)
npm run test:e2e         # navegador (~100 s)
npm run test:unit:pesado # testes pesados (~140 s), antes de publicar
npm run test:sabotage    # com o cache em tests/.sabotagem_cache.json (~2 min); semanal: --com-pesados
```
Regra dos pacotes e prazos: `docs/pacotes/regra.md`. Mapa dos documentos: `docs/`.
