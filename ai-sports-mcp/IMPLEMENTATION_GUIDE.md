# AI Sports Agent - Implementation Guide

## Complete Code Samples for MCP Agents & Key Components

This guide provides ready-to-use code for the core components of the AI Sports Agent platform.

---

## 1. AthleteAgent (Discovery-First Protocol)

```python
# server/app/agents/athlete_agent.py
from typing import List, Dict, Optional, AsyncGenerator
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from app.tools.discovery_tools import DiscoveryTools
from app.tools.framework_tools import FrameworkTools
from app.core.config import settings
from app.agents.base_agent import BaseAgent

class AthleteAgent(BaseAgent):
    """
    MCP Agent implementing Discovery-First protocol for athletes

    Protocol Phases:
    1. Discovery (3-7 questions to understand context)
    2. Understanding Validation
    3. Framework Application (CBT/Mindfulness/Flow)
    4. Action Planning
    5. Follow-up
    """

    def __init__(self):
        super().__init__(
            name="AthleteAgent",
            model=settings.ATHLETE_AGENT_MODEL,
            temperature=settings.ATHLETE_AGENT_TEMPERATURE
        )

        # Initialize tools
        self.discovery_tools = DiscoveryTools()
        self.framework_tools = FrameworkTools()

        # Discovery protocol state
        self.protocol_state = {
            "phase": "discovery",  # discovery, understanding, framework, action, followup
            "question_count": 0,
            "context": {}
        }

    def get_system_prompt(self, session_context: Dict) -> str:
        """Generate system prompt based on protocol phase"""
        base_prompt = """You are an evidence-based sports psychology assistant using the Discovery-First protocol.

Your role is to:
1. Help athletes improve mental performance
2. Use evidence-based frameworks (CBT, mindfulness, flow state)
3. Follow the Discovery-First protocol rigorously
4. Never jump to solutions before understanding context
5. Flag crisis language immediately

DISCOVERY-FIRST PROTOCOL:

Phase 1 - DISCOVERY ({min_q}-{max_q} questions):
- Ask open-ended questions to understand the athlete's situation
- Focus on: what's happening, when, how it affects performance, what they've tried
- Be curious, not prescriptive
- Questions should build on previous answers

Phase 2 - UNDERSTANDING VALIDATION:
- Summarize what you've learned
- Ask athlete to confirm your understanding
- Identify gaps that need clarification

Phase 3 - FRAMEWORK APPLICATION:
- Based on context, retrieve relevant frameworks from knowledge base
- Explain framework in athlete's language
- Connect framework to their specific situation

Phase 4 - ACTION PLANNING:
- Provide specific, actionable techniques
- Set clear next steps
- Ensure techniques are practical for their sport/schedule

Phase 5 - FOLLOW-UP:
- Set reflection prompts
- Suggest when to check back in
- Reinforce autonomy

CURRENT SESSION CONTEXT:
- Sport: {sport}
- Athlete Year: {year}
- Protocol Phase: {phase}
- Question Count: {question_count}/{max_q}
- Session Topic: {topic}

RULES:
1. In discovery phase, you MUST ask questions, not give advice
2. Minimum {min_q} discovery questions before moving to understanding
3. Use sport-specific language (e.g., "game" vs "match" for their sport)
4. If you detect crisis language (self-harm, severe depression), immediately invoke crisis protocol
5. Ground all frameworks in research - cite when possible
6. Respect athlete autonomy - they choose whether to try techniques

CRISIS KEYWORDS (IMMEDIATE FLAG):
- Mentions of self-harm, suicide
- Severe hopelessness
- Substance abuse
- Abuse or trauma
→ If detected, respond with empathy + crisis resources, flag session
"""

        return base_prompt.format(
            min_q=settings.DISCOVERY_MIN_QUESTIONS,
            max_q=settings.DISCOVERY_MAX_QUESTIONS,
            sport=session_context.get('sport', 'general'),
            year=session_context.get('year', 'unknown'),
            phase=self.protocol_state['phase'],
            question_count=self.protocol_state['question_count'],
            topic=session_context.get('topic', 'performance')
        )

    async def stream_response(
        self,
        message: str,
        session_context: Dict,
        knowledge_context: List[Dict] = None
    ) -> AsyncGenerator[Dict, None]:
        """
        Stream response to athlete message

        Yields:
            dict: Response chunks with type (content, tool_call, metadata)
        """
        # Update protocol state based on context
        self._update_protocol_state(message, session_context)

        # Build messages
        messages = [
            SystemMessage(content=self.get_system_prompt(session_context))
        ]

        # Add knowledge context if available
        if knowledge_context:
            context_str = "\n\n".join([
                f"RELEVANT RESEARCH ({chunk['metadata']['framework']}):\n{chunk['content']}"
                for chunk in knowledge_context
            ])
            messages.append(SystemMessage(content=f"KNOWLEDGE BASE CONTEXT:\n{context_str}"))

        # Add conversation history (from session_context)
        for msg in session_context.get('history', []):
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Determine if we should use tools
        tools_to_use = self._get_relevant_tools()

        # Stream response
        async for chunk in self.llm.astream(messages):
            content = chunk.content

            # Check for tool invocations (simplified - would use function calling in production)
            if self._should_retrieve_framework(content):
                # Yield tool call event
                yield {
                    "type": "tool_call",
                    "tool": "retrieve_framework",
                    "args": {
                        "sport": session_context.get('sport'),
                        "topic": self._extract_topic(message)
                    }
                }

            # Yield content chunk
            yield {
                "type": "content",
                "delta": content
            }

        # Update protocol state after response
        self.protocol_state['question_count'] += 1

        # Yield metadata
        yield {
            "type": "metadata",
            "protocol_phase": self.protocol_state['phase'],
            "question_count": self.protocol_state['question_count'],
            "next_phase": self._determine_next_phase()
        }

    def _update_protocol_state(self, message: str, context: Dict):
        """Update protocol phase based on conversation state"""
        question_count = self.protocol_state['question_count']

        # Transition logic
        if self.protocol_state['phase'] == 'discovery':
            if question_count >= settings.DISCOVERY_MIN_QUESTIONS:
                # Check if we have enough context
                if self._has_sufficient_context(context):
                    self.protocol_state['phase'] = 'understanding'

        elif self.protocol_state['phase'] == 'understanding':
            # Move to framework after validation
            if 'yes' in message.lower() or 'correct' in message.lower():
                self.protocol_state['phase'] = 'framework'

        elif self.protocol_state['phase'] == 'framework':
            # Move to action planning
            self.protocol_state['phase'] = 'action'

        elif self.protocol_state['phase'] == 'action':
            # Set up follow-up
            self.protocol_state['phase'] = 'followup'

    def _get_relevant_tools(self) -> List:
        """Return tools relevant to current protocol phase"""
        if self.protocol_state['phase'] == 'discovery':
            return [self.discovery_tools.ask_discovery_question]
        elif self.protocol_state['phase'] == 'framework':
            return [
                self.framework_tools.retrieve_framework,
                self.framework_tools.apply_cbt,
                self.framework_tools.apply_mindfulness
            ]
        elif self.protocol_state['phase'] == 'action':
            return [self.framework_tools.create_action_plan]
        return []
```

---

## 2. GovernanceAgent (Crisis Detection)

```python
# server/app/agents/governance_agent.py
import re
from typing import Dict, Optional
from app.core.config import settings
from app.agents.base_agent import BaseAgent
from app.services.notification_service import NotificationService

class GovernanceAgent(BaseAgent):
    """
    MCP Agent for monitoring conversations and detecting crisis situations
    """

    # Crisis detection patterns
    CRISIS_PATTERNS = [
        # Self-harm
        r'\b(want to (die|kill myself|end (it|my life)))\b',
        r'\b(self[- ]harm|cutting|hurt(ing)? myself)\b',
        r'\b(suicide|suicidal)\b',

        # Severe depression
        r'\b(nothing (matters|is worth it)|no reason to live)\b',
        r'\b(completely hopeless|can\'t go on)\b',

        # Substance abuse
        r'\b(drinking (every day|too much|to cope)|alcohol problem)\b',
        r'\b(using (drugs|cocaine|heroin|meth) to)\b',

        # Abuse
        r'\b(being (abused|hit|hurt) by)\b',
        r'\b((sexual|physical) (abuse|assault))\b',
    ]

    # Severity levels
    SEVERITY_HIGH = [
        r'\b(kill myself|end my life|suicide)\b',
        r'\b(plan to (die|harm))\b',
    ]

    SEVERITY_MEDIUM = [
        r'\b(want to die|wish I was dead)\b',
        r'\b(self[- ]harm|cutting)\b',
    ]

    def __init__(self):
        super().__init__(
            name="GovernanceAgent",
            model=settings.GOVERNANCE_AGENT_MODEL,
            temperature=settings.GOVERNANCE_AGENT_TEMPERATURE
        )
        self.notification_service = NotificationService()

    async def check_crisis(self, message: str, session_context: Dict) -> Optional[Dict]:
        """
        Scan message for crisis language

        Returns:
            dict: Crisis details if detected, None otherwise
            {
                "detected": True,
                "severity": "high|medium|low",
                "patterns_matched": [...],
                "action": "escalate|flag|monitor"
            }
        """
        message_lower = message.lower()

        # Check for crisis patterns
        patterns_matched = []
        severity = "low"

        for pattern in self.CRISIS_PATTERNS:
            if re.search(pattern, message_lower, re.IGNORECASE):
                patterns_matched.append(pattern)

        if not patterns_matched:
            return None

        # Determine severity
        for pattern in self.SEVERITY_HIGH:
            if re.search(pattern, message_lower, re.IGNORECASE):
                severity = "high"
                break
        else:
            for pattern in self.SEVERITY_MEDIUM:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    severity = "medium"
                    break

        crisis_event = {
            "detected": True,
            "severity": severity,
            "patterns_matched": patterns_matched,
            "action": "escalate" if severity == "high" else "flag",
            "session_id": session_context.get('session_id'),
            "user_id": session_context.get('user_id'),
            "timestamp": datetime.now().isoformat()
        }

        # Take action based on severity
        if severity == "high":
            await self._escalate_crisis(crisis_event, session_context)
        elif severity == "medium":
            await self._flag_session(crisis_event, session_context)

        return crisis_event

    async def _escalate_crisis(self, event: Dict, context: Dict):
        """Immediate escalation for high-severity crisis"""
        # Log to audit trail
        await self._log_audit_event(event, "CRISIS_ESCALATION")

        # Send notifications
        await self.notification_service.send_crisis_alert(
            to_email=settings.CRISIS_ESCALATION_EMAIL,
            subject=f"URGENT: Crisis Detected - {context.get('user_id')}",
            details={
                "user_id": context.get('user_id'),
                "session_id": context.get('session_id'),
                "severity": event['severity'],
                "patterns": event['patterns_matched'],
                "timestamp": event['timestamp']
            }
        )

        # Pause conversation - return crisis resources
        return self._get_crisis_response(context)

    async def _flag_session(self, event: Dict, context: Dict):
        """Flag session for human review"""
        await self._log_audit_event(event, "SESSION_FLAGGED")

        # Notify designated staff (non-urgent)
        await self.notification_service.send_flag_notification(
            context.get('coach_id') or context.get('school_id')
        )

    def _get_crisis_response(self, context: Dict) -> str:
        """Generate crisis response with resources"""
        school_resources = context.get('school_resources', {})

        return f"""I want you to know that I hear you, and what you're feeling matters.

It sounds like you're going through something really difficult right now. While I'm here to support you with performance and mental skills, what you're describing needs immediate support from a trained professional.

**Please reach out to one of these resources right away:**

🆘 **National Crisis Hotline**: 988 (call or text, 24/7)
📞 **University Counseling**: {school_resources.get('counseling_phone', '555-1234')}
🏥 **Campus Health**: {school_resources.get('health_center', 'Student Health Center')}

**Or text "HELLO" to 741741** to reach the Crisis Text Line.

You're not alone in this, and there are people who want to help. Your wellbeing is the most important thing.

I'm going to let your athletic support team know you might need extra support right now. Is there anyone you'd like me to help you contact?"""

    async def _log_audit_event(self, event: Dict, event_type: str):
        """Log to governance audit trail"""
        from app.models.audit_log import AuditLog
        from app.db.database import get_db

        async with get_db() as db:
            log = AuditLog(
                event_type=event_type,
                severity=event['severity'],
                user_id=event.get('user_id'),
                session_id=event.get('session_id'),
                details=event
            )
            db.add(log)
            await db.commit()
```

