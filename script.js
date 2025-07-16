document.getElementById('photoInput').addEventListener('change', function (e) { 
    const file = e.target.files[0] ;
    if (file) return ;

    EXIF.getData(file, function() {
        const lat =EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTAg(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

        if(lat && lon && latRef && lonRef) {
            const toDecimal = (d, ref) =>{
                let decimal = d[0] + d[1] / 60 + d[2] / 3600;
                return (ref === 'S' || ref === 'W') ? -decimal : decimal;
            };

            const latDecimal = toDecimal(lat, latRef);
            const lonDecimal = toDecimal(lon, lonRef);

            document.getElementById('coords').textContent = 'coordinate : ${latDecimal.toFixed(5)},  ${lonDecimal.toFixed(5)';

            L.marker([latDecimal, lonDecimal]).addTo(map)
            .bindPopup("Posizione estratta della photo").openPopup();

        }  else {
            alert("L'immagine non contienedi dati GPS.");
        }
    });
 });
 
Window.addEventListener('DOMContentLoaded', () =>{
    const banner = document.getElementById('consent-banner');
    const consent = localStorage.getItem('geoConsent');
    
    if ( !consent) {
        banner.style.display = 'block';
    }
    document.getElementById('accept-consent').addEventListener('click', () => {
        localStorage.setItem('geoConsent', 'accepted');
        banner.style.display = 'none';
    });
});
