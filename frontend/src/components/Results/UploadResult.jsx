import React from 'react'
import PredictionChart from '../Charts/PredictionChart'
import PredictionTimeline from '../Charts/PredictionTimeline'

const UploadResult = ({ data }) => {
  if (!data.success) {
    return (
      <div className="error-card">
        <h3>❌ Error</h3>
        <p>{data.error}</p>
      </div>
    )
  }

  return (
    <div className="upload-result">
      <div className="result-header">
        <h3>📈 Batch Analysis Complete</h3>
        <p className="result-subtitle">
          Analyzed {data.total_samples} customers using {data.model || data.model_used}
        </p>
      </div>

      <div className="visualizations-section">
        <div className="viz-row">
          <div className="viz-column">
            <PredictionChart data={data} type="pie" />
          </div>
          <div className="viz-column">
            <PredictionTimeline predictions={data.predictions} />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total_samples}</div>
          <div className="stat-label">Total Samples</div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-value">{data.likely_to_purchase || data.will_purchase || 0}</div>
          <div className="stat-label">Will Purchase</div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-value">{data.unlikely_to_purchase || data.will_not_purchase || 0}</div>
          <div className="stat-label">Will Not Purchase</div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-value">
            {((data.conversion_rate || data.purchase_rate || 0) * 100).toFixed(1)}%
          </div>
          <div className="stat-label">Conversion Rate</div>
        </div>
      </div>

      {data.predictions && data.predictions.length > 0 && (
        <div className="sample-predictions">
          <h4>Sample Predictions</h4>
          <div className="predictions-table">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>City</th>
                  <th>Total Spend</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.slice(0, 5).map((pred, idx) => (
                  <tr key={idx}>
                    <td>{pred.customer_id || pred.row_id}</td>
                    <td>{pred.city || 'N/A'}</td>
                    <td>${pred.total_spend?.toFixed(2) || 'N/A'}</td>
                    <td>
                      <span className={`prediction-badge ${
                        pred.prediction?.includes('LIKELY') ? 'success' : 'warning'
                      }`}>
                        {pred.prediction}
                      </span>
                    </td>
                    <td>
                      {pred.confidence ? `${(pred.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadResult