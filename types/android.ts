type View = typeof android.view.View & android.view.ViewProtoerty & {
  getWidth(): number
  getHeight(): number
}
/**
 * OCR 结果节点接口
 */
interface OcrResult {
    level: number;
    confidence: number;
    text: string;
    language: string | null;
    bounds: Rect | null;
    children: OcrResult[] | null;
}

/**
 * 矩形边界接口
 */
interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
/** AutoXJS Google ML Kit OCR（运行时可选） */
declare var gmlkit: { ocr: (img: any, lang: string) => OcrResult }
/** AutoXJS Google ML Kit OCR（部分 fork 缩写名） */
declare var gml: { ocr: (img: any, region: number[]) => string[] }