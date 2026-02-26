/**
 * Qwen2.5:7b 本地LLM辅助
 * 用于游戏AI对话、战斗策略生成
 */
class QwenHelper {
  static async ask(prompt) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: 'qwen2.5:7b',
          prompt: prompt,
          stream: false
        })
      });
      const data = await response.json();
      return data.response;
    } catch (e) {
      console.error('Qwen调用失败:', e);
      return null;
    }
  }
  
  // 战斗策略建议
  static async suggestStrategy(enemyTeam, myTeam) {
    const prompt = `作为三国军事谋士，分析以下战斗情况，给出最优策略：
我方: ${JSON.stringify(myTeam)}
敌方: ${JSON.stringify(enemyTeam)}
请用50字以内给出战斗建议。`;
    return this.ask(prompt);
  }
  
  // 角色对话
  static async characterDialogue(character, situation) {
    const prompt = `作为三国人物${character}，用古典语气对当前情况发表看法：
情况: ${situation}
请用30字以内。`;
    return this.ask(prompt);
  }
}

window.QwenHelper = QwenHelper;
console.log('[Qwen] QwenHelper已加载');
