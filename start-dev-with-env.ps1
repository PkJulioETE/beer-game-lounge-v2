$project = 'C:\Users\comunicacao1\Documents\Codex\2026-05-29\files-mentioned-by-the-user-beer\beer-game-lounge-main'
Set-Location $project
Get-Content -LiteralPath (Join-Path $project '.env') | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$') {
    $name = $matches[1]
    $value = $matches[2].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}
if (-not $env:MERCADOPAGO_ACCESS_TOKEN) { throw 'MERCADOPAGO_ACCESS_TOKEN not loaded from .env' }
npm.cmd run dev -- --host 127.0.0.1 --port 5173
