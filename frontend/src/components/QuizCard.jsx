import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/Quiz.css'; 

export default function QuizCard({ quizData, onNext }) {
  const { t } = useTranslation();
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [revealPhase, setRevealPhase] = useState(0); 

  useEffect(() => {
    let timer;
    if (revealPhase === 1) {
      timer = setTimeout(() => setRevealPhase(2), 2000);
    }
    return () => clearTimeout(timer);
  }, [revealPhase]);

  useEffect(() => {
    setSelectedAnswer(null);
    setRevealPhase(0);
  }, [quizData]);

  if (!quizData) return <div>{t('quiz.loading', 'Loading question...')}</div>;

  const isCorrect = selectedAnswer === quizData.correctAnswer;

  const handleOptionClick = (option) => {
    setSelectedAnswer(option);
    setRevealPhase(1);
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
        
        {revealPhase < 2 ? (
          <div className="qc-reveal">
            <h3 className="qc-h3">
              {quizData.questionKey 
                ? t(quizData.questionKey, quizData.questionVar) 
                : quizData.question
              }
            </h3>
            <div className="quiz-options-grid">
              {quizData.options.map((option, index) => {
                
                let btnClass = "quiz-option-btn";
                let icon = null;

                if (revealPhase === 1) {
                  if (option === quizData.correctAnswer) {
                    btnClass += " correct-feedback";
                    icon = <span className="feedback-icon">✓</span>;
                  } else if (option === selectedAnswer) {
                    btnClass += " incorrect-feedback";
                    icon = <span className="feedback-icon">✗</span>;
                  } else {
                    btnClass += " faded"; 
                  }
                }

                return (
                  <button 
                    key={index}
                    onClick={() => revealPhase === 0 && handleOptionClick(option)}
                    className={btnClass}
                    disabled={revealPhase === 1}
                  >
                    {icon} {option}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          
          <div className="quiz-reveal-state qc-reveal">
            <div className={`quiz-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? t('quiz.correct', '🎉 Correct!') : t('quiz.incorrect', { answer: quizData.correctAnswer })}
            </div>

            <div className="qc-div">
              <h2 className="qc-div-h2">{quizData.foodName}</h2>
              <span className="qc-div-span">{quizData.foodOrigin}</span>
            </div>

            <p className="qc-reveal-p">{quizData.explanation}</p>

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