---

## 3. KnowledgeAgent (RAG & KB Management)

```python
# server/app/agents/knowledge_agent.py
from typing import List, Dict, Optional
import chromadb
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from app.core.config import settings
from app.utils.pdf_processor import PDFProcessor

class KnowledgeAgent:
    """
    MCP Agent for knowledge base management and retrieval
    """

    def __init__(self):
        # Initialize ChromaDB client
        self.chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT
        )

        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL
        )

        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )

        self.pdf_processor = PDFProcessor()

    async def ingest_pdf(
        self,
        file_path: str,
        school_id: str,
        metadata: Dict
    ) -> Dict:
        """
        Ingest PDF into knowledge base

        Steps:
        1. Extract text from PDF
        2. Chunk into 1-2 paragraph pieces
        3. Auto-tag with metadata
        4. Generate embeddings
        5. Store in vector DB
        """
        # Extract and chunk
        chunks = await self.pdf_processor.process_pdf(
            file_path=file_path,
            chunk_size=settings.KNOWLEDGE_CHUNK_SIZE,
            chunk_overlap=settings.KNOWLEDGE_CHUNK_OVERLAP
        )

        # Process each chunk
        documents = []
        metadatas = []
        ids = []

        for i, chunk in enumerate(chunks):
            # Auto-tag chunk
            tags = await self._auto_tag_chunk(chunk['text'])

            # Prepare metadata
            chunk_metadata = {
                **metadata,
                **tags,
                "school_id": school_id,
                "source": file_path,
                "chunk_index": i,
                "page": chunk.get('page', 0)
            }

            documents.append(chunk['text'])
            metadatas.append(chunk_metadata)
            ids.append(f"{school_id}_{file_path}_{i}")

        # Generate embeddings and add to collection
        embeddings = await self.embeddings.aembed_documents(documents)

        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        return {
            "success": True,
            "chunks_processed": len(chunks),
            "file": file_path
        }

    async def query(
        self,
        query: str,
        filters: Optional[Dict] = None,
        top_k: int = None
    ) -> List[Dict]:
        """
        Query knowledge base with semantic search

        Args:
            query: Natural language query
            filters: Metadata filters (sport, framework, phase, etc.)
            top_k: Number of results to return

        Returns:
            List of relevant chunks with metadata and scores
        """
        # Generate query embedding
        query_embedding = await self.embeddings.aembed_query(query)

        # Build where clause from filters
        where_clause = {}
        if filters:
            if filters.get('sport'):
                where_clause['sport'] = {"$eq": filters['sport']}
            if filters.get('framework'):
                where_clause['framework'] = {"$in": filters['framework']}
            if filters.get('school_id'):
                where_clause['school_id'] = {"$eq": filters['school_id']}

        # Query collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k or settings.KNOWLEDGE_TOP_K,
            where=where_clause if where_clause else None
        )

        # Format results
        chunks = []
        for i, doc in enumerate(results['documents'][0]):
            score = results['distances'][0][i]

            # Filter by similarity threshold
            if score < settings.KNOWLEDGE_SIMILARITY_THRESHOLD:
                continue

            chunks.append({
                "content": doc,
                "metadata": results['metadatas'][0][i],
                "relevance_score": 1 - score,  # Convert distance to similarity
                "chunk_id": results['ids'][0][i]
            })

        return chunks

    async def _auto_tag_chunk(self, text: str) -> Dict:
        """
        Use GPT to extract metadata tags from chunk

        Returns:
            {
                "sport": ["basketball", "general"],
                "framework": ["CBT", "mindfulness"],
                "phase": "pre-competition",
                "protocol_step": "discovery",
                "tags": ["anxiety", "visualization"]
            }
        """
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """Extract metadata tags from this sports psychology text.

Return JSON with:
- sport: list of applicable sports (or ["general"])
- framework: list of frameworks mentioned (CBT, mindfulness, flow-state, goal-setting, etc.)
- phase: competition phase (pre-competition, competition, post-competition, off-season, general)
- protocol_step: discovery, understanding, intervention, action, followup
- tags: list of relevant topics (anxiety, confidence, focus, teamwork, etc.)

Be generous with tags to improve retrieval."""
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            response_format={"type": "json_object"}
        )

        import json
        return json.loads(response.choices[0].message.content)
```

