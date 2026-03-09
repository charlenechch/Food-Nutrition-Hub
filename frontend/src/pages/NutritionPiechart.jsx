import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function NutritionPieChart({ nutrition }) {
  // Convert Vitamin C from mg to g for consistent units
  const vitaminCGrams = (nutrition.VitaminC_mg || 0) / 1000;
  
  // Prepare data with all nutrients 
  const chartData = {
    labels: ['Protein', 'Fat', 'Carbs', 'Fiber', 'Vitamin C'],
    datasets: [
      {
        data: [
          nutrition.Protein_g || 0,
          nutrition.Fat_g || 0,
          nutrition.Carbohydrates_g || 0,
          nutrition.Fiber_g || 0,
          vitaminCGrams // Converted to grams for consistency
        ],
        backgroundColor: [
        'rgba(94, 129, 87, 0.8)',    // Basil Green for Protein
        'rgba(222, 184, 125, 0.8)',  // Turmeric Yellow for Fat
        'rgba(176, 136, 96, 0.8)',   // Cinnamon Brown for Carbs
        'rgba(143, 114, 83, 0.8)',   // Clove Brown for Fiber
        'rgba(233, 150, 86, 0.8)',   // Paprika Orange for Vitamin C
        ],
        borderColor: [
        'rgba(94, 129, 87, 1)',
        'rgba(222, 184, 125, 1)',
        'rgba(176, 136, 96, 1)',
        'rgba(143, 114, 83, 1)',
        'rgba(233, 150, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11 },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => {
              const value = datasets[0].data[i];
              let displayValue = value;
              let unit = 'g';
              
              // Special handling for Vitamin C (show in mg)
              if (label === 'Vitamin C') {
                displayValue = (value * 1000).toFixed(2); // Convert back to mg
                unit = 'mg';
              }
              
              return {
                text: `${label}: ${displayValue}${unit}`,
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
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            
            // Show Vitamin C in mg, others in g
            if (label === 'Vitamin C') {
              return `${label}: ${(value * 1000).toFixed(2)}mg`;
            } else {
              return `${label}: ${value.toFixed(2)}g`;
            }
          },
        },
      },
    },
  };

  // Calculate total grams (excluding Vitamin C which is in mg)
  const totalGrams = (nutrition.Protein_g || 0) + 
                     (nutrition.Fat_g || 0) + 
                     (nutrition.Carbohydrates_g || 0) + 
                     (nutrition.Fiber_g || 0);
  
  // Show Vitamin C separately
  const vitaminCmg = nutrition.VitaminC_mg || 0;

  if (totalGrams === 0 && vitaminCmg === 0) {
    return (
      <div className="pie-chart-placeholder">
        <p>No nutrition data available</p>
      </div>
    );
  }

  return (
    <div className="pie-chart-container">
      <Pie data={chartData} options={options} />
      <div className="pie-chart-totals">
        <div className="pie-chart-total">
          Total Mass: {totalGrams.toFixed(2)}g
        </div>
        {vitaminCmg > 0 && (
          <div className="pie-chart-vitamin">
            Vitamin C: {vitaminCmg.toFixed(2)}mg
          </div>
        )}
      </div>
    </div>
  );
}