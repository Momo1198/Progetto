// --- Theme Switcher Logic ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Function to apply the saved theme on page load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        themeToggle.checked = false;
    }
}

// Event listener for the theme toggle
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark'); // Save preference
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light'); // Save preference
    }
});

// Apply theme when the page is loaded
document.addEventListener('DOMContentLoaded', applySavedTheme);


// --- File Input Logic ---
const photoInput = document.getElementById('photo-input');
const fileNameDisplay = document.getElementById('file-name');

photoInput.addEventListener('change', () => {
    if (photoInput.files.length > 0) {
        // Display the name of the chosen file
        fileNameDisplay.textContent = photoInput.files[0].name;
    } else {
        fileNameDisplay.textContent = '';
    }
});
