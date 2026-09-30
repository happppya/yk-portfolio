type ScrollController = (top: number) => void
let controller: ScrollController | undefined

export function registerScrollController(next: ScrollController) {
  controller = next
  return () => { if (controller === next) controller = undefined }
}

export function syncScrollPosition(top: number) {
  if (!controller) return false
  controller(top)
  return true
}
