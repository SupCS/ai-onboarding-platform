export const suggestedLessonTags = [
  'Google SEM',
  'Meta',
  'Programmatic',
  'Company',
  'Finance',
  'Invoicing',
  'Analytics',
  'Reporting',
  'Sales',
  'Operations',
  'Client Success',
  'Compliance',
];

export function normalizeLessonTagInput(tags = []) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return [...new Set(
    tags
      .map((tag) => (typeof tag === 'string' ? tag.trim().replace(/\s+/g, ' ') : ''))
      .filter(Boolean)
  )].slice(0, 12);
}
