// this service is responsible for user related operations with server

import BaseService from "./base";
import supabase from "./supabase";

class UserService extends BaseService {
  constructor() {
    super();
  }

  async createUser(
    uid: string,
    email: string,
    metaData: {},
  ): Promise<{} | null> {
    try {
      const response = await this.server.post("/api/user", {
        uid,
        email,
        meta_data: metaData,
      });
      return response.data;
    } catch (error) {
      // delete the user from supabase
      const deleteResponse = await supabase.deleteUser(uid);
      if (!deleteResponse) {
        console.log("User creation failed and user deletion also failed");
        throw new Error("User creation failed and user deletion also failed");
      }
      return null;
    }
  }

  async getUserDashboard(): Promise<any | null> {
    try {
      const response = await this.server.get("/api/user/dashboard");
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export default new UserService();
