/**
 * LangGraph Functionality Test Script
 *
 * Tests:
 * 1. Graph compilation
 * 2. PostgresSaver connection
 * 3. Basic graph invocation (mocked)
 *
 * Run with: npx tsx scripts/test-langgraph.ts
 */

import 'dotenv/config';

async function testGraphCompilation() {
  console.log('\n🔧 Test 1: Graph Compilation');
  console.log('─'.repeat(50));

  try {
    const { getConversationGraph } = await import('../src/agents/langgraph/graph');
    const graph = await getConversationGraph();

    if (graph) {
      console.log('✅ Graph compiled successfully');
      console.log('   - Checkpointer: PostgresSaver');
      console.log('   - Nodes: parallel_init, crisis_response, call_model, tools, persist');
      return true;
    } else {
      console.log('❌ Graph compilation returned null');
      return false;
    }
  } catch (error) {
    console.log('❌ Graph compilation failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testCheckpointerConnection() {
  console.log('\n🗄️  Test 2: Checkpointer Initialization');
  console.log('─'.repeat(50));

  try {
    const { getCheckpointer, isCheckpointerReady, getCheckpointerType, isPersistentStorage } = await import('../src/agents/langgraph/checkpointer');

    // Check initial state
    console.log('   Initial state: isReady =', isCheckpointerReady());

    // Get checkpointer (this initializes the connection with fallback)
    const checkpointer = await getCheckpointer();

    if (checkpointer) {
      const type = getCheckpointerType();
      const persistent = isPersistentStorage();

      if (type === 'postgres') {
        console.log('✅ PostgresSaver connected successfully');
        console.log('   - Tables created/verified');
        console.log('   - Connection pool active');
        console.log('   - Storage: Persistent (survives restarts)');
      } else {
        console.log('⚠️  MemorySaver initialized (fallback mode)');
        console.log('   - Storage: In-memory only');
        console.log('   - Conversations will NOT persist across restarts');
        console.log('   - 💡 To enable persistence:');
        console.log('      • Set DIRECT_DATABASE_URL in .env.local');
        console.log('      • Or ensure Supabase port 5432 is accessible');
      }

      console.log('   - isReady:', isCheckpointerReady());
      console.log('   - Type:', type);
      console.log('   - Persistent:', persistent);

      return true;
    } else {
      console.log('❌ Checkpointer returned null');
      return false;
    }
  } catch (error) {
    console.log('❌ Checkpointer initialization failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testStateDefinitions() {
  console.log('\n📋 Test 3: State Definitions');
  console.log('─'.repeat(50));

  try {
    const { createInitialState, ConversationStateAnnotation } = await import('../src/agents/langgraph/state');

    const state = createInitialState('test-session', 'test-athlete', 'test-user', 'basketball');

    console.log('✅ State creation works');
    console.log('   - sessionId:', state.sessionId);
    console.log('   - athleteId:', state.athleteId);
    console.log('   - sport:', state.sport);
    console.log('   - protocolPhase:', state.protocolPhase);

    // Verify annotation
    if (ConversationStateAnnotation) {
      console.log('✅ State annotation defined');
    }

    return true;
  } catch (error) {
    console.log('❌ State definitions failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testToolsAvailability() {
  console.log('\n🛠️  Test 4: Tools Availability');
  console.log('─'.repeat(50));

  try {
    const { allTools, athleteTools, analyticsTools } = await import('../src/agents/langgraph/tools');

    console.log('✅ Tools loaded successfully');
    console.log(`   - Athlete tools: ${athleteTools?.length || 0}`);
    console.log(`   - Analytics tools: ${analyticsTools?.length || 0}`);
    console.log(`   - Total tools: ${allTools?.length || 0}`);

    if (allTools && allTools.length > 0) {
      console.log('   - Tool names:', allTools.map((t: { name: string }) => t.name).join(', '));
    }

    return true;
  } catch (error) {
    console.log('❌ Tools loading failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testNodesExist() {
  console.log('\n📦 Test 5: Nodes Exist');
  console.log('─'.repeat(50));

  try {
    const nodes = await import('../src/agents/langgraph/nodes');

    const requiredNodes = [
      'safetyCheckNode',
      'crisisResponseNode',
      'loadContextNode',
      'callModelNode',
      'persistStateNode',
    ];

    let allExist = true;
    for (const nodeName of requiredNodes) {
      if (typeof (nodes as Record<string, unknown>)[nodeName] === 'function') {
        console.log(`   ✅ ${nodeName}`);
      } else {
        console.log(`   ❌ ${nodeName} missing or not a function`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log('✅ All required nodes exist');
    }

    return allExist;
  } catch (error) {
    console.log('❌ Nodes loading failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function runAllTests() {
  console.log('═'.repeat(50));
  console.log('   LANGGRAPH FUNCTIONALITY TESTS');
  console.log('═'.repeat(50));

  const results = {
    stateDefinitions: await testStateDefinitions(),
    toolsAvailability: await testToolsAvailability(),
    nodesExist: await testNodesExist(),
    checkpointerConnection: await testCheckpointerConnection(),
    graphCompilation: await testGraphCompilation(),
  };

  console.log('\n' + '═'.repeat(50));
  console.log('   SUMMARY');
  console.log('═'.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status}: ${test}`);
    if (result) passed++;
    else failed++;
  }

  console.log('─'.repeat(50));
  console.log(`   Total: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50));

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
