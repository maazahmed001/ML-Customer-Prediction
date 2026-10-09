# main.py - COMPLETE WITH ALL ENDPOINTS
import os
import io
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import plotly.express as px
import plotly.io as pio

print("=" * 60)
print("STARTING E-COMMERCE ML API")
print("=" * 60)

# -------------------------------------------------------
# OPTIONAL IMPORTS FOR CNN
# -------------------------------------------------------
PIL_AVAILABLE = False
TF_AVAILABLE = False
CNN_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
    print("[INFO] PIL/Pillow available")
except ImportError:
    print("[WARNING] PIL/Pillow not installed.")

try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
    print("[INFO] TensorFlow available")
except ImportError:
    print("[WARNING] TensorFlow not installed.")

CNN_AVAILABLE = PIL_AVAILABLE and TF_AVAILABLE

# -------------------------------------------------------
# 1. Initialize FastAPI App
# -------------------------------------------------------
app = FastAPI(title="E-Commerce ML System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# 2. Load Customer Behavior ML Models
# -------------------------------------------------------
MODEL_DIR = "models"
MODELS = {}
SCALER = None

print(f"\nCurrent directory: {os.getcwd()}")
print(f"Looking for models in: {os.path.join(os.getcwd(), MODEL_DIR)}")

if not os.path.exists(MODEL_DIR):
    print(f"ERROR: {MODEL_DIR} directory not found!")
    os.makedirs(MODEL_DIR, exist_ok=True)
    print(f"Created empty {MODEL_DIR} directory")
else:
    print(f"\nContents of {MODEL_DIR}:")
    files = os.listdir(MODEL_DIR)
    for file in files:
        print(f"  - {file}")

try:
    # Load scaler
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    if os.path.exists(scaler_path):
        SCALER = joblib.load(scaler_path)
        print(f"\nSUCCESS: Loaded scaler from {scaler_path}")
        if hasattr(SCALER, 'n_features_in_'):
            print(f"  Features expected: {SCALER.n_features_in_}")
    else:
        print(f"\nERROR: Scaler file not found at {scaler_path}")
    
    # Load ML models
    model_files = {
        "knn": "knn_model.pkl",
        "svm": "svm_model.pkl",
        "nb": "nb_model.pkl",
        "dt": "dt_model.pkl",
        "rf": "rf_model.pkl"
    }
    
    loaded_count = 0
    print("\nLoading customer behavior ML models:")
    
    for name, filename in model_files.items():
        model_path = os.path.join(MODEL_DIR, filename)
        if os.path.exists(model_path):
            try:
                MODELS[name] = joblib.load(model_path)
                loaded_count += 1
                print(f"  ✅ {name} loaded")
            except Exception as e:
                print(f"  ❌ Error loading {name}: {e}")
        else:
            print(f"  ❌ {filename} not found")
    
    print(f"\n" + "=" * 40)
    print(f"SUMMARY: {loaded_count} ML models loaded")
    print(f"Models available: {list(MODELS.keys())}")
    print("=" * 40)
    
except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()

# -------------------------------------------------------
# 3. CNN Model Setup
# -------------------------------------------------------
cnn_model = None
cnn_class_names = None
CNN_READY = False

print("\n" + "=" * 50)
print("CHECKING CNN FILES")
print("=" * 50)

# Your specific CNN files
YOUR_CNN_FILES = {
    "model": "fashion_mnist_cnn.h5",
    "classes": "class_names.pkl"
}

cnn_model_path = os.path.join(MODEL_DIR, YOUR_CNN_FILES["model"])
class_names_path = os.path.join(MODEL_DIR, YOUR_CNN_FILES["classes"])

if CNN_AVAILABLE:
    try:
        # Check if files exist
        model_exists = os.path.exists(cnn_model_path)
        classes_exists = os.path.exists(class_names_path)
        
        print(f"\nCNN model exists: {model_exists}")
        print(f"Class names exist: {classes_exists}")
        
        if model_exists and classes_exists:
            print("✅ Both CNN files found!")
            
            # Load class names
            cnn_class_names = joblib.load(class_names_path)
            print(f"Class names: {cnn_class_names}")
            
            # Load CNN model
            print(f"Loading CNN model from {cnn_model_path}...")
            cnn_model = keras.models.load_model(cnn_model_path)
            print("✅ CNN model loaded successfully")
            
            # Model info
            print(f"\nModel input shape: {cnn_model.input_shape}")
            print(f"Model output shape: {cnn_model.output_shape}")
            
            CNN_READY = True
            print("\n🎯 CNN IMAGE CLASSIFICATION READY!")
            
    except Exception as e:
        print(f"\n❌ Error loading CNN: {e}")
        import traceback
        traceback.print_exc()
else:
    print("\n❌ CNN dependencies not installed")

# -------------------------------------------------------
# 4. Pydantic Models
# -------------------------------------------------------
class CustomerData(BaseModel):
    Administrative: float
    Administrative_Duration: float
    Informational: float
    Informational_Duration: float
    ProductRelated: float
    ProductRelated_Duration: float
    BounceRates: float
    ExitRates: float
    PageValues: float
    SpecialDay: float
    Month: int
    OperatingSystems: int
    Browser: int
    Region: int
    TrafficType: int
    VisitorType: int
    Weekend: int

# -------------------------------------------------------
# 5. API ENDPOINTS - YOU NEED THESE!
# -------------------------------------------------------

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "E-Commerce ML System API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/": "API information",
            "/health": "Health check",
            "/models": "List available models",
            "/predict": "Customer purchase prediction (POST)",
            "/predict-batch": "Batch prediction from CSV (POST)",
            "/predict-image": "Product image classification (POST)",
            "/docs": "Interactive API documentation",
            "/redoc": "Alternative API documentation"
        },
        "models": {
            "customer_behavior": list(MODELS.keys()),
            "cnn_ready": CNN_READY
        }
    }

# Add these functions to your main.py

def detect_dataset_type(df):
    """Detect what type of dataset this is"""
    
    dataset_types = {
        "online_shoppers": {
            "required_columns": ['Administrative', 'Administrative_Duration', 'Informational',
                                'Informational_Duration', 'ProductRelated', 'ProductRelated_Duration',
                                'BounceRates', 'ExitRates', 'PageValues', 'SpecialDay', 'Month',
                                'OperatingSystems', 'Browser', 'Region', 'TrafficType',
                                'VisitorType', 'Weekend'],
            "description": "Online Shoppers Intention Dataset"
        },
        "ecommerce_customers": {
            "required_columns": ['Customer ID', 'Gender', 'Age', 'City', 'Membership Type',
                                'Total Spend', 'Items Purchased', 'Average Rating',
                                'Discount Applied', 'Days Since Last Purchase', 'Satisfaction Level'],
            "description": "E-commerce Customer Behavior Dataset"
        },
        "general_customers": {
            "detect_columns": ['customer_id', 'total_spend', 'purchase_count', 'last_visit', 'membership'],
            "description": "General Customer Dataset"
        }
    }
    
    # Check for each dataset type
    columns_set = set(df.columns)
    
    # Check online shoppers
    online_shoppers_cols = set(dataset_types["online_shoppers"]["required_columns"])
    if online_shoppers_cols.issubset(columns_set):
        return "online_shoppers"
    
    # Check e-commerce customers
    ecommerce_cols = set(['Total Spend', 'Items Purchased', 'Membership Type', 'Customer ID'])
    if ecommerce_cols.issubset(columns_set):
        return "ecommerce_customers"
    
    # Check for general patterns
    column_names_lower = [col.lower() for col in df.columns]
    
    if any(word in ' '.join(column_names_lower) for word in ['spend', 'purchase', 'customer']):
        if any(word in ' '.join(column_names_lower) for word in ['rating', 'satisfaction', 'review']):
            return "customer_feedback"
        return "general_customers"
    
    # Check for web analytics
    if any(word in ' '.join(column_names_lower) for word in ['page', 'visit', 'session', 'bounce']):
        return "web_analytics"
    
    return "unknown"

