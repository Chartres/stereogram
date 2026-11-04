import { useEffect, useState } from 'react'
import { track } from './analytics'
import { BottomNav, type Route } from './components/BottomNav'
import { BookScreen } from './components/BookScreen'
import { MakeScreen } from './components/MakeScreen'
import { SeeScreen } from './components/SeeScreen'

function routeFromHash(): Route {
  if (location.hash.startsWith('#/see')) return 'see'
  if (location.hash.startsWith('#/book')) return 'book'
  return 'make'
}

function plateFromHash(): number {
  const m = location.hash.match(/^#\/book\/(\d+)/)
  return m ? Number(m[1]) : 1
}

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [plate, setPlate] = useState<number>(plateFromHash)

  useEffect(() => {
    track('page_view', { route })
  }, [route])

  useEffect(() => {
    const onHash = () => {
      const next = routeFromHash()
      const swap = () => {
        setRoute(next)
        setPlate(plateFromHash())
      }
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(swap)
      else swap()
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      {route === 'see' ? <SeeScreen /> : route === 'book' ? <BookScreen n={plate} /> : <MakeScreen />}
      <BottomNav route={route} />
    </>
  )
}
