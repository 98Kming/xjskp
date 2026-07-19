import { driverInstance } from "./ReactiveFormDriver"



export abstract class AbstractConfigurableView<WIDGET extends AbstractConfigurableView<WIDGET, VIEW>, VIEW> extends ui.Widget implements ConfigurableWidget {
  private key?: string
  protected keySuffix: string = ""
  private pref?: Internal.LocalStorage
  protected driverInstance = driverInstance
  view!: VIEW & ConfigurableView<WIDGET>
  protected parentView: View | null = null
  constructor() {
    super();
    ui.Widget.call(this);
  }
  // xml 布局
  abstract render(): string

  // 从存储中读取值并设置到视图上
  abstract loadPrefValue(): void
  // 布局完成，进行一些操作
  abstract _onFinishInflation(view: VIEW): void

  onFinishInflation(view: VIEW): void {
    this._onFinishInflation(view)
    this.loadPrefValue()
  }

  getKey(): string {
    if (this.key) {
      return this.key;
    }

    let id = this.view.attr("id");
    if (!id) {
      throw new Error("should set a id");
    }
    this.key = id.replace("@+id/", "");
    return this.key
  }

  setKey(key: string) {
    this.key = key;
  }

  setPref(pref: Internal.LocalStorage): void {
    this.pref = pref
  }

  private getPref(): Internal.LocalStorage {
    if (!this.pref) {
      this.pref = storages.create("pref")
    }
    return this.pref
  }

  setStorageValue(value: any): void {
    this.getPref().put(this.getKey() + this.keySuffix, value)
  }

  getStorageValue(): any {
    return this.getPref().get(this.getKey() + this.keySuffix)
  }

  setVisibility(visibility: number) {
    if (this.view && this.view.getVisibility() !== visibility) {
      ui.run(() => {
        this.view.setVisibility(visibility)
      })
    }
  }
  getVisibility(): number {
    return this.view.getVisibility()
  }
  protected setPraentView(parentView: View) {
    if (this.parentView == null) {
      this.parentView = parentView
    }
  }
  protected clearPraentView() {
    this.parentView = null
  }
}
