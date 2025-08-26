# Agentic App (JavaScript) with Azure OpenAI

## Prerequisites
- Node.js 18+
- Azure OpenAI resource and deployed chat model (e.g., `gpt-4o`)

## Setup
1. Install dependencies:
```bash
npm install
```
2. Copy env template and fill values:
```bash
cp .env.example .env
# Edit .env with your endpoint, key, and deployment name
```
- `AZURE_OPENAI_ENDPOINT`: e.g. `https://YOUR-RESOURCE.openai.azure.com/`
- `AZURE_OPENAI_KEY`: your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT`: your deployed model name (e.g., `gpt-4o`)

## Run
```bash
node src/cli.js "What is 3*(4+5)? Also, what time is it in UTC?"
```
The agent will:
- Ask Azure OpenAI to decide whether to call tools
- Use calculator or clock tool if needed
- Return a concise final answer

## Files
- `src/tools.js`: Calculator and clock tools
- `src/agent.js`: Agent loop orchestrating tool calls and final answer
- `src/cli.js`: CLI entrypoint

## Notes
- This example uses a strict JSON protocol to keep tool-calling simple without extra frameworks.
- You can add more tools by extending `executeToolInvocation` and updating the system prompt.
