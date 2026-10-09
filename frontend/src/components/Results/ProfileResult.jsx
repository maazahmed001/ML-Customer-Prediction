import React from 'react'

const ProfileResult = ({ data }) => {
  if (!data.success) {
    return (
      <div className="error-card">
        <h3>❌ Error</h3>
        <p>{data.error}</p>
      </div>
    )
  }

  const isLikely = data.prediction?.includes('LIKELY')

  return (
    <div className="profile-result">
      <div className="profile-result-header">
        <div className="profile-icon-large">{data.profile?.icon || '👤'}</div>
        <div>
          <h3>{data.profile?.name || 'Customer Profile'}</h3>
          <p className="profile-description">{data.profile?.description}</p>
        </div>
      </div>

      <div className={`prediction-outcome ${isLikely ? 'success' : 'warning'}`}>
        <div className="outcome-text">
          <h4>{data.prediction}</h4>
          <p>Confidence: {(data.confidence * 100).toFixed(1)}%</p>
        </div>
        <div className="outcome-icon">
          {isLikely ? '✅' : '⚠️'}
        </div>
      </div>

      <div className="profile-insights">
        <h4>📊 Insights</h4>
        <ul>
          <li>Model used: <strong>{data.model_used}</strong></li>
          <li>{data.profile?.details}</li>
          <li>Probability of purchase: {(data.confidence * 100).toFixed(1)}%</li>
          {isLikely && <li>Consider targeted marketing campaigns</li>}
          {!isLikely && <li>May need re-engagement strategies</li>}
        </ul>
      </div>
    </div>
  )
}

export default ProfileResult