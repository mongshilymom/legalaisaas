import React from 'react';

interface FeedbackProps {
  type: 'success' | 'error';
  message: string;
}

export const FeedbackAlert = ({ type, message }: FeedbackProps) => {
  const styles = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className={\`\${styles[type]} p-3 rounded mt-4 text-sm\`}>
      {message}
    </div>
  );
};