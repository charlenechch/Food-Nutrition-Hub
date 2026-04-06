import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BsPatchQuestion } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { CiSearch } from "react-icons/ci";
import { mockAdminQuestions } from "../data/mockAdminQuestions"; 
import { mockFoods } from "../data/mockFoods"; 

const AdminQuizDatabase = () => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState(mockAdminQuestions);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    foodID: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getFoodName = (id) => {
    const food = mockFoods.find(f => f.foodID === Number(id));
    return food ? food.name : "Unknown Food";
  };

  const filteredQuestions = questions.filter(q => {
    const foodName = getFoodName(q.foodID).toLowerCase();
    const prompt = q.question.toLowerCase();
    const search = searchTerm.toLowerCase();
    return foodName.includes(search) || prompt.includes(search);
  }).sort((a, b) => {
    if (sortOrder === "foodAsc") return getFoodName(a.foodID).localeCompare(getFoodName(b.foodID));
    if (sortOrder === "foodDesc") return getFoodName(b.foodID).localeCompare(getFoodName(a.foodID));
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredQuestions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

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
    <div className="food-database-section">
      <div className="food-header">
        <h2>
          <span className="food-icon"><BsPatchQuestion /></span> Quiz Database
        </h2>
      </div>

      <div className="food-controls">
        <div className="search-bar">
          <CiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search questions or foods..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="umg-input aqd-select" 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">Sort: Default</option>
          <option value="foodAsc">Food Name (A-Z)</option>
          <option value="foodDesc">Food Name (Z-A)</option>
        </select>

        <div className="add-export-group">
          <button 
            className="admin-food-btn-add"
            onClick={() => handleOpenModal()}
          >
            <FaPlus /> Add Question
          </button>
        </div>
      </div>

      <table className="food-table">
        <thead>
          <tr>
            <th>Linked Food</th>
            <th>Question</th>
            <th>Correct Answer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((q) => (
              <tr key={q.id}>
                <td data-label="Linked Food">
                  <strong>{getFoodName(q.foodID)}</strong> <br/>
                  <span className="quiz-food-id">ID: {q.foodID}</span>
                </td>
                <td data-label="Question">{q.question}</td>
                <td data-label="Correct Answer">
                  <span className="recipe-status-tag approved">{q.correctAnswer}</span>
                </td>
                <td data-label="Actions">
                  <div className = "aqd-actions-div">
                    <button className="food-database-btn-edit" onClick={() => handleOpenModal(q)}>
                      <HiOutlinePencilAlt />
                    </button>
                    <button className="food-database-btn-delete" onClick={() => handleDelete(q.id)}>
                      <RiDeleteBin5Line />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className = "aqd-no-ques-found">
                No questions found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination fdt-pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            ‹ Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active" : ""}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Next ›
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="add-options-modal quiz-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-options-header">
              <h3>{editingQuestion ? "Edit Question" : "Add New Question"}</h3>
              <button className="add-options-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="add-options-body quiz-modal-scrollable">
              
              <div className="umg-field">
                <label className="umg-label">Linked Food Entity:</label>
                <select 
                  className="umg-input"
                  value={formData.foodID} 
                  onChange={(e) => setFormData({...formData, foodID: Number(e.target.value)})}
                >
                  {mockFoods.map(f => <option key={f.foodID} value={f.foodID}>{f.name} (ID: {f.foodID})</option>)}
                </select>
              </div>

              <div className="umg-field">
                <label className="umg-label">Question Prompt:</label>
                <textarea 
                  className="umg-textarea"
                  value={formData.question} 
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                />
              </div>

              <div className="umg-field">
                <label className="umg-label">Multiple Choice Options:</label>
                <div className="quiz-options-grid">
                  {formData.options.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      className="umg-input"
                      value={opt}
                      placeholder={`Option ${idx + 1}`}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[idx] = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="umg-field">
                <label className="umg-label">Correct Answer (Must exactly match one option above):</label>
                <input 
                  type="text"
                  className={`umg-input ${formData.correctAnswer && formData.options.includes(formData.correctAnswer) ? 'valid-answer' : formData.correctAnswer ? 'invalid-answer' : ''}`}
                  value={formData.correctAnswer} 
                  onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                />
              </div>

              <div className="umg-field">
                <label className="umg-label">Post-Answer Explanation:</label>
                <textarea 
                  className="umg-textarea"
                  value={formData.explanation} 
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                />
              </div>

            </div>

            <div className="modal-actions aqd-modal-actions">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="quiz-save-btn" onClick={handleSave}>Save Question</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizDatabase;