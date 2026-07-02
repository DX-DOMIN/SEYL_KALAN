@echo off
setlocal

set "PORT=8123"
set "HOST=127.0.0.1"
set "URL=http://127.0.0.1:8123/index.html"

cd /d "%~dp0"

echo.
echo ==================================================
echo  Demo Global Logistics - Validacion por Case
echo ==================================================
echo.
echo  URL:
echo  %URL%
echo.
echo  IMPORTANTE:
echo  No abras la demo con file:// porque el PDF puede
echo  bloquear el logo por CORS.
echo.
echo  Mantén esta ventana abierta durante la demo.
echo  Para detener el servidor presiona Ctrl+C.
echo.

where py >nul 2>nul
if not errorlevel 1 (
    py -3 -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        start "" "%URL%"
        py -3 -m http.server %PORT% --bind %HOST%
        goto :end
    )
)

where python >nul 2>nul
if not errorlevel 1 (
    python -c "import sys" >nul 2>nul
    if not errorlevel 1 (
        start "" "%URL%"
        python -m http.server %PORT% --bind %HOST%
        goto :end
    )
)

echo Python no esta disponible en PATH. Usando servidor PowerShell...
echo.
start "" "%URL%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=(Get-Location).Path; $prefix='http://127.0.0.1:8123/'; $listener=[System.Net.HttpListener]::new(); $listener.Prefixes.Add($prefix); $listener.Start(); Write-Host ('Servidor local activo en ' + $prefix); Write-Host 'Presiona Ctrl+C para detener.'; while ($listener.IsListening) { $context=$listener.GetContext(); $requestPath=[Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/')); if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath='index.html' }; $file=[System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root,$requestPath)); if (-not $file.StartsWith($root)) { $context.Response.StatusCode=403; $context.Response.Close(); continue }; if (-not [System.IO.File]::Exists($file)) { $context.Response.StatusCode=404; $context.Response.Close(); continue }; $ext=[System.IO.Path]::GetExtension($file).ToLowerInvariant(); $types=@{'.html'='text/html; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.svg'='image/svg+xml';'.json'='application/json'}; $context.Response.ContentType=if($types.ContainsKey($ext)){$types[$ext]}else{'application/octet-stream'}; $bytes=[System.IO.File]::ReadAllBytes($file); $context.Response.OutputStream.Write($bytes,0,$bytes.Length); $context.Response.Close() }"

:end
endlocal
