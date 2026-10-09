import React from 'react'

const FeatureImportance = ({ features }) => {
  // Default features for different prediction types
  const defaultFeatures = {
    'Simple Prediction': [
      { name: 'Engagement Level', importance: 0.35 },
      { name: 'Browsing Time', importance: 0.25 },
      { name: 'Pages Viewed', importance: 0.20 },
      { name: 'Customer Type', importance: 0.15 },
      { name: 'Weekend Visit', importance: 0.05 }
    ],
    'Image Classification': [
      { name: 'Shape Features', importance: 0.40 },
      { name: 'Texture Patterns', importance: 0.30 },
      { name: 'Color Distribution', importance: 0.20 },
      { name: 'Edge Detection', importance: 0.10 }
    ],
    'Batch Prediction': [
      { name: 'Total Spend', importance: 0.30 },
      { name: 'Purchase History', importance: 0.25 },
      { name: 'Customer Rating', importance: 0.20 },
      { name: 'Membership Type', importance: 0.15 },
      { name: 'Days Since Last Purchase', importance: 0.10 }
    ]
  }

  const featureData = features || defaultFeatures['Simple Prediction']

  return (
    <div className="feature-importance">
      <h3>🔍 Feature Importance</h3>
      <p className="chart-subtitle">What factors influenced the prediction most</p>
      
      <div className="features-list">
        {featureData.map((feature, index) => (
          <div key={index} className="feature-item">
            <div className="feature-info">
              <span className="feature-name">{feature.name}</span>
              <span className="feature-percent">{(feature.importance * 100).toFixed(1)}%</span>
            </div>
            <div className="feature-bar">
              <div 
                className="feature-fill"
                style={{
                  width: `${feature.importance * 100}%`,
                  background: `linear-gradient(90deg, 
                    hsl(${200 + index * 20}, 70%, 50%), 
                    hsl(${200 + index * 20}, 70%, 60%))`
                }}
              ></div>
            </div>
            <div className="feature-rank">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
      
      <div className="feature-summary">
        <div className="summary-item">
          <div className="summary-label">Top Feature</div>
          <div className="summary-value">{featureData[0]?.name || 'N/A'}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Impact</div>
          <div className="summary-value">
            {(featureData.reduce((sum, f) => sum + f.importance, 0) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Features Analyzed</div>
          <div className="summary-value">{featureData.length}</div>
        </div>
      </div>
    </div>
  )
}

export default FeatureImportance