const DARK_THEME = {
  '--color-primary': '#377db6',
  '--color-primary-hover': '#3b55e4',
  '--color-primary-active': '#f75050',
  '--color-primary-light': 'rgba(55, 125, 182, 0.15)',
  '--color-primary-rgb': '55, 125, 182',
  '--color-background': '#1a1a1a',
  '--color-background-light': '#2c2c2c',
  '--color-background-lighter': '#3a3a3a',
  '--color-text': '#ffffff',
  '--color-text-secondary': '#a0a0a0',
  '--color-text-tertiary': '#707070',
  '--color-border': '#404040',
  '--color-border-light': '#505050',
  '--sidebar-bg': '#1a1a1a',
  '--titlebar-bg': '#1a1a1a',
  '--titlebar-icon-color': '#888888',
  '--titlebar-icon-hover': '#ffffff'
}

const LIGHT_THEME = {
  '--color-primary': '#3366ff',
  '--color-primary-hover': '#274bdb',
  '--color-primary-active': '#1a34b8',
  '--color-primary-light': 'rgba(51, 102, 255, 0.12)',
  '--color-primary-rgb': '51, 102, 255',
  '--color-background': '#f5f7fb',
  '--color-background-light': '#ffffff',
  '--color-background-lighter': '#edf1f7',
  '--color-text': '#1f1f1f',
  '--color-text-secondary': '#4a4a4a',
  '--color-text-tertiary': '#707070',
  '--color-border': '#d9dce3',
  '--color-border-light': '#e5e9f0',
  '--sidebar-bg': '#ffffff',
  '--titlebar-bg': '#ffffff',
  '--titlebar-icon-color': '#666666',
  '--titlebar-icon-hover': '#000000'
}

const SUPPORTED_THEMES = {
  dark: DARK_THEME,
  light: LIGHT_THEME
}

let latestSettings = null
let systemMediaQuery = null
let systemListener = null

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max)
}

function componentToHex(component) {
  const hex = component.toString(16)
  return hex.length === 1 ? `0${hex}` : hex
}

function normalizeHex(hex) {
  if (!hex) return null
  let value = hex.trim()
  if (!value) return null
  if (value[0] !== '#') {
    value = `#${value}`
  }
  if (value.length === 4) {
    const r = value[1]
    const g = value[2]
    const b = value[3]
    value = `#${r}${r}${g}${g}${b}${b}`
  }
  if (value.length !== 7) {
    return null
  }
  return value.toLowerCase()
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const int = parseInt(normalized.slice(1), 16)
  if (Number.isNaN(int)) return null
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return { r, g, b }
}

function hexToRgbString(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

function mixChannel(start, end, weight) {
  return Math.round(start + (end - start) * weight)
}

function mix(hexA, hexB, weight) {
  const rgbA = hexToRgb(hexA)
  const rgbB = hexToRgb(hexB)
  if (!rgbA || !rgbB) return hexA
  const w = clamp(weight, 0, 1)
  const r = mixChannel(rgbA.r, rgbB.r, w)
  const g = mixChannel(rgbA.g, rgbB.g, w)
  const b = mixChannel(rgbA.b, rgbB.b, w)
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`
}

function lighten(hex, amount) {
  return mix(hex, '#ffffff', amount)
}

function darken(hex, amount) {
  return mix(hex, '#000000', amount)
}

function getLuminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const sr = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const sg = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const sb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb
}

function buildCustomPalette(settings) {
  const customTheme = settings?.customTheme || {}
  const primary = normalizeHex(customTheme.primary) || DARK_THEME['--color-primary']
  const hover = normalizeHex(customTheme.hover) || lighten(primary, 0.2)
  const background = normalizeHex(customTheme.background) || DARK_THEME['--color-background']

  const base = getLuminance(background) > 0.55 ? LIGHT_THEME : DARK_THEME
  const palette = { ...base }

  palette['--color-primary'] = primary
  palette['--color-primary-hover'] = hover
  palette['--color-primary-active'] = darken(primary, 0.25)
  const primaryRgb = hexToRgbString(primary) || palette['--color-primary-rgb']
  palette['--color-primary-rgb'] = primaryRgb
  const alpha = base === LIGHT_THEME ? 0.12 : 0.18
  palette['--color-primary-light'] = primaryRgb ? `rgba(${primaryRgb}, ${alpha})` : palette['--color-primary-light']

  palette['--color-background'] = background
  if (base === LIGHT_THEME) {
    palette['--color-background-light'] = darken(background, 0.05)
    palette['--color-background-lighter'] = darken(background, 0.1)
    palette['--color-border'] = darken(background, 0.2)
    palette['--color-border-light'] = darken(background, 0.1)
    palette['--color-text'] = '#1f1f1f'
    palette['--color-text-secondary'] = '#333333'
    palette['--color-text-tertiary'] = '#4f4f4f'
    palette['--titlebar-icon-color'] = '#666666'
    palette['--titlebar-icon-hover'] = '#000000'
  } else {
    palette['--color-background-light'] = lighten(background, 0.08)
    palette['--color-background-lighter'] = lighten(background, 0.16)
    palette['--color-border'] = lighten(background, 0.28)
    palette['--color-border-light'] = lighten(background, 0.35)
    palette['--color-text'] = '#ffffff'
    palette['--color-text-secondary'] = '#c8c8c8'
    palette['--color-text-tertiary'] = '#989898'
    palette['--titlebar-icon-color'] = '#bbbbbb'
    palette['--titlebar-icon-hover'] = '#ffffff'
  }

  palette['--sidebar-bg'] = background
  palette['--titlebar-bg'] = background

  return palette
}

function applyPalette(palette) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

function handleSystemChange(event) {
  if (!latestSettings) return
  const palette = event.matches ? SUPPORTED_THEMES.dark : SUPPORTED_THEMES.light
  applyPalette(palette)
}

function ensureSystemListener() {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  if (!systemMediaQuery) {
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  }
  if (!systemListener) {
    systemListener = handleSystemChange
    systemMediaQuery.addEventListener('change', systemListener)
  }
  return systemMediaQuery
}

function removeSystemListener() {
  if (systemMediaQuery && systemListener) {
    systemMediaQuery.removeEventListener('change', systemListener)
  }
  systemMediaQuery = null
  systemListener = null
}

function applyTheme(settings) {
  latestSettings = settings || {}
  const themeChoice = latestSettings?.custom?.theme || 'dark'

  if (themeChoice === 'system') {
    const media = ensureSystemListener()
    const palette = media && media.matches ? SUPPORTED_THEMES.dark : SUPPORTED_THEMES.light
    applyPalette(palette)
    return
  }

  removeSystemListener()

  if (themeChoice === 'custom') {
    const palette = buildCustomPalette(latestSettings.custom)
    applyPalette(palette)
    return
  }

  const palette = SUPPORTED_THEMES[themeChoice] || SUPPORTED_THEMES.dark
  applyPalette(palette)
}

function getThemeSnapshot(theme = 'dark') {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }
  if (theme === 'custom') {
    const background = latestSettings?.custom?.customTheme?.background
    if (background) {
      return getLuminance(background) > 0.55 ? 'light' : 'dark'
    }
    return 'dark'
  }
  return theme
}

export {
  applyTheme,
  getThemeSnapshot,
  SUPPORTED_THEMES
}
