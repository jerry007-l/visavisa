// 申请人身份池 - IDENTITY_POOL 为应拒签身份，INNOCENT_POOL 为可过签身份
const IDENTITY_POOL = [
    {
        id: 'fugitive',
        name: '逃犯潜逃',
        icon: '🚔',
        reason: '国内有案底，来美国避风头',
        clues: ['材料中有伪造公章', '答题时避免谈及过去工作经历', '听到警察会明显紧张'],
        difficulty: 3,
        description: '高危：刑事逃犯'
    },
    {
        id: 'illegal_worker',
        name: '非法移民预定',
        icon: '💀',
        reason: '准备打了黑工',
        clues: ['无法说清工作计划', '对目的地城市异常熟悉', '携带大量生活用品而非旅行装备'],
        difficulty: 2,
        description: '高危：意图务工'
    },
    {
        id: 'fraudster',
        name: '诈骗惯犯',
        icon: '🧊',
        reason: '专门骗美国医保',
        clues: ['年龄集中在60岁以上', '声称有病但拒绝体检', '材料过于完美无懈可击'],
        difficulty: 2,
        description: '高危：医保诈骗'
    },
    {
        id: 'impersonator',
        name: '冒牌货',
        icon: '🎭',
        reason: '顶替他人身份',
        clues: ['照片与本人不太像但自称很像', '个人信息回答迟疑', '护照有轻微修改痕迹'],
        difficulty: 3,
        description: '高危：身份造假'
    },
    {
        id: 'shell_company',
        name: '空壳公司',
        icon: '🕳️',
        reason: '伪造工作邀请',
        clues: ['公司名称模糊说不清业务', '对职位内容一知半解', '邀请函邮箱是免费的'],
        difficulty: 2,
        description: '中危：工作邀请造假'
    },
    {
        id: 'foodie',
        name: '吃货狂魔',
        icon: '🍜',
        reason: '就是要去尝快餐',
        clues: ['说不清正式目的只说吃', '对美国食物如数家珍', '携带巨大行李箱准备采购'],
        difficulty: 1,
        description: '搞笑：美食探险家'
    },
    {
        id: 'drama_fan',
        name: '追剧狂热粉',
        icon: '📺',
        reason: '要去片场蹲偶像',
        clues: ['能说多个美剧角色', '计划中包含好莱坞元素', '携带专业摄影设备'],
        difficulty: 1,
        description: '搞笑：追星族'
    },
    {
        id: 'sports_ignorant',
        name: '运动白痴',
        icon: '🏈',
        reason: '从来没看过NBA非要去看球赛',
        clues: ['分不清主场客队', '对球队一无所知', '买了最贵票价但坐错区'],
        difficulty: 1,
        description: '搞笑：假装体育迷'
    },
    {
        id: 'panda_lover',
        name: '熊猫崇拜者',
        icon: '🐷',
        reason: '就是想去动物园看大熊猫（但美国没熊猫）',
        clues: ['反复询问熊猫馆位置', '听不懂其他景点介绍只关心熊猫', '携带大量竹子备用'],
        difficulty: 1,
        description: '搞笑：认知偏差'
    },
    {
        id: 'hip_hop_dreamer',
        name: '嘻哈梦想家',
        icon: '🎵',
        reason: '觉得自己能成名Rapper',
        clues: ['随身带着歌词本', '路上都在freestyle', '带来了一首自写的歌准备showcase'],
        difficulty: 1,
        description: '搞笑：自我认知偏差'
    },
    {
        id: 'over_spender',
        name: '月光族',
        icon: '💸',
        reason: '身无分文想赴美打工还债',
        clues: ['资金证明是刚借的', '银行流水最近突然暴涨', '说不出资金来源'],
        difficulty: 2,
        description: '高危：经济状况可疑'
    },
    {
        id: 'fake_engaged',
        name: '假单身',
        icon: '💍',
        reason: '隐瞒婚史赴美有结婚对象',
        clues: ['提到未婚夫/妻时眼神闪烁', '手机里全是情侣照片但不愿展示', '婚礼计划细节矛盾'],
        difficulty: 2,
        description: '中危：移民倾向明显'
    },
    {
        id: 'academic_fraud',
        name: '学术骗子',
        icon: '🎓',
        reason: '学历文凭全买的外包',
        clues: ['对自己专业细节一问就露馅', '成绩单学校名字和实际不符', '学术术语装懂'],
        difficulty: 2,
        description: '中危：学术造假'
    },
    {
        id: 'tourist_fake',
        name: '行程编造王',
        icon: '🗺️',
        reason: '整个行程都是临时编的',
        clues: ['说不清第一天去哪', '酒店订单是随便选的', '对景点名称理解离谱'],
        difficulty: 1,
        description: '中危：计划混乱'
    },
    {
        id: 'insurance_risk',
        name: '保险漏洞患者',
        icon: '📋',
        reason: '旅行保险是假货',
        clues: ['保险公司查不到记录', '保单号码格式不对', '被保险人不是自己'],
        difficulty: 2,
        description: '中危：保险造假'
    },
    {
        id: 'family_secret',
        name: '家庭秘密',
        icon: '👨‍👩‍👧',
        reason: '隐瞒家庭成员在美国的事实',
        clues: ['表填独生但朋友圈有家庭合照', '被问到家人反应激烈', '紧急联系人信息矛盾'],
        difficulty: 2,
        description: '高危：隐瞒关系'
    },
    {
        id: 'vague_plan',
        name: '无头苍蝇',
        icon: '😵',
        reason: '到底要去哪干什么完全不清楚',
        clues: ['连机场名都说不对', '不知道要去的城市在哪', '说是朋友带但没见过面'],
        difficulty: 1,
        description: '低危：纯纯迷糊'
    },
    {
        id: 'tech_scam',
        name: '诈骗电诈',
        icon: '📱',
        reason: '受邀加入美国电信诈骗分公司',
        clues: ['高薪工作令人怀疑', '面试全程线上未见面', '公司对业务含糊其辞'],
        difficulty: 3,
        description: '高危：涉诈'
    },
    {
        id: 'medical_tourist',
        name: '医疗游客',
        icon: '🏥',
        reason: '隐瞒真实医疗目的赴美手术',
        clues: ['带来的材料是旅游但频繁看病', '对医疗保险夸大其词', '医生电话打不通'],
        difficulty: 2,
        description: '高危：目的不符'
    },
    {
        id: 're_entry_ban',
        name: '逾期前科',
        icon: '⚠️',
        reason: '上次签证逾期过这次又想混',
        clues: ['过往入境记录可查', '对之前逾期解释不清', '神色慌张被问到Past travel'],
        difficulty: 3,
        description: '高危：不良记录'
    },
    {
        id: 'useless_skill',
        name: '无用技能大师',
        icon: '🤹',
        reason: '学会翻纸牌就想赴美表演谋生',
        clues: ['引以为傲的技能毫无市场竞争力', '坚信自己能成艺术家', '带来几吨重的道具'],
        difficulty: 1,
        description: '搞笑：天真过头'
    },
    {
        id: 'crypto_believer',
        name: '币圈韭菜',
        icon: '₿',
        reason: '被骗投资传销准备跑路',
        clues: ['带来一堆加密货币设备', '说出的项目名都很荒谬', '账户金额是天价但实际上是盘'],
        difficulty: 2,
        description: '中危：卷入传销'
    }
];

