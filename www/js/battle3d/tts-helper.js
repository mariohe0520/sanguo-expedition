/**
 * TTS语音合成模块
 * 使用macOS自带say命令
 */
class TTSHelper {
  static async speak(text, voice = 'Ting-Ting') {
    // 使用say命令
    return new Promise((resolve) => {
      const proc = require('child_process').spawn('say', ['-v', voice, text]);
      proc.on('close', () => resolve());
    });
  }
  
  // 战斗语音
  static async battleCry(character) {
    const cries = {
      '关羽': '敌将受死！',
      '张飞': '燕人张飞在此！',
      '刘备': '汉室复兴，就在今朝！',
      '曹操': '宁可我负天下人！',
      'default': '杀！'
    };
    await this.speak(cries[character] || cries['default']);
  }
  
  // 胜利语音
  static async victory() {
    await this.speak('我军大胜！');
  }
  
  // 失败语音
  static async defeat() {
    await this.speak('撤军！');
  }
}

window.TTSHelper = TTSHelper;
console.log('[TTS] TTSHelper已加载 (macOS say)');
