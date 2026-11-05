// Fixture congelada: o Ninetales da 2.65.3b/2.65.4 (Fire/Ghost; habilidades Flaming Soul, Vengeance, Drought; innates
// Pyromancy, Flash Fire, Queenly Majesty). Em 2.65.5 o jogo mudou o Ninetales (Fire puro; Flaming Soul, Spectralize, Set Ablaze;
// innates Drought, Magic Guard, Cursed Body), mas estes testes medem mecânica/calibração contra o simulador 2.65.3b
// e continuam valendo com o Ninetales antigo. Não é o dado do jogo atual; o atual é testado em config_v10.test.mjs.
// Fixture: er-config b58ea4d SpeciesList.textproto SPECIES_NINETALES (dex_compact.json do commit 4390d7b: t [2,16], ab [351,276,70], inn [270,18,214])
export function ninetales2653b(R) {
  const s = R.SPECIES.find((x) => x && x.n === "Ninetales");
  s.t = [2, 16]; s.ab = [351, 276, 70]; s.inn = [270, 18, 214];
  return R;
}
