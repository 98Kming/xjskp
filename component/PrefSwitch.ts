import { PrefCheckBox } from "./PrefCheckBox";

export class PrefSwitch extends PrefCheckBox {
  render(): string {
    return '<Switch />';
  }
}