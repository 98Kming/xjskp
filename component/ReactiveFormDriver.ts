
export class ReactiveFormDriver {
  private formState: Map<string, boolean> = new Map();
  private rules: VisibilityRule[] = [];

  setRules(rules: VisibilityRule[]) {
    this.rules = rules;
    // 初始化所有涉及的 key 为 false
    const allKeys = new Set<string>();
    rules.forEach(r => {
      allKeys.add(r.targetKey);
      r.shows.forEach(k => allKeys.add(k));
      r.hides.forEach(k => allKeys.add(k));
    });

    allKeys.forEach(k => {
      if (!this.formState.has(k)) {
        this.formState.set(k, false);
      }
    });

    this.refreshVisibility();
  }

  setState(key: string, value: boolean) {
    // 只有值真正变化时才更新
    if (this.formState.get(key) === value) return;

    this.formState.set(key, value);
    //console.log(`[State Change] ${key} = ${value}`);

    this.refreshVisibility();
  }



  /**
   * state只代表是否选中，还需要判断show和hide中的视图是否显示
   */
  refreshVisibility() {
    if (!this.rules) return;

    // 初始化映射
    const keyToViewMap = new Map<string, ConfigurableView<ConfigurableWidget> | View>();
    this.rules.forEach(r => {
      if (r.view && r.targetKey) {
        keyToViewMap.set(r.targetKey, r.view);
      }
    });

    // 当前可见性状态 (初始化为全 false)
    let currentVisibilityMap = new Map<ConfigurableView<ConfigurableWidget> | View, boolean>();
    this.rules.forEach(r => { if (r.view) currentVisibilityMap.set(r.view, false); });

    let changed = true;
    let loopCount = 0;
    const maxLoops = 20; // 防止死循环

    // --- 迭代计算，直到状态稳定 ---
    while (changed && loopCount < maxLoops) {
      changed = false;
      loopCount++;

      const nextVisibilityMap = new Map<ConfigurableView<ConfigurableWidget> | View, boolean>();

      this.rules.forEach(rule => {
        if (!rule.view) return;

        let shouldBeVisible = false;
        let isHidden = false;

        // 1. 检查 Hide (一票否决) - 依赖 State + 依赖视图的【当前】可见性
        // 1. 检查 Hide (一票否决) - 依赖 State + 依赖视图的【当前】可见性
        for (const key of rule.hides) {
          const stateIsTrue = this.formState.get(key) === true;
          if (!stateIsTrue) continue;

          // 判断 key 是否对应一个实际的 View（即是否是控件 key）
          const providerView = keyToViewMap.get(key);

          if (providerView) {
            // 是控件 key：必须 visible + checked 才 hide
            const isProviderVisible = currentVisibilityMap.get(providerView) || false;
            if (isProviderVisible) {
              isHidden = true;
              break;
            }
          } else {
            // 是纯状态 key（如 GameType.xxx）：只要 checked 就 hide
            isHidden = true;
            break;
          }
        }

        // 2. 检查 Show (OR 逻辑) - 依赖 State + 依赖视图的【当前】可见性
        if (!isHidden) {
          if (rule.shows.length === 0) {
            shouldBeVisible = true;
          } else {
            for (const key of rule.shows) {
              const stateIsTrue = (this.formState.get(key) === true);

              if (!stateIsTrue) continue;

              // 关键逻辑：如果 Key 对应一个视图，该视图必须也是可见的
              const providerView = keyToViewMap.get(key);

              if (providerView) {
                // 读取上一轮（或本轮已计算）的可见性状态
                // 注意：这里读取的是 currentVisibilityMap，随着循环进行，它会越来越准确
                const isProviderVisible = currentVisibilityMap.get(providerView) || false;

                if (isProviderVisible) {
                  shouldBeVisible = true;
                  break;
                }
              } else {
                // 纯状态 Key，只要 State 为 true 即可
                shouldBeVisible = true;
                break;
              }
            }
          }
        }

        nextVisibilityMap.set(rule.view, shouldBeVisible);

        // 检查是否发生变化
        if (currentVisibilityMap.get(rule.view) !== shouldBeVisible) {
          changed = true;
        }
      });

      // 更新状态，进入下一轮
      currentVisibilityMap = nextVisibilityMap;
    }

    // --- 应用最终结果 ---
    currentVisibilityMap.forEach((show, view) => {
      const target = show ? 0 : 8;
      if (view.getVisibility() !== target) {
        if ('widget' in view && view.widget) {
          view.widget.setVisibility(target)
        } else {
          ui.run(() => view.setVisibility(target))
        }
      }
    });

    if (loopCount >= maxLoops) {
      console.warn("[Warn] Visibility calculation reached max loops, might be circular dependency.");
    }
  }
}

export const driverInstance = new ReactiveFormDriver()