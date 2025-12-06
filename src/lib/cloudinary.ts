
import { v2 as cloudinary } from 'cloudinary';

// This is the correct way to configure the SDK on the server-side.
// The environment variables should be loaded automatically by Next.js.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});


export default cloudinary;
