# Rebuild the calendar icons on Windows. No package installation is needed.
Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../icons'
[System.IO.Directory]::CreateDirectory($iconDirectory) | Out-Null

function New-RoundedRectangle($x, $y, $width, $height, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc(($x + $width - $diameter), $y, $diameter, $diameter, 270, 90)
    $path.AddArc(($x + $width - $diameter), ($y + $height - $diameter), $diameter, $diameter, 0, 90)
    $path.AddArc($x, ($y + $height - $diameter), $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return ,$path
}

$variants = @(
    @{ Size = 192; Name = 'icon-192.png'; Maskable = $false },
    @{ Size = 512; Name = 'icon-512.png'; Maskable = $false },
    @{ Size = 512; Name = 'icon-maskable-512.png'; Maskable = $true },
    @{ Size = 180; Name = 'apple-touch-icon.png'; Maskable = $false }
)

foreach ($variant in $variants) {
    $bitmap = New-Object System.Drawing.Bitmap($variant.Size, $variant.Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#34745d'))
    $graphics.ScaleTransform(($variant.Size / 64.0), ($variant.Size / 64.0))
    if ($variant.Maskable) {
        # Keep the calendar inside the central safe zone for OS icon masks.
        $graphics.TranslateTransform(10, 10)
        $graphics.ScaleTransform(0.6875, 0.6875)
    }

    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $card = New-RoundedRectangle 12 16 40 37 6
    $graphics.FillPath($white, $card)
    $divider = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#dce8df'), 3)
    $graphics.DrawLine($divider, 12, 28, 52, 28)
    $binding = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 5)
    $binding.StartCap = $binding.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($binding, 23, 12, 23, 21)
    $graphics.DrawLine($binding, 41, 12, 41, 21)
    $check = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#34745d'), 5)
    $check.StartCap = $check.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $check.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $points = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(23, 40),
        [System.Drawing.PointF]::new(29, 46),
        [System.Drawing.PointF]::new(42, 33)
    )
    $graphics.DrawLines($check, $points)
    $bitmap.Save((Join-Path $iconDirectory $variant.Name), [System.Drawing.Imaging.ImageFormat]::Png)
    $card.Dispose()
    $white.Dispose()
    $divider.Dispose()
    $binding.Dispose()
    $check.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
