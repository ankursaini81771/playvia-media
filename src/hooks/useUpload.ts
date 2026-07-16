import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { isGithubUploadConfigured, uploadFileToGithub } from '../services/githubUpload';

interface VideoUploadDetails {
  title: string;
  description: string;
  category: string;
  tags: string[];
  type: 'video' | 'short';
}

const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error('Failed to read local file. Please check device permissions.'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const useUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFileToStorage = async (bucket: string, fileUri: string, isVideo: boolean): Promise<string> => {
    // 1. Generate unique file names
    const fileExt = fileUri.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${user?.id || 'anonymous'}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Construct FormData (Official React Native way to upload files)
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: isVideo ? 'video/mp4' : 'image/jpeg',
    } as any);

    // 3. Upload to Supabase Storage using FormData payload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, formData, {
        contentType: isVideo ? 'video/mp4' : 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Storage upload error (${bucket}): ${error.message}`);
    }

    // 4. Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const uploadVideo = async (
    videoUri: string,
    thumbnailUri: string,
    details: VideoUploadDetails
  ): Promise<{ data: any; error: any }> => {
    if (!user) {
      return { data: null, error: new Error('User must be logged in to upload.') };
    }

    setUploading(true);
    setProgress(10); // Start progress

    try {
      // Simulate database/network staging delay
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);

      // Default URL states
      let finalVideoUrl = videoUri;
      let finalThumbnailUrl = thumbnailUri;

      // Check if they are local URIs (not web URLs) before uploading
      if (videoUri.startsWith('file://') || videoUri.startsWith('content://') || videoUri.startsWith('data:')) {
        if (isGithubUploadConfigured()) {
          try {
            // Priority 1: Upload video directly to GitHub Repository releases
            finalVideoUrl = await uploadFileToGithub(
              videoUri,
              true,
              (prog) => setProgress(Math.floor(prog * 0.6)) // Map progress to 0-60%
            );
          } catch (err: any) {
            console.warn('GitHub Releases upload failed, falling back to Supabase Storage.', err.message);
            try {
              finalVideoUrl = await uploadFileToStorage('videos', videoUri, true);
            } catch (storageErr: any) {
              console.warn('Staging storage upload failed, using raw source URI.', storageErr.message);
              finalVideoUrl = videoUri;
            }
          }
        } else {
          // Priority 2: Standard Supabase Storage upload
          try {
            finalVideoUrl = await uploadFileToStorage('videos', videoUri, true);
          } catch (err: any) {
            console.warn('Storage bucket upload failed, using source URI or fallback.', err.message);
            finalVideoUrl = videoUri;
          }
        }
      }

      setProgress(75);

      if (thumbnailUri.startsWith('file://') || thumbnailUri.startsWith('content://') || thumbnailUri.startsWith('data:')) {
        if (isGithubUploadConfigured()) {
          try {
            // Upload thumbnail directly to GitHub
            finalThumbnailUrl = await uploadFileToGithub(thumbnailUri, false);
          } catch (err: any) {
            console.warn('GitHub thumbnail upload failed, falling back to Supabase Storage.', err.message);
            try {
              finalThumbnailUrl = await uploadFileToStorage('thumbnails', thumbnailUri, false);
            } catch (storageErr: any) {
              finalThumbnailUrl = thumbnailUri;
            }
          }
        } else {
          try {
            finalThumbnailUrl = await uploadFileToStorage('thumbnails', thumbnailUri, false);
          } catch (err: any) {
            console.warn('Storage bucket upload failed, using source URI or fallback.', err.message);
            finalThumbnailUrl = thumbnailUri;
          }
        }
      }

      clearInterval(interval);
      setProgress(95);

      // Save video metadata to the public.videos table
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: details.title,
          description: details.description,
          thumbnail_url: finalThumbnailUrl,
          video_url: finalVideoUrl,
          category: details.category,
          tags: details.tags,
          type: details.type,
          views: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

      return { data, error: null };
    } catch (error: any) {
      setUploading(false);
      setProgress(0);
      return { data: null, error };
    }
  };

  return {
    uploading,
    progress,
    uploadVideo,
  };
};
