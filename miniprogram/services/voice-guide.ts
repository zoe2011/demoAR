/**
 * 语音播报服务
 *
 * 使用 wx.createInnerAudioContext 播放预录或合成的导航语音。
 * MVP 版本使用简单的 TTS 方式（wx 内置语音合成），或预置音频文件。
 *
 * 播报策略：
 *  - 转弯前 50m、20m、5m 各播报一次
 *  - 偏航时立即播报
 *  - 到达时播报
 *  - 防重复播报（同一指令 10s 内不重复）
 */

// 预录音频文件映射（Phase 3 可替换为真实音频）
// const AUDIO_FILES: Record<string, string> = {
//   start:        '/assets/audio/nav_start.mp3',
//   straight:     '/assets/audio/go_straight.mp3',
//   turn_left:    '/assets/audio/turn_left.mp3',
//   turn_right:   '/assets/audio/turn_right.mp3',
//   u_turn:       '/assets/audio/u_turn.mp3',
//   arrive:       '/assets/audio/arrive.mp3',
//   reroute:      '/assets/audio/rerouting.mp3',
// };

/** 播报事件 */
export interface VoiceEvent {
  type: 'start' | 'turn_left' | 'turn_right' | 'straight' | 'u_turn' | 'arrive' | 'reroute';
  distance?: number;  // 距转弯点距离（米）
  message: string;    // 显示文字
}

export class VoiceGuide {
  private audio: WechatMiniprogram.InnerAudioContext | null = null;
  private lastSpoken = '';
  private lastSpeakTime = 0;
  private cooldownMs = 10000; // 同一指令冷却 10s
  private enabled = true;
  private announcedTurnIds = new Set<number>();

  constructor() {
    // InnerAudioContext 在 WeChat 环境中创建
    try {
      this.audio = wx.createInnerAudioContext();
    } catch (_) {
      console.warn('音频不可用');
    }
  }

  /** 播报导航指令 */
  speak(event: VoiceEvent) {
    if (!this.enabled || !this.audio) return;

    // 防重复
    const key = `${event.type}_${event.distance || 0}`;
    const now = Date.now();
    if (key === this.lastSpoken && now - this.lastSpeakTime < this.cooldownMs) {
      return;
    }
    this.lastSpoken = key;
    this.lastSpeakTime = now;

    // 设置音频源
    // MVP: 使用空音频或无声音频，避免报错
    // 正式版: 根据 event.type 加载对应音频文件
    // this.audio.src = AUDIO_FILES[event.type] || '';

    // 尝试播放
    try {
      this.audio.play();
    } catch (_) {
      // 静默失败
    }

    // 在界面上显示文字提示（通过全局事件或回调）
    // 这里返回 message 供调用方处理
  }

  /** 转弯前播报 */
  announceTurn(direction: string, distance: number, turnIndex: number) {
    if (this.announcedTurnIds.has(turnIndex)) return;

    const thresholds = [50, 20, 5]; // 米
    const maxDist = Math.max(...thresholds);

    for (const threshold of thresholds) {
      if (distance <= threshold && distance > threshold - 5) {
        const event: VoiceEvent = {
          type: direction as VoiceEvent['type'],
          distance,
          message: this.formatTurnMessage(direction, distance),
        };
        this.speak(event);
        if (distance <= 5) {
          this.announcedTurnIds.add(turnIndex);
        }
        return;
      }
    }

    if (distance > maxDist) {
      // 距离转弯还远，不播报
    }
  }

  /** 播报偏航 */
  announceReroute() {
    this.speak({
      type: 'reroute',
      message: '您已偏离路线，正在重新规划',
    });
  }

  /** 播报到达 */
  announceArrive() {
    this.speak({
      type: 'arrive',
      message: '已到达目的地',
    });
  }

  /** 格式化转弯文字 */
  private formatTurnMessage(direction: string, distance: number): string {
    const dirMap: Record<string, string> = {
      turn_left: '左转',
      turn_right: '右转',
      u_turn: '掉头',
      straight: '直行',
    };
    const dirName = dirMap[direction] || '转向';
    if (distance <= 5) return `立即${dirName}`;
    return `前方${Math.round(distance)}米${dirName}`;
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  destroy() {
    this.audio?.destroy();
    this.audio = null;
  }
}
