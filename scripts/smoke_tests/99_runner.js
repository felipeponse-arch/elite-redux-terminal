// Orquestrador da Parte A - chama cada seção em ordem (a mesma ordem que
// elas tinham dentro do runLiveTests() monolítico original, mais as seções
// novas criadas depois da divisão em arquivos) e devolve o mesmo array
// `results` de sempre. Fica por último no manifest.json de propósito
// (precisa que todas as seções já estejam definidas).
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
  await section25();
  await section26();

  localStorage.clear();

  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART A: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
}
