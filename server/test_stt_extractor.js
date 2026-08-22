import { llmClient } from './dist/ai/llm.js';
import { transactionExtractor } from './dist/ai/extractor.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  console.log('SARVAM_API_KEY present:', !!process.env.SARVAM_API_KEY);
  console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
  console.log('LLM_MODEL:', process.env.LLM_MODEL);

  const transcript = 'Bhaiya 1 packet Parle-G aur 2 packet Britannia bread dena. Total kitna hua?';
  console.log('\n--- Testing Extraction on:', transcript);
  const result = await transactionExtractor.extract(transcript, 'hi-IN');
  console.log('Extraction Result:', JSON.stringify(result, null, 2));
}

runTest();
