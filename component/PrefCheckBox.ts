
import { AbstractConfigurableView } from "./AbstractConfigurableView";
export class PrefCheckBox extends AbstractConfigurableView<PrefCheckBox,JsCheckBox> {
  protected keySuffix: string = "_checkbox"
  render(): string {
    return `<checkbox />`
  }

  public _onFinishInflation(view: JsCheckBox): void {
    view.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
      onCheckedChanged: (buttonView, isChecked) => {
        this.setStorageValue(isChecked)
        this.driverInstance && this.driverInstance.setState(this.getKey(), isChecked)
      }
    }))
  }

  loadPrefValue(): void {
    let checkbox = this.view as unknown as android.widget.CheckBox
    checkbox.setChecked(this.getStorageValue() || false)
  }
  
  isChecked(): boolean {
    return (this.view as unknown as android.widget.CheckBox).isChecked();
  }
}