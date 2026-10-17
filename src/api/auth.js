import http from '@/services/http'
export const getCaptcha = () => http.get('/captchaImage')
export const login = data => http.post('/login', data, { headers: { isToken: false } })
export const getCurrentUser = () => http.get('/getInfo')
export const logout = () => http.post('/logout')
