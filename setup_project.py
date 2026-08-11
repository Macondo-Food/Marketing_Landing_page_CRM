"""
Script para crear (y corregir) la estructura del proyecto proyecto-vsl.

Uso:
    1. Colócalo dentro de la carpeta raíz del proyecto: C:\\dev\\proyecto-vsl
    2. Ejecuta:  python setup_project.py
    3. Es seguro correrlo varias veces (no borra lo que ya tengas en front/back,
       solo corrige la carpeta duplicada y crea lo que falte).
"""

import shutil
from pathlib import Path

# Carpeta raíz = donde está este script
ROOT = Path(__file__).resolve().parent

BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
REFERENCE = ROOT / "reference"

print(f"Trabajando en: {ROOT}\n")

# ── 1. Corregir la carpeta duplicada backend/back (si existe) ──────────────
nested = BACKEND / "back"
if nested.exists():
    print("⚠️  Encontrada carpeta duplicada 'backend/back' — corrigiendo...")
    nested_src = nested / "src"
    target_src = BACKEND / "src"
    if nested_src.exists():
        if target_src.exists():
            # Fusionar contenido si ya existe backend/src
            for item in nested_src.iterdir():
                shutil.move(str(item), str(target_src / item.name))
        else:
            shutil.move(str(nested_src), str(target_src))
    shutil.rmtree(nested)
    print("   Corregido: contenido movido a 'backend/src' y 'backend/back' eliminada.\n")

# ── 2. Estructura de reference/ ─────────────────────────────────────────────
REFERENCE.mkdir(exist_ok=True)
for filename in ["vturb-embed.txt", "google-calendar-setup.md"]:
    f = REFERENCE / filename
    f.touch(exist_ok=True)
print(f"✔ reference/ lista ({REFERENCE})")

# Aviso si falta el HTML original
landing_html = REFERENCE / "landing-original.html"
if not landing_html.exists():
    print("  ⚠️  Falta copiar tu archivo real: reference/landing-original.html")

# ── 3. Estructura de backend/ ───────────────────────────────────────────────
backend_dirs = [
    BACKEND / "src" / "routes",
    BACKEND / "src" / "controllers",
    BACKEND / "src" / "services",
    BACKEND / "src" / "models",
    BACKEND / "src" / "db",
]
for d in backend_dirs:
    d.mkdir(parents=True, exist_ok=True)

backend_files = [
    BACKEND / "src" / "app.js",
    BACKEND / ".env.example",
]
for f in backend_files:
    f.touch(exist_ok=True)

print(f"✔ backend/ lista ({BACKEND})")

# ── 4. Estructura de frontend/ ──────────────────────────────────────────────
frontend_dirs = [
    FRONTEND / "src" / "pages",
    FRONTEND / "src" / "components",
    FRONTEND / "src" / "utils",
    FRONTEND / "src" / "services",
]
for d in frontend_dirs:
    d.mkdir(parents=True, exist_ok=True)

print(f"✔ frontend/ lista ({FRONTEND})")

# ── 5. Resumen final ─────────────────────────────────────────────────────────
print("\nEstructura final:")
for base in [REFERENCE, BACKEND, FRONTEND]:
    print(f"\n{base.name}/")
    for path in sorted(base.rglob("*")):
        if "node_modules" in path.parts or ".git" in path.parts:
            continue
        depth = len(path.relative_to(base).parts) - 1
        prefix = "  " * (depth + 1)
        marker = "📁" if path.is_dir() else "📄"
        print(f"{prefix}{marker} {path.name}")

print("\n✅ Listo. Ahora copia tu HTML real en reference/landing-original.html")
print("   y pasa el archivo plan-proyecto-vsl.md a Claude Code para que implemente.")
