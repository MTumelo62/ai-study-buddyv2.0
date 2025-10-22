import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SendIcon } from './icons/SendIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import ToggleSwitch from './ToggleSwitch';
import { QuizIcon } from './icons/QuizIcon';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  loadingMessage: string;
  onSendMessage: (message: string) => void;
  onTextToSpeech: (text: string) => void;
  documentName: string | null;
  isVoiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
  onStartQuiz: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatHistory,
  isLoading,
  loadingMessage,
  onSendMessage,
  onTextToSpeech,
  documentName,
  isVoiceEnabled,
  onVoiceToggle,
  onStartQuiz,
  error,
  setError,
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-slate-300 truncate pr-4">
          Topic: <span className="text-cyan-400">{documentName}</span>
        </h3>
        <button 
          onClick={onStartQuiz}
          disabled={isLoading}
          className="flex items-center gap-2 bg-slate-700 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
          aria-label="Start Quiz"
        >
          <QuizIcon className="h-5 w-5" />
          <span>Start Quiz</span>
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-cyan-400" />
                </div>
              )}
              <div className={`max-w-md rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'model' && msg.content && (
                  <button 
                    onClick={() => onTextToSpeech(msg.content)} 
                    className="mt-2 text-slate-400 hover:text-cyan-300 transition-colors"
                    aria-label="Read aloud"
                  >
                    <SpeakerIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && chatHistory[chatHistory.length-1]?.role === 'user' && (
             <div className="flex items-start gap-4">
               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <SpinnerIcon className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="max-w-md rounded-lg px-4 py-3 bg-slate-700 text-slate-200 rounded-bl-none">
                    <p>{loadingMessage}</p>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-700 space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </form>
         {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
        <div className="flex justify-end">
            <ToggleSwitch label="Read Aloud" enabled={isVoiceEnabled} onChange={onVoiceToggle} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;