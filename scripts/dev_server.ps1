# Injecao de mock de sincronizacao (db), 2026-09-11: exclusiva deste servidor
# de dev local - NUNCA entra no artifact_final.html publicado. Motivo: ao
# contrario do mock de IA (claude.use("sample")), que a suite de testes
# consegue injetar em window.claude a qualquer momento porque generateBuildWithAI()
# so chama claude.use() no clique do botao, a sincronizacao (wireSync()) roda
# UMA VEZ, na carga da pagina, dentro da IIFE principal do app - nao ha
# reentrada exposta pra injetar window.claude depois que a pagina ja carregou.
# A unica forma de testar o mecanismo real (nao uma simulacao por fora) e
# window.claude ja existir ANTES do <script> do app rodar. Como o servidor
# controla os bytes da resposta, ele injeta esse script no INICIO do arquivo
# (antes de qualquer outra tag) só quando a query string pede (?mock_db=1),
# nunca por padrao - navegar sem esse parametro serve o arquivo intacto.
function Get-MockDbScript($query) {
  $params = [System.Web.HttpUtility]::ParseQueryString($query)
  if ($params["mock_db"] -ne "1") { return "" }
  $seedJson = "null"
  if ($params["seed"]) { $seedJson = $params["seed"] }
  return @"
<script>
(function () {
  var docs = {};
  var seed = $seedJson;
  if (seed) { docs["sync/save"] = seed; }
  var listeners = {};
  var fakeDb = {
    doc: function (path) {
      return {
        get: function () {
          var has = Object.prototype.hasOwnProperty.call(docs, path);
          return Promise.resolve({ exists: has, data: function () { return docs[path]; } });
        },
        set: function (val) { docs[path] = val; return Promise.resolve(); },
        onSnapshot: function (cb) {
          (listeners[path] = listeners[path] || []).push(cb);
          return function () {
            var arr = listeners[path];
            var i = arr ? arr.indexOf(cb) : -1;
            if (i !== -1) arr.splice(i, 1);
          };
        }
      };
    }
  };
  window.__fakeSyncDocs = docs;
  window.__fakeSyncPushRemote = function (path, val) {
    docs[path] = val;
    (listeners[path] || []).forEach(function (cb) {
      cb({ exists: true, metadata: { hasPendingWrites: false }, data: function () { return val; } });
    });
  };
  window.claude = { use: function (name) { return Promise.resolve(name === "db" ? fakeDb : null); } };
})();
</script>
"@
}

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8100/")
$listener.Start()
$root = "C:\Users\Ponse\Documents\Claude\teste\elite-redux-terminal"
while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath.TrimStart('/')
  if ([string]::IsNullOrEmpty($path)) { $path = "artifact_final.html" }
  $filePath = Join-Path $root $path
  try {
    if (Test-Path $filePath -PathType Leaf) {
      $mockScript = Get-MockDbScript $context.Request.Url.Query
      if ($mockScript -and $path -like "*.html") {
        $text = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($mockScript + $text)
      } else {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
      }
      $context.Response.ContentType = "text/html; charset=utf-8"
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
    }
  } catch {}
  $context.Response.OutputStream.Close()
}
