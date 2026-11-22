# Genera los PNG de todos los diagramas .puml de esta carpeta.
# Necesita Java, PlantUML (plantuml.jar) y Graphviz (dot.exe). Las rutas se pasan como
# parámetros o con las variables de entorno PLANTUML_JAR y GRAPHVIZ_DOT.
#
#   ./generar.ps1 -PlantUml C:\herramientas\plantuml.jar -Dot C:\herramientas\graphviz\bin\dot.exe
param(
  [string]$PlantUml = $env:PLANTUML_JAR,
  [string]$Dot = $env:GRAPHVIZ_DOT
)

if (-not $PlantUml -or -not (Test-Path $PlantUml)) {
  throw "No encuentro plantuml.jar. Pásalo con -PlantUml o define PLANTUML_JAR."
}
if ($Dot) { $env:GRAPHVIZ_DOT = $Dot }

$carpeta = $PSScriptRoot
$diagramas = Get-ChildItem -Path $carpeta -Filter *.puml | ForEach-Object { $_.FullName }
& java -jar $PlantUml -tpng -charset UTF-8 -o (Join-Path $carpeta "png") $diagramas
if ($LASTEXITCODE -ne 0) { throw "PlantUML terminó con errores." }
Write-Output "Listo: $($diagramas.Count) diagramas en $(Join-Path $carpeta 'png')"
