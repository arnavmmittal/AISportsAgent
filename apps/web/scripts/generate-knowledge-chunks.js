/**
 * Generate Knowledge Chunks from PDF
 * Run this script once to parse the PDF and save chunks as JSON
 * Usage: node scripts/generate-knowledge-chunks.js
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfParse = PDFParse;

const PDF_PATH = path.join(__dirname, '..', 'knowledge_base', 'AI Sports Psych Project.pdf');
const OUTPUT_PATH = path.join(__dirname, '..', 'knowledge_base', 'chunks.json');

/**
 * Detect section from content
 */
function detectSection(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('introduction') || lowerText.includes('background')) {
    return 'Introduction';
  }
  if (lowerText.includes('method') || lowerText.includes('approach')) {
    return 'Methods';
  }
  if (lowerText.includes('result') || lowerText.includes('finding')) {
    return 'Results';
  }
  if (lowerText.includes('discussion') || lowerText.includes('conclusion')) {
    return 'Discussion';
  }
  if (lowerText.includes('intervention') || lowerText.includes('technique')) {
    return 'Interventions';
  }

  return 'General';
}

/**
 * Detect main topic from content
 */
function detectTopic(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('anxiety') || lowerText.includes('stress')) {
    return 'Anxiety & Stress';
  }
  if (lowerText.includes('confidence') || lowerText.includes('self-efficacy')) {
    return 'Confidence';
  }
  if (lowerText.includes('motivation') || lowerText.includes('goal')) {
    return 'Motivation';
  }
  if (lowerText.includes('mindfulness') || lowerText.includes('meditation')) {
    return 'Mindfulness';
  }
  if (lowerText.includes('cbt') || lowerText.includes('cognitive behavioral')) {
    return 'CBT';
  }
  if (lowerText.includes('flow') || lowerText.includes('zone')) {
    return 'Flow State';
  }
  if (lowerText.includes('recovery') || lowerText.includes('burnout')) {
    return 'Recovery';
  }
  if (lowerText.includes('team') || lowerText.includes('communication')) {
    return 'Team Dynamics';
  }

  return 'General Sports Psychology';
}

/**
 * Chunk PDF content into manageable pieces
 */
function chunkPDFContent(text, numPages) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50);

  const CHUNK_SIZE = 3000;
  const OVERLAP = 200;

  let currentChunk = '';
  let currentChunkId = 0;

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        id: `pdf-chunk-${currentChunkId}`,
        content: currentChunk.trim(),
        source: 'AI Sports Psych Project.pdf',
        metadata: {
          section: detectSection(currentChunk),
          topic: detectTopic(currentChunk),
        },
      });

      const overlapText = currentChunk.slice(-OVERLAP);
      currentChunk = overlapText + '\n\n' + paragraph;
      currentChunkId++;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `pdf-chunk-${currentChunkId}`,
      content: currentChunk.trim(),
      source: 'AI Sports Psych Project.pdf',
      metadata: {
        section: detectSection(currentChunk),
        topic: detectTopic(currentChunk),
      },
    });
  }

  return chunks;
}

async function generateChunks() {
  try {
    console.log('[Generate Chunks] Reading PDF from:', PDF_PATH);

    if (!fs.existsSync(PDF_PATH)) {
      console.error('[Generate Chunks] PDF not found at:', PDF_PATH);
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);
    console.log('[Generate Chunks] Parsing PDF...');

    const parser = new pdfParse();
    const data = await parser.parse(dataBuffer);

    console.log('[Generate Chunks] PDF parsed successfully');
    console.log('[Generate Chunks] Pages:', data.numpages);
    console.log('[Generate Chunks] Text length:', data.text.length);

    const chunks = chunkPDFContent(data.text, data.numpages);

    console.log('[Generate Chunks] Created', chunks.length, 'knowledge chunks');

    // Save to JSON
    const outputData = {
      generatedAt: new Date().toISOString(),
      source: 'AI Sports Psych Project.pdf',
      pageCount: data.numpages,
      characterCount: data.text.length,
      chunkCount: chunks.length,
      chunks,
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
    console.log('[Generate Chunks] Saved chunks to:', OUTPUT_PATH);
    console.log('[Generate Chunks] ✅ Done!');
  } catch (error) {
    console.error('[Generate Chunks] Error:', error);
    process.exit(1);
  }
}

generateChunks();
