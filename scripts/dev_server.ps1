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
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $context.Response.ContentType = "text/html; charset=utf-8"
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
    }
  } catch {}
  $context.Response.OutputStream.Close()
}
