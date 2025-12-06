
'use server';
import cloudinary from '@/lib/cloudinary';

const dataUriToBuffer = (dataUri: string) => {
    const base64 = dataUri.split(',')[1];
    if (!base64) {
        throw new Error('Invalid Data URI: missing base64 content.');
    }
    return Buffer.from(base64, 'base64');
};

export const uploadDataUri = async (dataUri: string, folder: string): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
                else reject(new Error("Cloudinary upload failed without error."));
            }
        );
        uploadStream.end(dataUriToBuffer(dataUri));
    });
};
