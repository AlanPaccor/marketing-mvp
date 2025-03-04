import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './config';

const storage = getStorage(app);

// Upload a profile image and return the download URL
export const uploadProfileImage = async (userId: string | undefined, file: File): Promise<string> => {
  if (!userId) {
    console.error('Missing user ID for image upload');
    throw new Error('User ID is required to upload profile image');
  }
  
  if (!file) {
    console.error('No file provided for image upload');
    throw new Error('No file provided');
  }
  
  console.log(`Uploading image for user ${userId}, file size: ${file.size} bytes`);
  
  try {
    // Create a storage reference with the user ID
    const storageRef = ref(storage, `profile_images/${userId}`);
    
    // Upload the file
    console.log('Starting file upload...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('File uploaded successfully:', snapshot.metadata.name);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

// Delete a profile image
export async function deleteProfileImage(userId: string): Promise<void> {
  try {
    const profileImageRef = ref(storage, `profile_images/${userId}`);
    await deleteObject(profileImageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
}

// Get the download URL for a profile image
export const getProfileImageURL = async (userId: string | undefined): Promise<string | null> => {
  if (!userId) {
    console.warn('No user ID provided to get profile image');
    return null;
  }
  
  try {
    const storageRef = ref(storage, `profile_images/${userId}`);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    // If the file doesn't exist, return null instead of throwing an error
    console.warn('No profile image found for user:', userId);
    return null;
  }
}; 