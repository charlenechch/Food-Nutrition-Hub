import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiDatabase } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminFoodDatabase = ({ categories = [] }) => {
  const navigate = useNavigate();

  // --- States ---
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Search & Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [originFilter, setOriginFilter] = useState("All Origins"); 

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filter States
  const [calorieMin, setCalorieMin] = useState(0);
  const [calorieMax, setCalorieMax] = useState(2000);

  // --- Delete Modal States ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const foodsPerPage = 5;

  // --- File Import Ref ---
  const fileInputRef = useRef(null);

  // --- CSRF ---
  const [csrfToken, setCsrfToken] = useState("");
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // --- Fetch Data ---
  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/foods`);
      const data = await res.json();

      if (data.success) {
        const mapped = data.data.map(f => ({
          ...f,
          lastUpdated: f.updatedAt,
        }));
        setFoodData(mapped);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // --- Reset Page ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, originFilter, calorieMin, calorieMax]);

  // --- Dropdown Close ---
  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  // --- Delete Logic ---
  const handleDeleteClick = (food) => {
    setSelectedFood(food);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/foods/${selectedFood.foodID}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setFoodData((prev) => prev.filter((f) => f.foodID !== selectedFood.foodID));
      }
    } catch (error) {
      console.error("Error deleting food:", error);
    } finally {
      setShowConfirm(false);
    }
  };

  // --- Bulk Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData)) {
          alert("Error: File must contain a JSON Array of foods.");
          return;
        }

        let successCount = 0;
        setLoading(true);

        for (const foodItem of importedData) {
          try {
            await fetch(`${API_URL}/api/foods`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
              },
              body: JSON.stringify(foodItem),
              credentials: "include",
            });
            successCount++;
          } catch (err) {
            console.error("Failed to import item:", foodItem.name);
          }
        }
        alert(`Successfully imported ${successCount} items!`);
        fetchFoods();
      } catch (err) {
        alert("Invalid JSON file.");
      } finally {
        setLoading(false);
        event.target.value = null; 
      }
    };
    reader.readAsText(file);
  };

  // --- Filtering Logic ---
  const filteredFoods = foodData.filter((f) => {
    const term = searchTerm.toLowerCase();
    const name = (f.name || "").toLowerCase();
    const originName = (f.origin || "").toLowerCase();
    const foodCalories = Number(f.Energy_kcal || f.calories || 0);
    const matchesSearch = name.includes(term) || originName.includes(term);
    const matchesCategory = category === "All Categories" || f.category === category;
    const matchesOrigin = originFilter === "All Origins" || f.origin === originFilter;
    const matchesCalories = 
      foodCalories >= calorieMin && 
      foodCalories <= calorieMax;
    return matchesSearch && matchesCategory && matchesOrigin && matchesCalories;
  });

  // --- Pagination Logic ---
  const indexOfLast = currentPage * foodsPerPage;
  const indexOfFirst = indexOfLast - foodsPerPage;
  const currentFoods = filteredFoods.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredFoods.length / foodsPerPage);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading food database...</p>;
  }

  const originOptions = ["All Origins", "Malay", "Chinese", "Iban", "Melanau", "Kadazan", "Bidayuh", "Dayak"];

  return (
    // ✅ DYNAMIC HEIGHT: 600px normally, 850px if filters are open
    <div 
      className="food-database-section" 
      style={{ 
        backgroundColor: "white", 
        minHeight: showFilters ? "850px" : "600px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        transition: "min-height 0.3s ease" // Makes the expansion smooth
      }}
    >
      
      {/* Top Section Wrapper */}
      <div>
        {/* Header */}
        <div className="food-header">
          <h2>
            <span className="food-icon"><FiDatabase /></span> Food Database
          </h2>
          <div className="food-actions">
            <button
              className="admin-food-btn-add"
              onClick={() => navigate("/admin/addfood")}
            >
              <FaPlus /> Add New Food
            </button>
            <button className="admin-food-btn-import" onClick={handleImportClick}>
              <MdOutlineFileUpload /> Bulk Import
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="food-filters">
          <div className="search-box">
            <CiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search foods..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button className="admin-beige-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {category}
            </button>
            {dropdownOpen && (
              <ul className="admin-beige-list">
                {["All Categories", ...categories.filter(c => c !== "All Categories")].map((opt) => (
                  <li
                    key={opt}
                    className={opt === category ? "selected" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(opt);
                      setDropdownOpen(false);
                    }}
                  >
                    {opt}
                    {opt === category && <span className="tick">✓</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="admin-food-btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <CiFilter className="filter-icon" /> Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <h4><CiFilter /> Advanced Filters</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Cultural Origin</label>
                <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)}>
                  {originOptions.map((origin) => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Food Type</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>All Categories</option>
                  {categories.filter(c => c !== "All Categories").map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Difficulty</label>
                <select>
                  <option>All</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
            <div className="food-database-calorie-range">
              <label>Calorie Range: {calorieMin} – {calorieMax} calories</label>
              <div className="food-database-slider-container" style={{"--left": `${(calorieMin / 2000) * 100}%`, "--right": `${100 - (calorieMax / 2000) * 100}%`}}>
                <input type="range" min="0" max="2000" step="10" value={calorieMin} onChange={(e) => setCalorieMin(Math.min(Number(e.target.value), calorieMax - 50))} />
                <input type="range" min="0" max="2000" step="10" value={calorieMax} onChange={(e) => setCalorieMax(Math.max(Number(e.target.value), calorieMin + 50))} />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="food-table">
          <thead>
            <tr>
              <th>Food Name</th>
              <th>Category</th>
              <th>Origin</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentFoods.map((food) => (
              <tr key={food.foodID}>
                <td data-label="Name">{food.name}</td>
                <td data-label="Category"><span className="category-tag">{food.category}</span></td>
                <td data-label="Origin">{food.origin}</td>
                <td data-label="Last Updated">{food.lastUpdated ? new Date(food.lastUpdated).toLocaleString() : "—"}</td>
                <td data-label="Actions">
                  <button className="food-database-btn-edit" onClick={() => navigate(`/admin/editfood/${food.foodID}`)}><HiOutlinePencilAlt /></button>
                  <button className="food-database-btn-delete" onClick={() => handleDeleteClick(food)}><RiDeleteBin5Line /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Warning</h3>
            <p>Are you sure you want to delete <strong>{selectedFood?.name}</strong>?<br />This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination" style={{ marginBottom: "20px" }}>
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active" : ""}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next ›</button>
        </div>
      )}
    </div>
  );
};

export default AdminFoodDatabase;