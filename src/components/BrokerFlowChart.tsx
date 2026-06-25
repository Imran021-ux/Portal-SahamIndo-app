import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronRight, 
  Info, 
  Calendar, 
  ChevronLeft, 
  SlidersHorizontal, 
  Plus, 
  Lock, 
  Unlock,
  Check,
  Search,
  X
} from "lucide-react";
import { Stock } from "../types";
import { GET_ALL_92_BROKERS } from "../data/beiBrokersData";

interface BrokerFlowChartProps {
  activeStock: Stock;
}

interface BrokerConfig {
  code: string;
  name: string;
  color: string;
}

const POPULAR_COLORS: Record<string, string> = {
  XL: "#10b981", // Stockbit
  YP: "#a855f7", // Mirae
  PD: "#ec4899", // Indo Premier
  CC: "#06b6d4", // Mandiri
  BK: "#3b82f6", // JP Morgan
  AK: "#14b8a6", // UBS
  OD: "#6366f1", // BRI Danareksa
  MG: "#f43f5e", // Semesta Indovest (Bandar)
  XC: "#eab308", // Ajaib
  CP: "#f97316", // KB Valbury
  GR: "#84cc16", // Panin
  ZP: "#06b6d4", // Maybank
  LG: "#ec4899", // Trimegah
  AZ: "#38bdf8", // Sucor
  SQ: "#22c55e", // BCA
  NI: "#e11d48", // BNI
  IF: "#f59e0b", // Samuel
  KK: "#6366f1", // Philip
  EP: "#ec4899", // MNC
  DX: "#14b8a6", // Bahana
  AI: "#d946ef", // UOB Kay Hian
  AH: "#8b5cf6", // Shinhan
  DH: "#06b6d4", // Sinarmas
};

const PALETTE = [
  "#10b981", "#a855f7", "#ec4899", "#f97316", "#eab308",
  "#38bdf8", "#06b6d4", "#3b82f6", "#14b8a6", "#6366f1",
  "#f43f5e", "#84cc16", "#22c55e", "#e11d48", "#f59e0b",
  "#8b5cf6", "#d946ef", "#06b6d4", "#10b981", "#3b82f6"
];

// Full library of IDX Brokers dynamically constructed from official OJK registry
const ALL_AVAILABLE_BROKERS: BrokerConfig[] = GET_ALL_92_BROKERS().map((b, idx) => {
  const code = b.code.toUpperCase();
  let displayName = b.name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  // Custom display overrides for cleaner UI
  if (code === "XL") displayName = "Stockbit Sekuritas";
  if (code === "CP") displayName = "KB Valbury Sekuritas";
  if (code === "CC") displayName = "Mandiri Sekuritas";
  if (code === "OD") displayName = "BRI Danareksa Sekuritas";
  if (code === "NI") displayName = "BNI Sekuritas";
  if (code === "SQ") displayName = "BCA Sekuritas";
  if (code === "XC") displayName = "Ajaib Sekuritas";
  if (code === "YP") displayName = "Mirae Asset Sekuritas";
  if (code === "PD") displayName = "Indo Premier Sekuritas";
  if (code === "BK") displayName = "J.P. Morgan Sekuritas";
  if (code === "KZ") displayName = "CLSA Sekuritas";
  if (code === "RX") displayName = "Macquarie Sekuritas";
  if (code === "AK") displayName = "UBS Sekuritas";
  if (code === "AZ") displayName = "Sucor Sekuritas";
  if (code === "GR") displayName = "Panin Sekuritas";
  if (code === "LG") displayName = "Trimegah Sekuritas";
  if (code === "DR") displayName = "RHB Sekuritas";
  if (code === "KK") displayName = "Philip Sekuritas";
  if (code === "EP") displayName = "MNC Sekuritas";
  if (code === "HD") displayName = "KGI Sekuritas";
  if (code === "DH") displayName = "Sinarmas Sekuritas";
  if (code === "YJ") displayName = "Lotus Andalan Sekuritas";
  if (code === "CD") displayName = "Mega Capital Sekuritas";
  if (code === "DB") displayName = "DBS Vickers Sekuritas";
  if (code === "DX") displayName = "Bahana Sekuritas";
  if (code === "HP") displayName = "Henan Putihrai Sekuritas";
  if (code === "BB") displayName = "Verdhana Sekuritas";

  const color = POPULAR_COLORS[code] || PALETTE[idx % PALETTE.length];

  return {
    code,
    name: displayName,
    color
  };
});

const parseDateStr = (str: string): Date => {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const parts = str.split(" ");
  const day = parseInt(parts[0]);
  const monthIdx = months.indexOf(parts[1]);
  const year = 2000 + parseInt(parts[2]);
  if (isNaN(day) || monthIdx === -1) return new Date(2026, 5, 23);
  return new Date(year, monthIdx, day);
};

const formatDateToStr = (date: Date): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = String(date.getFullYear() % 100);
  return `${day} ${month} ${year}`;
};

const adjustTradingDate = (dateStr: string, direction: "prev" | "next"): string => {
  const date = parseDateStr(dateStr);
  const maxDate = new Date(2026, 5, 23); // 23 Jun 2026
  
  while (true) {
    date.setDate(date.getDate() + (direction === "prev" ? -1 : 1));
    
    // Bounds check
    if (date > maxDate) {
      return formatDateToStr(maxDate);
    }
    // Limit to 2025 at lowest
    if (date.getFullYear() < 2025) {
      return dateStr;
    }

    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend) {
      return formatDateToStr(date);
    }
  }
};

