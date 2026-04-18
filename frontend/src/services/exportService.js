import * as XLSX from 'xlsx'

const PLATFORMS = {
  adobe_stock: {
    id: 'adobe_stock',
    name: 'Adobe Stock',
    headers: ['Filename', 'Title', 'Description', 'Category 1', 'Category 2', 'Keywords', 'Content Type'],
    mapRow: (gen) => ({
      'Filename': gen.inputFilename || '',
      'Title': (gen.title || '').substring(0, 200),
      'Description': (gen.description || '').substring(0, 200),
      'Category 1': (gen.categories || [])[0] || '',
      'Category 2': (gen.categories || [])[1] || '',
      'Keywords': (gen.keywords || []).slice(0, 50).join(', '),
      'Content Type': mapContentType(gen.imageType),
    }),
  },
  shutterstock: {
    id: 'shutterstock',
    name: 'Shutterstock',
    headers: ['Filename', 'Description', 'Keywords', 'Category', 'Editorial', 'Model Release', 'Property Release'],
    mapRow: (gen) => ({
      'Filename': gen.inputFilename || '',
      'Description': (gen.description || gen.title || '').substring(0, 200),
      'Keywords': (gen.keywords || []).slice(0, 50).join(', '),
      'Category': (gen.categories || [])[0] || '',
      'Editorial': gen.commercialViability === 'editorial' ? 'Yes' : 'No',
      'Model Release': '',
      'Property Release': '',
    }),
  },
  freepik: {
    id: 'freepik',
    name: 'Freepik',
    headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category'],
    mapRow: (gen) => ({
      'Filename': gen.inputFilename || '',
      'Title': gen.title || '',
      'Description': gen.description || '',
      'Keywords': (gen.keywords || []).join(', '),
      'Category': (gen.categories || [])[0] || '',
    }),
  },
  vecteezy: {
    id: 'vecteezy',
    name: 'Vecteezy',
    headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category'],
    mapRow: (gen) => ({
      'Filename': gen.inputFilename || '',
      'Title': gen.title || '',
      'Description': gen.description || '',
      'Keywords': (gen.keywords || []).join(', '),
      'Category': (gen.categories || [])[0] || '',
    }),
  },
  miricanva: {
    id: 'miricanva',
    name: 'Miricanva',
    headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Orientation', 'People Count', 'Content Type'],
    mapRow: (gen) => ({
      'Filename': gen.inputFilename || '',
      'Title': gen.title || '',
      'Description': gen.description || '',
      'Keywords': (gen.keywords || []).join(', '),
      'Category': (gen.categories || [])[0] || '',
      'Orientation': gen.orientation || '',
      'People Count': gen.peopleCount ?? '',
      'Content Type': mapContentType(gen.imageType),
    }),
  },
}

function mapContentType(imageType) {
  if (!imageType) return 'Photo'
  const t = imageType.toLowerCase()
  if (t.includes('illustration') || t.includes('vector')) return 'Illustration'
  return 'Photo'
}

function escapeCsvField(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function buildCsvRows(generations, platform) {
  const config = PLATFORMS[platform]
  if (!config) throw new Error(`Unknown platform: ${platform}`)

  const rows = []
  rows.push(config.headers.map(escapeCsvField).join(','))

  for (const gen of generations) {
    const mapped = config.mapRow(gen)
    const row = config.headers.map(h => escapeCsvField(mapped[h]))
    rows.push(row.join(','))
  }

  return rows.join('\r\n')
}

function buildWorkbook(generations, platform) {
  const config = PLATFORMS[platform]
  if (!config) throw new Error(`Unknown platform: ${platform}`)

  const data = []
  data.push(config.headers)

  for (const gen of generations) {
    const mapped = config.mapRow(gen)
    const row = config.headers.map(h => mapped[h] ?? '')
    data.push(row)
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)

  const colWidths = config.headers.map(h => ({ wch: Math.max(h.length + 2, 20) }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, config.name)
  return wb
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getPlatforms() {
  return Object.values(PLATFORMS).map(p => ({ id: p.id, name: p.name }))
}

export function exportCsv(generations, platform, filename) {
  const csvContent = buildCsvRows(generations, platform)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const fname = filename || `${platform}_metadata_${Date.now()}.csv`
  downloadBlob(blob, fname)
}

export function exportExcel(generations, platform, filename) {
  const wb = buildWorkbook(generations, platform)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fname = filename || `${platform}_metadata_${Date.now()}.xlsx`
  downloadBlob(blob, fname)
}

export function exportGenerations(generations, platform, format = 'csv') {
  if (!generations || generations.length === 0) return

  const platformName = PLATFORMS[platform]?.name || platform
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `${platformName}_${generations.length}_images_${timestamp}`

  if (format === 'xlsx') {
    exportExcel(generations, platform, `${filename}.xlsx`)
  } else {
    exportCsv(generations, platform, `${filename}.csv`)
  }
}
