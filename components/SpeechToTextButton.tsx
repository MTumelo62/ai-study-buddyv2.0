import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

// Add type definitions for the Web Speech API, which are not included in default TypeScript DOM typings.
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  onend: (this: SpeechRecognition, ev: Event) => any;
  onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechToTextButtonProps {
  setInput: (value: string) => void;
  currentInput: string;
  isChatLoading: boolean;
  setError: (message: string | null) => void;
}

const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({ setInput, currentInput, isChatLoading, setError }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported'>('prompt');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const initialTextRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported by this browser.");
      setIsSupported(false);
      setPermissionState('unsupported');
      return;
    }
    
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognitionAPI();
    }

    // Check for microphone permission status if API is available
    if ('permissions' in navigator) {
      try {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
          setPermissionState(status.state);
          status.onchange = () => {
            setPermissionState(status.state);
          };
        });
      } catch (e) {
        console.error("Permissions API is not supported in this context.", e);
        // Fallback for environments where query might fail (e.g., some sandboxed iframes)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleListen = () => {
    if (!recognitionRef.current) return;

    if (permissionState === 'denied') {
      setError("Microphone permission is blocked. Please enable it in your browser's site settings and try again.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    setError(null);
    const recognition = recognitionRef.current;
    
    initialTextRef.current = currentInput ? currentInput + ' ' : '';
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
      }
      setInput(initialTextRef.current + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = `An unexpected speech recognition error occurred: ${event.error}.`;
      if (event.error === 'not-allowed') {
         errorMessage = "Microphone access was denied. To use this feature, please enable microphone permissions in your browser's site settings and try again.";
      } else if (event.error === 'audio-capture') {
          errorMessage = "No microphone was found. Please ensure one is connected and enabled.";
      }
      setError(errorMessage);
      setIsListening(false);
    };

    try {
        recognition.start();
        setIsListening(true);
    } catch (e) {
        console.error("Error starting speech recognition:", e);
        setError("Could not start the speech recognition service.");
        setIsListening(false);
    }
  };

  if (!isSupported) {
    return null;
  }
  
  const isDisabled = isChatLoading;
  
  let buttonTitle = "Start listening";
  let buttonClass = 'bg-slate-600 hover:bg-slate-500';

  if (isListening) {
    buttonTitle = "Stop listening";
    buttonClass = 'bg-red-600 hover:bg-red-500';
  } else if (permissionState === 'denied') {
    buttonTitle = "Microphone permission blocked. Click for instructions.";
    buttonClass = 'bg-yellow-600 hover:bg-yellow-500 cursor-help';
  }


  return (
    <button
      type="button"
      onClick={handleToggleListen}
      disabled={isDisabled}
      className={`relative p-2 rounded-lg transition-colors ${buttonClass} disabled:bg-slate-700 disabled:cursor-not-allowed`}
      aria-label={buttonTitle}
      title={buttonTitle}
    >
      {isListening ? (
        <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <StopIcon className="h-6 w-6 text-white" />
        </>
      ) : (
        <MicrophoneIcon className="h-6 w-6 text-white" />
      )}
    </button>
  );
};

export default SpeechToTextButton;