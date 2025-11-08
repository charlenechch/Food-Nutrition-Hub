// src/pages/PieChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data, width = 280, height = 280 }) => {
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
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('stroke-width', 3);

        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'pie-tooltip')
          .style('position', 'absolute')
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
          .style('top', (event.pageY - 15) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .attr('stroke-width', 2);
        d3.select('.pie-tooltip').remove();
      });

    // Add labels with both percentage and count
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
      .text(d => {
        const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
        return angle > 15 ? `${d.data.value}%` : '';
      });

    // Add count labels for smaller slices
    arcs.filter(d => {
      const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
      return angle <= 15 && angle > 8;
    }).append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
      .text(d => `${d.data.count}`);

    // Add legend at the bottom
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${chartHeight + 20})`);

    // Calculate legend layout - 2 columns
    const itemsPerColumn = Math.ceil(data.length / 2);
    const legendItemHeight = 18;
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
      .style('font-size', '10px')
      .style('fill', '#4a5568')
      .style('font-weight', '500')
      .text(d => `${d.name} (${d.count})`);

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default PieChart;