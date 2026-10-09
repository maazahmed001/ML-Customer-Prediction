import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PredictionTimeline = ({ predictions = [] }) => {
  const [timelineData, setTimelineData] = useState([])

  useEffect(() => {
    // Generate timeline data from predictions
    if (predictions.length > 0) {
      const data = predictions.slice(0, 10).map((pred, index) => ({
        time: `Pred ${index + 1}`,
        confidence: pred.confidence ? pred.confidence * 100 : 50,
        purchase: pred.prediction?.includes('LIKELY') || pred.prediction === 'Will Purchase' ? 100 : 0,
        customerId: pred.customer_id || index + 1
      }))
      setTimelineData(data)
    } else {
      // Generate sample data for demonstration
      const sampleData = Array.from({ length: 10 }, (_, i) => ({
        time: `Cust ${i + 1}`,
        confidence: 40 + Math.random() * 50,
        purchase: Math.random() > 0.5 ? 100 : 0,
        customerId: i + 1
      }))
      setTimelineData(sampleData)
    }
  }, [predictions])

  return (
    <div className="prediction-timeline">
      <div className="timeline-header">
        <h3>📈 Prediction Timeline</h3>
        <p className="timeline-subtitle">Confidence trends across predictions</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="time" stroke="#888" />
          <YAxis 
            stroke="#888" 
            yAxisId="left"
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#888"
            domain={[0, 100]}
            hide
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'confidence') return [`${value.toFixed(1)}%`, 'Confidence']
              if (name === 'purchase') return [value === 100 ? 'Will Purchase' : 'Will Not Purchase', 'Prediction']
              return [value, name]
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="confidence"
            stroke="#3498db"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Confidence"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="purchase"
            stroke="#2ecc71"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Purchase Decision"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="timeline-stats">
        <div className="timeline-stat">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-label">Average Confidence</div>
            <div className="stat-value">
              {(timelineData.reduce((sum, d) => sum + d.confidence, 0) / timelineData.length || 0).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="timeline-stat">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-label">Purchase Predictions</div>
            <div className="stat-value">
              {timelineData.filter(d => d.purchase === 100).length}
            </div>
          </div>
        </div>
        <div className="timeline-stat">
          <div className="stat-icon">📈</div>
          <div>
            <div className="stat-label">Trend</div>
            <div className="stat-value">
              {timelineData.length > 1 ? 
                (timelineData[timelineData.length - 1].confidence > timelineData[0].confidence ? 'Increasing ↗' : 'Decreasing ↘') 
                : 'Stable →'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PredictionTimeline