# 🚀 NEXT STEPS - Coach Portal Development

## Current Status
- ✅ Web Command Center Complete (Phase 1)
- ✅ All 16 foundation components built
- ⏳ Mobile app needs UI improvements (separate from web)
- ⏳ 6 more web portal sections to build

## Architecture Clarification

### Web Portal (Primary Focus)
**Location**: `/apps/web/src/app/(coach)/`
**Access**: Browser (desktop + mobile responsive)
**Features**: 7-tab elite coach portal with AI algorithms

**Tabs**:
1. ✅ **Command Center** - COMPLETE `/command-center`
2. ⏳ **Roster** - Build next `/roster`
3. ⏳ **Analytics Hub** - `/analytics`
4. ⏳ **Readiness Command** - `/readiness`
5. ⏳ **Assignments & Habits** - `/assignments`
6. ⏳ **AI Insights** - `/insights`
7. ⏳ **Settings & Admin** - `/settings`

###  Mobile App (React Native)
**Location**: `/apps/mobile/app/(coach)/`
**Current Status**: Basic dashboard with old API
**Plan**: Will update to use web portal via responsive design OR rebuild with Command Center patterns

## Immediate Next Actions

### 1. Build Web Roster View (Phase 2)
**Components**:
- `AthleteCard.tsx` - Individual athlete cards
- `FilterBar.tsx` - Advanced filtering (sport, year, risk, readiness, archetype, consent)
- `ProfileModal.tsx` - Full athlete detail with 6 tabs
- `ReadinessRadarChart.tsx` - 6-dimension visualization

**Backend**:
- `GET /api/coach/athletes` - Paginated list with filters
- `GET /api/coach/athletes/:id` - Full athlete profile

### 2. Enhance Algorithms (Throughout)
Replace mock implementations with real:
- **Readiness Score**: 6-dimensional calculation (physical, mental, emotional, recovery, contextual, social)
- **Risk Assessment**: Multi-factor model (stress patterns, mood trends, engagement, burnout indicators)
- **Priority Algorithm**: Weighted urgency calculation
- **Burnout Prediction**: 30-day forecast using trend analysis
- **Archetype Classification**: Pattern matching from behavior data

### 3. Build Remaining Sections
Follow the roadmap in `COACH_PORTAL_IMPLEMENTATION_PLAN.md`

## Mobile App Strategy

**Option A** (Recommended): Use responsive web portal
- Coach accesses web portal via mobile browser
- Already responsive with Tailwind
- Full feature parity
- Faster development

**Option B**: Rebuild mobile with Command Center
- Port web Command Center to React Native
- Match athlete side design patterns
- More native feel
- Slower development

**Decision**: Start with Option A, add Option B if needed

## Testing Access

### Web Portal
1. Start dev server: `cd apps/web && npm run dev`
2. Login as coach
3. Navigate to: `http://localhost:3000/coach/command-center`

### Mobile App
1. Currently shows old dashboard
2. Will update to point to web portal OR rebuild

## Files to Continue From

- **Progress**: `COACH_PORTAL_PROGRESS.md`
- **Roadmap**: `COACH_PORTAL_IMPLEMENTATION_PLAN.md`
- **Types**: `apps/web/src/types/coach-portal.ts`
- **Components**: `apps/web/src/components/coach/`

##Ready to Build Next
**Roster View** components and API endpoints.
