from flask import Flask, render_template, request, jsonify
from ai_rules.rules import generate_rooms
from ai_rules.layout_engine import LayoutEngine

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/planner')
def planner():
    return render_template('planner.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/api/generate_layout', methods=['POST'])
def generate_layout():
    data = request.json
    rooms = generate_rooms(data)
    engine = LayoutEngine(rooms)
    layouts = engine.generate_layouts()
    return jsonify({"layouts": layouts, "rooms": rooms})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
