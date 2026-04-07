import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuizCard from '../components/QuizCard'; 
// import { generateDailyQuiz } from '../utils/quizGenerator'; // You might replace this with an API fetch later
import { useAuth } from '../context/AuthContext'; // Bring in Auth to check user
import '../css/Quiz.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DailyQuizPage() {
  const { t } = useTranslation(); 
  const navigate = useNavigate(); 
  const { user } = useAuth(); // Get current user

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // New States for Live Tracking
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // 1. Check if user already did the quiz today
  useEffect(() => {
    const checkQuizStatus = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/status`, {
          credentials: 'include' // Assuming you use cookies/sessions
        });
        if (res.ok) {
          const data = await res.json();
          setHasCompletedToday(data.hasCompletedToday);
          
          if (!data.hasCompletedToday) {
             // Fetch questions from backend OR use your generator
             // const todayQuiz = await fetchQuestions();
             // setQuestions(todayQuiz);
          }
        }
      } catch (error) {
        console.error("Failed to check quiz status", error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    checkQuizStatus();
  }, [user]);

  // 2. Submit Results when finished
  useEffect(() => {
    const submitResults = async () => {
      if (!isFinished || isSubmitting || !user) return;
      setIsSubmitting(true);

      const baseXP = score * 5;
      const perfectBonus = score === 5 ? 15 : 0;
      const totalXP = baseXP + perfectBonus;

      try {
        await fetch(`${API_BASE_URL}/api/quiz/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            score, 
            xpEarned: totalXP,
            isPerfect: score === 5 
          })
        });
      } catch (error) {
        console.error("Failed to submit quiz results", error);
      }
    };

    submitResults();
  }, [isFinished, score, isSubmitting, user]);

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

  if (isLoadingStatus) {
    return <div className="dqp-no-ques">{t('quiz.loading', 'Checking status...')}</div>;
  }

  // Block the UI if already completed
  if (hasCompletedToday) {
    return (
      <>
        <Header />
        <div className="quiz-page-container dqp-div2">
          <h2>You've already completed today's quiz!</h2>
          <p>Come back tomorrow to keep your streak alive.</p>
          <button onClick={() => navigate('/')} className="quiz-btn-primary">
            {t('quiz.returnBtn', 'Return Home')}
          </button>
        </div>
        <Footer />
      </>
    );
  }
}