import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, FileProcessResult, QuizQuestion, ActivityLogItem } from './types';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import QuizView from './components/QuizView';
import { processDocument, getChatResponseStream, generateSpeech, generateQuiz } from './services/geminiService';
import { playAudio } from './utils/audioUtils';
import { LogoIcon } from './components/icons/LogoIcon';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { QuizIcon } from './components/icons/QuizIcon';

export type View = 'chat' | 'quiz' | 'dashboard' | 'analytics';

const App: React.FC = () => {
  const [documentContext, setDocumentContext] = useState<string | null>(null);
  const [originalDocumentContent, setOriginalDocumentContent] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentMimeType, setDocumentMimeType] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<View>('dashboard');

  // Quiz state
  const [isQuizzing, setIsQuizzing] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);

  // Auto-read-aloud feature state
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const sentenceQueue = useRef<string[]>([]);
  const isSpeaking = useRef<boolean>(false);
  const textBuffer = useRef<string>('');

  // Dashboard & Analytics State
  const [studySessions, setStudySessions] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [totalStudyTime, setTotalStudyTime] = useState<number>(() => {
    const savedTime = localStorage.getItem('totalStudyTime');
    return savedTime ? parseInt(savedTime, 10) : 0;
  });
  const studyTimerRef = useRef<number | null>(null);

  // Persist total study time to local storage
  useEffect(() => {
    localStorage.setItem('totalStudyTime', totalStudyTime.toString());
  }, [totalStudyTime]);

  // Timer logic for tracking study time
  useEffect(() => {
    const isStudying = documentContext && (activeView === 'chat' || activeView === 'quiz');

    if (isStudying && !studyTimerRef.current) {
      studyTimerRef.current = window.setInterval(() => {
        setTotalStudyTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isStudying && studyTimerRef.current) {
      clearInterval(studyTimerRef.current);
      studyTimerRef.current = null;
    }

    // Cleanup timer on component unmount
    return () => {
      if (studyTimerRef.current) {
        clearInterval(studyTimerRef.current);
      }
    };
  }, [documentContext, activeView]);

  const addActivityLog = (type: 'study' | 'quiz', details: string) => {
    setActivityLog(prev => [
      {
        id: crypto.randomUUID(),
        type,
        details,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev,
    ].slice(0, 10)); // Keep only the last 10 activities
  };

  const speakNextSentence = useCallback(async () => {
    if (isSpeaking.current || sentenceQueue.current.length === 0) return;
    isSpeaking.current = true;
    const sentence = sentenceQueue.current.shift();
    if (sentence) {
      try {
        const audioData = await generateSpeech(sentence);
        await playAudio(audioData, () => {
          isSpeaking.current = false;
          speakNextSentence();
        });
      } catch (err) {
        console.error(err);
        setError('Failed to generate or play audio for sentence.');
        isSpeaking.current = false;
        speakNextSentence();
      }
    } else {
      isSpeaking.current = false;
    }
  }, []);

  const handleFileProcess = useCallback(async (fileData: FileProcessResult) => {
    setIsLoading(true);
    setLoadingMessage(`Analyzing "${fileData.name}"...`);
    setError(null);
    setChatHistory([]);
    setDocumentContext(null);
    setOriginalDocumentContent(null);
    setDocumentName(null);
    setDocumentMimeType(null);
    setActiveView('chat');

    try {
      const summary = await processDocument(fileData.content, fileData.mimeType);
      
      // Set the context and original content together to ensure they are in sync
      setOriginalDocumentContent(fileData.content);
      setDocumentContext(summary);
      
      setDocumentName(fileData.name);
      setDocumentMimeType(fileData.mimeType);

      const initialMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: `I've analyzed "${fileData.name}". I'm ready to answer your questions about it.`,
      };
      setChatHistory([initialMessage]);
      setStudySessions(prev => prev + 1);
      addActivityLog('study', `Started studying "${fileData.name}".`);
    } catch (err) {
      console.error(err);
      setError('Failed to process the document. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!documentContext) {
      setError("Please upload a document first.");
      return;
    }

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    };
    setQuestionsAsked(prev => prev + 1);

    const modelMessageId = crypto.randomUUID();
    const newModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
    };
    
    setChatHistory(prev => [...prev, newUserMessage, newModelMessage]);
    
    setIsLoading(true);
    setLoadingMessage('Thinking...');
    setError(null);

    try {
      const stream = await getChatResponseStream(documentContext, message, chatHistory);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setChatHistory(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
        ));

        if (isVoiceEnabled) {
          textBuffer.current += chunk.text;
          const sentences = textBuffer.current.match(/[^.!?]+[.!?]+/g);
          if (sentences) {
            for (const sentence of sentences) {
              sentenceQueue.current.push(sentence.trim());
            }
            textBuffer.current = textBuffer.current.substring(textBuffer.current.lastIndexOf(sentences[sentences.length - 1]) + sentences[sentences.length - 1].length);
            speakNextSentence();
          }
        }
      }
      
      if (isVoiceEnabled && textBuffer.current.trim()) {
        sentenceQueue.current.push(textBuffer.current.trim());
        textBuffer.current = '';
        speakNextSentence();
      }
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Sorry, I encountered an error while generating a response. Please try again.",
      };
      setChatHistory(prev => [...prev.filter(m => m.id !== modelMessageId), errorMessage]);
      setError('Failed to get a response from the AI.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [documentContext, chatHistory, isVoiceEnabled, speakNextSentence]);

  const handleTextToSpeech = useCallback(async (text: string) => {
    setIsLoading(true);
    setLoadingMessage('Generating audio...');
    setError(null);
    try {
      const audioData = await generateSpeech(text);
      await playAudio(audioData);
    } catch (err) {
      console.error(err);
      setError('Failed to generate audio.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);
  
  const handleStartQuiz = useCallback(async () => {
    const isImage = documentMimeType?.startsWith('image/');
    const quizContentSource = isImage ? documentContext : originalDocumentContent;

    if (!quizContentSource) {
      setError("Cannot start quiz without document content. Please upload a file first.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating your quiz...');
    setError(null);
    setActiveView('quiz');
    try {
      const questions = await generateQuiz(quizContentSource);
      setQuizQuestions(questions);
      setIsQuizzing(true);
    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't generate a quiz. Please try again.");
      setActiveView('chat');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [originalDocumentContent, documentContext, documentMimeType]);

  const handleFinishQuiz = useCallback((score: number) => {
    setIsQuizzing(false);
    setQuizQuestions(null);
    setActiveView('chat');
    setQuizzesTaken(prev => prev + 1);
    setTotalScore(prev => prev + score);
    if(documentName) {
      addActivityLog('quiz', `Scored ${score}/${quizQuestions?.length} on "${documentName}".`);
    }
  }, [documentName, quizQuestions?.length]);

  const handleNewStudySession = () => {
    setDocumentContext(null);
    setOriginalDocumentContent(null);
    setDocumentName(null);
    setDocumentMimeType(null);
    setChatHistory([]);
    setQuizQuestions(null);
    setIsQuizzing(false);
    setError(null);
    setActiveView('chat');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'quiz':
        if (isLoading && !isQuizzing) {
          return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg">
              <SpinnerIcon className="h-12 w-12 mb-4" />
              <p className="text-lg text-slate-300">{loadingMessage}</p>
            </div>
          );
        }
        if (isQuizzing && quizQuestions) {
          return (
            <QuizView 
              questions={quizQuestions} 
              onFinishQuiz={handleFinishQuiz} 
              documentName={documentName}
            />
          );
        }
        // Fallback view for when no quiz is active
        return (
          <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg p-8 text-center">
            <QuizIcon className="h-16 w-16 mb-4 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-200">Ready for a Quiz?</h2>
            <p className="mt-2 text-slate-400">
              {documentContext 
                ? <button onClick={handleStartQuiz} className="font-semibold text-cyan-400 hover:underline">Click here to generate a new quiz</button>
                : <>First, go to the <button onClick={() => setActiveView('chat')} className="font-semibold text-cyan-400 hover:underline">Study Buddy</button> to upload a document.</>
              }
            </p>
          </div>
        );
      case 'dashboard':
        return <DashboardView 
                  stats={{
                    studySessions,
                    questionsAsked,
                    quizzesTaken,
                    averageScore: quizzesTaken > 0 ? Math.round((totalScore / (quizzesTaken * 10)) * 100) : 0,
                  }}
                  activityLog={activityLog}
                  onNewSession={handleNewStudySession}
                />;
      case 'analytics':
        return <AnalyticsView totalStudyTime={totalStudyTime} />;
      case 'chat':
      default:
        if (!documentContext) {
          return (
             <div className="flex h-full items-center justify-center">
                <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} loadingMessage={loadingMessage} />
            </div>
          );
        }
        return (
          <ChatInterface
            chatHistory={chatHistory}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            onSendMessage={handleSendMessage}
            onTextToSpeech={handleTextToSpeech}
            documentName={documentName}
            isVoiceEnabled={isVoiceEnabled}
            onVoiceToggle={setIsVoiceEnabled}
            onStartQuiz={handleStartQuiz}
            error={error}
            setError={setError}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900 font-sans">
      <header className="border-b border-slate-700 px-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100">AI Study Buddy</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-7xl gap-6 px-4 py-4">
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
          <div className="flex-1 h-full overflow-hidden">
            {renderActiveView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;