import type { Context } from "hono";
import type { Bindings } from "..";
import type { AuthContext } from "../middlewares/auth";

export enum FileCategory {
  Document = "document",
  Image = "image",
  Video = "video",
  Audio = "audio",
  Script = "script",
  Style = "style",
  Data = "data",
}

/**
 * media type interface
 * @interface MediaType
 * @property {string} mimeType - File mime type
 * @property {string} category - File type
 * @property {string} extension - File extension
 */
interface MediaType {
  mimeType: string;
  category: FileCategory;
  extension: string;
}

/**
 * Supported file types for upload
 * @type {Object}
 * @property {MediaType} html - HTML file type
 * @property {MediaType} css - CSS file type
 * @property {MediaType} js - JavaScript file type
 * @property {MediaType} ts - TypeScript file type
 * @property {MediaType} json - JSON file type
 * @property {MediaType} jpg - JPG file type
 * @property {MediaType} jpeg - JPEG file type
 * @property {MediaType} png - PNG file type
 * @property {MediaType} gif - GIF file type
 * @property {MediaType} ico - ICO file type
 * @property {MediaType} svg - SVG file type
 * @property {MediaType} webp - WEBP file type
 * @property {MediaType} avif - AVIF file type
 * @property {MediaType} mp4 - MP4 file type
 * @property {MediaType} webm - WEBM file type
 * @property {MediaType} ogg - OGG file type
 * @property {MediaType} mp3 - MP3 file type
 * @property {MediaType} wav - WAV file type
 */
export const SUPPORTED_MEDIA_TYPES: Record<string, MediaType> = {
  html: {
    mimeType: "text/html",
    category: FileCategory.Document,
    extension: "html",
  },
  css: {
    mimeType: "text/css",
    category: FileCategory.Style,
    extension: "css",
  },
  js: {
    mimeType: "application/javascript",
    category: FileCategory.Script,
    extension: "js",
  },
  ts: {
    mimeType: "application/typescript",
    category: FileCategory.Script,
    extension: "ts",
  },
  json: {
    mimeType: "application/json",
    category: FileCategory.Data,
    extension: "json",
  },
  jpg: {
    mimeType: "image/jpeg",
    category: FileCategory.Image,
    extension: "jpg",
  },
  jpeg: {
    mimeType: "image/jpeg",
    category: FileCategory.Image,
    extension: "jpeg",
  },
  png: {
    mimeType: "image/png",
    category: FileCategory.Image,
    extension: "png",
  },
  gif: {
    mimeType: "image/gif",
    category: FileCategory.Image,
    extension: "gif",
  },
  ico: {
    mimeType: "image/x-icon",
    category: FileCategory.Image,
    extension: "ico",
  },
  svg: {
    mimeType: "image/svg+xml",
    category: FileCategory.Image,
    extension: "svg",
  },
  webp: {
    mimeType: "image/webp",
    category: FileCategory.Image,
    extension: "webp",
  },
  avif: {
    mimeType: "image/avif",
    category: FileCategory.Image,
    extension: "avif",
  },
  mp4: {
    mimeType: "video/mp4",
    category: FileCategory.Video,
    extension: "mp4",
  },
  webm: {
    mimeType: "video/webm",
    category: FileCategory.Data,
    extension: "webm",
  },
  ogg: {
    mimeType: "video/ogg",
    category: FileCategory.Data,
    extension: "ogg",
  },
  mp3: {
    mimeType: "audio/mp3",
    category: FileCategory.Audio,
    extension: "mp3",
  },
  wav: {
    mimeType: "audio/wav",
    category: FileCategory.Audio,
    extension: "wav",
  },
};

/**
 * Handles file uploads to cloudinary
 * @param {Context} c - Hono context with bindings
 * @returns {Promise<CloudinaryService>} Cloudinary service instance
 * @example
 * const cloudinaryService = new CloudinaryService(c);
 * const uploadResponse = await cloudinaryService.uploadFile(file, filename, filetypeMeta, project_id);
 * console.log(uploadResponse);
 */
class CloudinaryService {
  private CLOUD_NAME: string;
  private api_key: string;
  private api_secret: string;
  private ROOT_ASSETS_PATH: string = "nimbuswave_projects";

  constructor(c: Context<{ Bindings: Bindings; Variables: AuthContext }>) {
    (this.CLOUD_NAME = c.env.CLOUDINARY_CLOUD_NAME),
      (this.api_key = c.env.CLOUDINARY_API_KEY),
      (this.api_secret = c.env.CLOUDINARY_API_SECRET);
  }

  async uploadFile(
    file: ArrayBuffer,
    filename: string,
    filetypeMeta: MediaType,
    project_id: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file]));
      !this.isImageFile(filetypeMeta) &&
        formData.append("public_id", `${filename}.${filetypeMeta.extension}`);
      formData.append("asset_folder", `${this.ROOT_ASSETS_PATH}/${project_id}`);
      formData.append("upload_preset", "nimbus_projectfiles");

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await uploadResponse.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteFile(public_id: string): Promise<any> {
    try {
      const deleteResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/auto/delete_by_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_id,
          }),
        }
      );
      const data = await deleteResponse.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  isImageFile(fileTypeMeta: MediaType) {
    return fileTypeMeta.category === FileCategory.Image;
  }
}

export default CloudinaryService;
