import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'efficiency_model.pkl')
_model = None

def get_efficiency_score(plot_area, total_rooms, zoning_complexity):
    global _model
    
    # Load model lazily
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            # Fallback score if model process hasn't run yet
            return 85.0
            
    # Prepare feature array corresponding to the trained model
    features = np.array([[plot_area, total_rooms, zoning_complexity]])
    
    # Predict dynamic layout score!
    predicted_score = _model.predict(features)[0]
    return round(predicted_score, 1)
