export default defineNuxtConfig({
  modules: ['@tresjs/nuxt'],
  css: ['~/assets/styles/main.css'],
  build: { transpile: ['three', 'gsap'] },
  vite: { optimizeDeps: { exclude: ['three'] } },
  app: {
    head: {
      title: 'moholy.js — Signal-Driven Shader Visuals',
      meta: [
        { name: 'description', content: 'Tiny WebGL library that maps real-time data signals to shader visual parameters. Named after Laszlo Moholy-Nagy.' },
        { name: 'theme-color', content: '#0c0c0e' },
        { property: 'og:title', content: 'moholy.js' },
        { property: 'og:description', content: 'Signal-driven shader visuals. Zero dependencies. 4.67KB gzipped.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Inter:wght@300;400;500&display=swap' },
      ],
    },
  },
  compatibilityDate: '2025-01-01',
})
