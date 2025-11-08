// src/pages/BarChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data = [], width = 700, height = 350 }) => {
  const svgRef = useRef();

  // Color scale for the bars
  const colorScale = d3.scaleOrdinal()
    .domain(['Recipes', 'Stories'])
    .range(['#4f46e5', '#ec4899']);

  useEffect(() => {
    // Early return if no data
    if (!data || data.length === 0) {
      console.log('📊 No data provided to BarChart');
      return;
    }
    
    // Clear previous SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 90, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('display', 'block')
      .style('margin', '0 auto')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px 12px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('z-index', 1000);

    // Transform data for grouped bar chart
    const transformedData = data.map(item => ({
      month: item.month,
      categories: [
        { name: 'Recipes', value: item.recipes || 0 },
        { name: 'Stories', value: item.posts || 0 }
      ]
    }));

    // Create scales
    const xScale0 = d3.scaleBand()
      .domain(transformedData.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.3);

    const xScale1 = d3.scaleBand()
      .domain(['Recipes', 'Stories'])
      .range([0, xScale0.bandwidth()])
      .padding(0.1);

    const maxValue = d3.max(transformedData, d => 
      d3.max(d.categories, c => c.value)
    );
    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat('')
        .ticks(6))
      .style('color', '#e2e8f0')
      .style('stroke-dasharray', '2,2');

    // Create groups for each month
    const monthGroups = svg.selectAll('.month-group')
      .data(transformedData)
      .enter()
      .append('g')
      .attr('class', 'month-group')
      .attr('transform', d => `translate(${xScale0(d.month)}, 0)`);

    // Create bars
    monthGroups.selectAll('.bar')
      .data(d => d.categories)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale1(d.name))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale1.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', d => colorScale(d.name))
      .attr('rx', 2)
      .attr('ry', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Highlight both bars in this month
        d3.select(this.parentNode)
          .selectAll('.bar')
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        // Show tooltip
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${d.month}</div>
            <div style="display: flex; align-items: center; color:#4f46e5; margin: 2px 0;">
              <span>Recipes: <strong>${d.categories[0].value}</strong></span>
            </div>
            <div style="display: flex; align-items: center; color:#ec4899; margin: 2px 0;">
              <span>Stories: <strong>${d.categories[1].value}</strong></span>
            </div>
            <div style="margin-top: 4px; font-weight: 600;">
              Total: <strong>${d.categories[0].value + d.categories[1].value}</strong>
            </div>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        // Reset opacity
        d3.select(this.parentNode)
          .selectAll('.bar')
          .transition()
          .duration(200)
          .attr('opacity', 1);
        tooltip.style('opacity', 0);
      });

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale0))
      .style('color', '#4a5568')
      .style('font-size', '11px');

    // Add X axis label
    svg.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 40})`)
      .style('text-anchor', 'middle')
      .style('fill', '#2d3748')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text('Month');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .style('color', '#2d3748')
      .style('font-size', '10px');

    // Add Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 10)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', '#2d3748')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text('Number of Contributions');

    // Add legend 
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth / 2 - 60}, ${innerHeight + 60})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(['Recipes', 'Stories'])
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 80}, 0)`)
      .style('cursor', 'pointer');

    legendItems.append('circle')
      .attr('cx', 6)
      .attr('cy', 6)
      .attr('r', 6)
      .attr('fill', d => colorScale(d));

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .style('font-size', '12px')
      .style('fill', '#2d3748')
      .style('font-weight', '600')
      .text(d => d);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;