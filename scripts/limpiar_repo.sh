#!/bin/bash

# ====================================================
# SCRIPT DE LIMPIEZA DE ARCHIVOS BASURA Y SECRETOS (GIT)
# Repo: atlas-admin-v2
# ====================================================

echo "🧹 Iniciando limpieza de basura y secretos en Git..."

# 1. Untrackear archivos sensibles sin eliminarlos del disco local
git rm --cached .env.hostinger 2>/dev/null || true
git rm --cached b64_block1.txt 2>/dev/null || true
git rm --cached b64_block2.txt 2>/dev/null || true
git rm --cached b64_block3.txt 2>/dev/null || true
git rm --cached b64_block4.txt 2>/dev/null || true
git rm --cached b64_block5.txt 2>/dev/null || true
git rm --cached b64_block6.txt 2>/dev/null || true
git rm --cached b64_block7.txt 2>/dev/null || true
git rm --cached b64_block8.txt 2>/dev/null || true
git rm --cached b64_block9.txt 2>/dev/null || true
git rm --cached b64_block10.txt 2>/dev/null || true
git rm --cached b64_block11.txt 2>/dev/null || true
git rm --cached b64_block12.txt 2>/dev/null || true
git rm --cached b64_block13.txt 2>/dev/null || true
git rm --cached injerto.patch 2>/dev/null || true
git rm --cached injerto_b64.txt 2>/dev/null || true
git rm --cached .env 2>/dev/null || true

echo "✅ Archivos untrackeados con éxito (git rm --cached)."

# 2. Agregar patrones de ignorados a .gitignore
echo "Actualizando patrones en .gitignore..."

cat << 'EOF' >> .gitignore

# Secretos y archivos de baseline a ignorar
.env
.env.hostinger
b64_block*.txt
injerto.patch
injerto_b64.txt
dist/
node_modules/
EOF

echo "✅ Archivo .gitignore actualizado."
echo ""
echo "🔐 RECOMENDACIÓN DE MITIGACIÓN DE SECRETOS:"
echo "Para expurgar por completo el secreto .env.hostinger del historial histórico de commits en Git,"
echo "puedes instalar 'git-filter-repo' y ejecutar:"
echo "  git filter-repo --path .env.hostinger --invert-match --force"
echo "Y luego forzar el push: git push origin main --force"
echo ""
echo "¡Limpieza local de baseline completada con éxito!"
