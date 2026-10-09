import React, { useState, useEffect } from 'react'
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

const ClusteringResult = ({ data }) => {
  const [visualizations, setVisualizations] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (data.success && data.sample_data) {
      prepareVisualizations()
    }
  }, [data])

  const prepareVisualizations = () => {
    if (!data.clustering_results || !data.sample_data) return

    const clusterStats = data.clustering_results.cluster_statistics || []
    const sampleData = data.sample_data
    const features = data.clustering_results.features_used || []

    const viz = []

    // 1. Cluster Distribution Pie Chart
    if (clusterStats.length > 0) {
      const pieData = clusterStats.map(stat => ({
        name: `Segment ${stat.cluster}`,
        value: stat.size,
        percentage: stat.percentage
      }))

      viz.push({
        type: 'pie',
        title: 'Segment Distribution',
        data: pieData,
        key: 'cluster-distribution'
      })
    }

    // 2. Feature Comparison Bar Chart
    if (features.length > 0 && clusterStats.length > 0) {
      const featureComparison = features.map(feature => {
        const comparison = { feature }
        clusterStats.forEach(stat => {
          comparison[`Segment ${stat.cluster}`] = stat[`${feature}_mean`] || 0
        })
        return comparison
      })

      viz.push({
        type: 'bar',
        title: 'Average Values by Segment',
        data: featureComparison,
        key: 'feature-comparison'
      })
    }

    // 3. Scatter Plot (if we have at least 2 features)
    if (features.length >= 2 && sampleData.length > 0) {
      viz.push({
        type: 'scatter',
        title: `${features[0]} vs ${features[1]}`,
        data: sampleData.map(item => ({
          x: item[features[0]] || 0,
          y: item[features[1]] || 0,
          cluster: item.Cluster,
          ...item
        })),
        key: 'scatter-plot'
      })
    }

    // 4. Cluster Characteristics Radar Chart
    if (clusterStats.length > 0 && features.length > 0) {
      const radarData = clusterStats.map(stat => {
        const point = { segment: `Segment ${stat.cluster}` }
        features.forEach(feature => {
          point[feature] = stat[`${feature}_mean`] || 0
        })
        return point
      })

      viz.push({
        type: 'radar',
        title: 'Segment Profile Comparison',
        data: radarData,
        key: 'radar-chart'
      })
    }

    setVisualizations(viz)
  }

  if (!data.success) {
    return (
      <div className="error-card">
        <h3>❌ Error</h3>
        <p>{data.error || 'Failed to process clustering'}</p>
      </div>
    )
  }

  const renderVisualization = (viz) => {
    switch (viz.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={viz.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {viz.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={clusterColors[index % clusterColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              {clusterStats?.map((stat, index) => (
                <Bar 
                  key={stat.cluster}
                  dataKey={`Segment ${stat.cluster}`}
                  fill={clusterColors[index % clusterColors.length]}
                  name={`Segment ${stat.cluster}`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name={features?.[0]} />
              <YAxis type="number" dataKey="y" name={features?.[1]} />
              <ZAxis type="number" range={[100, 1000]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {[...new Set(viz.data.map(d => d.cluster))].map((cluster, index) => (
                <Scatter
                  key={cluster}
                  name={`Segment ${cluster}`}
                  data={viz.data.filter(d => d.cluster === cluster)}
                  fill={clusterColors[index % clusterColors.length]}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={viz.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="segment" />
              <PolarRadiusAxis />
              {features.map((feature, index) => (
                <Radar
                  key={feature}
                  name={feature}
                  dataKey={feature}
                  stroke={clusterColors[index % clusterColors.length]}
                  fill={clusterColors[index % clusterColors.length]}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const clusterStats = data.clustering_results?.cluster_statistics || []
  const features = data.clustering_results?.features_used || []
  const clusterColors = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FF6B6B', '#4ECDC4', '#FFA07A', '#87CEEB'
  ]

  return (
    <div className="clustering-result">
      <div className="result-header">
        <h3>🧩 Customer Segmentation Results</h3>
        <p className="result-subtitle">
          {data.clustering_results?.algorithm} clustering with {data.clustering_results?.n_clusters} segments
          <span className="model-type"> • {data.clustering_results?.model_type?.toUpperCase() || 'NEWLY-TRAINED'} MODEL</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="result-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          👥 Segments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizations')}
        >
          📈 Visualizations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          📋 Data
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="cluster-stats">
            <h4>📊 Segmentation Overview</h4>
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-value">{data.clustering_results?.total_customers || 0}</div>
                <div className="stat-label">Total Customers</div>
              </div>
              
              <div className="stat-card secondary">
                <div className="stat-value">{data.clustering_results?.n_clusters || 0}</div>
                <div className="stat-label">Segments Found</div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-value">{features.length}</div>
                <div className="stat-label">Features Analyzed</div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-value">{data.clustering_results?.algorithm || 'K-Means'}</div>
                <div className="stat-label">Algorithm</div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="insights-section">
            <h4>💡 Quick Insights</h4>
            <div className="insights-grid">
              {clusterStats.map((stat, index) => (
                <div key={index} className="insight-card">
                  <div className="insight-header">
                    <span className="cluster-tag" style={{ 
                      backgroundColor: clusterColors[index % clusterColors.length] 
                    }}>
                      Segment {stat.cluster}
                    </span>
                    <span className="insight-size">
                      {stat.size} customers ({stat.percentage?.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="insight-content">
                    {stat.characteristics && stat.characteristics.length > 0 ? (
                      <ul className="characteristics-list">
                        {stat.characteristics.map((char, idx) => (
                          <li key={idx}>{char}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Average across all features</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div className="tab-content">
          <div className="segments-detail">
            <h4>👥 Detailed Segment Analysis</h4>
            {clusterStats.map((stat, index) => (
              <div key={index} className="segment-card">
                <div className="segment-header">
                  <div className="segment-title">
                    <h5>Segment {stat.cluster}</h5>
                    <div className="segment-meta">
                      <span className="segment-size">
                        {stat.size} customers • {stat.percentage?.toFixed(1)}% of total
                      </span>
                      <span className={`model-badge ${stat.model_type}`}>
                        {stat.model_type}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="segment-color"
                    style={{ backgroundColor: clusterColors[index % clusterColors.length] }}
                  ></div>
                </div>

                <div className="segment-content">
                  <div className="segment-stats">
                    <h6>📈 Key Metrics</h6>
                    <div className="metrics-grid">
                      {features.map(feature => (
                        <div key={feature} className="metric-item">
                          <div className="metric-label">{feature}</div>
                          <div className="metric-value">
                            {stat[`${feature}_mean`]?.toFixed(2) || 'N/A'}
                            <span className="metric-unit">
                              {stat[`${feature}_std`] && ` (±${stat[`${feature}_std`].toFixed(2)})`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="segment-characteristics">
                    <h6>🎯 Characteristics</h6>
                    {stat.characteristics && stat.characteristics.length > 0 ? (
                      <div className="characteristics-tags">
                        {stat.characteristics.map((char, idx) => (
                          <span key={idx} className="characteristic-tag">
                            {char}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No distinct characteristics identified</p>
                    )}
                  </div>

                  {data.recommendations && data.recommendations[index] && (
                    <div className="segment-recommendations">
                      <h6>💡 Marketing Recommendations</h6>
                      <ul className="recommendations-list">
                        {data.recommendations[index].recommendations?.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                      <div className={`priority-badge ${data.recommendations[index].priority?.toLowerCase()}`}>
                        {data.recommendations[index].priority} PRIORITY
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualizations Tab */}
      {activeTab === 'visualizations' && (
        <div className="tab-content">
          <div className="visualizations-grid">
            {visualizations.map((viz, index) => (
              <div key={viz.key} className="visualization-card">
                <h5>{viz.title}</h5>
                {renderVisualization(viz)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="tab-content">
          <div className="data-section">
            <h4>📋 Sample Clustered Data</h4>
            <div className="data-controls">
              <div className="data-info">
                Showing {data.sample_data?.length || 0} sample records
              </div>
              <button 
                className="export-btn"
                onClick={() => {
                  const jsonData = JSON.stringify(data, null, 2)
                  const blob = new Blob([jsonData], { type: 'application/json' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'clustering_results.json'
                  a.click()
                }}
              >
                📥 Export JSON
              </button>
            </div>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Segment</th>
                    {features.map(feature => (
                      <th key={feature}>{feature}</th>
                    ))}
                    <th>Characteristics</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sample_data?.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row['Customer ID'] || idx + 1}</td>
                      <td>
                        <span 
                          className="segment-badge"
                          style={{ 
                            backgroundColor: clusterColors[parseInt(row.Cluster) % clusterColors.length] 
                          }}
                        >
                          Segment {row.Cluster}
                        </span>
                      </td>
                      {features.map(feature => (
                        <td key={feature}>
                          {typeof row[feature] === 'number' ? row[feature].toFixed(2) : row[feature] || 'N/A'}
                        </td>
                      ))}
                      <td>
                        {clusterStats[parseInt(row.Cluster)]?.characteristics?.slice(0, 2).join(', ') || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="secondary-btn"
          onClick={() => window.print()}
        >
          🖨️ Print Report
        </button>
        <button 
          className="primary-btn"
          onClick={() => {
            // Generate CSV export
            const headers = ['Customer ID', 'Segment', ...features, 'Characteristics']
            const csvRows = data.sample_data?.map(row => [
              row['Customer ID'] || '',
              `Segment ${row.Cluster}`,
              ...features.map(f => row[f] || ''),
              clusterStats[parseInt(row.Cluster)]?.characteristics?.join('; ') || ''
            ])
            
            const csvContent = [
              headers.join(','),
              ...csvRows.map(row => row.join(','))
            ].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'customer_segments.csv'
            a.click()
          }}
        >
          📊 Export as CSV
        </button>
      </div>
    </div>
  )
}

export default ClusteringResult