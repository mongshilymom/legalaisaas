import React from 'react';

export const ResponsiveScrollBox = ({ content }: { content: string }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
        {content}
      </pre>
    </div>
  );
};