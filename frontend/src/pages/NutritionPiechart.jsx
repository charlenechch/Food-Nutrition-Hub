import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function NutritionPieChart({ nutrition }) {
  // Safely convert values to numbers
  const protein = Number(nutrition?.Protein_g) || 0;
  const fat = Number(nutrition?.Fat_g) || 0;
  const carbs = Number(nutrition?.Carbohydrates_g) || 0;
  const fiber = Number(nutrition?.Fiber_g) || 0;
  const vitaminCmg = Number(nutrition?.VitaminC_mg) || 0;
  
  // Convert Vitamin C from mg to g for consistent units
  const vitaminCGrams = vitaminCmg / 1000;
  
  // Calculate total grams for percentages
  const totalGrams = protein + fat + carbs + fiber + vitaminCGrams;
  
  // Soft rainbow colors
  const chartData = {
    labels: ['Protein', 'Fat', 'Carbs', 'Fiber', 'Vitamin C'],
    datasets: [
      {
        data: [
          protein,
          fat,
          carbs,
          fiber,
          vitaminCGrams
        ],
        backgroundColor: [
        'rgba(255, 99, 71, 0.8)',  
        'rgba(255, 165, 0, 0.8)',    
        'rgba(255, 255, 0, 0.8)',    
        'rgba(144, 238, 144, 0.8)',  
        'rgba(112, 164, 182, 0.8)',  
        ],
        borderColor: [
        'rgba(255, 99, 71, 1)',
        'rgba(255, 165, 0, 1)',
        'rgba(255, 255, 0, 1)',
        'rgba(144, 238, 144, 1)',
        'rgba(112, 164, 182, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = Number(context.raw) || 0;
            const percentage = ((value / totalGrams) * 100).toFixed(1);
            
            if (label === 'Vitamin C') {
              return `${label}: ${(value * 1000).toFixed(2)}mg (${percentage}%)`;
            } else {
              return `${label}: ${value.toFixed(2)}g (${percentage}%)`;
            }
          },
        },
      },
      legend: {
        position: 'right', 
        align: 'center',
        labels: {
          font: { size: 11 },
          boxWidth: 15,
          padding: 15,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const total = datasets[0].data.reduce((a, b) => a + b, 0);
            
            return chart.data.labels.map((label, i) => {
              const value = datasets[0].data[i];
              const percentage = ((value / total) * 100).toFixed(1);
              
              let displayText = '';
              if (label === 'Vitamin C') {
                displayText = `${label}: ${percentage}%`;
              } else {
                displayText = `${label}: ${percentage}%`;
              }
              
              return {
                text: displayText,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: datasets[0].borderColor[i],
                lineWidth: 1,
                hidden: false,
                index: i
              };
            });
          }
        },
      },
    },
  };

  if (totalGrams === 0) {
    return (
      <div className="pie-chart-placeholder">
        <p>No nutrition data available</p>
      </div>
    );
  }

  return (
    <div className="pie-chart-container">
      <Pie data={chartData} options={options} />
    </div>
  );
}