export interface ImageKitConfig {
  urlEndpoint: string;
  publicKey: string;
  authenticationEndpoint?: string;
  isConfigured: boolean;
}

export function getImageKitConfig(): ImageKitConfig {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('sn_imagekit_url_endpoint');
    const storedKey = localStorage.getItem('sn_imagekit_public_key');
    if (storedUrl && storedKey) {
      return {
        urlEndpoint: storedUrl,
        publicKey: storedKey,
        authenticationEndpoint: '/api/imagekit/auth',
        isConfigured: true,
      };
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const envKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  if (envUrl && envKey && !envUrl.includes('placeholder')) {
    return {
      urlEndpoint: envUrl,
      publicKey: envKey,
      authenticationEndpoint: '/api/imagekit/auth',
      isConfigured: true,
    };
  }

  return {
    urlEndpoint: 'https://ik.imagekit.io/servicenow_demo',
    publicKey: '',
    isConfigured: false,
  };
}

export interface UploadResult {
  fileId: string;
  name: string;
  url: string;
  size: number;
  filePath: string;
}

export async function uploadToImageKit(
  file: File,
  folder: string = '/servicenow_attachments'
): Promise<UploadResult> {
  const config = getImageKitConfig();

  // If user configured real ImageKit credentials with auth endpoint
  if (config.isConfigured && config.publicKey) {
    try {
      // 1. Fetch authentication parameters from backend
      const authRes = await fetch('/api/imagekit/auth');
      if (authRes.ok) {
        const authData = await authRes.json();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('publicKey', config.publicKey);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire);
        formData.append('token', authData.token);
        formData.append('folder', folder);

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          return {
            fileId: data.fileId,
            name: data.name,
            url: data.url,
            size: data.size,
            filePath: data.filePath,
          };
        }
      }
    } catch (err) {
      console.warn('ImageKit direct upload failed, falling back to simulated storage:', err);
    }
  }

  // Fallback simulator: convert to DataURL & simulated ImageKit URL so media works 100% out of the box
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileId = 'ik_sim_' + Math.random().toString(36).substring(2, 10);
      resolve({
        fileId,
        name: file.name,
        url: dataUrl,
        size: file.size,
        filePath: `${folder}/${file.name}`,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
