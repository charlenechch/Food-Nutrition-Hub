// src/pages/PieChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data, width = 500, height = 350 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
      console.log('No data provided to PieChart');
      return;
    }

    console.log('PieChart received data:', data);

    d3.select(svgRef.current).selectAll('*').remove();

    const chartHeight = height - 100; // More space for legend
    const radius = Math.min(width, chartHeight) / 2;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${chartHeight / 2})`);

    // Use Tableau10 color scheme
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(d3.schemeTableau10);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 10);

    // Create arcs
    const arcs = chartGroup.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw arcs
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('stroke-width', 0.5);

        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'pie-tooltip')
          .style('position', 'fixed')
          .style('background', 'rgba(255, 255, 255, 0.95)')
          .style('padding', '12px')
          .style('border-radius', '6px')
          .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
          .style('pointer-events', 'none')
          .style('font-size', '12px')
          .style('font-family', 'Arial, sans-serif')
          .style('border', '1px solid #e2e8f0')
          .style('z-index', '1000')
          .style('min-width', '120px');

        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 4px; color: #2d3748;">${d.data.name}</div>
          <div style="color: #4a5568;">Percentage: ${d.data.value}%</div>
          <div style="color: #718096;">Recipes: ${d.data.count}</div>
        `);
      })
      .on('mousemove', function(event) {
        d3.select('.pie-tooltip')
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 80) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .attr('stroke-width', 0.5);
        d3.select('.pie-tooltip').remove();
      });

    // Add labels with both percentage and count
    arcs.append('text')
      .attr('transform', d => {
        const [x, y] = arc.centroid(d);
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        
        // Dynamic scaling based on slice size
        let scale;
        if (angle <= 8) {
          scale = 1.8; // Very small slices 
        } else if (angle <= 15) {
          scale = 1.5; // Small slices
        } else if (angle <= 30) {
          scale = 1.3; // Medium slices
        } else {
          scale = 1.3; // Large slices
        }
        
        return `translate(${x * scale}, ${y * scale})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => {
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        if (angle <= 8) return '9px';
        if (angle <= 15) return '10px';
        if (angle <= 30) return '11px';
        return '12px';
      })
      .style('font-weight', 'bold')
      .style('fill', d => {
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        // Use white for slices that are still inside, dark for those outside
        return angle > 20 ? '#ffffff' : '#ffffff';
      })
      .style('pointer-events', 'none')
      .style('text-shadow', d => {
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        return angle > 20 ? '1px 1px 2px rgba(0,0,0,0.5)' : '1px 1px 2px rgba(0,0,0,0.5)';
      })
      .text(d => {
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        return angle >= 5 ? `${d.data.value}%` : ''; // Only show labels for slices 5° or larger
      });

    // Add legend at the bottom
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${chartHeight + 20})`);

    // Calculate legend layout - 2 columns
    const itemsPerColumn = Math.ceil(data.length / 2);
    const legendItemHeight = 20;
    const columnWidth = width / 2;

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => {
        const column = i < itemsPerColumn ? 0 : 1;
        const row = i < itemsPerColumn ? i : i - itemsPerColumn;
        const x = column * columnWidth;
        const y = row * legendItemHeight;
        return `translate(${x}, ${y})`;
      })
      .style('cursor', 'pointer');

    legendItems.append('rect')
      .attr('x', 5)
      .attr('y', 3)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => color(d.name))
      .attr('rx', 2);

    legendItems.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#4a5568')
      .style('font-weight', '500')
      .text(d => `${d.name}: ${d.count}`);

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default PieChart;