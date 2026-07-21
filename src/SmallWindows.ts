import { FloatWindow } from "../component/FloatWindow";
import { mainWindow, MainWindow } from "./MainWindow";

export class SmallWindow extends FloatWindow<{ btn: View & JsButton }> {
  constructor(private mainWindow: Internal.UI | MainWindow) {
    super('layoutFile:../layout/small.xml', false);
    this.window.setPosition(device.width - 150, 20)
    let _this = this
    this.window.btn.setOnClickListener(new android.view.View.OnClickListener({
      onClick(param0) {
        if (_this.window.btn.text() === '主界面') {
          _this.hide()
        } else if (_this.window.btn.text().includes('停止')) {
          _this.close()
        }

      },
    }))
    this.draggable()
  }

  close() {
    threads.shutDownAll()
    ui.run(() => {
      this.window.btn.setText('主界面')
      this.mView.setVisibility(0)
    })
  }

  show(text: string) {
    ui.run(() => {
      this.window.btn.setText(text)
      this.mView.setVisibility(0)
      this.mainWindow instanceof MainWindow ? (this.mainWindow as MainWindow).hide() : void 0
    })
  }

  hide() {
    ui.run(() => {
      this.mView.setVisibility(8)
      this.mainWindow instanceof MainWindow ? (this.mainWindow as MainWindow).show() : launch(context.getPackageName())
    })
  }
}

export const smallWindow = new SmallWindow(mainWindow)