import pandas as pd, requests, re, sys

def extract_price(text):
    # look for patterns like 12345 руб, 12 345 ₽, $123.45
    patterns = [
        r'(\d{1,3}(?:[\s\d]{0,3})\d{0,3})\s*(?:₽|руб|р|RUB|USD|\$)',
        r'(\d+[.,]\d+)\s*(?:₽|руб|р|RUB|USD|\$)'
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            num = m.group(1).replace(' ', '').replace(',', '.')
            try:
                return float(num)
            except:
                return 0
    return 0

def main():
    file_path = 'projects/42/Подбор мебели и материалов.xlsx'
    df = pd.read_excel(file_path, header=None)
    # find header row where first cell contains '№ пом.'
    header_idx = None
    for i in range(len(df)):
        if str(df.iloc[i,0]).strip() == '№ пом.':
            header_idx = i
            break
    if header_idx is None:
        print('Header not found')
        sys.exit(1)
    cols = df.iloc[header_idx]
    data = df.iloc[header_idx+1:]
    data.columns = cols
    total = 0.0
    count = 0
    for idx, row in data.iterrows():
        url = str(row.get('Ссылка') or '').strip()
        if not url or url.lower() == 'nan':
            continue
        try:
            r = requests.get(url, timeout=15)
            price = extract_price(r.text)
            total += price
            count += 1
            print(f"{idx}: {url} -> {price}")
        except Exception as e:
            print(f"{idx}: error {e}")
    print('Processed', count, 'items')
    print('TOTAL price (approx):', total)

if __name__ == '__main__':
    main()