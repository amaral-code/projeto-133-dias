// Scanner de rótulo via câmera — iPhone 14 otimizado.
// Fluxo: foto (input capture=environment abre a câmera direto no iOS) →
// 1) BarcodeDetector (nativo, quando existe) p/ código de barras →
// 2) OCR Tesseract (por, lazy-load p/ não pesar o bundle) → parseLabelText.
// Retorna via onResult({ barcode, porcaoG, kcal, prot, carb, fat, fibra, rawText }).
// Sem permissão complicada: file input funciona em HTTP e no PWA.

import { useRef, useState } from 'react'
import { parseLabelText, labelConfidence } from '../lib/labelOcr'

async function detectBarcodeFromImage(imgEl) {
  try {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null
    const Detector = window.BarcodeDetector
    const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf']
    let det
    try {
      det = new Detector({ formats })
    } catch {
      det = new Detector()
    }
    const codes = await det.detect(imgEl)
    const raw = codes?.[0]?.rawValue ?? ''
    const digits = String(raw).replace(/\D/g, '')
    return digits.length >= 8 ? digits : null
  } catch {
    return null
  }
}

async function ocrImage(file, onProgress) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('por', undefined, {
    logger: (m) => {
      if (m?.status === 'recognizing text' && typeof m.progress === 'number') onProgress?.(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(file)
    return data?.text ?? ''
  } finally {
    try { await worker.terminate() } catch { /* noop */ }
  }
}

export default function LabelScanner({ onResult, onBarcode }) {
  const [status, setStatus] = useState('idle') // idle|reading|done|error
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [barcode, setBarcode] = useState(null)
  const [error, setError] = useState(null)
  const imgRef = useRef(null)
  const runId = useRef(0)

  const handleFile = async (file) => {
    if (!file) return
    const myRun = ++runId.current
    setStatus('reading'); setProgress(0); setError(null); setParsed(null); setBarcode(null)
    const url = URL.createObjectURL(file)
    setPreview((prev) => { if (prev) try { URL.revokeObjectURL(prev) } catch { /* noop */ } return url })
    try {
      // 1) tenta barcode na imagem (rápido, sem rede)
      await new Promise((resolve) => {
        const img = new Image()
        img.onload = async () => {
          const code = await detectBarcodeFromImage(img)
          if (runId.current !== myRun) return resolve()
          if (code) {
            setBarcode(code)
            onBarcode?.(code)
          }
          resolve()
        }
        img.onerror = () => resolve()
        img.src = url
      })
      // 2) OCR do rótulo
      const text = await ocrImage(file, (v) => { if (runId.current === myRun) setProgress(v) })
      if (runId.current !== myRun) return
      const p = parseLabelText(text)
      if (labelConfidence(p) === 0) {
        setError('Não consegui ler os valores — tente de frente, com luz, só na tabela nutricional.')
        setStatus('error')
        return
      }
      setParsed({ ...p, rawText: text })
      setStatus('done')
    } catch {
      setError('Falha ao processar a foto. Tente de novo com mais luz.')
      setStatus('error')
    }
  }

  return (
    <div className="rounded-[10px] bg-secondary/60 p-2.5">
      <p className="text-[11px] font-bold text-muted-foreground">📷 Escanear rótulo com a câmera</p>
      <div className="flex gap-2 mt-1.5">
        <label className="flex-1 min-h-[52px] rounded-[10px] bg-primary text-primary-foreground font-bold flex items-center justify-center cursor-pointer active:scale-95 text-[13px]">
          Tirar foto
          <input
            type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        <label className="flex-1 min-h-[52px] rounded-[10px] bg-background font-semibold flex items-center justify-center cursor-pointer active:scale-95 text-[13px]">
          Galeria
          <input
            type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {preview && (
        <img ref={imgRef} src={preview} alt="Foto do rótulo" className="mt-2 w-full max-h-48 object-contain rounded-[10px] bg-background" />
      )}
      {status === 'reading' && (
        <div className="mt-2">
          <p className="text-[12px] font-semibold tabular-nums">Lendo rótulo… {Math.round(progress * 100)}%</p>
          <div className="h-[5px] mt-1 rounded-full bg-background overflow-hidden">
            <span className="block h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {barcode && (
        <p className="mt-2 text-[12px] font-semibold tabular-nums">Código: {barcode} {onBarcode ? '(busquei no banco)' : ''}</p>
      )}
      {parsed && (
        <div className="mt-2 rounded-[10px] bg-accent p-2.5">
          <p className="text-[12px] font-bold tabular-nums">
            Porção {parsed.porcaoG ?? '?'}g · {parsed.kcal ?? '?'} kcal · P{parsed.prot ?? '?'} C{parsed.carb ?? '?'} G{parsed.fat ?? '?'}
            {parsed.fibra != null ? ` · Fibra ${parsed.fibra}g` : ''}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Confira com a embalagem — OCR pode trocar 6/8.</p>
          <button
            type="button"
            onClick={() => onResult?.({ barcode, ...parsed })}
            className="mt-2 w-full min-h-[52px] rounded-[10px] bg-primary text-primary-foreground font-bold active:scale-95"
          >
            ✓ Usar estes valores no rótulo
          </button>
        </div>
      )}
      {(status === 'error' || error) && (
        <p className="mt-2 text-[11px] text-red-400 font-semibold">{error}</p>
      )}
    </div>
  )
}
