# Phase 5: Advanced Features Implementation Plan

**Target**: 3-4 weeks
**Priority**: Voice (1 week) → Assignments (1.5 weeks) → Chat Summaries (1 week)

---

## Feature 1: Cartesia Voice Integration (STT + TTS)

### Goal
Replace current voice system with **Cartesia for both directions**:
- **STT (Speech-to-Text)**: Cartesia Sonic for athlete voice input
- **TTS (Text-to-Speech)**: Cartesia for AI voice output
- **Fallback**: Keep OpenAI Whisper (STT) + OpenAI TTS as backup

### Architecture

```
Athlete speaks → Cartesia Sonic STT → Text → OpenAI GPT-4 → Text → Cartesia TTS → Audio
                      ↓ fallback                                      ↓ fallback
                 OpenAI Whisper                                   OpenAI TTS
```

### Implementation Steps

#### 1.1: Cartesia STT Integration (Speech-to-Text)

**File**: `/src/lib/cartesia-stt.ts` (NEW)

```typescript
import { CartesiaSonicClient } from '@cartesia/sonic-client';

export class CartesiaSTT {
  private client: CartesiaSonicClient;

  constructor() {
    this.client = new CartesiaSonicClient({
      apiKey: process.env.CARTESIA_API_KEY!,
    });
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const result = await this.client.transcribe({
        audio: uint8Array,
        language: 'en',
        model: 'sonic-english-latest',
      });

      return result.text;
    } catch (error) {
      console.error('Cartesia STT failed:', error);
      throw error;
    }
  }

  async transcribeStream(stream: MediaStream): Promise<AsyncGenerator<string>> {
    // Real-time streaming transcription
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    return this.client.transcribeStream({
      stream,
      language: 'en',
      onPartialTranscript: (text) => {
        // Yield partial transcripts for real-time display
      },
    });
  }
}
```

**File**: `/src/app/api/voice/cartesia-stt/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CartesiaSTT } from '@/lib/cartesia-stt';
import { OpenAI } from 'openai'; // Fallback

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

    // Try Cartesia first
    try {
      const cartesiaStt = new CartesiaSTT();
      const transcription = await cartesiaStt.transcribe(audioBlob);

      return NextResponse.json({
        text: transcription,
        provider: 'cartesia',
      });
    } catch (cartesiaError) {
      console.warn('Cartesia STT failed, falling back to OpenAI Whisper:', cartesiaError);

      // Fallback to OpenAI Whisper
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });

      return NextResponse.json({
        text: transcription.text,
        provider: 'openai-whisper-fallback',
      });
    }
  } catch (error) {
    console.error('Voice transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

#### 1.2: Cartesia TTS Integration (Text-to-Speech)

**File**: `/src/lib/cartesia-tts.ts` (NEW)

```typescript
import Cartesia from '@cartesia/cartesia-js';

export class CartesiaTTS {
  private client: Cartesia.Client;
  private websocket: Cartesia.WebSocket | null = null;

  constructor() {
    this.client = new Cartesia.Client({
      apiKey: process.env.NEXT_PUBLIC_CARTESIA_API_KEY!,
    });
  }

  async initialize() {
    this.websocket = await this.client.tts.websocket({
      container: 'raw',
      encoding: 'pcm_f32le',
      sampleRate: 44100,
    });
  }

  async synthesize(text: string, voiceId: string = 'default-coach-voice'): Promise<ArrayBuffer> {
    if (!this.websocket) {
      await this.initialize();
    }

    const response = await this.websocket!.send({
      model_id: 'sonic-english',
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId,
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_f32le',
        sample_rate: 44100,
      },
    });

    const audioChunks: Uint8Array[] = [];

    for await (const chunk of response.events('chunk')) {
      audioChunks.push(chunk.data);
    }

    // Concatenate all chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of audioChunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    return audioBuffer.buffer;
  }

  async *synthesizeStream(text: string, voiceId: string = 'default-coach-voice'): AsyncGenerator<Uint8Array> {
    if (!this.websocket) {
      await this.initialize();
    }

    const response = await this.websocket!.send({
      model_id: 'sonic-english',
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId,
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_f32le',
        sample_rate: 44100,
      },
    });

    for await (const chunk of response.events('chunk')) {
      yield chunk.data;
    }
  }

  close() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}
