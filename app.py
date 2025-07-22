# =================================================
# == GeoPhoto - app.py (DIAGNOSTIC VERSION)    ==
# =================================================

import os
from flask import Flask, request, render_template
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import json # We will use this to display the data nicely

app = Flask(__name__)
app.secret_key = 'a_very_secret_key_for_the_app'

def get_exif_data(image):
    """Extracts EXIF data and prepares it for display."""
    exif_data = {}
    try:
        info = image._getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                # We convert bytes to a string representation to avoid errors
                if isinstance(value, bytes):
                    try:
                        # Try to decode as UTF-8, if not, use hex representation
                        value = value.decode('utf-8', errors='ignore')
                    except:
                        value = value.hex()
                exif_data[decoded] = str(value) # Convert all values to string for safety
    except Exception as e:
        exif_data['Error'] = f"Could not read EXIF data: {e}"
    return exif_data


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'photo' not in request.files:
            return render_template('index.html', error="No photo part in the form.")
        
        file = request.files['photo']
        
        if file.filename == '':
            return render_template('index.html', error="No photo selected.")

        if file:
            try:
                image = Image.open(file.stream)
                
                # --- THIS IS THE IMPORTANT PART ---
                # We get all the data and send it to the page to be displayed
                diagnostic_data = get_exif_data(image)
                
                # We use json.dumps to format the dictionary nicely
                pretty_data = json.dumps(diagnostic_data, indent=4)

                return render_template('index.html', diagnostic_data=pretty_data)

            except Exception as e:
                return render_template('index.html', error=f"Could not open the image. Error: {e}")

    # For a GET request, just show the normal page
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
