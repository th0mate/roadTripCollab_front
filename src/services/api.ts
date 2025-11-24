import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
