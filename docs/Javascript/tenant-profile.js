// tenant-profile.js

// Dynamic API base URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : 'https://flatery-backend-dev.onrender.com/api';

let currentSection = 0;
const sections = ['personal', 'kyc', 'family', 'emergency', 'payment'];
const completedSections = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadTenantData();
    await loadProfileFromApi();
    updateProgress();
    updateButtons();
});

// Load profile from backend API
async function loadProfileFromApi() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const resp = await fetch('http://localhost:8081/api/tenants/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (resp.ok) {
            const profileData = await resp.json();
            // Personal Info
            if (profileData.fullName) document.getElementById('fullName').value = profileData.fullName;
            if (profileData.dateOfBirth) document.getElementById('dateOfBirth').value = profileData.dateOfBirth;
            if (profileData.gender) document.getElementById('gender').value = profileData.gender;
            if (profileData.contactNumber) document.getElementById('contactNumber').value = profileData.contactNumber;
            if (profileData.emailAddress) document.getElementById('emailAddress').value = profileData.emailAddress;
            if (profileData.occupation) document.getElementById('occupation').value = profileData.occupation;
            if (profileData.permanentAddress) document.getElementById('permanentAddress').value = profileData.permanentAddress;
            // KYC
            if (profileData.idType) document.getElementById('idType').value = profileData.idType;
            if (profileData.idNumber) document.getElementById('idNumber').value = profileData.idNumber;
            // Family
            if (profileData.numberOfMembers) document.getElementById('numberOfMembers').value = profileData.numberOfMembers;
            if (profileData.members && profileData.members.length > 0) {
                const container = document.getElementById('membersContainer');
                container.innerHTML = '';
                profileData.members.forEach(member => {
                    const memberRow = document.createElement('div');
                    memberRow.className = 'member-row';
                    memberRow.innerHTML = `
                        <input type="text" placeholder="Member name" class="member-name" value="${member.name}" required>
                        <input type="text" placeholder="Relationship" class="member-relation" value="${member.relation}" required>
                        <input type="number" placeholder="Age" min="1" max="120" class="member-age" value="${member.age}" required>
                        <button type="button" onclick="removeMember(this)"><i class="fas fa-trash"></i></button>
                    `;
                    container.appendChild(memberRow);
                });
            }
            // Emergency
            if (profileData.emergencyContactName) document.getElementById('emergencyName').value = profileData.emergencyContactName;
            if (profileData.emergencyRelation) document.getElementById('emergencyRelation').value = profileData.emergencyRelation;
            if (profileData.emergencyPhone) document.getElementById('emergencyPhone').value = profileData.emergencyPhone;
            if (profileData.alternatePhone) document.getElementById('alternatePhone').value = profileData.alternatePhone;
            // Payment
            if (profileData.paymentMode) document.getElementById('paymentMode').value = profileData.paymentMode;
        } else {
            loadSavedProfile();
        }
    } catch (err) {
        loadSavedProfile();
    }
}

function loadSavedProfile() {
    // Load saved profile data from localStorage if available
    const savedProfile = localStorage.getItem('tenantProfile');
    if (savedProfile) {
        try {
            const profileData = JSON.parse(savedProfile);
            
            // Personal Info
            if (profileData.dateOfBirth) document.getElementById('dateOfBirth').value = profileData.dateOfBirth;
            if (profileData.gender) document.getElementById('gender').value = profileData.gender;
            if (profileData.occupation) document.getElementById('occupation').value = profileData.occupation;
            if (profileData.permanentAddress) document.getElementById('permanentAddress').value = profileData.permanentAddress;
            
            // KYC
            if (profileData.idType) document.getElementById('idType').value = profileData.idType;
            if (profileData.idNumber) document.getElementById('idNumber').value = profileData.idNumber;
            
            // Family
            if (profileData.numberOfMembers) document.getElementById('numberOfMembers').value = profileData.numberOfMembers;
            if (profileData.members && profileData.members.length > 0) {
                const container = document.getElementById('membersContainer');
                container.innerHTML = '';
                profileData.members.forEach(member => {
                    const memberRow = document.createElement('div');
                    memberRow.className = 'member-row';
                    memberRow.innerHTML = `
                        <input type="text" placeholder="Member name" class="member-name" value="${member.name}" required>
                        <input type="text" placeholder="Relationship" class="member-relation" value="${member.relation}" required>
                        <input type="number" placeholder="Age" min="1" max="120" class="member-age" value="${member.age}" required>
                        <button type="button" onclick="removeMember(this)"><i class="fas fa-trash"></i></button>
                    `;
                    container.appendChild(memberRow);
                });
            }
            
            // Emergency
            if (profileData.emergencyContactName) document.getElementById('emergencyName').value = profileData.emergencyContactName;
            if (profileData.emergencyRelation) document.getElementById('emergencyRelation').value = profileData.emergencyRelation;
            if (profileData.emergencyPhone) document.getElementById('emergencyPhone').value = profileData.emergencyPhone;
            if (profileData.alternatePhone) document.getElementById('alternatePhone').value = profileData.alternatePhone;
            
            // Payment
            if (profileData.paymentMode) document.getElementById('paymentMode').value = profileData.paymentMode;
            
            console.log('Loaded saved profile data');
        } catch (error) {
            console.error('Error loading saved profile:', error);
        }
    }
}

