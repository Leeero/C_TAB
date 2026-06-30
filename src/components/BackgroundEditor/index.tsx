/*
 * 背景图编辑器：裁剪 + 透明度
 */
import React, { useRef, useState, useEffect, useCallback } from "react"
import { Modal, Slider, Button, Space } from "antd"
import "./index.css"

interface BackgroundEditorProps {
  open: boolean
  imageUrl: string
  opacity: number
  onSave: (dataUrl: string, opacity: number) => void
  onCancel: () => void
}

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

const MIN_CROP = 40

const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  open,
  imageUrl,
  opacity: initOpacity,
  onSave,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // 图片原始尺寸 & 容器内显示尺寸
  const [imgSize, setImgSize] = useState({ ow: 0, oh: 0, dw: 0, dh: 0, ox: 0, oy: 0 })
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [opacity, setOpacity] = useState(initOpacity)
  const [dragging, setDragging] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null)
  const dragStart = useRef({ mx: 0, my: 0, crop: crop })

  // 图片加载后计算显示尺寸
  const onImgLoad = useCallback(() => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    const ow = img.naturalWidth
    const oh = img.naturalHeight
    const cw = container.clientWidth
    const ch = container.clientHeight

    const scale = Math.min(cw / ow, ch / oh, 1)
    const dw = ow * scale
    const dh = oh * scale
    const ox = (cw - dw) / 2
    const oy = (ch - dh) / 2

    setImgSize({ ow, oh, dw, dh, ox, oy })

    // 默认裁剪框：图片中心 80% 区域
    const px = 0.1
    setCrop({
      x: ox + dw * px,
      y: oy + dh * px,
      w: dw * (1 - 2 * px),
      h: dh * (1 - 2 * px),
    })
  }, [])

  // 重置状态
  useEffect(() => {
    if (open) {
      setOpacity(initOpacity)
      setDragging(null)
    }
  }, [open, initOpacity])

  // ── 拖拽逻辑 ──────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent, handle: typeof dragging) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
    dragStart.current = { mx: e.clientX, my: e.clientY, crop: { ...crop } }
  }

  useEffect(() => {
    if (!dragging) return

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      const sc = dragStart.current.crop
      const { ox, oy, dw, dh } = imgSize

      if (dragging === "move") {
        const nx = Math.max(ox, Math.min(ox + dw - sc.w, sc.x + dx))
        const ny = Math.max(oy, Math.min(oy + dh - sc.h, sc.y + dy))
        setCrop({ ...sc, x: nx, y: ny })
        return
      }

      // 缩放角点
      let { x, y, w, h } = sc
      if (dragging === "se") {
        w = Math.max(MIN_CROP, Math.min(ox + dw - x, sc.w + dx))
        h = Math.max(MIN_CROP, Math.min(oy + dh - y, sc.h + dy))
      } else if (dragging === "nw") {
        const maxW = sc.x + sc.w - ox
        const maxH = sc.y + sc.h - oy
        const nw = Math.max(MIN_CROP, Math.min(maxW, sc.w - dx))
        const nh = Math.max(MIN_CROP, Math.min(maxH, sc.h - dy))
        x = sc.x + sc.w - nw
        y = sc.y + sc.h - nh
        w = nw; h = nh
      } else if (dragging === "ne") {
        const maxW = ox + dw - sc.x
        const maxH = sc.y + sc.h - oy
        const nw = Math.max(MIN_CROP, Math.min(maxW, sc.w + dx))
        const nh = Math.max(MIN_CROP, Math.min(maxH, sc.h - dy))
        y = sc.y + sc.h - nh
        w = nw; h = nh
      } else if (dragging === "sw") {
        const maxW = sc.x + sc.w - ox
        const maxH = oy + dh - sc.y
        const nw = Math.max(MIN_CROP, Math.min(maxW, sc.w - dx))
        const nh = Math.max(MIN_CROP, Math.min(maxH, sc.h + dy))
        x = sc.x + sc.w - nw
        w = nw; h = nh
      }
      setCrop({ x, y, w, h })
    }

    const onMouseUp = () => setDragging(null)

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging, imgSize, crop])

  // ── 裁剪并保存 ──────────────────────────────────
  const handleSave = () => {
    const { ow, oh, dw, dh, ox, oy } = imgSize
    if (dw === 0) return

    const img = imgRef.current
    if (!img) return

    // 将显示坐标转换为原始图片坐标
    const scaleX = ow / dw
    const scaleY = oh / dh
    const rx = (crop.x - ox) * scaleX
    const ry = (crop.y - oy) * scaleY
    const rw = crop.w * scaleX
    const rh = crop.h * scaleY

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(rw)
    canvas.height = Math.round(rh)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh)

    const result = canvas.toDataURL("image/jpeg", 0.85)
    onSave(result, opacity)
  }

  return (
    <Modal
      open={open}
      title="编辑背景图"
      width={720}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSave}>确定</Button>
        </Space>
      }
      onCancel={onCancel}
      destroyOnClose
    >
      <div className="bg-editor">
        {/* 裁剪预览区 */}
        <div className="bg-editor-crop" ref={containerRef}>
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={onImgLoad}
            className="bg-editor-img"
            draggable={false}
            style={{ opacity: opacity / 100 }}
          />
          {imgSize.dw > 0 && (
            <>
              {/* 遮罩层：裁剪框外半透明 */}
              <div className="bg-editor-mask">
                {/* 上 */}
                <div
                  className="bg-editor-shade"
                  style={{ top: 0, left: 0, right: 0, height: crop.y }}
                />
                {/* 下 */}
                <div
                  className="bg-editor-shade"
                  style={{ top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }}
                />
                {/* 左 */}
                <div
                  className="bg-editor-shade"
                  style={{ top: crop.y, left: 0, width: crop.x, height: crop.h }}
                />
                {/* 右 */}
                <div
                  className="bg-editor-shade"
                  style={{ top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }}
                />
              </div>
              {/* 裁剪框 */}
              <div
                className="bg-editor-cropbox"
                style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                onMouseDown={(e) => onMouseDown(e, "move")}
              >
                {/* 三分线 */}
                <div className="bg-editor-grid">
                  <div className="bg-editor-grid-v" style={{ left: "33.33%" }} />
                  <div className="bg-editor-grid-v" style={{ left: "66.66%" }} />
                  <div className="bg-editor-grid-h" style={{ top: "33.33%" }} />
                  <div className="bg-editor-grid-h" style={{ top: "66.66%" }} />
                </div>
                {/* 四角拖拽手柄 */}
                <div className="crop-handle nw" onMouseDown={(e) => onMouseDown(e, "nw")} />
                <div className="crop-handle ne" onMouseDown={(e) => onMouseDown(e, "ne")} />
                <div className="crop-handle sw" onMouseDown={(e) => onMouseDown(e, "sw")} />
                <div className="crop-handle se" onMouseDown={(e) => onMouseDown(e, "se")} />
              </div>
            </>
          )}
        </div>

        {/* 透明度滑块 */}
        <div className="bg-editor-controls">
          <span className="bg-editor-label">透明度</span>
          <Slider
            min={0}
            max={100}
            value={opacity}
            onChange={setOpacity}
            tooltip={{ formatter: (v) => `${v}%` }}
            style={{ flex: 1 }}
          />
          <span className="bg-editor-value">{opacity}%</span>
        </div>
      </div>
    </Modal>
  )
}

export default BackgroundEditor
