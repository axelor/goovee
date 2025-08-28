import fs from 'fs';

export function getStoragePath() {
  const storage = process.env.DATA_STORAGE;

  if (!storage) {
    return `${process.cwd()}/storage`;
  }

  if (!fs.existsSync(storage)) {
    fs.mkdirSync(storage, {recursive: true});
  }

  return storage;
}
