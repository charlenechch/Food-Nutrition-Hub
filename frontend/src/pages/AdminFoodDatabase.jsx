import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiDatabase } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";
import * as XLSX from "xlsx";

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

  // const handleFileChange = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = async (e) => {
  //     try {
  //       const importedData = JSON.parse(e.target.result);
  //       if (!Array.isArray(importedData)) {
  //         alert("Error: File must contain a JSON Array of foods.");
  //         return;
  //       }

  //       let successCount = 0;
  //       setLoading(true);

  //       for (const foodItem of importedData) {
  //         try {
  //           await fetch(`${API_URL}/api/foods`, {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               "X-CSRF-Token": csrfToken,
  //             },
  //             body: JSON.stringify(foodItem),
  //             credentials: "include",
  //           });
  //           successCount++;
  //         } catch (err) {
  //           console.error("Failed to import item:", foodItem.name);
  //         }
  //       }
  //       alert(`Successfully imported ${successCount} items!`);
  //       fetchFoods();
  //     } catch (err) {
  //       alert("Invalid JSON file.");
  //     } finally {
  //       setLoading(false);
  //       event.target.value = null; 
  //     }
  //   };
  //   reader.readAsText(file);
  // };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['xlsx', 'xls', 'csv', 'json'];
    
    if (!allowedTypes.includes(fileType)) {
      alert("Please select an Excel (.xlsx, .xls), CSV, or JSON file");
      event.target.value = null;
      return;
    }

    setLoading(true);

    try {
      let importedData = [];

      if (fileType === 'json') {
        // Handle JSON files
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        if (!Array.isArray(parsed)) {
          throw new Error("JSON file must contain an array of food items");
        }
        importedData = parsed;
        
      } else {
        // Handle Excel/CSV files
        importedData = await parseExcelOrCSV(file, fileType);
      }

      // Validate and process the data
      await processImportedData(importedData);

    } catch (err) {
      alert(`Error processing file: ${err.message}`);
      console.error("File processing error:", err);
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  // Function to parse Excel/CSV files
  const parseExcelOrCSV = (file, fileType) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
         } catch (error) {
          reject(new Error(`Failed to parse ${fileType.toUpperCase()} file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      // Read the file based on type
      if (fileType === 'csv') {
        reader.readAsText(file);
      } else { 
        reader.readAsBinaryString(file);
      }
    });
  };

  // Function to process and validate imported data
  const processImportedData = async (importedData) => {
    if (!Array.isArray(importedData) || importedData.length === 0) {
      throw new Error("File contains no valid data");
    }

    // Map all rows to food items
    const foodItems = importedData
      .map(row => mapRowToFoodItem(row))
      .filter(item => item !== null && item.name);

    if (foodItems.length === 0) {
      throw new Error("No valid food items found after mapping");
    }

    console.log("Mapped food items:", foodItems);
    console.log("First item structure:", foodItems[0]);
    console.log("JSON to send:", JSON.stringify(foodItems, null, 2));
      
    // Validate all items before sending
    const validationErrors = [];
    foodItems.forEach((item, index) => {
      if (!item.name || !item.origin) {
        validationErrors.push({
          row: index + 2,
          name: item.name || `Row ${index + 1}`,
          error: "Missing name or origin"
        });
      }
      // if (!item.ingredients || !item.steps) {
      //   validationErrors.push({
      //     row: index + 2,
      //     name: item.name || `Row ${index + 1}`,
      //     error: "Missing ingredients or steps for recipe"
      //   });
      // }
    });

    if (validationErrors.length > 0) {
      const message = `Validation failed for ${validationErrors.length} items:\n\n` +
        validationErrors.slice(0, 10).map(item => `  Row ${item.row}: ${item.name} - ${item.error}`).join('\n');
      
      if (validationErrors.length > 10) {
        alert(message + `\n\n... and ${validationErrors.length - 10} more errors.`);
      } else {
        alert(message);
      }
      return;
    }

    try {

        console.log("📤 Sending to API:", {
        url: `${API_URL}/api/foods/bulk-import`,
        dataType: typeof foodItems,
        isArray: Array.isArray(foodItems),
        itemCount: foodItems.length,
        firstItemKeys: foodItems[0] ? Object.keys(foodItems[0]) : 'none',
        sampleData: JSON.stringify(foodItems.slice(0, 1), null, 2)
      });

      const requestBody = { foodItems: foodItems };
    
      console.log("📤 Request body structure:", {
        bodyKeys: Object.keys(requestBody),
        bodyType: typeof requestBody,
        isArray: Array.isArray(requestBody.foodItems),
        foodItemsCount: requestBody.foodItems.length
      });

      // Send ALL data at once to bulk endpoint
      const res = await fetch(`${API_URL}/api/foods/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(requestBody), // Send array of all items
        credentials: "include",
      });

      const data = await res.json();
      console.log("Import response:", data);
      
      if (data.success) {

        const createdCount = data.results?.foodCreated || data.results?.total || 0;

        // Updated success message
        alert(`✅ Successfully imported ${createdCount} food items!\n\n` +
              `Recipes are automatically APPROVED and ready to display.`);
        
        // Refresh the food list
        fetchFoods();
      } else {
        alert(`Import failed: ${data.message}`);
      }
      
    } catch (err) {
      alert(`Import error: ${err.message}`);
      console.error("Import error:", err);
    }
  };

  // Map Excel/CSV columns to your backend schema 
  const mapRowToFoodItem = (row) => {
    // Ensure row is an object
    if (!row || typeof row !== 'object') {
      console.warn("Invalid row:", row);
      return null;
    }
    
    const mappedItem = {
      // --- FOOD TABLE FIELDS ---
      name: String(row.Name || row.name || "").trim(),
      origin: String(row.Origin || row.origin || "").trim(),
      category: String(row.Category || row.category || "").trim(),
      foodType: String(row.FoodType || row.foodType || "Dish").trim(),
      difficulty: String(row.Difficulty || row.difficulty || "Medium").trim(),
      dietaryTags: String(row.DietaryTags || row.dietaryTags || "").trim(),
      description: String(row.Description || row.description || "").trim(),
      image: String(row.Image || row.image || "").trim(),
      prepTime: Number(row.PrepTime || row.prepTime || 0) || 0,
      culturalSignificance: String(row.CulturalSignificance || row.culturalSignificance || "").trim(),
      traditionalPreparation: String(row.TraditionalPreparation || row.traditionalPreparation || "").trim(),
      commonIngredients: String(row.CommonIngredients || row.commonIngredients || "").trim(),
      alternative: String(row.Alternative || row.alternative || "").trim(),
      altDescription: String(row.AltDescription || row.altDescription || "").trim(),
      healthTips: String(row.HealthTips || row.healthTips || "").trim(),
      Energy_kcal: Number(row.Energy_kcal || row.Calories || 0) || 0,
      Protein_g: Number(row.Protein_g || row.Protein || 0) || 0,
      Fat_g: Number(row.Fat_g || row.Fat || 0) || 0,
      Carbohydrates_g: Number(row.Carbohydrates_g || row.Carbs || 0) || 0,
      Fiber_g: Number(row.Fiber_g || row.Fiber || 0) || 0,
      VitaminC_mg: Number(row.VitaminC_mg || row.VitaminC || 0) || 0,

      // --- RECIPE TABLE FIELDS ---
      ingredients: String(row.Ingredients || row.ingredients || "").trim(),
      steps: String(row.Steps || row.steps || row.Instructions || row.instructions || "").trim(),
      cookTime: Number(row.CookTime || row.cookTime || row.CookingTime || 0) || 0,
      servings: Number(row.Servings || row.servings || 1) || 1,
      DidYouKnow: String(row.DidYouKnow || row.didYouKnow || "").trim(),
      chefTips: String(row.ChefTips || row.chefTips || "").trim()
    };
    
    console.log("Mapped item:", mappedItem.name, "keys:", Object.keys(mappedItem));
    return mappedItem;
  };

  // Helper function to parse string fields to arrays
  const parseFieldToArray = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      // Split by commas, newlines, or semicolons
      return field.split(/[,;\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    return [String(field)];
  };

  // Show import results
  const showImportResults = (successCount, failedCount, failedItems) => {
    if (failedCount === 0) {
      alert(`✅ Successfully imported ${successCount} food items!`);
    } else {
      const message = `Import completed with ${successCount} successful and ${failedCount} failed.\n\n` +
        `Failed items:\n` +
        failedItems.slice(0, 10).map(item => `  Row ${item.row}: ${item.name} - ${item.error}`).join('\n');
      
      if (failedItems.length > 10) {
        alert(message + `\n\n... and ${failedItems.length - 10} more errors.`);
      } else {
        alert(message);
      }
    }
  };

// Download Excel template - EMPTY template with only headers
const downloadTemplate = () => {
  // Create EMPTY template with just column headers
  const templateData = [
    // FOOD TABLE FIELDS
    ["Name", "Origin", "Category", "FoodType", "Difficulty", "DietaryTags", 
     "Description", "Image", "PrepTime", "CulturalSignificance", 
     "TraditionalPreparation", "CommonIngredients", "Alternative", 
     "AltDescription", "HealthTips", "Energy_kcal", "Protein_g", "Fat_g", 
     "Carbohydrates_g", "Fiber_g", "VitaminC_mg",
     
     // RECIPE TABLE FIELDS
     "Ingredients", "Steps", "CookTime", "Servings", "DidYouKnow", "ChefTips"]
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  // Remove the empty data row, keep only headers
  const range = XLSX.utils.decode_range(ws['!ref']);
  range.e.r = range.s.r; 
  ws['!ref'] = XLSX.utils.encode_range(range);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Food Template");
  
  // Generate Excel file
  XLSX.writeFile(wb, "food-import-template.xlsx");
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

            {/* Template download button */}
            <button 
              className="admin-food-btn-template"
              onClick={downloadTemplate}
              style={{
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                padding: "10px 15px",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px"
              }}
            >
              <FiDatabase /> Download Import Template
            </button>

            <input 
              type="file" 
              accept=".xlsx,.xls,.csv,.json" 
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