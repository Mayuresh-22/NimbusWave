// this class is the base class of all the server related services

import axios, { AxiosInstance } from "axios";
import supabase from "./supabase";

class BaseService {
  protected server: AxiosInstance;

  constructor() {
    this.server = axios.create({
      baseURL: import.meta.env.VITE_SERVER_URL as string,
      headers: {
        "Content-Type": "application/json",
      }
    });

    // request interceptor
    this.server.interceptors.request.use(
      async (config) => {
        config.headers.Authorization = `Bearer ${(await supabase.getSession())?.access_token}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  
}

export default BaseService;