import React, { useState } from 'react'

const ProfilePrediction = ({ setResult, setLoading }) => {
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [model, setModel] = useState('rf')

  const profiles = [
    {
      id: 1,
      name: "High-Value Shopper",
      icon: "💰",
      description: "Spends lots of time, views many products",
      details: "Will likely purchase with high confidence"
    },
    {
      id: 2,
      name: "Casual Browser",
      icon: "👀",
      description: "Quick visit, few pages viewed",
      details: "Unlikely to purchase today"
    },
    {
      id: 3,
      name: "Discount Hunter",
      icon: "🏷️",
      description: "Waits for promotions and sales",
      details: "Will purchase if good deal available"
    },
    {
      id: 4,
      name: "Returning Loyal",
      icon: "👑",
      description: "Frequent buyer, high satisfaction",
      details: "Very likely to purchase again"
    }
  ]

  const handlePredict = async (profileId) => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        success: true,
        profile: profiles.find(p => p.id === profileId),
        prediction: profileId === 1 || profileId === 4 ? "LIKELY to Purchase" : "UNLIKELY to Purchase",
        confidence: profileId === 1 ? 0.85 : profileId === 4 ? 0.92 : 0.35,
        model_used: model
      }
      setResult(mockResult)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="profile-prediction">
      <div className="profile-header">
        <h2>👥 Customer Profile Prediction</h2>
        <p>Select a customer profile to predict purchase behavior</p>
      </div>

      <div className="profiles-grid">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`profile-card ${selectedProfile === profile.id ? 'selected' : ''}`}
            onClick={() => setSelectedProfile(profile.id)}
          >
            <div className="profile-icon">{profile.icon}</div>
            <h3>{profile.name}</h3>
            <p className="profile-description">{profile.description}</p>
            <p className="profile-details">{profile.details}</p>
          </div>
        ))}
      </div>

      <div className="profile-actions">
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

        <button
          className="predict-btn"
          onClick={() => selectedProfile && handlePredict(selectedProfile)}
          disabled={!selectedProfile}
        >
          🚀 Predict for Selected Profile
        </button>
      </div>
    </div>
  )
}

export default ProfilePrediction