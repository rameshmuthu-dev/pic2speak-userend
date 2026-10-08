export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;
  
  // Only optimize Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;
  
  // Do not optimize non-image URLs (e.g. video, raw)
  if (!url.includes('/image/upload/')) return url;

  const parts = url.split('/image/upload/');
  if (parts.length !== 2) return url;

  const prefix = parts[0] + '/image/upload/';
  const path = parts[1];

  // Extract existing transformations if we can
  let transforms = [];
  
  // If we already have f_auto,q_auto and no resizing options, just return
  if (url.includes('f_auto') && url.includes('q_auto') && !options.width && !options.height) {
    return url;
  }

  // Ensure f_auto and q_auto are present if not already
  if (!url.includes('f_auto')) transforms.push('f_auto');
  if (!url.includes('q_auto')) transforms.push('q_auto');

  if (options.width) transforms.push(`w_${Math.round(options.width)}`, 'c_limit');
  if (options.height) transforms.push(`h_${Math.round(options.height)}`, 'c_limit');

  if (transforms.length === 0) return url;

  const transformStr = transforms.join(',');

  const pathSegments = path.split('/');
  const firstSegment = pathSegments[0];

  const isVersion = /^v\d+$/.test(firstSegment);
  // Simple heuristic: if it has an underscore but isn't a version, and there are more segments, it's likely a transformation.
  const isTransform = firstSegment.includes('_') && !isVersion && pathSegments.length > 1;

  if (isVersion || (!isTransform && pathSegments.length === 1)) {
    // Insert transformations before the rest
    return `${prefix}${transformStr}/${path}`;
  } else if (isTransform) {
    // Prepend to existing transformations (avoid duplicating if they already exist, though we checked f_auto)
    return `${prefix}${transformStr},${path}`;
  } else {
    // Fallback
    return `${prefix}${transformStr}/${path}`;
  }
};

