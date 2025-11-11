/**
 * Add Property Page JavaScript
 * Handles form validation, image upload, and submission
 */

document.addEventListener('DOMContentLoaded', function() {
    // Guard: Only authenticated ADMINs can access this page
    try {
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        if (!roles.includes('ADMIN')) {
            alert('Only owners (ADMIN) can list properties.');
            window.location.href = '../index.html';
            return;
        }
    } catch (_) {
        alert('Please login as owner to list properties.');
        window.location.href = '../index.html';
        return;
    }
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

    // Images are optional for now â€“ remove required attribute if present
    if (propertyImagesInput) {
        propertyImagesInput.removeAttribute('required');
    }

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

        try {
            // Show loading state
            const submitBtn = addPropertyForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            // Build the property data object matching backend CreatePropertyRequest
            const propertyData = buildPropertyData();
            
            // Make API call to create property
            const response = await apiService.createProperty(propertyData);
            
            // Upload images if any
            if (uploadedImages.length > 0) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading images...';
                try {
                    await apiService.uploadPropertyImages(response.id, uploadedImages);
                    showNotification('Property and images uploaded successfully!', 'success');
                } catch (imgError) {
                    console.error('Image upload error:', imgError);
                    showNotification('Property created but image upload failed: ' + imgError.message, 'warning');
                }
            } else {
                showNotification('Property listed successfully!', 'success');
            }
            
            // Reset form after 2 seconds and redirect
            setTimeout(() => {
                addPropertyForm.reset();
                uploadedImages = [];
                imagePreviewContainer.innerHTML = '';
                charCountSpan.textContent = '0';
                
                // Redirect to owner dashboard
                window.location.href = 'Owner.html';
            }, 2000);

        } catch (error) {
            console.error('Error submitting property:', error);
            const errorMsg = error.message || 'Failed to submit property. Please try again.';
            showNotification(errorMsg, 'error');
            
            // Reset button
            const submitBtn = addPropertyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Property';
        }
    });

    // Function to build property data matching backend CreatePropertyRequest
    function buildPropertyData() {
        const propertyType = document.getElementById('propertyType').value;
        
        // Map form values to backend enum values
        const data = {
            type: propertyType, // PG, FLAT, APARTMENT
            name: document.getElementById('propertyName').value || null,
            currentFloor: parseInt(document.getElementById('currentFloor').value),
            totalFloor: parseInt(document.getElementById('totalFloor').value),
            age: mapPropertyAge(document.getElementById('propertyAge').value),
            facing: mapFacing(document.getElementById('facing').value),
            builtUpAreaSqft: parseInt(document.getElementById('builtUpArea').value),
            bathrooms: parseInt(document.getElementById('bathrooms').value),
            balcony: isBalconyChecked(),
            amenities: getSelectedAmenities(),
            locality: {
                city: document.getElementById('city').value,
                location: document.getElementById('location').value,
                landmark: document.getElementById('landmark').value || null
            },
            rental: {
                expectedRent: parseInt(document.getElementById('expectedRent').value),
                expectedDeposit: parseInt(document.getElementById('expectedDeposit').value),
                negotiable: document.getElementById('rentNegotiable').value === 'Yes',
                monthlyMaintenance: parseInt(document.getElementById('monthlyMaintenance').value) || 0,
                availableFrom: document.getElementById('availableFrom').value,
                preferredTenants: [mapPreferredTenant(document.getElementById('preferredTenant').value)],
                furnishing: document.getElementById('furnishing').value.toUpperCase().replace('-', '_'),
                parking: document.getElementById('parking').value.toUpperCase(),
                description: document.getElementById('propertyDescription').value
            }
        };

        // Add BHK type or PG seater based on property type
        if (propertyType === 'PG') {
            data.pgSeater = parseInt(document.getElementById('seater').value);
            data.bhkType = null;
        } else {
            data.bhkType = mapBhkType(document.getElementById('bhkType').value);
            data.pgSeater = null;
        }

        // Add showing details if provided
        const propertyShower = document.getElementById('propertyShower').value;
        const propertyCondition = document.getElementById('propertyCondition').value;
        if (propertyShower || propertyCondition) {
            data.showing = {
                whoShows: propertyShower ? mapWhoShows(propertyShower) : null,
                currentCondition: propertyCondition ? mapCurrentCondition(propertyCondition) : null
            };
        }

        // Add schedule if provided
        const availability = document.getElementById('availability').value;
        const timeSlotValue = document.getElementById('timeSlot').value;
        if (availability) {
            data.schedule = {
                availability: availability.toUpperCase(),
                allDay: timeSlotValue === 'All Day',
                startTime: timeSlotValue === 'Custom' ? document.getElementById('startTime').value : null,
                endTime: timeSlotValue === 'Custom' ? document.getElementById('endTime').value : null
            };
        }

        return data;
    }

    // Helper functions to map form values to backend enum values
    function mapPropertyAge(value) {
        const mapping = {
            '1-3': 'Y1_3',
            '3-5': 'Y3_5',
            '5-10': 'Y5_10',
            '10+': 'Y10_PLUS'
        };
        return mapping[value] || value;
    }

    function mapBhkType(value) {
        const mapping = {
            '1': 'ONE',
            '2': 'TWO',
            '3': 'THREE',
            '4': 'FOUR',
            '4+': 'FOUR_PLUS'
        };
        return mapping[value] || value;
    }

    function mapPreferredTenant(value) {
        const mapping = {
            'Bachelors Male': 'BACHELORS_MALE',
            'Bachelors Female': 'BACHELORS_FEMALE',
            'Couple': 'COUPLE',
            'Family': 'FAMILY',
            'Married': 'MARRIED',
            'Anyone': 'ANYONE'
        };
        return mapping[value] || value;
    }

    function mapFacing(value) {
        const mapping = {
            'North': 'NORTH',
            'South': 'SOUTH',
            'East': 'EAST',
            'West': 'WEST'
        };
        // Only allow cardinal directions supported by backend; otherwise null
        return mapping[value] || null;
    }

    function mapWhoShows(value) {
        const mapping = {
            'Myself': 'MYSELF',
            'Neighbour': 'NEIGHBOUR',
            'Tenant': 'TENANT',
            'Friend/Family': 'FRIEND_FAMILY',
            'Need Help': 'NEED_HELP',
            'Others': 'OTHERS'
        };
        return mapping[value] || value;
    }

    function mapCurrentCondition(value) {
        const mapping = {
            'Newly Built': 'NEWLY_BUILT',
            'Vacant': 'VACANT',
            'Tenant on Notice Period': 'TENANT_NOTICE',
            'Need Help to Manage': 'NEED_MANAGEMENT_HELP'
        };
        return mapping[value] || value;
    }

    function isBalconyChecked() {
        const balconyCheckbox = document.querySelector('input[name="amenities"][value="Balcony"]');
        return balconyCheckbox ? balconyCheckbox.checked : false;
    }

    function getSelectedAmenities() {
        const allowed = new Set([
            'HOUSEKEEPING', 'CCTV', 'KITCHEN', 'SELF_COOKING', 'GEYSER', 'REFRIGERATOR',
            'SECURITY_24X7', 'TV', 'POWER_BACKUP', 'AC', 'WIFI', 'WASHING_MACHINE'
            // 'BALCONY' handled separately as boolean
        ]);
        const mapping = {
            'Housekeeping': 'HOUSEKEEPING',
            'CCTV': 'CCTV',
            'Kitchen': 'KITCHEN',
            'Self Cooking': 'SELF_COOKING',
            'Geyser': 'GEYSER',
            'Refrigerator': 'REFRIGERATOR',
            '24x7 Security': 'SECURITY_24X7',
            'TV': 'TV',
            'Power Backup': 'POWER_BACKUP',
            'Air Conditioning': 'AC',
            'Wi-Fi': 'WIFI',
            'Washing Machine': 'WASHING_MACHINE',
            'Balcony': 'BALCONY'
        };

        const selected = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
            .map(cb => mapping[cb.value])
            .filter(v => v && v !== 'BALCONY' && allowed.has(v));

        return selected;
    }

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
