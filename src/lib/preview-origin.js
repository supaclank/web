export function previewFrameSource(gatewayURL, rootDomain) {
  if (typeof rootDomain !== 'string' || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(rootDomain)) throw new Error('A preview root domain is required.');
  const gateway = new URL(gatewayURL);
  if (!['https:', 'http:'].includes(gateway.protocol)) throw new Error('The gateway must use HTTP or HTTPS.');
  return `${gateway.protocol}//*.${rootDomain}${gateway.port ? `:${gateway.port}` : ''}`;
}

export function validatePreviewURL(value, gatewayURL, rootDomain, parentOrigin) {
  previewFrameSource(gatewayURL, rootDomain);
  const gateway = new URL(gatewayURL);
  const preview = new URL(value);
  if (preview.protocol !== gateway.protocol || preview.port !== gateway.port || preview.origin === parentOrigin || preview.username || preview.password ||
      !preview.hostname.startsWith('preview-') || !preview.hostname.endsWith(`.${rootDomain}`)) {
    throw new Error('The gateway returned a preview outside the configured preview domain.');
  }
  return preview.toString();
}
