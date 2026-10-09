import axios from 'axios'

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'https://ml-customer-prediction.onrender.com'
const API_BASE_URL = rawUrl.replace(/\/+$/, '')

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --------------------------------------------------
// 1. SIMPLE PREDICTION
// --------------------------------------------------
export const predictSimple = async (data) => {
  try {
    console.log('📤 Sending to /predict:', JSON.stringify(data, null, 2))
    
    // Create CustomerData object (INTEGERS where required!)
    const customerData = {
      Administrative: 0.0,
      Administrative_Duration: 0.0,
      Informational: 0.0,
      Informational_Duration: 0.0,
      ProductRelated: Math.min(parseFloat(data.pages_viewed) * 2, 100),
      ProductRelated_Duration: Math.min(parseFloat(data.browsing_time_seconds) * 10, 1000),
      BounceRates: data.engagement_level === 'high' ? 0.05 : 
                   data.engagement_level === 'medium' ? 0.15 : 0.35,
      ExitRates: data.engagement_level === 'high' ? 0.02 : 
                 data.engagement_level === 'medium' ? 0.08 : 0.25,
      PageValues: data.engagement_level === 'high' ? 50.0 : 
                  data.engagement_level === 'medium' ? 25.0 : 8.0,
      SpecialDay: data.special_promo ? 0.8 : 0.0,
      Month: 5,                              // INTEGER
      OperatingSystems: 2,                   // INTEGER
      Browser: 2,                            // INTEGER
      Region: 3,                             // INTEGER
      TrafficType: 2,                        // INTEGER
      VisitorType: data.customer_type === 'returning' ? 1 : 0,  // INTEGER (0 or 1)
      Weekend: data.visited_weekend ? 1 : 0  // INTEGER (0 or 1)
      // NO 'model' field here - it goes in query params
    }
    
    console.log('✅ CustomerData for FastAPI:', JSON.stringify(customerData, null, 2))
    
    // Send with model as query parameter
    const response = await api.post('/predict', customerData, {
      params: {
        model: data.model || 'rf'
      }
    })
    
    console.log('✅ Response from FastAPI:', JSON.stringify(response.data, null, 2))
    
    // Format response for frontend
    return {
      success: true,
      prediction: response.data.prediction || "Unknown",
      confidence: response.data.probability || 0.5,
      model_used: response.data.model_used || data.model,
      recommendation: response.data.prediction === "Will Purchase" 
        ? "Customer is likely to purchase!" 
        : "Consider offering promotions"
    }
    
  } catch (error) {
    console.error('❌ FULL ERROR OBJECT:', error)
    console.error('❌ Error response data:', error.response?.data)
    console.error('❌ Error status:', error.response?.status)
    
    // Extract meaningful error message
    let errorMsg = 'Failed to get prediction'
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors
          errorMsg = errorData.detail.map(d => 
            `${d.loc?.join('.') || 'field'}: ${d.msg || d}`
          ).join(', ')
        } else {
          // Simple error message
          errorMsg = errorData.detail
        }
      } else if (errorData.error) {
        errorMsg = errorData.error
      } else if (typeof errorData === 'string') {
        errorMsg = errorData
      }
    } else if (error.message) {
      errorMsg = error.message
    }
    
    console.error('❌ Final error message:', errorMsg)
    throw new Error(errorMsg)
  }
}

// --------------------------------------------------
// 2. UNIVERSAL UPLOAD
// --------------------------------------------------
export const predictUniversal = async (formData) => {
  try {
    console.log('📤 Uploading to /predict-universal')
    
    const response = await axios.post(`${API_BASE_URL}/predict-universal`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000
    })
    
    console.log('✅ Response from /predict-universal:', JSON.stringify(response.data, null, 2))
    
    // Format response for frontend
    return {
      success: response.data.success || true,
      total_samples: response.data.total_samples || 0,
      likely_to_purchase: response.data.likely_to_purchase || 0,
      unlikely_to_purchase: response.data.unlikely_to_purchase || 0,
      conversion_rate: response.data.conversion_rate || 0,
      model_used: response.data.model || 'rf',
      predictions: response.data.predictions?.slice(0, 5) || [],
      mapping_warnings: response.data.mapping_warnings || []
    }
    
  } catch (error) {
    console.error('❌ Error in predictUniversal:', error.response?.data || error.message)
    
    let errorMsg = 'Failed to process file'
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error
    } else if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail
    }
    
    throw new Error(errorMsg)
  }
}

// --------------------------------------------------
// 4. IMAGE CLASSIFICATION
// --------------------------------------------------
export const predictImage = async (formData) => {
  try {
    console.log('📤 Uploading to /predict-image')
    
    const response = await axios.post(`${API_BASE_URL}/predict-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000
    })
    
    console.log('✅ Response from /predict-image:', JSON.stringify(response.data, null, 2))
    
    // Format response for frontend
    return {
      success: response.data.success || true,
      top_prediction: response.data.top_prediction,
      all_predictions: response.data.all_predictions || [],
      model_type: response.data.model_type || 'Fashion MNIST CNN',
      image_shape: response.data.image_shape || '28x28 grayscale'
    }
    
  } catch (error) {
    console.error('❌ Error in predictImage:', error.response?.data || error.message)
    
    let errorMsg = 'Failed to classify image'
    if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail
    } else if (error.response?.status === 501) {
      errorMsg = 'CNN model not available. Make sure Fashion MNIST CNN is loaded.'
    }
    
    throw new Error(errorMsg)
  }
}

// --------------------------------------------------
// 5. HEALTH CHECK
// --------------------------------------------------
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health')
    return {
      healthy: true,
      ml_models_loaded: response.data.ml_models_loaded || 0,
      timestamp: response.data.timestamp
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    }
  }
}

// --------------------------------------------------
// 6. LIST MODELS
// --------------------------------------------------
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/models')
    return response.data.customer_behavior_models?.available || ['rf', 'knn', 'svm', 'nb', 'dt']
  } catch (error) {
    return ['rf', 'knn', 'svm', 'nb', 'dt'] // Default fallback
  }
}

// =============================================
// CUSTOMER CLUSTERING ENDPOINT
// =============================================

export const clusterCustomers = async (file, nClusters, features, usePretrained = false, enableMapping = true) => {
  try {
    console.log('📤 Sending clustering request...')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('n_clusters', nClusters.toString())
    
    // Handle both array and string features
    if (Array.isArray(features)) {
      features.forEach(feature => {
        formData.append('features', feature)
      })
    } else {
      formData.append('features', features)
    }
    
    formData.append('use_pretrained', usePretrained.toString())
    formData.append('enable_mapping', enableMapping.toString())
    
    const response = await axios.post(`${API_BASE_URL}/cluster-customers`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000 // 2 minutes for clustering
    })
    
    console.log('✅ Clustering successful:', response.data)
    return {
      success: true,
      ...response.data
    }
    
  } catch (error) {
    console.error('❌ Clustering error:', error.response?.data || error.message)
    
    let errorMsg = 'Failed to perform clustering'
    if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail
    }
    
    return {
      success: false,
      error: errorMsg
    }
  }
}

// Helper to check clustering models
export const checkClusteringModels = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clustering/models/check`)
    return response.data
  } catch (error) {
    console.error('❌ Error checking models:', error)
    return { models_available: {} }
  }
}