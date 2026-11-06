import { useEffect, useState } from 'react'
import { track } from './analytics'
import { BottomNav, type Route } from './components/BottomNav'
import { AcuityScreen } from './components/AcuityScreen'
import { BookScreen } from './components/BookScreen'
import { MakeScreen } from './components/MakeScreen'
import { SeeScreen } from './components/SeeScreen'
import { plateFromPath } from './book/plateMeta'

function routeFromHash(): Route {
  if (plateFromPath(location.pathname) && !location.hash) return 'book'
  if (location.hash.startsWith('#/see')) return 'see'
  if (location.hash.startsWith('#/book')) return 'book'
  if (location.hash.startsWith('#/depth')) return 'acuity'
  return 'make'
}

function plateFromHash(): number {
  const m = location.hash.match(/^#\/book\/(\d+)/)
  if (m) return Number(m[1])
  return plateFromPath(location.pathname) ?? 1
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
      <div className="sm:pt-14">{route === 'see' ? <SeeScreen /> : route === 'book' ? <BookScreen n={plate} /> : route === 'acuity' ? <AcuityScreen /> : <MakeScreen />}</div>
      <BottomNav route={route} />
    </>
  )
}
