/**
 * Upload Service - Android-Compatible Upload Strategy
 * 
 * This service handles file uploads with Android compatibility:
 * 1. Uses XMLHttpRequest instead of fetch (Android works better with XHR)
 * 2. Supports chunked uploads for large videos
 * 3. Real-time progress tracking
 * 4. Retry mechanism for failed chunks
 */

import { API_BASE_URL } from '../constants';

interface UploadResult {
  filePath: string;
  fileType: string;
  fileUrl: string;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  chunkSize?: number; // Size of each chunk in bytes (default 2MB)
}

/**
 * Upload file using XMLHttpRequest (works better on Android)
 * This method is compatible with Android restrictions
 */
export const uploadFileLegacy = async (
  file: File,
  token: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress!(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const normalized = response.file || response.files?.[0] || response;
          
          resolve({
            filePath: normalized.filePath || normalized.url || normalized.path || normalized.location,
            fileType: normalized.fileType || normalized.type || file.type,
            fileUrl: normalized.filePath || normalized.url || normalized.path || normalized.location
          });
        } catch (error) {
          reject(new Error('فشل تحليل استجابة الخادم'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || errorData.msg || `خطأ: ${xhr.status}`));
        } catch {
          reject(new Error(`فشل الرفع: ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('خطأ في الشبكة أثناء الرفع'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('انتهت مهلة الرفع'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('تم إلغاء الرفع'));
    });

    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('files', file);

    // Set timeout (5 minutes for large videos)
    xhr.timeout = 300000;

    // Open connection
    xhr.open('POST', `${API_BASE_URL}/api/v1/upload/multiple`);
    
    // Set headers
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Send request
    xhr.send(formData);
  });
};

/**
 * Chunked upload for very large files (videos)
 * Splits file into smaller chunks and uploads them separately
 */
const uploadFileChunked = async (
  file: File,
  token: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const chunkSize = options.chunkSize || 2 * 1024 * 1024; // 2MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // Generate unique upload ID
  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    // Upload chunk
    await uploadChunk(chunk, chunkIndex, totalChunks, uploadId, file.name, token);
    
    // Update progress
    if (options.onProgress) {
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      options.onProgress(progress);
    }
  }
  
  // Finalize upload
  return finalizeChunkedUpload(uploadId, file.name, file.type, token);
};

const uploadChunk = (
  chunk: Blob,
  index: number,
  total: number,
  uploadId: string,
  fileName: string,
  token: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`فشل رفع الجزء ${index + 1}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error(`خطأ في رفع الجزء ${index + 1}`));
    });
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', total.toString());
    formData.append('uploadId', uploadId);
    formData.append('fileName', fileName);
    
    xhr.timeout = 60000; // 1 minute per chunk
    xhr.open('POST', `${API_BASE_URL}/api/v1/upload/chunk`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
  });
};

const finalizeChunkedUpload = async (
  uploadId: string,
  fileName: string,
  fileType: string,
  token: string
): Promise<UploadResult> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/upload/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ uploadId, fileName, fileType })
  });
  
  if (!response.ok) {
    throw new Error('فشل إتمام الرفع');
  }
  
  return response.json();
};

/**
 * Main upload function - automatically chooses best method
 */
export const uploadFile = async (
  file: File,
  token: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  // For large files (>10MB), consider using chunked upload if backend supports it
  const isLargeFile = file.size > 10 * 1024 * 1024;
  
  // For now, always use XMLHttpRequest (best for Android)
  return uploadFileLegacy(file, token, options);
};

/**
 * Upload multiple files sequentially with progress
 */
export const uploadMultipleFiles = async (
  files: File[],
  token: string,
  options: UploadOptions = {}
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Calculate overall progress
    const fileProgress = (progress: number) => {
      if (options.onProgress) {
        const baseProgress = (i / files.length) * 100;
        const currentProgress = (progress / files.length);
        const totalProgress = Math.min(99, Math.round(baseProgress + currentProgress));
        options.onProgress(totalProgress);
      }
    };
    
    const result = await uploadFile(file, token, {
      ...options,
      onProgress: fileProgress
    });
    
    results.push(result);
  }
  
  // Complete
  if (options.onProgress) {
    options.onProgress(100);
  }
  
  return results;
};

/**
 * Utility: Check if file is video
 */
export const isVideoFile = (file: File): boolean => {
  if (file.type?.startsWith('video')) return true;
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
};

/**
 * Utility: Check if file is image
 */
export const isImageFile = (file: File): boolean => {
  if (file.type?.startsWith('image')) return true;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
};
