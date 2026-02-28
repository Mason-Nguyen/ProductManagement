# Send Request Feature Implementation Summary

## Objective
Implement "Send for Review" functionality for purchase requests with service layer architecture.

## Features Implemented ✅

1. **Send Button in Request Detail Modal**
   - Shows "Send for Review" button for draft requests (status = 0)
   - Only visible to request creator
   - Updates request status from Draft (0) to Waiting for Review (1)
   - Closes modal and reloads list after successful submission

2. **Hide Edit/Delete for Submitted Requests**
   - Edit and Delete buttons only show for draft requests (status = 0)
   - View Details button always visible
   - Prevents modification of submitted requests

3. **Service Layer Architecture**
   - Clean separation of concerns
   - Business logic in service layer
   - Controllers handle HTTP concerns only
   - Testable and maintainable code structure

## Implementation Details

### Backend Architecture

#### Service Layer Pattern

**Created Files:**
1. `ProductManagement/Services/IPurchaseRequestCommandService.cs` - Interface
2. `ProductManagement/Services/PurchaseRequestCommandService.cs` - Implementation
3. `ProductManagement/Exceptions/NotFoundException.cs` - Custom exception

**Modified Files:**
1. `ProductManagement/Controllers/PurchaseRequestsController.cs` - Added Submit endpoint
2. `ProductManagement/Program.cs` - Registered service for DI

#### Service Layer Structure

```
ProductManagement/
├── Services/
│   ├── IPurchaseRequestCommandService.cs
│   └── PurchaseRequestCommandService.cs
├── Exceptions/
│   └── NotFoundException.cs
├── Controllers/
│   └── PurchaseRequestsController.cs
└── Program.cs
```

### Backend Implementation

#### 1. IPurchaseRequestCommandService Interface

```csharp
public interface IPurchaseRequestCommandService
{
    Task<PurchaseRequestDto> SubmitAsync(Guid id, Guid userId);
}
```

#### 2. PurchaseRequestCommandService Implementation

**Key Features:**
- Validates request ownership (user must be creator)
- Validates request status (must be Draft/0)
- Updates status to Waiting for Review (1)
- Updates ModifiedDate
- Returns updated DTO with products

**Business Logic:**
```csharp
public async Task<PurchaseRequestDto> SubmitAsync(Guid id, Guid userId)
{
    // 1. Find request and verify ownership
    var request = await _context.PurchaseRequests
        .Include(pr => pr.Reviewer)
        .Include(pr => pr.Approver)
        .Include(pr => pr.CreatedUser)
        .FirstOrDefaultAsync(pr => pr.Id == id && pr.CreatedUserId == userId);

    if (request == null)
        throw new NotFoundException("Purchase request not found or you don't have permission to submit it.");

    // 2. Validate status
    if (request.Status != 0)
        throw new InvalidOperationException("Only draft requests can be submitted.");

    // 3. Update status
    request.Status = 1;
    request.ModifiedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    // 4. Return DTO
    return MapToDto(request);
}
```

#### 3. Controller Endpoint

**Endpoint:** `PUT /api/purchaserequests/{id}/submit`

**Authorization:** Requester role only

**Controller Logic:**
```csharp
[HttpPut("{id}/submit")]
public async Task<IActionResult> Submit(Guid id)
{
    try
    {
        var userId = GetCurrentUserId();
        var result = await _commandService.SubmitAsync(id, userId);
        return Ok(result);
    }
    catch (NotFoundException ex)
    {
        return NotFound(new { message = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
```

**Response Codes:**
- 200 OK: Request submitted successfully
- 404 Not Found: Request not found or user not creator
- 400 Bad Request: Request status is not Draft

#### 4. Dependency Injection

**Program.cs:**
```csharp
builder.Services.AddScoped<IPurchaseRequestCommandService, PurchaseRequestCommandService>();
```

### Frontend Implementation

#### 1. Updated purchase-request-service.ts

