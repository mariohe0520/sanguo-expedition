// 三国·天命 — Skill Tree System (天赋树)
// 3 branches per hero, 5 nodes per branch, ultimate at node 5

const SkillTree = {

  // ===== HERO-SPECIFIC TREES =====
  TREES: {
    zhaoyun: {
      branches: [
        { id:'charge', name:'冲锋', icon:'🐴', desc:'突击与机动',
          nodes: [
            { name:'疾驰', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'破阵', desc:'ATK+8%', stat:{atk_pct:8} },
            { name:'追风', desc:'闪避+12%', stat:{dodge_pct:12} },
            { name:'穿透', desc:'无视15%防御', stat:{armor_pen_pct:15} },
            { name:'【极】龙骑冲锋', desc:'终结技：对全体250%ATK，无视50%防御', ultimate:'dragon_charge' },
          ]},
        { id:'dragon', name:'龙胆', icon:'🐉', desc:'攻击与暴击',
          nodes: [
            { name:'龙吟', desc:'ATK+12%', stat:{atk_pct:12} },
            { name:'龙鳞', desc:'暴击率+10%', stat:{crit_pct:10} },
            { name:'龙息', desc:'暴击伤害+25%', stat:{crit_dmg_pct:25} },
            { name:'龙魂', desc:'击杀回复30%怒气', special:'rage_on_kill' },
            { name:'【极】七进七出·真', desc:'终结技：无敌2回合+全体200%ATK+暴击', ultimate:'true_seven' },
          ]},
        { id:'guardian', name:'守护', icon:'🛡️', desc:'防御与生存',
          nodes: [
            { name:'铁壁', desc:'DEF+12%', stat:{def_pct:12} },
            { name:'坚韧', desc:'HP+15%', stat:{hp_pct:15} },
            { name:'护卫', desc:'受伤时25%概率格挡50%伤害', special:'block_chance' },
            { name:'不屈', desc:'首次致死时保留1HP', special:'undying_once' },
            { name:'【极】常山之盾', desc:'终结技：全队无敌1回合+回复40%HP', ultimate:'changshan_shield' },
          ]},
      ]
    },
    guanyu: {
      branches: [
        { id:'valor', name:'武勇', icon:'⚔️', desc:'纯粹攻击',
          nodes: [
            { name:'刚猛', desc:'ATK+15%', stat:{atk_pct:15} },
            { name:'斩击', desc:'暴击率+8%', stat:{crit_pct:8} },
            { name:'威压', desc:'攻击降低目标ATK 10% 2回合', special:'atk_debuff_on_hit' },
            { name:'破军', desc:'对HP>50%目标伤害+20%', special:'high_hp_bonus' },
            { name:'【极】温酒斩华雄', desc:'终结技：单体500%ATK必暴击', ultimate:'wine_slash' },
          ]},
        { id:'crescent', name:'青龙', icon:'🌙', desc:'技能强化',
          nodes: [
            { name:'月华', desc:'INT+10%', stat:{int_pct:10} },
            { name:'龙牙', desc:'技能伤害+15%', stat:{skill_dmg_pct:15} },
            { name:'偃月', desc:'怒气获取+20%', special:'rage_gain_bonus' },
            { name:'寒光', desc:'技能命中后降低目标DEF 20%', special:'skill_def_break' },
            { name:'【极】青龙偃月·极', desc:'终结技：对单体350%ATK+全体150%ATK', ultimate:'crescent_extreme' },
          ]},
        { id:'oath', name:'忠义', icon:'🤝', desc:'团队增益',
          nodes: [
            { name:'义气', desc:'HP+10%', stat:{hp_pct:10} },
            { name:'兄弟', desc:'蜀将在队ATK+8%', stat:{faction_shu_atk:8} },
            { name:'结义', desc:'队友受攻时15%概率代替承受', special:'cover_ally' },
            { name:'桃园', desc:'HP<30%时全队ATK+15%', special:'low_hp_team_buff' },
            { name:'【极】忠义千秋', desc:'终结技：复活一名阵亡队友(50%HP)', ultimate:'revive_ally' },
          ]},
      ]
    },
    liubei: {
      branches: [
        { id:'mercy', name:'仁德', icon:'❤️', desc:'治疗强化',
          nodes: [
            { name:'仁慈', desc:'治疗效果+15%', stat:{heal_pct:15} },
            { name:'德行', desc:'INT+10%', stat:{int_pct:10} },
            { name:'安民', desc:'回合开始回复全队3%HP', special:'team_regen' },
            { name:'救济', desc:'治疗时额外清除1个debuff', special:'heal_cleanse' },
            { name:'【极】仁德天下', desc:'终结技：全队回复50%HP+ATK/DEF+25% 3回合', ultimate:'mercy_world' },
          ]},
        { id:'command', name:'统帅', icon:'👑', desc:'指挥增益',
          nodes: [
            { name:'号令', desc:'全队SPD+8%', stat:{team_spd_pct:8} },
            { name:'激励', desc:'全队ATK+5%', stat:{team_atk_pct:5} },
            { name:'鼓舞', desc:'每回合随机1队友+15%ATK 1回合', special:'random_buff' },
            { name:'统御', desc:'全队暴击率+8%', stat:{team_crit_pct:8} },
            { name:'【极】帝王之令', desc:'终结技：全队全属性+30% 3回合', ultimate:'emperor_decree' },
          ]},
        { id:'shield_lord', name:'盾主', icon:'🛡️', desc:'防御坦克',
          nodes: [
            { name:'铜墙', desc:'DEF+15%', stat:{def_pct:15} },
            { name:'铁壁', desc:'HP+20%', stat:{hp_pct:20} },
            { name:'嘲讽', desc:'50%概率吸引敌人攻击', special:'taunt' },
            { name:'反击', desc:'被攻击时30%反击', special:'counter_30' },
            { name:'【极】汉室之盾', desc:'终结技：自身DEF+100% 3回合+嘲讽全体', ultimate:'han_shield' },
          ]},
      ]
    },
    zhangfei: {
      branches: [
        { id:'fury', name:'暴怒', icon:'😤', desc:'攻击与控制',
          nodes: [
            { name:'怒火', desc:'ATK+12%', stat:{atk_pct:12} },
            { name:'咆哮', desc:'眩晕概率+15%', stat:{stun_chance_pct:15} },
            { name:'震慑', desc:'攻击时20%概率眩晕1回合', special:'stun_on_hit' },
            { name:'狂暴', desc:'HP<50%时ATK+30%', special:'low_hp_atk_boost' },
            { name:'【极】万夫不当', desc:'终结技：全体200%ATK+眩晕2回合', ultimate:'unstoppable' },
          ]},
        { id:'thunder', name:'雷霆', icon:'⚡', desc:'爆发伤害',
          nodes: [
            { name:'蛮力', desc:'暴击伤害+20%', stat:{crit_dmg_pct:20} },
            { name:'雷击', desc:'暴击率+12%', stat:{crit_pct:12} },
            { name:'连击', desc:'普攻20%概率攻击两次', special:'double_strike' },
            { name:'破甲', desc:'攻击无视20%防御', stat:{armor_pen_pct:20} },
            { name:'【极】怒吼天地', desc:'终结技：单体400%ATK+破甲50%+眩晕', ultimate:'heaven_roar' },
          ]},
        { id:'taunt', name:'嘲讽', icon:'🗣️', desc:'坦克与控制',
          nodes: [
            { name:'虎威', desc:'HP+15%', stat:{hp_pct:15} },
            { name:'铁身', desc:'DEF+10%', stat:{def_pct:10} },
            { name:'嘲讽', desc:'60%概率吸引攻击', special:'taunt_60' },
            { name:'怒反', desc:'被攻击时50%反击80%ATK', special:'counter_50' },
            { name:'【极】当阳桥', desc:'终结技：嘲讽全体3回合+反弹30%伤害', ultimate:'changban_bridge' },
          ]},
      ]
    },
    caocao: {
      branches: [
        { id:'ambition', name:'雄心', icon:'🖤', desc:'统帅增益',
          nodes: [
            { name:'野心', desc:'ATK+10%', stat:{atk_pct:10} },
            { name:'求贤', desc:'全队INT+8%', stat:{team_int_pct:8} },
            { name:'号令', desc:'buff持续+1回合', special:'buff_duration_up' },
            { name:'天子', desc:'全队ATK buff效果+20%', special:'buff_amplify' },
            { name:'【极】挟天子令诸侯', desc:'终结技：全队ATK+40%/DEF+20% 4回合', ultimate:'mandate_heaven' },
          ]},
        { id:'scheme', name:'谋略', icon:'🧠', desc:'debuff控制',
          nodes: [
            { name:'机敏', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'诡计', desc:'debuff效果+15%', stat:{debuff_amp_pct:15} },
            { name:'离间', desc:'攻击时15%概率使目标攻击队友', special:'confuse_on_hit' },
            { name:'瓦解', desc:'每回合降低全体敌人随机属性5%', special:'erosion' },
            { name:'【极】奸雄之计', desc:'终结技：全体敌人-30%全属性 3回合', ultimate:'villain_scheme' },
          ]},
        { id:'lord', name:'霸主', icon:'👑', desc:'生存与支配',
          nodes: [
            { name:'霸气', desc:'HP+12%', stat:{hp_pct:12} },
            { name:'吸血', desc:'造成伤害回复10%HP', special:'lifesteal_10' },
            { name:'威慑', desc:'敌人攻击自己-10%伤害', stat:{dmg_reduce_pct:10} },
            { name:'不死', desc:'致死时50%概率存活(1HP)', special:'cheat_death' },
            { name:'【极】乱世枭雄', desc:'终结技：偷取全体敌人20%ATK给自己', ultimate:'steal_power' },
          ]},
      ]
    },
    lvbu: {
      branches: [
        { id:'rampage', name:'无双', icon:'💥', desc:'极限攻击',
          nodes: [
            { name:'霸力', desc:'ATK+18%', stat:{atk_pct:18} },
            { name:'嗜血', desc:'暴击率+15%', stat:{crit_pct:15} },
            { name:'杀意', desc:'每击杀ATK+10%(可叠加)', special:'kill_stack_atk' },
            { name:'毁灭', desc:'暴击伤害+40%', stat:{crit_dmg_pct:40} },
            { name:'【极】天下无双', desc:'终结技：单体600%ATK 无视防御', ultimate:'peerless' },
          ]},
        { id:'halberd', name:'画戟', icon:'🔱', desc:'武器精通',
          nodes: [
            { name:'锋刃', desc:'ATK+10%', stat:{atk_pct:10} },
            { name:'横扫', desc:'普攻溅射30%伤害给相邻', special:'cleave_30' },
            { name:'贯穿', desc:'无视25%防御', stat:{armor_pen_pct:25} },
            { name:'旋风', desc:'技能伤害+25%', stat:{skill_dmg_pct:25} },
            { name:'【极】方天画戟·真', desc:'终结技：全体300%ATK+30%概率即死', ultimate:'true_halberd' },
          ]},
        { id:'berserker', name:'狂战', icon:'🔥', desc:'赌命爆发',
          nodes: [
            { name:'狂怒', desc:'SPD+12%', stat:{spd_pct:12} },
            { name:'嗜杀', desc:'造成伤害回复8%HP', special:'lifesteal_8' },
            { name:'血祭', desc:'消耗10%HP,ATK+25%', special:'blood_sacrifice' },
            { name:'不灭', desc:'HP<20%时免疫控制', special:'cc_immune_low_hp' },
            { name:'【极】修罗', desc:'终结技：3回合ATK+80%但每回合失10%HP', ultimate:'asura' },
          ]},
      ]
    },
    sunshangxiang: {
      branches: [
        { id:'precision', name:'精准', icon:'🎯', desc:'暴击专精',
          nodes: [
            { name:'瞄准', desc:'暴击率+12%', stat:{crit_pct:12} },
            { name:'穿心', desc:'暴击伤害+20%', stat:{crit_dmg_pct:20} },
            { name:'弱点', desc:'暴击时无视30%防御', special:'crit_armor_pen' },
            { name:'致命', desc:'暴击时20%概率双倍暴伤', special:'mega_crit' },
            { name:'【极】百步穿杨·极', desc:'终结技：对单体300%ATK 必暴击+暴伤x3', ultimate:'perfect_shot' },
          ]},
        { id:'volley', name:'连射', icon:'🏹', desc:'多段攻击',
          nodes: [
            { name:'速射', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'双箭', desc:'普攻额外一次50%伤害', special:'double_shot' },
            { name:'箭雨', desc:'攻击时30%概率溅射', special:'splash_30' },
            { name:'弹幕', desc:'技能额外攻击+2次', special:'extra_hits' },
            { name:'【极】万箭齐发', desc:'终结技：全体5次80%ATK攻击', ultimate:'arrow_storm' },
          ]},
        { id:'agility', name:'灵巧', icon:'💨', desc:'闪避与机动',
          nodes: [
            { name:'轻身', desc:'闪避+10%', stat:{dodge_pct:10} },
            { name:'疾步', desc:'SPD+8%', stat:{spd_pct:8} },
            { name:'残影', desc:'闪避后反击100%ATK', special:'dodge_counter' },
            { name:'风行', desc:'每回合15%概率额外行动', special:'extra_turn_15' },
            { name:'【极】巾帼无双', desc:'终结技：3回合闪避+50%+每次闪避反击', ultimate:'heroine' },
          ]},
      ]
    },
    zhangjiao: {
      branches: [
        { id:'thunder_path', name:'天雷', icon:'⚡', desc:'雷电法术',
          nodes: [
            { name:'蓄电', desc:'INT+12%', stat:{int_pct:12} },
            { name:'雷鸣', desc:'法术伤害+15%', stat:{skill_dmg_pct:15} },
            { name:'感电', desc:'法术命中20%概率眩晕1回合', special:'magic_stun' },
            { name:'连锁', desc:'法术溅射50%伤害给相邻', special:'magic_chain' },
            { name:'【极】天罚', desc:'终结技：全体250%INT+30%概率眩晕2回合', ultimate:'heaven_punishment' },
          ]},
        { id:'plague', name:'瘟疫', icon:'☠️', desc:'持续伤害',
          nodes: [
            { name:'毒素', desc:'INT+8%', stat:{int_pct:8} },
            { name:'腐蚀', desc:'攻击附加DoT(5%INT/回合 3回合)', special:'poison_dot' },
            { name:'传染', desc:'DoT扩散至相邻单位', special:'dot_spread' },
            { name:'虚弱', desc:'受DoT影响的目标-15%DEF', special:'dot_def_break' },
            { name:'【极】黄天之怒', desc:'终结技：全体DoT(15%INT/回合) 5回合', ultimate:'yellow_sky' },
          ]},
        { id:'faith', name:'太平', icon:'🙏', desc:'辅助与恢复',
          nodes: [
            { name:'信仰', desc:'HP+15%', stat:{hp_pct:15} },
            { name:'祈祷', desc:'回合开始回复5%HP', stat:{regen_pct:5} },
            { name:'庇护', desc:'全队受法术伤害-15%', special:'magic_resist_team' },
            { name:'复苏', desc:'治疗效果+25%', stat:{heal_pct:25} },
            { name:'【极】太平道法', desc:'终结技：全队回复40%HP+免疫debuff 2回合', ultimate:'taiping' },
          ]},
      ]
    },
    diaochan: {
      branches: [
        { id:'charm_path', name:'魅惑', icon:'💋', desc:'控制专精',
          nodes: [
            { name:'倾城', desc:'INT+10%', stat:{int_pct:10} },
            { name:'迷惑', desc:'魅惑持续+1回合', special:'charm_duration_up' },
            { name:'离间', desc:'被魅惑的目标攻击力+20%(打队友更痛)', special:'charm_amplify' },
            { name:'绝色', desc:'被攻击时25%概率魅惑攻击者1回合', special:'passive_charm' },
            { name:'【极】闭月羞花', desc:'终结技：全体敌人魅惑2回合+INT-30%', ultimate:'beauty_ultimate' },
          ]},
        { id:'moon', name:'月影', icon:'🌙', desc:'法术输出',
          nodes: [
            { name:'月光', desc:'INT+15%', stat:{int_pct:15} },
            { name:'银辉', desc:'法术伤害+12%', stat:{skill_dmg_pct:12} },
            { name:'幻象', desc:'法术攻击时创造分身承受1次伤害', special:'mirror_image' },
            { name:'月蚀', desc:'法术命中降低目标INT 20%', special:'int_steal' },
            { name:'【极】月华天舞', desc:'终结技：全体180%INT+降低全属性20%', ultimate:'moon_dance' },
          ]},
        { id:'shadow', name:'暗影', icon:'🌑', desc:'闪避与生存',
          nodes: [
            { name:'隐身', desc:'闪避+15%', stat:{dodge_pct:15} },
            { name:'幻步', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'影遁', desc:'HP<40%时闪避+30%', special:'emergency_dodge' },
            { name:'虚影', desc:'闪避时回复5%HP', special:'dodge_heal' },
            { name:'【极】暗影之舞', desc:'终结技：3回合完全隐身(不可被指定)+每回合INT伤害', ultimate:'shadow_dance' },
          ]},
      ]
    },
    huangzhong: {
      branches: [
        { id:'sniper', name:'神射', icon:'🎯', desc:'精准打击',
          nodes: [
            { name:'锐眼', desc:'暴击率+15%', stat:{crit_pct:15} },
            { name:'致命一击', desc:'暴击伤害+30%', stat:{crit_dmg_pct:30} },
            { name:'必中', desc:'无视闪避', special:'ignore_dodge' },
            { name:'贯穿', desc:'暴击时穿透至后排', special:'crit_pierce' },
            { name:'【极】定军斩将', desc:'终结技：单体450%ATK 必暴击+无视防御', ultimate:'dingjun_slash' },
          ]},
        { id:'veteran', name:'老将', icon:'⏳', desc:'持久战',
          nodes: [
            { name:'经验', desc:'ATK+8%', stat:{atk_pct:8} },
            { name:'老练', desc:'每3回合ATK+10%(可叠加)', special:'veteran_stack' },
            { name:'沉稳', desc:'受暴击伤害-25%', stat:{crit_resist_pct:25} },
            { name:'意志', desc:'回合>5后全属性+15%', special:'late_game_boost' },
            { name:'【极】老当益壮', desc:'终结技：ATK永久+50%+3回合必暴击', ultimate:'eternal_vigor' },
          ]},
        { id:'steadfast', name:'坚守', icon:'🏰', desc:'防御弓手',
          nodes: [
            { name:'坚定', desc:'DEF+10%', stat:{def_pct:10} },
            { name:'铁弓', desc:'HP+12%', stat:{hp_pct:12} },
            { name:'据守', desc:'不移动时ATK+15%', special:'stationary_bonus' },
            { name:'反击箭', desc:'被攻击时40%概率反击', special:'counter_40' },
            { name:'【极】磐石射手', desc:'终结技：DEF+50% 3回合+反击必暴击', ultimate:'fortress_archer' },
          ]},
      ]
    },
  },

  // ===== ARCHETYPE TEMPLATES =====
  ARCHETYPES: {
    cavalry: {
      branches: [
        { id:'rush', name:'冲锋', icon:'🐴',
          nodes: [
            { name:'疾驰', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'突击', desc:'ATK+10%', stat:{atk_pct:10} },
            { name:'践踏', desc:'攻击时15%概率眩晕', special:'stun_on_hit_15' },
            { name:'穿刺', desc:'无视15%防御', stat:{armor_pen_pct:15} },
            { name:'【极】铁骑冲锋', desc:'终结技：全体180%ATK', ultimate:'cavalry_charge' },
          ]},
        { id:'strike', name:'打击', icon:'⚔️',
          nodes: [
            { name:'锋利', desc:'暴击率+10%', stat:{crit_pct:10} },
            { name:'重击', desc:'暴击伤害+20%', stat:{crit_dmg_pct:20} },
            { name:'连斩', desc:'击杀回复20%怒气', special:'rage_on_kill_20' },
            { name:'破军', desc:'ATK+12%', stat:{atk_pct:12} },
            { name:'【极】致命打击', desc:'终结技：单体350%ATK必暴击', ultimate:'lethal_strike' },
          ]},
        { id:'armor', name:'护甲', icon:'🛡️',
          nodes: [
            { name:'坚韧', desc:'DEF+10%', stat:{def_pct:10} },
            { name:'强壮', desc:'HP+12%', stat:{hp_pct:12} },
            { name:'吸血', desc:'造成伤害回复8%HP', special:'lifesteal_8' },
            { name:'铁壁', desc:'受伤-10%', stat:{dmg_reduce_pct:10} },
            { name:'【极】不倒战骑', desc:'终结技：3回合DEF+50%+回复20%HP/回合', ultimate:'iron_rider' },
          ]},
      ]
    },
    spear: {
      branches: [
        { id:'formation', name:'阵型', icon:'🔱',
          nodes: [
            { name:'列阵', desc:'DEF+12%', stat:{def_pct:12} },
            { name:'枪林', desc:'ATK+8%', stat:{atk_pct:8} },
            { name:'反骑', desc:'对骑兵伤害+25%', special:'anti_cavalry' },
            { name:'长枪', desc:'反击伤害+30%', stat:{counter_dmg_pct:30} },
            { name:'【极】枪阵无双', desc:'终结技：前排250%ATK+DEF+30% 2回合', ultimate:'spear_wall' },
          ]},
        { id:'pierce', name:'穿刺', icon:'🗡️',
          nodes: [
            { name:'锐枪', desc:'ATK+12%', stat:{atk_pct:12} },
            { name:'刺穿', desc:'无视15%防御', stat:{armor_pen_pct:15} },
            { name:'连刺', desc:'普攻20%概率双击', special:'double_strike_20' },
            { name:'致命', desc:'暴击率+10%', stat:{crit_pct:10} },
            { name:'【极】万枪齐发', desc:'终结技：全体200%ATK+破甲30%', ultimate:'pierce_all' },
          ]},
        { id:'fortify', name:'固守', icon:'🏰',
          nodes: [
            { name:'坚守', desc:'HP+15%', stat:{hp_pct:15} },
            { name:'盾墙', desc:'DEF+8%', stat:{def_pct:8} },
            { name:'嘲讽', desc:'40%概率吸引攻击', special:'taunt_40' },
            { name:'铁壁', desc:'受伤-12%', stat:{dmg_reduce_pct:12} },
            { name:'【极】铜墙铁壁', desc:'终结技：全队DEF+35% 3回合', ultimate:'fortress' },
          ]},
      ]
    },
    shield: {
      branches: [
        { id:'block', name:'格挡', icon:'🛡️',
          nodes: [
            { name:'铁盾', desc:'DEF+15%', stat:{def_pct:15} },
            { name:'格挡', desc:'25%概率格挡50%伤害', special:'block_25' },
            { name:'坚壁', desc:'HP+15%', stat:{hp_pct:15} },
            { name:'反弹', desc:'格挡时反弹20%伤害', special:'block_reflect' },
            { name:'【极】绝对防御', desc:'终结技：2回合伤害减免80%+反弹50%', ultimate:'absolute_defense' },
          ]},
        { id:'endure', name:'坚忍', icon:'💪',
          nodes: [
            { name:'耐力', desc:'HP+20%', stat:{hp_pct:20} },
            { name:'恢复', desc:'回合开始回复3%HP', stat:{regen_pct:3} },
            { name:'减伤', desc:'受伤-10%', stat:{dmg_reduce_pct:10} },
            { name:'不屈', desc:'致死时50%概率存活(1HP)', special:'cheat_death_50' },
            { name:'【极】不灭之躯', desc:'终结技：3回合每回合回复15%HP+免疫控制', ultimate:'immortal_body' },
          ]},
        { id:'rally', name:'号召', icon:'📢',
          nodes: [
            { name:'鼓舞', desc:'全队DEF+5%', stat:{team_def_pct:5} },
            { name:'守护', desc:'全队HP+5%', stat:{team_hp_pct:5} },
            { name:'嘲讽', desc:'60%概率吸引攻击', special:'taunt_60' },
            { name:'激励', desc:'被攻击时队友ATK+5% 1回合', special:'inspire_on_hit' },
            { name:'【极】钢铁号令', desc:'终结技：全队DEF+40%+反弹15%伤害 3回合', ultimate:'iron_command' },
          ]},
      ]
    },
    archer: {
      branches: [
        { id:'aim', name:'瞄准', icon:'🎯',
          nodes: [
            { name:'精准', desc:'暴击率+12%', stat:{crit_pct:12} },
            { name:'致命', desc:'暴击伤害+25%', stat:{crit_dmg_pct:25} },
            { name:'穿甲', desc:'无视15%防御', stat:{armor_pen_pct:15} },
            { name:'一击', desc:'暴击时额外30%伤害', special:'crit_bonus_30' },
            { name:'【极】神箭', desc:'终结技：单体400%ATK必暴击', ultimate:'god_arrow' },
          ]},
        { id:'speed', name:'速射', icon:'💨',
          nodes: [
            { name:'疾射', desc:'SPD+10%', stat:{spd_pct:10} },
            { name:'连射', desc:'ATK+8%', stat:{atk_pct:8} },
            { name:'双箭', desc:'普攻额外50%伤害', special:'double_shot_50' },
            { name:'箭雨', desc:'攻击30%概率溅射', special:'splash_30' },
            { name:'【极】万箭齐发', desc:'终结技：全体3次100%ATK', ultimate:'arrow_rain' },
          ]},
        { id:'trap', name:'陷阱', icon:'🪤',
          nodes: [
            { name:'设伏', desc:'闪避+10%', stat:{dodge_pct:10} },
            { name:'毒箭', desc:'攻击附加DoT 2回合', special:'poison_2' },
            { name:'减速', desc:'攻击降低目标SPD 15%', special:'slow_on_hit' },
            { name:'束缚', desc:'20%概率定身1回合', special:'root_20' },
            { name:'【极】天罗地网', desc:'终结技：全体敌人SPD-40%+定身1回合', ultimate:'snare_all' },
          ]},
      ]
    },
    mage: {
      branches: [
        { id:'blast', name:'爆破', icon:'💥',
          nodes: [
            { name:'聚能', desc:'INT+12%', stat:{int_pct:12} },
            { name:'强化', desc:'法术伤害+15%', stat:{skill_dmg_pct:15} },
            { name:'穿透', desc:'法术无视20%魔抗', special:'magic_pen_20' },
            { name:'超载', desc:'法术暴击率+15%', stat:{crit_pct:15} },
            { name:'【极】毁灭法术', desc:'终结技：全体250%INT', ultimate:'destruction' },
          ]},
        { id:'control', name:'控制', icon:'🌀',
          nodes: [
            { name:'冥想', desc:'INT+8%', stat:{int_pct:8} },
            { name:'减速', desc:'法术命中降SPD 15%', special:'slow_on_magic' },
            { name:'沉默', desc:'法术命中20%概率沉默2回合', special:'silence_20' },
            { name:'虚弱', desc:'被控制目标受伤+20%', special:'cc_vulnerability' },
            { name:'【极】法术封锁', desc:'终结技：全体沉默2回合+INT-25%', ultimate:'magic_lockdown' },
          ]},
        { id:'wisdom', name:'智慧', icon:'📚',
          nodes: [
            { name:'博学', desc:'HP+12%', stat:{hp_pct:12} },
            { name:'冥思', desc:'怒气获取+15%', special:'rage_gain_15' },
            { name:'灵盾', desc:'受物理伤害-15%', stat:{phys_reduce_pct:15} },
            { name:'智珠', desc:'回合开始回复5%HP', stat:{regen_pct:5} },
            { name:'【极】大智若愚', desc:'终结技：全队+25%全属性 2回合+回复30%HP', ultimate:'supreme_wisdom' },
          ]},
      ]
    },
  },

  // ===== API =====

  // Get the tree definition for a hero
  getTree(heroId) {
    if (this.TREES[heroId]) return this.TREES[heroId];
    // Use archetype template based on unit type
    const hero = HEROES[heroId];
    if (!hero) return null;
    return this.ARCHETYPES[hero.unit] || this.ARCHETYPES.spear;
  },

  // Get unlocked nodes for a hero: { branchId: [0,1,2,...] }
  getUnlocked(heroId) {
    return Storage.getSkillTreeState(heroId);
  },

  // Get available skill points
  getAvailablePoints(heroId) {
    const roster = Storage.getRoster();
    const data = roster[heroId];
    if (!data) return 0;
    const level = data.level || 1;
    const spent = this._getSpentPoints(heroId);
    return Math.max(0, level - spent);
  },

  _getSpentPoints(heroId) {
    const state = this.getUnlocked(heroId);
    let total = 0;
    for (const nodes of Object.values(state)) {
      total += nodes.length;
    }
    return total;
  },

  // Unlock a node
  unlockNode(heroId, branchIdx, nodeIdx) {
    const tree = this.getTree(heroId);
    if (!tree) return { error: '无天赋树' };
    const branch = tree.branches[branchIdx];
    if (!branch) return { error: '分支不存在' };
    if (nodeIdx >= branch.nodes.length) return { error: '节点不存在' };

    const available = this.getAvailablePoints(heroId);
    if (available <= 0) return { error: '天赋点不足！升级获得更多' };

    const state = this.getUnlocked(heroId);
    const branchId = branch.id;
    if (!state[branchId]) state[branchId] = [];

    // Must unlock in order
    if (nodeIdx > 0 && !state[branchId].includes(nodeIdx - 1)) {
      return { error: '需先解锁前置节点' };
    }
    if (state[branchId].includes(nodeIdx)) {
      return { error: '已解锁' };
    }

    state[branchId].push(nodeIdx);
    Storage.saveSkillTreeState(heroId, state);
    return { success: true, node: branch.nodes[nodeIdx] };
  },

  // Respec: reset all nodes, costs gold
  respec(heroId) {
    const spent = this._getSpentPoints(heroId);
    if (spent === 0) return { error: '没有已解锁的天赋' };
    const cost = spent * 200;
    const p = Storage.getPlayer();
    if (p.gold < cost) return { error: '金币不足 (需要' + cost + ')' };
    p.gold -= cost;
    Storage.savePlayer(p);
    Storage.saveSkillTreeState(heroId, {});
    return { success: true, refunded: spent, cost };
  },

  // Calculate total stat bonuses from skill tree
  getStatBonuses(heroId) {
    const tree = this.getTree(heroId);
    if (!tree) return {};
    const state = this.getUnlocked(heroId);
    const bonuses = {};

    for (const branch of tree.branches) {
      const unlocked = state[branch.id] || [];
      for (const nodeIdx of unlocked) {
        const node = branch.nodes[nodeIdx];
        if (!node || !node.stat) continue;
        for (const [key, val] of Object.entries(node.stat)) {
          bonuses[key] = (bonuses[key] || 0) + val;
        }
      }
    }
    return bonuses;
  },

  // Get all unlocked specials/ultimates for a hero
  getSpecials(heroId) {
    const tree = this.getTree(heroId);
    if (!tree) return [];
    const state = this.getUnlocked(heroId);
    const specials = [];

    for (const branch of tree.branches) {
      const unlocked = state[branch.id] || [];
      for (const nodeIdx of unlocked) {
        const node = branch.nodes[nodeIdx];
        if (node?.special) specials.push(node.special);
        if (node?.ultimate) specials.push(node.ultimate);
      }
    }
    return specials;
  },

  // Check if a specific special/ultimate is unlocked
  hasSpecial(heroId, specialKey) {
    return this.getSpecials(heroId).includes(specialKey);
  },
};

if (typeof window !== 'undefined') window.SkillTree = SkillTree;
