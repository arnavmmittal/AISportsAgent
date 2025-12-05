# AI Sports Agent - Technical Implementation Plan

**Last Updated:** December 2025

This document contains the technical roadmap for building out the AI Sports Agent platform. For business strategy and competitive positioning, see the business strategy plan.

---

## Current Status Summary

### ✅ Completed
- MCP agent architecture (Athlete, Coach, Governance, Knowledge agents)
- Discovery-first conversation protocol
- Crisis detection system (keyword scan + AI analysis)
- Voice integration with WebSocket streaming
- Frontend dashboard components
- Coach analytics dashboard (3 pages)
- API client for backend communication
- Cartesia.ai TTS with OpenAI fallback
- Database schemas (Prisma + SQLAlchemy)

### 🚧 In Progress
- Replace mock data with real API calls
- Database migrations and initialization
- Crisis escalation implementation

### ⏳ Pending
- Sports-themed authentication UI
- Production deployment
- Comprehensive testing

---

## Phase 1: Database Foundation (CRITICAL - WEEK 1)

### Priority: BLOCKING - Must complete before other work

### 1.1 Frontend Database (Prisma)

**Status:** Schema complete but no migrations exist

**Actions:**
```bash
cd ai-sports-agent
npx prisma migrate dev --name initial_schema
npx prisma generate
```

**Create seed file:** `prisma/seed.ts`
- Demo athlete account (demo@athlete.com / demo123)
- Demo coach account (coach@demo.com / coach123)
- Sample mood logs (7 days of data)
- Sample goals (3-5 goals in different states)
- Sample chat sessions
- Knowledge base entries

**Files:**
- `ai-sports-agent/prisma/schema.prisma` - Already complete ✅
- `ai-sports-agent/prisma/seed.ts` - CREATE NEW FILE

### 1.2 Backend Database (SQLAlchemy)

**Critical Finding:** `/app/db/models.py` exists but missing 2 models!

**Missing Models to Add:**

1. **CrisisAlert** (SAFETY-CRITICAL)
```python
class CrisisAlert(Base):
    __tablename__ = "CrisisAlert"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athleteId = Column(String, ForeignKey("Athlete.userId"))
    sessionId = Column(String, ForeignKey("ChatSession.id"))
    severity = Column(Enum("CRITICAL", "HIGH", "MEDIUM", "LOW", name="severity_enum"))
    detectedAt = Column(DateTime, default=datetime.utcnow)
    reviewed = Column(Boolean, default=False)
    escalated = Column(Boolean, default=False)
    escalatedTo = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    keywordMatches = Column(JSON, nullable=True)
    aiAnalysis = Column(JSON, nullable=True)
```

2. **ConversationInsight** (ANALYTICS)
```python
class ConversationInsight(Base):
    __tablename__ = "ConversationInsight"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athleteId = Column(String, ForeignKey("Athlete.userId"))
    sessionId = Column(String, ForeignKey("ChatSession.id"))
    themes = Column(JSON)  # Array of themes ["anxiety", "confidence"]
    sentiment = Column(Float)  # -1.0 to 1.0
    emotions = Column(JSON, nullable=True)  # {"happy": 0.7, "anxious": 0.3}
    discoveryPhase = Column(String, nullable=True)  # EXPLORE, UNDERSTAND, etc.
    interventionUsed = Column(String, nullable=True)
    keyTopics = Column(JSON)  # ["pre-game nerves", "team dynamics"]
    actionItems = Column(JSON)  # ["practice breathing exercises"]
    extractedAt = Column(DateTime, default=datetime.utcnow)
```

**Create Alembic migrations:**
```bash
cd ai-sports-mcp/server
alembic revision --autogenerate -m "Add crisis and analytics models"
alembic upgrade head
```

**Files:**
- `ai-sports-mcp/server/app/db/models.py` - ADD MODELS
- `ai-sports-mcp/server/alembic/versions/*.py` - AUTO-GENERATED