const dateToInputStr = (str: string): string => {
  const d = parseDateStr(str);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const inputStrToDateStr = (val: string): string => {
  if (!val) return "23 Jun 26";
  const parts = val.split("-");
  if (parts.length !== 3) return "23 Jun 26";
  const yyyy = parseInt(parts[0]);
  const mm = parseInt(parts[1]) - 1;
  const dd = parseInt(parts[2]);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return "23 Jun 26";
  const date = new Date(yyyy, mm, dd);
  return formatDateToStr(date);
};

export default function BrokerFlowChart({ activeStock }: BrokerFlowChartProps) {
  // Filters State
  const [investorFilter, setInvestorFilter] = useState<"All Investor" | "Foreign Only" | "Domestic Only">("All Investor");
  const [marketFilter, setMarketFilter] = useState<"Regular" | "Negotiated" | "Cash">("Regular");
  const [measureType, setMeasureType] = useState<"value" | "volume">("value");
  
  // Date State (Today is 23 Jun 2026 based on local time)
  const [currentDate, setCurrentDate] = useState<string>("23 Jun 26");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAllInvestorOpen, setIsAllInvestorOpen] = useState(false);
  const [isRegularOpen, setIsRegularOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const [selectedDateOption, setSelectedDateOption] = useState<string>("Latest");
  const [customStartDate, setCustomStartDate] = useState<string>("23 Jun 26");
  const [customEndDate, setCustomEndDate] = useState<string>("23 Jun 26");

  const handleSelectOption = (option: string) => {
    setSelectedDateOption(option);
    const end = new Date(2026, 5, 23); // 23 Jun 2026
    let start = new Date(2026, 5, 23);

    if (option === "Latest") {
      // default
    } else if (option === "Previous Day") {
      end.setDate(22);
      start.setDate(22);
    } else if (option === "Last 7 Days") {
      start.setDate(16);
    } else if (option === "This Month") {
      start.setDate(1);
    } else if (option === "Previous Month") {
      start = new Date(2026, 4, 1);
      end.setMonth(4);
      end.setDate(31);
    } else if (option === "Last 1 Month") {
      start.setMonth(4);
    } else if (option === "Last 3 Months") {
      start.setMonth(2);
    } else if (option === "Last 6 Months") {
      start.setMonth(-1);
    } else if (option === "Year to Date") {
      start = new Date(2026, 0, 2);
    } else if (option === "Last 1 Year") {
      start.setFullYear(2025);
    }

    // Adjust start date to nearest trading day if it falls on weekend
    while (start.getDay() === 0 || start.getDay() === 6) {
      start.setDate(start.getDate() + 1);
    }
    while (end.getDay() === 0 || end.getDay() === 6) {
      end.setDate(end.getDate() - 1);
    }

    setCustomStartDate(formatDateToStr(start));
    setCustomEndDate(formatDateToStr(end));
  };

  const handleApplyDateRange = () => {
    setCurrentDate(customEndDate);
    
    if (selectedDateOption === "Latest" || selectedDateOption === "Previous Day") {
      setTimeframe("1D");
    } else if (selectedDateOption === "Last 7 Days") {
      setTimeframe("1W");
    } else if (selectedDateOption === "This Month" || selectedDateOption === "Previous Month" || selectedDateOption === "Last 1 Month") {
      setTimeframe("1M");
    } else if (selectedDateOption === "Last 3 Months") {
      setTimeframe("3M");
    } else if (selectedDateOption === "Year to Date" || selectedDateOption === "Last 6 Months") {
      setTimeframe("YTD");
    } else if (selectedDateOption === "Last 1 Year") {
      setTimeframe("1Y");
    } else {
      // Custom date, we can dynamically estimate timeframe from date difference!
      const startD = parseDateStr(customStartDate);
      const endD = parseDateStr(customEndDate);
      const diffDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) setTimeframe("1D");
      else if (diffDays <= 8) setTimeframe("1W");
      else if (diffDays <= 35) setTimeframe("1M");
      else if (diffDays <= 100) setTimeframe("3M");
      else if (diffDays <= 200) setTimeframe("YTD");
      else setTimeframe("1Y");
    }
    
    setIsCalendarOpen(false);
  };

  const openDateModal = () => {
    setIsCalendarOpen(true);
    setCustomEndDate(currentDate);
    
    // Set start date based on current timeframe
    const parts = currentDate.split(" ");
    const dayNum = parseInt(parts[0]);
    if (!isNaN(dayNum)) {
      let startDayNum = dayNum;
      if (timeframe === "1W") {
        startDayNum = Math.max(1, dayNum - 5);
      } else if (timeframe === "1M") {
        startDayNum = 1;
      } else if (timeframe === "3M") {
        startDayNum = 1;
      }
      
      while (startDayNum > 1) {
        const dayOfWeekIndex = (startDayNum - 1) % 7;
        const isWeekend = dayOfWeekIndex === 5 || dayOfWeekIndex === 6;
        if (!isWeekend) break;
        startDayNum--;
      }
      setCustomStartDate(`${startDayNum.toString().padStart(2, "0")} Jun 26`);
    } else {
      setCustomStartDate(currentDate);
    }

    if (timeframe === "1D") {
      if (currentDate === "23 Jun 26") {
        setSelectedDateOption("Latest");
      } else {
        setSelectedDateOption("Previous Day");
      }
    } else if (timeframe === "1W") {
      setSelectedDateOption("Last 7 Days");
    } else if (timeframe === "1M") {
      setSelectedDateOption("This Month");
    } else if (timeframe === "3M") {
      setSelectedDateOption("Last 3 Months");
    } else if (timeframe === "YTD") {
      setSelectedDateOption("Year to Date");
    } else if (timeframe === "1Y") {
      setSelectedDateOption("Last 1 Year");
    } else {
      setSelectedDateOption("Latest");
    }
  };

  // Timeframe State
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "YTD" | "1Y">("1D");

  // Locking Axis Scale state
  const [isLocked, setIsLocked] = useState(false);

  // Active Brokers state (initialized with YU, YP, PD, KI, XC)
  const [activeBrokerCodes, setActiveBrokerCodes] = useState<string[]>(["YU", "YP", "PD", "KI", "XC"]);
  // Hidden from view but kept in legend list
  const [hiddenBrokerCodes, setHiddenBrokerCodes] = useState<string[]>([]);

  // Update active brokers dynamically based on active stock ticker to match its specific top market-makers/brokers!
  useEffect(() => {
    const tickerSum = activeStock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pickedCodes: string[] = [];
    let attempt = 0;
    
    // Choose 5 distinct brokers from ALL_AVAILABLE_BROKERS deterministically based on the ticker name
    while (pickedCodes.length < 5 && attempt < ALL_AVAILABLE_BROKERS.length) {
      const idx = (tickerSum * (attempt + 11) + attempt * 17) % ALL_AVAILABLE_BROKERS.length;
      const candidate = ALL_AVAILABLE_BROKERS[idx].code;
      if (!pickedCodes.includes(candidate)) {
        pickedCodes.push(candidate);
      }
      attempt++;
    }

    if (pickedCodes.length < 5) {
      const fallback = ["YU", "YP", "PD", "KI", "XC"];
      fallback.forEach(c => {
        if (!pickedCodes.includes(c) && pickedCodes.length < 5) {
          pickedCodes.push(c);
        }
      });
    }

    setActiveBrokerCodes(pickedCodes);
    setHiddenBrokerCodes([]);
  }, [activeStock.ticker]);
  // Open add broker menu
  const [isAddingBroker, setIsAddingBroker] = useState(false);
  // Search term for broker selection modal
  const [brokerSearchTerm, setBrokerSearchTerm] = useState("");
  // Tab for broker selection modal (all, active on chart, inactive)
  const [modalTab, setModalTab] = useState<"all" | "active" | "inactive">("all");

  // Hover Tooltip States
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate dynamic seed based on Stock ticker + timeframe + date
  const baseSeed = useMemo(() => {
    const tickerSum = activeStock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dateSum = currentDate.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const tfMult = timeframe === "1D" ? 1 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : 365;
    return (tickerSum * 17 + dateSum * 3 + tfMult) % 1000;
  }, [activeStock.ticker, currentDate, timeframe]);

  // Context-aware dynamic scaling for emiten value & volume
  const { valueScaleLimit, valueUnit, volumeScaleLimit, volumeUnit } = useMemo(() => {
    const totalLots = (activeStock.volume || 5000000) / 100;
    const totalValueBillion = ((activeStock.volume || 5000000) * (activeStock.currentPrice || 500)) / 1e9;

    let valLimit = 10;
    let valUnit: "B" | "M" = "B";
    if (totalValueBillion > 5) {
      // Big cap: measure broker nets in Billion IDR (B)
      // Typically, an individual broker's net position is up to 5% to 15% of total day value
      valLimit = Math.max(1, Math.round(totalValueBillion * 0.12));
      valUnit = "B";
    } else {
      // Small/Medium cap: measure broker nets in Million IDR (M)
      const totalValueMillion = totalValueBillion * 1000;
      valLimit = Math.max(10, Math.round(totalValueMillion * 0.15));
      valUnit = "M";
    }

    let volLimit = 1000;
    let volUnit: "K Lot" | "Lot" = "K Lot";
    if (totalLots > 5000) {
      // Large volume: express in Kilo Lots (K Lot)
      volLimit = Math.max(1, Math.round((totalLots / 1000) * 0.12));
      volUnit = "K Lot";
    } else {
      // Low volume: express in standard Lots
      volLimit = Math.max(10, Math.round(totalLots * 0.15));
      volUnit = "Lot";
    }

    return {
      valueScaleLimit: valLimit,
      valueUnit: valUnit,
      volumeScaleLimit: volLimit,
      volumeUnit: volUnit
    };
  }, [activeStock]);

  // Handle Date Navigation (Weekend and Trading Schedule Aware)
  const navigateDate = (direction: "prev" | "next") => {
    const day = parseInt(currentDate.split(" ")[0]);
    if (isNaN(day)) return;
    
    let targetDay = day;
    while (true) {
      targetDay = direction === "prev" ? targetDay - 1 : targetDay + 1;
      // trading data is only available for June 1 to June 23, 2026 (today)
      if (targetDay < 1 || targetDay > 23) break; 
      
      const dayOfWeekIndex = (targetDay - 1) % 7; // June 1st is Monday
      const isWeekend = dayOfWeekIndex === 5 || dayOfWeekIndex === 6;
      if (!isWeekend) {
        setCurrentDate(`${targetDay.toString().padStart(2, "0")} Jun 26`);
        break;
      }
    }
  };

  // ----------------------------------------------------
  // GENERATE DYNAMIC CHART DATA
  // ----------------------------------------------------
  const chartDataPointsCount = 20; // 20 intervals across X-axis

  const xLabels = useMemo(() => {
    if (timeframe === "1D") {
      return ["09:00", "10:06", "11:13", "13:50", "14:57", "16:14"];
    } else if (timeframe === "1W") {
      return ["Sen", "Sel", "Rab", "Kam", "Jum"];
    } else if (timeframe === "1M") {
      return ["W1", "W2", "W3", "W4"];
    } else if (timeframe === "3M") {
      return ["Bulan 1", "Bulan 2", "Bulan 3"];
    } else {
      return ["Jul", "Sep", "Nov", "Jan", "Mar", "Mei"];
    }
  }, [timeframe]);

  // Simulated Price step data tailored strictly to stock's actual boundaries
  const priceData = useMemo(() => {
    const data: number[] = [];
    const changePct = activeStock.changePercent ?? 0;
    const startPrice = activeStock.previousPrice ?? (activeStock.currentPrice * (1 - changePct / 100));
    const endPrice = activeStock.currentPrice;
    
    // Deterministic random walk conforming to actual high/low bounds
    for (let i = 0; i < chartDataPointsCount; i++) {
      const fraction = i / (chartDataPointsCount - 1);
      // Interpolate base trend line
      const baseTrend = startPrice + fraction * (endPrice - startPrice);
      
      // Add wave noise based on stock's relative daily volatility
      const wave = Math.sin(baseSeed + i * 1.5) * Math.cos(baseSeed - i * 0.8) * 0.3;
      const volatilityScale = Math.max(0.003, Math.abs(changePct) * 0.002);
      const noise = wave * endPrice * volatilityScale;
      
      let val = baseTrend + noise;
      
      // Strict constraint using stock's actual low/high stats for absolute accuracy
      const lowLimit = activeStock.low ?? (Math.min(startPrice, endPrice) * 0.98);
      const highLimit = activeStock.high ?? (Math.max(startPrice, endPrice) * 1.02);
      val = Math.max(lowLimit, Math.min(highLimit, val));
      
      data.push(Math.round(val));
    }
    // Anchor perfectly
    data[0] = Math.round(startPrice);
    data[chartDataPointsCount - 1] = Math.round(endPrice);
    return data;
  }, [activeStock, baseSeed]);

  // Left Axis Limit corresponds directly to our context-calculated limits
  const leftAxisLimit = measureType === "value" ? valueScaleLimit : volumeScaleLimit;

  // Generate line data for all possible brokers scaled perfectly to the emiten
  const brokerLinesData = useMemo(() => {
    const brokerLines: Record<string, number[]> = {};
    
    ALL_AVAILABLE_BROKERS.forEach((brk, idx) => {
      const data: number[] = [];
      let cumulative = 0;
      
      // Blend ticker + broker identity to make the broker's flow specific and consistent for each emiten
      const tickerCodeSeed = activeStock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const brokerSeed = brk.code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const combinedSeed = (tickerCodeSeed * 13 + brokerSeed * 7 + baseSeed) % 1000;
      
      const isBuyerSeed = combinedSeed % 3;
      const direction = isBuyerSeed === 0 ? 0.45 : isBuyerSeed === 1 ? -0.45 : -0.05; // overall trend drift
      
      // Random walk step size
      const stepSize = leftAxisLimit * 0.12;
      
      for (let i = 0; i < chartDataPointsCount; i++) {
        const stepNoise = Math.sin(combinedSeed + idx * 11 + i * 1.7) * Math.cos(combinedSeed - idx * 3 + i * 2.1);
        const drift = direction * (leftAxisLimit * 0.05) * (1 + Math.sin(combinedSeed * 0.1 + i * 0.3));
        cumulative += stepNoise * stepSize + drift;
        
        // Lock scale limits
        cumulative = Math.max(-leftAxisLimit, Math.min(leftAxisLimit, cumulative));
        data.push(Math.round(cumulative * 10) / 10);
      }
      brokerLines[brk.code] = data;
    });
    
    return brokerLines;
  }, [baseSeed, measureType, activeStock, leftAxisLimit]);

  // Price Axes Bounds
  const minPrice = useMemo(() => {
    const minVal = Math.min(...priceData);
    return Math.floor(minVal * 0.99);
  }, [priceData]);

  const maxPrice = useMemo(() => {
    const maxVal = Math.max(...priceData);
    return Math.ceil(maxVal * 1.01);
  }, [priceData]);

  // Helper to format values
  const formatLeftAxisLabel = (val: number) => {
    const absVal = Math.abs(val);
    let formatted = "";
    if (measureType === "value") {
      formatted = `${absVal.toLocaleString("id-ID")} ${valueUnit}`;
    } else {
      if (volumeUnit === "K Lot") {
        formatted = `${absVal.toLocaleString("id-ID")} K`;
      } else {
        formatted = `${absVal.toLocaleString("id-ID")}`;
      }
    }
    return val < 0 ? `(${formatted})` : formatted;
  };

  // Convert coordinate functions
  const getXCoord = (index: number) => {
    const paddingLeft = 60;
    const paddingRight = 50;
    const chartWidth = 600 - paddingLeft - paddingRight;
    return paddingLeft + (index / (chartDataPointsCount - 1)) * chartWidth;
  };

  const getLeftAxisY = (value: number) => {
    const paddingTop = 20;
    const paddingBottom = 25;
    const chartHeight = 240 - paddingTop - paddingBottom;
    const midY = paddingTop + chartHeight / 2;
    // Map -leftAxisLimit..leftAxisLimit to range
    const ratio = value / leftAxisLimit; // -1 to 1
    return midY - ratio * (chartHeight / 2);
  };

  const getPriceY = (price: number) => {
    const paddingTop = 20;
    const paddingBottom = 25;
    const chartHeight = 240 - paddingTop - paddingBottom;
    const range = maxPrice - minPrice || 1;
    const ratio = (price - minPrice) / range; // 0 to 1
    return (paddingTop + chartHeight) - ratio * chartHeight;
  };

  // Mouse interactivity helpers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map x coordinates back to nearest index
    const paddingLeft = 60;
    const paddingRight = 50;
    const totalViewBoxWidth = 600;
    const scaleX = rect.width / totalViewBoxWidth;
    
    const chartWidth = (totalViewBoxWidth - paddingLeft - paddingRight) * scaleX;
    const relativeX = x - paddingLeft * scaleX;
    
    let idx = Math.round((relativeX / chartWidth) * (chartDataPointsCount - 1));
    idx = Math.max(0, Math.min(chartDataPointsCount - 1, idx));
    
    setHoveredIdx(idx);

    // Determine if cursor is on the left half or right half of the chart width
    const isRightHalf = x > rect.width / 2;
    const isBottomHalf = y > rect.height / 2;
    
    // Position tooltip with dynamic offsets to prevent cropping!
    const tooltipX = isRightHalf ? x - 170 : x + 15;
    const tooltipY = isBottomHalf ? y - 140 : y + 15;
    
    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  // Available brokers that are NOT currently in the active set
  const inactiveBrokersList = useMemo(() => {
    return ALL_AVAILABLE_BROKERS.filter(b => !activeBrokerCodes.includes(b.code));
  }, [activeBrokerCodes]);

  const filteredInactiveBrokers = useMemo(() => {
    return inactiveBrokersList.filter(b => 
      b.code.toLowerCase().includes(brokerSearchTerm.toLowerCase()) || 
      b.name.toLowerCase().includes(brokerSearchTerm.toLowerCase())
    );
  }, [inactiveBrokersList, brokerSearchTerm]);

  // Comprehensive broker list filtered for the fullscreen modal table
  const filteredBrokersForModal = useMemo(() => {
    return ALL_AVAILABLE_BROKERS.filter(b => {
      const isActive = activeBrokerCodes.includes(b.code);
      if (modalTab === "active" && !isActive) return false;
      if (modalTab === "inactive" && isActive) return false;
      
      const search = brokerSearchTerm.toLowerCase();
      return b.code.toLowerCase().includes(search) || b.name.toLowerCase().includes(search);
    });
  }, [activeBrokerCodes, modalTab, brokerSearchTerm]);

  const addBroker = (code: string) => {
    if (!activeBrokerCodes.includes(code)) {
      setActiveBrokerCodes([...activeBrokerCodes, code]);
    }
  };

  const removeBroker = (code: string) => {
    setActiveBrokerCodes(activeBrokerCodes.filter(c => c !== code));
    setHiddenBrokerCodes(hiddenBrokerCodes.filter(c => c !== code));
  };

  const toggleBrokerVisibility = (code: string) => {
    if (hiddenBrokerCodes.includes(code)) {
      setHiddenBrokerCodes(hiddenBrokerCodes.filter(c => c !== code));
    } else {
      setHiddenBrokerCodes([...hiddenBrokerCodes, code]);
    }
  };

  return (
    <div id="broker-flow-card" className="w-full bg-[#0a0d10] border border-slate-900 rounded-2xl p-4 sm:p-5 select-none relative overflow-visible flex flex-col space-y-4 shadow-3xl">
      
      {/* 1. Header Row */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-white font-display tracking-wide uppercase flex items-center gap-1.5">
            Broker Flow ({activeStock.ticker})
            <span className="p-0.5 rounded-full hover:bg-slate-800/80 cursor-pointer text-slate-400 hover:text-cyan-400 transition-colors">
              <Info className="w-4 h-4" />
            </span>
          </h3>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
      </div>

      {/* 2. Filters Row */}
      <div className="grid grid-cols-2 gap-2 relative">
        {/* All Investor Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsAllInvestorOpen(!isAllInvestorOpen);
              setIsRegularOpen(false);
            }}
            className="w-full bg-[#11161d] hover:bg-[#151c25] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold flex justify-between items-center transition-all cursor-pointer"
          >
            <span>{investorFilter}</span>
            <span className="text-slate-550 text-[10px]">▼</span>
          </button>
          
          {isAllInvestorOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#0e1319] border border-slate-800 rounded-xl py-1 z-[60] shadow-2xl animate-fadeIn">
              {(["All Investor", "Foreign Only", "Domestic Only"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setInvestorFilter(opt);
                    setIsAllInvestorOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-[#1b2533] hover:text-white font-semibold transition-colors flex items-center justify-between"
                >
                  <span>{opt}</span>
                  {investorFilter === opt && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Regular Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsRegularOpen(!isRegularOpen);
              setIsAllInvestorOpen(false);
            }}
            className="w-full bg-[#11161d] hover:bg-[#151c25] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold flex justify-between items-center transition-all cursor-pointer"
          >
            <span>{marketFilter}</span>
            <span className="text-slate-550 text-[10px]">▼</span>
          </button>

          {isRegularOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#0e1319] border border-slate-800 rounded-xl py-1 z-[60] shadow-2xl animate-fadeIn">
              {(["Regular", "Negotiated", "Cash"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setMarketFilter(opt);
                    setIsRegularOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-[#1b2533] hover:text-white font-semibold transition-colors flex items-center justify-between"
                >
                  <span>{opt}</span>
                  {marketFilter === opt && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Value/Volume Toggles & Date Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Value / Volume Selector Capsules */}
        <div className="bg-[#11161d]/80 p-0.5 rounded-full flex border border-slate-900 overflow-hidden">
          <button
            onClick={() => setMeasureType("value")}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              measureType === "value"
                ? "bg-[#0b1f16] text-[#10b981] border border-[#10b981]/40 shadow-inner"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            Value
          </button>
          <button
            onClick={() => setMeasureType("volume")}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              measureType === "volume"
                ? "bg-[#0b1f16] text-[#10b981] border border-[#10b981]/40 shadow-inner"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            Volume
          </button>
        </div>

        {/* Green Date navigator */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => navigateDate("prev")}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#10b981]/15 hover:bg-[#10b981]/10 text-[#10b981] cursor-pointer transition-colors animate-pulse"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div 
            onClick={openDateModal}
            className="flex items-center gap-1.5 text-xs font-black text-[#10b981] hover:text-[#22c55e] bg-[#10b981]/5 px-2.5 py-1 rounded-lg border border-[#10b981]/10 transition-colors cursor-pointer whitespace-nowrap flex-nowrap shrink-0"
          >
            <span className="font-mono tracking-wider whitespace-nowrap">{currentDate}</span>
            <Calendar className="w-4 h-4 shrink-0" />
          </div>

          <button
            onClick={() => navigateDate("next")}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#10b981]/15 hover:bg-[#10b981]/10 text-[#10b981] cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Fully Functional Beautiful Centered Modal Date Selector */}
          {isCalendarOpen && typeof document !== "undefined" && createPortal(
            <div className="fixed inset-0 bg-black/75 z-[999] flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
              {/* Background overlay click to close */}
              <div className="absolute inset-0 cursor-pointer" onClick={() => setIsCalendarOpen(false)} />
              
              <div 
                ref={calendarRef}
                className="relative w-full max-w-[320px] bg-[#161a22] border border-slate-800 rounded-2xl p-3.5 shadow-2xl flex flex-col space-y-3.5 select-none z-10 animate-scaleIn"
              >
                {/* Header Title */}
                <h3 className="text-center text-xs font-black text-slate-300 tracking-wide uppercase shrink-0">
                  Select Date
                </h3>
  
                {/* Date Options Grid - 2 columns, compact and no scrolling required */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Latest",
                    "Previous Day",
                    "Last 7 Days",
                    "This Month",
                    "Previous Month",
                    "Last 1 Month",
                    "Last 3 Months",
                    "Last 6 Months",
                    "Year to Date",
                    "Last 1 Year"
                  ].map((option) => {
                    const isSelected = selectedDateOption === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(option)}
                        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all cursor-pointer text-left border ${
                          isSelected 
                            ? "bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981] font-black" 
                            : "bg-[#0e1117] border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
                        }`}
                      >
                        <div 
                          className={`w-3 h-3 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                            isSelected 
                              ? "bg-[#10b981] border-[#10b981] text-white" 
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-[10.5px] font-semibold truncate leading-none">{option}</span>
                      </button>
                    );
                  })}
                </div>
  
                {/* Divider Line */}
                <div className="border-t border-slate-800/80 my-0.5 shrink-0" />
  
                {/* Inline Start & End Chevron Increments with fully interactive native date picker overlay */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  {/* Start Date Selection */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">
                      Start
                    </span>
                    <div className="relative flex items-center justify-between bg-[#0e1117] border border-slate-800 rounded-xl px-2 py-1.5 overflow-hidden">
                      <button
                        onClick={() => {
                          setSelectedDateOption("Custom");
                          setCustomStartDate(adjustTradingDate(customStartDate, "prev"));
                        }}
                        className="p-1 text-[#10b981] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer z-10"
                        title="Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative cursor-pointer hover:bg-slate-800/50 px-1.5 py-0.5 rounded transition-all flex items-center gap-1">
                        <span className="font-mono text-[10.5px] font-black text-slate-200 tracking-wide select-none">
                          {customStartDate}
                        </span>
                        <input
                          type="date"
                          value={dateToInputStr(customStartDate)}
                          min="2025-01-01"
                          max="2026-06-23"
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedDateOption("Custom");
                              setCustomStartDate(inputStrToDateStr(e.target.value));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Click to pick start date"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDateOption("Custom");
                          setCustomStartDate(adjustTradingDate(customStartDate, "next"));
                        }}
                        className="p-1 text-[#10b981] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer z-10"
                        title="Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
  
                  {/* End Date Selection */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans">
                      End
                    </span>
                    <div className="relative flex items-center justify-between bg-[#0e1117] border border-slate-800 rounded-xl px-2 py-1.5 overflow-hidden">
                      <button
                        onClick={() => {
                          setSelectedDateOption("Custom");
                          setCustomEndDate(adjustTradingDate(customEndDate, "prev"));
                        }}
                        className="p-1 text-[#10b981] hover:bg-[#10b981]/15 rounded-lg transition-colors cursor-pointer z-10"
                        title="Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative cursor-pointer hover:bg-slate-800/50 px-1.5 py-0.5 rounded transition-all flex items-center gap-1">
                        <span className="font-mono text-[10.5px] font-black text-slate-200 tracking-wide select-none">
                          {customEndDate}
                        </span>
                        <input
                          type="date"
                          value={dateToInputStr(customEndDate)}
                          min="2025-01-01"
                          max="2026-06-23"
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedDateOption("Custom");
                              setCustomEndDate(inputStrToDateStr(e.target.value));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Click to pick end date"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDateOption("Custom");
                          setCustomEndDate(adjustTradingDate(customEndDate, "next"));
                        }}
                        className="p-1 text-[#10b981] hover:bg-[#10b981]/15 rounded-lg transition-colors cursor-pointer z-10"
                        title="Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
  
                {/* Apply Action Button */}
                <button
                  onClick={handleApplyDateRange}
                  className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs rounded-xl shadow-lg shadow-[#10b981]/10 transition-all cursor-pointer tracking-wider uppercase"
                >
                  Apply
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* 4. Chart Canvas Area (Pure Responsive SVG) */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] w-full bg-[#05070a] border border-slate-900/60 rounded-xl p-2.5 overflow-visible">
        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div 
            className="absolute bg-[#03080e]/95 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 text-[10px] space-y-1.5 pointer-events-none min-w-[145px]"
            style={{ 
              left: `${tooltipPos.x}px`, 
              top: `${tooltipPos.y}px` 
            }}
          >
            <div className="font-extrabold text-[#94a3b8] font-mono border-b border-slate-800/60 pb-1 flex justify-between">
              <span>Timeframe Point</span>
              <span>#{hoveredIdx + 1}</span>
            </div>
            
            {/* Price detail */}
            <div className="flex justify-between items-center font-bold">
              <span className="text-[#38bdf8]">Price:</span>
              <span className="text-white font-mono font-black">Rp {priceData[hoveredIdx].toLocaleString("id-ID")}</span>
            </div>

            {/* Broker details */}
            {activeBrokerCodes.map((code) => {
              if (hiddenBrokerCodes.includes(code)) return null;
              const config = ALL_AVAILABLE_BROKERS.find(b => b.code === code);
              if (!config) return null;
              const val = brokerLinesData[code]?.[hoveredIdx] || 0;
              const isPositive = val >= 0;
              const absVal = Math.abs(val).toLocaleString("id-ID", { maximumFractionDigits: 1 });
              const labelSuffix = measureType === "value" 
                ? ` ${valueUnit}` 
                : (volumeUnit === "K Lot" ? " K Lot" : " Lot");
              
              return (
                <div key={code} className="flex justify-between items-center font-bold">
                  <span style={{ color: config.color }}>{code}:</span>
                  <span className={`font-mono ${isPositive ? "text-emerald-400" : "text-rose-450"}`}>
                    {isPositive ? "+" : "-"}{absVal}{labelSuffix}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <svg 
          className="w-full h-full cursor-crosshair overflow-visible"
          viewBox="0 0 600 240"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Neon Glow filters */}
          <defs>
            <filter id="neonPriceFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.015)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.005)" />
            </linearGradient>
          </defs>

          {/* Reference Gridlines (Horizontal lines corresponding to ticks) */}
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = 20 + ratio * 195;
              return (
                <line 
                  key={ratio}
                  x1="60" 
                  y1={y} 
                  x2="550" 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.03)" 
                  strokeWidth="0.8" 
                  strokeDasharray={ratio === 0.5 ? "none" : "2 2"}
                />
              );
            })}
            {/* Center line (Zero balance line) */}
            <line 
              x1="60" 
              y1={getLeftAxisY(0)} 
              x2="550" 
              y2={getLeftAxisY(0)} 
              stroke="rgba(148, 163, 184, 0.08)" 
              strokeWidth="1.2"
            />
          </g>

          {/* Left Y Axis Labels (Value/Volume Net) */}
          <g className="text-[8.5px] fill-slate-500 font-mono font-bold select-none text-right">
            {[-1, -0.5, 0, 0.5, 1].map((valMultiplier) => {
              const value = leftAxisLimit * valMultiplier;
              const y = getLeftAxisY(value) + 3;
              return (
                <text key={valMultiplier} x="52" y={y} textAnchor="end">
                  {formatLeftAxisLabel(value)}
                </text>
              );
            })}
          </g>

          {/* Right Y Axis Labels (Stock Price ticks) */}
          <g className="text-[8.5px] fill-slate-500 font-mono font-bold select-none text-left">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const price = minPrice + ratio * (maxPrice - minPrice);
              const y = getPriceY(price) + 3;
              return (
                <text key={ratio} x="558" y={y} textAnchor="start">
                  {Math.round(price).toLocaleString("id-ID")}
                </text>
              );
            })}
          </g>

          {/* Plotted Line Paths for Broker Net values */}
          {activeBrokerCodes.map((code) => {
            if (hiddenBrokerCodes.includes(code)) return null;
            const config = ALL_AVAILABLE_BROKERS.find(b => b.code === code);
            if (!config) return null;
            
            const points = brokerLinesData[code] || [];
            const pointsStr = points.map((val, idx) => {
              const cx = getXCoord(idx);
              const cy = getLeftAxisY(val);
              return `${cx.toFixed(1)},${cy.toFixed(1)}`;
            }).join(" ");

            return (
              <polyline
                key={code}
                points={pointsStr}
                fill="none"
                stroke={config.color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={hoveredIdx !== null ? "0.3" : "0.85"}
                className="transition-opacity duration-350"
              />
            );
          })}

          {/* Plotted Step Line Path for Price (cyan/blue) */}
          {(() => {
            const pricePoints: string[] = [];
            // Generate a step-like path for the price list to look organic
            priceData.forEach((price, idx) => {
              const cx = getXCoord(idx);
              const cy = getPriceY(price);
              
              if (idx > 0) {
                // Horizontal step part
                const prevCx = getXCoord(idx - 1);
                pricePoints.push(`${cx.toFixed(1)},${getPriceY(priceData[idx - 1]).toFixed(1)}`);
              }
              pricePoints.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
            });

            return (
              <polyline
                points={pricePoints.join(" ")}
                fill="none"
                stroke="#38bdf8" // Blue Price line
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonPriceFilter)"
                opacity={hoveredIdx !== null ? "0.3" : "1.0"}
                className="transition-opacity duration-350"
              />
            );
          })()}

          {/* Hover Crosshair / Vertical Guide Line */}
          {hoveredIdx !== null && (
            <g>
              <line 
                x1={getXCoord(hoveredIdx)} 
                y1="20" 
                x2={getXCoord(hoveredIdx)} 
                y2="215" 
                stroke="rgba(255, 255, 255, 0.15)" 
                strokeWidth="1" 
                strokeDasharray="2 2"
              />
              
              {/* Highlight intersection circles */}
              <circle 
                cx={getXCoord(hoveredIdx)} 
                cy={getPriceY(priceData[hoveredIdx])} 
                r="3.5" 
                fill="#38bdf8" 
                stroke="#0a0d10"
                strokeWidth="1"
              />

              {activeBrokerCodes.map((code) => {
                if (hiddenBrokerCodes.includes(code)) return null;
                const config = ALL_AVAILABLE_BROKERS.find(b => b.code === code);
                const val = brokerLinesData[code]?.[hoveredIdx] || 0;
                return (
                  <circle 
                    key={code}
                    cx={getXCoord(hoveredIdx)} 
                    cy={getLeftAxisY(val)} 
                    r="3" 
                    fill={config?.color || "#ffffff"} 
                    stroke="#0a0d10"
                    strokeWidth="1"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* X Axis Custom Labels */}
        <div className="absolute bottom-2 left-[60px] right-[50px] flex justify-between text-[8px] font-mono font-bold text-slate-500 select-none">
          {xLabels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>
      </div>

      {/* 5. Timeframe Selection Bar & Filter Sliders icon */}
      <div className="flex items-center justify-between select-none">
        <div className="flex gap-2 bg-[#11161d]/50 p-1 rounded-xl border border-slate-900 overflow-x-auto scrollbar-none">
          {(["1D", "1W", "1M", "3M", "YTD", "1Y"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === tf
                  ? "bg-[#16212e] text-white border border-slate-800"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Sliders/Filter Button */}
        <button className="w-8 h-8 rounded-full bg-[#11161d] border border-slate-900 flex items-center justify-center hover:bg-[#151d27] transition-colors cursor-pointer text-slate-400 hover:text-white">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6. Active Legend / Toggles Bar with close 'X' buttons */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 select-none relative pt-1 border-t border-slate-900/40">
        
        {/* Price Legend (non-removable) */}
        <div className="flex items-center gap-1.5 bg-[#121820]/75 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
          <span>Price</span>
        </div>

        {/* Broker Legends */}
        {activeBrokerCodes.map((code) => {
          const config = ALL_AVAILABLE_BROKERS.find(b => b.code === code);
          if (!config) return null;
          const isHidden = hiddenBrokerCodes.includes(code);

          return (
            <div 
              key={code}
              className={`flex items-center gap-1.5 bg-[#121820]/75 border border-slate-850 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 transition-all ${
                isHidden ? "opacity-35 hover:opacity-60" : "opacity-100"
              }`}
            >
              <button 
                onClick={() => toggleBrokerVisibility(code)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-white"
                title="Sembunyikan/Tampilkan di grafik"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                <span>{code}</span>
              </button>

              <button
                onClick={() => removeBroker(code)}
                className="ml-1 text-slate-500 hover:text-slate-200 text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full bg-slate-950/40 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title={`Hapus ${code}`}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Add broker trigger ("+") button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsAddingBroker(true);
              setBrokerSearchTerm("");
            }}
            className="h-[28px] px-2.5 bg-[#11161d] border border-slate-800 rounded-lg flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-[#10b981] hover:border-[#10b981]/40 transition-all cursor-pointer"
            title="Tambah broker ke komparasi"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden min-[400px]:inline">Broker</span>
          </button>

          {isAddingBroker && typeof document !== "undefined" && createPortal(
            <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-0 sm:p-4 md:p-6 backdrop-blur-sm animate-fadeIn">
              {/* Background overlay click to close on desktop */}
              <div className="absolute inset-0 hidden sm:block cursor-pointer" onClick={() => setIsAddingBroker(false)} />
              
              <div 
                className="relative w-full h-full sm:h-[85vh] sm:max-w-4xl bg-[#090d14] border-0 sm:border border-slate-800/80 rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 select-none z-10 overflow-hidden animate-scaleIn"
              >
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                  <div className="flex flex-col">
                    <h3 className="text-sm sm:text-base font-black text-white font-display tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      Manajer Broker Sekuritas (94 IDX)
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-sans">
                      Pilih, cari, dan kelola broker sekuritas yang ingin Anda tampilkan pada grafik perbandingan aliran modal.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsAddingBroker(false)}
                    className="text-slate-400 hover:text-white text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 cursor-pointer transition-colors"
                    title="Tutup Manajer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Info Stats Row */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
                  <div className="bg-[#11161d] border border-slate-850 rounded-xl p-2 sm:p-3 text-center">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Terdaftar</div>
                    <div className="text-sm sm:text-lg font-mono font-black text-slate-200 mt-0.5">
                      {ALL_AVAILABLE_BROKERS.length} <span className="text-[10px] text-slate-500 font-sans font-normal">Broker</span>
                    </div>
                  </div>
                  <div className="bg-[#11161d] border border-emerald-950/40 rounded-xl p-2 sm:p-3 text-center">
                    <div className="text-[9px] font-black text-emerald-500/85 uppercase tracking-widest">Aktif di Grafik</div>
                    <div className="text-sm sm:text-lg font-mono font-black text-emerald-400 mt-0.5">
                      {activeBrokerCodes.length} <span className="text-[10px] text-emerald-600 font-sans font-normal">Broker</span>
                    </div>
                  </div>
                  <div className="bg-[#11161d] border border-slate-850 rounded-xl p-2 sm:p-3 text-center">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tersedia</div>
                    <div className="text-sm sm:text-lg font-mono font-black text-slate-300 mt-0.5">
                      {ALL_AVAILABLE_BROKERS.length - activeBrokerCodes.length} <span className="text-[10px] text-slate-500 font-sans font-normal">Broker</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={brokerSearchTerm}
                      onChange={(e) => setBrokerSearchTerm(e.target.value)}
                      placeholder="Cari kode broker (cth: XL, YP) atau nama sekuritas..."
                      className="w-full bg-[#11161d] border border-slate-850 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all"
                      autoFocus
                    />
                    {brokerSearchTerm && (
                      <button
                        onClick={() => setBrokerSearchTerm("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white cursor-pointer bg-slate-800 hover:bg-slate-700 w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Tabs Selector */}
                  <div className="flex bg-[#11161d] p-1 border border-slate-850 rounded-xl shrink-0">
                    <button
                      onClick={() => setModalTab("all")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        modalTab === "all" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setModalTab("active")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        modalTab === "active" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Aktif ({activeBrokerCodes.length})
                    </button>
                    <button
                      onClick={() => setModalTab("inactive")}
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        modalTab === "inactive" ? "bg-slate-800 text-slate-200 shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Tersedia ({ALL_AVAILABLE_BROKERS.length - activeBrokerCodes.length})
                    </button>
                  </div>
                </div>

                {/* Table Content Section */}
                <div className="flex-1 overflow-auto border border-slate-850 rounded-xl bg-[#0b0f16]/60">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="sticky top-0 bg-[#0e141f] border-b border-slate-850 z-10 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-3 w-20">Kode</th>
                        <th className="py-3 px-3">Nama Lengkap Sekuritas</th>
                        <th className="py-3 px-3 w-28 text-center">Warna Garis</th>
                        <th className="py-3 px-3 w-32 text-center">Status</th>
                        <th className="py-3 px-4 w-36 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                      {filteredBrokersForModal.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 font-medium font-sans">
                            {ALL_AVAILABLE_BROKERS.length === 0 
                              ? "Belum ada broker terdaftar." 
                              : "Tidak menemukan sekuritas dengan kriteria tersebut."}
                          </td>
                        </tr>
                      ) : (
                        filteredBrokersForModal.map((b, index) => {
                          const isActive = activeBrokerCodes.includes(b.code);
                          return (
                            <tr 
                              key={b.code}
                              className="hover:bg-[#121924]/40 transition duration-150 group"
                            >
                              {/* Index Number */}
                              <td className="py-3 px-4 font-mono text-center text-slate-500 text-[11px]">
                                {index + 1}
                              </td>

                              {/* Broker Code Badge */}
                              <td className="py-3 px-3">
                                <span 
                                  className="font-mono font-black text-xs text-white bg-slate-900 px-2 py-1 rounded-md border border-slate-800 group-hover:border-slate-700 block text-center shadow-sm w-12"
                                  style={{ borderLeft: `3px solid ${b.color}` }}
                                >
                                  {b.code}
                                </span>
                              </td>

                              {/* Broker Full Name */}
                              <td className="py-3 px-3 font-sans font-semibold text-slate-250 group-hover:text-white transition-colors">
                                {b.name}
                              </td>

                              {/* Color Swatch & Code */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full shrink-0 shadow-sm ring-1 ring-white/10" style={{ backgroundColor: b.color }} />
                                  <span className="font-mono text-[10px] text-slate-500 uppercase">{b.color}</span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-3 text-center">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/60 border border-emerald-900/50 text-emerald-400">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                    Aktif
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900 border border-slate-850 text-slate-500">
                                    Tersedia
                                  </span>
                                )}
                              </td>

                              {/* Actions Button */}
                              <td className="py-3 px-4 text-center">
                                {isActive ? (
                                  <button
                                    onClick={() => removeBroker(b.code)}
                                    className="w-full py-1 px-2 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 hover:border-rose-700 text-rose-400 hover:text-rose-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    ✕ Sembunyikan
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => addBroker(b.code)}
                                    className="w-full py-1 px-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/50 hover:border-emerald-600 text-emerald-400 hover:text-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    + Tampilkan
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer status bar */}
                <div className="border-t border-slate-900 pt-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between text-[10.5px] text-slate-500 shrink-0 font-medium font-sans">
                  <span>
                    Menampilkan <span className="font-mono font-black text-slate-350">{filteredBrokersForModal.length}</span> dari <span className="font-mono font-black text-slate-350">{ALL_AVAILABLE_BROKERS.length}</span> total sekuritas terdaftar
                  </span>
                  <button
                    onClick={() => setIsAddingBroker(false)}
                    className="w-full sm:w-auto px-5 py-2 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 hover:text-white rounded-xl border border-cyan-900/50 hover:border-cyan-600 transition-all cursor-pointer font-black uppercase tracking-wider text-xs shadow-md"
                  >
                    Selesai & Terapkan
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Lock button */}
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`h-[28px] w-[28px] bg-[#11161d] border border-slate-800 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isLocked ? "text-emerald-400 hover:bg-[#10b981]/10 border-emerald-950" : "text-slate-400 hover:text-white hover:bg-[#151d27]"
          }`}
          title={isLocked ? "Buka Kunci Skala Sumbu" : "Kunci Skala Sumbu"}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

    </div>
  );
}
