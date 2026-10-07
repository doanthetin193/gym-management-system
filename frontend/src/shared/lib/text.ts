export function fixVietnameseMojibake(value: string | null | undefined) {
  if (!value) {
    return value ?? ''
  }

  let current = value
  for (let pass = 0; pass < 3 && /[ÃÄÂ]/.test(current); pass += 1) {
    try {
      const bytes = Uint8Array.from(Array.from(current, (char) => char.charCodeAt(0) & 0xff))
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      if (decoded.includes('\uFFFD') || decoded === current) {
        break
      }
      current = decoded
    } catch {
      break
    }
  }
  return current
}