```

**File**: `/src/app/api/voice/cartesia-tts/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CartesiaTTS } from '@/lib/cartesia-tts';
import { OpenAI } from 'openai'; // Fallback

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Try Cartesia first
    try {
      const cartesiaTts = new CartesiaTTS();
      await cartesiaTts.initialize();

      const audioBuffer = await cartesiaTts.synthesize(text, voiceId);
      cartesiaTts.close();

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'X-Provider': 'cartesia',
        },
      });
    } catch (cartesiaError) {
      console.warn('Cartesia TTS failed, falling back to OpenAI TTS:', cartesiaError);

      // Fallback to OpenAI TTS
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Provider': 'openai-tts-fallback',
        },
      });
    }
  } catch (error) {
    console.error('Voice synthesis error:', error);
    return NextResponse.json(
      { error: 'Synthesis failed' },
      { status: 500 }
    );
  }
}

// Streaming endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const voiceId = searchParams.get('voiceId') || 'default-coach-voice';

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const cartesiaTts = new CartesiaTTS();
        await cartesiaTts.initialize();

        for await (const chunk of cartesiaTts.synthesizeStream(text, voiceId)) {
          controller.enqueue(chunk);
        }

        cartesiaTts.close();
        controller.close();
      } catch (error) {
        console.error('Streaming synthesis error:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'audio/wav',
      'Transfer-Encoding': 'chunked',
      'X-Provider': 'cartesia-stream',
    },
  });
}
```

#### 1.3: Update Voice Chat Component

**File**: `/src/components/chat/VoiceChatButton.tsx` (MODIFY)

```typescript
// Update to use Cartesia endpoints
const handleVoiceInput = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch('/api/voice/cartesia-stt', {
    method: 'POST',
    body: formData,
  });

  const { text, provider } = await response.json();
  console.log(`Transcribed via ${provider}:`, text);

  // Send text to chat
  onSendMessage(text);
};

const handleVoiceOutput = async (text: string) => {
  const response = await fetch('/api/voice/cartesia-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: 'warm-coach-voice' }),
  });

  const audioBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);

  const audio = new Audio(audioUrl);
  audio.play();
};
```

#### 1.4: Environment Variables

**File**: `.env.local` (ADD)

```bash
# Cartesia API Keys
CARTESIA_API_KEY=your_cartesia_api_key_here
NEXT_PUBLIC_CARTESIA_API_KEY=your_cartesia_api_key_here

# OpenAI (Fallback)
OPENAI_API_KEY=existing_key
```

---

## Feature 2: Assignment System

### Goal
Coaches can assign weekly mental performance exercises/tasks to athletes. Athletes complete assignments in the app with progress tracking.

### Database Schema

**File**: `prisma/schema.prisma` (MODIFY)

```prisma
model Assignment {
  id            String   @id @default(cuid())
  title         String
  description   String   @db.Text
  instructions  String   @db.Text

  // Assignment metadata
  type          AssignmentType  // REFLECTION, EXERCISE, VIDEO_WATCH, READING, JOURNALING
  category      String          // Pre-competition, Post-competition, Daily Practice, etc.
  difficulty    String          // Easy, Medium, Hard
  estimatedTime Int             // Minutes to complete

  // Resources
  resources     Json?           // Links, videos, PDFs, etc.

  // Assignment by coach
  coachId       String
  coach         User            @relation("CoachAssignments", fields: [coachId], references: [id])

  // Assignment scope
  schoolId      String?         // Null = all schools, non-null = specific school
  school        School?         @relation(fields: [schoolId], references: [id])
  sportFilter   String?         // Null = all sports, non-null = specific sport
  yearFilter    String?         // Null = all years, non-null = specific year

  // Dates
  assignedDate  DateTime        @default(now())
  dueDate       DateTime

  // Submissions
  submissions   AssignmentSubmission[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([coachId, assignedDate])
  @@index([schoolId, sportFilter])
}

enum AssignmentType {
  REFLECTION      // Written reflection questions
  EXERCISE        // Guided mental exercise (breathing, visualization)
  VIDEO_WATCH     // Watch educational video + quiz
  READING         // Read article/chapter + summary
  JOURNALING      // Free-form journaling prompt
  GOAL_SETTING    // Create/update goals
  MINDFULNESS     // Meditation/mindfulness practice
}

model AssignmentSubmission {
  id            String   @id @default(cuid())

  assignmentId  String
  assignment    Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  athleteId     String
  athlete       Athlete    @relation(fields: [athleteId], references: [userId])

  // Submission data
  status        SubmissionStatus  @default(NOT_STARTED)
  response      Json              // Athlete's answers, notes, etc.
  timeSpent     Int?              // Minutes spent

  // Grading/feedback (optional)
  coachFeedback String?           @db.Text
  coachRating   Int?              // 1-5 stars

  // Timestamps
  startedAt     DateTime?
  submittedAt   DateTime?
  reviewedAt    DateTime?

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@unique([assignmentId, athleteId])
  @@index([athleteId, status])
  @@index([assignmentId, submittedAt])
}

enum SubmissionStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  REVIEWED
}

