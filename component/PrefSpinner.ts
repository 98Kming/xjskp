
import { AbstractConfigurableView } from "./AbstractConfigurableView";

export class PrefSpinner extends AbstractConfigurableView<PrefSpinner, JsSpinner & ConfigurableView<PrefSpinner>> {
  listeners: ((parent: any, view: View, position: number, id: number) => void)[] = [];
  
  protected keySuffix: string = "_spinner"
  render(): string {
    return '<spinner />';
  }
  loadPrefValue(): void {
    this.view.setSelection(this.getStorageValue() || 0, false)
  }
  public _onFinishInflation(view: JsSpinner): void {
    let _this = this
    let lastSelectItem = this.getSelectedItem()
    this.driverInstance.setState(lastSelectItem, true)
    view.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
      onItemSelected: function (parent: JsSpinner, view: View, position: number, id: number) {
        let selectedItem = parent.getSelectedItem()
        if(selectedItem != lastSelectItem) {
          _this.setStorageValue(position)
           _this.driverInstance.setState(selectedItem, true)
           _this.driverInstance.setState(lastSelectItem, false)
           lastSelectItem = selectedItem
        }
        _this.listeners.forEach(listener => {
          listener(parent, view, position, id)
        })
      },
      onNothingSelected: function (parent: any) {
      }
    }))
  }
  
  addOnItemSelectedListener(listener: (parent: JsSpinner, view: View, position: number, id: number) => void) {
    this.listeners.push(listener)
  }
  getSelectedItem() {
    return (this.view as unknown as JsSpinner).getSelectedItem()
  }
}