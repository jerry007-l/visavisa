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

        // 此刻 init() 里的 play() 多半已被拦截，isPlaying 仍为 false，按钮应显示关闭态
        this.syncSoundButton();
    },

    // 用 bgmAudio 的 playing/pause 事件驱动提示与按钮：响起即隐藏提示、按钮转开启态，
    // 停止即重新显示提示、按钮转关闭态。
    // 懒创建的 bgmAudio 在静音态下可能尚未存在，故先 ensureBgmAudio() 再挂监听；
    // 无头测试环境的桩元素可能没有 addEventListener，缺则安全跳过。
    bindHintToAudio() {
        if (typeof SoundManager === 'undefined' || !SoundManager.ensureBgmAudio) return;
        const audio = SoundManager.ensureBgmAudio();
        if (!audio || !audio.addEventListener) return;
        audio.addEventListener('playing', () => {
            this.hideMusicHint();
            this.paintSoundButton(true);
        });
        audio.addEventListener('pause', () => {
            this.showMusicHint();
            this.paintSoundButton(false);
        });
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

    // "音效"按钮点击入口。
    // 以真实发声状态而非存档开关决定方向：刚进入页面时 play() 常被自动播放策略拦截，
    // 此时存档是"开"、实际却无声，照搬 SoundManager.toggle() 会把它切成"关"——
    // 用户既听不到变化也看不到变化，表现为"点了没反应"，还顺手把存档改成静音。
    // 故没在响就一律开启并播放，只有正在响时才关闭。
    toggleSound() {
        if (typeof SoundManager === 'undefined') return;
        const turningOn = !SoundManager.isPlaying;
        if (turningOn) {
            SoundManager.enableAndPlay();
        } else {
            SoundManager.toggle();
        }
        // play() 是异步的，先按本次意图立刻反馈；若随后被拦截，
        // playing/pause 事件与手势重试里的 syncSoundButton() 会把标签纠正回来
        this.paintSoundButton(turningOn);
    },

    // 写入按钮的开启/关闭外观（幂等，缺元素时安全跳过）
    paintSoundButton(on) {
        const btn = document.getElementById('soundToggleBtn');
        if (!btn) return;
        btn.textContent = on ? '🔊 音效' : '🔇 音效';
        if (btn.setAttribute) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (btn.classList) btn.classList.toggle('sound-off', !on);
    },

    // 按当前真实发声状态刷新按钮
    syncSoundButton() {
        if (typeof SoundManager === 'undefined') return;
        this.paintSoundButton(!!SoundManager.isPlaying);
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
            // play() 被拦截时不会触发 pause 事件，靠这里把乐观绘制的标签纠正回真实状态。
            // 但正在加载时不能纠正——本函数由同一次点击冒泡触发，此刻 play() 还没 resolve，
            // 无条件同步会把 toggleSound() 刚写上的开启态覆盖回关闭态，即时反馈就白做了
            if (!SoundManager.bgmLoading) AudioInit.syncSoundButton();
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
