import { getTravelStats } from "@/lib/data/trips";
import { AnimatedNumber } from "./AnimatedNumber";

export async function StatsCounter() {
  let stats = { totalTrips: 0, totalCountries: 0, totalCities: 0 };

  try {
    stats = await getTravelStats();
  } catch {
    // 数据库未配置时使用默认值
  }

  const statItems = [
    { value: stats.totalTrips, label: "次旅行" },
    { value: stats.totalCountries, label: "个国家" },
    { value: stats.totalCities, label: "个城市" },
    { value: stats.totalTrips, label: "篇攻略", suffix: "+" },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400 tabular-nums">
              <AnimatedNumber value={item.value} suffix={item.suffix || ""} />
            </div>
            <div className="mt-2 text-white/50 text-sm">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
