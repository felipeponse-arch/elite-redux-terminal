// Orquestrador da Parte A - chama cada seÃ§Ã£o em ordem (a mesma ordem que
// elas tinham dentro do runLiveTests() monolÃ­tico original, mais as seÃ§Ãµes
// novas criadas depois da divisÃ£o em arquivos) e devolve o mesmo array
// `results` de sempre. Fica por Ãºltimo no manifest.json de propÃ³sito
// (precisa que todas as seÃ§Ãµes jÃ¡ estejam definidas).
async function runAllSections() {
  results.length = 0;

  await section01();
  await section02();
  await section03();
  await section04();
  await section05();
  await section06();
  await section07();
  await section08();
  await section09();
  await section10();
  await section11();
  await section12();
  await section13();
  await section14();
  await section15();
  await section16();
  await section17();
  await section18();
  await section19();
  await section20();
  await section21();
  await section22();
  await section23();
  await section24();

  localStorage.clear();

  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART A: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
}
