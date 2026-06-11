$output = "data\inventario.json"
$merged = @()
$folder = "data"

Get-ChildItem "$folder\inventario_*.json" | ForEach-Object {
    $file = $_
    $category = $file.BaseName -replace '^inventario_', ''
    $category = ($category -replace '[_.]', ' ' -replace '\s+', ' ').Trim().ToUpper()

    try {
        $data = Get-Content $file.FullName -Raw | ConvertFrom-Json
        if (-not ($data -is [System.Array])) { return }

        foreach ($item in $data) {
            $nombre = $null
            if ($item.PSObject.Properties.Name -contains 'producto') { $nombre = $item.producto }
            elseif ($item.PSObject.Properties.Name -contains 'nombre') { $nombre = $item.nombre }
            elseif ($item.PSObject.Properties.Name -contains 'name') { $nombre = $item.name }
            if (-not [string]::IsNullOrWhiteSpace($nombre)) {
                $obj = [ordered]@{
                    nombre = $nombre.Trim()
                    categoria = $category
                    marca = if ($item.PSObject.Properties.Name -contains 'marca') { $item.marca } else { $null }
                    modelo = if ($item.PSObject.Properties.Name -contains 'modelo') { $item.modelo } else { $null }
                    precio = if ($item.PSObject.Properties.Name -contains 'precio_efectivo') { $item.precio_efectivo } elseif ($item.PSObject.Properties.Name -contains 'precio') { $item.precio } else { $null }
                    costo_sin_iva = if ($item.PSObject.Properties.Name -contains 'costo_sin_iva') { $item.costo_sin_iva } else { $null }
                    stock = if ($item.PSObject.Properties.Name -contains 'stock') { $item.stock } else { $null }
                    habilitado = if ($item.PSObject.Properties.Name -contains 'habilitado') { $item.habilitado } else { $null }
                    margen_empresa = if ($item.PSObject.Properties.Name -contains 'margen_empresa') { $item.margen_empresa } else { $null }
                    es_kpc = if ($item.PSObject.Properties.Name -contains 'es_kpc') { $item.es_kpc } else { $null }
                    descripcion = ($item.descripcion ?? $nombre).Trim()
                }
                $merged += $obj
            }
        }
    } catch {
        Write-Warning "No se pudo procesar $($file.Name): $($_.Exception.Message)"
    }
}

if ($merged.Count -eq 0) {
    Write-Warning "No se encontraron elementos para escribir en $output."
    exit 1
}

$merged | ConvertTo-Json -Depth 5 | Set-Content -Path $output -Encoding utf8
Write-Host "Generado $($merged.Count) elementos en $output"