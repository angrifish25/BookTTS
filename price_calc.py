import pandas as pd, requests, re, sys

def extract_price(text):
    # simple regex for price like 12345 руб or $123.45
    m = re.search(r'(\d+[\s]?\d*)\s?(?:₽|руб|р|RUB|USD|\$)', text, re.IGNORECASE)
    if m:
        # remove spaces
        return int(m.group(1).replace(' ', ''))
    return 0

def main():
    file_path = 'projects/42/Подбор мебели и материалов.xlsx'
    df = pd.read_excel(file_path, sheet_name=0)
    total = 0
    for idx, row in df.iterrows():
        url = str(row.get('Ссылка') or '').strip()
        if not url:
            continue
        try:
            r = requests.get(url, timeout=10)
            price = extract_price(r.text)
            total += price
            print(f"{idx}: {url} -> {price}")
        except Exception as e:
            print(f"{idx}: error fetching {url}: {e}")
    print('TOTAL:', total)

if __name__ == '__main__':
    main()