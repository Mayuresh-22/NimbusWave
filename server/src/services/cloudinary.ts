import { Bindings } from "..";
import { AuthContext } from "../middlewares/auth";
import { Context } from "hono";

interface FileType {
  type: string;
  file: string;
  ext: string;
}

export const allowedFileTypes: { [key: string]: FileType } = {
  html: { type: "text/html", file: "text", ext: "html" },
  css: { type: "text/css", file: "text", ext: "css" },
  js: { type: "text/javascript", file: "text", ext: "js" },
  ts: { type: "text/typescript", file: "text", ext: "ts" },
  json: { type: "application/json", file: "text", ext: "json" },
  jpg: { type: "image/jpeg", file: "image", ext: "jpg" },
  jpeg: { type: "image/jpeg", file: "image", ext: "jpeg" },
  png: { type: "image/png", file: "image", ext: "png" },
  gif: { type: "image/gif", file: "image", ext: "gif" },
  ico: { type: "image/x-icon", file: "image", ext: "ico" },
  svg: { type: "image/svg+xml", file: "image", ext: "svg" },
  webp: { type: "image/webp", file: "image", ext: "webp" },
  avif: { type: "image/avif", file: "image", ext: "avif" },
  mp4: { type: "video/mp4", file: "video", ext: "mp4" },
  webm: { type: "video/webm", file: "video", ext: "webm" },
  ogg: { type: "video/ogg", file: "video", ext: "ogg" },
  mp3: { type: "audio/mpeg", file: "audio", ext: "mp3" },
  wav: { type: "audio/wav", file: "audio", ext: "wav" },
};

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
    filetypeMeta: FileType,
    project_id: string,
  ): Promise<any> {
    console.log("uploading... ", filename, project_id);
    const formData = new FormData();
    formData.append("file", new Blob([file]));
    !this.isImageFile(filetypeMeta) &&
      formData.append("public_id", `${filename}.${filetypeMeta.ext}`);
    formData.append("asset_folder", `${this.ROOT_ASSETS_PATH}/${project_id}`);
    formData.append("upload_preset", "nimbus_projectfiles");

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await uploadResponse.json();
    console.log(data);

    return data;
  }

  isImageFile(fileTypeMeta: FileType) {
    return fileTypeMeta.file === "image";
  }
}

export default CloudinaryService;
