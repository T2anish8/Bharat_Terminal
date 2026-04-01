import pandas as pd
import matplotlib.pyplot as plt
file_path = r"C:\\Users\\Tanish Agarwal\\Downloads\\data 5.csv"
df = pd.read_csv(file_path, encoding='latin1')
print("\nInput (Dataset Preview):\n")
print(df.head(5))
df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])
df["Sales"] = df["Quantity"] * df["UnitPrice"]
df["Discount"] = 0.05 + (df["Quantity"] % 3) * 0.05  
df["Discounted_Sales"] = df["Sales"] * (1 - df["Discount"])
df["Cost"] = df["Discounted_Sales"] * (0.6 + (df["Quantity"] % 5) * 0.05)
df["Profit"] = df["Discounted_Sales"] - df["Cost"]
df["Month"] = df["InvoiceDate"].dt.to_period("M")
monthly = df.groupby("Month").agg(
    Total_Sales=("Discounted_Sales", "sum"),
    Total_Profit=("Profit", "sum"),
    Avg_Discount=("Discount", "mean")
).reset_index()
monthly["Profit_Margin_%"] = (monthly["Total_Profit"] / monthly["Total_Sales"]) * 100
print("\nMonthly KPI Table:\n")
print(monthly.tail(12))
total_sales = monthly["Total_Sales"].sum()
avg_margin = monthly["Profit_Margin_%"].mean()
avg_discount = monthly["Avg_Discount"].mean() * 100
print("\n===== KPI WALLBOARD =====")
print(f"Total Sales: {total_sales:,.0f}")
print(f"Average Profit Margin: {avg_margin:.2f}%")
print(f"Average Discount: {avg_discount:.2f}%")

plt.figure(figsize=(10,4))
plt.plot(monthly["Month"].astype(str), monthly["Total_Sales"], marker="o")
plt.title("Monthly Sales Trend")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
plt.figure(figsize=(10,4))
plt.plot(monthly["Month"].astype(str), monthly["Profit_Margin_%"], marker="o")
plt.title("Profit Margin Trend (%)")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
plt.figure(figsize=(10,4))
plt.plot(monthly["Month"].astype(str), monthly["Avg_Discount"] * 100, marker="o")
plt.title("Average Discount Trend (%)")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()