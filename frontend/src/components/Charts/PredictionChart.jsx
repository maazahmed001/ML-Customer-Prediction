 import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const PredictionChart = ({ data, type = 'pie' }) => {
  // Prepare data for different chart types
  const prepareChartData = () => {
    if (!data) return []

    if (data.predictions && Array.isArray(data.predictions)) {
      // For batch predictions (UploadResult)
      const categories = {}
      data.predictions.forEach(pred => {
        const category = pred.prediction?.includes('LIKELY') ? 'Will Purchase' : 'Will Not Purchase'
        categories[category] = (categories[category] || 0) + 1
      })
      
      return Object.entries(categories).map(([name, value]) => ({
        name,
        value,
        color: name === 'Will Purchase' ? '#2ecc71' : '#e74c3c'
      }))
    } 
    
    else if (data.all_predictions && Array.isArray(data.all_predictions)) {
      // For image classification (ImageResult)
      return data.all_predictions.map((pred, idx) => ({
        name: pred.category,
        value: pred.confidence * 100,
        color: idx === 0 ? '#2ecc71' : idx === 1 ? '#3498db' : '#9b59b6'
      }))
    }
    
    else if (data.confidence !== undefined) {
      // For simple prediction (SimpleResult)
      return [
        { name: 'Will Purchase', value: data.confidence * 100, color: '#2ecc71' },
        { name: 'Will Not Purchase', value: (1 - data.confidence) * 100, color: '#e74c3c' }
      ]
    }
    
    return []
  }

  const chartData = prepareChartData()

  if (chartData.length === 0) {
    return (
      <div className="no-data-message">
        <p>No data available for visualization</p>
      </div>
    )
  }

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
        <XAxis dataKey="name" stroke="#888" />
        <YAxis stroke="#888" tickFormatter={(value) => `${value}%`} />
        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
        <Legend />
        <Bar dataKey="value" fill="#3498db" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
        <XAxis dataKey="name" stroke="#888" />
        <YAxis stroke="#888" tickFormatter={(value) => `${value}%`} />
        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Confidence']} />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#3498db" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  )

  return (
    <div className="prediction-chart">
      <div className="chart-header">
        <h3>📊 Visualization</h3>
        <div className="chart-legend">
          {chartData.map((item, idx) => (
            <div key={idx} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: item.color }}></div>
              <span>{item.name}: {item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        {type === 'pie' && renderPieChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
      </div>
      
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Total Samples:</span>
          <span className="stat-value">{chartData.reduce((sum, item) => sum + item.value, 0).toFixed(0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Confidence:</span>
          <span className="stat-value">{Math.max(...chartData.map(d => d.value)).toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min Confidence:</span>
          <span className="stat-value">{Math.min(...chartData.map(d => d.value)).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

export default PredictionChart