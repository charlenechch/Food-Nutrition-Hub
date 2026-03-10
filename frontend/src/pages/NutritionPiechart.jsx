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
  
  const vitaminCForChart = vitaminCmg; // Use mg for the pie chart
  
  // For protein, fat, carbs, fiber: convert to mg as well for consistency
  // (1g = 1000mg)
  const proteinMg = protein * 1000;
  const fatMg = fat * 1000;
  const carbsMg = carbs * 1000;
  const fiberMg = fiber * 1000;
  
  // Calculate total in mg for percentages
  const totalMg = proteinMg + fatMg + carbsMg + fiberMg + vitaminCForChart;
  
  const chartData = {
    labels: ['Protein', 'Fat', 'Carbs', 'Fiber', 'Vitamin C'],
    datasets: [
      {
        data: [
          proteinMg,
          fatMg,
          carbsMg,
          fiberMg,
          vitaminCForChart
        ],
        backgroundColor: [
          'rgba(239, 71, 111, 0.9)',   // Protein - pink/red
          'rgba(255, 159, 28, 0.9)',    // Fat - orange
          'rgba(255, 209, 102, 0.9)',   // Carbs - yellow
          'rgba(6, 214, 160, 0.9)',     // Fiber - green
          'rgba(17, 138, 178, 0.9)',    // Vitamin C - blue
        ],
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 0.5,
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
            const valueMg = Number(context.raw) || 0;
            const percentage = ((valueMg / totalMg) * 100).toFixed(1);
            
            if (label === 'Vitamin C') {
              return `${label}: ${valueMg.toFixed(2)}mg (${percentage}%)`;
            } else {
              // Convert back to grams for display
              const valueG = (valueMg / 1000).toFixed(2);
              return `${label}: ${valueG}g (${percentage}%)`;
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

  if (totalMg === 0) {
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