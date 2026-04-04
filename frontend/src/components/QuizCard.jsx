import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/Quiz.css'; 

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
        <img src={quizData.image} alt="Quiz Food" className="quiz-image" />
      </div>

      <div className="quiz-content-wrapper">
        
        {!selectedAnswer ? (
          <>
            <h3 className="qc-h3">{quizData.question}</h3>
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
          </>
        ) : (
          
          <div className="quiz-reveal-state" style={{ animation: "fadeIn 0.3s ease-in" }}>
            
            <div className={`quiz-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect 
                ? t('quiz.correct', '🎉 Correct!') 
                : t('quiz.incorrect', { answer: quizData.correctAnswer })
              }
            </div>

            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <h2 style={{ color: "#6b3e26", margin: "0 0 8px 0", fontSize: "1.5rem" }}>
                {quizData.foodName}
              </h2>
              <span style={{ backgroundColor: "#f1e5d0", color: "#6b3e26", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
                {quizData.foodOrigin}
              </span>
            </div>

            <p style={{ fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "20px", textAlign: "center" }}>
              {quizData.explanation}
            </p>

            <div className="quiz-action-group">
              <button 
                onClick={() => window.open(`/fooddetail/${quizData.foodID}`, '_blank', 'noopener,noreferrer')}
                className="quiz-btn-secondary"
              >
                {t('quiz.viewDetailsBtn', 'View Food Details')}
              </button>
              <button onClick={handleNextClick} className="quiz-btn-primary">
                {t('quiz.nextBtn', 'Next Question ➔')}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}