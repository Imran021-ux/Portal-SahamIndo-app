/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean previous elements
    containerRef.current.innerHTML = "";

    // Create a container div for the widget
    const widgetId = `tv-widget-${Math.random().toString(36).substring(2, 9)}`;
    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetId;
    widgetDiv.className = "w-full h-full";
    containerRef.current.appendChild(widgetDiv);

    // Create script to embed TradingView Advanced Chart
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      // Ensure we clean container before drawing in case symbol changed quickly
      const targetEl = document.getElementById(widgetId);
      if (!targetEl) return;
      
      try {
        // @ts-ignore
        if (typeof TradingView !== "undefined") {
          // Adjust symbol names to ensure valid format
          let tvSymbol = symbol;
          if (symbol === "IHSG" || symbol === "COMPOSITE") {
            tvSymbol = "IDX:COMPOSITE";
          } else if (!symbol.includes(":")) {
            tvSymbol = `IDX:${symbol}`;
          }

          // @ts-ignore
          new TradingView.widget({
            autosize: true,
            symbol: tvSymbol,
            interval: "D",
            timezone: "Asia/Jakarta",
            theme: "dark",
            style: "1",
            locale: "id",
            toolbar_bg: "#0f172a",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: widgetId,
            studies: [
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies"
            ]
          });
        }
      } catch (e) {
        console.error("Failed to render TradingView Widget", e);
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-[400px] md:h-[450px] bg-[#020b12] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl">
      <div className="absolute top-2 left-4 z-10 flex items-center gap-1.5 pointer-events-none bg-slate-950/80 px-2.5 py-1 rounded-full text-[10px] font-mono border border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="text-cyan-400 font-bold uppercase">TradingView Live Feed: {symbol}</span>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
