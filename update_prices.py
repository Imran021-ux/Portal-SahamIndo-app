import requests
import json

def update_prices():
    url = "https://www.idx.co.id/primary/StockData/GetStockUploader"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        # Simpan ke folder public agar bisa diakses website
        with open('./public/data/latest_prices.json', 'w') as f:
            json.dump({item['StockCode']: item['Close'] for item in data.get('data', [])}, f)
        print("Data berhasil diupdate!")

update_prices()

import requests
import json
import os

def update_prices():
    url = "https://www.idx.co.id/primary/StockData/GetStockUploader"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Pastikan folder target ada
            os.makedirs('./public/data', exist_ok=True)
            
            with open('./public/data/latest_prices.json', 'w') as f:
                # Mengambil data dengan aman
                stock_data = {item['StockCode']: item['Close'] for item in data.get('data', [])}
                json.dump(stock_data, f, indent=4)
            print("Data berhasil diupdate!")
        else:
            print(f"Gagal mengambil data, status kode: {response.status_code}")
    except Exception as e:
        print(f"Terjadi kesalahan: {e}")

update_prices()

