// 随机事件系统 - 支持双角色视角
const RANDOM_EVENTS = [
    {
        id: 'phone_ring',
        title: '📱 手机响了',
        applicantDesc: '申请人的手机突然响起，铃声是"好运来"，屏幕显示"中介小王"',
        officerDesc: '你注意到申请人的手机突然响起，铃声是"好运来"，屏幕显示"中介小王"',
        // 申请人选项
        applicantChoices: [
            { text: '马上接电话', consequence: '签证官怀疑你在联系中介造假，信任度-20%', trustChange: -20, clueReveal: false },
            { text: '不接，挂断', consequence: '签证官起疑心，但不确定内容，信任度-10%', trustChange: -10, clueReveal: false },
            { text: '让签证官接听', consequence: '证明清白，信任度不变，但可能暴露更多', trustChange: 0, clueReveal: true }
        ],
        // 签证官选项
        officerChoices: [
            { text: '询问是谁的电话', consequence: '申请人支支吾吾，信任度-5%', trustChange: -5, clueReveal: true },
            { text: '查看通话记录', consequence: '发现多个中介号码，信任度-15%', trustChange: -15, clueReveal: true },
            { text: '不追问', consequence: '保持沉默，无明显影响', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'sweating',
        title: '😰 突然出汗',
        applicantDesc: '你额头开始冒汗，手也在微微颤抖，签证官注意到了',
        officerDesc: '申请人额头开始冒汗，手也在微微颤抖，看起来非常紧张',
        applicantChoices: [
            { text: '说是天气热', consequence: '签证官不太信，信任度-10%', trustChange: -10, clueReveal: false },
            { text: '承认紧张', consequence: '签证官表示理解，信任度不变', trustChange: 0, clueReveal: false },
            { text: '说是咖啡喝多了', consequence: '合理的解释，无影响', trustChange: 0, clueReveal: false }
        ],
        officerChoices: [
            { text: '表示同情，放缓语速', consequence: '申请人放松下来，表现更自然，信任+5%', trustChange: 5, clueReveal: false },
            { text: '严肃观察，记录可疑点', consequence: '进一步确认是否有隐瞒，暴露线索', trustChange: 0, clueReveal: true },
            { text: '不置可否', consequence: '继续提问，无明显影响', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'sneeze',
        title: '🤧 打喷嚏',
        applicantDesc: '你刚好说到关键证据时打了个喷嚏，材料飞了出去',
        officerDesc: '申请人在说到关键证据时打了个喷嚏，材料飞了出去',
        applicantChoices: [
            { text: '抱歉不好意思', consequence: '签证官微笑示意，无影响', trustChange: 0, clueReveal: false },
            { text: '说有感冒症状', consequence: '建议戴口罩，无影响', trustChange: 0, clueReveal: false }
        ],
        officerChoices: [
            { text: '递纸巾并表示关心', consequence: '申请人感激，信任度+3%', trustChange: 3, clueReveal: false },
            { text: '趁机检查飞出去的材料', consequence: '发现一处不一致，暴露线索', trustChange: -8, clueReveal: true },
            { text: '等待收拾完继续', consequence: '无影响', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'confident_boast',
        title: '💪 自信爆棚',
        applicantDesc: '你开始吹牛，内容越来越离谱，说自己跟总统很熟',
        officerDesc: '申请人开始吹牛，内容越来越离谱，说自己跟总统很熟',
        applicantChoices: [
            { text: '继续吹', consequence: '签证官开始认真审视你，信任度-15%', trustChange: -15, clueReveal: false },
            { text: '及时收住', consequence: '尴尬一笑带过，小幅度降信任', trustChange: -5, clueReveal: false },
            { text: '道歉说开玩笑', consequence: '承认胡闹，信任度-10%', trustChange: -10, clueReveal: false }
        ],
        officerChoices: [
            { text: '要求提供证据证明关系', consequence: '申请人无法证明，信任度-20%', trustChange: -20, clueReveal: true },
            { text: '幽默回应，缓解尴尬', consequence: '氛围缓和，信任+5%', trustChange: 5, clueReveal: false },
            { text: '严肃提醒注意态度', consequence: '申请人收敛一些，信任度-3%', trustChange: -3, clueReveal: false }
        ]
    },
    {
        id: 'near_cry',
        title: '😢 快要哭了',
        applicantDesc: '你的眼眶开始发红，情绪接近崩溃边缘',
        officerDesc: '申请人的眼眶开始发红，情绪接近崩溃边缘',
        applicantChoices: [
            { text: '强忍泪水', consequence: '签证官态度稍微缓和', trustChange: 5, clueReveal: false },
            { text: '说实话是因为太紧张', consequence: '获得理解，信任度+5%', trustChange: 5, clueReveal: false },
            { text: '直接哭出来', consequence: '签证官也不知怎么办，信任度-5%', trustChange: -5, clueReveal: false }
        ],
        officerChoices: [
            { text: '暂停审核，递水安慰', consequence: '申请人恢复平静，信任+5%', trustChange: 5, clueReveal: false },
            { text: '怀疑是否在博取同情', consequence: '继续观察，可能出现破绽', trustChange: 0, clueReveal: true },
            { text: '加快节奏结束面试', consequence: '审核不够充分，信任不变', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'officer_bad_mood',
        title: '🎉 签证官心情不好',
        applicantDesc: '签证官今天喝咖啡塞牙了，看起来心情很差，标准会更严',
        officerDesc: '你自己今天喝咖啡塞牙了，看起来心情很差，注意要用更严的标准',
        applicantChoices: [
            { text: '小心回答', consequence: '尽量表现得谨慎恭敬', trustChange: 0, clueReveal: false },
            { text: '讲个笑话缓和气氛', consequence: '50%成功，成功则信任+10%，失败信任-15%', trustChange: 0, clueReveal: false, risky: true }
        ],
        officerChoices: [
            { text: '调整心态，专业审核', consequence: '恢复正常状态，无影响', trustChange: 0, clueReveal: false },
            { text: '迁怒于申请人，提高标准', consequence: '可能误判，但已发生', trustChange: -5, clueReveal: false },
            { text: '深呼吸后继续', consequence: '状态改善，无明显影响', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'system_error',
        title: '🌪️ 系统故障',
        applicantDesc: '签证官说"哎呀我的键盘漏水了"，要求补交一份材料',
        officerDesc: '你说"哎呀我的键盘漏水了"，要求申请人补交一份材料',
        applicantChoices: [
            { text: '配合补交', consequence: '提供了一份新材料，可能是假的', trustChange: 0, clueReveal: true },
            { text: '询问补什么材料', consequence: '得到指示后提交', trustChange: 0, clueReveal: false }
        ],
        officerChoices: [
            { text: '重新输入或用手写代替', consequence: '继续审核流程，无影响', trustChange: 0, clueReveal: false },
            { text: '趁机观察申请人反应', consequence: '发现异常，暴露线索', trustChange: 0, clueReveal: true },
            { text: '让申请人稍等', consequence: '暂停期间思考审核策略', trustChange: 0, clueReveal: false }
        ]
    },
    {
        id: 'immigration_check',
        title: '👮 移民局突击检查',
        applicantDesc: '移民局官员突然出现在后台，本局游戏标准临时提高',
        officerDesc: '移民局官员突然出现在后台，上级要求加强审查标准',
        applicantChoices: [
            { text: '更努力表现', consequence: '下两轮答题答案要求更高', trustChange: 0, clueReveal: false },
            { text: '有点慌', consequence: '紧张度+20%', trustChange: 0, clueReveal: false }
        ],
        officerChoices: [
            { text: '严格执行，不留情面', consequence: '审核更严格，但公平', trustChange: 0, clueReveal: false },
            { text: '适度宽松，避免压力过大', consequence: '申请人感激，信任+3%', trustChange: 3, clueReveal: false },
            { text: '借机向领导展示能力', consequence: '可能过于严格，出现偏差', trustChange: -5, clueReveal: false }
        ]
    },
    {
        id: 'gossip_hear',
        title: '📻 听到八卦',
        applicantDesc: '签证官听到隔壁在传某个案例被通过了，若有所思',
        officerDesc: '你听到隔壁在传某个案例被通过了，若有所思',
        applicantChoices: [
            { text: '趁机争取', consequence: '表达自己同样值得通过，信任度+5%', trustChange: 5, clueReveal: false },
            { text: '保持沉默', consequence: '无明显变化', trustChange: 0, clueReveal: false }
        ],
        officerChoices: [
            { text: '思考自己的审核标准', consequence: '更加坚定判断，无明显影响', trustChange: 0, clueReveal: false },
            { text: '产生对比心理，更严格要求', consequence: '申请人表现需更优秀', trustChange: -3, clueReveal: false },
            { text: '与同事交流经验', consequence: '获取有用信息，提升审核质量', trustChange: 0, clueReveal: true }
        ]
    },
    {
        id: 'recommendation_drop',
        title: '🎁 意外助力',
        applicantDesc: '你口袋掉出一份推荐信，看起来像是有分量的人写的',
        officerDesc: '申请人的口袋掉出一份推荐信，看起来像是有分量的人写的',
        applicantChoices: [
            { text: '赶紧捡起来', consequence: '签证官已经瞥了一眼，可能对或可能更怀疑', trustChange: 0, clueReveal: true },
            { text: '主动说明是谁的推荐', consequence: '如果是真的信任+10%', trustChange: 10, clueReveal: false }
        ],
        officerChoices: [
            { text: '查看推荐信并核实身份', consequence: '验证真伪，暴露线索', trustChange: 0, clueReveal: true },
            { text: '假装没看到', consequence: '继续观察申请人反应', trustChange: 0, clueReveal: true },
            { text: '让申请人解释推荐信', consequence: '从回答中发现破绽或确认可信度', trustChange: 0, clueReveal: true }
        ]
    }
];
