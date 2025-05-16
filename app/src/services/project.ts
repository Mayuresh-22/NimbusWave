import BaseService from "./base";

class ProjectService extends BaseService {
  constructor() {
    super();
  }

  async createNewProject() {
    try {
      const response = await this.server.post("/api/project", {
        default: true,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getProjecrt(projectId: string, withChats: boolean = false) {
    try {
      const response = await this.server.get(
        `/api/project?id=${projectId}&withChats=${withChats}`,
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async sendMessage(
    message: string,
    file: File,
    projectId: string,
    chatId: string,
  ) {
    try {
      const response = await this.server.post(
        "/api/ai/chat",
        {
          file,
          message,
          project_id: projectId,
          chat_id: chatId,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "stream",
          adapter: "fetch",
        },
      );
      return response.data as ReadableStream<Uint8Array>;
    } catch (error) {
      return null;
    }
  }

  async deployProject(
    projectId: string,
    projectName: string,
    projectFramework: string,
    projectDescription: string,
    zipProjectFiles: File,
  ) {
    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("project_name", projectName);
      formData.append("project_framework", projectFramework);
      formData.append("project_description", projectDescription);
      formData.append("file", zipProjectFiles);
      const response = await this.server.post("/api/project/deploy", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteProject(projectId: string) {
    try {
      const response = await this.server.delete("/api/project", {
        params: { id: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default new ProjectService();
