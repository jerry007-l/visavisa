// 音频入口文件 - 处理浏览器自动播放策略
const AudioInit = {
    initialized: false,

    // 进入程序即初始化：尝试立即自动播放背景音乐
    init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            if (typeof SoundManager !== 'undefined' && SoundManager.init) {
                SoundManager.init(); // 内部 startBGM() 会尝试 play()
            }
        } catch (e) {
            console.error('音频初始化失败:', e);
        }

        // 提示显隐完全交给音频元素的 playing/pause 事件驱动（见 bindHintToAudio）：
        // 音乐真正响起才隐藏，停止/被拦截/静音时保持显示继续引导。
        // 不再按 bgmEnabled 分支隐藏——静音恰恰是最需要引导、让用户能重新开启音乐的状态。
        this.bindHintToAudio();

        // 浏览器自动播放策略可能拦截 play()（首次进入、尚无交互时尤其如此）。
        // 挂持续手势监听：用户一旦点击/按键/触摸就重试，直到音乐真正响起再解绑
        this.bindGestureRetry();
    },

    // 用 bgmAudio 的 playing/pause 事件驱动提示：响起即隐藏，停止即重新显示。
    // 懒创建的 bgmAudio 在静音态下可能尚未存在，故先 ensureBgmAudio() 再挂监听；
    // 无头测试环境的桩元素可能没有 addEventListener，缺则安全跳过。
    bindHintToAudio() {
        if (typeof SoundManager === 'undefined' || !SoundManager.ensureBgmAudio) return;
        const audio = SoundManager.ensureBgmAudio();
        if (!audio || !audio.addEventListener) return;
        audio.addEventListener('playing', () => this.hideMusicHint());
        audio.addEventListener('pause', () => this.showMusicHint());
    },

    // 撤掉"播放音乐"引导提示（幂等，缺元素时安全跳过）
    hideMusicHint() {
        const hint = document.getElementById('musicHint');
        if (hint && hint.classList) hint.classList.add('hide');
    },

    // 重新显示引导提示（音乐停止/被静音时继续引导用户开启）
    showMusicHint() {
        const hint = document.getElementById('musicHint');
        if (hint && hint.classList) hint.classList.remove('hide');
    },

    bindGestureRetry() {
        const events = ['click', 'keydown', 'touchstart'];
        function unbind() {
            events.forEach(evt => document.removeEventListener(evt, tryStart));
        }
        function tryStart() {
            if (typeof SoundManager === 'undefined') return;
            // 用户已静音则无需重试，直接解绑
            if (!SoundManager.bgmEnabled) { unbind(); return; }
            if (!SoundManager.isPlaying && !SoundManager.bgmLoading) {
                SoundManager.startBGM();
            }
            // play() 异步 resolve 后 isPlaying 才为 true，此时才解绑
            if (SoundManager.isPlaying) unbind();
        }
        events.forEach(evt => document.addEventListener(evt, tryStart));
    }
};

// audioInit.js 在 <head> 中同步加载，此时 readyState 为 loading，
// 故监听 DOMContentLoaded 与 load：进入程序即尝试自动播放，load 再兜底一次。
// 不用同步直调 init()，避免在无 DOM 的无头测试环境里被提前触发
document.addEventListener('DOMContentLoaded', () => AudioInit.init());
window.addEventListener('load', () => AudioInit.init());
