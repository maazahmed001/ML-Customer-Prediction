import React, { useState } from 'react'
import { predictImage } from '../../services/api'

const ImageClassification = ({ setResult, setLoading }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    
    if (selectedFile) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target.result)
      }
      reader.readAsDataURL(droppedFile)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Please select an image first')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await predictImage(formData)
      setResult(result)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.message || 'Failed to classify image' 
      })
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setFile(null)
    setPreview(null)
  }

  return (
    <div className="image-classification">
      <div className="form-header">
        <h2>📷 Fashion Product Classification</h2>
        <p>Upload a fashion product image. Our CNN model will classify it.</p>
      </div>

      <div className="upload-container">
        <div 
          className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
          onClick={() => document.getElementById('image-input').click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="image-input"
            type="file"
            accept=".jpg,.jpeg,.png,.bmp,.gif"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {preview ? (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button 
                type="button" 
                className="clear-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  clearImage()
                }}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📷</div>
              <p className="upload-text">
                {dragActive ? 'Drop image here' : 'Click or drag & drop to upload image'}
              </p>
              <p className="upload-subtext">
                Supports: JPG, PNG, BMP, GIF (Max 5MB)
              </p>
            </div>
          )}
        </div>

        <div className="image-actions">
          <button 
            type="button" 
            className="secondary-btn"
            onClick={() => document.getElementById('image-input').click()}
          >
            📁 Choose Different Image
          </button>
          
          <button 
            type="button" 
            className="primary-btn"
            onClick={handleSubmit}
            disabled={!file}
          >
            🔍 Classify Product
          </button>
        </div>

        <div className="image-info">
          <h3>📋 Supported Categories:</h3>
          <div className="categories-grid">
            {['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 
              'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'].map((category, idx) => (
              <div key={idx} className="category-tag">
                {category}
              </div>
            ))}
          </div>
          <p className="info-note">
            <strong>Note:</strong> Uses Fashion MNIST CNN model. Works best with 28x28 grayscale images.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImageClassification