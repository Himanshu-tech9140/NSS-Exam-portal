import { useEffect, useRef, useCallback } from 'react';
import api from '../api/client';

export const VIOLATION_REASONS = {
  TAB_SWITCH: 'Tab switch detected.',
  WINDOW_BLUR: 'Window focus was lost.',
  FULLSCREEN_EXIT: 'Fullscreen was exited.',
  COPY_ATTEMPT: 'Copy attempt detected.',
  PASTE_ATTEMPT: 'Paste attempt detected.',
  CUT_ATTEMPT: 'Cut attempt detected.',
  RIGHT_CLICK: 'Right-click context menu attempt detected.',
  TEXT_SELECTION: 'Prohibited text selection detected.',
  RESTRICTED_SHORTCUT: 'Restricted keyboard shortcut used.',
  PRINT_ATTEMPT: 'Print screen or print page attempt detected.',
  SAVE_ATTEMPT: 'Page save attempt detected.',
  MULTIPLE_SESSION: 'Multiple active sessions detected on another device or tab.',
};

/**
 * useExamAntiCheat
 * Strict browser-level anti-cheating hook for online examination.
 *
 * NOTE ON BROWSER LIMITATIONS:
 * A standard web browser cannot guarantee 100% prevention of external or OS-level
 * actions such as physical cameras, separate monitor captures, OS shortcuts, or
 * hardware-level exploits. This hook implements the strongest reliable browser-level
 * detection and immediate termination with no warnings.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Current active exam session ID
 * @param {boolean} params.active - Whether anti-cheat monitoring is currently active
 * @param {Function} params.onTerminated - Callback invoked when termination occurs (receives reason string)
 */
export const useExamAntiCheat = ({ sessionId, active, onTerminated }) => {
  const terminationInProgress = useRef(false);

  const [warning, setWarning] = useState(null);

  // Central termination function with warning handling
  const terminateExam = useCallback(
    async (type, metadata = {}) => {
      // Prevent duplicate termination calls
      if (terminationInProgress.current || !active) return;
      terminationInProgress.current = true;

      const reason = VIOLATION_REASONS[type] || 'Prohibited action detected during active exam.';

      try {
        const res = await api.post('/exam/session/violation', {
          sessionId,
          type,
          metadata,
        });
        // If backend returns a warning (first violation), show modal
        if (res.data && res.data.warning) {
          setWarning({ message: res.data.message, type });
          // Reset termination flag to allow further violations
          terminationInProgress.current = false;
          return;
        }
        // No warning → termination
        if (typeof onTerminated === 'function') {
          onTerminated(reason, type);
        }
      } catch (err) {
        console.error('Failed to notify backend of violation:', err);
        // In case of network error, still consider terminated to be safe
        if (typeof onTerminated === 'function') {
          onTerminated(reason, type);
        }
      } finally {
        // Reset flag only if not waiting for warning acknowledgement
        if (!warning) {
          terminationInProgress.current = false;
        }
      }
    },
    [sessionId, active, onTerminated, warning]
  );

  useEffect(() => {
    if (!active || !sessionId) return;

    // 1. Tab switch detection (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        terminateExam('TAB_SWITCH');
      }
    };

    // 2. Window focus loss detection (Window blur)
    const handleWindowBlur = () => {
      // Only terminate if still marked active and not already in progress
      terminateExam('WINDOW_BLUR');
    };

    // 3. Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        terminateExam('FULLSCREEN_EXIT');
      }
    };

    // 4. Clipboard events (Copy, Cut, Paste)
    const handleCopy = (e) => {
      e.preventDefault();
      terminateExam('COPY_ATTEMPT');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      terminateExam('PASTE_ATTEMPT');
    };

    const handleCut = (e) => {
      e.preventDefault();
      terminateExam('CUT_ATTEMPT');
    };

    // 5. Right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      terminateExam('RIGHT_CLICK');
    };

    // 6. Text selection attempt on exam questions/options
    const handleSelectStart = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      // Allow cursor placement inside textarea or text input without selection termination
      if (tag === 'textarea' || tag === 'input') {
        return;
      }
      e.preventDefault();
      terminateExam('TEXT_SELECTION');
    };

    // 7. Restricted keyboard shortcuts & devtools keys
    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // PrintScreen detection
      if (key === 'printscreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        terminateExam('PRINT_ATTEMPT');
        return;
      }

      // F12 (Developer tools)
      if (key === 'f12') {
        e.preventDefault();
        terminateExam('RESTRICTED_SHORTCUT', { key: 'F12' });
        return;
      }

      // Ctrl/Meta combos
      if (isCtrlOrMeta) {
        // Devtools: Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (isShift && ['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          terminateExam('RESTRICTED_SHORTCUT', { key: `Ctrl+Shift+${key.toUpperCase()}` });
          return;
        }

        // View Source: Ctrl+U
        if (key === 'u') {
          e.preventDefault();
          terminateExam('RESTRICTED_SHORTCUT', { key: 'Ctrl+U' });
          return;
        }

        // Print: Ctrl+P
        if (key === 'p') {
          e.preventDefault();
          terminateExam('PRINT_ATTEMPT');
          return;
        }

        // Save: Ctrl+S
        if (key === 's') {
          e.preventDefault();
          terminateExam('SAVE_ATTEMPT');
          return;
        }

        // Copy: Ctrl+C
        if (key === 'c') {
          e.preventDefault();
          terminateExam('COPY_ATTEMPT');
          return;
        }

        // Paste: Ctrl+V
        if (key === 'v') {
          e.preventDefault();
          terminateExam('PASTE_ATTEMPT');
          return;
        }

        // Cut: Ctrl+X
        if (key === 'x') {
          e.preventDefault();
          terminateExam('CUT_ATTEMPT');
          return;
        }
      }
    };

    // 8. Print dialog trigger (beforeprint)
    const handleBeforePrint = () => {
      terminateExam('PRINT_ATTEMPT');
    };

    // Register all anti-cheat listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      // Clean up all anti-cheat listeners when exam finishes/terminates/unmounts
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [active, sessionId, terminateExam]);

  return {
    terminateExam,
    warning,
    clearWarning: () => setWarning(null),
  };
};

export default useExamAntiCheat;
