import React, { useState, useRef } from 'react'
import { clusterCustomers } from '../../services/api'
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie 
} from 'recharts'

const CustomerClustering = ({ setResult, setLoading }) => {
  const [file, setFile] = useState(null)
  const [nClusters, setNClusters] = useState(4)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [usePretrained, setUsePretrained] = useState(true)
  const [preview, setPreview] = useState(null)
  const [datasetInfo, setDatasetInfo] = useState(null)
  const fileInputRef = useRef(null)

  // Feature mapping explanation (for generic names)
  const featureMappingInfo = {
    'Total Spend': 'Monetary value columns (revenue, amount, price)',
    'Items Purchased': 'Quantity columns (items, products, purchases)',
    'Average Rating': 'Quality columns (rating, satisfaction, score)',
    'Days Since Last Purchase': 'Recency columns (last_visit, days_ago)',
    'Membership Type': 'Category columns (tier, level, type)',
    'Customer ID': 'Identifier columns (id, customer_id)',
    'Age': 'Demographic columns (age, years)',
    'Satisfaction Level': 'Feedback columns (satisfaction, happiness)',
    'Discount Applied': 'Promotion columns (discount, coupon, promo)',
    'City': 'Location columns (city, location, region)',
    'Gender': 'Demographic columns (gender, sex)'
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setSelectedFeatures([]) // Reset selected features when new file uploaded
    
    try {
      // For CSV files only
      if (selectedFile.name.endsWith('.csv')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const csvData = event.target.result
          const lines = csvData.split('\n').filter(line => line.trim() !== '')
          
          if (lines.length < 2) {
            alert('CSV file must have at least 1 data row')
            return
          }
          
          // Parse headers (handle quoted values)
          const headers = lines[0].split(',').map(h => 
            h.replace(/"/g, '').replace(/'/g, '').trim()
          )
          
          // Parse sample rows (first 5 rows)
          const sampleRows = []
          for (let i = 1; i < Math.min(6, lines.length); i++) {
            const cells = []
            let currentCell = ''
            let insideQuotes = false
            
            for (let char of lines[i]) {
              if (char === '"') {
                insideQuotes = !insideQuotes
              } else if (char === ',' && !insideQuotes) {
                cells.push(currentCell.replace(/"/g, '').replace(/'/g, '').trim())
                currentCell = ''
              } else {
                currentCell += char
              }
            }
            cells.push(currentCell.replace(/"/g, '').replace(/'/g, '').trim())
            sampleRows.push(cells)
          }
          
          setPreview({
            headers,
            sampleRows,
            totalRows: lines.length - 1
          })
          
          // Set dataset info
          setDatasetInfo({
            rows: lines.length - 1,
            columns: headers.length,
            columnNames: headers,
            columnSampleValues: headers.map((header, idx) => ({
              name: header,
              sample: sampleRows[0]?.[idx] || 'N/A',
              isNumeric: !isNaN(sampleRows[0]?.[idx]) && sampleRows[0]?.[idx] !== ''
            }))
          })
          
          // AUTO-SELECT: Try to select 2-3 numeric columns automatically
          const numericColumns = []
          headers.forEach((header, idx) => {
            if (sampleRows[0]?.[idx] && !isNaN(sampleRows[0][idx]) && sampleRows[0][idx] !== '') {
              // Check if it's not an ID column
              if (!header.toLowerCase().includes('id')) {
                numericColumns.push(header)
              }
            }
          })
          
          // Select first 2-3 numeric columns automatically
          const autoSelected = numericColumns.slice(0, 3)
          if (autoSelected.length >= 2) {
            setSelectedFeatures(autoSelected)
          }
          
          console.log('📊 Uploaded CSV Info:')
          console.log('Headers:', headers)
          console.log('Numeric columns found:', numericColumns)
          console.log('Auto-selected:', autoSelected)
        }
        reader.readAsText(selectedFile)
      } else {
        alert('Please upload a CSV file. For Excel support, install xlsx package.')
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please ensure it\'s a valid CSV file.')
    }
  }

  const handleFeatureToggle = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature))
    } else {
      if (selectedFeatures.length < 5) {
        setSelectedFeatures([...selectedFeatures, feature])
      } else {
        alert('Maximum 5 features allowed for clustering')
      }
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a CSV file first')
      return
    }

    if (selectedFeatures.length < 2) {
      alert(`❌ Error: Need at least 2 features for clustering.\n\nCurrently selected: ${selectedFeatures.length} feature(s)\nSelected: ${selectedFeatures.join(', ') || 'None'}\n\nPlease select at least 2 columns from your dataset.`)
      return
    }

    // Warn if selecting non-numeric columns
    if (preview) {
      const potentiallyNonNumeric = selectedFeatures.filter(feature => {
        const idx = preview.headers.indexOf(feature)
        return idx !== -1 && isNaN(preview.sampleRows[0]?.[idx]) && preview.sampleRows[0]?.[idx] !== ''
      })
      
      if (potentiallyNonNumeric.length > 0) {
        const confirm = window.confirm(
          `Warning: These columns may not be numeric:\n${potentiallyNonNumeric.join(', ')}\n\nClustering works best with numeric data. Continue anyway?`
        )
        if (!confirm) return
      }
    }

    setLoading(true)
    
    try {
      console.log('🚀 Submitting clustering request...')
      console.log('Features:', selectedFeatures)
      console.log('Number of clusters:', nClusters)
      console.log('Use pretrained:', usePretrained)
      
      const result = await clusterCustomers(
        file,
        nClusters,
        selectedFeatures.join(','), // Convert array to comma-separated string
        usePretrained,
        true // enable_mapping
      )
      
      console.log('📊 Clustering result:', result)
      setResult(result)
    } catch (error) {
      console.error('❌ Clustering error:', error)
      setResult({ 
        success: false, 
        error: error.message || 'Failed to perform clustering' 
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = `Customer ID,Age,City,Membership Type,Total Spend,Items Purchased,Average Rating,Discount Applied,Days Since Last Purchase,Satisfaction Level
101,29,New York,Gold,1120.2,14,4.6,true,25,Satisfied
102,34,Los Angeles,Silver,780.5,11,4.1,false,18,Neutral
103,43,Chicago,Bronze,510.75,9,3.4,true,42,Unsatisfied
104,30,San Francisco,Gold,1480.3,19,4.7,false,12,Satisfied
105,27,Miami,Silver,720.4,13,4,true,55,Unsatisfied
106,38,Dallas,Gold,920.1,15,4.3,true,30,Satisfied
107,45,Seattle,Silver,640.8,10,3.8,false,22,Neutral
108,31,Boston,Bronze,420.5,7,3.2,true,48,Unsatisfied
109,29,Atlanta,Gold,1350.6,18,4.8,false,15,Satisfied
110,36,Denver,Silver,580.3,9,3.9,true,35,Neutral`
    
    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer_clustering_sample.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setDatasetInfo(null)
    setSelectedFeatures([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Color palette for clusters
  const clusterColors = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FF6B6B', '#4ECDC4', '#FFA07A', '#87CEEB'
  ]

  return (
    <div className="customer-clustering">
      <div className="form-header">
        <h2>🧩 Customer Segmentation (K-Means Clustering)</h2>
        <p>Discover natural customer groups for targeted marketing strategies</p>
      </div>

      <div className="clustering-container">
        {/* File Upload Section */}
        <div className="upload-section card">
          <h3>📁 Upload Customer Data</h3>
          <p className="section-description">
            Upload CSV file with customer behavior data
          </p>
          
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <div 
              className="upload-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📊</div>
              <p className="upload-text">
                {file ? file.name : 'Click to upload CSV file'}
              </p>
              <p className="upload-subtext">
                Supports .csv format
              </p>
            </div>
            
            {file && (
              <button className="clear-btn" onClick={clearFile}>
                ✕ Clear File
              </button>
            )}
          </div>

          {preview && (
            <div className="preview-section">
              <h4>📋 Dataset Preview</h4>
              <div className="dataset-stats">
                <span className="stat-badge">{preview.totalRows} rows</span>
                <span className="stat-badge">{preview.headers.length} columns</span>
                <span className="stat-badge">
                  {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className={
                          selectedFeatures.includes(header) ? 'selected-column' : ''
                        }>
                          {header}
                          {selectedFeatures.includes(header) && ' ★'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className={
                            selectedFeatures.includes(preview.headers[cellIdx]) ? 'selected-cell' : ''
                          }>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FEATURE SELECTION SECTION - MOST IMPORTANT! */}
        {preview && (
          <div className="feature-selection-section card">
            <h3>🎯 Select Features for Clustering</h3>
            <p className="section-description">
              Choose 2-5 numeric columns from your dataset for clustering:
            </p>
            
            <div className="feature-selection-info">
              <div className="selection-status">
                <span className={`status-indicator ${selectedFeatures.length >= 2 ? 'ready' : 'warning'}`}>
                  {selectedFeatures.length >= 2 ? '✅ Ready' : '⚠️ Need more features'}
                </span>
                <span className="selection-count">
                  Selected: {selectedFeatures.length} of 5 max
                </span>
              </div>
              
              {selectedFeatures.length < 2 && (
                <div className="selection-alert">
                  <p>⚠️ <strong>Need at least 2 features for clustering</strong></p>
                  <p>Select 2-5 numeric columns from your dataset below</p>
                </div>
              )}
            </div>
            
            <div className="available-columns-grid">
              <h4>📊 Available Columns in Your Dataset:</h4>
              <p className="columns-help">
                Click on columns to select/deselect. Green columns are automatically detected as numeric.
              </p>
              
              <div className="columns-list">
                {preview.headers.map((header, idx) => {
                  const isNumeric = preview.sampleRows[0] && 
                                   !isNaN(preview.sampleRows[0][idx]) && 
                                   preview.sampleRows[0][idx] !== ''
                  const isSelected = selectedFeatures.includes(header)
                  const sampleValue = preview.sampleRows[0]?.[idx] || 'N/A'
                  
                  return (
                    <div
                      key={header}
                      className={`column-item ${isSelected ? 'selected' : ''} ${isNumeric ? 'numeric' : ''}`}
                      onClick={() => handleFeatureToggle(header)}
                      title={`${header} (Sample: ${sampleValue})`}
                    >
                      <div className="column-header">
                        <span className="column-name">{header}</span>
                        <span className="column-badges">
                          {isNumeric && <span className="badge numeric-badge">#</span>}
                          {isSelected && <span className="badge selected-badge">✓</span>}
                        </span>
                      </div>
                      <div className="column-sample">
                        Sample: <code>{sampleValue}</code>
                      </div>
                      {isNumeric && (
                        <div className="column-type">
                          Numeric data (good for clustering)
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {selectedFeatures.length > 0 && (
              <div className="selected-features-display">
                <h4>✅ Selected Features:</h4>
                <div className="selected-tags">
                  {selectedFeatures.map(feature => (
                    <span key={feature} className="selected-tag">
                      {feature}
                      <button 
                        onClick={() => handleFeatureToggle(feature)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clustering Parameters */}
        <div className="parameters-section card">
          <h3>⚙️ Clustering Parameters</h3>
          
          <div className="parameter-group">
            <div className="form-group">
              <label className="form-label">
                Number of Segments: 
                <span className="cluster-count">{nClusters}</span>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={nClusters}
                onChange={(e) => setNClusters(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>2 (Broad)</span>
                <span>5 (Balanced)</span>
                <span>8 (Detailed)</span>
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={usePretrained}
                    onChange={(e) => setUsePretrained(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  Use Pre-trained Model
                </label>
                <span className="toggle-help">
                  Uses existing clustering patterns (faster)
                </span>
              </div>
            </div>

            <div className="quick-tip">
              <p>💡 <strong>Tip:</strong> Clustering works best with numeric data like:</p>
              <ul>
                <li>Spending amounts (Total Spend, Revenue)</li>
                <li>Purchase counts (Items Purchased, Quantity)</li>
                <li>Ratings (Average Rating, Score)</li>
                <li>Time values (Days Since, Duration)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <div className="action-buttons">
            <button 
              className="secondary-btn"
              onClick={downloadSampleCSV}
            >
              📥 Download Sample Dataset
            </button>
            
            <button 
              className="primary-btn"
              onClick={handleSubmit}
              disabled={!file || selectedFeatures.length < 2}
            >
              🔍 Discover Customer Segments
            </button>
          </div>
          
          {selectedFeatures.length >= 2 && (
            <div className="action-info success">
              <p>✅ Ready to cluster! Using {selectedFeatures.length} features.</p>
              <p>The system will automatically map your column names to the clustering algorithm.</p>
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="info-panel card">
          <h3>💡 How to Use This Tool</h3>
          <div className="info-content">
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Upload Your CSV</h4>
                  <p>Upload a CSV file with customer data (or use the sample)</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Select Features</h4>
                  <p>Choose 2-5 numeric columns for clustering (click on columns)</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Adjust Settings</h4>
                  <p>Set number of segments and choose model type</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Discover Segments</h4>
                  <p>Click "Discover Customer Segments" to analyze your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerClustering