import axios, { Axios, AxiosInstance } from "axios";


export class ApiService{

  private api: AxiosInstance;

  constructor(){
    this.api = axios.create({
      baseURL: 'http://localhost:5005/api',
      timeout: 10000,
      headers: {'Content-Type': 'application/json'}
    });
  }

}
