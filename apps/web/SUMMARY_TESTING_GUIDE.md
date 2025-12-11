# Testing Guide: Weekly Summary Generation

## Quick Test (Manual Trigger)

### Prerequisites
1. Have at least one athlete with `consentChatSummaries = true`
2. That athlete should have chat sessions from the past 7 days
3. OpenAI API key configured in environment variables

### Test Steps

#### 1. Manual Trigger via API

**Using curl:**
```bash
# Get your session token from browser DevTools > Application > Cookies
# Look for next-auth.session-token

curl -X POST http://localhost:3000/api/summaries/generate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "successful": 5,
    "failed": 0,
    "skipped": 3,
    "highRiskAlerts": ["John Doe"]
  },
  "message": "Generated 5 summaries. 1 high-risk alerts."
}
```

#### 2. Check Summary Status

```bash
curl http://localhost:3000/api/summaries/generate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "totalSummaries": 5,
  "recentSummaries": [
    {
      "id": "clxyz123",
      "generatedAt": "2025-12-11T10:30:00Z",
      "athleteId": "athlete123",
      "sessionCount": 3
    }
  ],
  "lastGeneratedAt": "2025-12-11T10:30:00Z"
}
```

#### 3. View Team Summary

```bash
curl http://localhost:3000/api/summaries/team \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "teamSummary": {
    "totalAthletes": 25,
    "athletesWithRecentSummaries": 15,
    "highRiskAthletes": 1,
    "mediumRiskAthletes": 3,
    "topThemes": ["anxiety", "confidence", "recovery", "academic-stress"],
    "emotionalStateDistribution": {
      "positive": 8,
      "negative": 3,
      "neutral": 4,
      "mixed": 0
    },
    "weekStartDate": "2025-12-04T00:00:00Z",
    "weekEndDate": "2025-12-11T00:00:00Z"
  }
}
```

#### 4. View Summaries in Coach Dashboard

1. Log in as a coach
2. Navigate to `/coach/athletes`
3. Scroll to "Weekly Chat Summaries" section
4. Verify summaries are displayed with:
   - Athlete name, sport, year, position
   - Summary text (2-3 sentences)
   - Key themes as colored badges
   - Emotional state indicator
   - Action items
   - Timestamp

---

## Testing with Seed Data

### Create Test Athlete with Chat Sessions

```sql
-- 1. Create test athlete (via signup or SQL)
INSERT INTO "User" (id, email, name, role, "schoolId")
VALUES ('test-athlete-1', 'test@example.com', 'Test Athlete', 'ATHLETE', 'your-school-id');

INSERT INTO "Athlete" ("userId", sport, year, "consentChatSummaries")
VALUES ('test-athlete-1', 'Basketball', 'Sophomore', true);

-- 2. Create chat session
INSERT INTO "ChatSession" (id, "userId")
VALUES ('test-session-1', 'test-athlete-1');

-- 3. Add messages (simulate a conversation about pre-game anxiety)
INSERT INTO "Message" (id, "sessionId", role, content)
VALUES
  ('msg-1', 'test-session-1', 'user', 'I have a big game tomorrow and I am really anxious about it'),
  ('msg-2', 'test-session-1', 'assistant', 'It is completely normal to feel anxious before an important game. Let us talk about what specifically is making you feel this way. Is it pressure to perform, fear of making mistakes, or something else?'),
  ('msg-3', 'test-session-1', 'user', 'I am worried I will let my team down. Last game I missed some key shots and I cannot stop thinking about it.'),
  ('msg-4', 'test-session-1', 'assistant', 'That is a very common experience for athletes - ruminating on past mistakes. This is where CBT can help. Instead of "I will let my team down," try reframing it to "I have prepared well and will do my best." Your worth as a player is not defined by one game.');

-- 4. Add mood logs (last 7 days)
INSERT INTO "MoodLog" ("athleteId", mood, confidence, stress, "sleepQuality")
VALUES
  ('test-athlete-1', 5, 4, 7, 6),
  ('test-athlete-1', 6, 5, 6, 7),
  ('test-athlete-1', 4, 4, 8, 5);
```

### Run Summary Generation

```bash
curl -X POST http://localhost:3000/api/summaries/generate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Verify Summary in Database

```sql
SELECT
  cs.id,
  cs.summary,
  cs."keyThemes",
  cs."emotionalState",
  cs."actionItems",
  cs."sessionCount",
  cs.metadata,
  u.name as athlete_name
