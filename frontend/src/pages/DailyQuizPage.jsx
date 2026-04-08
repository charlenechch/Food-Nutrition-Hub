import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuizCard from '../components/QuizCard'; 
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

  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
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

  // 2. Fetch Quiz Data and Status
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const statusRes = await fetch(`${API_BASE_URL}/api/userProfile/quiz/status`, {
          credentials: 'include' 
        });
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setHasCompletedToday(statusData.hasCompletedToday);
          
          if (!statusData.hasCompletedToday) {
            const questionsRes = await fetch(`${API_BASE_URL}/api/quiz-content/today`, {
               credentials: 'include'
            });
            
            if (questionsRes.ok) {
              const liveQuestions = await questionsRes.json();
              setQuestions(liveQuestions);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load quiz data:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchQuizData();
  }, [user]);

  // 3. Final Submission Logic
  useEffect(() => {
    const submitResults = async () => {
      // Guard: Ensure only one submission happens when finished
      if (!isFinished || isSubmitting || hasCompletedToday || !user || !csrfToken) return;
      
      setIsSubmitting(true);

      const baseXP = score * 5;
      const perfectBonus = score === 5 ? 15 : 0;
      const totalXP = baseXP + perfectBonus;

      try {
        const res = await fetch(`${API_BASE_URL}/api/userProfile/quiz/submit`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken 
          },
          credentials: 'include',
          body: JSON.stringify({ score, xpEarned: totalXP, isPerfect: score === 5 })
        });

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 400) setHasCompletedToday(true);
          throw new Error(errorData.error || `Error: ${res.status}`);
        }

        console.log("Quiz results submitted successfully!");
        setHasCompletedToday(true); // Stop re-submission in current session
      } catch (error) {
        console.error("Failed to submit results:", error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitResults();
    // ✅ Loop fix: removed 'isSubmitting' from the dependencies
  }, [isFinished, score, user, csrfToken, hasCompletedToday]);

  const handleNextQuestion = (wasCorrect) => {
    if (wasCorrect) setScore(prev => prev + 1);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // --- RENDER LOGIC ---

  if (isLoadingStatus) {
    return (
      <><Header /><div className="quiz-page-container dqp-div2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          {t('quiz.loading', 'Loading your daily quiz...')}
      </div><Footer /></>
    );
  }

  if (!user) {
    return (
      <><Header /><div className="quiz-results-card dqp-div">
          <h2>{t('quiz.loginRequired', 'Login Required')}</h2>
          <p style={{ margin: '20px 0' }}>{t('quiz.loginDesc', 'Please log in to play!')}</p>
          <button onClick={() => navigate('/loginregister')} className="quiz-btn-primary dqp-div-btn">{t('profile.loginToView')}</button>
      </div><Footer /></>
    );
  }

  if (hasCompletedToday && !isFinished) {
    return (
      <><Header /><div className="quiz-results-card dqp-div">
          <h2>{t('quiz.alreadyCompletedTitle')}</h2>
          <p style={{ margin: '20px 0' }}>{t('quiz.alreadyCompletedDesc')}</p>
          <button onClick={() => navigate('/')} className="quiz-btn-primary dqp-div-btn">{t('quiz.returnBtn')}</button>
      </div><Footer /></>
    );
  }

  if (isFinished) {
    const totalXP = (score * 5) + (score === 5 ? 15 : 0);
    return (
      <div className="quiz-results-card dqp-div">
        <h2>{t('quiz.completed', 'Quiz Complete!')}</h2>
        <h1 className="dqp-h1">{score} / {questions.length}</h1>
        <p className="quiz-normal-score">{t('quiz.normalScore', { score, totalXP })}</p>
        <button onClick={() => navigate('/')} className="quiz-btn-primary dqp-div-btn" disabled={isSubmitting}>
          {isSubmitting ? t('quiz.saving', 'Saving Results...') : t('quiz.returnBtn', 'Return Home')}
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <><Header /><div className="quiz-page-container dqp-div2" style={{ textAlign: 'center', padding: '100px' }}>
          <h2>{t('quiz.noQuestions', 'No Questions Found')}</h2>
          <button onClick={() => navigate(-1)} className="lrp-btn lrp-btn-outline" style={{ marginTop: '20px' }}>Go Back</button>
      </div><Footer /></>
    );
  }

  return (
    <><Header /><div className="quiz-page-container dqp-div2">
        <button onClick={() => navigate(-1)} className="lrp-btn lrp-btn-outline dqp-back"><span>&larr;</span> {t('quiz.back', 'Back')}</button>
        <div className="quiz-header-section">
          <h2 className="quiz-header-section-h2">{t('quiz.header')}</h2>
          <h4 className="quiz-progress-text">{t('quiz.progress', { current: currentIndex + 1, total: questions.length })}</h4>
          <p className="quiz-disclaimer">{t('quiz.disclaimer')}</p>
        </div>
        <QuizCard quizData={questions[currentIndex]} onNext={handleNextQuestion} />
    </div><Footer /></>
  );
}