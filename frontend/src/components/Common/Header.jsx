import React from 'react'

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🛍️ AI E-Commerce Analytics</h1>
          <p className="subtitle">Machine Learning Customer Behavior Prediction System</p>
        </div>
        <div className="project-info">
          <p><strong>Course:</strong> Machine Learning (AIC-301)</p>
          <p><strong>Team:</strong> Maaz Ahmed, Omer Siddiqui, Hamza Tanveer</p>
          <p><strong>University:</strong> Bahria University, Karachi</p>
        </div>
      </div>
    </header>
  )
}

// THIS LINE IS CRITICAL - MAKE SURE IT EXISTS:
export default Header