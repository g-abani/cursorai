// cli.js

import 'dotenv/config';
import { runAgentOnce } from './agent.js';

async function main() {
  const userInput = process.argv.slice(2).join(' ').trim() || 'What is 3*(4+5)? Also, what time is it in UTC?';
  try {
    const result = await runAgentOnce(userInput, { maxSteps: 4 });
    let output = result.final;
    try {
      const maybe = JSON.parse(result.final);
      if (maybe && typeof maybe === 'object' && typeof maybe.content === 'string') {
        output = maybe.content;
      }
    } catch {}
    console.log(output);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();