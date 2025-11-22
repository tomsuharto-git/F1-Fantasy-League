# Relevant Documentation - Grid Kings

## Core Documentation
- `README.md` - Setup guide and what's built
- `USER-FLOW.md` - Complete user experience flow
- `src/lib/types.ts` - All TypeScript type definitions

## Architecture (Parent Directory)
- `../f1-app-architecture.md` - Full system architecture
- `../f1-api-integration.md` - API integration details
- `../f1-component-specs.md` - Component specifications
- `../f1-auth-system.md` - Authentication system design

## Core Implementation
- `src/lib/scoring.ts` - **CRITICAL** - F1 scoring calculation (never change)
- `src/lib/api/openf1.ts` - Live race data API client
- `src/lib/api/ergast.ts` - Historical data API client
- `src/lib/supabase.ts` - Supabase client setup
- `src/lib/haptics.ts` - Mobile haptic feedback

## Database
- `supabase/schema.sql` - Complete database schema with RLS policies

## Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript strict mode configuration
- `tailwind.config.ts` - Design system configuration
- `.env.local.example` - Required environment variables
