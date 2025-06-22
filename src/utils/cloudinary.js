import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload fileon cloudinary from local file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file uploaded and getting url
    // console.log("file is uploaded on cludinary:", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //if file is not uploaded remove locally saved temporary file
    fs.unlinkSync(localFilePath);
    console.error("Error uploading file to Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary };
