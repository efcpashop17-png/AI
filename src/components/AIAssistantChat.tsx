import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Game, GamePackage } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestedPackages?: {
    gameId: string;
    gameName: string;
    pkg: GamePackage;
    qty: number;
  }[];
}

export const AIAssistantChat: React.FC = () => {
  const { games, addToCart, setIsCartOpen } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'สวัสดีครับ! ผมคือ **AI ที่ปรึกษาสต็อก & งบประมาณ** ประจำร้าน **EF CPA Shop** (Stock iOS ราคาถูกที่สุด ประสบการณ์เติมเกมส์มากกว่า 7 ปี) 🎮\n\nยินดีช่วยคุณคำนวณงบประมาณ, จัดสรรแพ็กเกจเกมให้คุ้มค่าที่สุด หรือแนะนำการจัดสต็อกสำหรับพ่อค้าแม่ค้าและดีลเลอร์ครับ บอกงบหรือเกมที่ต้องการได้เลย!',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Quick Prompts
  const quickPrompts = [
    'มีงบ 1,000 บาท แนะนำแพ็ก eFootball ให้หน่อย',
    'มีงบ 500 บาท สั่ง Last War ได้แพ็กเกจไหนบ้าง?',
    'จัดชุดสต็อก FC Mobile & COD งบ 2,000 บาท',
    'ช่วยวางแผนสต็อกสำหรับเปิดร้านรับเติมเกม',
  ];

  // Helper to find and calculate best combinations
  const calculateBudgetRecommendation = (budget: number, gameFilter?: string) => {
    const candidateGames = gameFilter
      ? games.filter((g) => {
          const q = gameFilter.toLowerCase().trim();
          return (
            g.name.toLowerCase().includes(q) ||
            g.id.toLowerCase().includes(q) ||
            (g.thaiName && g.thaiName.toLowerCase().includes(q)) ||
            (g.aliases && g.aliases.some((a) => a.toLowerCase().includes(q)))
          );
        })
      : games;

    const availablePackages: { game: Game; pkg: GamePackage }[] = [];
    candidateGames.forEach((g) => {
      g.packages
        .filter((p) => p.active)
        .forEach((pkg) => {
          availablePackages.push({ game: g, pkg });
        });
    });

    // Sort by price descending
    availablePackages.sort((a, b) => b.pkg.price - a.pkg.price);

    let remainingBudget = budget;
    const selected: { gameId: string; gameName: string; pkg: GamePackage; qty: number }[] = [];

    // Greedy pick to fill budget smartly
    for (const item of availablePackages) {
      if (item.pkg.price <= remainingBudget) {
        const count = Math.floor(remainingBudget / item.pkg.price);
        if (count > 0) {
          selected.push({
            gameId: item.game.id,
            gameName: item.game.name,
            pkg: item.pkg,
            qty: count,
          });
          remainingBudget -= count * item.pkg.price;
        }
      }
      if (remainingBudget < 30) break;
    }

    return {
      selected,
      totalSpent: budget - remainingBudget,
      remaining: remainingBudget,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      // Analyze Query
      const queryLower = query.toLowerCase();
      let matchedGameName = '';
      if (queryLower.includes('efootball') || queryLower.includes('อีฟุตบอล') || queryLower.includes('บอล')) matchedGameName = 'eFootball';
      else if (queryLower.includes('last war') || queryLower.includes('lastwar') || queryLower.includes('ลาสวอร์')) matchedGameName = 'Last War';
      else if (queryLower.includes('summoner') || queryLower.includes('ซัมมอน')) matchedGameName = 'Summoners War';
      else if (queryLower.includes('fc mobile') || queryLower.includes('fc') || queryLower.includes('fifa') || queryLower.includes('mobile')) matchedGameName = 'FC Mobile';
      else if (queryLower.includes('cod') || queryLower.includes('call of duty') || queryLower.includes('คอลออฟ')) matchedGameName = 'Call Of Duty';
      else if (queryLower.includes('genshin') || queryLower.includes('เกนชิน')) matchedGameName = 'Genshin Impact';
      else if (queryLower.includes('hsr') || queryLower.includes('star rail') || queryLower.includes('honkai') || queryLower.includes('ฮงไก')) matchedGameName = 'Honkai : Star Rail';
      else if (queryLower.includes('zzz') || queryLower.includes('zenless') || queryLower.includes('เซนเลส')) matchedGameName = 'Zenless Zone Zero';
      else if (queryLower.includes('wuthering') || queryLower.includes('wuwa') || queryLower.includes('วูเธอ')) matchedGameName = 'Wuthering Waves';
      else if (queryLower.includes('pokemon go') || queryLower.includes('pokrmon go') || queryLower.includes('pokrmon') || queryLower.includes('โปเกมอน โก')) matchedGameName = 'Pokrmon Go';
      else if (queryLower.includes('pokemon tcg') || queryLower.includes('tcg') || queryLower.includes('โปเกมอน tcg')) matchedGameName = 'Pokemon TCG';

      // Extract number for budget
      const budgetMatch = query.match(/(\d+[\d,]*)/);
      const budgetNum = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : 0;

      let replyText = '';
      let suggestedPackages: ChatMessage['suggestedPackages'] = undefined;

      if (queryLower.includes('สต็อก') || queryLower.includes('บริหาร') || queryLower.includes('ร้าน') || queryLower.includes('สมดุล')) {
        replyText = `📊 **คำแนะนำการบริหารจัดการสต็อกเกมร้าน EF CPA Shop:**\n\n1. **กลุ่มเกมหมุนเวียนไว (Fast-Moving Stock 50%):**\n   - **eFootball & FC Mobile:** กลุ่มผู้เล่นสายกีฬาซื้อซ้ำสูง แนะนำสำรองแพ็กเกจกลาง 349฿ - 649฿ ไว้เป็นหลัก\n   - **Call Of Duty:** สำรองช่วงมีกิจกรรม Battle Pass สัปดาห์ละ 1-2 ครั้ง\n\n2. **กลุ่มเกมสายกาชา & อัปเดตแพทช์ (Gacha & Banner Stock 35%):**\n   - **Genshin Impact, Honkai Star Rail, ZZZ, Wuthering Waves:** บัตรรายเดือน (Welkin / Express Pass 159฿) ขายดีมากทุกวัน ส่วนแพ็กเกจใหญ่เน้นสั่งเติมช่วงเปิดตู้ตัวละครใหม่\n\n3. **กลุ่มเกมสะสม & สงคราม (Strategy & Cards 15%):**\n   - **Last War & Pokemon TCG:** แพ็กเกจเพชรและ Booster Gold ซื้อสม่ำเสมอ\n\n💡 **เคล็ดลับจากประสบการณ์กว่า 7 ปี:** สั่งซื้อสต็อกผ่านระบบ iOS Wholesale ของเราเพื่อคุมต้นทุนต่ำสุด ไม่ต้องสต็อกจม สั่งเมื่อมีออเดอร์ลูกค้าเข้ามาได้ทันที จัดส่งไอเทมเข้า Stock เวลาเฉลี่ยคือ 6-32 ชม. ครับ!`;
      } else if (budgetNum > 0) {
        const recommendation = calculateBudgetRecommendation(budgetNum, matchedGameName);
        if (recommendation.selected.length > 0) {
          suggestedPackages = recommendation.selected;
          const itemsList = recommendation.selected
            .map(
              (s) =>
                `• **${s.gameName}** - ${s.pkg.name} x ${s.qty} ชิ้น = ฿${(s.pkg.price * s.qty).toLocaleString()}`
            )
            .join('\n');

          replyText = `🎯 **แผนจัดสรรงบประมาณ ฿${budgetNum.toLocaleString()}${matchedGameName ? ` สำหรับ ${matchedGameName}` : ''}:**\n\n${itemsList}\n\n💰 **ยอดรวมทั้งสิ้น:** ฿${recommendation.totalSpent.toLocaleString()} (คงเหลืองบประมาณ: ฿${recommendation.remaining.toLocaleString()})\n\n✨ คุณสามารถกดปุ่ม **"เพิ่มลงตะกร้า"** ที่การ์ดด้านล่างเพื่อสั่งซื้อได้ทันทีเลยครับ!`;
        } else {
          replyText = `สำหรับงบ ฿${budgetNum.toLocaleString()} แนะนำเลือกแพ็กเกจเริ่มต้นของเกม ${matchedGameName || 'eFootball / FC Mobile'} ราคาโปรโมชั่นเริ่มต้นเพียง 32฿ - 45฿ เท่านั้นครับ!`;
        }
      } else {
        replyText = `ยินดีให้คำปรึกษาครับ! คุณสามารถพิมพ์บอกงบประมาณ เช่น *"มีงบ 1,000 บ. แนะนำแพ็ก eFootball"* หรือถามแนวทางการบริหารสต็อกสำหรับร้านค้าได้เลยครับ ผมพร้อมช่วยคำนวณและกระจายแพ็กเกจให้คุ้มค่าที่สุด!`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        suggestedPackages,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleAddAllToCart = (items: NonNullable<ChatMessage['suggestedPackages']>) => {
    items.forEach((item) => {
      const targetGame = games.find((g) => g.id === item.gameId) || games[0];
      if (targetGame) {
        addToCart({
          game: targetGame,
          pkg: item.pkg,
          playerUid: 'STOCK-AI',
          quantity: item.qty,
        });
      }
    });
    setIsCartOpen(true);
  };

  return (
    <>
      {/* Floating Action Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:shadow-[0_0_35px_rgba(168,85,247,0.9)] hover:scale-105 active:scale-95 transition-all border border-violet-300/40 cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <span className="font-heading tracking-wide">
            {isOpen ? 'ปิดผู้ช่วย AI' : 'AI ที่ปรึกษาสต็อก & งบ'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] text-cyan-300 font-mono">
            EF CPA
          </span>
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-40 w-[94vw] sm:w-[420px] h-[580px] max-h-[82vh] cyber-panel rounded-3xl border border-violet-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-fade-in backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-violet-950 via-[#1B1433] to-[#120E24] border-b border-violet-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] border border-violet-300/30">
                <Bot className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm font-heading">
                    EF CPA AI Advisor
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-violet-300/80">
                  ผู้ช่วยคำนวณงบ & บริหารสต็อกสินค้า
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-violet-950/60 hover:bg-violet-900 border border-violet-500/30 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0B0813]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] rounded-br-none'
                      : 'cyber-card border border-violet-500/30 text-slate-100 rounded-bl-none shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Suggested Packages Cards */}
                  {msg.suggestedPackages && msg.suggestedPackages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-violet-500/20 space-y-2">
                      <span className="text-[11px] font-bold text-cyan-300 block">
                        📦 รายการแพ็กเกจที่แนะนำ:
                      </span>
                      {msg.suggestedPackages.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-violet-500/20 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">
                              {item.gameName}
                            </span>
                            <span className="text-[11px] text-violet-300">
                              {item.pkg.name} x {item.qty} ชิ้น
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            ฿{(item.pkg.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddAllToCart(msg.suggestedPackages!)}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>เพิ่มแพ็กเกจทั้งหมดลงตะกร้า</span>
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-violet-300 cyber-card px-3.5 py-2.5 rounded-2xl w-fit">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>AI กำลังคำนวณและวิเคราะห์สต็อก...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-[#120E24]/90 border-t border-violet-500/20 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900 border border-violet-500/30 text-[11px] text-violet-200 hover:text-white transition-all cursor-pointer flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#120E24] border-t border-violet-500/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="ถาม AI เช่น 'มีงบ 1,000 บ. เติม eFootball'..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-violet-500/40 focus:border-cyan-400 text-white text-xs sm:text-sm placeholder-violet-400/50 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
