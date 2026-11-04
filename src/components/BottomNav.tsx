export type Route = 'make' | 'book' | 'see' | 'acuity'

export function BottomNav({ route }: { route: Route }) {
  const item = (r: Route, label: string, href: string) => (
    <a
      href={href}
      aria-current={route === r ? 'page' : undefined}
      className={`flex min-h-14 flex-1 items-center justify-center text-label uppercase tracking-wide ${
        route === r ? 'border-t-2 border-accent text-ink' : 'border-t-2 border-transparent text-ink-soft'
      }`}
    >
      {label}
    </a>
  )
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 flex bg-paper/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', borderTop: '1px solid var(--color-edge)' }}
    >
      {item('make', 'Make', '#/')}
      {item('book', 'Book', '#/book/1')}
      {item('see', 'How to see', '#/see')}
      {item('acuity', 'Depth test', '#/depth')}
    </nav>
  )
}
