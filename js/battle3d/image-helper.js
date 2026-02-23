/**
 * 图片生成辅助模块
 * 对接本地DiffusionBee API
 */
class ImageHelper {
  static async generate(prompt, options = {}) {
    // DiffusionBee本地API
    // 需要先安装: https://diffusionbee.com/
    console.log('[Image] 图片生成请求:', prompt);
    return null; // 待实现
  }
  
  // 生成角色立绘
  static async generateCharacter(name, style = '3d') {
    const prompts = {
      '关羽': 'Chinese warrior Guan Yu, red face, green armor, halberd, 3D render, detailed',
      '曹操': 'Chinese emperor Cao Cao, elegant, blue robes, historical, 3D render',
      'default': 'Chinese historical character, detailed, 3D render'
    };
    return this.generate(prompts[name] || prompts['default']);
  }
  
  // 生成战斗特效
  static async generateEffect(type) {
    const effects = {
      'fire': 'explosion fire effect, game asset, transparent background',
      'ice': 'ice crystal effect, blue glow, game asset',
      'lightning': 'lightning bolt effect, yellow glow, game asset'
    };
    return this.generate(effects[type]);
  }
}

window.ImageHelper = ImageHelper;
console.log('[Image] ImageHelper已加载');
