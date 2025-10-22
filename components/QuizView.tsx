import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';


interface QuizViewProps {
  questions: QuizQuestion[];
  onFinishQuiz: (score: number) => void;
  documentName: string | null;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onFinishQuiz, documentName }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];

  const handleSelectAnswer = (answer: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-full bg-slate-800/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-semibold text-slate-300 text-lg">
            Quiz Results for: <span className="text-cyan-400">{documentName}</span>
          </h3>
          <p className="text-2xl font-bold mt-2">
            You scored <span className="text-cyan-400">{score}</span> out of <span className="text-cyan-400">{questions.length}</span>!
          </p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.answer;
            return (
              <div key={index} className="p-4 bg-slate-700 rounded-lg">
                <p className="font-semibold text-slate-200">
                  {index + 1}. {q.question}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((option, i) => {
                    const isUserChoice = userAnswer === option;
                    const isAnswer = q.answer === option;
                    let ringColor = 'ring-slate-600';
                    if (isUserChoice && !isCorrect) ringColor = 'ring-red-500';
                    if (isAnswer) ringColor = 'ring-green-500';

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-md ring-2 ${ringColor}`}
                      >
                         {isAnswer && <CheckIcon className="h-5 w-5 text-green-400 flex-shrink-0" />}
                         {isUserChoice && !isCorrect && <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />}
                        <span className="text-slate-300">{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={() => onFinishQuiz(score)}
            className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors"
          >
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-semibold text-slate-300">
            Quiz: <span className="text-cyan-400">{documentName}</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">{currentQuestion.question}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectAnswer(option)}
                        className={`p-4 rounded-lg text-left text-lg transition-all duration-200 border-2 ${
                            selectedAnswer === option
                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg scale-105'
                                : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
            <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
                <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-500 transition-colors"
                >
                    Submit Quiz
                </button>
            ) : (
                <button
                    onClick={handleNext}
                    className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors"
                >
                    Next
                </button>
            )}
        </div>
    </div>
  );
};

export default QuizView;
