const TOKEN_KEY = 'option-web-token'
const USER_KEY = 'option-web-user'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = token => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)
export const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}') } catch { return {} } }
export const setUser = user => localStorage.setItem(USER_KEY, JSON.stringify(user || {}))
export const clearSession = () => { removeToken(); localStorage.removeItem(USER_KEY) }
