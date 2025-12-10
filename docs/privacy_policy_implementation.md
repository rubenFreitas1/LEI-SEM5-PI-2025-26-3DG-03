# Privacy Policy Management Implementation

## Overview
This implementation provides a complete Privacy Policy management system with the following features:
- Admin interface to create and manage privacy policies
- Public page to view the current active policy
- Automatic notifications for users when a new policy is published
- Version history and audit trail

## Features Implemented

### 1. Backend API (C# / .NET)

#### Controllers
- **PrivacyPolicyController** (`API/WebApi/Controllers/PrivacyPolicyController.cs`)
  - `GET /api/PrivacyPolicy/current` - Public endpoint to get current policy
  - `GET /api/PrivacyPolicy/history` - Admin-only endpoint to get policy history
  - `POST /api/PrivacyPolicy` - Admin-only endpoint to create new policy
  - `GET /api/PrivacyPolicy/check-update` - Check if user needs to see new policy

- **SystemUserController** (`API/WebApi/Controllers/SystemUserController.cs`)
  - `POST /api/SystemUser/AcceptPrivacyPolicy` - User accepts the privacy policy

#### Services
- **PrivacyPolicyService** (`API/Application/Services/PrivacyPolicyService.cs`)
  - Manages privacy policy creation with automatic deactivation of previous policies
  - Checks if users need to see the new policy based on `LastAcceptedPrivacyPolicyAt`

- **SystemUserService** (`API/Application/Services/SystemUserService.cs`)
  - `AcceptPrivacyPolicyByEmail()` - Updates user's acceptance timestamp

#### Domain Model
- **PrivacyPolicy** (`API/Domain/Model/User/PrivacyPolicy.cs`)
  - Properties: `Id`, `Content`, `CreatedAt`, `IsCurrent`
  - Maintains version history with timestamps

- **SystemUser** (`API/Domain/Model/User/SystemUser.cs`)
  - Property: `LastAcceptedPrivacyPolicyAt` - Tracks when user last accepted policy

### 2. Frontend (Angular)

#### Components

##### Privacy Policy Admin Component
- **Location**: `UI/src/app/pages/privacyPolicy/privacyPolicy-admin.ts`
- **Route**: `/privacy-policy-admin` (Admin only)
- **Features**:
  - View current active policy
  - Create new privacy policies (supports HTML content)
  - View complete policy history with timestamps
  - Success/error notifications

##### Privacy Policy General Component
- **Location**: `UI/src/app/pages/privacyPolicy/privacyPolicy.ts`
- **Route**: `/privacy-policy` (Public)
- **Features**:
  - Displays current active policy
  - Accessible from footer link
  - Read-only view for all users

##### Privacy Policy Modal Component
- **Location**: `UI/src/app/components/privacy-policy-modal/`
- **Features**:
  - Automatically shown on login when new policy is detected
  - Users must accept before proceeding
  - Cannot be dismissed without acceptance

#### Services
- **PrivacyPolicyService** (`UI/src/app/services/privacyPolicy.service.ts`)
  - `getCurrentPolicy()` - Get active policy
  - `getPolicyHistory()` - Get all policies (admin)
  - `createPolicy()` - Create new policy (admin)
  - `checkPrivacyPolicyUpdate()` - Check if user needs notification
  - `acceptPrivacyPolicy()` - Mark policy as accepted

#### Navigation
- **Footer**: Link to `/privacy-policy` (accessible to everyone)
- **Admin Menu**: Link to `/privacy-policy-admin` (visible only to Admin role)

### 3. Notification System

The notification system is integrated into the `DefaultLayout` component:

1. **On Login**: System checks if user has accepted the current policy
2. **Detection**: Compares `LastAcceptedPrivacyPolicyAt` with policy's `CreatedAt`
3. **Modal Display**: If policy is newer, modal is shown automatically
4. **Acceptance**: User must click "I Accept" button
5. **Timestamp Update**: System records acceptance time in user profile

## Acceptance Criteria Evidence

### ✅ Version History with Timestamps
- Database stores all policies with `IsCurrent` flag
- `CreatedAt` timestamp automatically recorded
- Admin interface shows complete history with dates
- Repository method `GetAllPrivacyPoliciesAsync()` returns ordered history

