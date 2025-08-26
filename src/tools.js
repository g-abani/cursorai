// tools.js

const ALLOWED_EXPRESSION_PATTERN = /^[0-9+\-*/().\s]+$/;

export function evaluateMathExpression(expression) {
  if (typeof expression !== 'string' || !ALLOWED_EXPRESSION_PATTERN.test(expression)) {
    throw new Error('Expression contains invalid characters. Allowed: digits, + - * / ( ) . and spaces');
  }
  // eslint-disable-next-line no-new-func
  const safeEval = new Function(`return (${expression})`);
  const result = safeEval();
  if (!Number.isFinite(result)) {
    throw new Error('Expression did not evaluate to a finite number');
  }
  return result;
}

export function getCurrentTimeUtcIso() {
  return new Date().toISOString();
}