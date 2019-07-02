import { DirectiveOptions } from 'vue';
const scope = 'LoadScroll';
const attributes = {
  delay: {
    type: Number,
    default: 200
  },
  distance: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  immediate: {
    type: Boolean,
    default: true
  }
};
// 获取滚动配置
const getScrollOptions = (el, vm) => {
  // 兼容普通属性和vue数据属性
  let attrsKey = Object.keys(attributes);
  return attrsKey.reduce((map: any, key: any) => {
    let value = el.getAttribute(`load-scroll-${key}`);

    // JSON.parse 格式化 布尔值和数值
    value = vm[value] ? vm[value] : value ? JSON.parse(value) : attributes[key].default;
    map[key] = value;
    return map;
  }, {});
};
// 获取距离
const getPositionSize = (el, prop) => {
  return el === window || el === document
    ? document.documentElement[prop]
    : el[prop];
}
const getOffsetHeight = el => {
  return getPositionSize(el, 'offsetHeight')
}
const getClientHeight = el => {
  return getPositionSize(el, 'clientHeight')
}
const getElementTop = el => el.getBoundingClientRect().top;

// 滚动事件
const handleScroll = function(cb) {
  const { el, vm, container, observer } = this[scope];
  const { distance, disabled } = getScrollOptions(el, vm);

  if(disabled) return;
  let shouldTrigger = false;

  if(container === el) {
    const scrollBottom = container.scrollTop + getClientHeight(container);
    shouldTrigger = container.scrollHeight - scrollBottom <= distance;
  } else {
    const heightBelowTop = getOffsetHeight(el) + getElementTop(el) - getElementTop(container);
    const offsetHeight = getOffsetHeight(container);
    // const borderBottom = Number.parseFloat(getStyleComputedProperty(container, 'borderBottomWidth'));
    shouldTrigger = heightBelowTop - offsetHeight <= distance;
  }
  if (shouldTrigger && typeof cb === 'function') {
    cb.call(vm);
  } else if (observer) {
    observer.disconnect();
    this[scope].observer = null;
  }
}
// 去抖函数
// 不用节流的原因是一开始需要加载出滚动条
const debounce = (delay, cb) => {
  let timer = null;
  return () => {
    clearTimeout(timer);
    setTimeout(() => cb(), delay);
  }
}
const LoadScroll: DirectiveOptions = {
  inserted(el, binding, vnode) {
    const cb = binding.value;

    const vm = vnode.context;

    // 现只作用于竖型滚动
    const container = el;
    const { delay, immediate } = getScrollOptions(el, vm);
    const onScroll = debounce(delay, handleScroll.bind(el, cb));

    el[scope] = { el, vm, container, onScroll };
    if (container) {
      container.addEventListener('scroll', onScroll);

      if (immediate) {
        const observer = el[scope].observer = new MutationObserver(onScroll);
        observer.observe(container, { childList: true, subtree: true });
        onScroll();
      }
    }
  },
  unbind(el) {
    const { container, onScroll } = el[scope];
    if (container) {
      container.removeEventListener('scroll', onScroll);
    }
  }
};

export default LoadScroll;