**Evidence**: Check `API/DataModel/Repository/PrivacyPolicyRepository.cs` lines 41-54

### ✅ System User Notification on Login
- Modal automatically appears when user logs in with unaccepted policy
- System compares `LastAcceptedPrivacyPolicyAt` with `policy.CreatedAt`
- Modal is non-dismissible (backdrop="static", keyboard=false)
- Acceptance updates `SystemUser.LastAcceptedPrivacyPolicyAt`

**Evidence**: 
- Check `UI/src/app/layout/default-layout/default-layout.ts` method `checkPrivacyPolicyUpdate()`
- Check `UI/src/app/components/privacy-policy-modal/privacy-policy-modal.html`
- Check `API/Application/Services/PrivacyPolicyService.cs` method `CheckPrivacyPolicyUpdateAsync()`

### ✅ Privacy Policy Accessible from SPA Footer
- Footer component includes link to Privacy Policy
- Route `/privacy-policy` accessible to all users (no authentication required)
- Link visible on all pages through default layout

**Evidence**: Check `UI/src/app/layout/default-layout/default-footer/default-footer.html` line 3

## Testing Instructions

### Test Admin Functionality
1. Login as Admin user
2. Navigate to "Privacy Policy" from sidebar menu
3. Create a new policy with HTML content
4. Verify it appears in history
5. Verify old policy is deactivated

### Test Public Access
1. Click "Privacy Policy" link in footer
2. Verify current policy is displayed
3. No authentication required

### Test Notification System
1. Admin creates a new privacy policy
2. Existing user logs in
3. Modal appears with new policy
4. User clicks "I Accept"
5. Modal closes and `LastAcceptedPrivacyPolicyAt` is updated
6. On next login, modal does not appear (policy already accepted)

## Database Schema

The following fields are used:

**PrivacyPolicy Table:**
- `Id` (bigint, PK)
- `Content` (nvarchar(max))
- `CreatedAt` (datetime2)
- `IsCurrent` (bit)

**SystemUser Table:**
- `LastAcceptedPrivacyPolicyAt` (datetime2, nullable)

## Security

- **Admin Endpoints**: Protected with `[Authorize(Roles = "Admin")]`
- **Current Policy**: Public endpoint `[AllowAnonymous]`
- **User Acceptance**: Protected with `[Authorize]` (any authenticated user)

## Internationalization

Labels added to translation files:
- English: `NAV.PRIVACY_POLICY: "Privacy Policy"`
- Portuguese: `NAV.PRIVACY_POLICY: "Política de Privacidade"`

## Files Modified/Created

### Backend
- ✅ `API/WebApi/Controllers/PrivacyPolicyController.cs` - Updated with authorization
- ✅ `API/WebApi/Controllers/SystemUserController.cs` - Added AcceptPrivacyPolicy endpoint
- ✅ `API/Application/Services/PrivacyPolicyService.cs` - Added CheckPrivacyPolicyUpdateAsync
- ✅ `API/Application/Services/SystemUserService.cs` - Added AcceptPrivacyPolicyByEmail

### Frontend
- ✅ `UI/src/app/pages/privacyPolicy/privacyPolicy-admin.ts` - Created admin component
- ✅ `UI/src/app/pages/privacyPolicy/privacyPolicy-admin.html` - Created admin template
- ✅ `UI/src/app/pages/privacyPolicy/privacyPolicy-admin.css` - Created admin styles
- ✅ `UI/src/app/components/privacy-policy-modal/` - Created notification modal
- ✅ `UI/src/app/services/privacyPolicy.service.ts` - Added new methods
- ✅ `UI/src/app/routing/privacyPolicy.routes.ts` - Added admin route
- ✅ `UI/src/app/layout/default-layout/_nav.ts` - Added admin menu item
- ✅ `UI/src/app/layout/default-layout/default-layout.ts` - Added notification logic
- ✅ `UI/src/app/layout/default-layout/default-layout.html` - Added modal component
- ✅ `UI/src/assets/i18n/en.json` - Added translations
- ✅ `UI/src/assets/i18n/pt.json` - Added translations

## Next Steps

To complete the implementation:
1. Build and test the backend: `dotnet build`
2. Build and run the frontend: `npm start`
3. Create initial privacy policy as Admin
4. Test notification flow with different users
5. Verify all acceptance criteria are met
