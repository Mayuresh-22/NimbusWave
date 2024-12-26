import AdmZip from "adm-zip";
import type { Context } from "hono";
import { v4 } from "uuid";
import type { Bindings } from "..";
import type { AuthContext } from "../middlewares/auth";
import CloudinaryService, { allowedFileTypes } from "./cloudinary";
import FRAMEWORK_PROCESSORS from "./frameworks";
import { getSQLDateTimeNow, normalizeProjectName } from "./helper";

interface ProjectMeta {
  project_app_name: string | null | unknown;
  project_name: string;
  project_description: string;
  project_framework: string;
}

interface DeploymentFlags {
  UPDATE_PROJECT_APP_NAME?: boolean;
  UPDATE_BASE_NAME?: boolean;
}

/**
 * Handles project deployment and processes uploaded zip files
 * @param {Context} c - Hono context with bindings
 * @param {string} projectId - Unique identifier for the project
 * @param {File} zipProjectFiles - Uploaded zip file containing project files
 * @param {ProjectMeta} meta - Project metadata
 * @param {DeploymentFlags} flags - Deployment flags
 * @returns {Promise<DeploymentResult>} Deployment status and details
 */
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
  private FINAL_INDEX_HTML_PROCESS_RESULT: any | undefined = undefined;
  // project variables
  private PROJECT_APP_NAME: string = "";
  private PROJECT_SIZE = 0;
  private DEPLOYMENT_START_TIME = Date.now();
  private DEPLOYMENT_END_TIME = 0;

  constructor(
    c: Context<{ Bindings: Bindings; Variables: AuthContext }>,
    projectId: string,
    zipProjectFiles: File,
    meta: ProjectMeta,
    flags: DeploymentFlags = {
      UPDATE_PROJECT_APP_NAME: meta.project_app_name ? false : true, // update project app name if null
      UPDATE_BASE_NAME: false,
    },
  ) {
    this.c = c;
    this.projectId = projectId;
    this.zipProjectFiles = zipProjectFiles;
    this.meta = meta;
    this.PROJECT_APP_NAME = flags.UPDATE_PROJECT_APP_NAME
      ? normalizeProjectName(meta.project_name)
      : (meta.project_app_name as string);
    this.log(`DeploymentService initialized for project ${this.projectId}`);
  }

  private log(message: string) {
    this.logString += getSQLDateTimeNow() + ": " + message + "\n";
  }

  /**
   * Unzips the uploaded project files
   * @returns {Promise<DeploymentService>} Deployment service instance
   * @throws {Error} Error if unzipping fails
   */
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
        entry.entryName.includes(this.INDEX_DOT_HTML),
      );
      this.indexHTMLFileBuffer = this.indexHTMLEntry?.getData().toString();
      this.log("Unzipping successful");
      return this;
    } catch (error) {
      this.log(`Unzipping failed: ${error}`);
      throw error;
    }
  }

  /**
   * Processes the project files and uploads them to cloudinary
   * @returns {Promise<DeploymentService>} Deployment service instance
   * @throws {Error} Error if processing fails
   */
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
        console.log("Processing file: ", filePath);
        // create a file object
        const file = new File(
          [fileBuffer],
          `${fileBaseName}.${fileExtension}`,
          {
            type: fileTypeConfig.type,
          },
        );

        // upload the file to cloudinary
        const cloudinaryResponse = await new CloudinaryService(
          this.c,
        ).uploadFile(
          await file.arrayBuffer(),
          fileBaseName,
          fileTypeConfig,
          this.projectId,
        );
        console.log("Cloudinary response: ", JSON.stringify(cloudinaryResponse, null, 2));
        if (cloudinaryResponse?.error || !cloudinaryResponse) {
          throw new Error(`Upload failed for '${filePath}'`);
        }

        // process index.html via the framework processor
        this.indexHTMLFileBuffer = FRAMEWORK_PROCESSORS[
          this.meta.project_framework
        ].processor(
          this.indexHTMLFileBuffer as string,
          {
            [filePath]: cloudinaryResponse.secure_url,
          },
          true,
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

  /**
   * Processes the index.html file and uploads it to cloudinary.
   * Updates project file paths with new cloudinary URLs
   * @returns {Promise<DeploymentService>} Deployment service instance
   * @throws {Error} Error if processing fails
   */
  async processIndexHTML() {
    try {
      this.log("Processing index.html...");
      const indexHTMLFile = new File(
        [this.indexHTMLFileBuffer as string],
        this.INDEX_DOT_HTML,
        { type: "text/html" },
      );

      const cloudinaryResponse = await new CloudinaryService(this.c).uploadFile(
        await indexHTMLFile.arrayBuffer(),
        "index",
        allowedFileTypes.html,
        this.projectId,
      );

      if (!cloudinaryResponse) {
        throw new Error("Upload failed for 'index.html'");
      }

      this.log("Processed index.html successfully.");
      this.FINAL_INDEX_HTML_PROCESS_RESULT = cloudinaryResponse;
      return this;
    } catch (error) {
      this.log(`Processing index.html failed: ${error}`);
      throw error;
    }
  }

  /**
   * Finalizes the deployment process and returns the deployment result
   * @returns {Promise<DeploymentResult>} Deployment status and details
   */
  async finalize() {
    this.log("Finalizing deployment...");
    this.DEPLOYMENT_END_TIME = Date.now();
    this.PROJECT_SIZE = this.zipBuffer?.byteLength ?? 0;
    this.log("Deployment finalized.");
    return {
      deploymentId: v4(),
      deploymentName: normalizeProjectName(
        this.meta.project_name,
        "deployment",
      ),
      appName: this.PROJECT_APP_NAME,
      projectSize: this.PROJECT_SIZE,
      timeTaken: this.DEPLOYMENT_END_TIME - this.DEPLOYMENT_START_TIME,
      log: this.logString,
      deploymentResult: this.FINAL_INDEX_HTML_PROCESS_RESULT,
    };
  }
}

export default DeploymentService;
