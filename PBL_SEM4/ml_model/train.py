import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor

def build_efficiency_model():
    """
    Trains a Scikit-Learn Random Forest Regressor to predict 
    architectural spatial efficiency based on generative rules.
    """
    print("Generating synthetic architectural layout dataset...")
    np.random.seed(42)
    
    X_train = []
    y_train = []
    
    for _ in range(2500):
        # Features: [Plot Area, Room Count, Zoning Complexity (1-3)]
        area = np.random.uniform(500, 15000)      
        rooms = np.random.randint(1, 25)          
        zoning = np.random.randint(1, 4)          
        
        # Target formula (theoretical mapping mimicking constraints)
        base_score = 85.0
        density = area / rooms
        
        if density > 500:
            score = base_score + 10 - (zoning * 2)
        elif density > 250:
            score = base_score + 2 - (zoning * 3)
        else:
            score = base_score - 15 - (zoning * 4)
            
        # Add realistic noise/variance
        score += np.random.normal(0, 3.5)
        score = min(max(score, 50.0), 99.0) # Boundaries
        
        X_train.append([area, rooms, zoning])
        y_train.append(score)
        
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    print("Training Random Forest Regressor model...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    model_path = os.path.join(os.path.dirname(__file__), 'efficiency_model.pkl')
    joblib.dump(model, model_path)
    
    print(f"Model saved to {model_path} successfully.")
    print("The backend AI now actively leverages Machine Learning for layout scoring!")

if __name__ == "__main__":
    build_efficiency_model()
