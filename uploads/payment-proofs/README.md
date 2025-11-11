# Payment Proofs Storage

This directory stores payment proof screenshots uploaded by tenants.

Files are automatically created by the backend when tenants submit payment proofs.

## File Naming Convention
- Format: `payment-{timestamp}-{uuid}.{ext}`
- Example: `payment-1699704123456-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

## Security Notes
- Only authenticated tenants can upload files
- Maximum file size: 5MB
- Allowed formats: JPEG, PNG
- Files are validated on upload

## Storage Path
- Backend: `uploads/payment-proofs/`
- URL path: `/uploads/payment-proofs/{filename}`