async function loadTenantData() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('All localStorage keys:', Object.keys(localStorage));
        
        if (!token) {
            console.error('No auth token found, redirecting to login');
            alert('Please login first to access your profile');
            const basePath = window.BASE_PATH || '';
            window.location.href = `${basePath}/docs/index.html`;
            return;
        }

        // Load user basic info
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('contactNumber').value = userData.phoneNumber || '';
            document.getElementById('emailAddress').value = userData.email || '';
        }

        // Load tenant tenancy info (rent, security deposit, due date)
        const tenancyResponse = await fetch(`${API_BASE_URL}/tenants/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (tenancyResponse.ok) {
            const tenancyData = await tenancyResponse.json();
            console.log('Tenancy data loaded:', tenancyData);
            
            // Populate payment information section
            if (tenancyData.rentAmount) {
                document.getElementById('monthlyRent').value = `₹${tenancyData.rentAmount.toLocaleString()}`;
            }
            if (tenancyData.securityDeposit) {
                document.getElementById('securityDeposit').value = `₹${tenancyData.securityDeposit.toLocaleString()}`;
            }
            if (tenancyData.rentDueDate) {
                const suffix = tenancyData.rentDueDate === 1 ? 'st' : 
                             tenancyData.rentDueDate === 2 ? 'nd' : 
                             tenancyData.rentDueDate === 3 ? 'rd' : 'th';
                document.getElementById('rentDueDate').value = `${tenancyData.rentDueDate}${suffix} of every month`;
            }
        } else {
            console.error('Failed to load tenancy data:', tenancyResponse.status);
        }
    } catch (error) {
        console.error('Error loading tenant data:', error);
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`section-${sectionName}`).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${sectionName}"]`).classList.add('active');

    // Update current section index
    currentSection = sections.indexOf(sectionName);
    updateButtons();
}

function nextSection() {
    if (validateCurrentSection()) {
        completedSections.add(sections[currentSection]);
        markSectionCompleted(sections[currentSection]);
        
        if (currentSection < sections.length - 1) {
            currentSection++;
            showSection(sections[currentSection]);
            updateProgress();
        }
    }
}

function previousSection() {
    if (currentSection > 0) {
        currentSection--;
        showSection(sections[currentSection]);
    }
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = currentSection === 0 ? 'none' : 'flex';
    nextBtn.style.display = currentSection === sections.length - 1 ? 'none' : 'flex';
    submitBtn.style.display = currentSection === sections.length - 1 ? 'flex' : 'none';
}

function updateProgress() {
    const progress = (completedSections.size / sections.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function markSectionCompleted(sectionName) {
    const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('completed');
    }
}

function validateCurrentSection() {
    const currentSectionElement = document.getElementById(`section-${sections[currentSection]}`);
    const requiredFields = currentSectionElement.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            alert('Please fill all required fields');
            return false;
        }
    }
    return true;
}

// File upload handlers
function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Profile">`;
        };
        reader.readAsDataURL(file);
    }
}

function handleFileUpload(event, previewId) {
    const files = event.target.files;
    const preview = document.getElementById(previewId);
    
    if (files.length > 0) {
        let html = '<strong>Uploaded files:</strong><br>';
        Array.from(files).forEach(file => {
            html += `<i class="fas fa-file"></i> ${file.name} (${(file.size / 1024).toFixed(2)} KB)<br>`;
        });
        preview.innerHTML = html;
        preview.classList.add('show');
    }
}

