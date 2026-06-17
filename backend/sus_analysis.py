import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

#  1. Load data from system.db 
conn = sqlite3.connect("data/system.db")
df   = pd.read_sql_query("SELECT * FROM usability_feedback", conn)
conn.close()

df.to_csv("sus_responses.csv", index=False)
print(f" Loaded {len(df)} responses")

#  2. Verify SUS scores (recalculate from Q1–Q10) 
odd_qs  = ["q1", "q3", "q5", "q7", "q9"]
even_qs = ["q2", "q4", "q6", "q8", "q10"]

odd_sum  = df[odd_qs].apply(lambda col: col - 1).sum(axis=1)
even_sum = df[even_qs].apply(lambda col: 5 - col).sum(axis=1)
df["sus_score_verified"] = (odd_sum + even_sum) * 2.5

print("\nScore verification (stored vs recalculated):")
print(df[["username", "sus_score", "sus_score_verified"]].to_string(index=False))

#  3. Summary statistics 
avg   = df["sus_score"].mean()
med   = df["sus_score"].median()
mn    = df["sus_score"].min()
mx    = df["sus_score"].max()
std   = df["sus_score"].std()

print(f"\n SUS Summary")
print(f"   Participants : {len(df)}")
print(f"   Average      : {avg:.1f}")
print(f"   Median       : {med:.1f}")
print(f"   Min / Max    : {mn:.1f} / {mx:.1f}")
print(f"   Std Dev      : {std:.1f}")

#  4. Grade each participant 
def sus_grade(score):
    if score >= 85:  return "Excellent"
    elif score >= 71: return "Good"
    elif score >= 68: return "Okay"
    else:             return "Poor"

def sus_color(score):
    if score >= 85:  return "#2ecc71"   # green
    elif score >= 71: return "#3498db"  # blue
    elif score >= 68: return "#f39c12"  # orange
    else:             return "#e74c3c"  # red

df["grade"] = df["sus_score"].apply(sus_grade)
df["color"] = df["sus_score"].apply(sus_color)

#  5. Plot figure8_sus_scores.png 
fig, ax = plt.subplots(figsize=(10, 6))

x      = np.arange(len(df))
bars   = ax.bar(x, df["sus_score"], color=df["color"], edgecolor="white",
                linewidth=0.8, width=0.55, zorder=3)

# Threshold lines
ax.axhline(68, color="#e74c3c", linestyle="--", linewidth=1.4,
           label="Acceptable threshold (68)", zorder=2)
ax.axhline(avg, color="#2c3e50", linestyle="-.", linewidth=1.4,
           label=f"Mean score ({avg:.1f})", zorder=2)

# Score labels on bars
for bar, score, grade in zip(bars, df["sus_score"], df["grade"]):
    ax.text(bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 1.5,
            f"{score:.0f}\n({grade})",
            ha="center", va="bottom", fontsize=9, fontweight="bold")

# Axes formatting
ax.set_xticks(x)
ax.set_xticklabels(df["username"], fontsize=10)
ax.set_ylim(0, 115)
ax.set_xlabel("Participant", fontsize=11)
ax.set_ylabel("SUS Score", fontsize=11)
ax.set_title("System Usability Scale (SUS) Scores per Participant", fontsize=13, fontweight="bold")
ax.yaxis.grid(True, linestyle="--", alpha=0.5, zorder=0)
ax.set_axisbelow(True)

# Legend
legend_patches = [
    mpatches.Patch(color="#2ecc71", label="Excellent (≥85)"),
    mpatches.Patch(color="#3498db", label="Good (71–84)"),
    mpatches.Patch(color="#f39c12", label="Okay (68–70)"),
    mpatches.Patch(color="#e74c3c", label="Poor (<68)"),
]
ax.legend(handles=legend_patches + [
    plt.Line2D([0], [0], color="#e74c3c", linestyle="--", label="Threshold (68)"),
    plt.Line2D([0], [0], color="#2c3e50", linestyle="-.", label=f"Mean ({avg:.1f})"),
], fontsize=9, loc="upper right")

plt.tight_layout()
plt.savefig("figure8_sus_scores.png", dpi=300, bbox_inches="tight")
plt.show()
print("\n figure8_sus_scores.png saved.")

#  6. Save summary CSV 
summary = pd.DataFrame({
    "Metric": ["Participants", "Mean SUS", "Median SUS", "Min", "Max", "Std Dev", "Overall Grade"],
    "Value":  [len(df), f"{avg:.1f}", f"{med:.1f}", f"{mn:.1f}", f"{mx:.1f}", f"{std:.1f}", sus_grade(avg)]
})
summary.to_csv("sus_summary.csv", index=False)
print(" sus_summary.csv saved.")