### 1.3 Initialize Database in Startup

**File:** `ai-sports-mcp/server/app/main.py` (line 18-32)

**Add to lifespan:**
```python
from app.db.database import init_db, engine
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Initialize database
    logger.info("Initializing database...")
    try:
        init_db()  # Create tables

        # Verify connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Database ready")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")
```

**Files:**
- `ai-sports-mcp/server/app/main.py` - MODIFY LIFESPAN

---

## Phase 2: Crisis Escalation (WEEK 1) - SAFETY-CRITICAL

### Priority: HIGHEST - Legal liability if not implemented

### 2.1 Implement Actual Escalation

**File:** `ai-sports-mcp/server/app/agents/governance_agent.py` (line 223-244)

**Current:** TODO comment - NOT IMPLEMENTED!

**Replace with:**
```python
def _trigger_escalation(self, analysis: Dict[str, Any]) -> None:
    """
    Trigger escalation for crisis situations.
    Sends email, webhook, and creates database record.
    """
    from app.db.models import CrisisAlert
    from datetime import datetime

    logger.critical(f"🚨 ESCALATION: Athlete {analysis['athlete_id']}")

    # 1. Create database record
    crisis_alert = CrisisAlert(
        athleteId=analysis['athlete_id'],
        sessionId=analysis['session_id'],
        severity=analysis['final_risk_level'],
        detectedAt=datetime.utcnow(),
        escalated=True,
        keywordMatches=analysis.get('keyword_scan'),
        aiAnalysis=analysis.get('ai_analysis'),
    )
    self.db.add(crisis_alert)
    self.db.commit()

    # 2. Send email to crisis team
    try:
        self._send_crisis_email(analysis, crisis_alert.id)
    except Exception as e:
        logger.error(f"Failed to send crisis email: {e}")

    # 3. Send webhook (Slack/Discord)
    try:
        self._send_crisis_webhook(analysis, crisis_alert.id)
    except Exception as e:
        logger.error(f"Failed to send crisis webhook: {e}")

    logger.critical(f"✓ Escalation complete. Alert ID: {crisis_alert.id}")

def _send_crisis_email(self, analysis: Dict, alert_id: str):
    """Send crisis alert email to configured recipients"""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    if not settings.CRISIS_ALERT_EMAIL:
        logger.warning("CRISIS_ALERT_EMAIL not configured - skipping email")
        return

    subject = f"🚨 CRISIS ALERT: Athlete {analysis['athlete_id']}"

    # Create HTML email body
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #dc2626;">Crisis Alert</h2>
        <p><strong>Alert ID:</strong> {alert_id}</p>
        <p><strong>Risk Level:</strong> <span style="color: #dc2626;">{analysis['final_risk_level']}</span></p>
        <p><strong>Athlete:</strong> {analysis['athlete_id']}</p>
        <p><strong>Session:</strong> {analysis['session_id']}</p>
        <p><strong>Timestamp:</strong> {datetime.utcnow().isoformat()}</p>

        <h3>Detected Issues:</h3>
        <ul>
            {chr(10).join([f"<li>{issue}</li>" for issue in analysis.get('keyword_scan', {}).get('matched_keywords', [])])}
        </ul>

        <h3>Recommended Action:</h3>
        <p>{analysis.get('ai_analysis', {}).get('recommended_action', 'Contact athlete immediately')}</p>

        <p style="margin-top: 20px;">
            <a href="{settings.NEXTAUTH_URL}/coach/alerts/{alert_id}"
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Dashboard
            </a>
        </p>
    </body>
    </html>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.EMAIL_FROM if hasattr(settings, 'EMAIL_FROM') else 'alerts@ai-sports-agent.com'
    msg['To'] = settings.CRISIS_ALERT_EMAIL

    msg.attach(MIMEText(html, 'html'))

    # Send email
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if hasattr(settings, 'SMTP_USER') and hasattr(settings, 'SMTP_PASSWORD'):
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)

    logger.info(f"Crisis email sent to {settings.CRISIS_ALERT_EMAIL}")

def _send_crisis_webhook(self, analysis: Dict, alert_id: str):
    """Send crisis alert to webhook (Slack, Discord, etc.)"""
    import httpx

    if not settings.CRISIS_ALERT_WEBHOOK:
        logger.warning("CRISIS_ALERT_WEBHOOK not configured - skipping webhook")
        return

    # Slack-compatible webhook payload
    payload = {
        "text": f"🚨 *CRISIS ALERT* - Athlete {analysis['athlete_id']}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Crisis Alert",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Alert ID:*\n{alert_id}"},
                    {"type": "mrkdwn", "text": f"*Risk Level:*\n{analysis['final_risk_level']}"},
                    {"type": "mrkdwn", "text": f"*Athlete:*\n{analysis['athlete_id']}"},
                    {"type": "mrkdwn", "text": f"*Session:*\n{analysis['session_id']}"}
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Recommended Action:*\n{analysis.get('ai_analysis', {}).get('recommended_action', 'Contact athlete immediately')}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View in Dashboard"},
                        "url": f"{settings.NEXTAUTH_URL}/coach/alerts/{alert_id}",
                        "style": "danger"
                    }
                ]
            }
        ]
    }

    response = httpx.post(settings.CRISIS_ALERT_WEBHOOK, json=payload, timeout=5.0)
    response.raise_for_status()

    logger.info(f"Crisis webhook sent successfully")
```

