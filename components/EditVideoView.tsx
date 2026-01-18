
import React from 'react';

// Component emptied as requested to remove Shorts functionality
// Exporting types to prevent breaking other files that might import them temporarily
export interface TextOverlay {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  color: string;
}

export interface StickerOverlay {
  id: number;
  type: 'sticker';
  content: string;
  x: number;
  y: number;
  scale: number;
}

const EditVideoView: React.FC<any> = () => {
  return null;
};

export default EditVideoView;
