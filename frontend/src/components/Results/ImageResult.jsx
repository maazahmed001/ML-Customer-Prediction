import React from 'react'
import PredictionChart from '../Charts/PredictionChart'
import FeatureImportance from '../Charts/FeatureImportance'

const ImageResult = ({ data }) => {
  if (!data.success) {
    return (
      <div className="error-card">
        <h3>❌ Error</h3>
        <p>{data.error}</p>
      </div>
    )
  }

  return (
    <div className="image-result">
      <div className="result-header">
        <h3>📊 Image Classification Results</h3>
        <p className="result-subtitle">
          Classified using {data.model_type || 'Fashion MNIST CNN'} model
        </p>
      </div>

      {/* Top Prediction Card */}
      <div className="top-prediction">
        <div className="prediction-badge success">
          <span className="badge-label">🎯 Top Prediction</span>
          <span className="badge-value">{data.top_prediction?.category || 'Unknown'}</span>
          <span className="badge-confidence">
            Confidence: {data.top_prediction ? `${(data.top_prediction.confidence * 100).toFixed(1)}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Top 3 Predictions with Bars */}
      {data.all_predictions && data.all_predictions.length > 0 && (
        <div className="all-predictions">
          <h4>🏆 Top 3 Predictions</h4>
          <div className="predictions-list">
            {data.all_predictions.slice(0, 3).map((pred, idx) => (
              <div 
                key={idx} 
                className={`prediction-item ${idx === 0 ? 'top' : ''}`}
              >
                <div className="prediction-rank">#{idx + 1}</div>
                <div className="prediction-category">{pred.category}</div>
                <div className="prediction-bar-container">
                  <div 
                    className="prediction-bar-fill"
                    style={{ width: `${pred.confidence * 100}%` }}
                    data-confidence={`${(pred.confidence * 100).toFixed(1)}%`}
                  ></div>
                </div>
                <div className="prediction-percentage">
                  {(pred.confidence * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISUALIZATIONS SECTION - ADDED */}
      <div className="visualizations-section">
        <div className="viz-row">
          <div className="viz-column">
            <PredictionChart data={data} type="bar" />
          </div>
          <div className="viz-column">
            <FeatureImportance 
              features={[
                { name: 'Shape Features', importance: 0.40 },
                { name: 'Texture Patterns', importance: 0.30 },
                { name: 'Color Distribution', importance: 0.20 },
                { name: 'Edge Detection', importance: 0.10 }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Image Processing Info */}
      {data.image_info && (
        <div className="image-info-section">
          <h4>📷 Image Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Original Size:</span>
              <span className="info-value">
                {data.image_info.original_size?.join(' × ') || 'Unknown'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Color Mode:</span>
              <span className="info-value">
                {data.image_info.original_mode || 'Unknown'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Was Inverted:</span>
              <span className="info-value">
                {data.image_info.was_inverted ? 'Yes ⚫➡️⚪' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Model Information */}
      <div className="model-info">
        <h4>🤖 Model Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Model Type:</span>
            <span className="info-value">{data.model_type || 'Fashion MNIST CNN'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Input Shape:</span>
            <span className="info-value">
              {data.image_info?.processed_shape ? 
                `${data.image_info.processed_shape[1]}×${data.image_info.processed_shape[2]} grayscale` 
                : '28×28 grayscale'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className="info-value success">✅ Successfully Classified</span>
          </div>
        </div>
      </div>

      {/* Confidence Summary */}
      {data.all_predictions && data.all_predictions.length > 0 && (
        <div className="confidence-summary">
          <h4>📈 Confidence Distribution</h4>
          <div className="confidence-bars">
            {data.all_predictions.slice(0, 3).map((pred, idx) => (
              <div key={idx} className="confidence-item">
                <div className="confidence-label">
                  <span className="category-name">{pred.category}</span>
                  <span className="category-percent">{(pred.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${pred.confidence * 100}%`,
                      backgroundColor: idx === 0 ? '#2ecc71' : idx === 1 ? '#3498db' : '#9b59b6'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageResult