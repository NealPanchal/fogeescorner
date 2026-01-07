export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
}

export function getCloudinaryUrl(publicId: string, transformations?: string) {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`
  return transformations
    ? `${baseUrl}/${transformations}/${publicId}`
    : `${baseUrl}/${publicId}`
}
