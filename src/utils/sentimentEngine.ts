/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sentiment Analysis Engine for SahamIndo.com
 * Computes a standardized sentiment score from 1 (Extreme Bearish) to 10 (Extreme Bullish)
 * based on Broker Transaction Flow (netValue & accumulation status) and Technical Price Volume forces.
 */
export const getSentimentScore = (brokerData: any, technicalData: any) => {
  let score = 5; // Skor netral (Neutral)

  // Analisis Broker
  if (brokerData && brokerData.netValue > 0) {
    score += 2;
  } else if (brokerData && brokerData.netValue < 0) {
    score -= 2;
  }

  if (brokerData && brokerData.isAccumulation) {
    score += 2;
  } else if (brokerData && brokerData.isDistribution) {
    score -= 2;
  }

  // Analisis Volume
  if (technicalData && technicalData.volume > technicalData.avgVolume) {
    score += 1;
  } else if (technicalData && technicalData.volume < technicalData.avgVolume * 0.7) {
    score -= 1;
  }

  // Batasi skor agar tepat berada di rentang 1-10
  return Math.min(Math.max(score, 1), 10);
};

/**
 * Returns descriptive feedback, category, color styles and narratives based on the calculated sentiment score
 */
export const getSentimentMetadata = (score: number) => {
  if (score > 7) {
    return {
      category: "BULLISH / AKUMULASI KUAT",
      narrative: "Saham ini sedang dalam fase akumulasi oleh institusi.",
      colorClass: "text-emerald-400",
      strokeColor: "#10b981",
      bgColorClass: "bg-emerald-950/20 border-emerald-500/20",
      gaugeColor: "#10b981", // Emerald Green
    };
  } else if (score >= 6) {
    return {
      category: "BULLISH RINGAN",
      narrative: "Tingkat pembelian terpantau positif dengan partisipasi ritel sehat.",
      colorClass: "text-green-400",
      strokeColor: "#22c55e",
      bgColorClass: "bg-green-950/15 border-green-500/10",
      gaugeColor: "#22c55e", 
    };
  } else if (score === 5) {
    return {
      category: "NETRAL / SIDEWAYS",
      narrative: "Aliran dana seimbang. Pasar belum menentukan arah pergerakan harga.",
      colorClass: "text-yellow-400",
      strokeColor: "#eab308",
      bgColorClass: "bg-yellow-950/10 border-yellow-500/10",
      gaugeColor: "#eab308", // Yellow
    };
  } else if (score >= 4) {
    return {
      category: "BEARISH RINGAN",
      narrative: "Tekanan jual mulai mendominasi tipis, waspadai pelemahan minor.",
      colorClass: "text-orange-400",
      strokeColor: "#fb923c",
      bgColorClass: "bg-orange-950/10 border-orange-500/10",
      gaugeColor: "#fb923c",
    };
  } else {
    // Score < 4
    return {
      category: "BEARISH / DISTRIBUSI PEKAT",
      narrative: "Waspada: Distribusi sedang berlangsung.",
      colorClass: "text-rose-400",
      strokeColor: "#f43f5e",
      bgColorClass: "bg-rose-950/20 border-rose-500/20",
      gaugeColor: "#f43f5e", // Rose Red
    };
  }
};
