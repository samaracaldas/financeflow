import axios from 'axios'

// Mesma origem do front; o next.config.ts faz o proxy de /api para a API Express.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 90_000, // o Render free leva até ~1 min para acordar
})

export function getErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente de novo.') {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message
    if (message) return message
    if (err.code === 'ECONNABORTED') return 'O servidor demorou para responder. Tente de novo em instantes.'
    if (!err.response || err.response.status >= 500) return 'Servidor indisponível no momento. Tente de novo em instantes.'
  }
  return fallback
}

export default api
