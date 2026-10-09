import React, { useState } from 'react'
import Header from './components/Common/Header'
import SimplePrediction from './components/PredictionForms/SimplePrediction'
import DatasetUpload from './components/PredictionForms/DatasetUpload'
import ProfilePrediction from './components/PredictionForms/ProfilePrediction'
import ImageClassification from './components/PredictionForms/ImageClassification'  // Changed from AdvancedPrediction
import SimpleResult from './components/Results/SimpleResult'
import UploadResult from './components/Results/UploadResult'
import ProfileResult from './components/Results/ProfileResult'
import ImageResult from './components/Results/ImageResult'  // Added new import
import LoadingSpinner from './components/Common/LoadingSpinner'
import CustomerClustering from './components/PredictionForms/CustomerClustering'
import ClusteringResult from './components/Results/ClusteringResult'
import './styles/App.css'
import './styles/components.css'

function App() {
  const [activeTab, setActiveTab] = useState('simple')
  const [predictionResult, setPredictionResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Updated tabs - Changed 'advanced' to 'image'
  const tabs = [
    { id: 'simple', name: '🎯 Simple Prediction', icon: '' },
    { id: 'profiles', name: '👥 Customer Profiles', icon: '' },
    { id: 'upload', name: '📁 Upload Dataset', icon: '' },
    { id: 'image', name: '📷 Product Classification', icon: '' }, 
    { id: 'clustering', name: '🧩 Customer Clustering'},
  ]

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setPredictionResult(null)
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case 'simple':
        return <SimplePrediction setResult={setPredictionResult} setLoading={setLoading} />
      case 'profiles':
        return <ProfilePrediction setResult={setPredictionResult} setLoading={setLoading} />
      case 'upload':
        return <DatasetUpload setResult={setPredictionResult} setLoading={setLoading} />
      case 'image':  // Changed from 'advanced'
        return <ImageClassification setResult={setPredictionResult} setLoading={setLoading} />
      case 'clustering':
        return <CustomerClustering setResult={setPredictionResult} setLoading={setLoading} />
      default:
        return <SimplePrediction setResult={setPredictionResult} setLoading={setLoading} />
    }
  }

  const renderResult = () => {
    if (!predictionResult) return null
    

    if (predictionResult.error) {
      return (
        <div className="error-card">
          <h3>❌ Error</h3>
          <p>{predictionResult.error}</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'simple':
        return <SimpleResult data={predictionResult} />
      case 'profiles':
        return <ProfileResult data={predictionResult} />
      case 'upload':
        return <UploadResult data={predictionResult} />
      case 'image':  // Changed from 'advanced'
        return <ImageResult data={predictionResult} />  
      case 'clustering':
        return <ClusteringResult data={predictionResult} />
      default:
        return null
    }
  }

  return (
    <div className="app">
      <Header />
      
      <div className="container">
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <main className="main-content">
          {loading ? (
            <LoadingSpinner message="Analyzing with ML models..." />
          ) : (
            <>
              {renderContent()}
              
              {predictionResult && (
                <div className="results-section">
                  <h2 className="results-title">📊 Prediction Results</h2>
                  {renderResult()}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App