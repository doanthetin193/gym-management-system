const TOKEN_KEY = 'gym_duong_double.access_token'
const REMEMBERED_EMAIL_KEY = 'gym_duong_double.remembered_email'
const REMEMBER_ME_FLAG_KEY = 'gym_duong_double.remember_me'

export function readAccessToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY)
}

export function saveAccessToken(token: string, remember: boolean = true) {
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token)
    window.sessionStorage.removeItem(TOKEN_KEY)
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token)
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
}

export function readRememberMePreference(): boolean {
  return window.localStorage.getItem(REMEMBER_ME_FLAG_KEY) !== 'false'
}

export function saveRememberMePreference(remember: boolean) {
  window.localStorage.setItem(REMEMBER_ME_FLAG_KEY, remember ? 'true' : 'false')
}

export function readRememberedEmail(): string | null {
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY)
}

export function saveRememberedEmail(email: string, remember: boolean) {
  if (remember && email.trim()) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
  } else {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  }
}
