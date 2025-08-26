// agent.js

import OpenAI from 'openai';
import { evaluateMathExpression, getCurrentTimeUtcIso } from './tools.js';

function getAzureClientFromEnv() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!endpoint || !apiKey || !deployment) {
    throw new Error('Missing required env: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: `${endpoint}openai/deployments/${deployment}`,
    defaultQuery: { 'api-version': '2024-08-01-preview' },
    defaultHeaders: { 'api-key': apiKey },
  });
  return { client, deployment };
}

const SYSTEM_PROMPT = [
  'You are a concise assistant that can call tools when necessary.',
  'When you need a tool, output STRICT JSON with this shape on a single line:',
  '{"type":"tool","name":"calculator","args":{"expression":"3*(4+5)"}} OR {"type":"tool","name":"clock","args":{}}',
  'If you are ready to give the final answer, output STRICT JSON: {"type":"final","content":"..."}',
  'Never include explanations with the JSON. No markdown. No extra text.'
].join('\n');

function tryParseToolJson(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function executeToolInvocation(invocation) {
  const { name, args } = invocation;
  if (name === 'calculator') {
    const result = evaluateMathExpression(String(args?.expression ?? ''));
    return String(result);
  }
  if (name === 'clock') {
    return getCurrentTimeUtcIso();
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function runAgentOnce(userInput, options = {}) {
  const { client } = getAzureClientFromEnv();
  const maxSteps = options.maxSteps ?? 3;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: String(userInput) }
  ];

  for (let step = 0; step < maxSteps; step += 1) {
    const response = await client.chat.completions.create({
      model: 'ignored-by-azure-deployment-routing',
      messages,
    });
    const content = response.choices?.[0]?.message?.content ?? '';

    const maybeJson = tryParseToolJson(content);
    if (!maybeJson) {
      return { final: content, steps: step + 1, finishReason: response.choices?.[0]?.finish_reason ?? 'unknown' };
    }

    if (maybeJson.type === 'final') {
      return { final: String(maybeJson.content ?? ''), steps: step + 1, finishReason: 'final' };
    }

    if (maybeJson.type === 'tool') {
      try {
        const toolResult = await executeToolInvocation(maybeJson);
        messages.push({ role: 'assistant', content: JSON.stringify(maybeJson) });
        messages.push({ role: 'user', content: `TOOL_RESULT name=${maybeJson.name} output=${toolResult}` });
        messages.push({ role: 'user', content: 'Continue and provide {"type":"final","content":"..."} only.' });
        continue;
      } catch (err) {
        messages.push({ role: 'user', content: `Tool error: ${(err && err.message) || String(err)}` });
        messages.push({ role: 'user', content: 'Try to provide a final answer anyway as JSON {"type":"final","content":"..."}.' });
        continue;
      }
    }

    return { final: content, steps: step + 1, finishReason: 'unknown_json_type' };
  }

  return { final: 'Max steps reached without final answer.', steps: 'max', finishReason: 'max_steps' };
}