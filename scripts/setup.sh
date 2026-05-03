#!/bin/bash
# =========================================================================
# CloudWeb — Setup script
#
# Corre esto UNA vez después de clonar el repo.
# Verifica dependencias, copia env, levanta Supabase y aplica migraciones.
#
# Uso:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# =========================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "  ☁️  CloudWeb — Setup"
echo "  ━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js no está instalado.${NC} Instálalo desde https://nodejs.org (v20+)"
  exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}✗ Node.js v20+ requerido.${NC} Tienes $(node -v)."
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# 2. Verificar npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm no encontrado.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# 3. Verificar Supabase CLI
if ! command -v supabase &> /dev/null && ! npx supabase --version &> /dev/null 2>&1; then
  echo -e "${YELLOW}⚠${NC} Supabase CLI no encontrado. Instalando..."
  npm install -g supabase
fi
echo -e "${GREEN}✓${NC} Supabase CLI"

# 4. Instalar dependencias
echo ""
echo "  Instalando dependencias..."
npm install --silent
echo -e "${GREEN}✓${NC} Dependencias instaladas"

# 5. Copiar .env si no existe
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo -e "${GREEN}✓${NC} .env.local creado desde .env.example"
  echo -e "${YELLOW}  → Rellena las API keys en .env.local antes de arrancar${NC}"
else
  echo -e "${GREEN}✓${NC} .env.local ya existe"
fi

# 6. Levantar Supabase
echo ""
echo "  Levantando Supabase local..."
npx supabase start 2>/dev/null || true

# 7. Extraer credenciales de Supabase y actualizar .env.local
echo ""
echo "  Actualizando credenciales de Supabase en .env.local..."
SUPABASE_STATUS=$(npx supabase status -o json 2>/dev/null || echo "{}")
SUPABASE_URL=$(echo "$SUPABASE_STATUS" | grep -o '"API URL": "[^"]*"' | cut -d'"' -f4 || echo "")
ANON_KEY=$(echo "$SUPABASE_STATUS" | grep -o '"anon key": "[^"]*"' | cut -d'"' -f4 || echo "")
SERVICE_KEY=$(echo "$SUPABASE_STATUS" | grep -o '"service_role key": "[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$SUPABASE_URL" ]; then
  sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
  echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL configurado"
fi
if [ -n "$ANON_KEY" ]; then
  sed -i.bak "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
  echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY configurado"
fi
if [ -n "$SERVICE_KEY" ]; then
  sed -i.bak "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
  echo -e "${GREEN}✓${NC} SUPABASE_SERVICE_ROLE_KEY configurado"
fi
rm -f .env.local.bak

# 8. Aplicar migraciones
echo ""
echo "  Aplicando migraciones..."
npx supabase db reset --linked 2>/dev/null || npx supabase db reset 2>/dev/null || true
echo -e "${GREEN}✓${NC} Migraciones aplicadas"

# 9. Generar tipos
echo ""
echo "  Generando tipos TypeScript..."
npm run db:types 2>/dev/null || true
echo -e "${GREEN}✓${NC} Tipos generados"

# 10. Verificar compilación
echo ""
echo "  Verificando compilación..."
npx tsc --noEmit 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} TypeScript compila sin errores"
else
  echo -e "${YELLOW}⚠${NC} Hay errores de TypeScript — corrige antes de continuar"
fi

# Resumen
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━"
echo "  Setup completo."
echo ""
echo "  Próximos pasos:"
echo "    1. Rellena ANTHROPIC_API_KEY en .env.local"
echo "    2. npm run dev"
echo "    3. Abre http://localhost:3000"
echo "    4. Los magic links aparecen en http://localhost:54324 (Inbucket)"
echo ""
echo "  Para Stripe (opcional en dev):"
echo "    1. Rellena STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PRICE_ID"
echo "    2. npm run stripe:listen (en otra terminal)"
echo ""
