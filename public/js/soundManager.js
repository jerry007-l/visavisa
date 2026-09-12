// 完整音效系统 - 多类型游戏音效
const SoundManager = {
    bgmEnabled: true,
    sfxEnabled: true,
    volume: 0.5,
    audioContext: null,
    isPlaying: false,
    currentOscillators: [],
    
    // 获取或创建 AudioContext
    getContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        return this.audioContext;
    },
    
    // 停止所有正在播放的声音
    stopAllSounds() {
        this.currentOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch(e) {}
        });
        this.currentOscillators = [];
    },
    
    // ==================== 背景音乐 ====================
    
    // 开始简单的背景音乐
    startBGM() {
        if (!this.bgmEnabled || this.isPlaying) return;
        
        this.isPlaying = true;
        console.log('🎵 背景音乐开始播放');
        
        this.playMelodyLoop();
    },
    
    // 循环播放旋律（温馨风格）
    playMelodyLoop() {
        if (!this.isPlaying || !this.bgmEnabled) {
            this.isPlaying = false;
            return;
        }
        
        const ctx = this.getContext();
        const notes = [
            { freq: 261.63, dur: 0.5 },  // C4 (Middle C)
            { freq: 329.63, dur: 0.5 },  // E4
            { freq: 392.00, dur: 0.5 },  // G4
            { freq: 523.25, dur: 0.5 },  // C5
            { freq: 392.00, dur: 0.5 },  // G4
            { freq: 329.63, dur: 0.5 },  // E4
            { freq: 293.66, dur: 0.5 },  // D4
            { freq: 261.63, dur: 1.0 },  // C4
        ];
        
        let time = ctx.currentTime;
        
        notes.forEach((note) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            gainNode.gain.value = this.volume * 0.1;  // 音量较低，作为背景
            
            osc.start(time);
            osc.stop(time + note.dur - 0.01);
            
            this.currentOscillators.push(osc);
            
            // 清理旧的oscillator
            setTimeout(() => {
                const idx = this.currentOscillators.indexOf(osc);
                if (idx > -1) this.currentOscillators.splice(idx, 1);
            }, note.dur * 1000);
            
            time += note.dur;
        });
        
        // 循环播放
        const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0) * 1000;
        setTimeout(() => {
            this.playMelodyLoop();
        }, totalDuration);
    },
    
    // 停止背景音乐
    stopBGM() {
        this.isPlaying = false;
        this.stopAllSounds();
        console.log('⏹️ 背景音乐停止');
    },
    
    // ==================== 音效系统 (SFX) ====================
    
    // 播放音效
    play(type) {
        if (!this.sfxEnabled) return;
        
        try {
            const ctx = this.getContext();
            
            switch(type) {
                case 'click':
                    this.playClick();
                    break;
                case 'success':
                    this.playSuccess();
                    break;
                case 'fail':
                    this.playFail();
                    break;
                case 'coin':
                    this.playCoin();
                    break;
                case 'item':
                    this.playItem();
                    break;
                case 'alert':
                    this.playAlert();
                    break;
                case 'achievement':
                    this.playAchievement();
                    break;
                case 'event':
                    this.playEvent();
                    break;
                default:
                    console.warn(`未知的音效类型: ${type}`);
            }
        } catch (e) {
            console.error('音效播放失败:', e);
        }
    },
    
    // 点击音效 - 短促清脆
    playClick() {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    },
    
    // 成功音效 - 上升的音符序列
    playSuccess() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const sequence = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        sequence.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.1;
            gainNode.gain.setValueAtTime(this.volume * 0.4, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.start(startTime);
            osc.stop(startTime + 0.2);
            
            this.currentOscillators.push(osc);
        });
    },
    
    // 失败音效 - 下降的沉闷声音
    playFail() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);
        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    },
    
    // 金币音效 - 清脆的高频音
    playCoin() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        // 第一个音调
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.value = 1200;
        gain1.gain.setValueAtTime(this.volume * 0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc1.start(now);
        osc1.stop(now + 0.1);
        
        // 第二个音调（延迟）
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.value = 1600;
        gain2.gain.setValueAtTime(this.volume * 0.3, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.18);
    },
    
    // 道具音效 - 柔和的上升音
    playItem() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    },
    
    // 警告音效 - 急促的双音
    playAlert() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'square';
            osc.frequency.value = 440;
            
            const startTime = now + i * 0.15;
            gainNode.gain.setValueAtTime(this.volume * 0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.start(startTime);
            osc.stop(startTime + 0.1);
            
            this.currentOscillators.push(osc);
        }
    },
    
    // 成就解锁音效 - 庆祝旋律
    playAchievement() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C5, E5, G5, C6, G5, C6
        
        melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.12;
            gainNode.gain.setValueAtTime(this.volume * 0.4, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
            
            osc.start(startTime);
            osc.stop(startTime + 0.25);
            
            this.currentOscillators.push(osc);
        });
    },
    
    // 随机事件音效 - 紧张感的低鸣
    playEvent() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        // 低频铺垫
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.value = 100;
        gain1.gain.setValueAtTime(this.volume * 0.2, now);
        gain1.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.5);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        osc1.start(now);
        osc1.stop(now + 1.0);
        
        // 高频紧张感
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, now);
        osc2.frequency.exponentialRampToValueAtTime(330, now + 0.5);
        gain2.gain.setValueAtTime(this.volume * 0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc2.start(now);
        osc2.stop(now + 0.8);
        
        this.currentOscillators.push(osc1, osc2);
    },
    
    // ==================== 控制方法 ====================
    
    // 把存档里的声音设置同步到运行时开关，play() / startBGM() 只认这两个标志
    applySettings() {
        const settings = UserData.getSettings();
        this.sfxEnabled = settings.soundEnabled !== false;
        this.bgmEnabled = settings.bgmEnabled !== false;
    },
    
    // 初始化音频（处理浏览器策略）
    init() {
        try {
            this.applySettings();
            const audioContext = this.getContext();
            console.log('🔊 音效系统已激活');
            
            // 开始播放背景音乐
            this.startBGM();
        } catch (e) {
            console.error('音频初始化失败:', e);
        }
    },
    
    // 切换开关
    toggle() {
        const newState = !UserData.getSettings().soundEnabled;
        
        UserData.updateSettings({ soundEnabled: newState, bgmEnabled: newState });
        this.applySettings();
        
        if (newState) {
            this.unmute();
        } else {
            this.mute();
        }
    },
    
    // 静音
    mute() {
        this.bgmEnabled = false;
        this.sfxEnabled = false;
        this.stopBGM();
    },
    
    // 恢复音效
    unmute() {
        this.bgmEnabled = true;
        this.sfxEnabled = true;
        this.startBGM();
    },
    
    // 重置音效状态
    reset() {
        this.stopAllSounds();
        this.isPlaying = false;
        this.currentOscillators = [];
    }
};
