// 浏览器设备指纹：同一浏览器稳定，SHA-256 后为 64 位小写十六进制；不支持 crypto.subtle（非安全上下文）时返回 null（注册时不传）
const HEX64 = /^[0-9a-f]{64}$/

function canvasSignature() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 220
    canvas.height = 30
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#2774cc'
    ctx.fillRect(2, 2, 60, 20)
    ctx.fillStyle = '#183454'
    ctx.fillText('OSM.AI 期权 · device', 6, 6)
    return canvas.toDataURL()
  } catch {
    return ''
  }
}

export async function getDeviceHash() {
  try {
    if (!window.crypto?.subtle || !window.TextEncoder) return null
    const nav = window.navigator || {}
    const parts = [
      nav.userAgent, nav.language, (nav.languages || []).join(','), nav.platform, nav.hardwareConcurrency, nav.deviceMemory,
      `${screen.width}x${screen.height}x${screen.colorDepth}`, Intl.DateTimeFormat().resolvedOptions().timeZone, canvasSignature()
    ]
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('|')))
    const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
    return HEX64.test(hex) ? hex : null
  } catch {
    return null
  }
}
