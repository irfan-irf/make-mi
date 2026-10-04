import { classifyDepth, classifyUndertone, rgbToHsv, rgbToLab, rgbToHex } from './index.js';

const quantile = (sorted, fraction) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];

function samplePatches(context, positions, width, height, faceWidth) {
  const radius = Math.max(3, Math.round(faceWidth * 0.018));
  const pixels = [];
  for (const { x: centerX, y: centerY } of positions) {
    const left = Math.max(0, Math.floor(centerX - radius));
    const top = Math.max(0, Math.floor(centerY - radius));
    const right = Math.min(width, Math.ceil(centerX + radius));
    const bottom = Math.min(height, Math.ceil(centerY + radius));
    if (right <= left || bottom <= top) continue;
    const patch = context.getImageData(left, top, right - left, bottom - top).data;
    for (let i = 0; i < patch.length; i += 16) {
      const rgb = { r: patch[i], g: patch[i + 1], b: patch[i + 2] };
      const lab = rgbToLab(rgb);
      pixels.push({ ...rgb, luminance: lab.L });
    }
  }
  return pixels;
}

function discardLuminanceOutliers(pixels) {
  const luminances = pixels.map((pixel) => pixel.luminance).sort((a, b) => a - b);
  const q1 = quantile(luminances, 0.25);
  const q3 = quantile(luminances, 0.75);
  const iqr = q3 - q1;
  return pixels.filter((pixel) => pixel.luminance >= q1 - 1.5 * iqr && pixel.luminance <= q3 + 1.5 * iqr);
}

/** Detect one face and sample small forehead and cheek patches from a local canvas. */
export async function analyzeFaceCanvas(canvas) {
  const faceapi = await import('@vladmandic/face-api');
  const detections = await faceapi.detectAllFaces(
    canvas,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }),
  ).withFaceLandmarks(true);
  if (detections.length !== 1) {
    return { error: detections.length === 0 ? 'We could not find a face. Try brighter, even light and keep your whole face in view.' : 'We found more than one face. Please use a photo with only you in it.' };
  }

  const face = detections[0];
  const points = face.landmarks.positions;
  const box = face.detection.box;
  const faceWidth = box.width;
  const faceHeight = box.height;
  const averagePoint = (indices) => ({
    x: indices.reduce((sum, index) => sum + points[index].x, 0) / indices.length,
    y: indices.reduce((sum, index) => sum + points[index].y, 0) / indices.length,
  });
  const browCenter = averagePoint([19, 24]);
  const forehead = { x: browCenter.x, y: Math.max(box.y + faceHeight * 0.08, browCenter.y - faceHeight * 0.16) };
  const leftCheek = averagePoint([2, 3, 4]);
  const rightCheek = averagePoint([12, 13, 14]);
  const samplePoints = [
    forehead,
    { x: leftCheek.x, y: leftCheek.y - faceHeight * 0.06 },
    { x: rightCheek.x, y: rightCheek.y - faceHeight * 0.06 },
  ];
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = discardLuminanceOutliers(samplePatches(context, samplePoints, canvas.width, canvas.height, faceWidth));
  if (!pixels.length) return { error: 'We could not sample the visible skin areas. Retake the photo with your full face in the guide.' };

  const mean = pixels.reduce((sum, pixel) => ({ r: sum.r + pixel.r, g: sum.g + pixel.g, b: sum.b + pixel.b }), { r: 0, g: 0, b: 0 });
  const rgb = { r: mean.r / pixels.length, g: mean.g / pixels.length, b: mean.b / pixels.length };
  const lab = rgbToLab(rgb);
  const hsv = rgbToHsv(rgb);
  const clipped = pixels.filter((pixel) => Math.max(pixel.r, pixel.g, pixel.b) >= 250).length / pixels.length;
  const warnings = [];
  if (lab.L < 24) warnings.push('The photo looks quite dark; results may be less reliable. Try brighter natural light.');
  if (lab.L > 88) warnings.push('The photo looks very bright; results may be less reliable. Avoid direct sunlight.');
  if (clipped > 0.18) warnings.push('Some skin detail looks over-exposed. Try indirect daylight and retake the photo.');
  return {
    profile: { skinDepth: classifyDepth(lab.L), undertone: classifyUndertone(lab), palette: [] },
    skinToneHex: rgbToHex(rgb),
    hsv,
    warnings,
    faceBox: { x: box.x / canvas.width, y: box.y / canvas.height, width: box.width / canvas.width, height: box.height / canvas.height },
  };
}

export function fitCanvas(canvas, source, maxDimension = 960) {
  const naturalWidth = source.videoWidth || source.naturalWidth || source.width;
  const naturalHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!naturalWidth || !naturalHeight) throw new Error('The image could not be read. Please choose another photo.');
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  canvas.width = Math.round(naturalWidth * scale);
  canvas.height = Math.round(naturalHeight * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return context;
}
