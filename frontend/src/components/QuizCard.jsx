import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Quiz.css'; 

export default function QuizCard({ quizData, onNext }) {
  const { t } = useTranslation();
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (!quizData) return <div>{t('quiz.loading', 'Loading question...')}</div>;

  const isCorrect = selectedAnswer === quizData.correctAnswer;

  const handleOptionClick = (option) => {
    setSelectedAnswer(option);
  };

  const handleNextClick = () => {
    onNext(isCorrect); 
    setSelectedAnswer(null); 
  };

  return (
    <div className="quiz-card">
      
      <div className="quiz-image-wrapper">
        <img 
          src={quizData.image} 
          alt="Quiz Food" 
          className="quiz-image"
        />
      </div>

      <div className="quiz-content-wrapper">
        <h3 className = "qc-h3">
          {quizData.question}
        </h3>

        {!selectedAnswer ? (
          <div className="quiz-options-grid">
            {quizData.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleOptionClick(option)}
                className="quiz-option-btn"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-reveal-state" style={{ animation: "fadeIn 0.3s ease-in" }}>
            
            <div className={`quiz-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect 
                ? t('quiz.correct') 
                : t('quiz.incorrect', { answer: quizData.correctAnswer })
              }
            </div>

            <p style={{ fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "20px" }}>
              {quizData.explanation}
            </p>

            <div className="quiz-action-group">
              <button 
                onClick={() => window.open(`/fooddetail/${quizData.foodID}`, '_blank', 'noopener,noreferrer')}
                className="quiz-btn-secondary"
              >
                {t('quiz.viewDetailsBtn')}
              </button>
              
              <button 
                onClick={handleNextClick}
                className="quiz-btn-primary"
              >
                {t('quiz.nextBtn')}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}