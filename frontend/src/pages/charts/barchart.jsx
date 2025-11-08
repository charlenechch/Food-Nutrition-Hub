// src/pages/BarChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data = [], width = 700, height = 350 }) => {
  const svgRef = useRef();

  // Color scales for different statuses
  const recipeColorScale = d3.scaleOrdinal()
    .domain(['Approved', 'Pending', 'Rejected'])
    .range(['#10b981', '#f59e0b', '#ef4444']);

  const storyColorScale = d3.scaleOrdinal()
    .domain(['Approved', 'Pending', 'Rejected'])
    .range(['#8b5cf6', '#f97316', '#dc2626']);

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
      .style('padding', '12px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('z-index', 1000)
      .style('min-width', '180px');

    // Transform data for stacked bar chart
    const transformedData = data.map(item => ({
      month: item.month || 'Unknown',
      recipes: {
        approved: item.recipes_approved || 0,
        pending: item.recipes_pending || 0,
        rejected: item.recipes_rejected || 0,
        total: (item.recipes_approved || 0) + (item.recipes_pending || 0) + (item.recipes_rejected || 0)
      },
      stories: {
        approved: item.stories_approved || 0,
        pending: item.stories_pending || 0,
        rejected: item.stories_rejected || 0,
        total: (item.stories_approved || 0) + (item.stories_pending || 0) + (item.stories_rejected || 0)
      }
    }));

    // Create stack generators
    const recipeStack = d3.stack()
      .keys(['approved', 'pending', 'rejected'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const storyStack = d3.stack()
      .keys(['approved', 'pending', 'rejected'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    // Stack the data
    const recipeStackData = recipeStack(transformedData.map(d => d.recipes));
    const storyStackData = storyStack(transformedData.map(d => d.stories));

    // Create scales
    const xScale = d3.scaleBand()
      .domain(transformedData.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.4);

    const maxRecipeValue = d3.max(transformedData, d => d.recipes.total);
    const maxStoryValue = d3.max(transformedData, d => d.stories.total);
    const maxValue = Math.max(maxRecipeValue, maxStoryValue) || 1;

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

    // Create recipe bars (left side)
    const recipeGroup = svg.append('g')
      .attr('class', 'recipe-bars');

    recipeGroup.selectAll('.recipe-month')
      .data(recipeStackData)
      .enter()
      .append('g')
      .attr('class', 'recipe-month')
      .attr('fill', (d, i) => {
        const status = ['approved', 'pending', 'rejected'][i];
        return recipeColorScale(status);
      })
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('class', 'recipe-bar')
      .attr('x', (d, i) => xScale(transformedData[i].month) - xScale.bandwidth() * 0.25)
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth() * 0.4)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const monthIndex = d.index;
        const monthData = transformedData[monthIndex];
        const layerIndex = d3.select(this.parentNode).datum().index;
        const status = ['approved', 'pending', 'rejected'][layerIndex];
        
        // Highlight all recipe segments for this month
        d3.selectAll(`.recipe-bar`).attr('opacity', 0.6);
        d3.select(this.parentNode).selectAll('rect').attr('opacity', 1);
        
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              ${monthData.month} - Recipes
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
              <span>Approved: <strong>${monthData.recipes.approved}</strong></span>
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; margin-right: 8px;"></div>
              <span>Pending: <strong>${monthData.recipes.pending}</strong></span>
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-right: 8px;"></div>
              <span>Rejected: <strong>${monthData.recipes.rejected}</strong></span>
            </div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-weight: 600;">
              Total Recipes: <strong>${monthData.recipes.total}</strong>
            </div>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.recipe-bar').attr('opacity', 1);
        tooltip.style('opacity', 0);
      });

    // Create story bars (right side)
    const storyGroup = svg.append('g')
      .attr('class', 'story-bars');

    storyGroup.selectAll('.story-month')
      .data(storyStackData)
      .enter()
      .append('g')
      .attr('class', 'story-month')
      .attr('fill', (d, i) => {
        const status = ['approved', 'pending', 'rejected'][i];
        return storyColorScale(status);
      })
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('class', 'story-bar')
      .attr('x', (d, i) => xScale(transformedData[i].month) + xScale.bandwidth() * 0.25)
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth() * 0.4)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const monthIndex = d.index;
        const monthData = transformedData[monthIndex];
        const layerIndex = d3.select(this.parentNode).datum().index;
        const status = ['approved', 'pending', 'rejected'][layerIndex];
        
        // Highlight all story segments for this month
        d3.selectAll('.story-bar').attr('opacity', 0.6);
        d3.select(this.parentNode).selectAll('rect').attr('opacity', 1);
        
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              ${monthData.month} - Stories
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; margin-right: 8px;"></div>
              <span>Approved: <strong>${monthData.stories.approved}</strong></span>
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #f97316; border-radius: 50%; margin-right: 8px;"></div>
              <span>Pending: <strong>${monthData.stories.pending}</strong></span>
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <div style="width: 8px; height: 8px; background: #dc2626; border-radius: 50%; margin-right: 8px;"></div>
              <span>Rejected: <strong>${monthData.stories.rejected}</strong></span>
            </div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-weight: 600;">
              Total Stories: <strong>${monthData.stories.total}</strong>
            </div>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.story-bar').attr('opacity', 1);
        tooltip.style('opacity', 0);
      });

    // Add month background for overall hover (total submissions)
    svg.selectAll('.month-background')
      .data(transformedData)
      .enter()
      .append('rect')
      .attr('class', 'month-background')
      .attr('x', d => xScale(d.month) - xScale.bandwidth() * 0.3)
      .attr('y', 0)
      .attr('width', xScale.bandwidth() * 1.6)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, monthData) {
        const totalSubmissions = monthData.recipes.total + monthData.stories.total;
        
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              ${monthData.month} - Overview
            </div>
            <div style="margin: 4px 0;">
              <span>Total Recipes: <strong>${monthData.recipes.total}</strong></span>
            </div>
            <div style="margin: 4px 0;">
              <span>Total Stories: <strong>${monthData.stories.total}</strong></span>
            </div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-weight: 600;">
              Total Submissions: <strong>${totalSubmissions}</strong>
            </div>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .style('color', '#4a5568')
      .style('font-size', '11px');

    // Add X axis label
    svg.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 40})`)
      .style('text-anchor', 'middle')
      .style('fill', '#2d3748')
      .style('font-size', '14px')
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
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Number of Contributions');

    // Add legend 
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth / 2 - 120}, ${innerHeight + 60})`);

    // Recipe legend
    const recipeLegend = legend.append('g')
      .attr('transform', 'translate(0, 0)');

    // recipeLegend.append('text')
    //   .attr('x', 0)
    //   .attr('y', -5)
    //   .style('font-size', '10px')
    //   .style('fill', '#4a5568')
    //   .style('font-weight', '600')
      //.text('Recipes:');

    const recipeLegendItems = recipeLegend.selectAll('.recipe-legend-item')
      .data(['Approved', 'Pending', 'Rejected'])
      .enter()
      .append('g')
      .attr('class', 'recipe-legend-item')
      .attr('transform', (d, i) => `translate(${i * 90}, 10)`);

    recipeLegendItems.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => recipeColorScale(d))
      .attr('rx', 1);

    recipeLegendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .style('font-size', '10px')
      .style('fill', '#4a5568')
      .text(d => d);

    // Story legend
    const storyLegend = legend.append('g')
      .attr('transform', `translate(0, 25)`);

    // storyLegend.append('text')
    //   .attr('x', 0)
    //   .attr('y', -5)
    //   .style('font-size', '10px')
    //   .style('fill', '#4a5568')
    //   .style('font-weight', '600')
      //.text('Stories:');

    const storyLegendItems = storyLegend.selectAll('.story-legend-item')
      .data(['Approved', 'Pending', 'Rejected'])
      .enter()
      .append('g')
      .attr('class', 'story-legend-item')
      .attr('transform', (d, i) => `translate(${i * 70}, 10)`);

    storyLegendItems.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => storyColorScale(d))
      .attr('rx', 1);

    storyLegendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .style('font-size', '10px')
      .style('fill', '#4a5568')
      .text(d => d);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;