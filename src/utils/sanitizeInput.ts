import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};