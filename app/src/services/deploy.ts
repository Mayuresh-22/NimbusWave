import BaseService from "./base";

class DeploymentService extends BaseService {

  constructor() {
    super();
  }

  async createNewProject() {
    try {
      const response = await this.server.post('/projects', {
        default: true
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default new DeploymentService();