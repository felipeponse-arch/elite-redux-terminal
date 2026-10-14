// Entrada de `npm run check`: roda as checagens em paralelo (ticket 04, 14/10/2026).
// SEMPRE chama main(): sem trava de "sou o arquivo principal", que falhava aberta
// quando o script era chamado por junção ou link simbólico.
// `--listar` imprime as etapas na ordem e sai com 0 sem rodar nada.
import { ETAPAS, main } from "./checar_paralelo_lib.mjs";

if (process.argv.includes("--listar")) {
  for (const etapa of ETAPAS) console.log(etapa);
} else {
  await main();
}
