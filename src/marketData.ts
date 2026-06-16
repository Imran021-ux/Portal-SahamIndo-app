// Official manual reference market data for SahamIndo.com
export const marketData = {
  ihsg_close: 6254.97,
  prev_close: 6007.66,
  chartConfig: {
    min: 5800,
    max: 6500
  },
  categories: {
    BPJS: ['BBCA', 'BBRI'],
    BSJP: ['BMRI', 'BBNI'],
    Swing: ['TLKM', 'ASII']
  },
  emiten: {
    BBCA: { currentPrice: 10250, prevClose: 10200, name: "PT Bank Central Asia Tbk" },
    BBRI: { currentPrice: 4380, prevClose: 4440, name: "PT Bank Rakyat Indonesia (Persero) Tbk" },
    BMRI: { currentPrice: 6125, prevClose: 6050, name: "PT Bank Mandiri (Persero) Tbk" },
    BBNI: { currentPrice: 4890, prevClose: 4890, name: "PT Bank Negara Indonesia (Persero) Tbk" },
    TLKM: { currentPrice: 2780, prevClose: 2750, name: "PT Telkom Indonesia Tbk" },
    ASII: { currentPrice: 4650, prevClose: 4700, name: "PT Astra International Tbk" },
    IHSG: { currentPrice: 6254.97, prevClose: 6007.66, name: "IHSG Composite" }
  } as Record<string, { currentPrice: number; prevClose: number; name: string }>
};
