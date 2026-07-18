/**
 * Deferred theme randomizer.
 *
 * When implemented:
 * - Accept the current custom-theme draft and return a new draft.
 * - Randomize only supported Ant Design seed tokens; let AntD derive alias and
 *   component tokens.
 * - Never persist or apply settings from this module.
 * - Preserve the previous draft so the UI can provide Undo.
 * - The settings screen must expose Save, Cancel, and Undo whenever the
 *   randomizer is enabled.
 */
