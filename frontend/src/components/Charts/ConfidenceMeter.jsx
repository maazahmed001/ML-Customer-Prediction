import React from 'react'

const ConfidenceMeter = ({ confidence, label = 'Confidence Level' }) => {
  const percentage = Math.min(Math.max(confidence * 100, 0), 100)
  
  // Determine color based on confidence
  const getColor = (percent) => {
    if (percent < 30) return '#e74c3c' // Red
    if (percent < 60) return '#f39c12' // Orange
    if (percent < 80) return '#3498db' // Blue
    return '#2ecc71' // Green
  }

  return (
    <div className="confidence-meter">
      <div className="meter-header">
        <h4>{label}</h4>
        <span className="meter-percentage">{percentage.toFixed(1)}%</span>
      </div>
      
      <div className="meter-container">
        <div className="meter-background">
          <div 
            className="meter-fill"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${getColor(percentage)}, ${getColor(percentage)}dd)`
            }}
          ></div>
        </div>
        
        <div className="meter-labels">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
        
        <div className="meter-thresholds">
          <div className="threshold low" style={{ left: '30%' }}>
            <div className="threshold-line"></div>
            <div className="threshold-label">Low</div>
          </div>
          <div className="threshold medium" style={{ left: '60%' }}>
            <div className="threshold-line"></div>
            <div className="threshold-label">Medium</div>
          </div>
          <div className="threshold high" style={{ left: '80%' }}>
            <div className="threshold-line"></div>
            <div className="threshold-label">High</div>
          </div>
        </div>
      </div>
      
      <div className="meter-description">
        {percentage < 30 && 'Low confidence - Needs review'}
        {percentage >= 30 && percentage < 60 && 'Moderate confidence - Consider verification'}
        {percentage >= 60 && percentage < 80 && 'Good confidence - Likely accurate'}
        {percentage >= 80 && 'High confidence - Very reliable'}
      </div>
    </div>
  )
}

export default ConfidenceMeter