import BaseService from "./base";

class DeploymentService extends BaseService {

  constructor() {
    super();
  }

  async createNewProject() {
    try {
      const response = await this.server.post('/api/project', {
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