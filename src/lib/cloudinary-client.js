/**
 * Client-side utility to upload images to Cloudinary without the widget.
 * Uses the unsigned upload preset configuration.
 */

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads a file to Cloudinary.
 * @param {File|Blob|string} fileSource - File object, Blob, or Base64 string.
 * @returns {Promise<string>} - The secure_url of the uploaded image.
 */
export async function uploadToCloudinary(fileSource) {
  try {
    const formData = new FormData();
    formData.append('file', fileSource);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('[CLOUDINARY_UPLOAD_ERROR]', error);
    throw error;
  }
}
