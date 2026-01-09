# 🏗️ Dashboard Architecture - Visual Guide

## 📐 Section Layout (Top to Bottom)

```
┌────────────────────────────────────────────────────────────┐
│                    NAVIGATION BAR                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📊 SECTION 1: HERO STRIP (Stats Bar)                       │
├─────────┬──────────┬────────────┬──────────┬────────────────┤
│ 🏠      │ 👥       │ 📋         │ 💳       │ 📈             │
│ Total   │ Active   │ Pending    │ Pending  │ Occupancy      │
│ Props   │ Tenants  │ Requests   │ Payments │ Rate           │
│ 12      │ 8        │ 3          │ ₹45,000  │ 67%            │
└─────────┴──────────┴────────────┴──────────┴────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🏪 SECTION 2: ACTIVE LISTINGS (Marketplace View) ⭐ NEW  │
│ Properties currently visible to tenants in the marketplace │
│                                               [See All →]   │
├────────────┬────────────┬────────────┬────────────────────┤
│            │            │            │                    │
│ 📷 Image   │ 📷 Image   │ 📷 Image   │ 📷 Image           │
│ 🟢 LIVE    │ 🟢 LIVE    │ 🟡 REVIEW  │ 🟢 LIVE            │
│            │            │            │                    │
│ Flat 101   │ Flat 201   │ PG Alpha   │ Flat 102           │
│ 📍 Location│ 📍 Location│ 📍 Location│ 📍 Location        │
│ ₹15,000/mo │ ₹12,000/mo │ ₹8,000/mo  │ ₹14,000/mo         │
│            │            │            │                    │
│ 45 Views   │ 32 Views   │ 18 Views   │ 52 Views           │
│ 4.5/5 ⭐   │ 4.2/5 ⭐   │ 4.0/5 ⭐   │ 4.7/5 ⭐           │
│            │            │            │                    │
│ [Preview]  │ [Preview]  │ [Preview]  │ [Preview]          │
│ [Edit] [⏸] │ [Edit] [⏸] │ [Edit] [⏸] │ [Edit] [⏸]        │
└────────────┴────────────┴────────────┴────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🔧 SECTION 3: Property Management (CRM) [Renamed]         │
│ Manage all your properties, tenants, and operations        │
│ ← Horizontal Scroll →                                      │
├────────────┬────────────┬────────────┬──────┐             │
│            │            │            │  ... │             │
│ Flat 101   │ Flat 102   │ Flat 201   │      │             │
│ 2 BHK      │ 2 BHK      │ 3 BHK      │      │             │
│ 1 Tenant   │ 0 Tenants  │ 2 Tenants  │      │             │
│ ₹15,000/mo │ ₹14,000/mo │ ₹20,000/mo │      │             │
│            │            │            │      │             │
│ [Manage]   │ [Manage]   │ [Manage]   │      │             │
│ [Edit]     │ [Edit]     │ [Edit]     │      │             │
│ [Deactivate] │ [Deactivate] │ [Deactivate] │  │             │
└────────────┴────────────┴────────────┴──────┘             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🎮 SECTION 4: Control Center                              │
├────────────┬────────────┬────────────────────────────────┤
│            │            │                                │
│ 🏢 Manage  │ 🛏️ Manage │ ⚡ Quick Actions              │
│    Flats   │    PGs     │                                │
│            │            │ [Add Property]                 │
│ 8 Flats    │ 4 PGs      │ [Add Tenant]                   │
│ 7 Tenants  │ 12 Beds    │ [Send Reminder]                │
│ 1 Vacant   │ 6 Occupied │ [Generate Report]              │
│            │ ₹45K Dues  │                                │
│ [Open CRM] │ [Open CRM] │                                │
└────────────┴────────────┴────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🧠 SECTION 5: Smart Insights                              │
├────────────────────────┬────────────────────────────────┤
│ 💰 Payment Status      │ 👥 Tenant Activity Pulse       │
│                        │                                 │
│ 75% Collected          │ [Chart showing activity]        │
│ ₹45,000 Expected       │                                 │
│ ₹33,750 Received       │ 2 New Tenants                  │
│ ₹11,250 Pending        │ 1 Expiring Lease               │
│                        │ 3 Recent Complaints            │
│ Today: ₹5,000          │ 1 Pending Due                  │
│ This Week: ₹12,500     │                                 │
│ Overdue: 2 payments    │                                 │
└────────────────────────┴────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🔔 SECTION 6: Notifications Ribbon                        │
│ [📍 New tenant added] [💰 Payment received] [⚠️ Overdue]  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🖼️ SECTION 7: Property Photo Strip                        │
│ [Property polaroid] [Property polaroid] [Property...]      │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Differences: Marketplace vs CRM

### Active Listings Section 🏪
```
Focus: MARKETPLACE (Tenant View)
├─ Only ACTIVE, APPROVED properties
├─ Tenant-facing information
├─ Rent, Location, Views, Rating
├─ Actions: Preview, Edit, Pause
└─ Grid layout (responsive)
```

### Property Management (CRM) Section 🔧
```
Focus: OPERATIONS (Owner Internal)
├─ ALL properties (regardless of status)
├─ Owner operational information
├─ Tenants, Rent, CRM controls
├─ Actions: Manage, Edit, Deactivate
└─ Horizontal scroll layout
```

---

## 🔗 Navigation Flow

```
Owner Dashboard
├─ Active Listings Section
│  └─ [See All Listings] → listing-manager.html
│     ├─ All Tab (shows all properties)
│     ├─ Active Tab
│     ├─ Inactive Tab
│     ├─ Draft Tab
│     ├─ Under Review Tab
│     ├─ Blocked Tab
│     └─ [Edit] → edit-property.html
│
├─ Property Management (CRM)
│  ├─ [Manage CRM] → flat-dashboard.html or property-config.html
│  ├─ [Edit] → edit-property.html
│  └─ [Deactivate] → API call
│
└─ Control Center
   ├─ [Open Flat CRM] → flat-dashboard.html
   ├─ [Open PG CRM] → pg-list.html
   ├─ [Add Property] → add-property.html
   ├─ [Add Tenant] → add-tenant.html
   ├─ [Send Reminder] → API call
   └─ [Generate Report] → API call
