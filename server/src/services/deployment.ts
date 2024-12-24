import AdmZip from "adm-zip";
import CloudinaryService, { allowedFileTypes } from "./cloudinary";
import FRAMEWORK_PROCESSORS from "./frameworks";
import { Context } from "hono";
import { AuthContext } from "../middlewares/auth";
import { Bindings } from "..";

interface ProjectMeta {
  project_name: string;
  project_description: string;
  project_framework: string;
}

class DeploymentService {
  private c: Context<{ Bindings: Bindings; Variables: AuthContext }>;
  private logString: string = "";
  private meta: ProjectMeta;
  private projectId: string;
  private zipProjectFiles: File;
  private zipBuffer: ArrayBuffer | undefined = undefined;
  private zipArchive: AdmZip | undefined = undefined;
  private zipContents: AdmZip.IZipEntry[] = [];
  private indexHTMLEntry: AdmZip.IZipEntry | undefined = undefined;
  private indexHTMLFileBuffer: string | undefined = undefined;
  private INDEX_DOT_HTML = "index.html";

  constructor(projectId: string, zipProjectFiles: File, meta: ProjectMeta, c: Context<{ Bindings: Bindings; Variables: AuthContext }>) {
    this.projectId = projectId;
    this.zipProjectFiles = zipProjectFiles;
    this.meta = meta;
    this.c = c;
    this.log(`DeploymentService initialized for project ${this.projectId}`);
  }

  private log(message: string) {
    this.logString += Date.now().toLocaleString() + ": " + message + "\n";
  }

  async unzip() {
    try {
      // unzip the project files
      this.log("Unzipping project files...");
      if (
        this.zipProjectFiles.type !== "application/x-zip-compressed" &&
        this.zipProjectFiles.type !== "application/zip"
      ) {
        throw new Error("Invalid file type, only zip files are allowed");
      }
      this.zipBuffer = await this.zipProjectFiles.arrayBuffer();
      this.zipArchive = new AdmZip(Buffer.from(this.zipBuffer));
      this.zipContents = this.zipArchive.getEntries();
      this.indexHTMLEntry = this.zipContents.find((entry) =>
        entry.entryName.includes(this.INDEX_DOT_HTML)
      );
      this.indexHTMLFileBuffer = this.indexHTMLEntry?.getData().toString();
      this.log("Unzipping successful");
      return this;
    } catch (error) {
      this.log(`Unzipping failed: ${error}`);
      throw error;
    }
  }

  async processFiles() {
    this.log("Processing project files...");
    try {
      if (this.zipContents.length === 0) {
        throw new Error("No files found in the zip archive");
      }
      for (const entry of this.zipContents) {
        // iterate through the zip entries
        const filePath = entry.entryName.split("/").slice(1).join("/");
        const fileBuffer = entry.getData();
        const fileBaseName =
          entry.entryName.split("/").pop()?.split(".")[0] ?? "";
        const fileExtension =
          entry.entryName.split("/").pop()?.split(".").pop() ?? "";
        const fileTypeConfig = allowedFileTypes[fileExtension];

        if (!fileTypeConfig || filePath.includes(this.INDEX_DOT_HTML)) {
          // file type not allowed or not a file
          this.log(`Skipping file ${filePath}`);
          continue;
        }

        // create a file object
        const file = new File([fileBuffer], `${fileBaseName}.${fileExtension}`, {
          type: fileTypeConfig.type,
        });

        // upload the file to cloudinary
        const cloudinaryResponse = await new CloudinaryService(this.c)
          .uploadFile(
            await file.arrayBuffer(),
            fileBaseName,
            fileTypeConfig,
            this.projectId,
          );
        if (!cloudinaryResponse) {
          throw new Error(`Upload failed for '${filePath}'`);
        }
        // // add the uploaded file to the list
        // uploadableFiles[filePath] = {
        //   file: file,
        //   uploadMeta: {
        //     ...cloudinaryResponse,
        //   },
        // };
        // process index.html via the framework processor
        this.indexHTMLFileBuffer = FRAMEWORK_PROCESSORS[this.meta.project_framework].processor(
          this.indexHTMLFileBuffer as string,
          {
            [filePath]: cloudinaryResponse.secure_url,
          },
          true
        );
        this.log(`Processed file ${filePath} successfully.`);
      }
      this.log("Successfully processed all the files.");
      return this;
    } catch (error) {
      this.log(`Processing failed: ${error}`);
      throw error;
    }
  }

  async processIndexHTML() {
    try {
      this.log("Processing index.html...");
      const indexHTMLFile = new File(
        [this.indexHTMLFileBuffer as string],
        this.INDEX_DOT_HTML,
        { type: "text/html" }
      );

      const cloudinaryResponse = await new CloudinaryService(this.c)
      .uploadFile(
        await indexHTMLFile.arrayBuffer(),
        "index",
        allowedFileTypes.html,
        this.projectId
      );

      if (!cloudinaryResponse) {
        throw new Error("Upload failed for 'index.html'");
      }

      this.log("Processed index.html successfully.");
      return {cloudinaryResponse, log: this.logString};
    } catch (error) {
      this.log(`Processing index.html failed: ${error}`);
      throw error;
    }
  }
}

export default DeploymentService;