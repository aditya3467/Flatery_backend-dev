/**
 * Add Property Page JavaScript
 * Handles form validation, image upload, and submission
 */

document.addEventListener('DOMContentLoaded', function() {
    const addPropertyForm = document.getElementById('addPropertyForm');
    const propertyTypeSelect = document.getElementById('propertyType');
    const bhkTypeGroup = document.getElementById('bhkTypeGroup');
    const seaterGroup = document.getElementById('seaterGroup');
    const propertyNameGroup = document.getElementById('propertyNameGroup');
    const timeSlotSelect = document.getElementById('timeSlot');
    const customTimeGroup = document.getElementById('customTimeGroup');
    const propertyImagesInput = document.getElementById('propertyImages');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const propertyDescription = document.getElementById('propertyDescription');
    const charCountSpan = document.getElementById('charCount');

    // Store uploaded images
    let uploadedImages = [];

    // Toggle fields based on property type
    propertyTypeSelect.addEventListener('change', function() {
        const propertyType = this.value;
        
        if (propertyType === 'PG' || propertyType === 'APARTMENT') {
            propertyNameGroup.style.display = 'block';
        } else {
            propertyNameGroup.style.display = 'none';
            document.getElementById('propertyName').value = '';
        }

        if (propertyType === 'PG') {
            seaterGroup.style.display = 'block';
            bhkTypeGroup.style.display = 'none';
            document.getElementById('bhkType').removeAttribute('required');
            document.getElementById('seater').setAttribute('required', 'required');
        } else {
            seaterGroup.style.display = 'none';
            bhkTypeGroup.style.display = 'block';
            document.getElementById('seater').removeAttribute('required');
            document.getElementById('bhkType').setAttribute('required', 'required');
        }
    });

    // Toggle custom time inputs
    timeSlotSelect.addEventListener('change', function() {
        if (this.value === 'Custom') {
            customTimeGroup.style.display = 'flex';
            document.getElementById('startTime').setAttribute('required', 'required');
            document.getElementById('endTime').setAttribute('required', 'required');
        } else {
            customTimeGroup.style.display = 'none';
            document.getElementById('startTime').removeAttribute('required');
            document.getElementById('endTime').removeAttribute('required');
        }
    });

    // Character count for description
    propertyDescription.addEventListener('input', function() {
        charCountSpan.textContent = this.value.length;
    });

    // Number input increment/decrement
    document.querySelectorAll('.number-input .increment').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const currentValue = parseInt(input.value) || 0;
            input.value = currentValue + 1;
        });
    });

    document.querySelectorAll('.number-input .decrement').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const currentValue = parseInt(input.value) || 0;
            if (currentValue > 1) {
                input.value = currentValue - 1;
            }
        });
    });

    // Handle image upload and preview
    propertyImagesInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        // Validate file count
        if (uploadedImages.length + files.length > 10) {
            showNotification('You can upload maximum 10 images', 'error');
            return;
        }

        files.forEach(file => {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showNotification(`${file.name} is too large. Maximum size is 5MB`, 'error');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification(`${file.name} is not a valid image`, 'error');
                return;
            }

            // Add to uploaded images array
            uploadedImages.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${event.target.result}" alt="Property Image">
                    <button type="button" class="remove-image" data-index="${uploadedImages.length - 1}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagePreviewContainer.appendChild(previewItem);

                // Add remove listener
                previewItem.querySelector('.remove-image').addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    removeImage(index);
                });
            };
            reader.readAsDataURL(file);
        });

        // Clear input
        propertyImagesInput.value = '';
    });

    // Remove image
    function removeImage(index) {
        uploadedImages.splice(index, 1);
        updateImagePreviews();
    }

    // Update image previews after removal
    function updateImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        uploadedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${event.target.result}" alt="Property Image">
                    <button type="button" class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagePreviewContainer.appendChild(previewItem);

                // Add remove listener
                previewItem.querySelector('.remove-image').addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'));
                    removeImage(idx);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Set minimum date for "Available From" to today
    const availableFromInput = document.getElementById('availableFrom');
    const today = new Date().toISOString().split('T')[0];
    availableFromInput.setAttribute('min', today);

    // Form submission
    addPropertyForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate images
        if (uploadedImages.length === 0) {
            showNotification('Please upload at least one property image', 'error');
            return;
        }

        // Validate custom time if selected
        const timeSlot = document.getElementById('timeSlot').value;
        if (timeSlot === 'Custom') {
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            if (!startTime || !endTime) {
                showNotification('Please select start and end time', 'error');
                return;
            }
            if (startTime >= endTime) {
                showNotification('End time must be after start time', 'error');
                return;
            }
        }

        // Validate floor numbers
        const currentFloor = parseInt(document.getElementById('currentFloor').value);
        const totalFloor = parseInt(document.getElementById('totalFloor').value);
        if (currentFloor > totalFloor) {
            showNotification('Current floor cannot be greater than total floors', 'error');
            return;
        }

        // Collect form data
        const formData = new FormData();

        // Add all form fields
        const formFields = new FormData(addPropertyForm);
        for (let [key, value] of formFields.entries()) {
            if (key !== 'propertyImages' && key !== 'amenities') {
                formData.append(key, value);
            }
        }

        // Add amenities as array
        const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
            .map(checkbox => checkbox.value);
        formData.append('amenities', JSON.stringify(amenities));

        // Add images
        uploadedImages.forEach((file, index) => {
            formData.append('propertyImages', file);
        });

        // Add posted date
        formData.append('postedOn', new Date().toISOString());

        try {
            // Show loading state
            const submitBtn = addPropertyForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            // TODO: Replace with actual API call
            // const response = await apiService.addProperty(formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Success
            showNotification('Property listed successfully!', 'success');
            
            // Reset form after 2 seconds
            setTimeout(() => {
                addPropertyForm.reset();
                uploadedImages = [];
                imagePreviewContainer.innerHTML = '';
                charCountSpan.textContent = '0';
                
                // Redirect to properties list or owner dashboard
                // window.location.href = 'Owner.html';
            }, 2000);

            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;

        } catch (error) {
            console.error('Error submitting property:', error);
            showNotification('Failed to submit property. Please try again.', 'error');
            
            // Reset button
            const submitBtn = addPropertyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Property';
        }
    });

    // Notification function (if not already defined in main.js)
    function showNotification(message, type = 'info') {
        // Check if global showNotification exists
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 1rem;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    console.log('Add Property form initialized');
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
