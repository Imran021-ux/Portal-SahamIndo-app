import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Users, ArrowDown, ChevronDown, ChevronUp, AlertCircle, Smile } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  role: "Analis" | "Swing Trader" | "Scalper" | "Retails";
  text: string;
  timestamp: string;
  sentiment: "bullish" | "bearish" | "neutral";
  ticker?: string;
}

const PRESET_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    sender: "Budi Santoso",
    role: "Swing Trader",
    text: "Melihat chart BBCA, kelihatannya siap breakout resisten 10,200 minggu ini. Volume konsisten naik.",
    timestamp: "12:45",
    sentiment: "bullish",
    ticker: "BBCA"
  },
  {
    id: "init-2",
    sender: "Susi_Trader99",
    role: "Scalper",
    text: "Waduh BRIS koreksi sehat dulu ya setelah naik kencang kemarin. Mulai cicil beli bertahap di MA20.",
    timestamp: "12:46",
    sentiment: "neutral",
    ticker: "BRIS"
  },
  {
    id: "init-3",
    sender: "Kevin Cuan",
    role: "Analis",
    text: "IHSG pagi ini tertahan di 7,250. Masih nunggu data rilis inflasi domestik besok pagi. Rekomendasi ketat batasi porsi.",
    timestamp: "12:48",
    sentiment: "neutral"
  },
  {
    id: "init-4",
    sender: "Rian_Investama",
    role: "Retails",
    text: "Baru serok PTBA deviden yield 14.3% emang gak pernah ngecewain buat pegangan jangka panjang!",
    timestamp: "12:50",
    sentiment: "bullish",
    ticker: "PTBA"
  },
  {
    id: "init-5",
    sender: "Citra_Dewi",
    role: "Swing Trader",
    text: "PGAS break level 1500 nih mantap! Volume spike gede. Menuju target profit pertama di 1650.",
    timestamp: "12:51",
    sentiment: "bullish",
    ticker: "PGAS"
  },
  {
    id: "init-6",
    sender: "Hendra_FX",
    role: "Scalper",
    text: "Hati-hati BRPT rawan profit taking, PE ratio udah kemahalan 48x. Amankan cuan dulu bapak ibu.",
    timestamp: "12:53",
    sentiment: "bearish",
    ticker: "BRPT"
  }
];

const SIMULATED_RESPONSES = [
  { sender: "Susi_Trader99", role: "Scalper", text: "AMRT juga cakep nih, konsolidasi di area support kuat.", sentiment: "bullish", ticker: "AMRT" },
  { sender: "Budi Santoso", role: "Swing Trader", text: "Betul sekali, IHSG kalau kuat nembus 7280 arahnya langsung ke 7350 lagi.", sentiment: "bullish" },
  { sender: "MemeGilaSaham", role: "Retails", text: "GOTO nunggu keajaiban bandar bangun tidur aja deh, parkir di gocap mulu wkwk.", sentiment: "neutral" },
  { sender: "Analis_Senior", role: "Analis", text: "Sentimen BPJS (Beli Pagi Jual Siang) lagi ramai di grup premium. Tetap waspada volatilitas.", sentiment: "neutral" },
  { sender: "Cuan_Maksimal", role: "Swing Trader", text: "Rekomendasi swing saham komoditas seperti PTBA mulai menarik karena harga coal rebound global.", sentiment: "bullish", ticker: "PTBA" },
  { sender: "Yanto_Bursa", role: "Retails", text: "BRIS ngeri-ngeri sedap naiknya, tapi syariah emang berkah terus ya haha.", sentiment: "bullish", ticker: "BRIS" },
  { sender: "Rian_Investama", role: "Retails", text: "IHSG kayaknya mau sideways dulu, lebih baik milih saham sektor defensif seperti konsumen AMRT.", sentiment: "neutral", ticker: "AMRT" }
];

export default function IHSGChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("idx_ihsg_chat_logs");
    return saved ? JSON.parse(saved) : PRESET_MESSAGES;
  });
  const [inputText, setInputText] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<"bullish" | "bearish" | "neutral">("neutral");
  const [taggedTicker, setTaggedTicker] = useState("IHSG");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem("idx_ihsg_chat_logs", JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCollapsed]);

  // Periodic automatic simulated messages from other traders
  useEffect(() => {
    const chatInterval = setInterval(() => {
      // Pick a random simulated response
      const randomSeed = Math.floor(Math.random() * SIMULATED_RESPONSES.length);
      const chosenTemplate = SIMULATED_RESPONSES[randomSeed];
      
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: chosenTemplate.sender,
        role: chosenTemplate.role as any,
        text: chosenTemplate.text,
        timestamp: timeStr,
        sentiment: chosenTemplate.sentiment as any,
        ticker: chosenTemplate.ticker
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 14000); // Send virtual chatter every 14 seconds

    return () => clearInterval(chatInterval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "Anda (Analis Ritel)",
      role: "Retails",
      text: inputText,
      timestamp: timeStr,
      sentiment: selectedSentiment,
      ticker: taggedTicker !== "IHSG" ? taggedTicker : undefined
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    
    // Simulate a helper dynamic reply from an analyst after 2 seconds
    setTimeout(() => {
      const answers = [
        "Analisis sentimen yang sangat logis! Mari kita awasi aksi korporasi bulan depan.",
        "Setuju banget. Manajemen risiko tetap nomor satu ya guys, pasang stoploss ketat.",
        "Bisa dipertimbangkan juga untuk skema Swing Trading santai di emiten bersangkutan.",
        "Bursa berfluktuasi cukup deras siang ini, pantau bid-ask offer secara jeli.",
        "Menarik ini laporannya! Info berharga buat trader mandiri."
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      const botReplyTime = new Date();
      const botReplyTimeStr = `${String(botReplyTime.getHours()).padStart(2, "0")}:${String(botReplyTime.getMinutes()).padStart(2, "0")}`;
      
      const analysisReply: ChatMessage = {
        id: `bot-reply-${Date.now()}`,
        sender: "Asisten AI Bursa",
        role: "Analis",
        text: `@Anda ${randomAnswer}`,
        timestamp: botReplyTimeStr,
        sentiment: selectedSentiment
      };
      setMessages((prev) => [...prev, analysisReply]);
    }, 1800);
  };

  return (
    <div id="ihsg-realtime-chat-block" className="glass-card rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* Thread Header */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-3 bg-gradient-to-r from-slate-900/90 to-blue-950/25 flex items-center justify-between border-b border-slate-800/80 cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-100 tracking-wider">Forum Live Chat &amp; Sentimen IHSG</span>
              <span className="bg-emerald-500/10 text-[8.5px] px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 font-extrabold animate-pulse">
                ● LIVE CHAT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Diskusikan tren pergerakan indeks &amp; emiten terpanas IDX secara real-time</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>4,180 Traders Online</span>
          </div>

          <button className="text-slate-400 hover:text-white p-1 rounded-md">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chat Body & Input */}
      {!isCollapsed && (
        <div className="p-4 space-y-3.5">
          
          {/* Messages Area */}
          <div 
            ref={scrollContainerRef}
            className="h-44 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar bg-slate-950/40 rounded-xl p-3 border border-slate-850/50"
          >
            {messages.map((msg) => {
              const sentimentColors = {
                bullish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                bearish: "bg-rose-500/10 text-rose-400 border-rose-500/25",
                neutral: "bg-slate-800 text-slate-400 border-slate-700"
              };

              const roleColors = {
                "Analis": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                "Swing Trader": "text-blue-400 bg-blue-400/10 border-blue-400/20",
                "Scalper": "text-purple-400 bg-purple-400/10 border-purple-400/20",
                "Retails": "text-slate-300 bg-slate-700/20 border-slate-700/20"
              };

              return (
                <div key={msg.id} className="text-xs flex flex-col space-y-1 p-2 bg-slate-900/40 rounded-lg hover:bg-slate-900/80 transition-all border border-slate-850/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-[#e2e8f0]">{msg.sender}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase border ${roleColors[msg.role] || "text-slate-400 bg-slate-800"}`}>
                        {msg.role}
                      </span>
                      {msg.ticker && (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1 rounded">
                          ${msg.ticker}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${sentimentColors[msg.sentiment]}`}>
                        {msg.sentiment === "bullish" ? "🐮 BUY/BULL" : msg.sentiment === "bearish" ? "🐻 BEARISH" : "⚖️ WAIT"}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{msg.timestamp}</span>
                    </div>
                  </div>
                  
                  <p className="text-[11.5px] text-[#cbd5e1] leading-relaxed break-words">{msg.text}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Banner / Info */}
          <div className="p-2.5 bg-blue-950/20 border border-blue-900/45 rounded-xl flex items-center justify-between text-[10px] text-[#93c5fd]">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Sentimen Konsensus Investor Jam Ini: <strong className="text-emerald-400">72.4% BULLISH 🐮</strong> (Berdasarkan vote & diskursus chat)</span>
            </div>
            <span className="hidden sm:inline-block text-[9px] text-[#60a5fa] font-semibold bg-[#2563eb]/20 px-2 py-0.5 rounded">Update Otomatis</span>
          </div>

          {/* Input Panel Form */}
          <form onSubmit={handleSendMessage} className="space-y-2">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              
              {/* Sentiment selection */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Pilih Sentimen:</span>
                
                <button
                  type="button"
                  onClick={() => setSelectedSentiment("bullish")}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedSentiment === "bullish"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  🐮 Bullish (Beli)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSentiment("bearish")}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedSentiment === "bearish"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  🐻 Bearish (Jual)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSentiment("neutral")}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedSentiment === "neutral"
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  ⚖️ Wait & See
                </button>
              </div>

              {/* Tagged Stock selector */}
              <div className="flex items-center space-x-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Tag Emiten:</label>
                <select 
                  value={taggedTicker}
                  onChange={(e) => setTaggedTicker(e.target.value)}
                  className="bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="IHSG">IHSG (Nasional)</option>
                  <option value="BBCA">BBCA</option>
                  <option value="BBRI">BBRI</option>
                  <option value="BMRI">BMRI</option>
                  <option value="BBNI">BBNI</option>
                  <option value="TLKM">TLKM</option>
                  <option value="ASII">ASII</option>
                  <option value="GOTO">GOTO</option>
                  <option value="PGAS">PGAS</option>
                  <option value="PTBA">PTBA</option>
                  <option value="BRIS">BRIS</option>
                  <option value="BRPT">BRPT</option>
                  <option value="AMRT">AMRT</option>
                </select>
              </div>

            </div>

            {/* Input message bar */}
            <div className="flex items-center space-x-2">
              <input
                id="ihsg-chat-message-input"
                type="text"
                placeholder="Diskusikan analisa saham Anda... contoh: 'BBRI mantap didukung asing', 'Sinyal bursa kok koreksi?'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={200}
                className="flex-1 min-w-0 h-10 px-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
              />
              
              <button
                type="submit"
                className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-blue-500/15 duration-200 shrink-0"
              >
                <span>Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
