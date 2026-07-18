/**
 * Deferred randomizer UI.
 *
 * This child control will edit AdminThemeProvider's draft only.
 * AdminThemeProvider owns the persisted baseline and current draft; the future
 * settings feature must add undo history around randomizer-generated drafts.
 * Enabling this control also requires visible Save, Cancel, and Undo actions.
 * Do not wire or export this file until the theme engine and settings screen
 * contracts exist.
 */
