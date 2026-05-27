export function isColorPresetId(preset) {
  const validPresets = ['navy', 'emerald', 'crimson', 'violet', 'amber'];
  return validPresets.includes(preset);
}
