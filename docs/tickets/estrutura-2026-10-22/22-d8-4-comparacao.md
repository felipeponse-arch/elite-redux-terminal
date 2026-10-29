# TK-22 / D8-4: Etapa por espécie unificada (28/10, decisão do usuário)

Fonte única: `data/rank_disponibilidade.json` (gerado do código do jogo). `mono_disponibilidade.json` segue como ENTRADA do gerador (planilha) e
ganha `eApp` só onde a Etapa do rank difere; `src/regras/mono_run.js` lê `eApp ?? e`. `how_to_obtain.json` é texto curado (método/nota), sem Etapa:
as 32 entradas são coerentes com o rank (presentes de pós-jogo = null, os demais Etapa 1-6), nada a derivar.

Comparação (planilha x rank, 1236 entradas / 663 espécies): 55 espécies com rank null (pós-jogo/DexNav) mantêm a Etapa da planilha. 14 espécies mudam
de Etapa (20 entradas por tipo), todas para MAIS CEDO, pelo código do jogo:
Chansey 3->1, Honedge Redux 3->2, Jangmo-o 3->0, Sneasler 3->2, Togepi 2->0, Togetic 2->0, Pinsir 3->2, Kakuna 1->0, Amoonguss 5->2,
Geodude Alolan 2->0, Metapod 1->0, Barraskewda 5->3, Electrode 5->2, Mime Jr. 1->0.
A própria planilha era incoerente entre tipos em 6 delas (Honedge Redux, Jangmo-o, Togepi, Pinsir, Geodude Alolan, Mime Jr.).
Jangmo-o: er-repo wild_encounters.json:3977 = MAP_JAGGED_PASS.

Efeito colateral ao regerar o rank_disponibilidade (vem do mega_forms/pedras já corrigido neste branch, não desta mudança): Abomasnow Mega 8->4,
Abomasnow Santa 4->8, Urshifu Rapid Strike Mega 8->null (pos-jogo). Conferir na integração.

Megas Bruxish/Jellicent: Etapa 7 (Bruxishite/Jellicentite). Config 486a964 não traz `spe` nas duas: vale a da base (92 e 60), `speDaConfig:false`.
Rank real delas NÃO calculado: `--especies` aborta para espécie com Etapa; ficam em rank_pendente_ate_10.json até o rank completo da integração.