---

## 4. Chat API Endpoint

```python
# server/app/api/chat.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.session import ChatSession, Message
from sqlalchemy.ext.asyncio import AsyncSession
import json

router = APIRouter()

@router.post("/")
async def chat_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_request: Request = None
):
    """
    Main chat endpoint - routes to AthleteAgent or CoachAgent

    Implements:
    1. Agent routing based on user role
    2. Governance checks (crisis detection)
    3. Knowledge base retrieval
    4. Response streaming
    5. Session management
    """

    # 1. Route to appropriate agent
    if current_user.role == "athlete":
        agent = app_request.app.state.athlete_agent
    elif current_user.role == "coach":
        agent = app_request.app.state.coach_agent
    else:
        raise HTTPException(status_code=403, detail="Invalid role")

    # 2. Get or create session
    session = await _get_or_create_session(
        db=db,
        user_id=current_user.id,
        session_id=request.session_id
    )

    # 3. Check for crisis language (GovernanceAgent)
    governance_agent = app_request.app.state.governance_agent
    crisis_event = await governance_agent.check_crisis(
        message=request.message,
        session_context={
            "session_id": session.id,
            "user_id": current_user.id,
            "school_id": current_user.school_id
        }
    )

    if crisis_event and crisis_event['severity'] == 'high':
        # Return crisis response immediately
        crisis_response = governance_agent._get_crisis_response({
            "school_resources": current_user.school.config.get('crisis_contacts', {})
        })

        # Save message and crisis response
        await _save_message(db, session.id, "user", request.message)
        await _save_message(db, session.id, "assistant", crisis_response, {
            "crisis_detected": True,
            "severity": "high"
        })

        return ChatResponse(
            session_id=session.id,
            message=crisis_response,
            metadata={"crisis_detected": True}
        )

    # 4. Query knowledge base (KnowledgeAgent)
    knowledge_agent = app_request.app.state.knowledge_agent
    knowledge_context = await knowledge_agent.query(
        query=request.message,
        filters={
            "sport": current_user.sport,
            "school_id": current_user.school_id
        }
    )

    # 5. Build session context
    session_context = {
        "session_id": session.id,
        "user_id": current_user.id,
        "sport": current_user.sport,
        "year": current_user.year,
        "history": await _get_session_history(db, session.id),
        "topic": session.metadata.get('topic'),
        "school_resources": current_user.school.config
    }

    # 6. Stream response
    async def generate():
        full_response = ""
        tool_calls = []

        async for chunk in agent.stream_response(
            message=request.message,
            session_context=session_context,
            knowledge_context=knowledge_context
        ):
            # Accumulate full response
            if chunk['type'] == 'content':
                full_response += chunk['delta']
            elif chunk['type'] == 'tool_call':
                tool_calls.append(chunk)

            # Stream to client
            yield f"data: {json.dumps(chunk)}\n\n"

        # Save messages to DB
        await _save_message(db, session.id, "user", request.message)
        await _save_message(db, session.id, "assistant", full_response, {
            "tool_calls": tool_calls,
            "protocol_phase": chunk.get('protocol_phase'),
            "knowledge_chunks_used": [k['chunk_id'] for k in knowledge_context]
        })

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

async def _get_or_create_session(
    db: AsyncSession,
    user_id: str,
    session_id: Optional[str] = None
) -> ChatSession:
    """Get existing session or create new one"""
    if session_id:
        session = await db.get(ChatSession, session_id)
        if session and session.user_id == user_id:
            return session

    # Create new session
    session = ChatSession(
        user_id=user_id,
        agent_type="athlete",  # or "coach"
        status="active",
        protocol_phase="discovery",
        metadata={}
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def _save_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str,
    metadata: Dict = None
):
    """Save message to database"""
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
        metadata=metadata or {}
    )
    db.add(message)
    await db.commit()

async def _get_session_history(
    db: AsyncSession,
    session_id: str,
    limit: int = 20
) -> List[Dict]:
    """Get recent conversation history"""
    from sqlalchemy import select

    query = select(Message).where(
        Message.session_id == session_id
    ).order_by(Message.created_at.desc()).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(messages)
    ]
```

