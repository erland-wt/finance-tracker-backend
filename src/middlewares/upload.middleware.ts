import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

// Konfigurasi Cloudinary menggunakan environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string
})

// Konfigurasi penyimpanan Multer langsung ke Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'finance-tracker-avatars',
      allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
      public_id: `avatar-${Date.now()}`
    }
  },
})

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
})