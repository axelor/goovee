/*
 * Reads a picked or pasted image as a data URL, the way the same editor does
 * in AOP: the image is embedded in the field's value rather than uploaded, so
 * a record written here carries its images wherever the value is read.
 */

/*
 * The image becomes part of the field's value, so the ceiling is the portal's
 * own rather than the back-office's configured upload limit, which is about
 * files being stored and is not readable from here.
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MAX_IMAGE_EDGE = 4096;

type ImageContentsCallback = (type: string, dataUrl: string) => void;

/*
 * A camera records which way it was held as an EXIF tag instead of rotating
 * the pixels, so an upright photo can arrive on its side. Anything other than
 * the upright orientation is redrawn through a canvas, which both applies the
 * rotation and drops the tag.
 */
function readOrientation(file: File): Promise<number> {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onerror = () => resolve(1);
    reader.onload = () => {
      const contents = reader.result;
      if (!(contents instanceof ArrayBuffer)) return resolve(1);

      const view = new DataView(contents);
      if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
        return resolve(1);
      }

      const length = view.byteLength;
      let offset = 2;

      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return resolve(1);

        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xffe1) {
          if (view.getUint32((offset += 2), false) !== 0x45786966) {
            return resolve(1);
          }
          const little = view.getUint16((offset += 6), false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          for (let tag = 0; tag < tags; ++tag) {
            if (view.getUint16(offset + tag * 12, little) === 0x0112) {
              return resolve(view.getUint16(offset + tag * 12 + 8, little));
            }
          }
        } else if ((marker & 0xff00) !== 0xff00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }

      resolve(1);
    };

    reader.readAsArrayBuffer(file);
  });
}

function applyOrientation(
  context: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
) {
  switch (orientation) {
    case 2:
      context.translate(width, 0);
      context.scale(-1, 1);
      break;
    case 3:
      context.translate(width, height);
      context.rotate(Math.PI);
      break;
    case 4:
      context.translate(0, height);
      context.scale(1, -1);
      break;
    case 5:
      context.rotate(0.5 * Math.PI);
      context.scale(1, -1);
      break;
    case 6:
      context.rotate(0.5 * Math.PI);
      context.translate(0, -height);
      break;
    case 7:
      context.rotate(0.5 * Math.PI);
      context.translate(width, -height);
      context.scale(-1, 1);
      break;
    case 8:
      context.rotate(-0.5 * Math.PI);
      context.translate(-width, 0);
      break;
    default:
      break;
  }
}

function redraw(
  file: File,
  dataUrl: string,
  orientation: number,
  callback: ImageContentsCallback,
) {
  const image = new Image();

  image.onerror = () => callback(file.type, dataUrl);
  image.onload = () => {
    let {width, height} = image;

    if (width > height && width > MAX_IMAGE_EDGE) {
      height *= MAX_IMAGE_EDGE / width;
      width = MAX_IMAGE_EDGE;
    } else if (height >= width && height > MAX_IMAGE_EDGE) {
      width *= MAX_IMAGE_EDGE / height;
      height = MAX_IMAGE_EDGE;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return callback(file.type, dataUrl);

    canvas.width = orientation > 4 ? height : width;
    canvas.height = orientation > 4 ? width : height;

    context.save();
    applyOrientation(context, orientation, width, height);
    context.drawImage(image, 0, 0, width, height);
    context.restore();

    callback(file.type, canvas.toDataURL('image/jpeg', 0.99));
  };

  image.src = dataUrl;
}

/**
 * Reads an image into a data URL and hands it to `callback`.
 *
 * @param file - refused above {@link MAX_IMAGE_SIZE}, which is reported as a
 *   `false` result and no call
 * @returns whether the file was accepted, before it has been read — the
 *   callback runs later, and never runs for a refused file
 */
export async function readImageContents(
  file: File,
  callback: ImageContentsCallback,
) {
  if (!file || file.size > MAX_IMAGE_SIZE) return false;

  const orientation = await readOrientation(file);
  const reader = new FileReader();

  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl !== 'string') return;

    if (orientation === 1 || orientation > 8) {
      callback(file.type, dataUrl);
      return;
    }

    redraw(file, dataUrl, orientation, callback);
  };

  reader.readAsDataURL(file);
  return true;
}
