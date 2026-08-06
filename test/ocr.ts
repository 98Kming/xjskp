import { ocrRegion } from "../src/utils/img"

let img = images.captureScreen()
let ocrResult = ocrRegion(img, 0, 0, img.getWidth(), img.getHeight())
log(ocrResult)
log(gmlkit.ocr(img, 'zh'))