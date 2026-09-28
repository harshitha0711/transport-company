import React from 'react';

export default function LoadingSpinner({ message = 'Loading operational data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-3 text-sm font-medium">{message}</p>
    </div>
  );
}