FROM "ChatSummary" cs
JOIN "Athlete" a ON cs."athleteId" = a."userId"
JOIN "User" u ON a."userId" = u.id
ORDER BY cs."generatedAt" DESC
LIMIT 1;
```

**Expected Output:**
```
summary: "Test Athlete is experiencing pre-game anxiety related to fear of letting the team down after missing shots in the previous game. CBT reframing techniques were introduced to help manage performance-related rumination."

keyThemes: ["pre-game-anxiety", "performance-pressure", "CBT", "confidence"]

emotionalState: "negative"

actionItems: [
  "Follow up on pre-game anxiety management techniques",
  "Check in before next game",
  "Consider team meeting about performance pressure"
]

metadata: {
  "riskLevel": "medium",
  "riskFactors": ["rumination", "high-stress"],
  "progressIndicators": {
    "confidence": "declining",
    "stress": "declining",
    "engagement": "stable"
  },
  "frameworksDiscussed": ["CBT"]
}
```

---

## Production Setup

### Environment Variables

Add to Vercel or your hosting platform:

```bash
# Required
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...

# Optional (for API key authentication in cron)
SUMMARY_GENERATION_API_KEY=your-secure-random-key-here
```

### Vercel Cron Setup

1. Deploy to Vercel
2. Verify `vercel.json` is in the project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/summaries/generate",
         "schedule": "0 2 * * 0"
       }
     ]
   }
   ```
3. Cron will run every Sunday at 2 AM UTC
4. Verify in Vercel Dashboard > Deployments > Cron Jobs

### Monitoring Cron Jobs

**Check last run status:**
```bash
curl https://your-app.vercel.app/api/summaries/generate \
  -H "x-api-key: your-secure-random-key-here"
```

**View logs in Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Find `/api/summaries/generate`
7. View execution logs

---

## Debugging Common Issues

### Issue: "No summaries generated"

**Possible causes:**
1. No athletes have `consentChatSummaries = true`
2. Athletes don't have chat sessions in the past 7 days
3. OpenAI API key not configured

**Solution:**
```sql
-- Check athletes with consent
SELECT u.name, a."consentChatSummaries"
FROM "Athlete" a
JOIN "User" u ON a."userId" = u.id;

-- Check recent chat sessions
SELECT
  u.name,
  COUNT(cs.id) as session_count
FROM "User" u
JOIN "Athlete" a ON u.id = a."userId"
LEFT JOIN "ChatSession" cs ON u.id = cs."userId"
  AND cs."createdAt" > NOW() - INTERVAL '7 days'
WHERE a."consentChatSummaries" = true
GROUP BY u.name;
```

### Issue: "OpenAI API Error"

**Possible causes:**
1. Invalid API key
2. Rate limit exceeded
3. Network timeout

**Solution:**
- Check API key in environment variables
- Verify OpenAI account has credits
- Check Vercel function timeout (max 10 seconds on Hobby plan, 300s on Pro)
- Consider upgrading to Vercel Pro for longer timeouts

### Issue: "Cron not running"

**Possible causes:**
1. Vercel cron only works on production deployments
2. `vercel.json` not in project root
3. Incorrect cron schedule format

**Solution:**
- Deploy to production (not preview)
- Verify `vercel.json` exists and is valid JSON
- Use [crontab.guru](https://crontab.guru/) to validate cron schedule

---

## Performance Benchmarks

**Expected Costs (GPT-4 Turbo)**:
- Average conversation: 3 sessions × 10 messages = ~3,000 tokens input
- GPT-4 analysis: ~5,000 tokens total (input + output)
- Cost per athlete: ~$0.01 per week
- 500 athletes: $5/week = $260/year in AI costs

**Expected Duration**:
- Single athlete: 2-5 seconds (GPT-4 API call)
- 100 athletes: 3-8 minutes (sequential processing)
- 500 athletes: 15-40 minutes (sequential processing)

**Optimization Opportunities**:
- Parallel processing (process 10 athletes at a time)
- Redis caching for team summaries
- Batch API requests to OpenAI (when available)

---

## Next Steps After Testing

1. ✅ **Verify summaries are accurate and helpful**
   - Review generated summaries with sports psychology coach
   - Ensure risk levels are appropriate
   - Validate action items are actionable

2. **Set up email notifications**
   - Integrate SendGrid or Resend
   - Create high-risk alert emails
   - Create weekly digest emails

3. **Add manual trigger button in coach dashboard**
   - Allow coaches to regenerate summaries on demand
   - Show "Last generated: 2 hours ago" status

4. **Create admin panel**
   - View all summaries across all schools
   - Export summaries to CSV/PDF
   - Analytics on summary generation success rate

5. **Longitudinal tracking**
   - Compare this week's summary to previous weeks
   - Show trends: "Confidence improving for 3 weeks straight"
   - Alert on negative trends

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
