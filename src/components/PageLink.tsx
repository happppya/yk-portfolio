import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '@/lib/router'
import { shouldHandleLink } from '@/lib/routes'

export function PageLink({ href = '/', onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (!shouldHandleLink(event, href, props)) return
    event.preventDefault()
    navigate(href)
  }
  return <a {...props} href={href} onClick={handleClick}>{children}</a>
}
