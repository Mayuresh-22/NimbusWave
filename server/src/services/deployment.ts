import AdmZip from "adm-zip";
import type { Context } from "hono";
import { sha256 } from "hono/utils/crypto";
import { v4 } from "uuid";
import type { Bindings } from "..";
import type { AuthContext } from "../middlewares/auth";
import CloudinaryService, { SUPPORTED_MEDIA_TYPES } from "./cloudinary";
import FRAMEWORK_PROCESSORS from "./frameworks";
import { getSQLDateTimeNow, normalizeProjectName } from "./helper";

interface ProjectVars {
  project_app_name: string | null | unknown;
  project_name: string;
  project_description: string;
  project_framework: string;
}

interface FileMeta {
  file?: File;
  fileName?: string;
  assetId?: string;
  publicId?: string;
  secureUrl?: string;
  sha256?: string | null;
}

export interface ProjectFilesMeta {
  [key: string]: FileMeta;
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
 * @param {ProjectVars} projectMeta - Project metadata
 * @param {DeploymentFlags} flags - Deployment flags
 * @returns {Promise<DeploymentResult>} Deployment status and details
 */
class DeploymentService {
  private c: Context<{ Bindings: Bindings; Variables: AuthContext }>;
  private logString: string = "";
  private projectMeta: ProjectVars;
  private projectId: string;
  private zipProjectFiles: File;
  private zipBuffer: ArrayBuffer | undefined = undefined;
  private zipArchive: AdmZip | undefined = undefined;
  private zipContents: AdmZip.IZipEntry[] = [];
  private indexHTMLEntry: AdmZip.IZipEntry | undefined = undefined;
  private indexHTMLFileBuffer: string | undefined = undefined;
  private INDEX_DOT_HTML = "index.html";
  private storedProjectFilesDict: ProjectFilesMeta = {}; // populated with value from the database
  // project variables
  private ENTRY_FILE_UPLOAD_RESPONSE: any | undefined = undefined;
  private PROJECT_APP_NAME: string = "";
  private PROJECT_SIZE = 0;
  private DEPLOYMENT_START_TIME = Date.now();
  private DEPLOYMENT_END_TIME = 0;

  constructor(
    c: Context<{ Bindings: Bindings; Variables: AuthContext }>,
    projectId: string,
    zipProjectFiles: File,
    projectMeta: ProjectVars,
    storedProjectFilesDict: ProjectFilesMeta | null,
    flags: DeploymentFlags = {
      UPDATE_PROJECT_APP_NAME: projectMeta.project_app_name ? false : true, // update project app name if null
      UPDATE_BASE_NAME: false,
    },
  ) {
    this.c = c;
    this.projectId = projectId;
    this.zipProjectFiles = zipProjectFiles;
    this.projectMeta = projectMeta;
    this.storedProjectFilesDict = storedProjectFilesDict ?? {};
    this.PROJECT_APP_NAME = flags.UPDATE_PROJECT_APP_NAME
      ? normalizeProjectName(projectMeta.project_name)
      : (projectMeta.project_app_name as string);
    this.log(`DeploymentService initialized for project ${this.projectId}`);
  }

  private log(message: string) {
    this.logString += getSQLDateTimeNow(true) + ": " + message + "\n";
    console.log(message);
  }

