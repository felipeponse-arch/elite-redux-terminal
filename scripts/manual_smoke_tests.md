# Testes manuais de fumaça

Não existe suite automatizada neste projeto (é uma ferramenta de uso solo, publicada
como Artifact — ver `AUDITORIA-DOSSIE.md` secao 13 para o raciocinio). Em vez disso,
estes sao os trechos de JavaScript realmente usados para verificar cada correcao antes
de publicar, para nao precisar reinventa-los a cada mudanca no template.

Rode isso **sempre que mexer em `artifact_template.html`**, antes de publicar.

## Como servir localmente

Nao precisa abrir o arquivo com `file://` (algumas coisas se comportam diferente).
Sirva por HTTP:

```powershell
# cria/roda um servidor HTTP simples na porta 8100 servindo artifact_final.html
$root = "C:\Users\Ponse\Documents\Claude\teste\elite-redux-terminal"
$port = 8100
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $res = $ctx.Response
    $relPath = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "artifact_final.html" }
    $filePath = Join-Path $root $relPath
    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        if ($filePath -like "*.html") { $res.ContentType = "text/html; charset=utf-8" }
        elseif ($filePath -like "*.json") { $res.ContentType = "application/json; charset=utf-8" }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $res.StatusCode = 404 }
    $res.OutputStream.Close()
}
```

Depois abra `http://localhost:8100` no Browser tool (`preview_start` com essa URL) e
cole os trechos abaixo no console via `javascript_tool`. **Rode `localStorage.clear()`
antes e depois de cada bateria de testes** — eles escrevem save fake no localStorage
do navegador de teste.

## 1. Retencao de orfaos no save + limite de milestone

Verifica que importar um save com especies desconhecidas (versao de dados diferente)
nao apaga elas, e que um `milestone` fora da faixa e limitado em vez de quebrar.

```javascript
const fakeSave = {
  v: 2, dataVersion: "test", savedAt: new Date().toISOString(),
  team: ["SPECIES_CHARIZARD", "SPECIES_TOTALLY_MADE_UP_FUTURE_MON"],
  box: ["SPECIES_ANOTHER_FAKE_ONE"],
  savedTeams: [], settings: { difficulty: "ace", milestone: 999999 }
};
localStorage.setItem("er_terminal_save", JSON.stringify(fakeSave));
// recarregue a pagina, depois:
document.getElementById("settings-milestone").value; // esperado: o indice maximo real (ex. "9"), nao "999999"
// force um persist() de verdade mudando algo pela UI (ex. disparar "change" no select de milestone),
// depois confira que os dois nomes fake ainda estao la:
JSON.parse(localStorage.getItem("er_terminal_save")).team;  // deve conter SPECIES_TOTALLY_MADE_UP_FUTURE_MON
JSON.parse(localStorage.getItem("er_terminal_save")).box;   // deve conter SPECIES_ANOTHER_FAKE_ONE
```

## 2. Fluxo Caixa -> Time (nunca deve travar)

```javascript
// va pra aba Caixa com o time cheio (6/6) e pelo menos 1 na caixa, depois:
const btn = document.querySelector("#box-grid .box-to-team");
btn.disabled;                          // esperado: false, NUNCA true
btn.classList.contains("is-swap");     // esperado: true quando o time esta cheio
btn.click();                           // deve abrir o #swap-modal, nao fazer nada
document.getElementById("swap-modal").hidden; // esperado: false
```

## 3. Barras de stat (teto + cor por faixa)

```javascript
// selecione qualquer Pokemon com stat bem alto (>=150) e bem baixo (<60), ex. Shuckle:
[...document.querySelectorAll("#species-detail .stat-row")].map(r => ({
  label: r.querySelector(".stat-label").textContent,
  val: r.querySelector(".stat-val").textContent,
  cls: r.querySelector(".stat-bar-fill").className
}));
// esperado: valores >=150 com "tier-elite", <60 com "tier-weak", resto sem tier-* (gradiente padrao)
```

## 4. Mascara de overflow nas abas (mobile)

```javascript
// emule viewport 375x812 antes de rodar isto
const tabs = document.querySelector(".tabs");
tabs.scrollWidth > tabs.clientWidth;           // esperado: true (tem mais abas que cabem)
getComputedStyle(tabs).maskImage || getComputedStyle(tabs).webkitMaskImage; // esperado: linear-gradient(...)
```

## 5. Fim do beco sem saida (adicionar ao time pela ficha, mobile)

```javascript
// emule viewport 375x812, abra a ficha de um Pokemon JA no time:
document.getElementById("goto-team-link");     // esperado: existe (nao null)
document.getElementById("goto-team-link").click();
document.getElementById("view-team").classList.contains("active"); // esperado: true
```

## 6. Toast nao se perde em acoes rapidas

```javascript
// dispare duas acoes que chamam flashToast() em sequencia rapida (ex. adicionar
// dois Pokemon seguidos) e confirme que a classe "show" foi removida e
// readicionada (nao apenas manteve-se aplicada com o texto trocado por baixo):
// -> checagem visual: a bolha de confirmacao deve "piscar" a cada acao, nao
//    so trocar o texto sem nenhuma transicao percebida.
```
