import base64
from pathlib import Path
from io import BytesIO

from flask import Flask, jsonify, render_template, request
from PIL import Image

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route('/')
def main():
    return render_template('index.html')

@app.route('/img', methods=['POST'])
def send():
    if request.method != 'POST':
        return jsonify({'result': False, "status": 400})
    base64_png = request.form['img']
    code = base64.b64decode(base64_png.split(',')[1])  # remove header
    image_decoded = Image.open(BytesIO(code))
    image_decoded.save(Path("hoge") / 'image.png')
    return jsonify({'result': True, "status": 200})

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()

    app.run(debug=True, port=args.port)
