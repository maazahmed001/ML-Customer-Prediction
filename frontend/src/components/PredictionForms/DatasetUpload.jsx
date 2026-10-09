import React, { useState } from 'react'
import { predictUniversal } from '../../services/api'

const DatasetUpload = ({ setResult, setLoading }) => {
  const [file, setFile] = useState(null)
  const [model, setModel] = useState('rf')
  const [preview, setPreview] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        const lines = text.split('\n').slice(0, 6)
        const headers = lines[0].split(',')
        const sampleRows = lines.slice(1, 4).map(line => line.split(','))
        
        setPreview({
          headers,
          sampleRows,
          totalLines: text.split('\n').length - 1
        })
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Please select a file first')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', model)

    try {
      const result = await predictUniversal(formData)
      setResult(result)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message || 'Failed to process file' 
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = `Customer ID,Gender,Age,City,Membership Type,Total Spend,Items Purchased,Average Rating,Discount Applied,Days Since Last Purchase,Satisfaction Level
101,Female,29,New York,Gold,1120.2,14,4.6,true,25,Satisfied
102,Male,34,Los Angeles,Silver,780.5,11,4.1,false,18,Neutral
103,Female,43,Chicago,Bronze,510.75,9,3.4,true,42,Unsatisfied
104,Male,30,San Francisco,Gold,1480.3,19,4.7,false,12,Satisfied
105,Male,27,Miami,Silver,720.4,13,4,true,55,Unsatisfied`

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_customers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="dataset-upload">
      <div className="upload-header">
        <h2>📁 Upload Customer Dataset</h2>
        <p>Upload any CSV file. Our system will automatically analyze it.</p>
      </div>

      <div className="upload-container">
        <div className="upload-section">
          <div 
            className="file-upload-area" 
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              {file ? file.name : 'Click to upload CSV file'}
            </p>
          </div>

          {preview && (
            <div className="preview-section">
              <h3>📋 Dataset Preview</h3>
              <p>{preview.totalLines} rows, {preview.headers.length} columns</p>
              
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {preview.headers.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <div className="form-group">
            <label>ML Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="select-input"
            >
              <option value="rf">Random Forest</option>
              <option value="knn">K-Nearest Neighbors</option>
              <option value="svm">Support Vector Machine</option>
              <option value="nb">Naive Bayes</option>
              <option value="dt">Decision Tree</option>
            </select>
          </div>
        </div>

        <div className="actions-section">
          <button 
            type="button" 
            className="secondary-btn"
            onClick={downloadSampleCSV}
          >
            📥 Download Sample CSV
          </button>
          
          <button 
            type="button" 
            className="primary-btn"
            onClick={handleSubmit}
            disabled={!file}
          >
            🚀 Analyze Dataset
          </button>
        </div>
      </div>
    </div>
  )
}

export default DatasetUpload