import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset'
})

import { uploadToCloudinary } from '@/lib/cloudinaryClient'

describe('uploadToCloudinary', () => {
  const mockCloudName = 'test-cloud'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uploads a file and returns the secure_url', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ secure_url: 'https://cloudinary.com/image.jpg' })
    }
    fetch.mockResolvedValue(mockResponse)
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const url = await uploadToCloudinary(file)
    expect(fetch).toHaveBeenCalledWith(
      `https://api.cloudinary.com/v1_1/${mockCloudName}/image/upload`,
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    )
    expect(url).toBe('https://cloudinary.com/image.jpg')
  })

  it('throws an error if the upload fails', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: { message: 'Invalid API Key' } })
    }
    fetch.mockResolvedValue(mockResponse)
    await expect(uploadToCloudinary('fake-base64')).rejects.toThrow('Invalid API Key')
  })

  it('throws a default error if no error message is returned', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({})
    }
    fetch.mockResolvedValue(mockResponse)
    await expect(uploadToCloudinary('fake-base64')).rejects.toThrow('Failed to upload to Cloudinary')
  })
})
