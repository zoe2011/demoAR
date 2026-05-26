type Ctx = Record<string, any>;

Component({
  properties: {
    muted: { type: Boolean, value: false },
  },

  methods: {
    onToggle(this: Ctx) {
      this.triggerEvent('toggle', { muted: !this.properties.muted });
    },
  },
});
