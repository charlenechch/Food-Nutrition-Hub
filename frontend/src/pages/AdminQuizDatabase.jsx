import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BsPatchQuestion } from "react-icons/bs";
import { mockAdminQuestions } from "../data/mockAdminQuestions"; 
import { mockFoods } from "../data/mockFoods"; 

const AdminQuizDatabase = () => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState(mockAdminQuestions);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    foodID: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = questions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(questions.length / itemsPerPage);

  const getFoodName = (id) => {
    const food = mockFoods.find(f => f.foodID === Number(id));
    return food ? food.name : "Unknown Food";
  };

  const handleOpenModal = (q = null) => {
    if (q) {
      setEditingQuestion(q);
      setFormData({ ...q });
    } else {
      setEditingQuestion(null);
      setFormData({
        foodID: mockFoods[0].foodID,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...formData, id: editingQuestion.id } : q));
    } else {
      const newQuestion = { ...formData, id: `mq_new_${Date.now()}` };
      setQuestions([newQuestion, ...questions]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this quiz question?")) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div className="content-moderation-section" style={{ position: "relative" }}>
      <div className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2><BsPatchQuestion style={{ marginRight: 8 }} /> Quiz Database</h2>
        <button 
          onClick={() => handleOpenModal()}
          style={{ backgroundColor: "#8b5e3c", color: "white", padding: "8px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          + Add New Question
        </button>
      </div>

      <table className="content-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={{ width: "15%" }}>Linked Food</th>
            <th style={{ width: "45%" }}>Question</th>
            <th style={{ width: "20%" }}>Correct Answer</th>
            <th style={{ width: "20%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((q) => (
            <tr key={q.id}>
              <td><strong>{getFoodName(q.foodID)}</strong> <br/><span style={{fontSize: "0.8rem", color: "#666"}}>ID: {q.foodID}</span></td>
              <td>{q.question}</td>
              <td><span className="recipe-status-tag approved">{q.correctAnswer}</span></td>
              <td className="admin-recipe-action-buttons">
                <button className="review-btn" onClick={() => handleOpenModal(q)}>Edit</button>
                <button 
                  className="reject-btn" 
                  onClick={() => handleDelete(q.id)}
                  style={{ marginLeft: "8px", backgroundColor: "#ff4d4f", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="umg-prev-next" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            ‹ Prev
          </button>
          <span style={{ margin: "0 15px", color: "#5a4636", fontWeight: "bold" }}>Page {currentPage} of {totalPages}</span>
          <button className="umg-prev-next" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Next ›
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0, color: "#6b3e26" }}>{editingQuestion ? "Edit Question" : "Add New Question"}</h3>
            
            <label style={{ display: "block", marginBottom: "15px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#5a4636" }}>Linked Food Entity:</span>
              <select 
                value={formData.foodID} 
                onChange={(e) => setFormData({...formData, foodID: Number(e.target.value)})}
                style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                {mockFoods.map(f => <option key={f.foodID} value={f.foodID}>{f.name} (ID: {f.foodID})</option>)}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "15px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#5a4636" }}>Question Prompt:</span>
              <textarea 
                value={formData.question} 
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "60px" }}
              />
            </label>

            <div style={{ marginBottom: "15px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#5a4636" }}>Multiple Choice Options:</span>
              {formData.options.map((opt, idx) => (
                <input 
                  key={idx}
                  type="text"
                  value={opt}
                  placeholder={`Option ${idx + 1}`}
                  onChange={(e) => {
                    const newOpts = [...formData.options];
                    newOpts[idx] = e.target.value;
                    setFormData({...formData, options: newOpts});
                  }}
                  style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              ))}
            </div>

            <label style={{ display: "block", marginBottom: "15px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#5a4636" }}>Correct Answer (Must exactly match one option above):</span>
              <input 
                type="text"
                value={formData.correctAnswer} 
                onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc", borderColor: formData.options.includes(formData.correctAnswer) ? "#48BB78" : "#E53E3E" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "20px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#5a4636" }}>Post-Answer Explanation:</span>
              <textarea 
                value={formData.explanation} 
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#f5f5f5", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "8px 16px", borderRadius: "4px", border: "none", backgroundColor: "#8b5e3c", color: "white", cursor: "pointer", fontWeight: "bold" }}>Save Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizDatabase;