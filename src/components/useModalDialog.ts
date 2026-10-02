import { useEffect, useRef, type MouseEvent, type SyntheticEvent } from 'react'

/**
 * Native modal behavior shared by the two overlays (the info dialogs and the artwork
 * inspector): open on mount, keep the page behind from scrolling, and restore the
 * previous focus and scroll on close. Escape and a backdrop click also close it, so
 * each overlay only supplies its own content.
 *
 * The hook owns no route or media state, and both overlays keep the native `<dialog>`
 * element, which is what gives them focus trapping and an inert backdrop.
 */
export function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = ref.current
    const previous = document.activeElement as HTMLElement | null
    element?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      previous?.focus({ preventScroll: true })
    }
  }, [])

  return {
    ref,
    dialogProps: {
      onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault()
        onClose()
      },
      onClick: (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) onClose()
      },
    },
  }
}
