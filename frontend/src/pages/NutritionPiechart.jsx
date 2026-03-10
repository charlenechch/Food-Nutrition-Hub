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
        'rgba(239, 71, 111, 0.9)',   
        'rgba(255, 159, 28, 0.9)', 
        'rgba(255, 209, 102, 0.9)', 
        'rgba(6, 214, 160, 0.9)',   
        'rgba(17, 138, 178, 0.9)',  
        ],
        borderColor: 'rgba(255, 255, 255, 1)',
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
          font: { size: 12, weight: 'bold' },
          boxWidth: 20,
          padding: 20,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            
            return chart.data.labels.map((label, i) => {
              return {
                text: label, 
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