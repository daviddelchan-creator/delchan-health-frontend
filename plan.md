1. **Create `app/patient/state/usePatientDashboard.ts`**:
   - Create a React hook to fetch patient dashboard data using `write_file`.
   - The hook should use `useMedplum` to get the access token and call `fetchPatientDashboard`.
   - It will handle the states: INITIALIZING, LOADING, READY, EMPTY, ERROR, UNAUTHORIZED, FORBIDDEN.
   - Use `read_file` to verify the creation of the file.

2. **Update `app/patient/api/dashboard.ts`**:
   - Edit the file using `write_file` to ensure it passes the correct token to the fetch call for `/api/patient/dashboard`.
   - Implement error handling for 401, 403, and 500 status codes to map to corresponding UI states.
   - Use `read_file` to verify the modifications.

3. **Create `app/patient/layout.tsx`**:
   - Use `write_file` to create the `PatientAppShell` in this layout file.
   - Implement desktop and mobile responsive design using Mantine's `AppShell`.
   - Render the layout. Since data loading might happen here or in page, let's keep the shell simple.
   - Include the navigation structure: Início, Consultas, Histórico, Documentos, Saúde, Perfil.
   - Use `read_file` to verify the file contents.

4. **Refactor `app/patient/page.tsx`**:
   - Use `write_file` to rewrite the file to remove hardcoded mock states (`tenantConfig`, `pendingTCLE`, etc.).
   - Consume the patient data using `usePatientDashboard` hook.
   - Display `Loading` or `ErrorState` components based on auth state (UNAUTHORIZED, FORBIDDEN) and fetch state.
   - Display correct patient information (e.g. name from the API).
   - Display real dashboard data (appointments) or `EmptyState` if no records exist.
   - Render placeholder "Em breve" for unreleased features.
   - Use `read_file` to verify the file contents.

5. **Create Tests for Patient Portal**:
   - Create `app/patient/page.test.tsx` using `write_file`.
   - Write tests for authenticated Patient identity, unauthenticated (401), non-Patient (403), loading state, success state, empty state, and error state.
   - Ensure tests assert real behavior and no hardcoded identities are used.
   - Use `read_file` to verify the test file.

6. **Update Documentation**:
   - Create `docs/33-ui-2.4.2-patient-portal.md` using `write_file` to document the new architecture.
   - Document the patient identity source, authentication mechanism, data access layer location, state model, and navigation structure.
   - Add limitations (e.g. no real telemedicine, mock OCR).
   - Use `read_file` to verify the documentation file.

7. **Build and Test**:
   - Run `npm test`, `npx tsc --noEmit`, and `npm run build` using the bash execution tool to verify the correctness of the changes.

8. **Pre Commit Steps**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
