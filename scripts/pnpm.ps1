param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArguments)
$ErrorActionPreference = 'Stop'
$pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpmCommand) {
  & $pnpmCommand.Source @PnpmArguments
  exit $LASTEXITCODE
}
$nodeExecutable = (Get-Command node).Source
$bundledPnpm = Join-Path (Split-Path (Split-Path $nodeExecutable)) 'node_modules\pnpm\bin\pnpm.cjs'
if (-not (Test-Path -LiteralPath $bundledPnpm)) {
  throw 'Instale Node.js 22+ e pnpm 11.25.0, ou use o runtime Node incluído no Codex.'
}
& $nodeExecutable $bundledPnpm @PnpmArguments
exit $LASTEXITCODE
