import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './config';

const storage = getStorage(app);

// Upload a profile image and return the download URL
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  try {
    // Create a reference to the file location
    const profileImageRef = ref(storage, `profile-images/${userId}`);
    
    // Upload the file
    await uploadBytes(profileImageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(profileImageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}

// Delete a profile image
export async function deleteProfileImage(userId: string): Promise<void> {
  try {
    const profileImageRef = ref(storage, `profile-images/${userId}`);
    await deleteObject(profileImageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
}

// Get the download URL for a profile image
export async function getProfileImageURL(userId: string): Promise<string | null> {
  try {
    const profileImageRef = ref(storage, `profile-images/${userId}`);
    const downloadURL = await getDownloadURL(profileImageRef);
    return downloadURL;
  } catch (error) {
    // If the file doesn't exist, return null
    return null;
  }
} 