**Environment Variables (.env):**
```env
# Crisis Detection & Alerts
CRISIS_ALERT_EMAIL=sports-psychology-team@university.edu
CRISIS_ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@university.edu
SMTP_PASSWORD=your-app-password
EMAIL_FROM=AI Sports Agent <alerts@university.edu>
```

**Files:**
- `ai-sports-mcp/server/app/agents/governance_agent.py` - IMPLEMENT ESCALATION
- `ai-sports-mcp/server/app/core/config.py` - ADD EMAIL/WEBHOOK SETTINGS
- `ai-sports-mcp/server/.env` - ADD CONFIGURATION

---

## Phase 3: Replace Mock Data (WEEK 2)

### Priority: HIGH - Currently all data is fake

### 3.1 Athlete Dashboard

**File:** `ai-sports-agent/src/app/dashboard/page.tsx` (line 38-62)

**Replace mock data:**
```typescript
const [stats, setStats] = useState({
  moodTrend: [] as number[],
  goalsProgress: 0,
  activeGoals: 0,
  recentSessions: [] as any[],
});
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (session?.user?.id) {
    loadDashboardData();
  }
}, [session]);

const loadDashboardData = async () => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const [moodLogs, goals, sessions] = await Promise.all([
      fetch(`${backendUrl}/api/mood-logs?athleteId=${session.user.id}&days=7`)
        .then(r => r.json()),
      fetch(`${backendUrl}/api/goals?athleteId=${session.user.id}&status=IN_PROGRESS`)
        .then(r => r.json()),
      fetch(`${backendUrl}/api/chat/sessions?athleteId=${session.user.id}&limit=3`)
        .then(r => r.json()),
    ]);

    setStats({
      moodTrend: moodLogs.map((log: any) => log.mood),
      goalsProgress: goals.length > 0
        ? (goals.filter((g: any) => g.status === 'COMPLETED').length / goals.length) * 100
        : 0,
      activeGoals: goals.filter((g: any) => g.status === 'IN_PROGRESS').length,
      recentSessions: sessions.map((s: any) => ({
        id: s.id,
        date: new Date(s.createdAt).toLocaleDateString(),
        topic: s.topic || 'General conversation',
        sentiment: s.sentiment || 'neutral',
      })),
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    setLoading(false);
  }
};
```

### 3.2 Create Backend API Routes

**1. Mood Logs API**

**File:** `ai-sports-agent/src/app/api/mood-logs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const moodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId,
        createdAt: { gte: cutoffDate }
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(moodLogs);
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.athleteId || data.mood === undefined || data.confidence === undefined || data.stress === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const moodLog = await prisma.moodLog.create({ data });
    return NextResponse.json(moodLog);
  } catch (error) {
    console.error('Error creating mood log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**2. Goals API**

**File:** `ai-sports-agent/src/app/api/goals/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const status = searchParams.get('status');

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        athleteId,
        ...(status && { status: status as any })
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.athleteId || !data.title || !data.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const goal = await prisma.goal.create({ data });
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**3. Chat Sessions API**

**File:** `ai-sports-agent/src/app/api/chat/sessions/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3.3 Mood Logger Integration

**File:** `ai-sports-agent/src/components/mood/MoodLogger.tsx`

**Wire to API:**
```typescript
const handleSubmit = async (values: MoodLogFormValues) => {
  try {
    setIsSubmitting(true);

    const response = await fetch('/api/mood-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athleteId: session?.user?.id,
        ...values
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save mood log');
    }

    // Show success message
    toast.success('Mood log saved successfully!');

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Error saving mood log:', error);
    toast.error('Failed to save mood log. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Files:**
- `ai-sports-agent/src/app/dashboard/page.tsx` - REPLACE MOCK DATA
- `ai-sports-agent/src/app/api/mood-logs/route.ts` - CREATE NEW FILE
- `ai-sports-agent/src/app/api/goals/route.ts` - CREATE NEW FILE
- `ai-sports-agent/src/app/api/chat/sessions/route.ts` - CREATE NEW FILE
- `ai-sports-agent/src/components/mood/MoodLogger.tsx` - WIRE SUBMISSION

---

## Phase 4: Sports-Themed Authentication (WEEK 2-3)

### Priority: MEDIUM - Functional but not polished

### 4.1 Signup API Implementation

**File:** `ai-sports-agent/src/app/api/auth/signup/route.ts` (CREATE NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, sport, year, teamPosition } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role-specific data
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        schoolId: 'default-school-id', // TODO: Get from signup flow
        ...(role === 'ATHLETE' && {
          athlete: {
            create: {
              sport: sport || 'General',
              year: year || 'FRESHMAN',
              teamPosition: teamPosition,
            }
          }
        }),
        ...(role === 'COACH' && {
          coach: {
            create: {
              sport: sport || 'General',
              teamId: 'default-team-id', // TODO: Get from signup flow
            }
          }
        }),
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
```

### 4.2 Wire Signup Form

**File:** `ai-sports-agent/src/app/auth/signup/page.tsx` (line 20-33)

**Replace TODO with:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    // Call signup API
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Auto-login after successful signup
    const signInResult = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      throw new Error('Account created but login failed');
    }

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Files:**
- `ai-sports-agent/src/app/api/auth/signup/route.ts` - CREATE NEW FILE
- `ai-sports-agent/src/app/auth/signup/page.tsx` - IMPLEMENT SUBMISSION (line 20-33)

---

## Phase 5: Analytics & Insights (WEEK 3)

### Priority: MEDIUM - Needed for coach value prop

### 5.1 Conversation Insight Generation

**File:** `ai-sports-mcp/server/app/agents/athlete_agent.py`

**Add method:**
```python
async def _generate_conversation_insight(
    self,
    session_id: str,
    athlete_id: str,
    messages: List[Dict]
) -> None:
    """
    Extract themes, sentiment, and insights from conversation.
    Called after each chat session ends.
    """
    from app.db.models import ConversationInsight
    import json

    # Combine conversation into single text
    conversation = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in messages
    ])

    # Analysis prompt
    analysis_prompt = f"""
    Analyze this athlete conversation and extract insights for coaches.

    Conversation:
    {conversation}

    Return JSON with:
    {{
      "themes": ["anxiety", "confidence", "team-dynamics"],
      "sentiment": 0.5,
      "emotions": {{"anxious": 0.3, "motivated": 0.7}},
      "discovery_phase": "EXPLORE",
      "key_topics": ["pre-game nerves", "coach relationship"],
      "action_items": ["practice breathing exercises", "schedule 1-on-1 with coach"]
    }}

    Sentiment scale: -1 (very negative) to 1 (very positive)
    Discovery phases: EXPLORE, UNDERSTAND, FRAMEWORK, ACTION, FOLLOWUP
    """

    try:
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": analysis_prompt}],
            response_format={"type": "json_object"},
        )

        analysis = json.loads(response.choices[0].message.content)

        # Store insight in database
        insight = ConversationInsight(
            athleteId=athlete_id,
            sessionId=session_id,
            themes=analysis.get('themes', []),
            sentiment=analysis.get('sentiment', 0.0),
            emotions=analysis.get('emotions'),
            discoveryPhase=analysis.get('discovery_phase'),
            keyTopics=analysis.get('key_topics', []),
            actionItems=analysis.get('action_items', []),
            extractedAt=datetime.utcnow(),
        )

        self.db.add(insight)
        self.db.commit()

        logger.info(f"Conversation insight generated for session {session_id}")

    except Exception as e:
        logger.error(f"Failed to generate conversation insight: {e}")
        # Don't fail the conversation if insight generation fails
