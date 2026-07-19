import { AbstractConfigurableView } from "./AbstractConfigurableView";

export class PrefNumInput extends AbstractConfigurableView<PrefNumInput, JsEditText & ConfigurableView<PrefNumInput>> {
  protected min?: number;
  protected max?: number
  protected keySuffix: string = "_input"
  private modify = false
  constructor() {
    super();
    this.defineAttr("min",
      (_, __, value) => {
        this.setMin(value)
      },
    )
    this.defineAttr("max",
      (_, __, value) => {
        this.setMax(value)
      },
    )
  }

  render(): string {
    return '<input inputType="number" />';
  }

  
_onFinishInflation(view: JsEditText & android.view.ViewProtoerty): void {
  let _this = this
    view.addTextChangedListener(
      new android.text.TextWatcher({
        beforeTextChanged: (s, start, count, after) => { },
        onTextChanged: (s, start, before, count) => { },
        afterTextChanged: (editable: android.text.Editable) => {
          if (_this.modify || !editable.toString()) {
            return
          }
          _this.modify = true
          let value = editable.toString()
          let intVal = parseInt(value)
          editable.replace(0, value.length, intVal + "")
          intVal = parseInt(editable.toString())
          this.setStorageValue(intVal)
          _this.modify = false
        }
      })
    )

    view.setFilters([new android.text.InputFilter({
      filter(source: string, start: number, end: number, dest: any, dstart: number, dend: number) {
        if (/^\d*$/.test(source)) {
          return source
        }
        return ""
      }
    })]);
    view.setOnFocusChangeListener(new android.view.View.OnFocusChangeListener({
      onFocusChange(_: typeof android.view.View, hasFocus: boolean) {
        if (!hasFocus) {
          let currentText = view.getText().toString()
          if (currentText == "") {
            if (_this.min) view.setText(_this.min + "")
          } else {
            let val = parseInt(currentText)
            if (_this.min && val < _this.min) {
              view.setText(_this.min + "")
            } else if (_this.max && val > _this.max) {
              view.setText(_this.max + "")
            }
          }
        }
      }
    }))
}
  loadPrefValue(): void {
    let editText = this.view as unknown as JsEditText
    let value = this.getStorageValue()
    value != null && editText.setText(value + "")
  }

  setMin(min: number) {
    this.min = min
  }

  setMax(max: number) {
    this.max = max
  }
}