**Added Method:**
```typescript
async submit(id: string): Promise<PurchaseRequestDto> {
    const response = await axios.put<PurchaseRequestDto>(
        `${API_URL}/${id}/submit`,
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
}
```

#### 2. Updated request-detail-modal.tsx

**New Props:**
```typescript
interface RequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PurchaseRequestDto | null;
    onSubmit?: (request: PurchaseRequestDto) => Promise<void>;
    currentUser?: { username: string } | null;
}
```

**State Management:**
```typescript
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');
```

**Submit Handler:**
```typescript
const handleSubmit = async () => {
    if (!request || !onSubmit) return;
    
    try {
        setSubmitting(true);
        setError('');
        await onSubmit(request);
        onClose();
    } catch (err: unknown) {
        // Error handling
        setError('Failed to submit request.');
    } finally {
        setSubmitting(false);
    }
};
```

**Conditional Rendering:**
```typescript
const canSubmit = request.status === 0 && 
                  currentUser?.username === request.createdUserName;
```

**Modal Footer:**
```tsx
<div className="modal-footer">
    <button className="btn-cancel" onClick={onClose}>Close</button>
    {canSubmit && (
        <button 
            className="btn-save" 
            onClick={handleSubmit}
            disabled={submitting}
        >
            {submitting ? 'Sending...' : '📤 Send for Review'}
        </button>
    )}
</div>
```

#### 3. Updated my-requests.tsx

**Submit Handler:**
```typescript
const handleSubmit = async (request: PurchaseRequestDto) => {
    try {
        await purchaseRequestService.submit(request.id);
        await fetchData();
    } catch (err) {
        console.error('Failed to submit request:', err);
        throw err;
    }
};
```

**Updated Modal Props:**
```tsx
<RequestDetailModal
    isOpen={!!detailRequest}
    onClose={() => setDetailRequest(null)}
    request={detailRequest}
    onSubmit={handleSubmit}
    currentUser={currentUser}
/>
```

**Updated Table Actions:**
```tsx
<div className="action-btns">
    <button className="btn-detail" onClick={() => setDetailRequest(request)} title="View Details">👁️</button>
    {isCreator(request) && request.status === 0 && (
        <>
            <button className="btn-edit" onClick={() => openEditModal(request)} title="Edit">✏️</button>
            <button className="btn-delete" onClick={() => setDeleteConfirm(request)} title="Cancel">🗑️</button>
        </>
    )}
</div>
```

## Visual Design

### Request Detail Modal - Draft Request

```
┌─────────────────────────────────────────┐
│ Request Details                      ✕  │
├─────────────────────────────────────────┤
│ Title: Laptop Purchase Request         │
│ Status: 📝 Draft                        │
│ Priority: Normal                        │
│                                         │
│ [Products table]                        │
│                                         │
├─────────────────────────────────────────┤
│ [Close]          [📤 Send for Review]  │
└─────────────────────────────────────────┘
```

### Request Detail Modal - Submitted Request

```
┌─────────────────────────────────────────┐
│ Request Details                      ✕  │
├─────────────────────────────────────────┤
│ Title: Laptop Purchase Request         │
│ Status: ⏳ Waiting for Review          │
│ Priority: Normal                        │
│                                         │
│ [Products table]                        │
│                                         │
├─────────────────────────────────────────┤
│                              [Close]    │
└─────────────────────────────────────────┘
```

### My Requests Table - Actions

**Draft Request (Status = 0):**
```
Actions: [👁️ View] [✏️ Edit] [🗑️ Delete]
```

**Submitted Request (Status = 1):**
```
Actions: [👁️ View]
```

## Business Rules

### Submit Request Rules:
1. ✅ User must be the creator of the request
2. ✅ Request status must be 0 (Draft)
3. ✅ Status updates to 1 (Waiting for Review)
4. ✅ ModifiedDate updates to current time
5. ✅ ReviewerId and ApproverId remain null

