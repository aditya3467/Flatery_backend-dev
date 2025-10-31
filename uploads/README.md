# Property Images Storage

This directory stores uploaded property images.

## Structure:
```
uploads/
└── properties/
    ├── 1/                    # Property ID 1
    │   ├── uuid1.jpg
    │   └── uuid2.jpg
    ├── 2/                    # Property ID 2
    │   ├── uuid3.jpg
    │   └── uuid4.png
    └── ...
```

## Access:
- Images are served via: `http://localhost:8081/uploads/properties/{propertyId}/{filename}`
- Max file size: 5MB per image
- Max images per property: 10
- Allowed formats: JPG, PNG, GIF, WebP

## Notes:
- This directory is created automatically on first upload
- Images are deleted automatically when property is deleted
- Ensure proper file permissions on production server
