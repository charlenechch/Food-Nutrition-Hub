import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BsPatchQuestion } from "react-icons/bs";
import { FaPlus, FaRegFlag } from "react-icons/fa6"; 
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { FiCheck } from "react-icons/fi";
import { CiSearch } from "react-icons/ci";
import { mockFoods } from "../data/mockFoods"; 
import { translateTexts } from "../hooks/useAITranslation";
import Modal from "../components/Modal"; 

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminQuizDatabase = () => {
  const { t, i18n } = useTranslation();
  
  const [questions, setQuestions] = useState([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [isTokenReady, setIsTokenReady] = useState(false); 
  const hasInitialFetched = useRef(false);

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
    onPrimary: null,
  });

  const closeModal = () => setModal((m) => ({ ...m, open: false, onPrimary: null }));

  const [translatedQuestions, setTranslatedQuestions] = useState({});
  const [translatedFoods, setTranslatedFoods] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedAnswers, setTranslatedAnswers] = useState({});

  const refreshCsrfToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (err) {
      console.error("Critical: Failed to fetch CSRF token", err);
    }
    return null;
  }, []);

  const fetchAdminQuestions = useCallback(async () => {
    if (!isTokenReady) return; 

    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz-content/admin`, {
        credentials: "include" 
      });

      if (res.status === 403) {
        console.error("403 Forbidden: Session expired or not an admin account.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const formattedData = data.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        setQuestions(formattedData);
      }
    } catch (err) {
      console.error("Failed to fetch admin questions", err);
    }
  }, [isTokenReady]);

  useEffect(() => {
    const init = async () => {
      if (hasInitialFetched.current) return;
      
      const token = await refreshCsrfToken();
      if (token) {
        setTimeout(() => {
          setIsTokenReady(true);
        }, 150);
      }
    };
    init();
  }, [refreshCsrfToken]);

  useEffect(() => {
    if (isTokenReady && !hasInitialFetched.current) {
      fetchAdminQuestions();
      hasInitialFetched.current = true;
    }
  }, [isTokenReady, fetchAdminQuestions]);

  useEffect(() => {
    const translateDynamicData = async () => {
      if (i18n.language === 'en' || questions.length === 0) {
        setTranslatedQuestions({});
        setTranslatedFoods({});
        setTranslatedAnswers({});
        return;
      }

      setIsTranslating(true);
      try {
        const questionPrompts = questions.map(q => q.question);
        const foodNames = mockFoods.map(f => f.name);
        const correctAnswers = questions.map(q => q.correctAnswer);

        const [translatedQsArray, translatedFoodsArray, translatedAsArray] = await Promise.all([
          translateTexts(questionPrompts, i18n.language),
          translateTexts(foodNames, i18n.language),
          translateTexts(correctAnswers, i18n.language)
        ]);

        const qMap = {};
        const aMap = {};
        questions.forEach((q, index) => {
          qMap[q.questionID] = translatedQsArray[index] || q.question; 
          aMap[q.questionID] = translatedAsArray[index] || q.correctAnswer;
        });
        
        const fMap = {};
        mockFoods.forEach((f, index) => {
          fMap[f.foodID] = translatedFoodsArray[index] || f.name;
        });

        setTranslatedQuestions(qMap);
        setTranslatedAnswers(aMap);
        setTranslatedFoods(fMap);

      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        setIsTranslating(false);
      }
    };

    translateDynamicData();
  }, [i18n.language, questions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalFoodSearchTerm, setModalFoodSearchTerm] = useState("");
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
    if (translatedFoods[id]) return translatedFoods[id];
    const question = questions.find(q => q.foodID === Number(id));
    if (question && question.linkedFoodName) return question.linkedFoodName;
    const food = mockFoods.find(f => f.foodID === Number(id));
    return food ? food.name : t("adminQuizDB.unknownFood");
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
    setModalFoodSearchTerm("");
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

  const handleSave = async () => {
    let currentToken = csrfToken;
    if (!currentToken) currentToken = await refreshCsrfToken();

    if (!currentToken) {
      alert("Security handshake failed. Please refresh the page.");
      return;
    }

    try {
      const method = editingQuestion ? "PUT" : "POST";
      const url = editingQuestion 
        ? `${API_BASE_URL}/api/quiz-content/admin/${editingQuestion.questionID}`
        : `${API_BASE_URL}/api/quiz-content/admin`;

      // ✅ MODIFIED: Strip out fields that cause 400 Bad Request errors
      const { created_at, linkedFoodName, questionID, ...sanitizedPayload } = formData;

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": currentToken 
        },
        credentials: "include",
        body: JSON.stringify(sanitizedPayload) // ✅ Only send approved fields
      });

      if (res.ok) {
        fetchAdminQuestions(); 
        setIsModalOpen(false);
      } else {
        const errData = await res.json();
        if (errData.error === "Invalid CSRF token") {
          await refreshCsrfToken();
          alert("Security token refreshed. Please try saving again.");
        } else {
          alert(errData.error || "Failed to save question");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDeleteClick = (id) => {
    setModal({
      open: true,
      title: t("adminRcpDB.confirmDeletion"), 
      message: t("adminQuizDB.deleteConfirm"), 
      icon: <RiDeleteBin5Line size={30} color="#dc3545" />,
      primaryText: t("adminRcpDB.yesDelete"),
      onPrimary: () => performDelete(id),
    });
  };

  const performDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz-content/admin/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include"
      });

      if (res.ok) {
        fetchAdminQuestions(); 
        setModal({
          open: true,
          title: t("adminRcpDB.deletedTitle"),
          message: t("adminQuizDB.deletedMsg", "Question successfully deleted!"),
          icon: <FaRegFlag size={30} color="green" />,
          primaryText: t("adminRcpDB.ok"),
          onPrimary: closeModal,
        });
      } else {
        const result = await res.json();
        setModal({
          open: true,
          title: t("adminRcpDB.errorTitle"),
          message: result.error || t("adminRcpDB.deleteFailed"),
          primaryText: t("adminRcpDB.close"),
          onPrimary: closeModal,
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredModalFoods = mockFoods.filter(f => 
    f.name.toLowerCase().includes(modalFoodSearchTerm.toLowerCase())
  );

  return (
    <div className="food-database-section aqd-section">
      <div className="food-header">
        <h2>
          <span className="food-icon"><BsPatchQuestion /></span> {t("adminQuizDB.title")}
        </h2>
        <div className="food-actions">
          <button 
            className="admin-food-btn-add lrp-no-outline"
            onClick={() => handleOpenModal()}
            disabled={!isTokenReady}
          >
            <FaPlus /> {t("adminQuizDB.addQuestion")}
          </button>
        </div>
      </div>

      <div className="food-filters">
        <div className="search-box">
          <CiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder= {t("adminQuizDB.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="admin-beige-trigger aqd-select" 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">{t("adminQuizDB.sortDefault")}</option>
          <option value="foodAsc">{t("adminQuizDB.sortFoodAsc")}</option>
          <option value="foodDesc">{t("adminQuizDB.sortFoodDesc")}</option>
        </select>
      </div>

      <table className="food-table aqd-table">
        <thead>
          <tr>
            <th>{t("adminQuizDB.tableLinkedFood")}</th>
            <th>{t("adminQuizDB.tableQuestion")}</th>
            <th>{t("adminQuizDB.tableCorrectAnswer")}</th>
            <th>{t("adminQuizDB.tableActions")}</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((q) => (
              <tr key={q.questionID}>
                <td data-label="Linked Food">
                  <strong>{getFoodName(q.foodID)}</strong> <br/>
                </td>
                <td data-label={t("adminQuizDB.tableQuestion")}>
                  {isTranslating ? "Translating..." : (translatedQuestions[q.questionID] || q.question)}
                </td>
                <td data-label={t("adminQuizDB.tableCorrectAnswer")}>
                  <span className="recipe-status-tag approved">
                    {isTranslating ? "..." : (translatedAnswers[q.questionID] || q.correctAnswer)} 
                  </span>
                </td>
                <td data-label="Actions">
                  <div className = "aqd-actions-div">
                    <button className="food-database-btn-edit" onClick={() => handleOpenModal(q)}>
                      <HiOutlinePencilAlt />
                    </button>
                    <button className="food-database-btn-delete" onClick={() => handleDeleteClick(q.questionID)}>
                      <RiDeleteBin5Line />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className = "aqd-no-ques-found">
                {isTokenReady ? t("adminQuizDB.noQuestionsFound") : "Verifying Admin Session..."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination fdt-pagination aqd-pagination">
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
              <h3>{editingQuestion ? t("adminQuizDB.editQuestion") : t("adminQuizDB.addNewQuestion")}</h3>
              <button className="add-options-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="add-options-body quiz-modal-scrollable">
              <div className="umg-field aqd-field">
                <label className="umg-label aqd-label">{t("adminQuizDB.linkedFoodEntity")}</label>
                <div className="search-box aqd-search-box">
                  <CiSearch className="search-icon aqd-search-icon"/>
                  <input 
                    type="text" 
                    placeholder={t("adminQuizDB.searchFoodPlaceholder")} 
                    value={modalFoodSearchTerm}
                    onChange={(e) => setModalFoodSearchTerm(e.target.value)}
                    className = "aqd-search-box-input"
                  />
                </div>
                <div className="lfp-recipe-list aqd-list">
                  {filteredModalFoods.map(food => (
                    <div 
                      key={food.foodID}
                      onClick={() => setFormData({...formData, foodID: food.foodID})}
                      className = "aqd-filtered-modals-div"
                      style={{ 
                        background: formData.foodID === food.foodID ? "#ffffff" : "transparent", 
                        border: formData.foodID === food.foodID ? "1px solid #916848" : "1px solid transparent"
                      }}
                    >
                      <h4 className="aqd-filtered-modal-h4">{food.name}</h4>
                      {formData.foodID === food.foodID && <FiCheck className = "aqd-form-data-ficheck"/>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="umg-field">
                <label className="umg-label">{t("adminQuizDB.questionPrompt")}</label>
                <textarea 
                  className="umg-textarea"
                  value={formData.question} 
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                />
              </div>

              <div className="umg-field">
                <label className="umg-label">{t("adminQuizDB.multipleChoice")}</label>
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
                <label className="umg-label">{t("adminQuizDB.correctAnswerPrompt")}</label>
                <input 
                  type="text"
                  className="umg-input"
                  value={formData.correctAnswer} 
                  onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                />
              </div>

              <div className="umg-field">
                <label className="umg-label">{t("adminQuizDB.postAnswerExplanation")}</label>
                <textarea 
                  className="umg-textarea"
                  value={formData.explanation} 
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                />
              </div>
            </div>

            <div className="modal-actions aqd-modal-actions">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>{t("adminQuizDB.cancel")}</button>
              <button className="quiz-save-btn" onClick={handleSave}>{t("adminQuizDB.saveQuestion")}</button>
            </div>
          </div>
        </div>
      )}

      <Modal 
        open={modal.open} 
        title={modal.title} 
        icon={modal.icon} 
        primaryText={modal.primaryText} 
        onClose={closeModal} 
        onPrimary={modal.onPrimary}
      >
        {modal.message}
      </Modal>
    </div>
  );
};

export default AdminQuizDatabase;