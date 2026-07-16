// GitHub Releases Unlimited Media CDN Uploader
// Uploads binaries directly to your GitHub repository releases as assets for free hosting

import { uploadAsync } from 'expo-file-system/legacy';

const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN || '';
const GITHUB_USERNAME = process.env.EXPO_PUBLIC_GITHUB_USERNAME || 'ankursaini81771';
const GITHUB_REPO = process.env.EXPO_PUBLIC_GITHUB_REPO || 'playvia-media';

const HEADERS = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'User-Agent': 'PlayVia-App',
  'Accept': 'application/vnd.github.v3+json',
};

/**
 * Checks if GitHub uploader details are configured
 */
export const isGithubUploadConfigured = (): boolean => {
  return !!GITHUB_TOKEN;
};

/**
 * Gets or creates the permanent "media" release in the repository.
 * Returns the unique upload URL for assets.
 */
const getOrCreateMediaRelease = async (): Promise<string> => {
  const repoUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;
  
  try {
    // 1. Check if the "media" release already exists
    const checkResponse = await fetch(`${repoUrl}/releases/tags/media`, {
      method: 'GET',
      headers: HEADERS,
    });

    if (checkResponse.ok) {
      const releaseData = await checkResponse.json();
      return releaseData.upload_url; // Format: https://uploads.github.com/.../assets{?name,label}
    }

    // 2. If it doesn't exist, create the "media" tag release
    const createResponse = await fetch(`${repoUrl}/releases`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: 'media',
        target_commitish: 'main',
        name: 'PlayVia Media CDN',
        body: 'Holds unlimited streaming videos and thumbnail assets for the PlayVia app.',
        draft: false,
        prerelease: false,
      }),
    });

    const createData = await createResponse.json();
    if (!createResponse.ok || !createData.upload_url) {
      throw new Error(`Failed to create release. GitHub error: ${createData.message || 'Unknown'}`);
    }

    return createData.upload_url;
  } catch (err: any) {
    console.error('Error in getOrCreateMediaRelease: ', err.message);
    throw err;
  }
};

/**
 * Uploads a local video/image to the GitHub repository's release asset folder.
 * Returns a direct CDN download link.
 */
export const uploadFileToGithub = async (
  fileUri: string,
  isVideo: boolean,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    if (onProgress) onProgress(20);
    
    // 1. Retrieve the asset upload target URL
    const rawUploadUrl = await getOrCreateMediaRelease();
    
    if (onProgress) onProgress(40);

    // 2. Generate a unique name for the file to prevent asset name duplicates
    const fileExt = fileUri.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `media-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;

    // Clean up the uploads template URL: replace '{?name,label}' with actual asset name query parameter
    const uploadUrl = rawUploadUrl.replace('{?name,label}', `?name=${fileName}`);

    // 3. Perform native binary upload using FileSystem.uploadAsync
    if (onProgress) onProgress(60);
    const uploadResult = await uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'POST',
      uploadType: 0 as any,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'PlayVia-App',
        'Content-Type': isVideo ? 'video/mp4' : 'image/jpeg',
      },
    });

    if (onProgress) onProgress(90);

    if (!uploadResult.body) {
      throw new Error('GitHub upload returned an empty response.');
    }
    const resultJson = JSON.parse(uploadResult.body);

    if (uploadResult.status !== 201) {
      throw new Error(`GitHub Asset upload failed (status: ${uploadResult.status}). Message: ${resultJson.message || 'Unknown'}`);
    }

    if (onProgress) onProgress(100);

    // Return the direct CDN raw asset link
    return resultJson.browser_download_url;
  } catch (err: any) {
    console.error('GitHub Releases Media upload failed: ', err.message);
    throw err;
  }
};
