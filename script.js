/**
 * GeoPhoto JavaScript Module
 *
 * This module handles:
 * 1. Theme switching with localStorage persistence
 * 2. File upload interface enhancements
 * 3. Loading state management
 * 4. Clipboard functionality
 * 5. User interface interactions
 *
 * @author GeoPhoto Development Team
 * @version 1.0.1
 */

class GeoPhotoApp {
    constructor() {
        // --- Element Selectors ---
        this.themeToggle = document.getElementById('theme-toggle');
        this.fileInput = document.getElementById('photo');
        this.fileInfo = document.getElementById('file-info');
        this.uploadForm = document.getElementById('upload-form');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.toast = document.getElementById('toast');
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application.
     * Sets up event listeners and applies the saved theme.
     */
    init() {
        // Wait for the DOM to be fully loaded before running setup
        document.addEventListener('DOMContentLoaded', () => {
            this.setupThemeToggle();
            this.setupFileInput();
            this.setupFormSubmission();
            this.loadSavedTheme();
            this.setupClipboard();

            // Initialize with a fade-in animation for a smooth entry
            document.body.style.opacity = '0';
            window.addEventListener('load', () => {
                document.body.style.transition = 'opacity 0.5s ease';
                document.body.style.opacity = '1';
            });
        });
    }

    /**
     * --- Theme Management System ---
     * Handles light/dark theme switching with localStorage persistence.
     */
    setupThemeToggle() {
        if (!this.themeToggle) return;
        
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add keyboard accessibility for the theme toggle button
        this.themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Toggles between light and dark themes and saves the preference.
     */
    toggleTheme() {
        const body = document.body;
        const isDarkMode = body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            body.classList.remove('dark-mode');
            this.saveThemePreference('light');
        } else {
            body.classList.add('dark-mode');
            this.saveThemePreference('dark');
        }

        // Add a subtle visual feedback animation to the button
        this.themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.themeToggle.style.transform = '';
        }, 150);
    }

    /**
     * Saves the current theme preference to localStorage.
     * @param {string} theme - The theme to save ('light' or 'dark').
     */
    saveThemePreference(theme) {
        try {
            localStorage.setItem('geoPhotoTheme', theme);
        } catch (error) {
            console.warn('Unable to save theme preference to localStorage:', error);
        }
    }

    /**
     * Loads the saved theme preference from localStorage on page load.
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('geoPhotoTheme');
            
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
            } else if (savedTheme === 'light') {
                document.body.classList.remove('dark-mode');
            } else {
                // Default to dark theme if no preference is saved
                document.body.classList.add('dark-mode');
                this.saveThemePreference('dark');
            }
        } catch (error) {
            console.warn('Unable to load theme preference from localStorage:', error);
            // Fallback to dark theme in case of error
            document.body.classList.add('dark-mode');
        }
    }

    /**
     * --- File Input Enhancement System ---
     * Provides visual feedback, file information, and drag-and-drop.
     */
    setupFileInput() {
        if (!this.fileInput || !this.fileInfo) return;

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        // Setup drag and drop functionality
        const fileLabel = document.querySelector('.file-input-label');
        if (fileLabel) {
            this.setupDragAndDrop(fileLabel);
        }
    }

    /**
     * Handles file selection and displays file information.
     * @param {Event} event - The file input change event.
     */
    handleFileSelection(event) {
        const file = event.target.files[0];
        
        if (file) {
            this.displayFileInfo(file);
            this.validateFile(file);
        } else {
            this.clearFileInfo();
        }
    }

    /**
     * Displays the selected file's information.
     * @param {File} file - The selected file object.
     */
    displayFileInfo(file) {
        const fileSize = this.formatFileSize(file.size);
        const fileType = file.type || 'Unknown';
        
        // --- Corrected unclosed <strong> tag ---
        this.fileInfo.innerHTML = `
            <div class="file-details">
                <div class="file-name">
                    <i class="fas fa-file-image"></i>
                    <strong>${file.name}</strong>
                </div>
                <div class="file-meta">
                    <span class="file-size">${fileSize}</span>
                    <span class="file-type">${fileType}</span>
                </div>
            </div>
        `;
        
        this.fileInfo.classList.add('visible');
    }

    /**
     * Clears the file information display.
     */
    clearFileInfo() {
        this.fileInfo.classList.remove('visible');
        setTimeout(() => {
            this.fileInfo.innerHTML = '';
        }, 300); // Wait for fade-out transition
    }

    /**
     * Validates the selected file based on size and type.
     * @param {File} file - The file to validate.
     * @returns {boolean} - True if the file is valid, false otherwise.
     */
    validateFile(file) {
        const maxSize = 16 * 1024 * 1024; // 16MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
        
        let isValid = true;
        let errorMessage = '';

        if (file.size > maxSize) {
            isValid = false;
            errorMessage = 'File size exceeds the 16MB limit.';
        } else if (!allowedTypes.includes(file.type.toLowerCase())) {
            isValid = false;
            errorMessage = 'Invalid file type. Please select an image.';
        }

        if (!isValid) {
            this.showFileError(errorMessage);
        } else {
            this.clearFileError();
        }

        return isValid;
    }

    /**
     * Displays a file validation error message.
     * @param {string} message - The error message to display.
     */
    showFileError(message) {
        this.fileInfo.innerHTML = `
            <div class="file-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        this.fileInfo.classList.add('visible');
        this.fileInfo.style.color = 'var(--error-color)';
    }

    /**
     * Clears the file validation error styling.
     */
    clearFileError() {
        this.fileInfo.style.color = '';
    }

    /**
     * Sets up drag and drop event listeners.
     * @param {HTMLElement} dropZone - The element to use as a drop zone.
     */
    setupDragAndDrop(dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.style.borderColor = 'var(--accent-color)';
        element.style.backgroundColor = 'var(--container-bg)';
    }

    unhighlight(element) {
        element.style.borderColor = '';
        element.style.backgroundColor = '';
    }

    /**
     * Handles the file drop event.
     * @param {DragEvent} e - The drop event.
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileSelection({ target: { files: files } });
        }
    }

    /**
     * --- Form Submission and State Management ---
     */
    setupFormSubmission() {
        if (!this.uploadForm) return;

        this.uploadForm.addEventListener('submit', (e) => {
            if (!this.validateFormSubmission()) {
                e.preventDefault();
                return;
            }
            this.showLoadingState();
        });
    }

    /**
     * Validates the form before submission.
     * @returns {boolean} - True if the form is valid.
     */
    validateFormSubmission() {
        const file = this.fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a photo before submitting.', 'error');
            return false;
        }

        return this.validateFile(file);
    }

    /**
     * Shows the loading overlay and disables the submit button.
     */
    showLoadingState() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
            
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;
            }
        }
    }
    
    /**
     * --- Clipboard Functionality ---
     */
    setupClipboard() {
        // Use event delegation for any copy buttons that might be added dynamically
        document.body.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-btn');
            if (copyBtn) {
                const textToCopy = copyBtn.dataset.clipboardText;
                if (textToCopy) {
                    this.copyToClipboard(textToCopy, copyBtn);
                }
            }
        });
    }

    /**
     * Copies text to the clipboard and provides user feedback.
     * @param {string} text - The text to copy.
     * @param {HTMLElement} buttonElement - The button that was clicked.
     */
    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Coordinates copied to clipboard!');
            
            // Provide visual feedback on the button
            const originalText = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
            }, 2000);

        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.showToast('Could not copy text.', 'error');
        });
    }

    /**
     * --- Utility Functions ---
     */

    /**
     * Formats a file size in bytes into a human-readable string.
     * @param {number} bytes - The file size in bytes.
     * @returns {string} - The formatted file size (e.g., "1.23 MB").
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - The type of notification ('success', 'error', 'info').
     */
    showToast(message, type = 'success') {
        if (!this.toast) return;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        // --- Completed the innerHTML and added functionality ---
        this.toast.className = `toast ${type}`; // Reset classes
        this.toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000); // Hide after 3 seconds
    }
}

// Instantiate the app once the DOM is ready
new GeoPhotoApp();