// 清白申请人池 - 这些人是真的可以过签的
const INNOCENT_POOL = [
    {
        id: 'real_tourist',
        name: '纯观光游客',
        icon: '📷',
        reason: '攒了年假就想去玩一圈',
        clues: ['行程单详细到每个小时', '酒店预订与机票日期完全吻合', '能说出想去的景点开放时间'],
        difficulty: 1,
        description: '正常：真实旅游目的'
    },
    {
        id: 'grad_student',
        name: '真·留学读研',
        icon: '🎓',
        reason: '拿到了正规学校的录取',
        clues: ['I-20表格与录取信学校一致', '能准确说出导师姓名和研究方向', '学费由奖学金覆盖且有凭证'],
        difficulty: 1,
        description: '正常：合法留学'
    },
    {
        id: 'business_trip',
        name: '正常商务出差',
        icon: '💼',
        reason: '公司派遣去参加展会',
        clues: ['邀请函来自可查证的企业域名邮箱', '出差日程与国内项目排期吻合', '往返机票与展会日期严格对应'],
        difficulty: 1,
        description: '正常：企业派遣'
    },
    {
        id: 'conference_speaker',
        name: '学术会议主讲人',
        icon: '🎤',
        reason: '受邀去做学术报告',
        clues: ['会议官网能查到其报告日程', '论文在公开数据库可检索', '主办方承担了全部差旅费用'],
        difficulty: 1,
        description: '正常：学术交流'
    },
    {
        id: 'family_reunion',
        name: '合法探亲',
        icon: '💒',
        reason: '去参加表姐的婚礼',
        clues: ['婚礼请柬与亲属关系公证齐全', '探亲对象身份合法且已入籍', '明确表示婚礼结束后返岗'],
        difficulty: 2,
        description: '正常：但有亲属在美，需排除移民倾向'
    },
    {
        id: 'exchange_teacher',
        name: '交换教师',
        icon: '🏫',
        reason: '两校交换项目派出的讲师',
        clues: ['两校交换协议在有效期内', '国内学校保留了其教职', '访问时长与协议约定一致'],
        difficulty: 1,
        description: '正常：机构派遣'
    },
    {
        id: 'legit_medical',
        name: '正规就医预约',
        icon: '🩺',
        reason: '按预约去做一次专科检查',
        clues: ['医院预约函与医生执照都可查证', '费用已全额预付并留有收据', '国内有连续社保与在职证明'],
        difficulty: 2,
        description: '正常：目的真实，但医疗签证易被冒充'
    },
    {
        id: 'marathon_runner',
        name: '马拉松参赛者',
        icon: '🏃',
        reason: '报名了纽约马拉松',
        clues: ['赛事报名确认函带唯一编号', '往期完赛成绩在官网可查', '订了赛后第二天的返程航班'],
        difficulty: 1,
        description: '正常：体育赛事'
    },
    {
        id: 'freelance_photographer',
        name: '自由行摄影师',
        icon: '🌄',
        reason: '去拍风光片供稿给杂志',
        clues: ['器材申报清单完整合规', '有往期作品与约稿合同', '行程全部围绕公开景点安排'],
        difficulty: 2,
        description: '正常：但自由职业收入不稳定，容易看错'
    }
];

// IdentityPool 模块
const IdentityPool = {
    identities: [
        ...IDENTITY_POOL.map(identity => ({ ...identity, guilty: true })),
        ...INNOCENT_POOL.map(identity => ({ ...identity, guilty: false }))
    ],
    
    getRandom() {
        const randomIndex = Math.floor(Math.random() * this.identities.length);
        return this.identities[randomIndex];
    },
    
    getById(id) {
        return this.identities.find(i => i.id === id);
    },
    
    getByDifficulty(difficulty) {
        return this.identities.filter(i => i.difficulty === difficulty);
    },
    
    getByGuilt(guilty) {
        return this.identities.filter(i => i.guilty === guilty);
    }
};
