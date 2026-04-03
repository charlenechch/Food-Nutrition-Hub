import React, { useState, useEffect } from 'react';
import QuizCard from '../components/QuizCard'; 
import { generateDailyQuiz } from '../utils/quizGenerator'; 

export default function DailyQuizPage() {
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
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading today's quiz...</div>;
  }

  if (isFinished) {
    const baseXP = score * 5;
    const perfectBonus = score === 5 ? 15 : 0;
    const totalXP = baseXP + perfectBonus;

    return (
      <div className="quiz-results-container" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "30px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>Quiz Complete!</h2>
        <h1 style={{ fontSize: "3rem", margin: "10px 0" }}>{score} / 5</h1>
        
        {score === 5 ? (
          <p style={{ color: "#28a745", fontWeight: "bold", fontSize: "1.2rem" }}>
            Perfect Score! You earned +{baseXP} XP and a +{perfectBonus} XP Perfect Bonus! (Total: {totalXP} XP)
          </p>
        ) : (
          <p style={{ fontSize: "1.1rem" }}>
            You got {score}/5 correct! You earned +{totalXP} XP.
          </p>
        )}

        <button 
          onClick={() => window.location.href = '/'}
          style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Return to Community
        </button>
      </div>
    );
  }

  return (
    <div className="daily-quiz-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2>Daily Foodie Quiz</h2>
        <h4 style={{ color: "#555" }}>Question {currentIndex + 1} of 5</h4>
        <p style={{ fontSize: "0.85rem", color: "#d97706", fontStyle: "italic", backgroundColor: "#fef3c7", padding: "10px", borderRadius: "6px", display: "inline-block" }}>
          ⚠️ Complete all 5 questions to lock in your daily XP! Links to recipes will safely open in a new tab.
        </p>
      </div>

      <QuizCard 
        quizData={questions[currentIndex]} 
        onNext={handleNextQuestion} 
      />

    </div>
  );
}