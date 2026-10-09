import React, { useState } from 'react'
import { predictSimple } from '../../services/api'

const SimplePrediction = ({ setResult, setLoading }) => {
  const [formData, setFormData] = useState({
    customer_type: 'returning',
    engagement_level: 'medium',
    browsing_time_seconds: 120,
    pages_viewed: 10,
    visited_weekend: false,
    special_promo: false,
    traffic_source: 'organic',
    model: 'rf'
  })

  const engagementLevels = [
    { value: 'low', label: '👀 Low (Casual Browsing)' },
    { value: 'medium', label: '🤔 Medium (Interested)' },
    { value: 'high', label: '🔥 High (Ready to Buy)' }
  ]

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  console.log('🎯 Starting prediction with:', formData)
  
  try {
    console.log('🚀 Calling predictSimple API...')
    const result = await predictSimple(formData)
    console.log('✅ Prediction result:', result)
    setResult(result)
  } catch (error) {
    console.error('❌ Prediction failed:', error)
    setResult({ 
      success: false, 
      error: error.message,
      suggestion: 'Please make sure your FastAPI backend is running on http://localhost:8000'
    })
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="simple-prediction">
      <div className="form-header">
        <h2>🎯 Simple Customer Prediction</h2>
        <p>Answer a few questions. Our AI will predict purchase likelihood.</p>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">
        <div className="form-section">
          <h3>👤 Customer Profile</h3>
          
          <div className="form-group">
            <label>Customer Type</label>
            <div className="button-group">
              <button
                type="button"
                className={`option-btn ${formData.customer_type === 'new' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, customer_type: 'new'})}
              >
                👋 New Visitor
              </button>
              <button
                type="button"
                className={`option-btn ${formData.customer_type === 'returning' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, customer_type: 'returning'})}
              >
                ↩️ Returning Customer
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Engagement Level</label>
            <div className="button-group">
              {engagementLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  className={`option-btn ${formData.engagement_level === level.value ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, engagement_level: level.value})}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📊 Session Details</h3>
          
          <div className="form-group">
            <label>
              Time Spent: {formData.browsing_time_seconds} seconds
            </label>
            <input
              type="range"
              min="10"
              max="600"
              step="10"
              value={formData.browsing_time_seconds}
              onChange={(e) => setFormData({...formData, browsing_time_seconds: parseInt(e.target.value)})}
              className="slider"
            />
          </div>

          <div className="form-group">
            <label>
              Pages Viewed: {formData.pages_viewed} pages
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={formData.pages_viewed}
              onChange={(e) => setFormData({...formData, pages_viewed: parseInt(e.target.value)})}
              className="slider"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>⚙️ Settings</h3>
          
          <div className="form-group">
            <label>ML Model</label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="select-input"
            >
              <option value="rf">Random Forest</option>
              <option value="knn">K-Nearest Neighbors</option>
              <option value="svm">Support Vector Machine</option>
              <option value="nb">Naive Bayes</option>
              <option value="dt">Decision Tree</option>
            </select>
          </div>

          <div className="toggle-group">
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={formData.visited_weekend}
                onChange={(e) => setFormData({...formData, visited_weekend: e.target.checked})}
              />
              <span>Weekend Visit</span>
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={formData.special_promo}
                onChange={(e) => setFormData({...formData, special_promo: e.target.checked})}
              />
              <span>Special Promotion Active</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            🚀 Predict Purchase Likelihood
          </button>
        </div>
      </form>
    </div>
  )
}

export default SimplePrediction