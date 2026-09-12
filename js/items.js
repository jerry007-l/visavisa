// 道具系统 - 申请人和签证官道具
const ITEMS = {
    // 特殊道具
    special: [
        {
            id: 'bribe',
            name: '💰 贿赂签证官',
            price: 200,
            desc: '花重金贿赂签证官，有50%几率直接通过，50%几率直接拒签并被拉黑',
            effect: '高风险高回报的赌博行为',
            type: 'bribe' // 标记为贿赂类型
        }
    ],
    
    // 申请人道具（欺诈辅助）
    applicant: [
        {
            id: 'deep_photo',
            name: '📱 深度P图',
            price: 60,
            desc: '伪造一份完美的材料，完全看不出破绽',
            effect: '可使一份材料的伪造概率降为0%'
        },
        {
            id: 'returnee_template',
            name: '💼 海归模板',
            price: 80,
            desc: '伪造海外学历+工作经历双证明',
            effect: '毕业和在在美经历两项材料变为真'
        },
        {
            id: 'crazy_itinerary',
            name: '🗓️ 霸王行程',
            price: 50,
            desc: '创建夸张但完整的行程安排表',
            effect: '行程类材料可信度+50%'
        },
        {
            id: 'fake_operator',
            name: '📞 假接线员',
            price: 100,
            desc: '临时找人冒充邀请方接电话',
            effect: '验证邀请类材料自动通过核查'
        },
        {
            id: 'magic_memory',
            name: '🧠 记忆魔法',
            price: 120,
            desc: '让签证官忘记某个问题，自动跳过',
            effect: '可跳过1个不利问题'
        },
        {
            id: 'personality_switch',
            name: '🎭 人格切换',
            price: 70,
            desc: '伪装成另一个身份（改变话术风格）',
            effect: '下两轮答题答案自动优化'
        },
        {
            id: 'triple_caffeine',
            name: '☕ 三倍咖啡因',
            price: 30,
            desc: '下两轮答题时间延长10秒',
            effect: '答题时间+10秒/轮'
        },
        {
            id: 'legal_disclaimer',
            name: '📜 法律免责声明',
            price: 90,
            desc: '声称"材料仅供参考"，降低可信度要求',
            effect: '整体审查严格度降低20%'
        }
    ],
    
    // 签证官道具（审查辅助）
    officer: [
        {
            id: 'microscope',
            name: '🔍 显微镜审查',
            price: 60,
            desc: '逐字检查申请材料，发现3处可疑点',
            effect: '显示3个材料的详细可疑之处'
        },
        {
            id: 'ai_emotion',
            name: '📊 AI情绪分析',
            price: 50,
            desc: '分析答题时的微表情，显示可疑程度',
            effect: '每轮显示申请人可疑程度'
        },
        {
            id: 'verify_hotline',
            name: '📞 核实热线',
            price: 70,
            desc: '致电"邀请方"核实，100%确定真假',
            effect: '100%确认邀请函真假'
        },
        {
            id: 'blacklist_scan',
            name: '🕵️ 黑名单扫描',
            price: 40,
            desc: '检查移民黑名单、违规记录',
            effect: '显示申请人是否有不良记录'
        },
        {
            id: 'chain_question',
            name: '⚡ 连环追问',
            price: 80,
            desc: '连续问5个尖锐问题，申请人只能答3个',
            effect: '强制进入压力测试环节，多暴露线索'
        },
        {
            id: 'dna_compare',
            name: '🧬 DNA比对',
            price: 100,
            desc: '检查材料DNA（搞笑设定：纸张上的指纹）',
            effect: '100%检测出材料是否伪造'
        },
        {
            id: 'review_monitor',
            name: '🎬 回放监控',
            price: 60,
            desc: '回放申请人入场视频，发现异常物品',
            effect: '发现申请人隐藏的道具'
        },
        {
            id: 'credit_score',
            name: '📈 信用评分',
            price: 50,
            desc: '生成申请人信用报告，显示风险等级',
            effect: '显示综合风险评级（低中高）'
        }
    ]
};
