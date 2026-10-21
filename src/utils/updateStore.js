// 更新菜单未读数（W6）：导航“更新”红点 / 数字共用
// 来源：GET /api/member/updates、设置页 settings.updates、更新页 summary.progress；打开更新页后标记已读
import { reactive } from 'vue'
import { getUpdateProgress, markUpdatesSeen } from '@/api/member'

const THROTTLE_MS = 60000

export const updateState = reactive({ seenSeq: 0, currentSeq: 0, unseen: 0, loadedAt: 0 })

let pending = null

// 写入一次进度（以后端为准；后端已读只增不减）
export function setUpdateProgress(progress) {
  if (!progress || typeof progress !== 'object' || !Number.isFinite(Number(progress.currentSeq))) return
  updateState.currentSeq = Number(progress.currentSeq)
  updateState.seenSeq = Number(progress.seenSeq) || 0
  const unseen = Number(progress.unseen)
  updateState.unseen = Math.max(0, Number.isFinite(unseen) ? unseen : updateState.currentSeq - updateState.seenSeq)
  updateState.loadedAt = Date.now()
}

// 拉取未读数：默认节流 60 秒
export function refreshUpdateProgress({ force = false } = {}) {
  if (pending) return pending
  if (!force && updateState.loadedAt && Date.now() - updateState.loadedAt < THROTTLE_MS) return Promise.resolve(updateState)
  pending = getUpdateProgress().then(res => { setUpdateProgress(res?.data) }).catch(() => {}).finally(() => { pending = null })
  return pending
}

// 打开更新页后标记已读到当前序号
export async function markAllUpdatesSeen(currentSeq) {
  let target = Number(currentSeq)
  if (!Number.isFinite(target)) {
    await refreshUpdateProgress({ force: true })
    target = updateState.currentSeq
  }
  if (!target || (target <= updateState.seenSeq && updateState.unseen === 0)) return
  try {
    const res = await markUpdatesSeen(target)
    setUpdateProgress(res?.data && Number.isFinite(Number(res.data.currentSeq)) ? res.data : { seenSeq: target, currentSeq: Math.max(target, updateState.currentSeq), unseen: 0 })
  } catch {
    // 标记失败不影响阅读，下次进入再标记
  }
}

export function resetUpdateProgress() {
  Object.assign(updateState, { seenSeq: 0, currentSeq: 0, unseen: 0, loadedAt: 0 })
}
