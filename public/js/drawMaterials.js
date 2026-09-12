// 材料抽奖模块
const DrawMaterials = {
    // 进入抽奖界面时重置老虎机与确认按钮
    renderMaterials() {
        const slotMachine = document.getElementById('SlotMachine');
        if (slotMachine) {
            slotMachine.innerHTML = `
                <div class="slot-item">🎰</div>
                <div class="slot-item">🎰</div>
            `;
        }

        const confirmBtn = document.querySelector('#materialDraw .btn-secondary');
        if (confirmBtn) confirmBtn.style.display = 'none';
    },

    // 把抽到的材料显示到老虎机上
    reveal(materials) {
        const slotMachine = document.getElementById('SlotMachine');
        if (!slotMachine) return;

        slotMachine.innerHTML = materials.map(mat => `
            <div class="slot-item">
                <div style="font-size: 2.5em;">${mat.icon}</div>
                <div style="font-size: 0.9em; margin-top: 6px;">${mat.name}</div>
            </div>
        `).join('');
    },

    draw() {
        const shuffled = [...MATERIAL_POOL].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    }
};