```

**Call this after chat session ends:**

**File:** `ai-sports-mcp/server/app/api/routes/chat.py`

**Add to session end:**
```python
# After conversation ends or after every N messages
if len(conversation_history) >= 10:  # Or at session end
    await athlete_agent._generate_conversation_insight(
        session_id=session_id,
        athlete_id=athlete_id,
        messages=conversation_history
    )
```

**Files:**
- `ai-sports-mcp/server/app/agents/athlete_agent.py` - ADD INSIGHT GENERATION
- `ai-sports-mcp/server/app/api/routes/chat.py` - CALL AFTER SESSION

---

## Testing Strategy

### Backend Tests

**File:** `ai-sports-mcp/server/tests/test_crisis_detection.py`

```python
import pytest
from app.agents.governance_agent import GovernanceAgent

def test_crisis_detection():
    """Test crisis keyword detection"""
    agent = GovernanceAgent(db=mock_db)

    # Test critical keywords
    result = agent.detect_crisis("I want to hurt myself")
    assert result[0] == True  # Crisis detected
    assert result[1] == "CRITICAL"  # Severity level

def test_escalation():
    """Test escalation triggers correctly"""
    # Mock email/webhook
    with patch('app.agents.governance_agent._send_crisis_email'):
        agent.detect_crisis("I'm thinking about suicide")
        # Verify email was sent
        # Verify database record created
