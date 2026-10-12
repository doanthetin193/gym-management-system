type DatePartsSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  minIso?: string
  maxIso?: string
  required?: boolean
  allowEmpty?: boolean
  helperText?: string
  yearBack?: number
  yearForward?: number
  wrapperClassName?: string
  labelClassName?: string
  selectClassName?: string
}

const defaultSelectClassName =
  'h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold outline-none transition focus:border-amber-500'

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function parseIso(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return { year, month, day }
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function toIso(year: number, month: number, day: number) {
  const safeDay = Math.min(day, daysInMonth(year, month))
  return `${year}-${pad(month)}-${pad(safeDay)}`
}

function clampIso(value: string, minIso?: string, maxIso?: string) {
  if (minIso && value < minIso) {
    return minIso
  }
  if (maxIso && value > maxIso) {
    return maxIso
  }
  return value
}

export function DatePartsSelect({
  label,
  value,
  onChange,
  minIso,
  maxIso,
  required,
  allowEmpty,
  helperText,
  yearBack = 10,
  yearForward = 1,
  wrapperClassName = 'block',
  labelClassName = 'text-xs font-bold text-[var(--text-strong)]',
  selectClassName = defaultSelectClassName,
}: DatePartsSelectProps) {
  const today = new Date()
  const fallback = parseIso(maxIso ?? minIso ?? '') ?? {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  }
  const parts = parseIso(value) ?? fallback
  const currentYear = today.getFullYear()
  const years = Array.from(
    { length: yearBack + yearForward + 1 },
    (_, index) => currentYear + yearForward - index,
  )
  const days = Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, index) => index + 1)
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  function update(next: Partial<typeof parts>) {
    const nextParts = { ...parts, ...next }
    onChange(clampIso(toIso(nextParts.year, nextParts.month, nextParts.day), minIso, maxIso))
  }

  return (
    <label className={wrapperClassName}>
      <span className={labelClassName}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <select
          value={value ? parts.day : ''}
          onChange={(event) => {
            if (!event.target.value && allowEmpty) {
              onChange('')
              return
            }
            update({ day: Number(event.target.value) })
          }}
          className={selectClassName}
          required={required}
        >
          {allowEmpty ? <option value="">Ngày</option> : null}
          {days.map((day) => (
            <option key={day} value={day}>
              {pad(day)}
            </option>
          ))}
        </select>
        <select
          value={value ? parts.month : ''}
          onChange={(event) => {
            if (!event.target.value && allowEmpty) {
              onChange('')
              return
            }
            update({ month: Number(event.target.value) })
          }}
          className={selectClassName}
          required={required}
        >
          {allowEmpty ? <option value="">Tháng</option> : null}
          {months.map((month) => (
            <option key={month} value={month}>
              Tháng {month}
            </option>
          ))}
        </select>
        <select
          value={value ? parts.year : ''}
          onChange={(event) => {
            if (!event.target.value && allowEmpty) {
              onChange('')
              return
            }
            update({ year: Number(event.target.value) })
          }}
          className={selectClassName}
          required={required}
        >
          {allowEmpty ? <option value="">Năm</option> : null}
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {helperText ? <p className="mt-1 text-[11px] font-semibold text-[var(--text-muted)]">{helperText}</p> : null}
    </label>
  )
}
