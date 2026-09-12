// 材料审核模块
const MaterialReview = {
    // 肉眼印象：有偏向但不是定论，确切结论要靠查验道具
    FAKE_IMPRESSIONS: [
        '纸张手感有点怪，像是重新打印过的',
        '印章边缘发虚，颜色也不太对',
        '字体和官方模板对不上',
        '编号格式看着不太规范'
    ],
    NEUTRAL_IMPRESSIONS: [
        '看上去没什么问题',
        '普普通通，挑不出毛病',
        '排版规整，像是正规机构出的',
        '暂时看不出异常'
    ],
    
    renderMaterials() {
        const container = document.getElementById('MaterialCards');
        if (!container) {
            console.error('找不到 MaterialCards 元素');
            return;
        }
        
        const materials = Game.state.drawnMaterials;
        
        if (!materials || materials.length === 0) {
            container.innerHTML = '<p class="hint-text">本案没有提交任何材料</p>';
            return;
        }
        
        const isOfficer = Game.state.playerRole === 'officer';
        
        container.innerHTML = materials.map(mat => `
            <div class="material-card" onclick="MaterialReview.inspect('${mat.id}')">
                <div class="material-icon">${mat.icon}</div>
                <h3>${mat.name}</h3>
                <p>${mat.desc}</p>
                <div class="material-status" id="status-${mat.id}">
                    ${isOfficer ? '🔍 点击做肉眼初检' : '📄 点击查看这份材料的底细'}
                </div>
            </div>
        `).join('');
        
        if (isOfficer) {
            const officerTools = document.getElementById('OfficerTools');
            if (officerTools) {
                officerTools.style.display = 'block';
                officerTools.innerHTML = `
                    <p style="color: #7F8C8D; font-size: 0.9em; margin: 0;">
                        肉眼初检只能得到模糊印象。想要确切结论，请用右下角 🎒 里的
                        🔍显微镜审查 / 🧬DNA比对 / 📞核实热线。
                    </p>
                `;
            }
        }
    },
    
    inspect(materialId) {
        const material = Game.state.drawnMaterials.find(m => m.id === materialId);
        const statusEl = document.getElementById(`status-${materialId}`);
        
        if (!material || !statusEl) {
            console.error(`找不到材料或状态元素: ${materialId}`);
            return;
        }
        
        const isFake = !!Game.state.materialFake[materialId];
        
        // 申请人自己清楚材料是真是假
        if (Game.state.playerRole !== 'officer') {
            statusEl.innerHTML = isFake
                ? '⚠️ 这份是伪造的（只有你知道）'
                : '✅ 这份是真的，可以放心提交';
            statusEl.style.color = isFake ? '#E67E22' : '#27AE60';
            return;
        }
        
        // 签证官：已经用道具验过的材料直接给结论
        if (Game.state.materialRevealed.includes(materialId)) {
            statusEl.innerHTML = isFake ? '⚠️ 已确认伪造' : '✅ 已确认真实';
            statusEl.style.color = isFake ? '#E74C3C' : '#27AE60';
            return;
        }
        
        // 签证官：肉眼初检只给模糊印象
        const suspiciousChance = isFake ? 0.7 : 0.2;
        const suspicious = Math.random() < suspiciousChance;
        const pool = suspicious ? this.FAKE_IMPRESSIONS : this.NEUTRAL_IMPRESSIONS;
        const impression = pool[Math.floor(Math.random() * pool.length)];
        
        statusEl.innerHTML = `🔍 ${impression}`;
        statusEl.style.color = suspicious ? '#E67E22' : '#7F8C8D';
        SoundManager.play('click');
    }
};
