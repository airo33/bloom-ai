// Pick or capture an injury photo and return it as a compressed JPEG base64,
// ready to send to the chat-physio Edge Function. The base64 is used for a
// single AI request and never persisted; we also return the on-device `uri`
// so the chat transcript can show a thumbnail.
//
// Uses expo-image-picker + expo-image-manipulator (both included in Expo Go,
// SDK 57). Image-manipulator uses the SDK 52+ context API
// (manipulate → resize → renderAsync → saveAsync).

import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Longest edge we send to the model. Bigger adds payload/latency, not insight
 *  (Groq bills each image as a flat ~2048 tokens regardless of resolution). */
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.6;

export interface InjuryPhoto {
  /** On-device file URI — for showing a thumbnail in the transcript only. */
  uri: string;
  /** Compressed JPEG, base64 (no data: prefix). */
  base64: string;
  mimeType: 'image/jpeg';
}

export type PickResult =
  | { ok: true; photo: InjuryPhoto }
  | { ok: false; reason: 'canceled' | 'permission' | 'error'; message?: string };

async function compressToBase64(uri: string, sourceWidth?: number): Promise<InjuryPhoto> {
  const ctx = ImageManipulator.manipulate(uri);
  // Only ever downscale — never upscale a small photo.
  if (sourceWidth && sourceWidth > MAX_DIMENSION) {
    ctx.resize({ width: MAX_DIMENSION });
  }
  const rendered = await ctx.renderAsync();
  const out = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!out.base64) throw new Error('Image had no data');
  return { uri: out.uri, base64: out.base64, mimeType: 'image/jpeg' };
}

/**
 * Capture from the camera or choose from the library, then compress.
 * Returns a discriminated result so the UI can react to permission denial vs.
 * a plain cancel without try/catch noise.
 */
export async function pickInjuryPhoto(source: 'camera' | 'library'): Promise<PickResult> {
  try {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'permission' };

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.length) {
      return { ok: false, reason: 'canceled' };
    }
    const asset = result.assets[0];
    const photo = await compressToBase64(asset.uri, asset.width);
    return { ok: true, photo };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
