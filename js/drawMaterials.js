// 材料抽奖模块
const DrawMaterials = {
    // 进入抽奖界面时重置老虎机、抽奖按钮与确认按钮
    renderMaterials() {
        const slotMachine = document.getElementById('SlotMachine');
        if (slotMachine) {
            slotMachine.innerHTML = `
                <div class="slot-item">🎰</div>
                <div class="slot-item">🎰</div>
            `;
        }

        // 抽完材料后 Game.drawMaterials() 会隐藏"开始抽奖"防止重复抽取；
        // 本方法是进入本环节的唯一复位入口，这里把它恢复可见，保证新一局还能抽
        const drawBtn = document.querySelector('#materialDraw .btn-primary');
        if (drawBtn) drawBtn.style.display = '';

        const confirmBtn = document.querySelector('#materialDraw .btn-secondary');
        if (confirmBtn) confirmBtn.style.display = 'none';
    },

    // 把抽到的材料显示到老虎机上
    reveal(materials) {
        const slotMachine = document.getElementById('SlotMachine');
        if (!slotMachine) return;

        slotMachine.innerHTML = materials.map(mat => `
            <div class="slot-item">
                <!-- 用 rem 而非 em：.slot-item 自身 5em，em 会叠乘把图标/名称放得巨大 -->
                <div style="font-size: 3.5rem;">${mat.icon}</div>
                <div style="font-size: 1rem; margin-top: 6px;">${mat.name}</div>
            </div>
        `).join('');
    },

    draw() {
        const shuffled = [...MATERIAL_POOL].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    }
};
