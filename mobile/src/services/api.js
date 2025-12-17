import axios from 'axios'

const api = axios.create({
  baseURL: 'https://pointage-p5dr.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
