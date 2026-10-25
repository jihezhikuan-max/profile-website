# Optional maintenance utility. Downloads only generic public font resources.
# No project content or personal information is sent to any service.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$assetRoot = Join-Path $root 'assets'
New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null
$utf8 = [System.Text.UTF8Encoding]::new($false)
$agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$requests = @(
    @{ Query='Inter:wght@400..800'; Prefix='inter' },
    @{ Query='Noto+Sans+JP:wght@400..800'; Prefix='noto-sans-jp' }
)
$rules = @('/* Locally hosted fonts. Licenses: assets/FONT-LICENSES.md */')
foreach ($font in $requests) {
    $url = 'https://fonts.googleapis.com/css2?family=' + $font.Query + '&display=swap'
    $css = [string](Invoke-WebRequest -Uri $url -UserAgent $agent -UseBasicParsing).Content
    $urls = [regex]::Matches($css, 'url\((https://fonts\.gstatic\.com/[^)]+)\)')
    if (-not $urls.Count) { throw 'Google Fonts did not return public font URLs.' }
    $index = 0
    foreach ($downloadUrl in ($urls | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)) {
        $fileName = "$($font.Prefix)-$index.woff2"
        $destination = Join-Path $assetRoot $fileName
        Invoke-WebRequest -Uri $downloadUrl -OutFile $destination -UseBasicParsing
        $signature = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes($destination),0,4)
        if ($signature -ne 'wOF2') { throw "Expected WOFF2: $fileName" }
        $css = $css.Replace($downloadUrl, "assets/$fileName")
        $index++
    }
    $rules += $css
    Write-Host "Downloaded $index public font subsets for $($font.Prefix)"
}
[System.IO.File]::WriteAllText((Join-Path $root 'fonts.css'), ($rules -join "`n") + "`n", $utf8)
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt' -OutFile (Join-Path $assetRoot 'OFL-Inter.txt') -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/OFL.txt' -OutFile (Join-Path $assetRoot 'OFL-NotoSansJP.txt') -UseBasicParsing
