export type SheetDefinition = {
  name: string
  rows: Array<Record<string, unknown>>
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function columnName(index: number) {
  let dividend = index + 1
  let name = ''
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    name = String.fromCharCode(65 + modulo) + name
    dividend = Math.floor((dividend - modulo) / 26)
  }
  return name
}

function worksheetXml(rows: Array<Record<string, unknown>>) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : ['Dữ liệu']
  const body = [headers.reduce<Record<string, unknown>>((row, header) => ({ ...row, [header]: header }), {}), ...rows]

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body.map((row, rowIndex) => (
    `<row r="${rowIndex + 1}">${headers.map((header, columnIndex) => (
      `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(row[header])}</t></is></c>`
    )).join('')}</row>`
  )).join('')}</sheetData></worksheet>`
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
  }
  return crc >>> 0
})

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff])
}

function writeUint32(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  parts.forEach((part) => {
    output.set(part, offset)
    offset += part.length
  })
  return output
}

function createZip(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach((file) => {
    const name = encoder.encode(file.path)
    const content = encoder.encode(file.content)
    const crc = crc32(content)
    const localHeader = concatBytes([
      writeUint32(0x04034b50), writeUint16(20), writeUint16(0), writeUint16(0), writeUint16(0), writeUint16(0),
      writeUint32(crc), writeUint32(content.length), writeUint32(content.length), writeUint16(name.length), writeUint16(0), name,
    ])
    localParts.push(localHeader, content)
    centralParts.push(concatBytes([
      writeUint32(0x02014b50), writeUint16(20), writeUint16(20), writeUint16(0), writeUint16(0), writeUint16(0), writeUint16(0),
      writeUint32(crc), writeUint32(content.length), writeUint32(content.length), writeUint16(name.length), writeUint16(0), writeUint16(0),
      writeUint16(0), writeUint16(0), writeUint32(0), writeUint32(offset), name,
    ]))
    offset += localHeader.length + content.length
  })

  const central = concatBytes(centralParts)
  const end = concatBytes([
    writeUint32(0x06054b50), writeUint16(0), writeUint16(0), writeUint16(files.length), writeUint16(files.length),
    writeUint32(central.length), writeUint32(offset), writeUint16(0),
  ])
  return concatBytes([...localParts, central, end])
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadXlsx(filename: string, sheets: SheetDefinition[]) {
  const safeSheets = sheets.map((sheet, index) => ({
    ...sheet,
    name: sheet.name.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || `Sheet ${index + 1}`,
  }))
  const workbookSheets = safeSheets.map((sheet, index) => (
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  )).join('')
  const workbookRels = safeSheets.map((_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('')
  const worksheetOverrides = safeSheets.map((_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('')

  const files = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${worksheetOverrides}</Types>`,
    },
    {
      path: '_rels/.rels',
      content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`,
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}</Relationships>`,
    },
    ...safeSheets.map((sheet, index) => ({ path: `xl/worksheets/sheet${index + 1}.xml`, content: worksheetXml(sheet.rows) })),
  ]

  downloadBlob(filename, new Blob([createZip(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
}
