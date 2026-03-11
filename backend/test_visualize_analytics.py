"""
Test script to visualize analytics data from the API.
Run: python test_visualize_analytics.py
"""

import requests
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

# Configuration
API_URL = "http://localhost:8080/analytics/miikka_migreeni"
USER_ID = "miikka_migreeni"
DAYS = 30

# Fetch data
print(f"Fetching analytics for {USER_ID}...")
response = requests.get(f"{API_URL}?days={DAYS}")
data = response.json()

print(f"✓ Got data for {data['summary']['total_records']} records")
print(f"✓ {data['summary']['total_migraines']} migraines ({data['summary']['migraine_rate']}%)\n")

# Create figure with subplots - Much more compact
fig = plt.figure(figsize=(12, 8))
fig.suptitle(f'Migraine Analytics - {USER_ID.replace("_", " ").title()} ({DAYS} days)',
             fontsize=14, fontweight='bold', y=0.98)

gs = GridSpec(2, 3, figure=fig, hspace=0.35, wspace=0.35,
              left=0.08, right=0.95, top=0.92, bottom=0.08)

# ============================================================================
# 1. Summary Metrics (top-left)
# ============================================================================
ax_summary = fig.add_subplot(gs[0, 0])
ax_summary.axis('off')

summary_text = f"""
📊 SUMMARY

Records: {data['summary']['total_records']}
Migraines: {data['summary']['total_migraines']}
Rate: {data['summary']['migraine_rate']}%

💤 SLEEP IMPACT
{data['sleep_chart']['insight']}

🍺 ALCOHOL IMPACT
{data['alcohol_chart']['insight']}
"""

ax_summary.text(0.05, 0.5, summary_text.strip(),
                fontsize=9,
                verticalalignment='center',
                bbox=dict(boxstyle='round', facecolor='#f0f0f0', alpha=0.8))

# ============================================================================
# 2. Sleep Comparison (top-middle) - Compact
# ============================================================================
ax_sleep = fig.add_subplot(gs[0, 1])
sleep_data = data['sleep_chart']

bars = ax_sleep.bar(['With', 'Without'], sleep_data['values'],
                     color=['#FC8181', '#4299E1'], width=0.5)
ax_sleep.set_title('💤 ' + sleep_data['title'], fontsize=11, fontweight='bold', pad=8)
ax_sleep.set_ylabel('Hours', fontsize=9)
ax_sleep.set_ylim(0, max(sleep_data['values']) * 1.15)
ax_sleep.tick_params(labelsize=8)

# Value labels
for bar in bars:
    height = bar.get_height()
    ax_sleep.text(bar.get_x() + bar.get_width()/2., height,
                  f'{height:.1f}h',
                  ha='center', va='bottom', fontsize=9, fontweight='bold')

# ============================================================================
# 3. Alcohol Comparison (top-right) - Compact
# ============================================================================
ax_alcohol = fig.add_subplot(gs[0, 2])
alcohol_data = data['alcohol_chart']

bars = ax_alcohol.bar(['With', 'Without'], alcohol_data['values'],
                       color=['#FC8181', '#4299E1'], width=0.5)
ax_alcohol.set_title('🍺 ' + alcohol_data['title'], fontsize=11, fontweight='bold', pad=8)
ax_alcohol.set_ylabel('Units', fontsize=9)
ax_alcohol.set_ylim(0, max(alcohol_data['values']) * 1.15 if max(alcohol_data['values']) > 0 else 1)
ax_alcohol.tick_params(labelsize=8)

# Value labels
for bar in bars:
    height = bar.get_height()
    ax_alcohol.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}',
                    ha='center', va='bottom', fontsize=9, fontweight='bold')

# ============================================================================
# 4. Time Patterns Pie Chart (bottom-left) - Compact
# ============================================================================
ax_time = fig.add_subplot(gs[1, 0])
time_data = data['time_patterns_chart']

# Filter out zero values
pie_data = [d for d in time_data['data'] if d['value'] > 0]

if pie_data:
    values = [d['value'] for d in pie_data]
    labels = [d['name'].split('(')[0].strip() for d in pie_data]  # Shorter labels
    colors = [d['color'] for d in pie_data]

    wedges, texts, autotexts = ax_time.pie(values, labels=labels, colors=colors,
                                             autopct='%1.0f%%', startangle=90,
                                             textprops={'fontsize': 8})

    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
        autotext.set_fontsize(9)

    ax_time.set_title('🕐 ' + time_data['title'], fontsize=11, fontweight='bold', pad=8)
else:
    ax_time.text(0.5, 0.5, 'No data',
                 ha='center', va='center', fontsize=10)
    ax_time.set_title('🕐 ' + time_data['title'], fontsize=11, fontweight='bold')


# ============================================================================
# 5. Timeline Chart (bottom, span 2 columns) - Compact
# ============================================================================
ax_timeline = fig.add_subplot(gs[1, 1:])
timeline_data = data['timeline_chart']['data']

if timeline_data['labels']:
    x_pos = range(len(timeline_data['labels']))

    # Plot migraine count
    ax_timeline.plot(x_pos, timeline_data['datasets'][0]['data'],
                     color=timeline_data['datasets'][0]['color'],
                     marker='o', linewidth=2, markersize=6,
                     label=timeline_data['datasets'][0]['label'])

    # Plot sleep hours on secondary y-axis
    ax2 = ax_timeline.twinx()
    ax2.plot(x_pos, timeline_data['datasets'][1]['data'],
             color=timeline_data['datasets'][1]['color'],
             marker='s', linewidth=2, markersize=6,
             label=timeline_data['datasets'][1]['label'],
             linestyle='--')

    ax_timeline.set_xlabel('Date', fontsize=9)
    ax_timeline.set_ylabel('Migraines', color=timeline_data['datasets'][0]['color'], fontsize=9)
    ax2.set_ylabel('Sleep (h)', color=timeline_data['datasets'][1]['color'], fontsize=9)

    ax_timeline.set_xticks(x_pos)
    ax_timeline.set_xticklabels([l.split('-')[1] + '/' + l.split('-')[2] for l in timeline_data['labels']],
                                fontsize=8)
    ax_timeline.tick_params(labelsize=8)
    ax2.tick_params(labelsize=8)

    ax_timeline.set_title('📈 ' + data['timeline_chart']['title'],
                         fontsize=11, fontweight='bold', pad=8)

    # Compact legend
    lines1, labels1 = ax_timeline.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax_timeline.legend(lines1 + lines2, labels1 + labels2,
                      loc='upper left', fontsize=8, framealpha=0.9)

    ax_timeline.grid(True, alpha=0.2, linestyle=':')
else:
    ax_timeline.text(0.5, 0.5, 'No timeline data',
                     ha='center', va='center', transform=ax_timeline.transAxes, fontsize=10)
    ax_timeline.set_title('📈 Timeline', fontsize=11, fontweight='bold')

# ============================================================================
# Show the dashboard
# ============================================================================
print("\n" + "="*60)
print("✓ Compact Dashboard Generated!")
print("="*60)
plt.show()
