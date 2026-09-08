import React, { useEffect } from 'react';

interface Props {
  onTrigger: () => void;
}

export const AdminShortcutListener: React.FC<Props> = ({ onTrigger }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for CTRL + SHIFT + A (or Cmd + Shift + A on macOS)
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTrigger]);

  return null;
};
