from flask import Flask, render_template


app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route('/')
def main():
    return render_template('index.html')


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()

    app.run(debug=True, port=args.port)