import { useEffect, useRef } from 'react'

/**
 * Full-screen animated cover for Rally.
 * - Canvas particle network that reacts to the cursor (repel + connecting lines).
 * - A soft red glow that eases toward the mouse.
 * - Parallax tilt on the headline.
 * - Mission sections that reveal on scroll.
 */
export default function Landing({ onEnter }) {
  const canvasRef = useRef(null)
  const glowRef = useRef(null)
  const heroRef = useRef(null)
  const scrollerRef = useRef(null)

  // Particle field + mouse glow.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 }
    let w = 0, h = 0, dpr = 1, particles = [], raf = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(40, Math.min(120, Math.floor((w * h) / 13000)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.8,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY }
    const onLeave = () => { mouse.tx = -9999; mouse.ty = -9999 }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onLeave)

    const LINK = 128, MLINK = 190, REPEL = 130

    const frame = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.12
      mouse.y += (mouse.ty - mouse.y) * 0.12
      if (glowRef.current && mouse.tx > 0) {
        glowRef.current.style.opacity = '1'
        glowRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`
      }
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        const dx = p.x - mouse.x, dy = p.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < REPEL * REPEL) {
          const d = Math.sqrt(d2) || 1
          const f = ((REPEL - d) / REPEL) * 0.8
          p.x += (dx / d) * f
          p.y += (dy / d) * f
        }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y)
        if (md < MLINK) {
          ctx.strokeStyle = `rgba(255,68,68,${(1 - md / MLINK) * 0.55})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        }
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dd = Math.hypot(a.x - b.x, a.y - b.y)
          if (dd < LINK) {
            ctx.strokeStyle = `rgba(255,99,99,${(1 - dd / LINK) * 0.16})`
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
        ctx.fillStyle = 'rgba(255,130,130,0.9)'
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }

    if (reduce) {
      // Static single paint for reduced-motion users.
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        ctx.fillStyle = 'rgba(255,130,130,0.7)'
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [])

  // Parallax tilt on the hero.
  useEffect(() => {
    const onMove = (e) => {
      const el = heroRef.current
      if (!el) return
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2
      const rx = ((e.clientY - cy) / cy) * -3.5
      const ry = ((e.clientX - cx) / cx) * 3.5
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Reveal-on-scroll.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add('reveal-in')),
      { threshold: 0.18, root: scrollerRef.current }
    )
    const els = scrollerRef.current?.querySelectorAll('.reveal') || []
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const scrollToMission = () => {
    scrollerRef.current?.querySelector('#mission')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={scrollerRef} className="relative h-screen overflow-y-auto bg-ink-900 text-white">
      {/* Background layers (fixed) */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 h-full w-full" />
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 -ml-[300px] -mt-[300px] h-[600px] w-[600px] rounded-full opacity-0 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(255,68,68,0.20), rgba(255,68,68,0) 60%)', willChange: 'transform' }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-ink-900/30 to-ink-900" />

      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="absolute left-6 top-6 flex items-center gap-2 text-sm font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rally text-white">R</span>
          Rally
        </div>

        <div ref={heroRef} style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-rally/40 bg-rally/10 px-4 py-1.5 text-xs font-medium text-rally-light reveal reveal-in">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rally" />
            Peaceful collective action, mapped
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Change starts when<br className="hidden sm:block" /> we <span className="gradient-text">show up.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Rally puts protests and community action on a living map — so finding your people,
            and your cause, takes seconds instead of searching. Movements grow when they're easy to find.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onEnter}
              className="group inline-flex items-center gap-2 rounded-full bg-rally px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-rally/30 transition-all hover:bg-rally-dark hover:shadow-rally/50 active:scale-[0.98]"
            >
              Open the map
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={scrollToMission}
              className="rounded-full border border-ink-600 px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-400"
            >
              Our mission
            </button>
          </div>
        </div>

        <button
          onClick={scrollToMission}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Scroll
          <span className="animate-bounce text-lg">↓</span>
        </button>
      </section>

      {/* ---------- MISSION ---------- */}
      <section id="mission" className="relative mx-auto max-w-5xl px-6 py-24">
        <div className="reveal">
          <p className="text-sm font-semibold uppercase tracking-widest text-rally">Our mission</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Every movement begins with people deciding to be counted.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            Too often the hardest part of standing up for something isn't the courage — it's knowing
            where and when to show up. Rally exists to remove that friction: to make collective action
            visible, understandable, and within reach, so more people turn quiet conviction into presence.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { t: 'See the movement', d: 'Real protests and gatherings near you, on one live map. Bigger turnouts show as bigger dots, so momentum is something you can actually see.' },
            { t: 'Understand the cause', d: 'A neutral, plain-English summary of what every event is about — no spin, no sides — so you can decide for yourself.' },
            { t: 'Show up together', d: 'RSVP, share with a friend, and add your own event in a minute. Presence is the point, and presence compounds.' },
          ].map((c, i) => (
            <div
              key={c.t}
              className="reveal rounded-2xl border border-ink-600 bg-ink-800/60 p-6 backdrop-blur"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rally/15 text-lg font-bold text-rally">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-bold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Stats band */}
        <div className="reveal mt-16 grid grid-cols-3 gap-4 rounded-2xl border border-ink-600 bg-ink-800/40 p-8 text-center backdrop-blur">
          {[
            { n: '5', l: 'cities, live' },
            { n: '15+', l: 'active events' },
            { n: '∞', l: 'reasons to show up' },
          ].map((s) => (
            <div key={s.l}>
              <div className="gradient-text text-4xl font-extrabold sm:text-5xl">{s.n}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="reveal mt-20 rounded-3xl border border-rally/30 bg-gradient-to-br from-rally/15 to-transparent p-10 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            The world changes a little every time someone decides to be there.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-300">Find what's happening near you. Then go.</p>
          <button
            onClick={onEnter}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-rally px-9 py-4 text-sm font-bold text-white shadow-lg shadow-rally/30 transition-all hover:bg-rally-dark active:scale-[0.98]"
          >
            Enter Rally
            <span>→</span>
          </button>
        </div>

        <p className="mt-16 text-center text-xs text-zinc-600">
          Rally supports peaceful, lawful assembly. Built for community, not conflict.
        </p>
      </section>
    </div>
  )
}
