# Spreadsheet スキーマ

## シート: inventory（A1にヘッダ）
id,name,unitWeight_g,mode,lastMonth_pcs,currentWeight_g,currentCount_pcs,yearStart_pcs,updatedAt

## シート: records（A1にヘッダ）
ts,id,method,inputWeight_g,inputCount_pcs,computed_pcs

# 初期データ例（inventory、ヘッダの次行〜）
BT-M6-20,ボルト M6 x 20,2.25,weight,500,0,0,500,
WS-M6,ワッシャ M6,0.85,weight,800,0,0,800,
NT-M6,ナット M6,1.10,weight,600,0,0,600,
PIN-2MM,ダウエルピン 2mm,0.35,weight,1200,0,0,1200,
