import React from 'react'
import ConfidenceMeter from '../Charts/ConfidenceMeter'
import FeatureImportance from '../Charts/FeatureImportance'


const SimpleResult = ({ data }) => {
  if (!data.success) {
    return (
      <div className="error-card">
        <h3>❌ Error</h3>
        <p>{data.error}</p>
      </div>
    )
  }

  const isLikely = data.prediction === "Will Purchase"
  const confidence = data.confidence || data.probability || 0

  return (
    <div className="result-card">
      <div className={`prediction-header ${isLikely ? 'success' : 'warning'}`}>
        <h3>{isLikely ? '✅ LIKELY to Purchase' : '⚠️ UNLIKELY to Purchase'}</h3>
        <div className="confidence-badge">
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
      </div>

      <div className="visualizations-section">
        <div className="viz-row">
          <div className="viz-column">
            <ConfidenceMeter 
              confidence={confidence} 
              label="Purchase Confidence"
            />
          </div>
          <div className="viz-column">
            <FeatureImportance />
          </div>
        </div>
      </div>

      <div className="result-details">
        <div className="detail-item">
          <span className="detail-label">Model Used:</span>
          <span className="detail-value">{data.model_used || data.model}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Raw Prediction:</span>
          <span className="detail-value">{data.prediction}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Confidence Score:</span>
          <span className="detail-value">{(confidence * 100).toFixed(1)}%</span>
        </div>
        
        {data.recommendation && (
          <div className="recommendation">
            <strong>💡 Recommendation:</strong> {data.recommendation}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleResult