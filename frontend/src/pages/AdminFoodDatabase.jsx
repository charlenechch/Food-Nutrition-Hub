import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiDatabase } from "react-icons/fi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminFoodDatabase = ({ categories = [] }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [calorieMax, setCalorieMax] = useState(2000);

  // --- Delete Modal States ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);

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
    console.log("🔄 Starting fetchFoods...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/foods`);
      const data = await res.json();
      console.log("[AdminFoodDatabase] Response data:", data);

      if (data.success) {
        const mapped = data.data.map(f => ({
          ...f,
          lastUpdated: f.updatedAt,
        }));
        console.log(`✅ Got ${mapped.length} foods`);
        setFoodData(mapped);
      } else {
        console.error("❌ API returned success: false", data);
        setFoodData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching foods:", error);
      setFoodData([]);
    } finally {
      console.log("✅ Setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 [AdminFoodDatabase] useEffect triggered");
    fetchFoods();
  }, []);

  // --- Reset Page ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, category, originFilter, calorieMax]);

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

    const fileType = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['xlsx', 'xls', 'csv', 'json'];
    
    if (!allowedTypes.includes(fileType)) {
      alert(t("adminFoodDB.invalidFileType"));
      event.target.value = null;
      return;
    }

    console.log(`📁 Processing file: ${file.name} (${fileType}, ${file.size} bytes)`);
  
    if (file.size === 0) {
      alert(t("adminFoodDB.emptyFile"));
      event.target.value = null;
      return;
    }

    setLoading(true);

    try {
      let importedData = [];

      if (fileType === 'json') {
        console.log("Processing JSON file...");
        const text = await file.text();
        console.log("JSON text length:", text.length);
        
        const parsed = JSON.parse(text);
        console.log("Parsed JSON type:", typeof parsed);
        
        if (!Array.isArray(parsed)) {
          throw new Error(t("adminFoodDB.jsonMustBeArray"));
        }
        importedData = parsed;
        
      } else {
        console.log(`Processing ${fileType.toUpperCase()} file...`);
        importedData = await parseExcelOrCSV(file, fileType);
      }

      console.log(`✅ File processing complete. importedData:`, {
        exists: !!importedData,
        isArray: Array.isArray(importedData),
        length: importedData?.length || 0,
        firstItem: importedData?.[0]
      });
      
      if (!importedData) {
        throw new Error(t("adminFoodDB.noDataReturned"));
      }
      
      if (!Array.isArray(importedData)) {
        throw new Error(`Expected array but got ${typeof importedData}`);
      }
      
      if (importedData.length === 0) {
        throw new Error(t("adminFoodDB.noDataRows"));
      }
      
      await processImportedData(importedData);

    } catch (err) {
      console.error("❌ File processing error:", err);
      alert(`${t("adminFoodDB.fileProcessingError")}: ${err.message}\n\nCheck console for details.`);
    } finally {
      console.log("✅ File processing complete");
      setLoading(false);
      event.target.value = null;
    }
  };

  const parseExcelOrCSV = (file, fileType) => {
    return new Promise((resolve, reject) => {
      console.log(`📄 Starting to parse ${fileType} file: ${file.name}`);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log(`✅ FileReader loaded successfully`);
        console.log(`Result type:`, typeof e.target.result);
        console.log(`Result is ArrayBuffer:`, e.target.result instanceof ArrayBuffer);
        
        try {
          let workbook;
          
          if (fileType === 'csv') {
            const csvData = e.target.result;
            console.log("CSV data length:", csvData.length);
            workbook = XLSX.read(csvData, { type: 'string' });
          } else {
            console.log("Excel file - processing ArrayBuffer");
            
            const arrayBuffer = e.target.result;
            console.log("ArrayBuffer byteLength:", arrayBuffer.byteLength);
            
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error("Empty ArrayBuffer received");
            }
            
            const data = new Uint8Array(arrayBuffer);
            console.log("Uint8Array length:", data.length);
            
            workbook = XLSX.read(data, { type: 'array' });
          }
          
          console.log("Workbook created, SheetNames:", workbook.SheetNames);
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("No worksheets found in the Excel file");
          }
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (!worksheet) {
            throw new Error(`Worksheet "${firstSheetName}" not found`);
          }
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log(`✅ Parsed ${jsonData.length} rows from ${fileType} file`);
          
          if (jsonData.length > 0) {
            console.log("First row keys:", Object.keys(jsonData[0]));
            console.log("First row sample:", jsonData[0]);
          } else {
            console.warn("⚠️ File parsed but contains no data rows (only headers?)");
          }
          
          resolve(jsonData);
          
        } catch (error) {
          console.error(`❌ Failed to parse ${fileType} file:`, error);
          reject(new Error(`Failed to parse ${fileType.toUpperCase()} file: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        console.error("❌ FileReader error event:", error);
        console.error("FileReader error code:", reader.error?.code);
        reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
      };
      
      reader.onabort = () => {
        console.error("❌ FileReader aborted");
        reject(new Error("File reading was aborted"));
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 100);
          console.log(`📊 File loading: ${percentLoaded}%`);
        }
      };
      
      if (fileType === 'csv') {
        console.log("Reading CSV as text...");
        reader.readAsText(file, 'UTF-8');
      } else {
        console.log("Reading Excel as ArrayBuffer...");
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const processImportedData = async (importedData) => {
    if (!importedData || !Array.isArray(importedData)) {
      console.error("❌ Invalid importedData:", importedData);
      throw new Error("File contains no valid data or data is not an array");
    }
    
    if (importedData.length === 0) {
      throw new Error("File contains no data rows");
    }

    const foodItems = importedData
      .map(row => {
        try {
          return mapRowToFoodItem(row);
        } catch (error) {
          console.warn("Failed to map row:", row, error);
          return null;
        }
      })
      .filter(item => item !== null && item.name && item.name.trim() !== "");

    console.log(`✅ Mapped ${foodItems.length} valid items out of ${importedData.length} rows`);

    if (foodItems.length === 0) {
      throw new Error("No valid food items found after mapping");
    }

    console.log("📤 Sending to API:", {
      url: `${API_URL}/api/foods/bulk-import`,
      dataType: typeof foodItems,
      isArray: Array.isArray(foodItems),
      itemCount: foodItems.length,
      firstItemKeys: foodItems[0] ? Object.keys(foodItems[0]) : 'none',
      sampleData: JSON.stringify(foodItems.slice(0, 1), null, 2)
    });

    try {
      const requestBody = foodItems;
      
      console.log("📤 Request body structure:", {
        bodyType: typeof requestBody,
        isArray: Array.isArray(requestBody),
        itemCount: requestBody.length, 
        firstItem: requestBody[0] ? requestBody[0].name : 'none'
      });

      const res = await fetch(`${API_URL}/api/foods/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server responded with error:", res.status, errorText);
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("Import response:", data);
      
      if (data.success) {
        const createdCount = data.results?.foodCreated || data.results?.total || 0;
        alert(t("adminFoodDB.importSuccess", { count: createdCount }));
        fetchFoods();
      } else {
        alert(`${t("adminFoodDB.importFailed")}: ${data.message}`);
      }
      
    } catch (err) {
      console.error("Import error details:", err);
      alert(`${t("adminFoodDB.importError")}: ${err.message}\n\nCheck console for details.`);
    }
  };

  const validateImageUrl = (url) => {
    if (!url || url.trim() === "") {
      return null;
    }
    
    const trimmedUrl = url.trim();
 
    try {
        new URL(trimmedUrl);
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const isImageUrl = imageExtensions.some(ext => 
          trimmedUrl.toLowerCase().includes(ext) || 
          trimmedUrl.includes('/image/') ||
          trimmedUrl.includes('data:image/')
        );
        
        if (!isImageUrl) {
          console.warn(`URL may not be an image: ${trimmedUrl}`);
        }
        
        return trimmedUrl;
    } catch (e) {
      console.warn(`Invalid URL: ${trimmedUrl}`);
      return null;
    }
  };

  const mapRowToFoodItem = (row) => {
    const name = String(row.Name || row.name || "").trim();
    if (!name) throw new Error("Missing required field: Name");

    return {
      name: name,
      origin: String(row.Origin || row.origin || "").trim(),
      category: String(row.Category || row.category || "").trim(),
      difficulty: String(row.Difficulty || row.difficulty || "Medium").trim(),
      dietaryTags: parseFieldToArray(row.DietaryTags || row.dietaryTags || ""),
      foodDescription: String(row.FoodDescription || row.foodDescription || row.Description || row.description || "").trim(), // Food description
      image: validateImageUrl(row.Image || row.image || ""),
      prepTime: Number(row.PrepTime || row.prepTime || 0) || 0,
      culturalSignificance: String(row.CulturalSignificance || row.culturalSignificance || "").trim(),
      traditionalPreparation: String(row.TraditionalPreparation || row.traditionalPreparation || "").trim(),
      commonIngredients: String(row.CommonIngredients || row.commonIngredients || "").trim(),
      healthTips: String(row.HealthTips || row.healthTips || "").trim(),
      Energy_kcal: Number(row.Energy_kcal || row.Calories || 0) || 0,
      Protein_g: Number(row.Protein_g || row.Protein || 0) || 0,
      Fat_g: Number(row.Fat_g || row.Fat || 0) || 0,
      Carbohydrates_g: Number(row.Carbohydrates_g || row.Carbs || 0) || 0,
      Fiber_g: Number(row.Fiber_g || row.Fiber || 0) || 0,
      VitaminC_mg: Number(row.VitaminC_mg || row.VitaminC || 0) || 0,
      recipeName: recipeName,
      ingredients: String(row.Ingredients || row.ingredients || "").trim(),
      steps: String(row.Steps || row.steps || row.Instructions || row.instructions || "").trim(),
      cookTime: Number(row.CookTime || row.cookTime || row.CookingTime || 0) || 0,
      servings: Number(row.Servings || row.servings || 1) || 1,
      recipeDescription: String(row.RecipeDescription || row.recipeDescription || row.Description2 || row.description2 || "").trim(), // Recipe description
      DidYouKnow: String(row.DidYouKnow || row.didYouKnow || "").trim(),
      chefTips: String(row.ChefTips || row.chefTips || "").trim()
    };
  };

  const parseFieldToArray = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      return field.split(/[,;\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    return [String(field)];
  };

  const showImportResults = (successCount, failedCount, failedItems) => {
    if (failedCount === 0) {
      alert(t("adminFoodDB.importSuccessSimple", { count: successCount }));
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

  const downloadTemplate = () => {
    const templateData = [
      ["Name", "Origin", "Category", "Difficulty", "DietaryTags", 
       "FoodDescription", "Image", "PrepTime", "CulturalSignificance", 
       "TraditionalPreparation", "CommonIngredients", "HealthTips", 
       "Energy_kcal", "Protein_g", "Fat_g", 
       "Carbohydrates_g", "Fiber_g", "VitaminC_mg", "RecipeName",
       "RecipeDescription", "Ingredients", "Steps", "CookTime", "Servings", "DidYouKnow", "ChefTips"],
      ["* REQUIRED: Food name", "* REQUIRED: Enum: e.g. Malay, Chinese, Iban (or refer to the instructions)", 
       "* REQUIRED: e.g., Rice Dish, Noodls, Meat (or refer to the instructions)",
       "* REQUIRED: Enum: Easy, Medium, Hard", "Separate with commas: e.g., Vegetarian, Gluten Free (or refer to the instructions)", 
       "* REQUIRED: Brief food description", "* REQUIRED: Image URL", 
       "* REQUIRED: Minutes (number only)", "Optional cultural info", 
       "Optional traditional methods", "Separate with commas: e.g., first, second", 
       "Optional health advice", "* REQUIRED: Calories (number)", 
       "* REQUIRED: Protein in grams", "* REQUIRED: Fat in grams", 
       "* REQUIRED: Carbs in grams", "* REQUIRED: Fiber in grams", 
       "* REQUIRED: Vitamin C in mg",
       "* REQUIRED: Recipe name like Grandma's Traditional Sarawak Laksa",
       "* REQUIRED: Recipe description",
       "* REQUIRED: Number ingerdients like: 1. First ingredient\n2. Second ingredient", 
       "* REQUIRED: Number steps like: 1. First step\n2. Second step", 
       "* REQUIRED: Minutes (number)", 
       "* REQUIRED: Number of servings (number)", 
       "Optional fun fact", 
       "Optional chef tips"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({r: 0, c: C});
      if (!ws[headerCell]) ws[headerCell] = {};
      ws[headerCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4CAF50" } }
      };
    }
    
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const instructionCell = XLSX.utils.encode_cell({r: 1, c: C});
      if (!ws[instructionCell]) ws[instructionCell] = {};
      ws[instructionCell].s = {
        font: { italic: true, color: { rgb: "666666" } },
        fill: { fgColor: { rgb: "F5F5F5" } }
      };
    }
    
    for (let R = 2; R <= 3; ++R) {
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const exampleCell = XLSX.utils.encode_cell({r: R, c: C});
        if (!ws[exampleCell]) ws[exampleCell] = {};
        ws[exampleCell].s = {
          fill: { fgColor: { rgb: "E8F4F8" } }
        };
      }
    }
    
    const colWidths = [
      {wch: 30}, {wch: 70}, {wch: 70}, {wch: 50}, {wch: 70},
      {wch: 40}, {wch: 40}, {wch: 40}, {wch: 40}, {wch: 40}, {wch: 40},
      {wch: 40}, {wch: 30}, {wch: 30}, {wch: 30},
      {wch: 30}, {wch: 30}, {wch: 30}, {wch: 40}, {wch: 40},
      {wch: 60}, {wch: 60}, {wch: 30}, {wch: 40}, {wch: 30}, {wch: 30}
    ];
    ws['!cols'] = colWidths;
   
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Food Import Template");
    
    const instructionData = [
      ["FOOD IMPORT TEMPLATE - INSTRUCTIONS"],
      [""],
      ["FIELD REQUIREMENTS:"],
      ["• Fields marked with * are REQUIRED"],
      [""],
      ["ENUM FIELDS (Must use exact values):"],
      ["• Origin: Malay, Chinese, Iban, Melanau, Kadazan, Bidayuh, Dayak"],
      ["• Difficulty: Easy, Medium, Hard"],
      ["• Category: Typically Poultry, Seafood, Vegetables, Fermented, Dessert, Rice Dish, Noodles, Soup, Meat"],
      [""],
      ["FORMATTING TIPS:"],
      ["• Recipe name: Can type any custom recipe name they want (e.g. Vegetarian Sarawak Laksa or Aunty Mary's Kolo Mee.)"],
      ["• Ingredients: Number each ingredient (1. Ingredient one, 2. Ingredient two, etc.)"],
      ["• Steps: Number each step (1. Step one, 2. Step two, etc.)"],
      ["• DietaryTags: Separate multiple tags with commas (Typically Vegetarian, Dairy Free, Paleo, Keto, Gluten Free, Spicy, Halal, Nut Free)"],
      ["• Image: Use direct image URLs (ending with .jpg, .png, etc.)"],
      ["• PrepTime & CookTime: Numbers only (minutes)"],
      ["• Servings: Numbers only"],
      ["• Nutritional info: Numbers only (grams or mg)"],
      [""],
      ["IMPORTANT NOTES:"],
      ["• Each row creates ONE food with ONE recipe"],
      ["• FoodDescription goes to the FOOD table (general food information)"],
      ["• RecipeDescription goes to the RECIPE table (preparation instructions)"],
      ["• Recipe will be automatically APPROVED for admin imports"],
      ["• Save this file as .xlsx or .csv before importing"]
    ];
    
    const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);
    
    for (let R = 0; R < instructionData.length; R++) {
      for (let C = 0; C < instructionData[R].length; C++) {
        const cell = XLSX.utils.encode_cell({r: R, c: C});
        if (!instructionWs[cell]) instructionWs[cell] = {};
        if (R === 0) {
          instructionWs[cell].s = { font: { bold: true, sz: 16, color: { rgb: "2E7D32" } } };
        }
        if (instructionData[R][0] && instructionData[R][0].includes(":")) {
          instructionWs[cell].s = { font: { bold: true, color: { rgb: "1565C0" } } };
        }
        if (instructionData[R][0] && instructionData[R][0].startsWith("•")) {
          instructionWs[cell].s = { font: { color: { rgb: "424242" } } };
        }
      }
    }
    
    instructionWs['!cols'] = [{wch: 80}];
    XLSX.utils.book_append_sheet(wb, instructionWs, "Instructions");
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
    const matchesCalories = foodCalories <= calorieMax;
    
    return matchesSearch && matchesCategory && matchesOrigin && matchesCalories;
  });

  // --- Pagination Logic ---
  const indexOfLast = currentPage * foodsPerPage;
  const indexOfFirst = indexOfLast - foodsPerPage;
  const currentFoods = filteredFoods.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredFoods.length / foodsPerPage);

  if (loading) {
    return <p style={{ textAlign: "center" }}>{t("adminFoodDB.loading")}</p>;
  }

  const originOptions = ["All Origins", "Malay", "Chinese", "Iban", "Melanau", "Kadazan", "Bidayuh", "Dayak"];

  return (
    <div 
      className="food-database-section" 
      style={{ 
        backgroundColor: "white", 
        minHeight: showFilters ? "850px" : "600px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        transition: "min-height 0.3s ease"
      }}
    >
      <div>
        <div className="food-header">
          <h2>
            <span className="food-icon"><FiDatabase /></span> {t("adminFoodDB.sectionTitle")}
          </h2>
          <div className="food-actions">
            <button
              className="admin-food-btn-add"
              onClick={() => setShowAddOptionsModal(true)}
            >
              <FaPlus /> {t("adminFoodDB.addNewFood")}
            </button>
            <button className="admin-food-btn-import" onClick={handleImportClick}>
              <MdOutlineFileUpload /> <span>{t("adminFoodDB.bulkImport")}</span>
            </button>
            <button 
              className="admin-food-btn-template"
              onClick={downloadTemplate}
            >
              <FiDatabase /> <span>{t("adminFoodDB.downloadTemplate")}</span>
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

        <div className="food-filters">
          <div className="search-box">
            <CiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={t("adminFoodDB.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={`admin-beige-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <button className="admin-beige-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span>{category}</span>
              <FiChevronDown className={`admin-dropdown-arrow ${dropdownOpen ? "rotate" : ""}`} />
            </button>
            {dropdownOpen && (
              <ul className="admin-dropdown-menu">
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
                    <span className="option-text">{opt}</span>
                    {opt === category && <span className="tick">✓</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="admin-food-btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <CiFilter /> <span>{t("explore.filters")}</span>
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <div className="advanced-filters-header">
              <CiFilter /> {t("adminFoodDB.advancedFilters", "Advanced Filters")}
            </div>
            
            <div className="advanced-filters-body">
              <div className="filter-item">
                <label>{t("explore.culturalOrigin", "Cultural Origin")}</label>
                <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)}>
                  {originOptions.map((origin) => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>{t("explore.difficulty", "Difficulty")}</label>
                <select>
                  <option value="All">{t("adminFoodDB.all", "All")}</option>
                  <option value="Easy">{t("explore.easy", "Easy")}</option>
                  <option value="Medium">{t("explore.medium", "Medium")}</option>
                  <option value="Hard">{t("explore.hard", "Hard")}</option>
                </select>
              </div>

              <div className="filter-item calorie-filter">
                <label>Max Calories: {calorieMax}</label>
                <div className="food-database-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="10" 
                    value={calorieMax} 
                    onChange={(e) => setCalorieMax(Number(e.target.value))} 
                    style={{ width: "100%", cursor: "pointer", accentColor: "#916848" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <table className="food-table">
          <thead>
            <tr>
              <th>{t("adminFoodDB.colFoodName")}</th>
              <th>{t("adminFoodDB.colCategory")}</th>
              <th>{t("adminFoodDB.colOrigin")}</th>
              <th>{t("adminFoodDB.colLastUpdated")}</th>
              <th>{t("adminFoodDB.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {currentFoods.map((food) => (
              <tr key={food.foodID}>
                <td data-label={t("adminFoodDB.colFoodName")}>{food.name}</td>
                <td data-label={t("adminFoodDB.colCategory")}><span className="category-tag">{food.category}</span></td>
                <td data-label={t("adminFoodDB.colOrigin")}>{food.origin}</td>
                <td data-label={t("adminFoodDB.colLastUpdated")}>{food.lastUpdated ? new Date(food.lastUpdated).toLocaleString() : "—"}</td>
                <td data-label={t("adminFoodDB.colActions")}>
                  <button className="food-database-btn-edit" onClick={() => navigate(`/admin/editfood/${food.foodID}`)}><HiOutlinePencilAlt /></button>
                  <button className="food-database-btn-delete" onClick={() => handleDeleteClick(food)}><RiDeleteBin5Line /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>{t("adminFoodDB.deleteWarningTitle")}</h3>
            <p>
              {t("adminFoodDB.deleteWarningMsg", { name: selectedFood?.name })}
              <br />{t("adminFoodDB.deleteCannotUndo")}
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>{t("adminFoodDB.cancel")}</button>
              <button className="confirm-delete-btn" onClick={handleConfirmDelete}>{t("adminFoodDB.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {showAddOptionsModal && (
        <div className="modal-overlay" onClick={() => setShowAddOptionsModal(false)}>
          <div className="add-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-options-header">
              <h3>{t("adminFoodDB.addFoodOptionsTitle")}</h3>
              <button className="add-options-close" onClick={() => setShowAddOptionsModal(false)}>×</button>
            </div>

            <div className="add-options-body">
              <div 
                className="add-option-card"
                onClick={() => navigate("/admin/addfood")}
              >
                <div className="add-option-icon">📝</div>
                <div className="add-option-text">
                  <h4>{t("adminFoodDB.addNewFood")}</h4>
                  <p>{t("adminFoodDB.addNewFoodDesc")}</p>
                </div>
              </div>

              <div 
                className="add-option-card"
                onClick={() => {
                  setShowAddOptionsModal(false);
                  navigate("/admin/linkfood"); 
                }}
              >
                <div className="add-option-icon">🔗</div>
                <div className="add-option-text">
                  <h4>{t("adminFoodDB.useExistingRecipe")}</h4>
                  <p>{t("adminFoodDB.useExistingRecipeDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination fdt-pagination">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>‹ {t("explore.prev")}</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active" : ""}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>{t("explore.next")} ›</button>
        </div>
      )}
    </div>
  );
};

export default AdminFoodDatabase;