```

**Frontend E2E Tests**

**File:** `ai-sports-agent/tests/e2e/auth.spec.ts`

```typescript
test('signup flow creates account and logs in', async ({ page }) => {
  await page.goto('/auth/signup');

  await page.fill('[name="name"]', 'Test Athlete');
  await page.fill('[name="email"]', 'test@athlete.com');
  await page.fill('[name="password"]', 'password123');
  await page.selectOption('[name="role"]', 'ATHLETE');

  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run Prisma migrations on production DB
- [ ] Run Alembic migrations on production DB
- [ ] Set production environment variables
  - [ ] DATABASE_URL
  - [ ] OPENAI_API_KEY
  - [ ] CARTESIA_API_KEY (optional)
  - [ ] CRISIS_ALERT_EMAIL
  - [ ] CRISIS_ALERT_WEBHOOK
  - [ ] SMTP credentials
  - [ ] NEXTAUTH_SECRET
  - [ ] JWT_SECRET_KEY
- [ ] Test crisis escalation delivery
- [ ] Verify TTS fallback works
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Set up logging aggregation

### Post-Deployment

- [ ] Test login/signup flow
- [ ] Test voice chat with real audio
- [ ] Trigger test crisis alert (verify email arrives)
- [ ] Verify coach dashboard loads
- [ ] Check database connections
- [ ] Monitor error logs for 24 hours
- [ ] Test mobile responsiveness
- [ ] Verify SSL/TLS certificates

---

## Success Metrics

### Technical

- ✅ 0 database migration errors
- ✅ 100% crisis alert delivery rate
- ✅ <500ms TTS latency (Cartesia) or <2s (OpenAI)
- ✅ <2s dashboard load time
- ✅ 99.9% uptime
- ✅ <100ms API response time (p95)

### Product

- ✅ Athletes can signup with complete flow
- ✅ Coaches see real analytics (not mock data)
- ✅ Voice chat works with automatic fallback
- ✅ Crisis alerts sent within 30 seconds
- ✅ All mock data replaced with real API calls
- ✅ Mobile-responsive UI

---

## File Summary

### Must Create

1. `ai-sports-agent/prisma/seed.ts` - Database seed file
2. `ai-sports-agent/src/app/api/auth/signup/route.ts` - Signup handler
3. `ai-sports-agent/src/app/api/mood-logs/route.ts` - Mood logs API
4. `ai-sports-agent/src/app/api/goals/route.ts` - Goals API
5. `ai-sports-agent/src/app/api/chat/sessions/route.ts` - Chat sessions API

### Must Modify

1. `ai-sports-mcp/server/app/db/models.py` - Add CrisisAlert & ConversationInsight models
2. `ai-sports-mcp/server/app/main.py` - Add init_db() call in lifespan (line 18-32)
3. `ai-sports-mcp/server/app/agents/governance_agent.py` - Implement crisis escalation (line 223-244)
4. `ai-sports-mcp/server/app/agents/athlete_agent.py` - Add conversation insight generation
5. `ai-sports-agent/src/app/dashboard/page.tsx` - Replace mock data (line 38-62)
6. `ai-sports-agent/src/app/auth/signup/page.tsx` - Implement signup submission (line 20-33)
7. `ai-sports-agent/src/components/mood/MoodLogger.tsx` - Wire API submission

### Already Complete ✅

1. `ai-sports-agent/src/lib/api-client.ts` - API client
2. `ai-sports-agent/src/app/coach/dashboard/page.tsx` - Coach dashboard
3. `ai-sports-agent/src/app/coach/athletes/page.tsx` - Athletes list
4. `ai-sports-agent/src/app/coach/athletes/[id]/page.tsx` - Athlete detail
5. `ai-sports-agent/src/app/coach/insights/page.tsx` - Conversation insights
6. `ai-sports-mcp/server/app/voice/tts.py` - Cartesia + OpenAI TTS fallback
7. `ai-sports-mcp/server/app/core/config.py` - Cartesia configuration

---

## Estimated Effort

- **Phase 1 (Database):** 8-10 hours
- **Phase 2 (Crisis Escalation):** 6-8 hours
- **Phase 3 (Replace Mock Data):** 10-12 hours
- **Phase 4 (Sports Auth):** 6-8 hours
- **Phase 5 (Analytics):** 8-10 hours
- **Testing:** 10-12 hours
- **Deployment:** 4-6 hours

**Total:** 52-66 hours (1.5-2 weeks full-time)

---

## Priority Order

1. **CRITICAL:** Database initialization (Phase 1)
2. **CRITICAL:** Crisis escalation (Phase 2)
3. **HIGH:** Replace mock data (Phase 3)
4. **MEDIUM:** Signup implementation (Phase 4)
5. **MEDIUM:** Analytics generation (Phase 5)
6. **LOW:** UI polish and animations

---

**For business strategy and competitive positioning, see:** `BUSINESS_STRATEGY_PLAN.md`
