export function buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, any> {
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    let result: Record<string, any> = {};
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        current[parts[i]] = sortOrder;
      } else {
        current[parts[i]] = {};
        current = current[parts[i]];
      }
    }
    return result;
  }
  return { [sortBy]: sortOrder };
}