  /**
   * Unzips the uploaded project files
   * @returns {Promise<DeploymentService>} Deployment service instance
   * @throws {Error} Error if unzipping fails
   */
  async unzip(): Promise<DeploymentService> {
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
  async processFiles(): Promise<DeploymentService> {
    this.log("Processing project files...");
    try {
      if (this.zipContents.length === 0) {
        throw new Error("No files found in the zip archive");
      }
      const fileUploadPromises: Promise<any>[] = [];
      const changedFilePathArray: string[] = [];
      const unChangedFilePathArray: string[] = [];
      const cloudinary = new CloudinaryService(this.c);

      for (const entry of this.zipContents) {
        // iterate through the zip entries
        const filePath = entry.entryName.split("/").slice(1).join("/");
        const fileBuffer = entry.getData();
        const fileBaseName =
          entry.entryName.split("/").pop()?.split(".")[0] ?? "";
        const fileExtension =
          entry.entryName.split("/").pop()?.split(".").pop() ?? "";
        const fileTypeConfig = SUPPORTED_MEDIA_TYPES[fileExtension];

        // check if the file type is allowed and not the index.html file
        if (!fileTypeConfig || filePath.includes(this.INDEX_DOT_HTML)) {
          this.log(`Skipping file ${filePath}`);
          continue;
        }
        console.log("Processing file: ", filePath);

        // calculate the SHA256 hash of the file
        const fileSHA256 = await sha256(fileBuffer);

        // push the file upload promise only if the file has changed or is new
        if (
          fileSHA256 !== this.storedProjectFilesDict[filePath]?.sha256 ||
          !this.storedProjectFilesDict[filePath]
        ) {
          // build new file object for upload
          this.storedProjectFilesDict[filePath] = {
            file: new File([fileBuffer], `${fileBaseName}.${fileExtension}`, {
              type: fileTypeConfig.mimeType,
            }),
            fileName: `${fileBaseName}.${fileExtension}`,
          };

          this.log("Need re-upload for file: " + filePath);
          this.storedProjectFilesDict[filePath].sha256 = fileSHA256;
          fileUploadPromises.push(
            cloudinary.uploadFile(
              await (
                this.storedProjectFilesDict[filePath]?.file as File
              ).arrayBuffer(),
              fileBaseName,
              fileTypeConfig,
              this.projectId,
            ),
          );
          changedFilePathArray.push(filePath);
        } else {
          this.log("File unchanged: " + filePath);
          unChangedFilePathArray.push(filePath);
        }
      }

      this.log("Uploading project files...");
      // wait for all file uploads to complete
      const cloudinaryResponses = await Promise.allSettled(fileUploadPromises);
      this.log("Uploaded project files.");

      // check if all files were uploaded successfully
      // process the index.html file and update the changed project files
      // with new cloudinary URLs
      this.log("Updating changed project files path...");
      for (const [index, response] of cloudinaryResponses.entries()) {
        if (response.status === "rejected") {
          throw new Error("File upload failed");
        }

        // process index.html via the framework processor
        this.indexHTMLFileBuffer = FRAMEWORK_PROCESSORS[
          this.projectMeta.project_framework
        ].processor(
          this.indexHTMLFileBuffer as string,
          {
            [changedFilePathArray[index]]: response?.value.secure_url,
          },
          true,
        );

        // update the file metadata with cloudinary details
        this.storedProjectFilesDict[changedFilePathArray[index]].file =
          undefined;
        this.storedProjectFilesDict[changedFilePathArray[index]].secureUrl =
          response?.value.secure_url;
        this.storedProjectFilesDict[changedFilePathArray[index]].publicId =
          response?.value.public_id;
        this.storedProjectFilesDict[changedFilePathArray[index]].assetId =
          response?.value.asset_id;
        this.log(`Processed file ${changedFilePathArray[index]} successfully.`);
      }
      this.log("Updated changed project files path.");

      // running another loop to update the unchanged project files
      // path with existing cloudinary URLs
      this.log("Updating unchanged project files path...");
      for (const filePath of unChangedFilePathArray) {
        this.indexHTMLFileBuffer = FRAMEWORK_PROCESSORS[
          this.projectMeta.project_framework
        ].processor(
          this.indexHTMLFileBuffer as string,
          {
            [filePath]: this.storedProjectFilesDict[filePath]
              .secureUrl as string,
          },
          true,
        );
      }
      this.log("Updated unchanged project files path.");
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
  async processIndexHTML(): Promise<DeploymentService> {
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
        SUPPORTED_MEDIA_TYPES.html,
        this.projectId,
      );

      if (!cloudinaryResponse) {
        throw new Error("Upload failed for 'index.html'");
      }

      this.log("Processed index.html successfully.");
      this.ENTRY_FILE_UPLOAD_RESPONSE = cloudinaryResponse;
      return this;
    } catch (error) {
      this.log(`Processing index.html failed: ${error}`);
      throw error;
    }
  }

  /**
   * Finalizes the deployment process and returns the deployment result
   * @returns {Promise<any>} Deployment status and details
   */
  async finalize(): Promise<any> {
    this.log("Finalizing deployment...");
    this.DEPLOYMENT_END_TIME = Date.now();
    this.PROJECT_SIZE = this.zipBuffer?.byteLength ?? 0;
    this.log("Deployment finalized.");
    return {
      deploymentId: v4(),
      deploymentName: normalizeProjectName(
        this.projectMeta.project_name,
        "deployment",
      ),
      appName: this.PROJECT_APP_NAME,
      projectSize: this.PROJECT_SIZE,
      timeTaken: this.DEPLOYMENT_END_TIME - this.DEPLOYMENT_START_TIME,
      deploymentResult: this.ENTRY_FILE_UPLOAD_RESPONSE,
      projectFilesDict: JSON.stringify(this.storedProjectFilesDict),
      log: this.logString,
    };
  }
}

export default DeploymentService;
