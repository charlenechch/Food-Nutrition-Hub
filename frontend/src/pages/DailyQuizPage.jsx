import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuizCard from '../components/QuizCard'; 
import { generateDailyQuiz } from '../utils/quizGenerator'; 
import '../styles/Quiz.css'; 

export default function DailyQuizPage() {
  const { t } = useTranslation(); 
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const todayQuiz = generateDailyQuiz();
    setQuestions(todayQuiz);
  }, []);

  const handleNextQuestion = (wasCorrect) => {
    if (wasCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    if (currentIndex < 4) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (questions.length === 0) {
    return <div style={{ textAlign: "center", padding: "50px" }}>{t('quiz.loading')}</div>;
  }

  if (isFinished) {
    const baseXP = score * 5;
    const perfectBonus = score === 5 ? 15 : 0;
    const totalXP = baseXP + perfectBonus;

    return (
      <div className="quiz-results-card">
        <h2>{t('quiz.completed')}</h2>
        
        <h1 className = "dqp-h1">{score} / 5</h1>
        
        {score === 5 ? (
          <p style={{ color: "#28a745", fontWeight: "bold", fontSize: "1.2rem" }}>
            {t('quiz.perfectScore', { baseXP, bonusXP: perfectBonus, totalXP })}
          </p>
        ) : (
          <p style={{ fontSize: "1.1rem" }}>
            {t('quiz.normalScore', { score, totalXP })}
          </p>
        )}

        <button 
          onClick={() => window.location.href = '/'}
          className="quiz-btn-primary"
          style={{ marginTop: "20px" }}
        >
          {t('quiz.returnBtn')}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-page-container">
      
      <div className="quiz-header-section">
        <h2>{t('quiz.header')}</h2>
        
        <h4 className="quiz-progress-text">
          {t('quiz.progress', { current: currentIndex + 1, total: 5 })}
        </h4>
        
        <p className="quiz-disclaimer">
          {t('quiz.disclaimer')}
        </p>
      </div>

      <QuizCard 
        quizData={questions[currentIndex]} 
        onNext={handleNextQuestion} 
      />

    </div>
  );
}