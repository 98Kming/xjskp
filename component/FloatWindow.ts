export abstract class FloatWindow<VIEW> {
  window: org.autojs.autojs.runtime.api.Floaty.JsResizableWindow & VIEW
  protected mView: android.view.ViewProtoerty & typeof android.view.View
  protected focusView?: android.view.ViewProtoerty
  constructor(path: string, show: boolean = true) {
    this.window = floaty.window(path) as org.autojs.autojs.runtime.api.Floaty.JsResizableWindow & VIEW
    let field = this.window.getClass().getDeclaredField('mView')
    field.setAccessible(true)
    this.mView = field.get(this.window)
    !show && (this.mView.setVisibility(8))
  }

  draggable() {
    let winX = device.width / 500
    let winY = device.height / 500
    let downX = 0, downY = 0
    this.mView.setOnTouchListener(new android.view.View.OnTouchListener({
      onTouch: (view: View, event: MotionEvent): boolean => {
        switch (event.getAction()) {
          case android.view.MotionEvent.ACTION_DOWN:
            downX = event.getRawX()
            downY = event.getRawY()
            winX = this.window.getX()
            winY = this.window.getY()
            break
          case android.view.MotionEvent.ACTION_MOVE:
            let nowX = winX + event.getRawX() - downX
            let nowY = winY + event.getRawY() - downY
            if (nowX < -view.getWidth() / 2) {
              nowX = -view.getWidth() / 2
            } else if (nowX > device.width - view.getWidth() / 2) {
              nowX = device.width - view.getWidth() / 2
            }
            if (nowY < -view.getHeight() / 2) {
              nowY = -view.getHeight() / 2
            } else if (nowY > device.height - view.getHeight()) {
              nowY = device.height - view.getHeight()
            }
            this.window.setPosition(nowX, nowY)
            break
          case android.view.MotionEvent.ACTION_UP:
            if (Math.abs(event.getRawY() - downY) < 10 && Math.abs(event.getRawX() - downX) < 10) {
              view.callOnClick()
            }
        }
        return true
      }
    }

    ))
  }

  findAllInput(view: View) {
    if (view instanceof android.view.ViewGroup) {
      let viewGroup = view as android.view.ViewGroup
      for (let i = 0; i < viewGroup.getChildCount(); i++) {
        let view = viewGroup.getChildAt(i)
        if (view instanceof android.widget.EditText) {
          let focusChangeListener = (view as any).getOnFocusChangeListener()
          this.editTextFocus(view as any as android.view.ViewProtoerty, focusChangeListener)
        }
        this.findAllInput(view)
      }
    }
  }

  windowOutSideDisableFocus(window: org.autojs.autojs.runtime.api.Floaty.JsResizableWindow) {
    let field = window.getClass().getDeclaredField('mWindow')
    field.setAccessible(true)
    let mWindow = field.get(window)
    field = mWindow.getClass().getSuperclass().getDeclaredField('mWindowLayoutParams')
    field.setAccessible(true)
    let params = field.get(mWindow)
    let mWindowViewField = mWindow.getClass().getSuperclass().getDeclaredField('mWindowView')
    mWindowViewField.setAccessible(true)
    let mWindowView = mWindowViewField.get(mWindow)

    params.flags &= ~android.view.WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
    params.flags |= android.view.WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH | android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
    ui.run(() => {
      mWindow.updateWindowLayoutParams(params)
    })
    mWindowView.setOnTouchListener((_: View, event: MotionEvent): boolean => {
      if (event.getAction() === android.view.MotionEvent.ACTION_OUTSIDE) {
        if (this.focusView) {
          this.focusView.clearFocus()
          this.hideSoftKeyboard(this.focusView)
        }
      }
      return false
    })
  }
  showSoftKeyboard(view: typeof android.view.View) {
    let imm = context.getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
    return imm.showSoftInput(view, android.view.inputmethod.InputMethodManager.SHOW_FORCED);
  }
  hideSoftKeyboard(view: android.view.ViewProtoerty) {
    let imm = context.getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
    imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
  }
  editTextFocus(view: android.view.ViewProtoerty, listener: android.view.View.OnFocusChangeListener) {
    let _this = this
    view.setOnFocusChangeListener(new android.view.View.OnFocusChangeListener({
      onFocusChange(v: typeof android.view.View, hasFocus: boolean) {
        if (hasFocus) {
          _this.focusView = view;
        }
        listener?.onFocusChange(v, hasFocus)
      }
    })
    )
  }
}
