import { useEffect } from 'react';

function isEditableTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target?.isContentEditable;
}

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const shortcut = shortcuts.find((item) => {
        const combo = item.keys.toLowerCase().split('+');
        return (
          combo.includes(key) &&
          combo.includes('ctrl') === event.ctrlKey &&
          combo.includes('meta') === event.metaKey &&
          combo.includes('shift') === event.shiftKey &&
          combo.includes('alt') === event.altKey
        );
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
