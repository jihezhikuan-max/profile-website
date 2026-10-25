param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8000,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
# Only these website files and flat assets/ images and fonts are served.
# Git, local scripts, directory listings and linked files stay private.
$files = @{
    '/' = @('index.html', 'text/html; charset=utf-8')
    '/index.html' = @('index.html', 'text/html; charset=utf-8')
    '/fonts.css' = @('fonts.css', 'text/css; charset=utf-8')
    '/style.css' = @('style.css', 'text/css; charset=utf-8')
    '/script.js' = @('script.js', 'text/javascript; charset=utf-8')
    '/locales/ja.json' = @('locales/ja.json', 'application/json; charset=utf-8')
    '/locales/en.json' = @('locales/en.json', 'application/json; charset=utf-8')
}
$imageTypes = @{
    '.woff2' = 'font/woff2'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.avif' = 'image/avif'
    '.svg' = 'image/svg+xml'
}
function Get-AssetEntry([string]$Route) {
    # A strict, undecoded route rejects traversal, encoded separators and ADS.
    if ($Route -cnotmatch '\A/assets/([A-Za-z0-9][A-Za-z0-9_-]*\.(?i:png|jpg|jpeg|webp|avif|svg|woff2))\z') {
        return $null
    }
    $name = $Matches[1]
    $assetRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'assets'))
    $assetPath = [System.IO.Path]::GetFullPath((Join-Path $assetRoot $name))
    if (-not $assetPath.StartsWith($assetRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }
    if (-not (Test-Path -LiteralPath $assetRoot -PathType Container) -or
        -not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
        return $null
    }
    $directory = Get-Item -LiteralPath $assetRoot -Force
    $file = Get-Item -LiteralPath $assetPath -Force
    # OneDrive directories also carry ReparsePoint; reject actual filesystem links,
    # not ordinary cloud-synced folders. LinkType identifies junctions/symlinks.
    if ($directory.LinkType -or $file.LinkType) {
        return $null
    }
    return @($assetPath, $imageTypes[[System.IO.Path]::GetExtension($name).ToLowerInvariant()])
}
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try {
    $listener.Start()
    $url = "http://127.0.0.1:$Port/"
    Write-Host ""
    Write-Host "Profile Website - Local Preview"
    Write-Host "Open: $url"
    Write-Host "Keep this window open. Close it or press Ctrl+C to stop."
    Write-Host "If the browser does not open, copy the URL above."
    Write-Host ""
    if (-not $NoBrowser) {
        try { Start-Process $url } catch { Write-Warning "Open $url manually in your browser." }
    }
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 3000
            $client.SendTimeout = 3000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $request = $reader.ReadLine()
            if (-not $request) { continue }
            $parts = $request.Split(' ')
            $headerLength = 0
            do {
                $line = $reader.ReadLine()
                $headerLength += $line.Length
                if ($headerLength -gt 16384) { throw 'Request headers too large.' }
            } while ($line)
            $status = '404 Not Found'
            $type = 'text/plain; charset=utf-8'
            $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
            if ($parts.Count -ge 2) {
                $route = $parts[1].Split('?')[0]
                if ($parts[0] -notin @('GET', 'HEAD')) {
                    $status = '405 Method Not Allowed'
                } elseif ($files.ContainsKey($route)) {
                    $entry = $files[$route]
                    $body = [System.IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $entry[0]))
                    $type = $entry[1]
                    $status = '200 OK'
                } else {
                    $entry = Get-AssetEntry $route
                    if ($entry) {
                        $body = [System.IO.File]::ReadAllBytes($entry[0])
                        $type = $entry[1]
                        $status = '200 OK'
                    }
                }
            }
            $headers = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
            $bytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($bytes, 0, $bytes.Length)
            if ($parts[0] -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
            Write-Host "$($parts[0]) $($parts[1]) -> $status"
        } catch {
            Write-Warning "Request skipped: $($_.Exception.Message)"
        } finally {
            if ($reader) { $reader.Dispose(); $reader = $null }
            $client.Close()
        }
    }
} catch {
    Write-Host "Could not start local preview on port $Port." -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Close an existing preview window, or use another port (see README.md)."
    exit 1
} finally {
    $listener.Stop()
}
