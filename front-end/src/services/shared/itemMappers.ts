export type ServiceRow = Record<string, unknown>;

export function readString(row: ServiceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

export function readNumber(row: ServiceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

export function readBoolean(row: ServiceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

export function readStringArray(row: ServiceRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      const items = value.filter(
        (item): item is string => typeof item === 'string' && item.trim() !== '',
      );

      if (items.length > 0) {
        return items;
      }
    }

    if (typeof value === 'string' && value.trim() !== '') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const items = parsed.filter(
            (item): item is string => typeof item === 'string' && item.trim() !== '',
          );

          if (items.length > 0) {
            return items;
          }
        }
      } catch {
        const items = value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        if (items.length > 0) {
          return items;
        }
      }
    }
  }

  return undefined;
}

export function slugify(value?: string | null) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-');
}

export function formatCapacityLabel(value?: number | string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value} guests`;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return undefined;
}

export function normalizeImageList(images?: string[], fallbackImage?: string) {
  if (images && images.length > 0) {
    return images;
  }

  if (fallbackImage) {
    return [fallbackImage];
  }

  return [];
}