// Family members management
function addMember() {
    const container = document.getElementById('membersContainer');
    const memberRow = document.createElement('div');
    memberRow.className = 'member-row';
    memberRow.innerHTML = `
        <input type="text" placeholder="Member name" class="member-name">
        <input type="text" placeholder="Relationship" class="member-relation">
        <input type="number" placeholder="Age" min="1" max="120" class="member-age">
        <button type="button" onclick="removeMember(this)"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(memberRow);
}

function removeMember(button) {
    const container = document.getElementById('membersContainer');
    if (container.children.length > 1) {
        button.closest('.member-row').remove();
    } else {
        alert('At least one member is required');
    }
}

// Save as draft
function saveAsDraft() {
    const formData = {
        // Personal Info
        fullName: document.getElementById('fullName').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        contactNumber: document.getElementById('contactNumber').value,
        emailAddress: document.getElementById('emailAddress').value,
        occupation: document.getElementById('occupation').value,
        permanentAddress: document.getElementById('permanentAddress').value,
        
        // KYC
        idType: document.getElementById('idType').value,
        idNumber: document.getElementById('idNumber').value,
        
        // Family
        numberOfMembers: document.getElementById('numberOfMembers').value,
        members: Array.from(document.querySelectorAll('.member-row')).map(row => ({
            name: row.querySelector('.member-name').value,
            relation: row.querySelector('.member-relation').value,
            age: row.querySelector('.member-age').value
        })),
        
        // Emergency
        emergencyContactName: document.getElementById('emergencyName').value,
        emergencyRelation: document.getElementById('emergencyRelation').value,
        emergencyPhone: document.getElementById('emergencyPhone').value,
        alternatePhone: document.getElementById('alternatePhone').value,
        
        // Payment
        paymentMode: document.getElementById('paymentMode').value,
        
        // Metadata
        lastSaved: new Date().toISOString(),
        isDraft: true
    };

    localStorage.setItem('tenantProfile', JSON.stringify(formData));
    
    // Show success notification
    alert('Draft saved successfully! You can continue later.');
}

// Form submission
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateCurrentSection()) {
        return;
    }

    // Collect form data
    const formData = {
        // Personal Info
        fullName: document.getElementById('fullName').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        contactNumber: document.getElementById('contactNumber').value,
        emailAddress: document.getElementById('emailAddress').value,
        occupation: document.getElementById('occupation').value,
        permanentAddress: document.getElementById('permanentAddress').value,
        
        // KYC
        idType: document.getElementById('idType').value,
        idNumber: document.getElementById('idNumber').value,
        
        // Family
        numberOfMembers: document.getElementById('numberOfMembers').value,
        members: Array.from(document.querySelectorAll('.member-row')).map(row => ({
            name: row.querySelector('.member-name').value,
            relation: row.querySelector('.member-relation').value,
            age: row.querySelector('.member-age').value
        })),
        
        // Emergency
        emergencyContactName: document.getElementById('emergencyName').value,
        emergencyRelation: document.getElementById('emergencyRelation').value,
        emergencyPhone: document.getElementById('emergencyPhone').value,
        alternatePhone: document.getElementById('alternatePhone').value,
        
        // Payment
        paymentMode: document.getElementById('paymentMode').value,
        
        // Metadata
        lastUpdated: new Date().toISOString()
    };

    // Save to backend API
    const token = localStorage.getItem('authToken');
    let success = false;
    if (token) {
        try {
            const resp = await fetch(`${API_BASE_URL}/tenants/me/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (resp.ok) {
                success = true;
            }
        } catch (err) {
            // fallback below
        }
    }

    // Fallback to localStorage if API fails
    if (!success) {
        localStorage.setItem('tenantProfile', JSON.stringify(formData));
    }

    // Mark profile as completed
    localStorage.setItem('profileCompleted', 'true');

    // Show success message
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Profile Saved!';
    submitBtn.disabled = true;

    setTimeout(() => {
        alert('Profile completed successfully!');
        const basePath = window.BASE_PATH || '';
        window.location.href = `${basePath}/docs/tenant.html`;
    }, 1000);
});