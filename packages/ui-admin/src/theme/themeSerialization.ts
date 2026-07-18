/**
 * Deferred theme import/export support.
 *
 * When implemented:
 * - Export the shared ThemeSettings shape with a schemaVersion.
 * - Validate and normalize every imported value before previewing it.
 * - Never persist imported data until the user explicitly saves it.
 * - Keep import/export independent from React and browser file controls so the
 *   logic remains reusable and unit-testable.
 */
