# Flow Sports Coach - Pilot Validation Checklist

## Quick Reference

**Target:** 15-25 athletes from 2-3 sports
**Duration:** 10-12 weeks
**Goal:** Validate engagement, safety, and effectiveness before broader rollout

---

## Phase 1: Pre-Pilot Setup (Week 1-2)

### Technical Readiness
- [ ] Staging environment stable and tested
- [ ] Knowledge base ingested and RAG verified
- [ ] Crisis escalation workflow tested end-to-end
- [ ] Coach dashboard functional
- [ ] Daily mood logging working
- [ ] Chat interface responsive and streaming
- [ ] Error logging and monitoring configured
- [ ] Data export capability verified

### Partner Recruitment
- [ ] Identify 2-3 coaches willing to participate
- [ ] Present pilot overview to coaches
- [ ] Get coach commitment and availability
- [ ] Identify potential athlete participants (15-25)
- [ ] Schedule orientation sessions

### Compliance & Consent
- [ ] Prepare informed consent form
- [ ] IRB approval (if required by UW)
- [ ] Data privacy explanation document
- [ ] Emergency contact protocol documented
- [ ] Anonymization policy for coach dashboard

### Baseline Assessments
Choose 2-3 validated instruments:
- [ ] Sport Competition Anxiety Test (SCAT)
- [ ] Psychological Performance Inventory (PPI)
- [ ] Brief COPE inventory
- [ ] Custom baseline survey (current mental skills usage)

---

## Phase 2: Onboarding (Week 3)

### Athlete Onboarding Session (30-45 min each)
- [ ] Explain the platform purpose
- [ ] Demo chat interface
- [ ] Demo mood logging
- [ ] Set usage expectations:
  - 3-5 chat conversations per week
  - Daily mood logs (takes <1 minute)
- [ ] Walk through privacy protections
- [ ] Explain crisis escalation (what happens if concerning content)
- [ ] Collect signed consent forms
- [ ] Complete baseline assessments
- [ ] Distribute contact info for technical issues

### Coach Onboarding Session (30 min)
- [ ] Dashboard walkthrough
- [ ] Explain anonymization (can't see individual chats)
- [ ] Review aggregate metrics available
- [ ] Crisis alert notification process
- [ ] Weekly summary reports explanation
- [ ] Q&A and concerns

---

## Phase 3: Active Pilot (Weeks 4-10)

### Weekly Monitoring Checklist

**Every Monday:**
- [ ] Check weekly active users (target: 60%+)
- [ ] Review mood log completion rates (target: 70%+)
- [ ] Check for any crisis alerts
- [ ] Review error logs for technical issues
- [ ] Note any user feedback/complaints

**Every Friday:**
- [ ] Send brief check-in survey (3 questions)
- [ ] Generate coach summary report
- [ ] Document any feature requests
- [ ] Review conversation quality (sample 3-5)

### Metrics to Track

**Engagement (Weekly):**
| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Week 6 | Week 7 |
|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| Weekly Active Users | 60%+ | | | | | | | |
| Conversations/User | 3-5 | | | | | | | |
| Mood Log Completion | 70%+ | | | | | | | |
| Avg Conversation Length | 5+ turns | | | | | | | |
| Return Rate | 50%+ | | | | | | | |

**Safety (Ongoing):**
| Metric | Target | Running Total |
|--------|--------|---------------|
| Crisis Alerts Triggered | Track all | |
| Crisis Alerts Missed | 0 | |
| Escalations Completed | 100% | |
| False Positives | Track | |

**Technical (Weekly):**
| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Week 6 | Week 7 |
|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| Uptime | 99%+ | | | | | | | |
| Avg Response Time | <3s | | | | | | | |
| Error Rate | <1% | | | | | | | |
| Cost/User/Week | <$1.50 | | | | | | | |

### Weekly Check-in Survey (Send Fridays)
1. "How helpful was the AI coach this week?" (1-5)
2. "Did you encounter any technical issues?" (Y/N + description)
3. "Any suggestions for improvement?" (open text)

---

## Phase 4: Evaluation (Weeks 11-12)

### Data Collection
- [ ] Export all conversation logs (anonymized)
- [ ] Export all mood logs
- [ ] Compile engagement metrics
- [ ] Collect final survey responses
- [ ] Complete post-pilot assessments (same as baseline)

### Post-Pilot Assessments
- [ ] Re-administer SCAT/PPI/COPE
- [ ] Calculate pre/post differences
- [ ] Statistical significance testing (if N sufficient)

### Stakeholder Feedback Sessions
- [ ] Schedule 15-min athlete exit interviews (sample of 5-10)
- [ ] Schedule coach feedback session
- [ ] Document top 5 feature requests
- [ ] Document top 5 pain points

### Exit Interview Questions (Athletes)
1. What did you find most helpful about the AI coach?
2. What was frustrating or didn't work well?
3. Did you feel the conversations were relevant to your sport?
4. Would you recommend this to a teammate?
5. What one thing would make this better?

---

## Success Criteria

### Minimum Success (Proceed to Production)
- [ ] 60%+ weekly active users
- [ ] 70%+ mood log compliance
- [ ] Zero missed crisis escalations
- [ ] User satisfaction 4.0+/5.0 average
- [ ] Cost within budget (<$5/user/month)

### Target Success
- [ ] 75%+ weekly active users
- [ ] 80%+ mood log compliance
- [ ] Measurable improvement in assessments
- [ ] User satisfaction 4.5+/5.0 average
- [ ] Athletes request to continue

### Outstanding Success
- [ ] 85%+ engagement rates
- [ ] Statistically significant improvement
- [ ] Coaches want to expand to full team
- [ ] Word-of-mouth interest from other athletes

---

## Pilot Budget

| Item | Estimated Cost | Actual |
|------|---------------|--------|
| OpenAI API (20 users × 8 weeks) | $200-400 | |
| Infrastructure (staging) | $50/month × 3 | |
| Participant incentives (optional) | $0-500 | |
| Assessment tools (if licensed) | $0-200 | |
| **Total** | **$350-1250** | |

---

## Emergency Protocols

### If Crisis Alert Triggers:
1. System automatically provides crisis resources to athlete
2. Alert sent to designated coach/administrator
3. Follow up within 24 hours
4. Document in incident log

### If System Goes Down:
1. Check Railway/Vercel status
2. Notify participants via email/text
3. Provide alternative contact (coach's email)
4. Document downtime and cause

### If Data Breach Suspected:
1. Immediately lock down access
2. Notify university IT security
3. Document timeline and scope
4. Prepare notification if required

---

## Post-Pilot Deliverables

- [ ] Pilot summary report (2-3 pages)
- [ ] Engagement metrics dashboard
- [ ] Pre/post assessment comparison
- [ ] Feature request prioritization
- [ ] Recommendations for production
- [ ] Refined cost projections
- [ ] Updated product roadmap

---

## Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Pilot Lead | | | |
| Technical Support | | | |
| Coach Contact #1 | | | |
| Coach Contact #2 | | | |
| Crisis Escalation | | | |