```

---

## 🎨 Color & Icon Reference

### Status Badges
- 🟢 **LIVE** - `#10B981` (Green) - Active, Approved
- 🟡 **UNDER REVIEW** - `#FBBF24` (Amber) - Pending approval
- ⚫ **INACTIVE** - `#6B7280` (Gray) - Paused/Deactivated

### Button Types
- **Primary** - `--electric-blue` (#1C64F2) - Main actions (Preview, Edit)
- **Secondary** - `#F3F4F6` (Light Gray) - Secondary actions
- **Danger** - `#DC2626` (Red) - Destructive actions (Pause, Deactivate)

### Icons
- 🏪 Store = Active Listings / Marketplace
- 🔧 Cogs = Property Management / Operations
- 🎮 Gamepad = Control Center / Quick Access
- 📊 Chart = Stats / Analytics
- 📍 Pin = Location
- 👁️ Eye = View/Preview
- ✏️ Pencil = Edit
- ⏸️ Pause = Pause/Pause Listing
- 🔄 Sync = Loading/Processing

---

## 📊 Data Filtering Logic

```javascript
// Active Listings Filter
activeListings = properties.filter(p => 
    (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE' &&
    (p.isApproved !== false && p.approval !== 'REJECTED')
)

// Property Management Filter (shows ALL)
allProperties = properties

// Status Determination
if (property.isApproved === false || property.approval === 'PENDING') {
    status = 'Under Review'
} else {
    status = 'Live'
}
```

---

## 💾 Data Model

### Property Object Structure
```javascript
{
    id: 123,
    name: "Flat 101",
    type: "FLAT",
    status: "ACTIVE",
    isApproved: true,
    approval: "APPROVED",
    expectedRent: 15000,
    location: "Marathahalli",
    primaryImageUrl: "...",
    flatNumber: "101",
    bhkType: "2BHK",
    totalUnits: 1,
    createdAt: "2025-10-01"
}
```

### View Tracking (Mock Implementation)
```javascript
// Currently mocked with random count
const viewsCount = Math.floor(Math.random() * 100) + 5

// Future: Real data from API
// GET /listings/{propertyId}/analytics
// {
//     views7d: 45,
//     views30d: 123,
//     clicks: 12,
//     conversions: 2
// }
```

---

## 🚀 Responsive Design

### Desktop (1920px+)
- Active Listings: 4 columns
- Property Management: Full width horizontal scroll
- All sections full width

### Tablet (768px - 1024px)
- Active Listings: 2-3 columns
- Property Management: Full width horizontal scroll
- Stacked layout for stats

### Mobile (< 768px)
- Active Listings: 1 column, full width
- Property Management: Full width horizontal scroll
- Collapsed/simplified stats
- Touch-optimized buttons

---

## 🎓 Component Reusability

### Shared Components
```
active-listing-card (used in)
├─ Active Listings section (dashboard)
├─ Listing Manager page (all tabs)
└─ [Future] Mobile app

listing-status-badge (used in)
├─ Active Listings cards
├─ Listing Manager cards
└─ Property details page

listing-action-btn (used in)
├─ Active Listings cards
├─ Listing Manager cards
└─ [Future] Bulk actions
```

---

**Last Updated:** January 5, 2026  
**Architecture Version:** 2.0 (Marketplace + CRM Separation)
