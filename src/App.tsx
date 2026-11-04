import { useEffect, useState } from 'react'
import { track } from './analytics'
import { BottomNav, type Route } from './components/BottomNav'
import { MakeScreen } from './components/MakeScreen'
import { SeeScreen } from './components/SeeScreen'

function routeFromHash(): Route {
  return location.hash.startsWith('#/see') ? 'see' : 'make'
}

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)

  useEffect(() => {
    track('page_view', { route })
  }, [route])

  useEffect(() => {
    const onHash = () => {
      const next = routeFromHash()
      const swap = () => setRoute(next)
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(swap)
      else swap()
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      {route === 'see' ? <SeeScreen /> : <MakeScreen />}
      <BottomNav route={route} />
    </>
  )
}