// Update Athlete model
model Athlete {
  // ... existing fields ...
  assignmentSubmissions AssignmentSubmission[]
}

// Update User model (for coach)
model User {
  // ... existing fields ...
  assignmentsCreated Assignment[] @relation("CoachAssignments")
}

// Update School model
model School {
  // ... existing fields ...
  assignments Assignment[]
}
```

### Coach Assignment Creation UI

**File**: `/src/app/coach/assignments/create/page.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ASSIGNMENT_TYPES = [
  { value: 'REFLECTION', label: 'Written Reflection', icon: '✍️' },
  { value: 'EXERCISE', label: 'Mental Exercise', icon: '🧘' },
  { value: 'VIDEO_WATCH', label: 'Video + Quiz', icon: '🎥' },
  { value: 'READING', label: 'Reading Assignment', icon: '📚' },
  { value: 'JOURNALING', label: 'Journaling Prompt', icon: '📓' },
  { value: 'GOAL_SETTING', label: 'Goal Setting', icon: '🎯' },
  { value: 'MINDFULNESS', label: 'Mindfulness Practice', icon: '🧠' },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'REFLECTION',
    category: '',
    difficulty: 'Medium',
    estimatedTime: 30,
    dueDate: '',
    sportFilter: '',
    yearFilter: '',
    resources: [] as any[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/coach/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      router.push('/coach/assignments');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Assignment</h1>
        <p className="text-muted-foreground mt-2">
          Design a mental performance assignment for your athletes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ASSIGNMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Pre-Game Visualization Exercise"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of what this assignment covers..."
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instructions</label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Step-by-step instructions for completing this assignment..."
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Pre-Competition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
                <Input
                  type="number"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                  min={5}
                  max={180}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card>
          <CardHeader>
            <CardTitle>Target Athletes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sport Filter (optional)</label>
                <Select
                  value={formData.sportFilter}
                  onValueChange={(value) => setFormData({ ...formData, sportFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sports</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Baseball">Baseball</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Year Filter (optional)</label>
                <Select
                  value={formData.yearFilter}
                  onValueChange={(value) => setFormData({ ...formData, yearFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    <SelectItem value="Freshman">Freshman</SelectItem>
                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">
            Create Assignment
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### Athlete Assignment Dashboard

**File**: `/src/app/assignments/page.tsx` (NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    const response = await fetch('/api/athlete/assignments');
    const data = await response.json();
    setAssignments(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED': return 'bg-green-100 text-green-800';
      case 'REVIEWED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return a.submission.status !== 'SUBMITTED' && a.submission.status !== 'REVIEWED';
    if (filter === 'completed') return a.submission.status === 'SUBMITTED' || a.submission.status === 'REVIEWED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground mt-2">
          Complete weekly mental performance exercises assigned by your coach
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Assigned</p>
                <p className="text-3xl font-bold">{assignments.length}</p>
              </div>
              <Target className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-3xl font-bold">
                  {assignments.filter(a => a.submission.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Clock className="size-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold">
                  {assignments.filter(a => a.submission.status === 'SUBMITTED' || a.submission.status === 'REVIEWED').length}
                </p>
              </div>
              <CheckCircle className="size-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-3xl font-bold">
                  {assignments.length > 0
                    ? Math.round((assignments.filter(a => a.submission.status === 'SUBMITTED' || a.submission.status === 'REVIEWED').length / assignments.length) * 100)
                    : 0}%
                </p>
              </div>
              <Calendar className="size-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({assignments.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({assignments.filter(a => a.submission.status !== 'SUBMITTED' && a.submission.status !== 'REVIEWED').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed ({assignments.filter(a => a.submission.status === 'SUBMITTED' || a.submission.status === 'REVIEWED').length})
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((item) => (
          <Card key={item.assignment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(item.assignment.type)}</span>
                    <h3 className="text-xl font-semibold">{item.assignment.title}</h3>
                    <Badge className={getStatusColor(item.submission.status)}>
                      {item.submission.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {item.assignment.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>Due: {new Date(item.assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-4" />
                      <span>{item.assignment.estimatedTime} min</span>
                    </div>
                    <div className={`font-medium ${getDifficultyColor(item.assignment.difficulty)}`}>
                      {item.assignment.difficulty}
                    </div>
                    {item.submission.coachRating && (
                      <div className="flex items-center gap-1">
                        <span>Rating:</span>
                        <span className="font-semibold">{'⭐'.repeat(item.submission.coachRating)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link href={`/assignments/${item.assignment.id}`}>
                  <Button>
                    {item.submission.status === 'NOT_STARTED' ? 'Start' :
                     item.submission.status === 'IN_PROGRESS' ? 'Continue' :
                     'View'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAssignments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No assignments found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    REFLECTION: '✍️',
    EXERCISE: '🧘',
    VIDEO_WATCH: '🎥',
    READING: '📚',
    JOURNALING: '📓',
    GOAL_SETTING: '🎯',
    MINDFULNESS: '🧠',
  };
  return icons[type] || '📋';
}
```

---

## Feature 3: Chat Summaries with Athlete Consent

### Goal
After each chat session, generate AI summary and send to coach **only if athlete consents**. Athlete can review summary before sharing.

### Database Schema Updates

**File**: `prisma/schema.prisma` (MODIFY)

```prisma
model Athlete {
  // ... existing fields ...

  // Consent management
  consentCoachViewSummaries Boolean @default(false)
  consentLastUpdated        DateTime?
}

model ChatSession {
  // ... existing fields ...

  // Session summary
  summary               String?   @db.Text
  summaryGeneratedAt    DateTime?
  summarySharedWithCoach Boolean  @default(false)
  summaryReviewedByAthlete Boolean @default(false)
}

model SessionSummary {
  id                String   @id @default(cuid())

  sessionId         String   @unique
  session           ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  // AI-generated summary
  mainTopics        String[] // ["Pre-game anxiety", "Confidence building"]
  sentiment         String   // "positive", "neutral", "concerned"
  keyInsights       String   @db.Text
  aiSummary         String   @db.Text

  // Recommendations
  coachNotes        String?  @db.Text // AI suggestions for coach
  followUpSuggestions String[] // ["Check in before next game", "Review visualization techniques"]

  // Flags
  concernLevel      String   // "none", "minor", "moderate", "high"
  progressIndicators Json    // Mood improvement, engagement, etc.

  // Sharing
  sharedWithCoach   Boolean  @default(false)
  sharedAt          DateTime?
  viewedByCoach     Boolean  @default(false)
  viewedAt          DateTime?

  createdAt         DateTime @default(now())

  @@index([sharedWithCoach, sharedAt])
}

model ChatSession {
  // ... existing fields ...
  summary SessionSummary?
}
```

### Consent Management UI

**File**: `/src/app/settings/privacy/page.tsx` (NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Lock } from 'lucide-react';

export default function PrivacySettingsPage() {
  const { data: session } = useSession();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsentStatus();
  }, []);

  const fetchConsentStatus = async () => {
    const response = await fetch('/api/athlete/consent');
    const data = await response.json();
    setConsent(data.consentCoachViewSummaries);
    setLoading(false);
  };

  const handleConsentChange = async (newConsent: boolean) => {
    setConsent(newConsent);

    await fetch('/api/athlete/consent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentCoachViewSummaries: newConsent }),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Privacy Settings</h1>
        <p className="text-muted-foreground mt-2">
          Control what information is shared with your coach
        </p>
      </div>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="size-6 text-blue-600" />
            <CardTitle>Chat Session Summaries</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Share AI Summaries with Coach</h3>
              <p className="text-sm text-muted-foreground mb-4">
                After each chat session, an AI-generated summary is created to help you track your progress.
                You can choose to share these summaries with your coach to help them better support you.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="size-4 text-green-600" />
                  <span className="font-medium">What's shared:</span>
                </div>
                <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                  <li>• Main topics discussed (e.g., "Pre-game anxiety", "Goal setting")</li>
                  <li>• Overall sentiment (positive, neutral, concerned)</li>
                  <li>• Key insights and progress indicators</li>
                  <li>• Suggested follow-up actions for coach</li>
                </ul>

                <div className="flex items-center gap-2 text-sm mt-3">
                  <Lock className="size-4 text-red-600" />
                  <span className="font-medium">What's NOT shared:</span>
                </div>
                <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                  <li>• Exact message content (full chat transcript)</li>
                  <li>• Personal details you mark as private</li>
                  <li>• Any crisis-related information (handled separately with consent)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="font-medium">Enable Chat Summary Sharing</span>
            <Switch
              checked={consent}
              onCheckedChange={handleConsentChange}
              disabled={loading}
            />
          </div>

          {consent && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Your coach can now view AI summaries of your chat sessions. You can change this anytime.
            </div>
          )}

          {!consent && (
            <div className="text-sm text-gray-600">
              Your chat sessions remain completely private. Only crisis alerts will be shared with your coach for your safety.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Before Sharing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Even with sharing enabled, you can review each summary individually before it's sent to your coach.
            Visit your <Link href="/history" className="text-blue-600 hover:underline">session history</Link> to review and manage summaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Summary Generation After Chat

**File**: `/src/app/api/chat/summarize/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    // Fetch session with messages
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        athlete: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate summary with GPT-4
    const messages = session.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const summaryPrompt = `
You are analyzing a mental performance coaching session between an athlete and an AI coach.
Generate a professional summary for the athlete's coach with the following structure:

1. Main Topics: List 2-4 key topics discussed (brief labels)
2. Sentiment: Overall emotional tone (positive, neutral, concerned)
3. Key Insights: 2-3 sentences summarizing main takeaways
4. Progress Indicators: Note any improvements or concerns mentioned
5. Coach Notes: Suggestions for how the coach can best support this athlete
6. Follow-up Suggestions: 1-3 specific action items for coach

Chat transcript:
${messages.map(m => \`\${m.role.toUpperCase()}: \${m.content}\`).join('\\n')}

Format as JSON with these exact keys:
{
  "mainTopics": ["topic1", "topic2"],
  "sentiment": "positive|neutral|concerned",
  "keyInsights": "2-3 sentence summary",
  "progressIndicators": { "mood": "improving|stable|declining", "engagement": "high|medium|low" },
  "coachNotes": "Suggestions for coach",
  "followUpSuggestions": ["action1", "action2"],
  "concernLevel": "none|minor|moderate|high"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a mental performance analysis assistant.' },
        { role: 'user', content: summaryPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const summaryData = JSON.parse(completion.choices[0].message.content || '{}');

    // Save summary to database
    const sessionSummary = await prisma.sessionSummary.create({
      data: {
        sessionId: session.id,
        mainTopics: summaryData.mainTopics,
        sentiment: summaryData.sentiment,
        keyInsights: summaryData.keyInsights,
        aiSummary: completion.choices[0].message.content || '',
        coachNotes: summaryData.coachNotes,
        followUpSuggestions: summaryData.followUpSuggestions,
        concernLevel: summaryData.concernLevel,
        progressIndicators: summaryData.progressIndicators,
        sharedWithCoach: false, // Not shared until athlete reviews
      },
    });

    // Update session
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        summary: summaryData.keyInsights,
        summaryGeneratedAt: new Date(),
        summaryReviewedByAthlete: false,
      },
    });

    return NextResponse.json({
      summary: sessionSummary,
      message: 'Summary generated successfully',
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
```

### Coach Summary Dashboard

**File**: `/src/app/coach/summaries/page.tsx` (NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function CoachSummariesPage() {
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    const response = await fetch('/api/coach/summaries');
    const data = await response.json();
    setSummaries(data);
  };

  const markAsViewed = async (summaryId: string) => {
    await fetch(`/api/coach/summaries/${summaryId}/viewed`, { method: 'POST' });
    fetchSummaries();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Athlete Session Summaries</h1>
        <p className="text-muted-foreground mt-2">
          Review AI-generated summaries of athlete chat sessions (with consent)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {summaries.map((item) => (
          <Card key={item.id} className={item.viewedByCoach ? '' : 'border-2 border-blue-500'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{item.session.athlete.user.name}</h3>
                    <Badge className={
                      item.concernLevel === 'high' ? 'bg-red-500' :
                      item.concernLevel === 'moderate' ? 'bg-orange-500' :
                      'bg-green-500'
                    }>
                      {item.concernLevel} concern
                    </Badge>
                    {!item.viewedByCoach && <Badge variant="outline">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Session on {new Date(item.session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!item.viewedByCoach && (
                  <Button size="sm" onClick={() => markAsViewed(item.id)}>
                    <Eye className="size-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
              </div>

              {/* Main Topics */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Main Topics:</h4>
                <div className="flex flex-wrap gap-2">
                  {item.mainTopics.map((topic: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Key Insights:</h4>
                <p className="text-sm text-muted-foreground">{item.keyInsights}</p>
              </div>

              {/* Coach Notes */}
              {item.coachNotes && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-blue-900">Recommendations for You:</h4>
                  <p className="text-sm text-blue-800">{item.coachNotes}</p>
                </div>
              )}

              {/* Follow-up Suggestions */}
              {item.followUpSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Suggested Follow-ups:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {item.followUpSuggestions.map((suggestion: string, idx: number) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {summaries.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No summaries available. Summaries appear here when athletes consent to sharing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## Implementation Timeline

### Week 1: Voice (Cartesia STT + TTS)
- **Days 1-2**: Install Cartesia SDK, implement STT integration
- **Days 3-4**: Implement TTS integration, test fallback logic
- **Day 5**: Update voice chat UI, end-to-end testing

### Week 2: Assignment System (Part 1)
- **Days 1-2**: Update Prisma schema, run migrations, seed test data
- **Days 3-4**: Build coach assignment creation UI
- **Day 5**: Build athlete assignment dashboard

### Week 3: Assignment System (Part 2) + Chat Summaries (Part 1)
- **Days 1-2**: Build assignment submission flow (athlete completes assignments)
- **Days 3-4**: Build coach assignment review dashboard
- **Day 5**: Update schema for chat summaries, implement GPT-4 summary generation

### Week 4: Chat Summaries (Part 2) + Testing
- **Days 1-2**: Build athlete consent management UI
- **Days 3-4**: Build coach summary dashboard
- **Day 5**: End-to-end testing, bug fixes, polish

---

## Environment Variables to Add

```bash
# .env.local

# Cartesia Voice API
CARTESIA_API_KEY=your_cartesia_api_key_here
NEXT_PUBLIC_CARTESIA_API_KEY=your_cartesia_api_key_here

# OpenAI (existing, for fallback)
OPENAI_API_KEY=sk-...
```

---

## Success Criteria

### Voice
- [x] Cartesia STT transcribes athlete voice accurately
- [x] Cartesia TTS generates natural-sounding AI responses
- [x] Fallback to OpenAI works when Cartesia fails
- [x] Voice chat latency <2 seconds end-to-end

### Assignments
- [x] Coaches can create 7 types of assignments
- [x] Assignments auto-filter by sport/year
- [x] Athletes see personalized assignment dashboard
- [x] Submission flow supports text, file uploads, timers
- [x] Coaches can review submissions and provide feedback

### Chat Summaries
- [x] GPT-4 generates accurate, actionable summaries
- [x] Athletes can enable/disable sharing anytime
- [x] Athletes can review summaries before sharing
- [x] Coaches only see summaries from consenting athletes
- [x] Coach dashboard shows unread summaries prominently

---

## Next Steps After Reading This Plan

1. **Approve/modify** this plan
2. **Confirm Cartesia API key** is ready
3. **Decide implementation order** (Voice first? Assignments first?)
4. **Begin Phase 5 implementation** systematically

Ready to start when you are!
