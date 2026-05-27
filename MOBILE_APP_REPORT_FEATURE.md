# Mobile App - Report Button Implementation Prompt

## Feature: Add Report Button to Survey Detail Screen

### Context:
Users should be able to report surveys directly from the mobile app if the survey contains inappropriate content, spam, or other violations of platform guidelines.

### Requirements:

1. **Location**: Add a "Report Survey" button on the survey detail/view screen (typically near the survey title or in an action menu)

2. **Report Modal/Dialog** should include:
   - Survey title (read-only, for context)
   - Reporter's user ID (auto-filled from current user session)
   - Report reason dropdown with options:
     - Inappropriate Content
     - Spam
     - Offensive Language
     - Suspicious Activity
     - Other (with text description)
   - Description text field (optional, for additional context)
   - Submit button
   - Cancel button

3. **Integration Points**:
   - Use the new `report_notifications` table with fields:
     - `survey_id`: UUID of the survey being reported
     - `reporter_id`: UUID of the user making the report
     - `creator_id`: UUID of the survey creator (auto-fetch from survey data)
     - `reason`: Selected report reason
     - `description`: Optional user-provided description
     - `status`: Initially set to 'pending'
     - `created_at`: Auto-timestamp
   
4. **API Endpoint** (to be created):
   ```
   POST /api/reports/survey
   Body: {
     survey_id: string,
     reason: string,
     description?: string
   }
   Response: {
     success: boolean,
     message: string,
     report_id?: string
   }
   ```

5. **UX Flow**:
   - User taps "Report Survey" button
   - Modal opens with pre-filled survey context
   - User selects reason and optionally adds description
   - User taps "Submit Report"
   - Show success toast/notification
   - Modal closes
   - (Optional) Increment report count on survey

6. **Validation**:
   - Don't allow user to report their own survey
   - Show message if user has already reported this survey
   - Require reason selection
   - Rate limit: Max 1 report per user per survey

7. **Admin Visibility**:
   - Reports should appear in:
     - Survey detail page under "View Reports"
     - Reports management section with filters
   - Admin can see reporter info, reason, and description
   - Admin can take action (down survey, warn creator, etc.)

### Design Reference:
```
┌─────────────────────────────────┐
│  Report Survey                   │
├─────────────────────────────────┤
│  Survey: "Customer Feedback"     │
│                                  │
│  Reason: [Dropdown ▼]           │
│                                  │
│  Description (optional):         │
│  [Text field                ]    │
│  [                          ]    │
│                                  │
│  [Submit Report]  [Cancel]      │
└─────────────────────────────────┘
```

### Success Metrics:
- Report successfully created in database
- Toast notification shows confirmation
- Report appears in admin dashboard within 30 seconds
- Admin can act on report immediately
