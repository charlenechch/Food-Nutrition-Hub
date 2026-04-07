import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuizCard from '../components/QuizCard'; 
import { generateDailyQuiz } from '../utils/quizGenerator'; 
import { useAuth } from '../context/AuthContext'; 
import '../css/Quiz.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DailyQuizPage() {
  const { t } = useTranslation(); 
  const navigate = useNavigate(); 
  const { user } = useAuth(); 

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // New states for backend integration
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  // CSRF Token State
  const [csrfToken, setCsrfToken] = useState("");

  // 1. Fetch CSRF Token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCsrfToken(data.csrfToken);
        }
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // 2. On Mount: Check if the user has already done the quiz today
  useEffect(() => {
    const checkQuizStatus = async () => {
      if (!user) {
        setIsLoadingStatus(false);
        setQuestions(generateDailyQuiz()); 
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/status`, {
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          setHasCompletedToday(data.hasCompletedToday);
          
          if (!data.hasCompletedToday) {
            const todayQuiz = generateDailyQuiz();
            setQuestions(todayQuiz);
          }
        } else {
          setQuestions(generateDailyQuiz());
        }
      } catch (error) {
        console.error("Failed to check quiz status:", error);
        setQuestions(generateDailyQuiz()); 
      } finally {
        setIsLoadingStatus(false);
      }
    };

    checkQuizStatus();
  }, [user]);

  // 3. On Finish: Submit the results to the backend to update streaks & XP
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
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken // Included CSRF token here
          },
          credentials: 'include',
          body: JSON.stringify({ 
            score: score, 
            xpEarned: totalXP,
            isPerfect: score === 5 
          })
        });
        console.log("Quiz results submitted successfully!");
      } catch (error) {
        console.error("Failed to submit quiz results:", error);
      }
    };

    submitResults();
  }, [isFinished, score, isSubmitting, user, csrfToken]);

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

  // --- RENDER STATES ---

  if (isLoadingStatus) {
    return (
      <>
        <Header />
        <div className="dqp-no-ques quiz-page-container dqp-div2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          {t('quiz.loading', 'Loading your daily quiz...')}
        </div>
        <Footer />
      </>
    );
  }

  if (hasCompletedToday) {
    return (
      <>
        <Header />
        <div className="quiz-results-card dqp-div">
          <h2>{t('quiz.alreadyCompletedTitle', "You're all caught up!")}</h2>
          <p className="quiz-normal-score" style={{ margin: '20px 0' }}>
            {t('quiz.alreadyCompletedDesc', "You've already completed today's quiz. Come back tomorrow to keep your streak alive!")}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="quiz-btn-primary dqp-div-btn"
          >
            {t('quiz.returnBtn', 'Return Home')}
          </button>
        </div>
        <Footer />
      </>
    );
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
          disabled={isSubmitting} 
        >
          {isSubmitting ? t('quiz.saving', 'Saving Results...') : t('quiz.returnBtn', 'Return Home')}
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="dqp-no-ques">{t('quiz.loading', 'Loading...')}</div>;
  }

  return (
    <>
    <Header />
      <div className="quiz-page-container dqp-div2">
        
        <button 
          onClick={() => navigate(-1)} 
          className="lrp-btn lrp-btn-outline dqp-back"
        >
          <span>&larr;</span> {t('quiz.back', 'Back')}
        </button>

        <div className="quiz-header-section">
          <h2 className="quiz-header-section-h2">{t('quiz.header')}</h2>
          
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
      <Footer/>
    </>
  );
}