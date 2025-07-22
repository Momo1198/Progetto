from flask import Flask, request, render_template, redirect, url_for
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_exif_data(image_path):
    """
    Extract EXIF data from an image file.
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        dict: Dictionary containing EXIF data, empty dict if no EXIF data found
    """
    try:
        with Image.open(image_path) as image:
            exif_data = image._getexif()
            
            if exif_data is None:
                return {}
            
            # Convert numeric tags to readable names
            exif_dict = {}
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                exif_dict[tag] = value
                
            return exif_dict
    except Exception as e:
        print(f"Error extracting EXIF data: {e}")
        return {}

# --- START OF CORRECTED CODE BLOCK ---

def _convert_to_float(value):
    """Helper function to convert an EXIF value to a float."""
    try:
        # Handle IFDRational objects (which have numerator and denominator)
        if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
            if value.denominator == 0:
                return 0.0
            return float(value.numerator) / float(value.denominator)
        # Handle a simple tuple (numerator, denominator)
        if isinstance(value, tuple) and len(value) == 2:
            if value[1] == 0:
                return 0.0
            return float(value[0]) / float(value[1])
        # Handle a simple number
        return float(value)
    except (TypeError, ValueError):
        # If conversion fails for any reason, return None
        return None

def dms_to_decimal(dms, ref):
    """
    Convert GPS coordinates from DMS (Degrees, Minutes, Seconds) format to decimal degrees.
    This version is more robust to handle different EXIF data formats.
    
    Args:
        dms (tuple): Tuple of (degrees, minutes, seconds)
        ref (str): Reference direction ('N', 'S', 'E', 'W')
        
    Returns:
        float or None: Decimal coordinate value, None if conversion fails
    """
    try:
        # dms should be a tuple of 3 values for degrees, minutes, seconds
        degrees = _convert_to_float(dms[0])
        minutes = _convert_to_float(dms[1])
        seconds = _convert_to_float(dms[2])

        # If any component failed to convert, we cannot proceed
        if degrees is None or minutes is None or seconds is None:
            print(f"Failed to convert DMS component. D: {dms[0]}, M: {dms[1]}, S: {dms[2]}")
            return None

        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        
        # Apply the direction reference ('S' or 'W' are negative)
        if ref in ['S', 'W']:
            decimal = -decimal
            
        return decimal
        
    except Exception as e:
        # Catch any other unexpected errors during conversion
        print(f"An unexpected error occurred in dms_to_decimal: {e}, Input DMS: {dms}")
        return None

# --- END OF CORRECTED CODE BLOCK ---

def get_lat_lon(exif_data):
    """
    Extract latitude and longitude from EXIF data.
    
    Args:
        exif_data (dict): Dictionary containing EXIF data
        
    Returns:
        tuple: (latitude, longitude) as floats, or (None, None) if extraction fails
    """
    try:
        # Check if GPS data exists
        if 'GPSInfo' not in exif_data:
            return (None, None)
            
        gps_info = exif_data['GPSInfo']
        
        # Convert GPS tag numbers to readable names
        gps_data = {}
        for tag_id, value in gps_info.items():
            tag = GPSTAGS.get(tag_id, tag_id)
            gps_data[tag] = value
        
        # Extract required GPS fields
        required_fields = ['GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef']
        for field in required_fields:
            if field not in gps_data:
                return (None, None)
        
        # Convert coordinates using the robust dms_to_decimal function
        latitude = dms_to_decimal(
            gps_data['GPSLatitude'],
            gps_data['GPSLatitudeRef']
        )
        longitude = dms_to_decimal(
            gps_data['GPSLongitude'],
            gps_data['GPSLongitudeRef']
        )
        
        # Validate conversion results
        if latitude is None or longitude is None:
            return (None, None)
            
        # Sanity check: ensure coordinates are within valid ranges
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            print(f"Invalid coordinate range. Lat: {latitude}, Lon: {longitude}")
            return (None, None)
            
        return (latitude, longitude)
        
    except Exception as e:
        print(f"Error extracting GPS coordinates: {e}")
        return (None, None)

@app.route('/', methods=['GET', 'POST'])
def index():
    """
    Main route handler for photo upload and GPS extraction.
    
    GET: Renders the upload form
    POST: Processes uploaded photo and extracts GPS data
    """
    if request.method == 'GET':
        return render_template('index.html')
    
    elif request.method == 'POST':
        try:
            # Check if file was uploaded
            if 'photo' not in request.files:
                return render_template('index.html',
                                       error="No file was selected. Please choose a photo to upload.")
            
            file = request.files['photo']
            
            # Check if file was actually selected
            if file.filename == '':
                return render_template('index.html',
                                       error="No file was selected. Please choose a photo to upload.")
            
            # Validate file extension
            if not allowed_file(file.filename):
                return render_template('index.html',
                                       error="Invalid file type. Please upload an image file (JPG, PNG, etc.).")
            
            # Create temporary upload directory if it doesn't exist
            upload_dir = 'temp_uploads'
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # Save uploaded file temporarily
            filename = secure_filename(file.filename)
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            
            try:
                # Extract EXIF data
                exif_data = extract_exif_data(file_path)
                
                if not exif_data:
                    return render_template('index.html',
                                           error="Sorry, no EXIF data was found in this photo. The image may not contain location information.")
                
                # Extract GPS coordinates
                latitude, longitude = get_lat_lon(exif_data)
                
                if latitude is not None and longitude is not None:
                    # Create Google Maps link
                    map_link = f"https://www.google.com/maps?q={latitude},{longitude}"
                    
                    return render_template('index.html',
                                           map_link=map_link,
                                           latitude=latitude,
                                           longitude=longitude,
                                           filename=file.filename)
                else:
                    return render_template('index.html',
                                           error="Sorry, no valid GPS data was found in this photo. The image may not have been taken with location services enabled.")
            
            finally:
                # Clean up temporary file
                try:
                    os.remove(file_path)
                except OSError:
                    # Fail silently if file cannot be removed
                    pass
                    
        except Exception as e:
            print(f"Unexpected error processing image: {e}")
            return render_template('index.html',
                                   error="An error occurred while processing your image. Please ensure the file is a valid image and try again.")

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return render_template('index.html',
                           error="The uploaded file is too large. Please select an image smaller than 16MB."), 413

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    return render_template('index.html',
                           error="An internal server error occurred. Please try again."), 500

if __name__ == '__main__':
    # Ensure required directories exist
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)

