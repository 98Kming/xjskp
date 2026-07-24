import { PrefNumInput } from "./PrefNumInput";
import { AbstractConfigurableView } from "./AbstractConfigurableView";
export type PrefNumSeekBarView = {
  text: JsTextView,
  seekbar: JsSeekBar,
  input: JsEditText & ConfigurableView<PrefNumInput>
}
export class PrefNumSeekBar extends AbstractConfigurableView<PrefNumSeekBar, PrefNumSeekBarView> {
  // 用于记录原始进度，方便在用户修改后进行比较
  originalProgress: number = 0;
  step: number = 1;
  modify: boolean = false; // 标记是否正在修改，避免循环调用
  protected keySuffix: string = "_num_seekbar"
  constructor() {
    super();
    this.defineAttr("text",
      (view, _, value) => {
        view.text.setText(value)
      })
    this.defineAttr("min",
      (view, _, value) => {
        this.view.seekbar.setMin(value)
        this.view.input.widget.setMin(value)
      })
    this.defineAttr("max",
      (view, _, value) => {
        this.view.seekbar.setMax(value)
        this.view.input.widget.setMax(value)
      })
    this.defineAttr("progress",
      (view, _, value) => {
        this.originalProgress = value
      })
    this.defineAttr("step",
      (view, _, value) => {
        this.step = value
      })
  }

  onViewCreated(view: View) {
    this.setPraentView(view)
  }

  _onFinishInflation(view: PrefNumSeekBarView): void {
    this.clearPraentView()
    let _this = this
    view.seekbar.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
      onProgressChanged: (seekbar: JsSeekBar, progress: number) => {
        let corrected = Math.round(progress / this.step) * this.step
        if (corrected !== progress) {
          seekbar.setProgress(corrected)
          return
        }
        if (!_this.modify) {
          view.input.setText(progress + "")
        }
        _this.setStorageValue(progress)
      },
      onStartTrackingTouch: (seekbar: JsSeekBar) => { },
      onStopTrackingTouch: (seekbar: JsSeekBar) => { },
    }));
    view.input.addTextChangedListener(new android.text.TextWatcher({
      beforeTextChanged: function (s: string, start: number, count: number, after: number): void { },
      onTextChanged: function (s: string, start: number, before: number, count: number): void { },
      afterTextChanged: function (editable: android.text.Editable): void {
        if (!editable || !editable.toString()) {
          return
        }
        _this.modify = true
        let value: string = editable.toString()
        let progress: number = parseInt(value)
        if (!isNaN(progress)) {
          view.seekbar.setProgress(progress)
        }
        _this.modify = false
      },
    }))
  }

  loadPrefValue(): void {
    let progress = this.getStorageValue()
    if(progress == null) {
      progress = this.originalProgress
    }
    this.view.seekbar.setProgress(progress)
    this.view.input.widget.setKey(this.getKey())
    this.view.input.widget.loadPrefValue()
  }
  render(): string {
    return `<horizontal>
        <text layout_weight="1" w="50" id="text"/>
        <seekbar layout_weight="8" h="*" id="seekbar" indeterminate="false"/>
        <pref-num-input layout_weight="1" w="30" id="input"/>
      </horizontal>`;
  }

  getProgress(): number {
    return this.view.seekbar.getProgress()
  }

  reset() {
    this.view.seekbar.setProgress(this.originalProgress)
  }
}