### UI Display Rules:
1. ✅ "Send for Review" button shows only for draft requests
2. ✅ "Send for Review" button shows only to creator
3. ✅ Edit/Delete buttons show only for draft requests
4. ✅ View Details button always shows
5. ✅ Modal closes after successful submission
6. ✅ Request list reloads with updated status

## Files Created/Modified

### Backend (5 files):
1. ✅ CREATE: `ProductManagement/Services/IPurchaseRequestCommandService.cs`
2. ✅ CREATE: `ProductManagement/Services/PurchaseRequestCommandService.cs`
3. ✅ CREATE: `ProductManagement/Exceptions/NotFoundException.cs`
4. ✅ MODIFY: `ProductManagement/Controllers/PurchaseRequestsController.cs`
5. ✅ MODIFY: `ProductManagement/Program.cs`

### Frontend (3 files):
1. ✅ MODIFY: `product-management-ui/src/services/purchase-request-service.ts`
2. ✅ MODIFY: `product-management-ui/src/components/request-detail-modal.tsx`
3. ✅ MODIFY: `product-management-ui/src/pages/my-requests.tsx`

## Testing Checklist

### Backend Tests:
- [x] No compilation errors
- [ ] Submit endpoint returns 200 for valid draft request
- [ ] Submit endpoint returns 404 if request not found
- [ ] Submit endpoint returns 404 if user is not creator
- [ ] Submit endpoint returns 400 if status != 0
- [ ] Status updates from 0 to 1
- [ ] ModifiedDate updates
- [ ] Service throws NotFoundException correctly
- [ ] Service throws InvalidOperationException correctly

### Frontend Tests:
- [x] No TypeScript compilation errors
- [ ] "Send" button shows for draft requests (status = 0)
- [ ] "Send" button shows only for creator
- [ ] "Send" button does NOT show for submitted requests
- [ ] Clicking "Send" updates status to 1
- [ ] Modal closes after successful submit
- [ ] Request list reloads with updated status
- [ ] Edit/Delete buttons hide for status = 1 requests
- [ ] Edit/Delete buttons show for status = 0 requests
- [ ] View button always shows
- [ ] Loading state shows while submitting
- [ ] Error message displays on failure

### Integration Tests:
- [ ] Create draft request - Edit/Delete buttons show
- [ ] Submit request - Status changes to "Waiting for Review"
- [ ] Edit/Delete buttons disappear after submit
- [ ] Notification count increases for Reviewer/Approver
- [ ] Cannot edit submitted request
- [ ] Cannot delete submitted request
- [ ] Cannot submit already submitted request

## User Flow

1. ✅ User creates a new request (Status = 0 - Draft)
2. ✅ User can Edit/Delete the draft request
3. ✅ User clicks "View Details" button
4. ✅ Modal opens showing "Send for Review" button
5. ✅ User clicks "Send for Review"
6. ✅ Request status changes to 1 (Waiting for Review)
7. ✅ Modal closes, list reloads
8. ✅ Edit/Delete buttons disappear for that request
9. ✅ Reviewer/Approver notification count increases

## Benefits of Service Layer Architecture

✅ **Separation of Concerns:**
- Controllers handle HTTP concerns only
- Services handle business logic
- Clear responsibility boundaries

✅ **Testability:**
- Services can be unit tested independently
- Easy to mock for controller tests

✅ **Reusability:**
- Business logic can be reused across multiple controllers
- Can be called from background jobs, SignalR hubs, etc.

✅ **Maintainability:**
- Business logic centralized in one place
- Easier to modify and extend

✅ **Clean Code:**
- Controllers remain thin and focused
- Services encapsulate complex operations

## Next Steps

1. Implement Reviewer workflow to review submitted requests
2. Implement Approver workflow to approve reviewed requests
3. Add email notifications when request is submitted
4. Add audit logging for status changes
5. Implement request history tracking
