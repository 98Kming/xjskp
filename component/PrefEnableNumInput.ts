import { PrefNumInput } from "./PrefNumInput";
import { PrefSwitch } from "./PrefSwitch";
import { AbstractConfigurableView } from "./AbstractConfigurableView"
export type PrefEnableNumInputView = {
  input: JsEditText & ConfigurableView<PrefNumInput>
  switch: JsSwitch & ConfigurableView<PrefSwitch>
}
export class PrefEnableNumInput extends AbstractConfigurableView<PrefEnableNumInput,PrefEnableNumInputView> {

  onViewCreated(view: View) {
    this.setPraentView(view)
  }
  
  _onFinishInflation(view: PrefEnableNumInputView): void {
    this.clearPraentView()
  }

  constructor() { 
    super();
    this.defineAttr("text",
      (view, _, value) => {
        this.view.switch.setText(value)
      })
    this.defineAttr("min",
      (view, _, value) => {
        this.view.input.widget.setMin(value)
      })
    this.defineAttr("max",
      (view, _, value) => {
        this.view.input.widget.setMax(value)
      })
  }
  render(): string {
    return `<horizontal>
        <pref-switch id="switch" layoutDirection="rtl" />
        <pref-num-input id="input" w="50"/>
      </horizontal>`;
  }

   loadPrefValue(): void {
    this.view.input.widget.setKey(this.getKey())
    this.view.input.widget.loadPrefValue()
    this.view.switch.widget.setKey(this.getKey())
    this.view.switch.widget.loadPrefValue()
   }

   getValue(): number | null{
    let value = this.view.input.getText()
    return this.isChecked() && value ? Number(value) : null
   }

   isChecked() : boolean {
    return this.view.switch.isChecked()
   }
}