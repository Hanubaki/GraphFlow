import { useEffect } from 'react';

/**
 * Closes a modal dialog when the user presses Escape (WCAG 2.1.2 / dialog pattern).
 * The listener is only attached while the dialog is open.
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