def convert_to_standard_format(df, dataset_type):
    """Convert any dataset to the 17-feature standard format"""
    
    standard_features = [
        'Administrative', 'Administrative_Duration', 'Informational', 'Informational_Duration',
        'ProductRelated', 'ProductRelated_Duration', 'BounceRates', 'ExitRates', 'PageValues',
        'SpecialDay', 'Month', 'OperatingSystems', 'Browser', 'Region', 'TrafficType',
        'VisitorType', 'Weekend'
    ]
    
    converted_rows = []
    
    for _, row in df.iterrows():
        converted = {}
        
        if dataset_type == "online_shoppers":
            # Already in correct format
            for feature in standard_features:
                converted[feature] = row[feature] if feature in row else 0
        
        elif dataset_type == "ecommerce_customers":
            # Convert e-commerce data
            membership_map = {'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4}
            satisfaction_map = {'Unsatisfied': 0, 'Neutral': 0.5, 'Satisfied': 1}
            
            membership = membership_map.get(row.get('Membership Type', 'Silver'), 2)
            total_spend = row.get('Total Spend', 0)
            items = row.get('Items Purchased', 0)
            rating = row.get('Average Rating', 3.0)
            satisfaction = satisfaction_map.get(row.get('Satisfaction Level', 'Neutral'), 0.5)
            days_since = row.get('Days Since Last Purchase', 30)
            
            # Mapping logic
            converted = {
                'Administrative': min(items * 0.3, 10),
                'Administrative_Duration': min(total_spend * 0.5, 300),
                'Informational': membership,
                'Informational_Duration': membership * 20,
                'ProductRelated': items,
                'ProductRelated_Duration': total_spend * 2,
                'BounceRates': max(0.1, 0.4 - (satisfaction * 0.3)),
                'ExitRates': max(0.05, 0.3 - (rating * 0.05)),
                'PageValues': total_spend / max(items, 1),
                'SpecialDay': 0,
                'Month': 5,
                'OperatingSystems': 2,
                'Browser': 2,
                'Region': 3,
                'TrafficType': membership,
                'VisitorType': 1 if days_since < 30 else 0,
                'Weekend': 0
            }
            
            if row.get('Discount Applied', False):
                converted['PageValues'] *= 1.2
        
        elif dataset_type == "general_customers":
            # Generic conversion
            total_spend = row.get('total_spend', row.get('Total Spend', row.get('spend', 0)))
            purchase_count = row.get('purchase_count', row.get('Purchase Count', row.get('items', 0)))
            
            # Estimate other features
            converted = {
                'Administrative': min(purchase_count * 0.2, 8),
                'Administrative_Duration': min(total_spend * 0.3, 200),
                'Informational': 2,
                'Informational_Duration': 60,
                'ProductRelated': purchase_count,
                'ProductRelated_Duration': total_spend * 1.5,
                'BounceRates': 0.2,
                'ExitRates': 0.15,
                'PageValues': total_spend / max(purchase_count, 1),
                'SpecialDay': 0,
                'Month': 5,
                'OperatingSystems': 2,
                'Browser': 2,
                'Region': 3,
                'TrafficType': 2,
                'VisitorType': 1,
                'Weekend': 0
            }
        
        elif dataset_type == "web_analytics":
            # Web analytics data
            pageviews = row.get('pageviews', row.get('Pageviews', row.get('visits', 10)))
            time_spent = row.get('time_spent', row.get('Time Spent', row.get('duration', 120)))
            
            converted = {
                'Administrative': min(pageviews * 0.1, 5),
                'Administrative_Duration': min(time_spent * 0.1, 100),
                'Informational': min(pageviews * 0.2, 4),
                'Informational_Duration': min(time_spent * 0.2, 80),
                'ProductRelated': min(pageviews * 0.7, 15),
                'ProductRelated_Duration': min(time_spent * 0.7, 400),
                'BounceRates': row.get('bounce_rate', row.get('Bounce Rate', 0.25)),
                'ExitRates': row.get('exit_rate', row.get('Exit Rate', 0.2)),
                'PageValues': row.get('page_value', row.get('Page Value', 5.0)),
                'SpecialDay': 0,
                'Month': 5,
                'OperatingSystems': 2,
                'Browser': 2,
                'Region': 3,
                'TrafficType': 2,
                'VisitorType': 1,
                'Weekend': 0
            }
        
        else:
            # Default: use column mapping if possible
            column_mapping = {
                'Administrative': ['admin', 'admin_pages', 'administrative'],
                'ProductRelated': ['product', 'products', 'items', 'purchases'],
                'BounceRates': ['bounce', 'bounce_rate'],
                'PageValues': ['value', 'page_value', 'revenue'],
                'VisitorType': ['returning', 'new_customer', 'visitor_type']
            }
            
            # Try to map columns
            for std_col, possible_names in column_mapping.items():
                for name in possible_names:
                    for df_col in df.columns:
                        if name in df_col.lower():
                            converted[std_col] = row[df_col]
                            break
                    if std_col in converted:
                        break
                if std_col not in converted:
                    converted[std_col] = 0  # Default
        
        # Ensure all 17 features are present
        for feature in standard_features:
            if feature not in converted:
                converted[feature] = 0
        
        converted_rows.append(converted)
    
    return pd.DataFrame(converted_rows)

@app.post("/predict-universal")
async def predict_universal(
    file: UploadFile = File(...),
    model: str = Form("rf")
):
    """Universal batch prediction for ANY dataset - with smart feature mapping"""
    try:
        if model not in MODELS:
            raise HTTPException(status_code=400, detail=f"Model '{model}' not available")
        if not SCALER:
            raise HTTPException(status_code=500, detail="Scaler not loaded")
        
        # Read file
        contents = await file.read()
        
        # Try to read as CSV
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except:
            # Try Excel if CSV fails
            try:
                df = pd.read_excel(io.BytesIO(contents))
            except:
                raise HTTPException(status_code=400, detail="File must be CSV or Excel format")
        
        print(f"📊 Uploaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"📋 Columns: {df.columns.tolist()}")
        
        # =============================================
        # SMART FEATURE MAPPING FOR E-COMMERCE DATA
        # =============================================
        # This is the EXACT order your scaler expects
        standard_features_in_order = [
            'Administrative', 'Administrative_Duration', 'Informational', 'Informational_Duration',
            'ProductRelated', 'ProductRelated_Duration', 'BounceRates', 'ExitRates', 'PageValues',
            'SpecialDay', 'Month', 'OperatingSystems', 'Browser', 'Region', 'TrafficType',
            'VisitorType', 'Weekend'
        ]
        
        df_converted = pd.DataFrame()
        column_map = {}
        warnings = []
        
        # SMART MAPPING LOGIC FOR E-COMMERCE DATA
        for feature in standard_features_in_order:
            mapped_value = None
            mapping_source = None
            
            # Check for direct column matches first
            for df_col in df.columns:
                df_col_lower = df_col.lower()
                feature_lower = feature.lower()
                
                # Direct match or partial match
                if (feature_lower in df_col_lower or 
                    df_col_lower in feature_lower or
                    any(word in df_col_lower for word in feature_lower.split('_'))):
                    
                    mapped_value = df[df_col]
                    mapping_source = df_col
                    break
            
            # If no direct match, use SMART BUSINESS MAPPING
            if mapped_value is None:
                mapped_value, mapping_source = smart_ecommerce_mapping(feature, df)
            
            # If still no mapping, use intelligent defaults
            if mapped_value is None:
                mapped_value, mapping_source = get_intelligent_default(feature, df)
                warnings.append(f"⚠️ Using default for {feature}: {mapping_source}")
            
            df_converted[feature] = mapped_value
            column_map[feature] = mapping_source
        
        # =============================================
        # CRITICAL: Ensure EXACT column order
        # =============================================
        df_converted = df_converted[standard_features_in_order]
        
        print(f"\n🔍 Smart feature mapping:")
        for feature, source in column_map.items():
            print(f"  {feature:25} → {source}")
        
        print(f"\n📊 Sample converted data (first row):")
        print(df_converted.iloc[0].to_dict())
        
        # Make predictions - Convert to numpy array without column names
        X_values = df_converted.values
        
        print(f"\n🧪 Data shape for scaling: {X_values.shape}")
        
        # Scale the data
        X_scaled = SCALER.transform(X_values)
        
        print(f"✅ Data scaled successfully. Shape: {X_scaled.shape}")
        
        # Make predictions
        predictions = MODELS[model].predict(X_scaled)
        
        # Get probabilities if available
        probabilities = None
        if hasattr(MODELS[model], "predict_proba"):
            probabilities = MODELS[model].predict_proba(X_scaled)
        
        # =============================================
        # PREPARE RESULTS WITH BUSINESS LOGIC CHECKS
        # =============================================
        results = []
        questionable_predictions = 0
        high_confidence_predictions = 0
        
        for i, (orig_row, pred) in enumerate(zip(df.to_dict('records'), predictions)):
            # Get prediction and confidence
            prediction_text = "LIKELY to Purchase" if pred == 1 else "UNLIKELY to Purchase"
            confidence = float(probabilities[i][pred]) if probabilities is not None else None
            prob_purchase = float(probabilities[i][1]) if probabilities is not None else None
            
            # Basic result structure
            result = {
                "row_id": i,
                "customer_id": orig_row.get('Customer ID', i),
                "prediction": prediction_text,
                "raw_prediction": int(pred),
                "confidence": confidence,
                "probability_purchase": prob_purchase,
                "notes": [],
                "warnings": []
            }
            
            # Add key original data
            for key in ['Customer ID', 'Total Spend', 'Items Purchased', 'Membership Type', 
                        'City', 'Satisfaction Level', 'Average Rating', 'Days Since Last Purchase',
                        'Discount Applied', 'Gender', 'Age']:
                if key in orig_row:
                    result[key.lower().replace(' ', '_')] = orig_row[key]
            
            # =============================================
            # BUSINESS LOGIC CHECKS & WARNINGS
            # =============================================
            
            # 1. Unsatisfied but predicted to purchase
            if (result.get('satisfaction_level') == 'Unsatisfied' and 
                prediction_text == 'LIKELY to Purchase'):
                result["warnings"].append("⚠️ Counter-intuitive: Unsatisfied customer predicted as likely buyer")
                result["recommendation"] = "Consider manual review - satisfaction issues may affect purchase"
                result["business_logic_override"] = "Suggested: UNLIKELY to Purchase"
                result["flag_for_review"] = True
                questionable_predictions += 1
            
            # 2. Long inactive but predicted to purchase
            elif (result.get('days_since_last_purchase', 0) > 90 and 
                  prediction_text == 'LIKELY to Purchase'):
                result["warnings"].append(f"⚠️ Inactive customer ({result.get('days_since_last_purchase')} days) predicted as likely buyer")
                result["recommendation"] = "Send re-engagement campaign before expecting purchase"
                result["flag_for_review"] = True
                questionable_predictions += 1
            
            # 3. Low rating but predicted to purchase
            elif (result.get('average_rating', 5) < 2.5 and 
                  prediction_text == 'LIKELY to Purchase'):
                result["warnings"].append(f"⚠️ Low-rated customer ({result.get('average_rating')}/5) predicted as likely buyer")
                result["recommendation"] = "Address product/service issues first"
                result["flag_for_review"] = True
                questionable_predictions += 1
            
            # 4. High confidence purchase predictions
            elif (prediction_text == 'LIKELY to Purchase' and 
                  confidence is not None and confidence > 0.8):
                result["notes"].append("✅ High-confidence purchase prediction")
                result["priority"] = "HIGH"
                high_confidence_predictions += 1
            
            # 5. High-value customers predicted not to purchase
            elif (result.get('total_spend', 0) > 1000 and 
                  prediction_text == 'UNLIKELY to Purchase'):
                result["notes"].append("💎 High-value customer predicted unlikely to purchase")
                result["recommendation"] = "Consider personalized retention offer"
                result["flag_for_review"] = True
            
            # 6. New Bronze members predicted to purchase
            elif (result.get('membership_type') == 'Bronze' and 
                  result.get('days_since_last_purchase', 0) < 30 and
                  prediction_text == 'LIKELY to Purchase'):
                result["notes"].append("🎯 New Bronze member showing purchase intent")
                result["recommendation"] = "Offer upgrade incentive"
            
            # 7. Discount seekers
            if result.get('discount_applied') == True and prediction_text == 'LIKELY to Purchase':
                result["notes"].append("🏷️ Discount-sensitive customer")
                result["recommendation"] = "Use promotions to drive purchase"
            
            results.append(result)
        
        purchase_count = sum(predictions)
        total = len(predictions)
        
        response = {
            "success": True,
            "model": model,
            "original_columns": df.columns.tolist(),
            "feature_mapping": column_map,
            "mapping_warnings": warnings,
            "total_samples": total,
            "likely_to_purchase": int(purchase_count),
            "unlikely_to_purchase": int(total - purchase_count),
            "conversion_rate": float(purchase_count / total) if total > 0 else 0,
            "prediction_quality": {
                "questionable_predictions": questionable_predictions,
                "questionable_rate": float(questionable_predictions / total) if total > 0 else 0,
                "high_confidence_predictions": high_confidence_predictions,
                "notes": f"{questionable_predictions} predictions flagged for manual review"
            },
            "predictions": results[:50],
            "has_more": total > 50,
            "note": "Smart feature mapping applied. Check 'warnings' for questionable predictions."
        }
        
        # Add business insights
        if purchase_count > 0:
            response["business_insights"] = {
                "top_spending_customers": sorted(
                    [r for r in results if 'total_spend' in r], 
                    key=lambda x: x.get('total_spend', 0), 
                    reverse=True
                )[:5],
                "high_value_unlikely": [
                    r for r in results 
                    if r['prediction'] == 'UNLIKELY to Purchase' 
                    and r.get('total_spend', 0) > 500
                ][:5]
            }
        
        return response
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error: {e}\n{error_details}")
        
        # More helpful error message
        error_msg = f"Universal prediction error: {str(e)}"
        if "feature names" in str(e).lower():
            error_msg += "\n\nTIPS: The model expects 17 specific features in exact order."
            error_msg += "\n1. Check that converted data has all 17 columns"
            error_msg += "\n2. Ensure columns are in correct order"
            error_msg += "\n3. Try manual mapping with /predict-with-mapping"
        
        return {
            "error": error_msg,
            "uploaded_columns": df.columns.tolist() if 'df' in locals() else None,
            "supported_formats": [
                "Online Shoppers Intention (17 specific columns)",
                "E-commerce Customer Data",
                "General Customer Data with spend/purchase info",
                "Web Analytics Data"
            ],
            "quick_fix": "Try /predict-with-mapping with this mapping: " + json.dumps({
                "Administrative": "Items Purchased",
                "ProductRelated": "Items Purchased",
                "PageValues": "Total Spend",
                "Administrative_Duration": "Total Spend",
                "ProductRelated_Duration": "Total Spend",
                "BounceRates": "Average Rating",
                "ExitRates": "Average Rating",
                "VisitorType": "Membership Type",
                "Region": "City"
            })
        }

# =============================================
# HELPER FUNCTIONS FOR SMART MAPPING
# =============================================

def smart_ecommerce_mapping(feature, df):
    """Smart mapping for e-commerce customer data"""
    
    # Define mapping rules for common e-commerce features
    mapping_rules = {
        'Administrative': {
            'sources': ['Items Purchased', 'purchases', 'transactions', 'orders'],
            'transform': lambda x: x * 0.5  # Scale down
        },
        'Administrative_Duration': {
            'sources': ['Total Spend', 'revenue', 'amount'],
            'transform': lambda x: x * 0.3  # Convert spend to time estimate
        },
        'ProductRelated': {
            'sources': ['Items Purchased', 'products', 'quantity'],
            'transform': lambda x: x
        },
        'ProductRelated_Duration': {
            'sources': ['Total Spend', 'revenue', 'amount'],
            'transform': lambda x: x * 0.4
        },
        'BounceRates': {
            'sources': ['Average Rating', 'satisfaction', 'rating'],
            'transform': lambda x: max(0.1, 0.5 - (x * 0.1))  # Higher rating = lower bounce
        },
        'ExitRates': {
            'sources': ['Average Rating', 'satisfaction'],
            'transform': lambda x: max(0.05, 0.3 - (x * 0.05))
        },
        'PageValues': {
            'sources': ['Total Spend', 'revenue', 'amount'],
            'transform': lambda x: x / 10  # Normalize
        },
        'VisitorType': {
            'sources': ['Membership Type', 'member', 'tier'],
            'transform': lambda x: 1 if str(x).lower() in ['gold', 'platinum', 'premium'] else 0.5
        },
        'Region': {
            'sources': ['City', 'location', 'region'],
            'transform': lambda x: hash(str(x)) % 10 + 1  # Convert to numeric code
        },
        'SpecialDay': {
            'sources': ['Discount Applied', 'promotion', 'sale'],
            'transform': lambda x: 1 if x in [True, 'True', 'Yes', 1] else 0
        },
        'Month': {
            'sources': ['Days Since Last Purchase', 'date', 'month'],
            'transform': lambda x: (30 - min(x, 30)) // 10 + 1  # Recent = later month
        }
    }
    
    if feature in mapping_rules:
        rules = mapping_rules[feature]
        
        # Look for source columns
        for source_pattern in rules['sources']:
            for col in df.columns:
                if source_pattern.lower() in col.lower():
                    # Apply transformation
                    transformed = df[col].apply(rules['transform'])
                    return transformed, f"{col} (transformed)"
    
    return None, None

def get_intelligent_default(feature, df):
    """Get intelligent default values based on dataset statistics"""
    
    # Calculate dataset statistics for better defaults
    total_spend_mean = df['Total Spend'].mean() if 'Total Spend' in df.columns else 500
    items_mean = df['Items Purchased'].mean() if 'Items Purchased' in df.columns else 10
    rating_mean = df['Average Rating'].mean() if 'Average Rating' in df.columns else 3.5
    
    defaults = {
        'Administrative': (items_mean * 0.3, f"default_based_on_items({items_mean:.1f}*0.3)"),
        'Administrative_Duration': (total_spend_mean * 0.2, f"default_based_on_spend({total_spend_mean:.1f}*0.2)"),
        'Informational': (2.0, "default_2.0"),
        'Informational_Duration': (60.0, "default_60.0"),
        'ProductRelated': (items_mean, f"default_items_mean({items_mean:.1f})"),
        'ProductRelated_Duration': (total_spend_mean * 0.3, f"default_based_on_spend({total_spend_mean:.1f}*0.3)"),
        'BounceRates': (max(0.1, 0.4 - (rating_mean * 0.05)), f"default_based_on_rating({rating_mean:.1f})"),
        'ExitRates': (max(0.05, 0.25 - (rating_mean * 0.03)), f"default_based_on_rating({rating_mean:.1f})"),
        'PageValues': (total_spend_mean / max(items_mean, 1), f"default_spend_per_item({total_spend_mean:.1f}/{items_mean:.1f})"),
        'SpecialDay': (0.0, "default_0.0"),
        'Month': (5, "default_month_5"),
        'OperatingSystems': (2, "default_os_2"),
        'Browser': (2, "default_browser_2"),
        'Region': (3, "default_region_3"),
        'TrafficType': (2, "default_traffic_2"),
        'VisitorType': (0.5, "default_visitor_0.5"),
        'Weekend': (0, "default_weekday")
    }
    
    return pd.Series([defaults[feature][0]] * len(df)), defaults[feature][1]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ml_models_loaded": len(MODELS),
        "scaler_loaded": SCALER is not None,
        "cnn_ready": CNN_READY,
        "timestamp": pd.Timestamp.now().isoformat()
    }

@app.get("/models")
async def get_models():
    """List all available models"""
    return {
        "customer_behavior_models": {
            "available": list(MODELS.keys()),
            "default": "rf",
            "count": len(MODELS)
        },
        "cnn_model": {
            "available": CNN_READY,
            "classes": cnn_class_names if CNN_READY else None,
            "input_shape": cnn_model.input_shape if CNN_READY else None
        }
    }

@app.post("/predict")
async def predict_customer(
    customer_data: CustomerData,
    model: str = "rf"
):
    """Predict if a customer will make a purchase"""
    if not MODELS:
        raise HTTPException(status_code=500, detail="No ML models loaded")
    if model not in MODELS:
        raise HTTPException(
            status_code=400, 
            detail=f"Model '{model}' not available. Choose from: {list(MODELS.keys())}"
        )
    if not SCALER:
        raise HTTPException(status_code=500, detail="Scaler not loaded")
    
    try:
        # Prepare input array
        features = np.array([[
            customer_data.Administrative,
            customer_data.Administrative_Duration,
            customer_data.Informational,
            customer_data.Informational_Duration,
            customer_data.ProductRelated,
            customer_data.ProductRelated_Duration,
            customer_data.BounceRates,
            customer_data.ExitRates,
            customer_data.PageValues,
            customer_data.SpecialDay,
            customer_data.Month,
            customer_data.OperatingSystems,
            customer_data.Browser,
            customer_data.Region,
            customer_data.TrafficType,
            customer_data.VisitorType,
            customer_data.Weekend
        ]])
        
        # Scale features
        features_scaled = SCALER.transform(features)
        
        # Get model and predict
        ml_model = MODELS[model]
        prediction = ml_model.predict(features_scaled)[0]
        
        # Get probability if available
        probability = None
        if hasattr(ml_model, "predict_proba"):
            proba = ml_model.predict_proba(features_scaled)[0]
            probability = float(proba[prediction])
        
        return {
            "model_used": model,
            "prediction": "Will Purchase" if prediction == 1 else "Will Not Purchase",
            "probability": probability,
            "raw_prediction": int(prediction),
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict-batch")
async def batch_predict(
    file: UploadFile = File(...),
    model: str = Form("rf")
):
    """Batch prediction from CSV file"""
    if model not in MODELS:
        raise HTTPException(status_code=400, detail=f"Model '{model}' not available")
    if not SCALER:
        raise HTTPException(status_code=500, detail="Scaler not loaded")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Check required columns
        required_cols = [
            'Administrative', 'Administrative_Duration', 'Informational',
            'Informational_Duration', 'ProductRelated', 'ProductRelated_Duration',
            'BounceRates', 'ExitRates', 'PageValues', 'SpecialDay', 'Month',
            'OperatingSystems', 'Browser', 'Region', 'TrafficType',
            'VisitorType', 'Weekend'
        ]
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")
        
        # Prepare data
        X = df[required_cols]
        X_scaled = SCALER.transform(X)
        
        # Make predictions
        predictions = MODELS[model].predict(X_scaled)
        
        # Prepare results
        results = []
        for i, pred in enumerate(predictions):
            results.append({
                "customer_id": i,
                "prediction": "Will Purchase" if pred == 1 else "Will Not Purchase",
                "raw_prediction": int(pred)
            })
        
        # Calculate statistics
        purchase_count = sum(predictions)
        total_count = len(predictions)
        
        return {
            "model_used": model,
            "total_predictions": total_count,
            "will_purchase": int(purchase_count),
            "will_not_purchase": int(total_count - purchase_count),
            "purchase_rate": float(purchase_count / total_count) if total_count > 0 else 0,
            "predictions": results[:100],  # Return first 100
            "has_more": total_count > 100
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.post("/predict-image")
async def predict_image(file: UploadFile = File(...)):
    """Classify fashion product image (improved color handling for Fashion MNIST)"""
    
    if not CNN_READY:
        raise HTTPException(
            status_code=501,
            detail="CNN image classification not available."
        )

    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {list(allowed_extensions)}"
        )

    try:
        # --------------------------------------------------
        # 1. Read image
        # --------------------------------------------------
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Store original info for response
        original_size = image.size
        original_mode = image.mode
        
        print(f"📷 Original image: {original_size}, mode: {original_mode}")

        # --------------------------------------------------
        # 2. SMART COLOR CONVERSION
        # --------------------------------------------------
        if image.mode in ("RGBA", "LA"):
            # Remove alpha channel
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode == "P":
            # Palette mode
            image = image.convert("RGB")
        elif image.mode != "L":
            # Convert RGB to grayscale
            if image.mode == "RGB":
                image = image.convert("L")
            else:
                image = image.convert("L")

        # --------------------------------------------------
        # 3. SMART RESIZING with aspect ratio preservation
        # --------------------------------------------------
        target_size = (28, 28)
        
        # Preserve aspect ratio by padding
        image.thumbnail(target_size, Image.BILINEAR)
        
        # Create new image with target size and white background
        new_image = Image.new("L", target_size, 255)  # White background
        
        # Calculate position to paste (centered)
        paste_x = (target_size[0] - image.size[0]) // 2
        paste_y = (target_size[1] - image.size[1]) // 2
        new_image.paste(image, (paste_x, paste_y))
        
        image = new_image

        # --------------------------------------------------
        # 4. Convert to numpy array
        # --------------------------------------------------
        img_array = np.array(image)

        # --------------------------------------------------
        # 5. SMART NORMALIZATION with contrast adjustment
        # --------------------------------------------------
        # Normalize to 0-1
        img_array = img_array.astype("float32") / 255.0
        
        # Auto-contrast: stretch histogram to full range
        min_val = img_array.min()
        max_val = img_array.max()
        if max_val > min_val:
            img_array = (img_array - min_val) / (max_val - min_val)

        # --------------------------------------------------
        # 6. SMART COLOR INVERSION DETECTION
        # --------------------------------------------------
        # Check if object is dark on light background
        edge_mean = np.concatenate([
            img_array[0, :],  # Top edge
            img_array[-1, :], # Bottom edge
            img_array[:, 0],  # Left edge
            img_array[:, -1]  # Right edge
        ]).mean()
        
        center_mean = img_array[10:18, 10:18].mean()
        
        # Convert to Python bool for JSON serialization
        was_inverted = bool(edge_mean - center_mean > 0.3)
        
        # If edges are significantly lighter than center, invert
        if was_inverted:
            img_array = 1.0 - img_array
            print("🔄 Inverted colors (dark object on light background)")

        # --------------------------------------------------
        # 7. Add noise reduction (optional)
        # --------------------------------------------------
        try:
            from scipy.ndimage import gaussian_filter
            img_array = gaussian_filter(img_array, sigma=0.5)
        except ImportError:
            print("⚠️ scipy not available, skipping gaussian filter")

        # --------------------------------------------------
        # 8. Reshape for CNN (1, 28, 28, 1)
        # --------------------------------------------------
        img_array = img_array.reshape(1, 28, 28, 1)

        print(f"✅ Processed image shape: {img_array.shape}")

        # --------------------------------------------------
        # 9. Predict
        # --------------------------------------------------
        preds = cnn_model.predict(img_array, verbose=0)[0]
        predicted_idx = int(np.argmax(preds))
        confidence = float(preds[predicted_idx])  # Convert to Python float

        # Top-3 predictions
        top3_idx = np.argsort(preds)[-3:][::-1]
        top3 = [
            {
                "category": str(cnn_class_names[i]),  # Ensure string
                "confidence": float(preds[i])  # Convert to Python float
            }
            for i in top3_idx
        ]

        # --------------------------------------------------
        # 10. Return JSON-serializable response
        # --------------------------------------------------
        response_data = {
            "success": True,
            "top_prediction": {
                "category": str(cnn_class_names[predicted_idx]),
                "confidence": confidence
            },
            "top_3_predictions": top3,
            "image_info": {
                "original_size": list(original_size),  # Convert tuple to list
                "original_mode": str(original_mode),
                "processed_shape": list(img_array.shape),  # Convert tuple to list
                "was_inverted": was_inverted,  # Python bool
                "aspect_ratio_preserved": True
            },
            "model": "Fashion MNIST CNN (Enhanced)",
            "processing_steps": [
                "Color normalization",
                "Aspect ratio preservation",
                "Auto-contrast",
                "Smart inversion detection"
            ]
        }
        
        print(f"✅ Prediction: {cnn_class_names[predicted_idx]} with {confidence:.2%} confidence")
        return response_data

    except Exception as e:
        import traceback
        print(f"❌ Image processing error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Image processing failed: {str(e)}"
        )

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload customer dataset for analysis"""
    try:
        # Create uploads directory
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Read file info
        df = pd.read_csv(file_path)
        
        return {
            "success": True,
            "filename": file.filename,
            "file_path": file_path,
            "rows": df.shape[0],
            "columns": df.shape[1],
            "columns_list": df.columns.tolist(),
            "preview": df.head().to_dict(orient="records"),
            "message": "File uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")
    
@app.post("/predict-with-mapping")
async def predict_with_mapping(
    file: UploadFile = File(...),
    model: str = Form("rf"),
    mapping_json: str = Form("{}")
):
    """Predict with custom column mapping"""
    try:
        # Parse mapping
        mapping = json.loads(mapping_json)
        
        # Read file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Convert using custom column mapping
        standard_features = [
            'Administrative', 'Administrative_Duration', 'Informational', 'Informational_Duration',
            'ProductRelated', 'ProductRelated_Duration', 'BounceRates', 'ExitRates', 'PageValues',
            'SpecialDay', 'Month', 'OperatingSystems', 'Browser', 'Region', 'TrafficType',
            'VisitorType', 'Weekend'
        ]
        
        df_converted = pd.DataFrame()
        
        for feature in standard_features:
            if feature in mapping and mapping[feature] in df.columns:
                df_converted[feature] = df[mapping[feature]]
            else:
                # Use default value
                df_converted[feature] = 0
        
        # Scale and predict
        X_scaled = SCALER.transform(df_converted)
        predictions = MODELS[model].predict(X_scaled)
        
        # Prepare results with confidence if available
        results = []
        for i, pred in enumerate(predictions):
            result = {
                "row_id": i,
                "prediction": "Will Purchase" if pred == 1 else "Will Not Purchase",
                "raw_prediction": int(pred)
            }
            
            # Get probability if model supports it
            if hasattr(MODELS[model], "predict_proba"):
                proba = MODELS[model].predict_proba(X_scaled)[i]
                result["confidence"] = float(proba[pred])
                result["probability_purchase"] = float(proba[1])
            
            results.append(result)
        
        return {
            "success": True,
            "mapping_used": mapping,
            "model": model,
            "total_samples": len(predictions),
            "will_purchase": int(sum(predictions)),
            "will_not_purchase": int(len(predictions) - sum(predictions)),
            "purchase_rate": float(sum(predictions) / len(predictions)) if len(predictions) > 0 else 0,
            "predictions": results[:100],
            "has_more": len(predictions) > 100
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mapping prediction error: {str(e)}")
    
def auto_detect_feature_mappings(df):
    """Automatically detect what features represent based on data"""
    feature_types = {}
    
    for col in df.columns:
        col_data = df[col]
        
        # Initialize with default values
        feature_info = {
            'type': 'unknown',
            'suggested_name': col
        }
        
        # Analyze column content
        if pd.api.types.is_numeric_dtype(col_data):
            # Numerical features
            mean_val = col_data.mean()
            std_val = col_data.std()
            
            # Clean column name for matching
            col_lower = str(col).lower()
            
            if any(keyword in col_lower for keyword in ['value', 'spend', 'price', 'cost', 'revenue', 'amount']):
                feature_info['type'] = 'monetary'
                feature_info['suggested_name'] = 'Total Spend'
            elif any(keyword in col_lower for keyword in ['duration', 'time', 'minute', 'second', 'hour']):
                feature_info['type'] = 'temporal'
                feature_info['suggested_name'] = 'Engagement Time'
            elif any(keyword in col_lower for keyword in ['rate', 'ratio', 'percentage', 'percent', 'bounce', 'exit']):
                feature_info['type'] = 'percentage'
                feature_info['suggested_name'] = 'Engagement Rate'
            elif mean_val > 1000 and std_val > 500:
                feature_info['type'] = 'high_value'
                feature_info['suggested_name'] = 'High Value Metric'
            else:
                feature_info['type'] = 'generic_numeric'
                feature_info['suggested_name'] = col
        
        elif pd.api.types.is_string_dtype(col_data) or pd.api.types.is_categorical_dtype(col_data):
            # Categorical features
            unique_count = col_data.nunique()
            col_lower = str(col).lower()
            
            # Check for known categorical patterns
            if any(keyword in col_lower for keyword in ['type', 'category', 'group', 'segment', 'visitor']):
                feature_info['type'] = 'customer_segment'
                feature_info['suggested_name'] = 'Customer Type'
            elif any(keyword in col_lower for keyword in ['month', 'day', 'year', 'date', 'week']):
                feature_info['type'] = 'time_period'
                feature_info['suggested_name'] = 'Time Period'
            elif any(keyword in col_lower for keyword in ['region', 'city', 'country', 'location']):
                feature_info['type'] = 'geographic'
                feature_info['suggested_name'] = 'Location'
            elif unique_count < 10:
                feature_info['type'] = 'category_small'
                feature_info['suggested_name'] = 'Customer Category'
            else:
                feature_info['type'] = 'category_large'
                feature_info['suggested_name'] = 'Category'
        
        # Handle boolean/flag columns
        elif pd.api.types.is_bool_dtype(col_data) or (col_data.nunique() == 2 and set(col_data.dropna().unique()) == {0, 1}):
            feature_info['type'] = 'flag'
            feature_info['suggested_name'] = 'Flag'
        
        # Add statistics for numerical columns
        if pd.api.types.is_numeric_dtype(col_data):
            feature_info['mean'] = float(col_data.mean())
            feature_info['std'] = float(col_data.std())
            feature_info['min'] = float(col_data.min())
            feature_info['max'] = float(col_data.max())
        
        # Add general statistics
        feature_info['unique_values'] = int(col_data.nunique())
        feature_info['missing_values'] = int(col_data.isnull().sum())
        feature_info['data_type'] = str(col_data.dtype)
        
        # Store in dictionary
        feature_types[col] = feature_info
    
    return feature_types

# Add this to your endpoint for automatic suggestions
@app.post("/analyze-dataset")
async def analyze_dataset(file: UploadFile = File(...)):
    """Analyze dataset and suggest feature mappings"""
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    feature_analysis = auto_detect_feature_mappings(df)
    column_stats = []
    
    for col, info in feature_analysis.items():
        col_stats = {
            'column_name': col,
            'data_type': str(df[col].dtype),
            'unique_values': df[col].nunique(),
            'missing_values': df[col].isnull().sum(),
            'suggested_mapping': info['suggested_name'],
            'feature_type': info['type']
        }
        
        if df[col].dtype in ['int64', 'float64']:
            col_stats.update({
                'mean': float(df[col].mean()),
                'std': float(df[col].std()),
                'min': float(df[col].min()),
                'max': float(df[col].max())
            })
        
        column_stats.append(col_stats)
    
    return {
        'dataset_info': {
            'rows': len(df),
            'columns': len(df.columns),
            'columns_list': list(df.columns)
        },
        'feature_analysis': column_stats,
        'suggested_clustering_features': [
            col for col, info in feature_analysis.items() 
            if info['type'] in ['monetary', 'temporal', 'high_value']
        ][:5],  # Top 5 suggestions
        'recommended_mappings': {
            info['suggested_name']: col 
            for col, info in feature_analysis.items() 
            if info['type'] in ['monetary', 'temporal']
        }
    }
    
# Add these mapping dictionaries BEFORE the endpoint
CLUSTERING_FEATURE_MAPPINGS = {
    # Map generic feature names to actual dataset columns
    'Total Spend': ['PageValues', 'revenue', 'amount', 'spend', 'value', 'price'],
    'Items Purchased': ['ProductRelated', 'items', 'products', 'purchases', 'quantity'],
    'Average Rating': ['BounceRates', 'ExitRates', 'rating', 'satisfaction', 'score'],
    'Engagement Time': ['ProductRelated_Duration', 'Administrative_Duration', 'duration', 'time_spent'],
    'Customer Type': ['VisitorType', 'member_type', 'tier', 'category'],
    'Purchase Frequency': ['Administrative', 'Informational', 'frequency', 'visits'],
    'Page Views': ['ProductRelated', 'Informational', 'pageviews', 'views'],
    'Region': ['Region', 'city', 'location', 'country'],
    'Browser': ['Browser', 'device', 'platform'],
    'Month': ['Month', 'period', 'season']
}

def map_clustering_features(requested_features, available_columns, df):
    """Map requested clustering features to actual dataset columns"""
    mapped_features = []
    mapping_report = []
    
    for requested_feature in requested_features:
        found = False
        requested_lower = str(requested_feature).lower()
        
        # 1. Direct exact match (case-insensitive)
        for actual_col in available_columns:
            if requested_lower == str(actual_col).lower():
                mapped_features.append(actual_col)
                mapping_report.append(f"Exact match: '{requested_feature}' → '{actual_col}'")
                found = True
                break
        
        if not found:
            # 2. Check mapping dictionary
            if requested_feature in CLUSTERING_FEATURE_MAPPINGS:
                possible_matches = CLUSTERING_FEATURE_MAPPINGS[requested_feature]
                for possible_match in possible_matches:
                    for actual_col in available_columns:
                        if possible_match.lower() in str(actual_col).lower():
                            mapped_features.append(actual_col)
                            mapping_report.append(f"Mapped: '{requested_feature}' → '{actual_col}' (via '{possible_match}')")
                            found = True
                            break
                    if found:
                        break
        
        if not found:
            # 3. Partial/fuzzy match
            for actual_col in available_columns:
                actual_lower = str(actual_col).lower()
                if (requested_lower in actual_lower or 
                    actual_lower in requested_lower or
                    any(word in actual_lower for word in requested_lower.split())):
                    mapped_features.append(actual_col)
                    mapping_report.append(f"Partial match: '{requested_feature}' → '{actual_col}'")
                    found = True
                    break
        
        # 4. If still not found, use the most relevant column based on type
        if not found:
            # Try to find any numeric column
            numeric_cols = [col for col in available_columns 
                          if pd.api.types.is_numeric_dtype(df[col])]  # Now 'df' is available
            if numeric_cols:
                # Use first numeric column as default
                mapped_features.append(numeric_cols[0])
                mapping_report.append(f"Default numeric: '{requested_feature}' → '{numeric_cols[0]}'")
            else:
                # Last resort: use first available column
                mapped_features.append(available_columns[0])
                mapping_report.append(f"Default fallback: '{requested_feature}' → '{available_columns[0]}'")
    
    return mapped_features, mapping_report

@app.post("/cluster-customers")
async def cluster_customers(
    file: UploadFile = File(...),
    n_clusters: int = Form(4),
    features: str = Form("Total Spend,Items Purchased,Average Rating"),
    use_pretrained: bool = Form(False),
    enable_mapping: bool = Form(True)
):
    """Perform K-Means clustering on customer data with smart feature mapping"""
    try:
        # =============================================
        # DEBUG: Show what we received
        # =============================================
        print(f"\n" + "="*60)
        print(f"🔍 DEBUG: use_pretrained = {use_pretrained}")
        print(f"🔍 DEBUG: Model file exists: {os.path.exists('models/kmeans_model.pkl')}")
        print(f"🔍 DEBUG: Model path: {os.path.abspath('models/kmeans_model.pkl')}")
        print("="*60)
        
        # Always split the comma-separated string
        print(f"🔍 RAW features received: {features}")
        features_list = [f.strip() for f in features.split(',')]
        
        print(f"✅ Processed features: {features_list}")
        print(f"✅ Number of features: {len(features_list)}")
        
        # Validate we have at least 2 features
        if len(features_list) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 2 features for clustering. Got: {len(features_list)} features: {features_list}"
            )
        
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Apply feature mapping
        if enable_mapping:
            available_columns = list(df.columns)
            mapped_features, mapping_report = map_clustering_features(features_list, available_columns, df)
            
            print("\n🔍 Feature mapping report:")
            for report in mapping_report:
                print(f"  {report}")
            
            available_features = mapped_features
        else:
            available_features = [col for col in features_list if col in df.columns]
            if not available_features:
                raise HTTPException(
                    status_code=400, 
                    detail=f"None of the requested features found. Available: {list(df.columns)}"
                )
        
        print(f"\n✅ Final features for clustering: {available_features}")
        
        # Prepare data for clustering
        X = df[available_features].fillna(0)
        
        # Check if we have enough features
        if len(available_features) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 2 features for clustering. Got: {len(available_features)}"
            )
        
        # ALWAYS train a fresh scaler
        print("🔄 Training fresh scaler for current dataset...")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        print(f"✅ Scaled data shape: {X_scaled.shape}")
        
        # =============================================
        # PRE-TRAINED MODEL LOGIC WITH DEBUG
        # =============================================
        kmeans = None
        clusters = None
        inertia = 0
        model_type = "newly-trained"
        
        # Check if pre-trained should be used
        if use_pretrained:
            print(f"\n🔍 ATTEMPTING TO USE PRE-TRAINED MODEL...")
            print(f"   use_pretrained: {use_pretrained}")
            print(f"   Model exists: {os.path.exists('models/kmeans_model.pkl')}")
            
            if os.path.exists("models/kmeans_model.pkl"):
                try:
                    print("🔄 Loading pre-trained KMeans model...")
                    kmeans = joblib.load("models/kmeans_model.pkl")
                    
                    print(f"✅ Model loaded successfully!")
                    print(f"   Model type: {type(kmeans)}")
                    print(f"   Model has predict: {hasattr(kmeans, 'predict')}")
                    print(f"   Model n_clusters: {getattr(kmeans, 'n_clusters', 'UNKNOWN')}")
                    
                    # Verify the model
                    if not hasattr(kmeans, 'predict'):
                        raise ValueError("Loaded model is not a valid KMeans model")
                    
                    # Check cluster count
                    model_n_clusters = getattr(kmeans, 'n_clusters', None)
                    if model_n_clusters is not None:
                        print(f"🔍 Model has {model_n_clusters} clusters, requested {n_clusters}")
                        
                        if model_n_clusters != n_clusters:
                            print(f"⚠️ Adjusting n_clusters from {n_clusters} to {model_n_clusters}")
                            n_clusters = model_n_clusters
                    
                    # Use pre-trained model to predict
                    print("🔄 Predicting clusters with pre-trained model...")
                    clusters = kmeans.predict(X_scaled)
                    
                    if hasattr(kmeans, 'inertia_'):
                        inertia = kmeans.inertia_
                    
                    model_type = "pre-trained"
                    print(f"✅ SUCCESS: Used PRE-TRAINED model with {n_clusters} clusters")
                    
                except Exception as e:
                    print(f"❌ ERROR loading pre-trained model: {e}")
                    import traceback
                    traceback.print_exc()
                    print("   Falling back to training new model...")
                    model_type = "newly-trained (fallback)"
                    kmeans = None
                    clusters = None
            else:
                print(f"❌ Model file not found at: models/kmeans_model.pkl")
                model_type = "newly-trained (no file)"
        else:
            print(f"\n🔍 use_pretrained={use_pretrained}, training new model")
        
        # If pre-trained not used or failed, train new model
        if clusters is None:
            print(f"\n🔄 TRAINING NEW KMeans model with {n_clusters} clusters...")
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(X_scaled)
            inertia = kmeans.inertia_
            model_type = "newly-trained"
            print(f"✅ Trained NEW model with {n_clusters} clusters")
        
        print(f"\n🎯 FINAL MODEL TYPE: {model_type}")
        print(f"🎯 Number of clusters: {n_clusters}")
        print(f"🎯 Unique clusters found: {len(set(clusters))}")
        
        # Add cluster labels to dataframe
        df['Cluster'] = clusters
        df['Cluster'] = df['Cluster'].astype(str)
        
        # Calculate cluster statistics
        cluster_stats = []
        for cluster_num in range(n_clusters):
            cluster_mask = clusters == cluster_num
            cluster_data = df[cluster_mask]
            
            stats = {
                "cluster": cluster_num,
                "size": int(cluster_mask.sum()),
                "percentage": (cluster_mask.sum() / len(df)) * 100,
                "model_type": model_type
            }
            
            # Calculate statistics for each feature
            for feature in available_features:
                feature_data = df.loc[cluster_mask, feature]
                stats[f"{feature}_mean"] = float(feature_data.mean())
                stats[f"{feature}_std"] = float(feature_data.std())
                stats[f"{feature}_min"] = float(feature_data.min())
                stats[f"{feature}_max"] = float(feature_data.max())
            
            # Identify cluster characteristics
            characteristics = []
            overall_means = df[available_features].mean()
            
            for feature in available_features:
                cluster_mean = stats[f"{feature}_mean"]
                overall_mean = overall_means[feature]
                
                if cluster_mean > overall_mean * 1.3:
                    characteristics.append(f"Very High {feature}")
                elif cluster_mean > overall_mean * 1.15:
                    characteristics.append(f"High {feature}")
                elif cluster_mean < overall_mean * 0.7:
                    characteristics.append(f"Very Low {feature}")
                elif cluster_mean < overall_mean * 0.85:
                    characteristics.append(f"Low {feature}")
            
            stats["characteristics"] = characteristics
            stats["label"] = f"Cluster {cluster_num}"
            cluster_stats.append(stats)
        
        # Prepare response
        response = {
            "success": True,
            "message": "Clustering completed successfully!",
            "clustering_results": {
                "algorithm": "K-Means",
                "model_type": model_type,
                "n_clusters": int(n_clusters),
                "features_used": available_features,
                "total_customers": len(df),
                "cluster_count": len(set(clusters)),
                "model_loaded": "PRE-TRAINED" if model_type == "pre-trained" else "NEWLY-TRAINED"
            },
            "sample_data": df[['Cluster'] + available_features].head(5).to_dict(orient='records'),
            "debug_info": {
                "use_pretrained_param": use_pretrained,
                "model_file_exists": os.path.exists("models/kmeans_model.pkl")
            } if model_type == "newly-trained" else None
        }
        
        print(f"\n✅ Returning response with model_type: {model_type}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Clustering error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Clustering failed: {str(e)}")
    
# Add this helper endpoint
@app.get("/clustering/models/check")
async def check_clustering_models():
    """Check available clustering models"""
    models_info = {}
    
    # Check for KMeans model
    kmeans_path = "models/kmeans_model.pkl"
    if os.path.exists(kmeans_path):
        try:
            kmeans = joblib.load(kmeans_path)
            models_info["kmeans_model"] = {
                "exists": True,
                "n_clusters": getattr(kmeans, 'n_clusters', 'Unknown'),
                "file_size_kb": os.path.getsize(kmeans_path) / 1024,
                "compatible": hasattr(kmeans, 'predict')
            }
        except:
            models_info["kmeans_model"] = {"exists": True, "error": "Failed to load"}
    else:
        models_info["kmeans_model"] = {"exists": False}
    
    return {
        "models_available": models_info,
        "recommendation": "Only KMeans model needed. Scaler is trained fresh per dataset.",
        "required_files": ["kmeans_model.pkl"],
        "optional_files": []
    }

# -------------------------------------------------------
# 6. Run the App
# -------------------------------------------------------
if __name__ == "__main__":
    # Create directories
    for dir_name in ["uploads", "eda_results", "clustering_results"]:
        os.makedirs(dir_name, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("✅ SERVER STARTED SUCCESSFULLY")
    print("=" * 60)
    print("\n🌐 API Endpoints:")
    print("  • http://localhost:8000/          - API information")
    print("  • http://localhost:8000/docs      - Interactive documentation")
    print("  • http://localhost:8000/health    - Health check")
    print("  • http://localhost:8000/models    - List models")
    print("\n📚 Available models:")
    print(f"  • Customer behavior: {list(MODELS.keys())}")
    print(f"  • CNN image classification: {'READY' if CNN_READY else 'NOT READY'}")
    print("=" * 60 + "\n")
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )