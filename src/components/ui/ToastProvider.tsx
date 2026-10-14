import React from 'react';
import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '14px',
          fontFamily: 'var(--font-sans)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        },
      }}
    />
  );
}
