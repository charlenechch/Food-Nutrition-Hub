import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; 
import QuizCard from '../components/QuizCard'; 
import { generateDailyQuiz } from '../utils/quizGenerator'; 
import '../css/Quiz.css'; 

export default function DailyQuizPage() {
  const { t } = useTranslation(); 
  const navigate = useNavigate(); 
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
    return <div className="dqp-no-ques">{t('quiz.loading', 'Loading...')}</div>;
  }

  if (isFinished) {
    const baseXP = score * 5;
    const perfectBonus = score === 5 ? 15 : 0;
    const totalXP = baseXP + perfectBonus;

    return (
      <div className="quiz-results-card dqp-div">
        <h2>{t('quiz.completed', 'Quiz Complete!')}</h2>
        <h1 className="dqp-h1">{score} / 5</h1>
        
        {score === 5 ? (
          <p className="quiz-perfect-score">
            {t('quiz.perfectScore', { baseXP, bonusXP: perfectBonus, totalXP })}
          </p>
        ) : (
          <p className="quiz-normal-score">
            {t('quiz.normalScore', { score, totalXP })}
          </p>
        )}

        <button 
          onClick={() => navigate('/')}
          className="quiz-btn-primary dqp-div-btn"
        >
          {t('quiz.returnBtn', 'Return Home')}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-page-container dqp-div2">
      
      <button 
        onClick={() => navigate(-1)} 
        className = "dqp-div2-btn"
        style={{
          position: "absolute",
          top: "90px", 
          left: "20px",
          background: "none",
          border: "none",
          color: "#8b5e3c",
          fontWeight: "600",
          fontSize: "1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontFamily: "Poppins, sans-serif"
        }}
      >
        <span>&larr;</span> {t('quiz.back', 'Back')}
      </button>

      <div className="quiz-header-section">
        <h2>{t('quiz.header', 'Daily Quiz')}</h2>
        
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