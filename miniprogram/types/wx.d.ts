/**
 * 最小化 WeChat 微信小程序类型声明
 * 覆盖本项目的所有 API 调用，避免 @types/wechat-miniprogram 与 DOM lib 冲突。
 */

declare namespace WechatMiniprogram {
  // ============ wx 全局对象 ============
  interface Wx {
    // 定位
    getLocation(opt: GetLocationOption): void;
    startLocationUpdate(opt: BaseOption): void;
    stopLocationUpdate(): void;
    onLocationChange(cb: (res: { latitude: number; longitude: number; speed: number; accuracy: number }) => void): void;

    // 传感器
    onAccelerometerChange(cb: (res: { x: number; y: number; z: number }) => void): void;
    startAccelerometer(opt?: BaseOption): void;
    stopAccelerometer(opt?: BaseOption): void;
    onCompassChange(cb: (res: { direction: number }) => void): void;
    onGyroscopeChange(cb: (res: { x: number; y: number; z: number }) => void): void;
    startCompass(opt?: BaseOption): void;
    stopCompass(opt?: BaseOption): void;

    // 网络
    request(opt: RequestOption): void;
    login(opt: { success?: (res: { code: string; errMsg: string }) => void; fail?: (err: any) => void }): void;

    // 存储
    getStorageSync(key: string): any;
    setStorageSync(key: string, data: any): void;
    removeStorageSync(key: string): void;

    // 系统
    getSystemInfoSync(): SystemInfo;

    // UI
    showToast(opt: { title: string; icon?: 'none' | 'success' | 'error' | 'loading'; duration?: number }): void;
    hideToast(): void;
    showLoading(opt: { title: string; mask?: boolean }): void;
    hideLoading(): void;
    showModal(opt: ShowModalOption): void;
    navigateTo(opt: { url: string }): void;
    navigateBack(opt?: { delta?: number }): void;
    createMapContext(mapId: string, ctx: any): MapContext;
    createSelectorQuery(): SelectorQuery;
    createInnerAudioContext(): InnerAudioContext;

    // 相机
    createCameraContext(): CameraContext;
  }

  // ============ 选项接口 ============
  interface BaseOption {
    success?: (res: any) => void;
    fail?: (err: any) => void;
    complete?: () => void;
  }

  interface GetLocationOption extends BaseOption {
    type?: 'wgs84' | 'gcj02';
    isHighAccuracy?: boolean;
  }

  interface RequestOption {
    url: string;
    method?: string;
    data?: any;
    header?: Record<string, string>;
    success?: (res: { statusCode: number; data: any }) => void;
    fail?: (err: any) => void;
  }

  interface ShowModalOption {
    title: string;
    content: string;
    showCancel?: boolean;
    success?: (res: { confirm: boolean; cancel: boolean }) => void;
  }

  // ============ UI 组件相关 ============
  interface SystemInfo {
    model: string;
    windowWidth: number;
    windowHeight: number;
    pixelRatio: number;
    platform: string;
  }

  interface MapContext {
    moveToLocation(): void;
    getCenterLocation(opt: BaseOption & { success?: (res: { latitude: number; longitude: number }) => void }): void;
  }

  interface SelectorQuery {
    select(selector: string): NodesRef;
  }

  interface NodesRef {
    fields(fields: { node?: boolean; size?: boolean }, cb?: (res: any[]) => void): void;
  }

  interface InnerAudioContext {
    src: string;
    autoplay: boolean;
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
  }

  interface CameraContext {
    takePhoto(opt: { quality?: string; success?: (res: { tempImagePath: string }) => void }): void;
    startRecord(opt: { success?: (res: { tempVideoPath: string }) => void }): void;
    stopRecord(): void;
  }

  // ============ Canvas ============
  interface Canvas {
    width: number;
    height: number;
    getContext(contextType: '2d'): any;
  }

  // ============ 事件 ============
  interface CustomEvent<T = any> {
    detail: T;
    currentTarget: { dataset: Record<string, any> };
  }

  interface TouchEvent {
    detail: { x: number; y: number };
    currentTarget: { dataset: Record<string, any> };
  }

  interface Input {
    detail: { value: string; cursor: number };
    currentTarget: { dataset: Record<string, any> };
  }

  interface MarkerTap {
    detail: { markerId: number };
  }

  interface RegionChange {
    type: string;
    causedBy: string;
  }

  interface MapMarker {
    id: number;
    latitude: number;
    longitude: number;
    title?: string;
    iconPath?: string;
    width?: number;
    height?: number;
  }

  interface MapPolyline {
    points: Array<{ latitude: number; longitude: number }>;
    color?: string;
    width?: number;
    arrowLine?: boolean;
  }

  interface Image {
    path: string;
    width: number;
    height: number;
  }
}

declare const wx: WechatMiniprogram.Wx;

// ============ 全局函数 ============
declare function getApp<T = any>(): T;
declare function getCurrentPages(): any[];
declare function Page<TData, TCustom = {}>(options: any): void;
declare function Component<TData, TProp, TMethod>(options: any): void;
declare function App<T>(options: T): void;

// ============ 运行时 API ============
declare function requestAnimationFrame(cb: FrameRequestCallback): number;
declare function cancelAnimationFrame(handle: number): void;
