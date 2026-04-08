import type { KnowledgeCategory } from '@prisma/client';

interface SeedDocument {
  title: string;
  content: string;
  source: string;
  category: KnowledgeCategory;
  tags: string[];
}

/**
 * Foundational sports psychology knowledge base.
 * Each entry contains real, evidence-based content with proper citations.
 * These form the RAG retrieval corpus that differentiates our coaching
 * from a generic GPT wrapper.
 */
const SEED_DOCUMENTS: SeedDocument[] = [
  // 1. ACT for Athletes
  {
    title: 'Acceptance and Commitment Therapy (ACT) in Sport',
    content: `Acceptance and Commitment Therapy (ACT), developed by Steven Hayes, has emerged as a powerful framework for athletic mental performance. Unlike traditional cognitive-behavioral approaches that attempt to change or eliminate negative thoughts, ACT encourages athletes to accept difficult internal experiences while committing to values-driven action.

The ACT model rests on six core processes: acceptance, cognitive defusion, present-moment awareness, self-as-context, values clarification, and committed action. In sport, acceptance means allowing pre-competition anxiety, self-doubt, or frustration to be present without struggling against them. Research by Gardner and Moore (2007) in their Mindfulness-Acceptance-Commitment (MAC) approach demonstrated that athletes who practiced acceptance showed greater performance improvements than those using traditional psychological skills training.

Cognitive defusion techniques help athletes create distance from unhelpful thoughts. Instead of "I can't make this free throw," an athlete learns to notice "I'm having the thought that I can't make this free throw." This subtle shift reduces the thought's power over behavior. Schwanhausser (2009) found that a young swimmer using ACT-based interventions improved both mindfulness scores and competitive performance over a season.

Values clarification is particularly potent for collegiate athletes navigating identity questions. When an athlete connects their sport participation to deeper values — growth, excellence, connection, courage — motivation becomes intrinsic rather than outcome-dependent. This buffers against the inevitable setbacks that come with competitive sport.

Practical ACT exercises for athletes include the "Leaves on a Stream" visualization (placing thoughts on leaves and watching them float by), the "Passengers on the Bus" metaphor (anxious thoughts are passengers, but the athlete drives), and values-based goal setting that anchors daily training to personal meaning.`,
    source: 'Gardner & Moore (2007); Hayes et al. (2006); Schwanhausser (2009)',
    category: 'MINDFULNESS',
    tags: ['ACT', 'acceptance', 'defusion', 'values', 'committed-action'],
  },

  // 2. Mindfulness-Based Performance Enhancement (MSPE)
  {
    title: 'Mindfulness Sport Performance Enhancement (MSPE)',
    content: `Mindfulness Sport Performance Enhancement (MSPE), developed by Keith Kaufman, Carol Glass, and Tim Pineau, is a structured program specifically designed for athletes. Unlike general mindfulness programs adapted for sport, MSPE was built from the ground up for competitive performers and has been empirically validated across multiple sports.

The MSPE protocol spans six sessions and integrates seated meditation, body scan, walking meditation, yoga, and sport-specific mindfulness exercises. A key innovation is the "mindful sport activity" where athletes practice their sport with deliberate present-moment awareness — noticing physical sensations, environmental cues, and mental states without judgment. Kaufman et al. (2009) found that long-distance runners who completed MSPE showed significant improvements in state mindfulness and flow experiences.

Central to MSPE is the concept of non-judgmental awareness during performance. Athletes learn to observe performance errors without the secondary suffering of self-criticism. When a basketball player misses a shot, the mindful response is to notice the miss, register any emotional reaction, and return attention to the present play — rather than spiraling into self-recrimination that degrades subsequent performance.

Research by Thompson, Kaufman, De Petrillo, Glass, and Arnkoff (2011) showed that archers and golfers who completed MSPE demonstrated improvements in sport-specific measures of performance. The program's emphasis on present-moment focus directly targets the tendency of athletes to become preoccupied with past mistakes or future outcomes during competition.

A practical MSPE-inspired exercise for pre-training: spend 3 minutes in seated awareness, then during warm-up, deliberately notice five physical sensations (feet on ground, air temperature, heart rate, muscle tension, breathing rhythm). This transitions the athlete from "doing mode" to "being mode" before shifting into performance.`,
    source: 'Kaufman, Glass & Pineau (2009); Thompson et al. (2011)',
    category: 'MINDFULNESS',
    tags: ['MSPE', 'mindfulness', 'meditation', 'present-moment', 'non-judgmental'],
  },

  // 3. Pre-Performance Routines
  {
    title: 'Pre-Performance Routines: Singer and Cotterill Models',
    content: `Pre-performance routines (PPRs) are structured sequences of thoughts and actions that athletes execute before performing a skill. Research consistently shows that PPRs improve consistency, reduce anxiety, and enhance focus. Two influential models come from Robert Singer and Stewart Cotterill.

Singer's Five-Step Approach (2002) provides a systematic framework: (1) Readying — physically and mentally preparing, adopting an optimal stance; (2) Imaging — briefly visualizing successful execution; (3) Focusing — narrowing attention to a relevant external cue; (4) Executing — performing with trust, allowing the skill to happen automatically; (5) Evaluating — briefly assessing the outcome before resetting. This model is particularly effective for self-paced skills like free throws, serves, and penalty kicks.

Cotterill's (2010) research emphasized that effective PPRs share common characteristics: they are individualized (not one-size-fits-all), consistent in duration, focused on process rather than outcome, and practiced extensively until automatic. Cotterill found that elite performers had more consistent routine durations than non-elite performers, suggesting that temporal consistency is itself a marker of expertise.

The mechanism behind PPRs involves attentional control and anxiety management. By focusing on a routine, the athlete occupies working memory with task-relevant cues rather than worrying about outcomes. Lonsdale and Tam (2008) demonstrated that basketball free throw routines incorporating behavioral and cognitive elements outperformed routines with behavioral elements alone.

Building an effective PPR: (1) Identify the skill (e.g., penalty kick). (2) List 3-5 behavioral steps (ball placement, steps back, breath). (3) Add 1-2 cognitive steps (cue word, brief image). (4) Practice the full sequence 50+ times before using in competition. (5) Time the routine to establish consistent duration. (6) Trust the routine under pressure — do not add or skip steps.`,
    source: 'Singer (2002); Cotterill (2010); Lonsdale & Tam (2008)',
    category: 'FOCUS',
    tags: ['pre-performance-routine', 'concentration', 'self-paced-skills', 'ritual'],
  },

  // 4. PETTLEP Imagery Model
  {
    title: 'PETTLEP Imagery Model',
    content: `The PETTLEP model, developed by Holmes and Collins (2001), revolutionized how sport psychologists design imagery interventions. PETTLEP is an acronym for seven elements that make mental imagery functionally equivalent to physical performance: Physical, Environment, Task, Timing, Learning, Emotion, and Perspective.

Physical: Imagery should incorporate the physical sensations of performing — muscle tension, heart rate, breathing, proprioceptive feedback. Athletes should adopt the physical position associated with the skill (e.g., holding a golf club while imaging a swing). Holmes and Collins argued that this activates similar neural pathways as actual performance, a principle supported by neuroimaging research showing overlapping brain activation during imagery and execution.

Environment: Image in the actual performance environment when possible, or use photos, videos, or sounds from the competition venue. This strengthens the environmental cues that trigger automatic skill execution. Task and Timing: The imaged task should match current skill level (not an idealized version), and the temporal duration of the imagery should approximate real-time execution. Slowing imagery down is useful for learning, but competition preparation should use real-time speed.

Learning: Imagery content should evolve as the athlete's skill develops. A beginner might image basic technique, while an expert images tactical decisions or emotional regulation. Emotion: Include the emotional experience — the butterflies before competition, the surge of confidence after a great play, the calm focus during execution. Wright, Wakefield, and Smith (2014) found that emotionally vivid imagery produced greater physiological responses and stronger performance effects.

Perspective: Use the perspective (internal first-person or external third-person) that feels most natural and effective for the specific skill. Research suggests internal perspective is better for tasks requiring timing and feel, while external perspective may benefit form-dependent sports. A practical PETTLEP script: "Stand in your position on the field. Feel the ground under your cleats, the weight of the ball. Hear the crowd, smell the grass. See the play develop in real time. Feel the confidence rising in your chest. Execute with full commitment."`,
    source: 'Holmes & Collins (2001); Wright, Wakefield & Smith (2014)',
    category: 'VISUALIZATION',
    tags: ['PETTLEP', 'imagery', 'mental-rehearsal', 'visualization', 'neural-pathways'],
  },

  // 5. Self-Talk Strategies
  {
    title: 'Self-Talk Strategies: Instructional vs. Motivational',
    content: `Self-talk — the internal dialogue athletes maintain during training and competition — is one of the most researched and practically applicable mental skills in sport psychology. Antonis Hatzigeorgiadis and colleagues have produced extensive research demonstrating that strategic self-talk improves performance across multiple sports and skill types.

Two primary categories exist: instructional self-talk and motivational self-talk. Instructional self-talk involves technical cue words or phrases that direct attention to skill execution ("follow through," "eyes on ball," "quick feet"). Motivational self-talk involves phrases that enhance effort, confidence, or emotional regulation ("I've got this," "push through," "stay strong"). Hatzigeorgiadis et al. (2011) conducted a meta-analysis showing both types improve performance, but instructional self-talk is more effective for fine motor skills requiring precision, while motivational self-talk better serves gross motor tasks requiring strength and endurance.

The content of self-talk matters less than three key properties: brevity (1-3 words optimal), consistency (same cue for same situation), and personal meaning (athlete-generated cues outperform prescribed ones). Tod, Hardy, and Oliver (2011) found that athletes who developed their own cue words showed stronger performance effects than those using researcher-assigned phrases.

Negative self-talk management is equally important. Rather than trying to eliminate negative thoughts (which often backfires via ironic process theory — Wegner, 1994), athletes benefit from thought replacement strategies. When "I always choke under pressure" arises, the athlete recognizes it, then redirects to a prepared cue: "Trust my training." Hardy, Oliver, and Tod (2009) demonstrated that this replacement approach was more effective than thought suppression.

Building a self-talk plan: (1) Identify 3-5 critical moments in competition (e.g., pre-serve, after an error, final minutes). (2) For each moment, create one instructional cue and one motivational cue. (3) Practice cues during training until automatic. (4) Review and refine cues every 4-6 weeks based on what resonates.`,
    source: 'Hatzigeorgiadis et al. (2011); Tod, Hardy & Oliver (2011); Hardy et al. (2009)',
    category: 'SELF_TALK',
    tags: ['self-talk', 'cue-words', 'instructional', 'motivational', 'thought-replacement'],
  },

  // 6. Arousal Regulation
  {
    title: 'Arousal Regulation: Centering, Relaxation, and Energizing',
    content: `Arousal regulation — the ability to find and maintain an optimal activation level — is fundamental to athletic performance. Yerkes and Dodson's (1908) inverted-U hypothesis established that performance peaks at moderate arousal, though Hanin's (1997) Individual Zones of Optimal Functioning (IZOF) model refined this by showing each athlete has a unique optimal arousal range.

Centering, developed by Robert Nideffer (1976) and adapted for sport by Ken Ravizza, is a rapid arousal-reduction technique completed in 15-30 seconds. The steps: (1) Pick a focal point below eye level. (2) Take a deep, slow breath from the diaphragm. (3) Scan the body and consciously release muscle tension on the exhale. (4) Attach a cue word to the exhale ("calm," "ready," "smooth"). (5) Direct attention to the task at hand. Centering is particularly valuable between plays, during timeouts, or before self-paced skills.

Progressive Muscle Relaxation (PMR), originally developed by Jacobson (1938) and adapted for sport by Bernstein and Borkovec (1973), involves systematically tensing and releasing muscle groups. The full version takes 20-30 minutes and is best used during recovery or pre-sleep. A sport-adapted quick version targets 4 muscle groups (hands/arms, face/neck, torso, legs) in 5 minutes. PMR teaches athletes to recognize the difference between tension and relaxation — a kinesthetic awareness that enables faster self-regulation during competition.

Energizing techniques are equally important but often neglected. Athletes who are under-aroused (flat, lethargic, unfocused) need activation strategies: dynamic warm-up movements, upbeat music, power postures, energizing self-talk ("Let's go!", "Bring the energy!"), and rapid breathing techniques. Tenenbaum, Edmonds, and Eccles (2008) emphasized that arousal regulation is bidirectional — elite performers need to both calm down and pump up depending on the situation.

Practical arousal profiling: have the athlete rate their arousal (1-10) after their best and worst performances to identify their personal optimal zone. Then build a toolkit of calming techniques (centering, breathing, PMR) and activating techniques (music, movement, self-talk) to adjust toward that zone pre-competition.`,
    source: 'Hanin (1997); Nideffer (1976); Ravizza (2006); Tenenbaum et al. (2008)',
    category: 'STRESS_MANAGEMENT',
    tags: ['arousal-regulation', 'centering', 'PMR', 'relaxation', 'energizing', 'IZOF'],
  },

  // 7. Confidence Building
  {
    title: 'Sport Confidence: Vealey and Bandura Models',
    content: `Sport confidence — the belief in one's ability to perform successfully — is consistently identified as one of the most important psychological determinants of athletic performance. Two foundational models guide intervention: Robin Vealey's Sport Confidence Model and Albert Bandura's Self-Efficacy Theory.

Vealey's (2001) revised model identifies nine sources of sport confidence organized into three domains: Achievement (mastery, demonstration of ability), Self-Regulation (physical/mental preparation, physical self-presentation), and Social Climate (social support, coach leadership, vicarious experience, environmental comfort). Vealey's research showed that the most robust source across all athletes is mastery — the experience of improving and executing skills successfully. This means confidence-building programs should prioritize creating genuine mastery experiences rather than empty affirmations.

Bandura's (1997) Self-Efficacy Theory identifies four sources, ranked by potency: (1) Performance accomplishments (strongest — "I did it before, I can do it again"), (2) Vicarious experience ("Someone like me did it, so I can too"), (3) Verbal persuasion ("My coach believes I can"), and (4) Physiological/emotional states ("I feel ready and energized"). The practical implication is clear: the single most effective confidence intervention is designing training so athletes repeatedly experience success.

Confidence profiling is a practical tool from Butler and Hardy (1992). Athletes rate their confidence (0-10) across sport-specific attributes (e.g., speed, tactical awareness, pressure handling, fitness). Low-rated areas become targets for specific training interventions, creating a virtuous cycle: targeted work → improvement → higher confidence → better performance.

Strategies for building confidence: (1) Performance review journals — log three things done well after each training/competition. (2) Highlight reels — compile video of personal best moments for pre-competition viewing. (3) Mastery-oriented goal setting — set process goals that are controllable and achievable. (4) Simulation training — practice under competition-like pressure to build "been there" confidence. (5) Self-talk anchoring — pair confident self-talk with recalled peak performance feelings.`,
    source: 'Vealey (2001); Bandura (1997); Butler & Hardy (1992)',
    category: 'CONFIDENCE',
    tags: ['confidence', 'self-efficacy', 'mastery', 'Vealey', 'Bandura'],
  },

  // 8. Goal Setting
  {
    title: 'Goal Setting: Process, Performance, and Outcome Hierarchy',
    content: `Goal setting is among the most well-established psychological techniques in sport, with meta-analyses consistently showing moderate-to-large effects on performance (Kyllo & Landers, 1995). The critical distinction in sport psychology is the three-level hierarchy: outcome goals, performance goals, and process goals.

Outcome goals focus on competitive results relative to others (e.g., "Win the conference championship," "Make the starting lineup"). While motivating, outcome goals are partially outside the athlete's control — an athlete can perform their best and still lose. Over-reliance on outcome goals increases anxiety and decreases intrinsic motivation.

Performance goals are self-referenced standards independent of others (e.g., "Run a sub-5:00 mile," "Hit 80% of free throws"). These are more controllable and provide clear feedback on improvement. Research by Kingston and Hardy (1997) showed that performance goals led to better self-regulation and more stable confidence than outcome goals.

Process goals focus on the specific actions and techniques during execution (e.g., "Keep my elbow high on the follow-through," "Maintain breathing rhythm in the third quarter"). Process goals are fully controllable, promote present-moment focus, and are most effective during competition. Burton, Naylor, and Holliday (2001) found that a combination of all three goal types — with emphasis on process goals during competition — produced the best performance outcomes.

The goal-setting system should follow the SMARTS+ framework: Specific, Measurable, Action-oriented, Realistic, Time-bound, Self-determined, and written down (+ publicly committed to a coach or teammate). Weinberg (2010) emphasized that goals must be regularly reviewed and adjusted — static goals lose motivational power.

Implementing the hierarchy: (1) Set 1-2 season-long outcome goals for direction. (2) Break these into monthly performance goals for benchmarks. (3) Identify 3-5 weekly process goals that drive the performance targets. (4) Review process goals daily, performance goals weekly, outcome goals monthly. (5) Celebrate process goal achievement to reinforce controllable effort.`,
    source: 'Kyllo & Landers (1995); Kingston & Hardy (1997); Burton et al. (2001); Weinberg (2010)',
    category: 'GOAL_SETTING',
    tags: ['goal-setting', 'process-goals', 'performance-goals', 'outcome-goals', 'SMARTS'],
  },

  // 9. Flow State
  {
    title: 'Flow State in Sport: Csikszentmihalyi and Challenge-Skill Balance',
    content: `Flow — the state of complete absorption and effortless performance — was first described by Mihaly Csikszentmihalyi (1990) and has become a central concept in sport psychology. Athletes describe flow as "being in the zone," where action and awareness merge, self-consciousness disappears, and performance feels automatic and optimal.

Csikszentmihalyi identified nine dimensions of flow: challenge-skill balance, merging of action and awareness, clear goals, unambiguous feedback, concentration on the task, sense of control, loss of self-consciousness, transformation of time, and autotelic experience (the activity becomes intrinsically rewarding). Jackson and Csikszentmihalyi (1999) applied these specifically to sport, finding that athletes most frequently cited challenge-skill balance, concentration, and sense of control as gateway dimensions.

The challenge-skill balance is the most actionable dimension for practitioners. Flow occurs when perceived challenge and perceived skill are both high and roughly matched. When challenge exceeds skill, athletes experience anxiety; when skill exceeds challenge, they experience boredom. Practical implication: training should be designed to consistently operate in the "stretch zone" — challenging enough to demand full engagement, but not so challenging as to overwhelm.

Swann, Keegan, Piggott, and Crust (2012) distinguished between flow states (which occur spontaneously) and flow-like states (which can be cultivated). Their research identified several controllable antecedents: optimal preparation, pre-competitive plans, present-moment focus, optimal arousal, confidence, and positive feedback. Importantly, trying too hard to achieve flow paradoxically prevents it — flow emerges from conditions, not force.

Flow-promoting strategies: (1) Pre-performance routines that establish optimal arousal and focus. (2) Process goal focus during competition (clear, immediate objectives). (3) Training in varied conditions to build confidence across situations. (4) Mindfulness practice to strengthen present-moment attention. (5) Post-performance reflection on "flow moments" to understand personal triggers. (6) Remove controllable distractors (phone, social media) before competition.`,
    source: 'Csikszentmihalyi (1990); Jackson & Csikszentmihalyi (1999); Swann et al. (2012)',
    category: 'FLOW_STATE',
    tags: ['flow', 'zone', 'challenge-skill-balance', 'optimal-performance', 'absorption'],
  },

  // 10. Sleep Hygiene for Athletes
  {
    title: 'Sleep Hygiene and Optimization for Athletes',
    content: `Sleep is the single most important recovery behavior for athletes, yet it is frequently compromised by travel schedules, academic demands, pre-competition anxiety, and poor sleep habits. Research by Mah, Mah, Kezirian, and Dement (2011) demonstrated that Stanford basketball players who extended sleep to 10 hours showed significant improvements in sprint times, shooting accuracy, reaction time, and self-reported well-being.

The National Sleep Foundation recommends 7-9 hours for adults, but athletes likely need 8-10 hours to support recovery, memory consolidation (including motor skill learning), hormone regulation (growth hormone is released primarily during deep sleep), and immune function. Halson (2014) noted that athletes are at particular risk for sleep disturbance due to evening competitions, travel across time zones, and high training loads that paradoxically increase physiological arousal.

Evidence-based sleep hygiene strategies for athletes: (1) Consistent sleep-wake schedule — go to bed and wake at the same time daily, even on weekends. (2) Cool, dark environment — 65-68°F, blackout curtains, no LED lights. (3) Screen curfew — no phones/tablets 60 minutes before bed (blue light suppresses melatonin). (4) Caffeine cutoff — no caffeine after 2 PM (half-life of 5-6 hours). (5) Post-training wind-down — contrast showers or warm baths 90 minutes before bed to trigger the temperature drop that initiates sleep onset.

Pre-competition sleep is particularly important and particularly vulnerable. Erlacher, Ehrlenspiel, Adegbesan, and El-Din (2011) found that 65% of athletes reported poor sleep the night before competition, primarily due to anxiety and rumination. Strategies: prepare a "worry journal" (write concerns before bed to externalize them), practice progressive muscle relaxation, use slow breathing (4-7-8 technique), and establish a calming bedtime routine that signals safety to the nervous system.

Napping can supplement insufficient nighttime sleep. Waterhouse, Atkinson, Edwards, and Reilly (2007) found that 20-30 minute naps improved sprint performance and alertness. Time naps before 3 PM to avoid disrupting nighttime sleep. A "caffeine nap" — drinking coffee immediately before a 20-minute nap — leverages the 20-minute caffeine absorption delay for maximal post-nap alertness.`,
    source: 'Mah et al. (2011); Halson (2014); Erlacher et al. (2011); Waterhouse et al. (2007)',
    category: 'RECOVERY',
    tags: ['sleep', 'recovery', 'sleep-hygiene', 'napping', 'circadian'],
  },

  // 11. Injury Rehabilitation Psychology
  {
    title: 'Psychology of Injury Rehabilitation',
    content: `Athletic injury affects far more than the body. The psychological response to injury is well-documented and follows patterns similar to grief reactions. Kubler-Ross's (1969) stage model — denial, anger, bargaining, depression, acceptance — has been adapted for sport injury, though researchers emphasize that athletes do not progress linearly through stages and may experience multiple emotions simultaneously.

Wiese-Bjornstal, Smith, Shaffer, and Morrey (1998) proposed the Integrated Model of Psychological Response to Sport Injury, which accounts for personal factors (injury history, personality, coping resources), situational factors (sport type, scholarship status, social support), and cognitive appraisals that together determine the emotional and behavioral response. Athletes who appraise injury as a challenge rather than a threat show faster rehabilitation adherence and return-to-sport outcomes.

Identity disruption is a core psychological challenge. For many collegiate athletes, athletic identity constitutes a dominant part of self-concept. Brewer, Van Raalte, and Linder (1993) found that athletes with high athletic identity exclusivity experienced greater depression and anxiety following injury, particularly career-threatening injuries. Intervention should help athletes explore and strengthen non-sport identities (student, friend, mentor) during rehabilitation.

Goal setting during rehabilitation is critical but must be adapted. Injured athletes should set rehabilitation-specific process goals (daily PT exercises, range of motion targets) alongside modified training goals (what they can still do). Evans and Hardy (2002) found that goal setting during rehabilitation improved both adherence to treatment protocols and emotional coping.

Mental skills during rehabilitation: (1) Imagery — visualize the healing process, rehearse sport skills mentally to maintain neural pathways, and image successful return to play. (2) Positive self-talk — combat catastrophizing ("My career is over") with evidence-based reframing ("Many athletes return stronger"). (3) Social support — maintain team connection through attendance at practices and games. (4) Relaxation — manage pain and anxiety with breathing techniques and progressive relaxation. (5) Journaling — track emotional responses, progress milestones, and gratitude to maintain perspective.`,
    source: 'Wiese-Bjornstal et al. (1998); Brewer et al. (1993); Evans & Hardy (2002)',
    category: 'RECOVERY',
    tags: ['injury', 'rehabilitation', 'grief', 'identity', 'return-to-sport'],
  },

  // 12. Team Cohesion
  {
    title: 'Team Cohesion: Carron Conceptual Model',
    content: `Team cohesion — the tendency for a group to stick together and remain united in pursuit of goals — is one of the strongest predictors of team performance in sport. Albert Carron's (1982) Conceptual Model of Group Cohesion remains the dominant framework, distinguishing between task cohesion (united around performance objectives) and social cohesion (interpersonal bonds and friendship).

Carron, Brawley, and Widmeyer (1998) further refined the model into four dimensions measured by the Group Environment Questionnaire (GEQ): Individual Attractions to Group-Task (ATG-T), Individual Attractions to Group-Social (ATG-S), Group Integration-Task (GI-T), and Group Integration-Social (GI-S). Research consistently shows that task cohesion is a stronger predictor of performance than social cohesion, though both matter. Teams can perform well without being close friends, but rarely perform well without shared commitment to goals.

Carron and Spink (1993) developed a team-building intervention model targeting four categories: (1) Team Structure — roles, norms, leadership. (2) Team Environment — distinctiveness (team rituals, traditions), togetherness (shared experiences). (3) Team Processes — goals, communication, cooperation, sacrifice. (4) Individual Factors — member satisfaction, attraction to group.

Practical team-building strategies from the literature: (1) Collaborative goal setting — have the team collectively set seasonal goals, generating ownership and shared purpose. (2) Role clarity — explicitly discuss and agree on each member's role, reducing ambiguity and conflict. (3) Team rituals — pre-game routines, post-practice huddles, and traditions that create distinctiveness. (4) Communication norms — establish expectations for constructive feedback, conflict resolution, and support.

Eys, Loughead, Bray, and Carron (2009) found that role ambiguity was a significant negative predictor of cohesion. Athletes who were unclear about their responsibilities experienced lower satisfaction and weaker group bonds. Coach communication is critical: regularly clarify expectations, provide rationale for decisions, and create space for athlete voice. Social events outside sport (team dinners, community service, shared experiences) strengthen social cohesion without performance pressure.`,
    source: 'Carron (1982); Carron, Brawley & Widmeyer (1998); Carron & Spink (1993); Eys et al. (2009)',
    category: 'TEAM_DYNAMICS',
    tags: ['team-cohesion', 'Carron', 'task-cohesion', 'social-cohesion', 'team-building'],
  },
];

/**
 * Returns the array of seed documents for knowledge base ingestion.
 */
export function getSeedDocuments(): SeedDocument[] {
  return SEED_DOCUMENTS;
}
