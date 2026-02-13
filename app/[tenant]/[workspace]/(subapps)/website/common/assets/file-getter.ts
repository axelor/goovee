import fsPromise from 'fs/promises';

export async function getFileFromAssets(filePath: string) {
  const normalizedPath = filePath.replace(/^\/+/, ''); // remove leading slashes if any
  const url = new URL(normalizedPath, import.meta.url); // url relative to this file
  const file = await fsPromise.readFile(url);
  return file;
}
