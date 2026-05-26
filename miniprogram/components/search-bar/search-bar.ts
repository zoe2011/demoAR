/**
 * 搜索栏组件
 */
import { searchPlaces } from '../../services/map-service';
import type { Place } from '../../types';

// Component() 的 this 包含 setData/triggerEvent/data 等 WeChat 内置方法，
// 使用宽松类型避免与最小化类型声明冲突
type Ctx = Record<string, any>;

Component({
  properties: {
    placeholder: { type: String, value: '搜索目的地' },
    autoFocus: { type: Boolean, value: false },
  },

  data: {
    keyword: '',
    suggestions: [] as Place[],
  },

  methods: {
    onInput(this: Ctx, e: WechatMiniprogram.Input) {
      const keyword = e.detail.value;
      this.setData({ keyword });
      this._debounceSearch(keyword);
    },

    onConfirm(this: Ctx) {
      this.triggerEvent('search', { keyword: this.data.keyword });
    },

    onClear(this: Ctx) {
      this.setData({ keyword: '', suggestions: [] });
    },

    async onSelectSuggestion(this: Ctx, e: WechatMiniprogram.TouchEvent) {
      const idx = e.currentTarget.dataset.index as number;
      const place = this.data.suggestions[idx];
      if (place) {
        this.setData({ keyword: place.name, suggestions: [] });
        this.triggerEvent('select', { place });
      }
    },

    _searchTimer: null as ReturnType<typeof setTimeout> | null,

    async _debounceSearch(this: Ctx, keyword: string) {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      if (!keyword.trim()) {
        this.setData({ suggestions: [] });
        return;
      }
      this._searchTimer = setTimeout(async () => {
        try {
          const places = await searchPlaces(keyword);
          this.setData({ suggestions: places.slice(0, 10) });
        } catch (_) {
          // 搜索失败静默处理
        }
      }, 300);
    },
  },
});
