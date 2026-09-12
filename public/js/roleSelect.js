// 角色选择模块
const RoleSelect = {
    init() {
        console.log('🎭 RoleSelect.init() 被调用');
        this.bindEvents();
    },
    
    bindEvents() {
        const officerBtn = document.getElementById('chooseOfficer');
        const applicantBtn = document.getElementById('chooseApplicant');
        
        if (officerBtn) {
            officerBtn.onclick = () => {
                Game.selectRole('officer');
            };
        }
        
        if (applicantBtn) {
            applicantBtn.onclick = () => {
                Game.selectRole('applicant');
            };
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    RoleSelect.init();
});
