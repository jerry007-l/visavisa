// 音频入口文件 - 处理浏览器自动播放策略
const AudioInit = {
    initialized: false,
    
    init() {
        if (this.initialized) return;
        
        try {
            // 创建一个短暂的振荡器来测试音频
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 如果音频上下文是 suspended 状态,恢复它
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            this.initialized = true;
            console.log('✅ 音频系统已初始化');
            
            // 初始化SoundManager
            if (SoundManager && SoundManager.init) {
                SoundManager.init();
            }
        } catch (e) {
            console.error('音频初始化失败:', e);
        }
    }
};

// 当页面加载完成后,等待用户首次点击就初始化音频
document.addEventListener('click', function initializeAudioOnFirstClick() {
    AudioInit.init();
    document.removeEventListener('click', initializeAudioOnFirstClick);
}, { once: true });

// 同时也监听触摸事件(移动端)
document.addEventListener('touchstart', function initializeAudioOnTouch() {
    AudioInit.init();
    document.removeEventListener('touchstart', initializeAudioOnTouch);
}, { once: true });
