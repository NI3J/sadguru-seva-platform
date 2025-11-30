from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "✅ Home route working"

@app.route('/bhaktgan', methods=['GET'])
def bhaktgan():
    return "✅ Bhaktgan route working"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