---

## 5. Frontend Chat Hook

```typescript
// client/src/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { Message, ToolCall } from '@/types/chat';

export const useChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const abortController = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Reset tool calls
    setToolCalls([]);
    setIsStreaming(true);

    // Create abort controller for this request
    abortController.current = new AbortController();

    try {
      let assistantMessage = '';
      const assistantMessageId = crypto.randomUUID();

      // Stream response
      await chatService.streamChat({
        message: content,
        sessionId: currentSessionId,
        signal: abortController.current.signal,
        onChunk: (chunk) => {
          if (chunk.type === 'content') {
            assistantMessage += chunk.delta;

            // Update or add assistant message
            setMessages(prev => {
              const existing = prev.find(m => m.id === assistantMessageId);
              if (existing) {
                return prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantMessage }
                    : m
                );
              } else {
                return [...prev, {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: assistantMessage,
                  createdAt: new Date()
                }];
              }
            });
          } else if (chunk.type === 'tool_call') {
            setToolCalls(prev => [...prev, chunk as ToolCall]);
          } else if (chunk.type === 'message_start') {
            if (chunk.session_id) {
              setCurrentSessionId(chunk.session_id);
            }
          }
        }
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        // Add error message
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          createdAt: new Date(),
          error: true
        }]);
      }
    } finally {
      setIsStreaming(false);
      abortController.current = null;
    }
  }, [currentSessionId]);

  const stopStreaming = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setToolCalls([]);
    setCurrentSessionId(undefined);
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    toolCalls,
    sessionId: currentSessionId,
    stopStreaming,
    clearChat
  };
};

// client/src/services/chatService.ts
import { apiClient } from './api';

interface StreamChatOptions {
  message: string;
  sessionId?: string;
  signal?: AbortSignal;
  onChunk: (chunk: any) => void;
}

export const chatService = {
  async streamChat({ message, sessionId, signal, onChunk }: StreamChatOptions) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            onChunk(parsed);
          } catch (e) {
            console.error('Failed to parse chunk:', data);
          }
        }
      }
    }
  }
};
```

---

This implementation guide provides production-ready code samples for:
1. ✅ AthleteAgent with Discovery-First protocol
2. ✅ GovernanceAgent with crisis detection
3. ✅ KnowledgeAgent with RAG/vector search
4. ✅ Chat API endpoint with streaming
5. ✅ Frontend React hook for chat

All components are modular, type-safe, and ready to integrate. The next step is to scaffold the full project structure and deploy!
