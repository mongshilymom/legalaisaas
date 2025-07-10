import { sanitizeHtmlInput } from './sanitizeHtmlInput';

export const sanitizeAllInputs = (inputObj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const key in inputObj) {
    if (typeof inputObj[key] === 'string') {
      sanitized[key] = sanitizeHtmlInput(inputObj[key]);
    } else if (typeof inputObj[key] === 'object' && inputObj[key] !== null) {
      sanitized[key] = sanitizeAllInputs(inputObj[key]);
    } else {
      sanitized[key] = inputObj[key];
    }
  }
  return sanitized;
};