// import package
import cloudinary from 'cloudinary'

// import config
import config from '../config'

// import lib
import { removeKycImageFromPath } from '../lib/removeFile'

cloudinary.config({
    'cloud_name': config.CLOUDINARY_GATE_WAY.CLOUD_NAME,
    'api_key': config.CLOUDINARY_GATE_WAY.API_KEY,
    'api_secret': config.CLOUDINARY_GATE_WAY.API_SECRET,
    'secure': true
});

export const uploadImage = async (imagePath) => {
    try {
        let imageUpload = await cloudinary.v2.uploader.upload(__dirname + '/../' + imagePath, {
            unique_filename: true,
        })
        removeKycImageFromPath(imagePath)
        if (imageUpload) {
            return imageUpload.secure_url
        }
        return ''

    } catch (err) {
        return ''
    }
}
