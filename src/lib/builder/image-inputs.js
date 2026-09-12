export const IMAGE_MIMES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PROMPT_IMAGES = 4;

export function validateImages(images) {
  if (!Array.isArray(images) || images.length > MAX_PROMPT_IMAGES) throw new Error('Attach up to four images per message.');
  const ids = new Set();
  for (const image of images) {
    if (typeof image?.image_id !== 'string' || !image.image_id || ids.has(image.image_id) || typeof image.filename !== 'string' || !IMAGE_MIMES.includes(image.mime)) {
      throw new Error('Choose PNG, JPEG, WebP or GIF images.');
    }
    const prefix = `data:${image.mime};base64,`;
    if (typeof image.source !== 'string' || !image.source.startsWith(prefix)) throw new Error('The image data is missing or invalid.');
    const encoded = image.source.slice(prefix.length);
    if (encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new Error('Each image must be 5 MB or smaller.');
    let bytes;
    try { bytes = atob(encoded); } catch { throw new Error('The image data is invalid.'); }
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('Each image must contain data and be 5 MB or smaller.');
    ids.add(image.image_id);
  }
  return images.map(({ image_id, mime, filename, source }) => ({ image_id, mime, filename, source }));
}

export async function readImageFiles(files, current = []) {
  const selected = Array.from(files);
  if (current.length + selected.length > MAX_PROMPT_IMAGES) throw new Error('Attach up to four images per message.');
  for (const file of selected) {
    if (!IMAGE_MIMES.includes(file.type)) throw new Error('Choose PNG, JPEG, WebP or GIF images.');
    if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error('Each image must contain data and be 5 MB or smaller.');
  }
  const images = await Promise.all(selected.map(async (file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += 32768) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
    return { image_id: crypto.randomUUID(), mime: file.type, filename: file.name, source: `data:${file.type};base64,${btoa(chunks.join(''))}` };
  }));
  return validateImages([...current, ...images]);
}

export function repositoryLocator(value) {
  if (typeof value !== 'string') throw new Error('Enter a GitHub repository URL.');
  const input = value.trim();
  const match = /^(?:https:\/\/)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)\/?$/.exec(input);
  if (!match) throw new Error('Use a GitHub repository URL, such as github.com/owner/repo.');
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  if (!owner || !repo || ['.', '..'].includes(owner) || ['.', '..'].includes(repo)) throw new Error('Enter a valid repository owner and name.');
  return { owner, repo };
}

export function inputConnection(source, target) {
  const bend = (source.x + target.x) / 2;
  return `M${source.x} ${source.y} C${bend} ${source.y} ${bend} ${target.y} ${target.x} ${target.y}`;
}
