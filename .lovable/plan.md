

## Plan: Add Provider Verification System with Document Upload

### Overview
Add a verification section to the cleaner/provider profile with a tabbed interface showing verification requirements. Providers can upload documents which get emailed to the admin for manual review. A verified checkmark badge is displayed on verified profiles.

### Database Changes

**New table: `provider_verification_documents`**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `document_type` (text) — one of: `insurance`, `employee_list`, `criminal_check`, `articles_of_incorporation`
- `file_url` (text) — storage URL
- `insurance_expiry_date` (date, nullable) — for insurance documents
- `status` (text) — `pending`, `approved`, `rejected` (default: `pending`)
- `submitted_at` (timestamptz)
- `reviewed_at` (timestamptz, nullable)
- `notes` (text, nullable)
- RLS: providers can insert/select their own docs; admins can select/update all

**New storage bucket: `verification-documents`** (private, not public)
- RLS: owners can upload, admins can read

### Frontend Changes

**1. Update `CleanerProfile.tsx`**
- Add a Tabs component wrapping the existing profile content as "Business Profile" tab
- Add a new "Verification" tab containing verification cards for each requirement:
  - **Company Insurance** — upload button + expiry date picker; shows status badge
  - **Employee Names** — upload button for employee list document
  - **Years in Business** — already captured in profile (display with checkmark if filled)
  - **Reviews** — link to view reviews (read-only status indicator)
  - **Criminal Background Checks** — upload button for confirmation document
  - **Articles of Incorporation** — upload button for document
- Each card shows: requirement name, current status (pending/approved/not submitted), upload button, and a verified checkmark when approved
- Display a prominent "VERIFIED" badge at the top when `is_verified` is true on the cleaner profile

**2. Document upload flow**
- Provider selects a file → uploads to `verification-documents` bucket
- A row is inserted into `provider_verification_documents` with status `pending`
- An Edge Function (`send-verification-email`) is triggered to email the admin with document details and a link
- Admin manually reviews and updates status (future: automated)

**3. New Edge Function: `send-verification-email`**
- Called after document upload via `supabase.functions.invoke()`
- Sends email to a configured admin email address using the existing Resend integration
- Includes: provider name, document type, link to the uploaded file

**4. Verified badge display**
- On the cleaner profile page (public-facing `CleanerProfile.tsx`), show a green verified checkmark badge next to the business name when `is_verified` is true
- On the provider dashboard profile, show verification progress per document type

### Technical Details

- Storage bucket is private — files accessed via signed URLs for admin review
- The `is_verified` field already exists on `cleaner_profiles` — admin sets this to true after reviewing all documents
- Uses existing `RESEND_API_KEY` secret for email delivery
- Admin email address stored as a secret or in `platform_settings`

### Files to Create/Modify
- **Create**: `supabase/migrations/..._verification_documents.sql` (table + bucket + RLS)
- **Create**: `supabase/functions/send-verification-email/index.ts`
- **Modify**: `src/pages/cleaner-dashboard/CleanerProfile.tsx` (add tabs + verification section)
- **Modify**: `src/pages/CleanerProfile.tsx` (add verified badge to public profile)

