import localforage from 'localforage';

/**
 * Typed, content-agnostic key/value storage over localforage (IndexedDB).
 * Generic in the stored type so callers get `T` back without casting; it knows
 * nothing about what's stored. Reactivity and single-writer coordination live
 * one layer up (e.g. CartProvider), not here.
 */

export async function getitem<T = unknown>(key: string): Promise<T | null> {
  try {
    return await localforage.getItem<T>(key);
  } catch (err) {
    console.error((err as Error)?.message);
    return null;
  }
}

export async function setitem<T = unknown>(
  key: string,
  value: T,
): Promise<T | null> {
  try {
    return await localforage.setItem<T>(key, value);
  } catch (err) {
    console.error((err as Error)?.message);
    return null;
  }
}

export async function removeitem(key: string): Promise<void> {
  try {
    await localforage.removeItem(key);
  } catch (err) {
    console.error((err as Error)?.message);
  }
}

const local = {
  getitem,
  setitem,
  removeitem,
};

export default local;
