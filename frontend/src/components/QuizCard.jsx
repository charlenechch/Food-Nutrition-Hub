import React, { useState } from 'react';

export default function QuizCard({ quizData, onNext }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (!quizData) return <div>Loading question...</div>;

  const isCorrect = selectedAnswer === quizData.correctAnswer;

  const handleOptionClick = (option) => {
    setSelectedAnswer(option);
  };

  const handleNextClick = () => {
    onNext(isCorrect); 
    setSelectedAnswer(null); 
  };

  return (
    <div className="quiz-card" style={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", maxWidth: "500px", margin: "0 auto" }}>
      
      <div className="quiz-image-container" style={{ height: "250px", width: "100%", overflow: "hidden" }}>
        <img 
          src={quizData.image} 
          alt="Quiz Food" 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
      </div>

      <div className="quiz-content" style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "1.2rem" }}>
          {quizData.question}
        </h3>

        {!selectedAnswer ? (
          <div className="quiz-options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {quizData.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleOptionClick(option)}
                style={{ padding: "12px", cursor: "pointer", borderRadius: "6px", border: "1px solid #ddd" }}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-reveal-state" style={{ animation: "fadeIn 0.3s ease-in" }}>
            
            <div style={{ 
              padding: "10px", 
              marginBottom: "15px", 
              borderRadius: "6px", 
              backgroundColor: isCorrect ? "#d4edda" : "#f8d7da",
              color: isCorrect ? "#155724" : "#721c24",
              fontWeight: "bold",
              textAlign: "center"
            }}>
              {isCorrect ? "🎉 Correct!" : `❌ Incorrect! The correct answer was: ${quizData.correctAnswer}`}
            </div>

            <p style={{ fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "20px" }}>
              {quizData.explanation}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button 
                onClick={() => window.open(`/fooddetail/${quizData.foodID}`, '_blank', 'noopener,noreferrer')}
                style={{ flex: 1, padding: "10px", backgroundColor: "transparent", border: "1px solid #333", borderRadius: "6px", cursor: "pointer" }}
              >
                View Food Details
              </button>
              
              <button 
                onClick={handleNextClick}
                style={{ flex: 1, padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Next Question ➔
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}