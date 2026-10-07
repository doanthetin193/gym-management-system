export function normalizePhoneForZalo(phone: string | null | undefined) {
  return (phone ?? '').replace(/\D/g, '')
}

export function buildZaloUrl(phone: string | null | undefined) {
  const normalizedPhone = normalizePhoneForZalo(phone)
  return normalizedPhone ? `https://zalo.me/${normalizedPhone}` : null
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
