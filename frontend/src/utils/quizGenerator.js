import { mockFoods } from '../data/mockFoods';
import { mockAdminQuestions } from '../data/mockAdminQuestions';

const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

const getDistractors = (correctValue, field) => {
  return shuffle(mockFoods.filter(f => f[field] !== correctValue))
    .slice(0, 3)
    .map(f => f[field]);
};

export const generateDailyQuiz = () => {
  const quiz = [];
  
  const adminQ = shuffle(mockAdminQuestions)[0];
  const linkedFood = mockFoods.find(f => f.foodID === adminQ.foodID);
  
  quiz.push({
    ...adminQ,
    image: linkedFood.image 
  });

  const dynamicFoods = shuffle(mockFoods.filter(f => f.foodID !== linkedFood.foodID)).slice(0, 4);

  quiz.push({
    id: `dyn_1_${dynamicFoods[0].foodID}`,
    foodID: dynamicFoods[0].foodID,
    image: dynamicFoods[0].image,
    question: "What dish is shown in this picture?",
    correctAnswer: dynamicFoods[0].name,
    options: shuffle([dynamicFoods[0].name, ...getDistractors(dynamicFoods[0].name, 'name')]),
    explanation: dynamicFoods[0].description
  });

  quiz.push({
    id: `dyn_2_${dynamicFoods[1].foodID}`,
    foodID: dynamicFoods[1].foodID,
    image: dynamicFoods[1].image,
    question: `What is the cultural origin of ${dynamicFoods[1].name}?`,
    correctAnswer: dynamicFoods[1].origin,
    options: shuffle([dynamicFoods[1].origin, ...getDistractors(dynamicFoods[1].origin, 'origin')]),
    explanation: `${dynamicFoods[1].name} originates from the ${dynamicFoods[1].origin} community.`
  });

  quiz.push({
    id: `dyn_3_${dynamicFoods[2].foodID}`,
    foodID: dynamicFoods[2].foodID,
    image: dynamicFoods[2].image,
    question: `Roughly how many calories are in a standard serving of ${dynamicFoods[2].name}?`,
    correctAnswer: `${dynamicFoods[2].Energy_kcal} kcal`,
    options: shuffle([
      `${dynamicFoods[2].Energy_kcal} kcal`, 
      `${Math.round(dynamicFoods[2].Energy_kcal * 0.5)} kcal`, 
      `${Math.round(dynamicFoods[2].Energy_kcal * 1.5)} kcal`, 
      `${Math.round(dynamicFoods[2].Energy_kcal * 2)} kcal`
    ]), 
    explanation: `A standard serving contains approximately ${dynamicFoods[2].Energy_kcal} calories.`
  });

  const correctIngredient = dynamicFoods[3].commonIngredients.split(',')[0].trim();
  
  const fakeIngredients = shuffle(mockFoods.filter(f => f.foodID !== dynamicFoods[3].foodID))
    .slice(0, 3)
    .map(f => f.commonIngredients.split(',')[0].trim());

  quiz.push({
    id: `dyn_4_${dynamicFoods[3].foodID}`,
    foodID: dynamicFoods[3].foodID,
    image: dynamicFoods[3].image,
    question: `Which of these is a primary ingredient in ${dynamicFoods[3].name}?`,
    correctAnswer: correctIngredient,
    options: shuffle([correctIngredient, ...fakeIngredients]),
    explanation: `The key ingredient that makes this dish special is ${correctIngredient}!`
  });

  return shuffle(quiz);
};