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
