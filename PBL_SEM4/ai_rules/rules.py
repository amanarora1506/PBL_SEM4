def generate_rooms(data):
    # data: dict with 'length', 'width', 'area', 'bhk', 'washrooms', 'parking', 'extra_rooms', 'type'
    length = float(data.get('length', 0) or 0)
    width = float(data.get('width', 0) or 0)
    total_area = length * width
    
    if total_area == 0:
        total_area = float(data.get('area', 1000) or 1000)

    usable_area = total_area * 0.85  # 15% circulation space
    
    rooms = []
    bhk = int(data.get('bhk', 1) or 1)
    washrooms = int(data.get('washrooms', 1) or 1)
    b_type = data.get('type', 'Residential')
    
    # Residential vs Commercial weights and zones
    if b_type == 'Residential':
        rooms.append({"name": "Living Room", "weight": 3.0, "zone": "Public"})
        rooms.append({"name": "Kitchen", "weight": 1.5, "zone": "Utility"})
        for i in range(bhk):
            rooms.append({"name": f"Bedroom {i+1}", "weight": 2.0, "zone": "Private"})
        for i in range(washrooms):
            rooms.append({"name": f"Washroom {i+1}", "weight": 0.8, "zone": "Utility"})
        if str(data.get('parking', 'no')).lower() == 'yes':
            rooms.append({"name": "Parking", "weight": 2.5, "zone": "Public"})
    else:
        rooms.append({"name": "Reception", "weight": 2.0, "zone": "Public"})
        rooms.append({"name": "Main Hall", "weight": 4.0, "zone": "Utility"})
        for i in range(bhk):
            rooms.append({"name": f"Office {i+1}", "weight": 1.5, "zone": "Private"})
        for i in range(washrooms):
            rooms.append({"name": f"Washroom {i+1}", "weight": 0.8, "zone": "Utility"})
        if str(data.get('parking', 'no')).lower() == 'yes':
            rooms.append({"name": "Parking", "weight": 2.5, "zone": "Public"})
            
    # Include extra rooms
    extra_rooms = data.get('extra_rooms', [])
    if isinstance(extra_rooms, str):
        extra_rooms = [r.strip() for r in extra_rooms.split(',') if r.strip()]
    for extra in extra_rooms:
         rooms.append({"name": extra, "weight": 1.5, "zone": "Utility"})
            
    # Calculate areas based on weight
    total_weight = sum(r['weight'] for r in rooms)
    for r in rooms:
        r['area'] = (r['weight'] / total_weight) * usable_area
        
    return rooms
