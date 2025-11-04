import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiDatabase } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_URL;

const AdminFoodDatabase = ({ categories = [] }) => {
  const navigate = useNavigate();

  // --- ✅ Data States ---
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ✅ Filter States ---
  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showFilters, setShowFilters] = useState(false);
  const [calorieMin, setCalorieMin] = useState(0);
  const [calorieMax, setCalorieMax] = useState(2000);

  // --- ✅ Delete Modal States ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // --- ✅ Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const foodsPerPage = 5;

  // --- ✅ Fetch Food Data from Backend ---
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch(`${API_URL}/api/foods`);
        const data = await res.json();

        if (data.success) {
          setFoodData(data.data);
        } else {
          console.error("Failed to fetch foods:", data.error);
        }
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  // --- ✅ Dropdown Close Handler ---
  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  // --- ✅ Delete Logic ---
  const handleDeleteClick = (food) => {
    setSelectedFood(food);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/foods/${selectedFood.foodID}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setFoodData((prev) =>
          prev.filter((f) => f.foodID !== selectedFood.foodID)
        );
        console.log(`Deleted: ${selectedFood.name}`);
      } else {
        console.error("Failed to delete:", data.error);
      }
    } catch (error) {
      console.error("Error deleting food:", error);
    } finally {
      setShowConfirm(false);
    }
  };

  // --- ✅ Pagination Logic ---
  const indexOfLast = currentPage * foodsPerPage;
  const indexOfFirst = indexOfLast - foodsPerPage;
  const currentFoods = foodData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(foodData.length / foodsPerPage);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading food database...</p>;
  }

  return (
    <div className="food-database-section">
      {/* Header */}
      <div className="food-header">
        <h2>
          <span className="food-icon">
            <FiDatabase />
          </span>{" "}
          Food Database
        </h2>
        <div className="food-actions">
          <button
            className="admin-food-btn-add"
            onClick={() => navigate("/admin/addfood")}
          >
            <FaPlus /> Add New Food
          </button>
          <button className="admin-food-btn-import">
            <MdOutlineFileUpload /> Bulk Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="food-filters">
        <div className="search-box">
          <CiSearch className="search-icon" />
          <input type="text" placeholder="Search foods..." />
        </div>

        <div
          className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`}
          ref={dropdownRef}
        >
          <button
            className="admin-beige-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {category}
          </button>
          {dropdownOpen && (
            <ul className="admin-beige-list">
              {["All Categories", ...categories].map((opt) => (
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

        <button
          className="admin-food-btn-filter"
          onClick={() => setShowFilters(!showFilters)}
        >
          <CiFilter className="filter-icon" /> Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <h4>
            <CiFilter /> Advanced Filters
          </h4>

          <div className="filter-grid">
            <div className="filter-item">
              <label>Cultural Origin</label>
              <select>
                <option>All Origins</option>
                <option>Iban</option>
                <option>Melanau</option>
                <option>Bidayuh</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Food Type</label>
              <select>
                <option>All Categories</option>
                {categories.map((cat) => (
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

            <div className="filter-item">
              <label>Status</label>
              <select>
                <option>All</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Flagged</option>
              </select>
            </div>
          </div>

          <div className="food-database-calorie-range">
            <label>
              Calorie Range: {calorieMin} – {calorieMax} calories
            </label>
            <div
              className="food-database-slider-container"
              style={{
                "--left": `${(calorieMin / 2000) * 100}%`,
                "--right": `${100 - (calorieMax / 2000) * 100}%`,
              }}
            >
              <input
                type="range"
                min="0"
                max="2000"
                step="10"
                value={calorieMin}
                onChange={(e) =>
                  setCalorieMin(
                    Math.min(Number(e.target.value), calorieMax - 50)
                  )
                }
              />
              <input
                type="range"
                min="0"
                max="2000"
                step="10"
                value={calorieMax}
                onChange={(e) =>
                  setCalorieMax(
                    Math.max(Number(e.target.value), calorieMin + 50)
                  )
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Food Table */}
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
              <td>{food.name}</td>
              <td>
                <span className="category-tag">{food.category}</span>
              </td>
              <td>{food.origin}</td>
              <td>{food.updatedAt || "—"}</td>
              <td>
                <button
                  className="food-database-btn-edit"
                  onClick={() => navigate(`/admin/editfood/${food.foodID}`)}
                >
                  <HiOutlinePencilAlt />
                </button>
                <button
                  className="food-database-btn-delete"
                  onClick={() => handleDeleteClick(food)}
                >
                  <RiDeleteBin5Line />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Warning</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedFood?.name}</strong>?<br />
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFoodDatabase;
