type View = typeof android.view.View & android.view.ViewProtoerty & {
  getWidth(): number
  getHeight(): number
}
/** AutoXJS Google ML Kit OCR（运行时可选） */
declare var gmlkit: { ocr: (img: any, lang: string) => { text: string } }
/** AutoXJS Google ML Kit OCR（部分 fork 缩写名） */
declare var gml: { ocr: (img: any, region: number[]) => string[] }