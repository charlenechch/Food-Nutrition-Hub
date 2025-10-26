// src/pages/PieChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data, width = 280, height = 280 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const chartHeight = height - 80; // Space for legend
    const radius = Math.min(width, chartHeight) / 2;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${chartHeight / 2})`);

    // FIXED: Correct color scale setup
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(['#4c51bf', '#38a169', '#d69e2e', '#e53e3e']);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);

    // FIXED: Append arcs to chartGroup, not svg
    const arcs = chartGroup.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw arcs with the exact design from image
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
          .attr('opacity', 1)
          .attr('stroke-width', 3);

        // Show tooltip
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
          <div style="color: #4a5568;">Value: ${d.data.value}</div>
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
          .attr('opacity', 0.9)
          .attr('stroke-width', 2);
        d3.select('.pie-tooltip').remove();
      });

    // Add percentage labels inside slices
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
      .text(d => `${d.data.value}%`);

    // Add legend at the bottom
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${chartHeight + 30})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => {
        const itemWidth = 80;
        const totalWidth = data.length * itemWidth;
        const startX = (width - totalWidth) / 2;
        return `translate(${startX + i * itemWidth}, 0)`;
      })
      .style('cursor', 'pointer'); 

    legendItems.append('circle')
      .attr('cx', 8)
      .attr('cy', 8)
      .attr('r', 6)
      .attr('fill', d => color(d.name));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#2d3748')
      .style('font-weight', '600')
      .text(d => d.name);

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default PieChart;