# v10 — O resto da config d1a9a4c: aprendizado, tipo de quem ataca, Megas novas

Status: resolvido (no master: c341fea, 1345f29, 2dd611a, 379b9fa; publicado na v178/v179; marcado em 21/10)
Tamanho: M

## 1. Golpes aprendidos de TODAS as espécies (patch reprodutível)
`scripts/extracao/config_nova.mjs` agora compara o level-up e o tutor de cada espécie da `SpeciesList.textproto` com o dex (com `uses_learnset` resolvido) e grava adições e retiradas em `data/config_nova.json` (`aprende[sname] = { lm, lmRem, tu, tuRem }`); `transform.mjs --config-nova` aplica. O teste `extracao_transform` segue travando dex == bruto + patch, byte a byte.
- **128 espécies mudam**: level-up **+105 / -6**, tutor **+94 / -15**. Entre os 9 golpes novos (v09) e o resto: 56 espécies ganham algum golpe novo (a conta do v09 dizia 48: faltava resolver `uses_learnset`).
- Retiradas (21): Arbok perde Baneful Bunker no 61; tutor tirado de Tentacool (Acid Armor), Snorunt (Shadow Claw, Trick), Bagon (Take Flight), Shinx/Luxio (Knock Off), Nasty Plot x3, Spikes, Stealth Rock, Weather Ball, Razor Leaf, Tearful Look x2 etc.
- **Tutores universais ficam como a NextDex** (Snore, Metronome, Rest, Protect, Return... e o Attract dos gendered): a config os marca por golpe (`TUTOR_UNIVERSAL_*`) e a NextDex os expande por conta própria; expandir pela config acrescentaria Snore a ~1500 espécies e Metronome a ~1000 sem prova de que o jogo faz isso (não há implementação no repositório do jogo). Decisão registrada; se o Felipe quiser a expansão, é uma linha no gerador.
- **364 espécies** (formas sem `learnset` nem `uses_learnset` na config) ficam como estão.
- **Builds**: `validarBuilds()` não acha nenhuma build de `data/builds.json` com golpe que a espécie deixou de aprender. Nada a acrescentar em `builds_pendentes_de_revisao.json` (segue com os 259 do v05/v07). Teste fixa isso.

## 2. Lumberjack e mais três, pelo tipo de quem ataca
`abilities.cc:5752` (Lumberjack), `Fae Hunter`, `Monster Hunter`, `Firefighter` usam `IS_BATTLER_OF_TYPE(attacker/target, ...)`, como Dragonslayer e Insect Eater (v07): x1,5 contra alvo do tipo e x0,5 contra atacante do tipo, pelo tipo do POKÉMON, não do golpe. O motor tratava a metade defensiva pelo tipo do golpe (tabela `tipos.js`, 4 entradas) e não lia a ofensiva. Agora o texto manda (`resistDeAtacante`, `vsTipo`) e as 4 entradas saíram da tabela de tipos (a tela de tipos não mostra mais "resiste a Grass" para o Lumberjack: o jogo não faz isso). Teste percorre as 6 habilidades da família.

## 3. Mega Bruxish e Mega Jellicent (PROVISÓRIAS, por decisão do Felipe)
Entram no dado (ids 1923 e 1924) a partir da config, mas **escondidas**: a config traz as duas **sem a Speed**, e a Mega Jellicent tem atributos idênticos aos da base (a Mega Bruxish tem SpAtk 70 contra 105 da base): placeholders. Resposta do Felipe: esconder até a config ter números reais.
- Marca `provisoria: "<motivo>"` na espécie (`dex_compact.json`, gerada pelo patch: sempre que a config omite algum atributo base). `SPECIES` (`src/regras/dados_base.js`) ignora as provisórias, então ficam fora da Dex visível, das builds, do pipeline, do duelo e do rank. `validar_dados.mjs` não exige rank delas; saíram de `rank_pendente_ate_10.json` e de `rank_disponibilidade.json`.
- Seguem no dado: base com a evolução apontando para elas, `mega_forms.json` (Bruxishite e Jellicentite), aprendizado e habilidades da config. Speed provisória = a da base (92 e 60).
- **Aviso quando a config mudar**: `scripts/extracao/provisorias.mjs <er-config>` (estado por espécie: `incompleta`, `numeros-novos`, `completa-igual-ao-dado`, `sumiu-da-config`; sai com 1 se for preciso regerar o patch e tirar a marca) e o alarme semanal (`alarme_upstream.mjs`) chama o mesmo conferidor com o `SpeciesList.textproto` da config no GitHub (`main`). Hoje: as duas `incompleta`.

## Testes e sabotagens
`tests/unit/config_v10.test.mjs` (6 testes, inclui o conferidor de provisórias). Sabotagens `versao-lumberjack-*` (3), `versao-mega-bruxish-sem-pedra` e `versao-provisoria-aparece-na-dex` pegas; a do conferidor (`provisorias.mjs` trocado "numeros-novos" por "incompleta") pega trocando o arquivo em disco, mas fica de fora de `mutacoes.mjs` porque o corredor de sabotagem só acha arquivos de `scripts/` no primeiro nível. Suíte 992 testes, 0 falhas; `npm run check` limpo; app abre sem erro de JavaScript. Rank NÃO recalculado.
