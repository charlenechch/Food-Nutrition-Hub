import { mockFoods } from '../data/mockFoods';
import { mockAdminQuestions } from '../data/mockAdminQuestions';

const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

const getDistractors = (correctValue, field) => {

  const uniqueValues = [...new Set(mockFoods.map(f => f[field]))];
  
  return shuffle(uniqueValues.filter(val => val !== correctValue)).slice(0, 3);
};

export const generateDailyQuiz = () => {
  const quiz = [];
  
  const selectedFoods = shuffle(mockFoods).slice(0, 5);

  selectedFoods.forEach((food, index) => {
    
    const adminQ = mockAdminQuestions.find(q => q.foodID === food.foodID);

    const availableFormats = ['visual', 'culture', 'nutrition', 'ingredients'];
    
    if (adminQ) {
      availableFormats.push('admin');
    }

    const chosenFormat = shuffle(availableFormats)[0];

    if (chosenFormat === 'admin') {
      quiz.push({
        ...adminQ,
        id: `q_${index}_${food.foodID}`,
        image: food.image,
        foodName: food.name,
        foodOrigin: food.origin
      });
      
    } else if (chosenFormat === 'visual') {
      quiz.push({
        id: `q_${index}_${food.foodID}`,
        foodID: food.foodID,
        image: food.image,
        foodName: food.name,
        foodOrigin: food.origin,
        question: "What dish is shown in this picture?",
        correctAnswer: food.name,
        options: shuffle([food.name, ...getDistractors(food.name, 'name')]),
        explanation: food.description 
      });
      
    } else if (chosenFormat === 'culture') {
      quiz.push({
        id: `q_${index}_${food.foodID}`,
        foodID: food.foodID,
        image: food.image,
        foodName: food.name,
        foodOrigin: food.origin,
        question: `What is the cultural origin of ${food.name}?`,
        correctAnswer: food.origin,
        options: shuffle([food.origin, ...getDistractors(food.origin, 'origin')]),
        explanation: food.description 
      });
      
    } else if (chosenFormat === 'nutrition') {
      quiz.push({
        id: `q_${index}_${food.foodID}`,
        foodID: food.foodID,
        image: food.image,
        foodName: food.name,
        foodOrigin: food.origin,
        question: `Roughly how many calories are in a standard serving of ${food.name}?`,
        correctAnswer: `${food.Energy_kcal} kcal`,
        options: shuffle([
          `${food.Energy_kcal} kcal`, 
          `${Math.round(food.Energy_kcal * 0.5)} kcal`, 
          `${Math.round(food.Energy_kcal * 1.5)} kcal`, 
          `${Math.round(food.Energy_kcal * 2)} kcal`
        ]),
        explanation: food.description 
      });
      
    } else if (chosenFormat === 'ingredients') {
      const correctIngredient = food.commonIngredients.split(',')[0].trim();
      
      const allUniqueIngredients = [...new Set(mockFoods.map(f => f.commonIngredients.split(',')[0].trim()))];
      
      const fakeIngredients = shuffle(allUniqueIngredients.filter(ing => ing !== correctIngredient)).slice(0, 3);

      quiz.push({
        id: `q_${index}_${food.foodID}`,
        foodID: food.foodID,
        image: food.image,
        foodName: food.name,
        foodOrigin: food.origin,
        question: `Which of these is a primary ingredient in ${food.name}?`,
        correctAnswer: correctIngredient,
        options: shuffle([correctIngredient, ...fakeIngredients]),
        explanation: food.description 
      });
    }
  });

  return quiz;
};