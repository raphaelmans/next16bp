# Spec: Venue Submission with Multi-Sport Support

## Input Schema
```
courts: [{ sportId: uuid, count: 1-20 }]  // min 1 entry, unique sportIds
```

## Court Creation
- Sequential labels across all sports: "Court 1" through "Court N"
- All courts created with isActive: true (visibility controlled by place.isActive)
- Created within the same transaction as place/contact/amenities

## Admin View
- Each submission card shows sport badges: "Basketball x3, Tennis x2"
- All copy uses "venue" terminology
