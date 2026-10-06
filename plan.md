1. **Audit/Review**:
   - The user wants me to implement the UI for `/patient/saude` (Patient Health Dashboard).
   - Rules:
     - Use existing `PatientDashboardContext` (`usePatientDashboardContext()`).
     - Display health metrics (Observation resources) from context.
     - Don't hardcode metrics or invent data/math.random. Only show what is provided.
     - Never infer clinical diagnoses from measurements.
     - Handle empty/loading/error states.
     - Include provenance (origin, date/time) if available.
     - Use `Drawer` to show details if needed.
     - Avoid inventing IDs or fetching via custom endpoints (use context).
     - Test responsive UI and accessibility (Enter, Space).

2. **Analysis of the Data**:
   - `PatientDashboardContext` provides `data.observations`, an array of `Observation` resources.
   - Observations should be sorted by date (already done by backend).
   - I need to render these Observations as metrics.
   - For metric extraction, we'll map `Observation.code.coding` or `Observation.code.text` to determine the type (Weight, Blood Pressure, Heart Rate, etc). We will display `Observation.valueQuantity` or `Observation.valueString`.
   - We must also display `Observation.effectiveDateTime` and provenance (which might be in `Observation.meta.source` or extensions, or just 'Medplum').

3. **Plan**:
   - Step 1: Update `/app/patient/saude/page.tsx`
     - Connect to `PatientDashboardContext`.
     - Handle `INITIALIZING`, `LOADING`, `UNAUTHORIZED`, `FORBIDDEN`, `ERROR` by returning `null` or `ErrorState` as appropriate.
     - If `state === 'EMPTY'` or `data.observations` is empty, show `EmptyState`.
     - Map over `data.observations` and group them by type (e.g. latest measurement of each kind, or just list them sequentially). A list or grid of cards representing the latest metrics is good. The prompt says: "com: resumo de saúde; métricas disponíveis".
     - When clicking a metric card, open a `Drawer` using Mantine's `<Drawer>` component.
     - Implement the `<MetricCard>` component. Add accessibility attributes (`tabIndex={0}`, `onKeyDown` with `Enter`/`Space`).
   - Step 2: Extracting FHIR data
     - I will write helper functions to extract display name, value with unit, date, and provenance from an `Observation`.
     - *Observation value*: Handle `valueQuantity`, `valueString`, or polymorphic `value[x]`. (e.g. Blood Pressure might be handled via components).
     - *Observation date*: `effectiveDateTime` or `effectivePeriod.start`.
     - *Observation provenance*: `meta.source` or `device` or extension.
   - Step 3: Write tests in `app/patient/saude/page.test.tsx`
     - Test that no `patientId` comes from URL/query.
     - Test Enter/Space keys open the drawer.
     - Test Empty state when no observations.
     - Test mapping of a real mock Observation.
   - Step 4: Complete pre commit steps
     - Ensure tests pass, types are correct, and pre commit instructions are followed.
