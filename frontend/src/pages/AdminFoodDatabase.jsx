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
      // Fallback to empty array
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

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['xlsx', 'xls', 'csv', 'json'];
    
    if (!allowedTypes.includes(fileType)) {
      alert("Please select an Excel (.xlsx, .xls), CSV, or JSON file");
      event.target.value = null;
      return;
    }

    console.log(`📁 Processing file: ${file.name} (${fileType}, ${file.size} bytes)`);
  
    if (file.size === 0) {
      alert("File is empty!");
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
        throw new Error("JSON file must contain an array of food items");
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
      throw new Error("File parsing returned no data");
    }
    
    if (!Array.isArray(importedData)) {
      throw new Error(`Expected array but got ${typeof importedData}`);
    }
    
    if (importedData.length === 0) {
      throw new Error("File contains no data rows. Make sure your Excel has data beyond the header row.");
    }
    
    // Validate and process the data
    await processImportedData(importedData);

  } catch (err) {
    console.error("❌ File processing error:", err);
    alert(`Error processing file: ${err.message}\n\nCheck console for details.`);
  } finally {
    console.log("✅ File processing complete");
    setLoading(false);
    event.target.value = null;
  }
};

  // Function to parse Excel/CSV files
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
            // Handle CSV
            const csvData = e.target.result;
            console.log("CSV data length:", csvData.length);
            workbook = XLSX.read(csvData, { type: 'string' });
          } else {
            // Handle Excel (xlsx, xls)
            console.log("Excel file - processing ArrayBuffer");
            
            // Convert ArrayBuffer to Uint8Array properly
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
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (!worksheet) {
            throw new Error(`Worksheet "${firstSheetName}" not found`);
          }
          
          // Convert to JSON
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
      
      // Add progress event for debugging
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 100);
          console.log(`📊 File loading: ${percentLoaded}%`);
        }
      };
      
      // Read the file based on type
      if (fileType === 'csv') {
        console.log("Reading CSV as text...");
        reader.readAsText(file, 'UTF-8');
      } else {
        console.log("Reading Excel as ArrayBuffer...");
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Function to process and validate imported data
  const processImportedData = async (importedData) => {
    if (!importedData || !Array.isArray(importedData)) {
      console.error("❌ Invalid importedData:", importedData);
      throw new Error("File contains no valid data or data is not an array");
    }
    
    if (importedData.length === 0) {
      throw new Error("File contains no data rows");
    }

    // Map all rows to food items
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

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server responded with error:", res.status, errorText);
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }

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
      console.error("Import error details:", err);
      alert(`Import error: ${err.message}\n\nCheck console for details.`);
    }
  };

  const validateImageUrl = (url) => {
    if (!url || url.trim() === "") {
      return null;
    }
    
    const trimmedUrl = url.trim();
 
    try {
        // Try to create a URL object
        new URL(trimmedUrl);
        
        // Additional checks for common image URL patterns
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
        console.warn(`Invalid URL format: ${trimmedUrl}`);
      if (trimmedUrl.startsWith('/')) {
        const baseUrl = window.location.origin;
        return `${baseUrl}${trimmedUrl}`;
      }
      if (trimmedUrl.startsWith('www.')) {
        return `https://${trimmedUrl}`;
      }
      return null;
    }
  };

  // Map Excel/CSV columns to your backend schema 
  const mapRowToFoodItem = (row) => {
    // Ensure row is an object
    if (!row || typeof row !== 'object') {
      console.warn("Invalid row:", row);
      return null;
    }

    // Validate Cloudinary image URL
    const rawImageUrl = String(row.Image || row.image || "").trim();
    const validatedImageUrl = validateImageUrl(rawImageUrl);
    
    // If invalid or empty, use Cloudinary placeholder
    let finalImageUrl;
    if (!validatedImageUrl) {
      const foodName = String(row.Name || row.name || "Food").trim();
      const encodedName = encodeURIComponent(foodName.substring(0, 30));
   
      finalImageUrl = `https://placehold.co/600x400/f8f8f8/333333?text=${encodedName}&font=roboto`;

      console.log(`Using placeholder for "${foodName}"`);
    } else {
      finalImageUrl = validatedImageUrl;
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
      image: finalImageUrl,
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
     "Ingredients", "Steps", "CookTime", "Servings", "DidYouKnow", "ChefTips"],

     // INSTRUCTION ROW (Formats and examples)
    ["* REQUIRED: Food name", "* REQUIRED: Enum: Malay, Chinese, Iban, Melanau, Kadazan, Bidayuh, Dayak", 
     "* REQUIRED: e.g., Main Dish", "* REQUIRED: e.g., Appetizer, Main, Dessert", 
     "* REQUIRED: Enum: Easy, Medium, Hard", "Separate with commas: e.g., Vegetarian, Gluten-Free", 
     "* REQUIRED: Brief description", "* REQUIRED: Image URL", 
     "* REQUIRED: Minutes (number only)", "Optional cultural info", 
     "Optional traditional methods", "Optional: Common ingredients list", 
     "Optional alternative name", "Optional alternative description", 
     "Optional health advice", "* REQUIRED: Calories (number)", 
     "* REQUIRED: Protein in grams", "* REQUIRED: Fat in grams", 
     "* REQUIRED: Carbs in grams", "* REQUIRED: Fiber in grams", 
     "* REQUIRED: Vitamin C in mg",
     
     // RECIPE INSTRUCTIONS
     "* REQUIRED: Each ingredient on new line or separated by '|'", 
     "* REQUIRED: Number steps like: 1. First step\n2. Second step", 
     "* REQUIRED: Minutes (number)", 
     "* REQUIRED: Number of servings (number)", 
     "Optional fun fact", 
     "Optional chef tips"]
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  // Header row formatting
  const headerRange = XLSX.utils.decode_range(ws['!ref']);
  
  // Make header row bold and colored
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const headerCell = XLSX.utils.encode_cell({r: 0, c: C});
    if (!ws[headerCell]) ws[headerCell] = {};
    ws[headerCell].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4CAF50" } } // Green background
    };
  }
  
  // Instruction row formatting (gray background)
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const instructionCell = XLSX.utils.encode_cell({r: 1, c: C});
    if (!ws[instructionCell]) ws[instructionCell] = {};
    ws[instructionCell].s = {
      font: { italic: true, color: { rgb: "666666" } },
      fill: { fgColor: { rgb: "F5F5F5" } } // Light gray
    };
  }
  
  // Example rows formatting (light blue)
  for (let R = 2; R <= 3; ++R) {
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const exampleCell = XLSX.utils.encode_cell({r: R, c: C});
      if (!ws[exampleCell]) ws[exampleCell] = {};
      ws[exampleCell].s = {
        fill: { fgColor: { rgb: "E8F4F8" } } // Light blue
      };
    }
  }
  
  // Set column widths for better readability
  const colWidths = [
    {wch: 25}, {wch: 50}, {wch: 30}, {wch: 50}, {wch: 40}, {wch: 50},
    {wch: 30}, {wch: 40}, {wch: 20}, {wch: 25}, {wch: 30}, {wch: 30},
    {wch: 30}, {wch: 30}, {wch: 30}, {wch: 30}, {wch: 30}, {wch: 30},
    {wch: 15}, {wch: 20}, {wch: 30},
    {wch: 60}, {wch: 60}, {wch: 30}, {wch: 30}, {wch: 30}, {wch: 30}
  ];
  ws['!cols'] = colWidths;
 
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Food Import Template");
  
  // Add an instruction sheet
  const instructionData = [
    ["FOOD IMPORT TEMPLATE - INSTRUCTIONS"],
    [""],
    ["FIELD REQUIREMENTS:"],
    ["• Fields marked with * are REQUIRED"],
    [""],
    ["ENUM FIELDS (Must use exact values):"],
    ["• Origin: Malay, Chinese, Iban, Melanau, Kadazan, Bidayuh, Dayak"],
    ["• Difficulty: Easy, Medium, Hard"],
    ["• FoodType: Typically Appetizer, Main Dish, Dessert, Snack, Drink"],
    [""],
    ["FORMATTING TIPS:"],
    ["• Ingredients: Separate with '|' or new lines (will be converted to list)"],
    ["• Steps: Number each step (1. Step one, 2. Step two, etc.)"],
    ["• DietaryTags: Separate multiple tags with commas"],
    ["• Image: Use direct image URLs (ending with .jpg, .png, etc.)"],
    ["• PrepTime & CookTime: Numbers only (minutes)"],
    ["• Servings: Numbers only"],
    ["• Nutritional info: Numbers only (grams or mg)"],
    [""],
    ["IMPORTANT NOTES:"],
    ["• Each row creates ONE food with ONE recipe"],
    ["• Recipe will be automatically APPROVED for admin imports"],
    ["• Save this file as .xlsx or .csv before importing"]
  ];
  
  const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);
  
  // Format instruction sheet
  for (let R = 0; R < instructionData.length; R++) {
    for (let C = 0; C < instructionData[R].length; C++) {
      const cell = XLSX.utils.encode_cell({r: R, c: C});
      if (!instructionWs[cell]) instructionWs[cell] = {};
      
      // Title formatting
      if (R === 0) {
        instructionWs[cell].s = {
          font: { bold: true, sz: 16, color: { rgb: "2E7D32" } }
        };
      }
      
      // Section headers
      if (instructionData[R][0] && instructionData[R][0].includes(":")) {
        instructionWs[cell].s = {
          font: { bold: true, color: { rgb: "1565C0" } }
        };
      }
      
      // Bullet points
      if (instructionData[R][0] && instructionData[R][0].startsWith("•")) {
        instructionWs[cell].s = {
          font: { color: { rgb: "424242" } }
        };
      }
    }
  }
  
  // Set column width for instruction sheet
  instructionWs['!cols'] = [{wch: 80}];
  
  XLSX.utils.book_append_sheet(wb, instructionWs, "Instructions");
  
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
          <div className="food-actions" style={{
            display: "flex",
            gap: "10px",  
            alignItems: "center", 
            flexWrap: "wrap"  
          }}>
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
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
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
            <CiFilter /> Filters
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