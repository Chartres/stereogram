export type Route = 'make' | 'book' | 'see' | 'acuity'

/** Bottom tabs on phones (thumb zone, mobile-ux); a top bar from 640 px up, where people look for it. */
export function BottomNav({ route }: { route: Route }) {
  const item = (r: Route, label: string, href: string) => (
    <a
      href={href}
      aria-current={route === r ? 'page' : undefined}
      className={`flex min-h-14 flex-1 items-center justify-center text-label uppercase tracking-wide sm:min-h-12 sm:flex-none sm:px-5 sm:text-[17px] sm:normal-case sm:tracking-normal ${
        route === r
          ? 'border-t-2 border-accent text-ink sm:border-t-0 sm:border-b-2 sm:font-semibold'
          : 'border-t-2 border-transparent text-ink-soft sm:border-t-0 sm:border-b-2 hover:text-ink'
      }`}
    >
      {label}
    </a>
  )
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-edge bg-paper/90 backdrop-blur sm:bottom-auto sm:top-0 sm:border-b sm:border-t-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-5xl sm:items-center sm:gap-1 sm:px-4">
        <a href="#/" className="hidden font-display text-title sm:mr-auto sm:block">
          Stereogram
        </a>
        {item('make', 'Make', '#/')}
        {item('book', 'Book', '#/book/1')}
        {item('see', 'How to see', '#/see')}
        {item('acuity', 'Depth test', '#/depth')}
      </div>
    </nav>
  )
}
