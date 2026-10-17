import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      host: true,
      port: 8092,
      proxy: {
        '/dev-api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8090',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/dev-api/, '')
        },
        // 本地开发时由 Vite/Node 转发 OSM HTTPS 请求，避开当前 Java 运行环境的 TLS 握手兼容问题。
        '/osm-upstream': {
          target: 'https://osmtrade.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/osm-upstream/, '')
        }
      }
    }
  }
})
