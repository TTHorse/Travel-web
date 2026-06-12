import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SwipeableGallery } from "@/components/gallery/SwipeableGallery";
import { ShareButton } from "@/components/ui/ShareButton";
import type { GalleryPhoto } from "@/components/gallery/SwipeableGallery";

// ============================================================
// 分类数据 - 你可以根据需要修改照片和故事
// ============================================================
interface CategoryData {
  title: string;
  subtitle: string;
  coverImage: string;
  photos: GalleryPhoto[];
}

const CATEGORIES_DATA: Record<string, CategoryData> = {
  "city-walks": {
    title: "城市漫步",
    subtitle: "街角巷尾的温柔时光",
    coverImage: "/cat-02.jpg",
    photos: [
      {
        src: "/cat-02.jpg",
        alt: "老城区的小巷",
        story:
          "穿过老城区的石板路，每一块石头都诉说着百年的故事。阳光透过斑驳的墙壁洒下，时间在这里慢了下来。转角处偶遇一只慵懒的猫，它眯着眼，仿佛在说：急什么，这里的一切都值得慢慢品味。",
        location: "老城区",
        date: "2025 年 11 月",
      },
      {
        src: "/cat-01.png",
        alt: "街头咖啡馆",
        story:
          "街角的咖啡馆是我在这座城市的秘密基地。点一杯拿铁，看窗外人来人往，随手在笔记本上写下今天的见闻。老板已经记住了我的口味，每次都会多加一份奶泡。这种被记住的感觉，让陌生的城市也有了家的温度。",
        location: "文艺街区",
        date: "2025 年 11 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "黄昏时的钟楼",
        story:
          "黄昏时分爬上钟楼，整座城市尽收眼底。金色的光洒在红瓦屋顶上，远处教堂的钟声刚好响起。这一刻，所有的疲惫都消失了，只剩下内心深处的宁静和感动。",
        location: "市中心钟楼",
        date: "2025 年 11 月",
      },
      {
        src: "/cat-01.png",
        alt: "夜市灯火",
        story:
          "夜幕降临，夜市的热闹才刚刚开始。烤串的烟火气、水果摊的叫卖声、孩子们的欢笑声交织在一起。买了一袋刚出炉的糖炒栗子，热乎乎的捧在手心，这是冬日里最简单的幸福。",
        location: "夜市",
        date: "2025 年 11 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "雨后的街道",
        story:
          "一场突如其来的雨，让整条街道变成了一面镜子。霓虹灯映在积水中，城市的倒影比现实更加梦幻。撑伞走过，每一步都小心翼翼，生怕惊扰了这片水中的世界。",
        location: "商业街",
        date: "2025 年 11 月",
      },
      {
        src: "/cat-01.png",
        alt: "清晨的公园",
        story:
          "清晨六点，公园里已经有老人在打太极。薄雾中，他们的动作缓慢而有力，像一首无声的诗。我坐在长椅上，看着太阳慢慢升起，新的一天就这样安静地开始了。",
        location: "城市公园",
        date: "2025 年 11 月",
      },
    ],
  },

  "nature-escapes": {
    title: "山川湖海",
    subtitle: "大自然里的辽阔呼吸",
    coverImage: "/cat-01.png",
    photos: [
      {
        src: "/cat-01.png",
        alt: "山巅日出",
        story:
          "凌晨四点出发，徒步两小时，终于在日出前到达山顶。当第一缕阳光穿透云层，整个天空被染成金橙色，所有的疲惫都化作了惊叹。山风很大，但内心无比平静。",
        location: "高山顶",
        date: "2025 年 10 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "湖面上的晨雾",
        story:
          "湖面上升腾着薄雾，远处的山峦若隐若现。划着小船到湖心，四周安静得只能听到桨划水的声音。这一刻，世界仿佛只剩下我和这片湖水。",
        location: "湖边",
        date: "2025 年 10 月",
      },
      {
        src: "/cat-01.png",
        alt: "森林小径",
        story:
          "走在森林深处的小径上，阳光透过树叶的缝隙洒下斑驳的光影。空气中弥漫着松木的清香，偶尔有松鼠从头顶跳过。在这里，每一次呼吸都是和自然的对话。",
        location: "国家森林公园",
        date: "2025 年 10 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "海边日落",
        story:
          "坐在海边的礁石上，看着太阳一点点沉入海平面。天空从蓝色变成紫色，再到深红，最后归于深蓝。海浪拍打着岩石，发出富有节奏的声音，像大自然的摇篮曲。",
        location: "海边",
        date: "2025 年 10 月",
      },
    ],
  },

  "food-journeys": {
    title: "舌尖旅程",
    subtitle: "每一口都是当地的味道",
    coverImage: "/cat-02.jpg",
    photos: [
      {
        src: "/cat-02.jpg",
        alt: "本地市集",
        story:
          "每到一个新城市，第一站总是当地的市集。新鲜的水果堆成小山，摊主热情地招呼着过路人。买了一颗熟透的芒果，当场切开，甜美的汁水顺着手指流下——这就是旅途中最真实的味道。",
        location: "本地市集",
        date: "2025 年 9 月",
      },
      {
        src: "/cat-01.png",
        alt: "街边小吃摊",
        story:
          "这家不起眼的街边摊，据说已经开了三十年。一碗热腾腾的面端上来，汤底浓郁，面条筋道。坐在简陋的塑料凳上，和邻座的陌生人聊起了各自的故事，食物的温度，也是人与人之间的温度。",
        location: "老街",
        date: "2025 年 9 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "精致甜点",
        story:
          "隐藏在巷子深处的甜品店，是当地朋友强烈推荐的。招牌提拉米苏入口即化，咖啡的微苦和奶油的甜完美平衡。店主是一位从意大利学艺回来的年轻人，每一份甜品都是他的作品。",
        location: "文艺街区",
        date: "2025 年 9 月",
      },
      {
        src: "/cat-01.png",
        alt: "深夜食堂",
        story:
          "午夜十二点，这家小小的居酒屋还亮着暖黄的灯。掀开门帘，烤串的香气扑面而来。点了几串鸡腿肉和一杯生啤，看着厨师在炭火前忙碌。深夜的食物，总有一种特别的治愈力量。",
        location: "深夜食堂",
        date: "2025 年 9 月",
      },
    ],
  },

  "sunset-moments": {
    title: "落日收藏家",
    subtitle: "收集世界各地的黄昏",
    coverImage: "/cat-01.png",
    photos: [
      {
        src: "/cat-01.png",
        alt: "屋顶落日",
        story:
          "爬上酒店的屋顶，正好赶上落日。整个城市的天际线被染成橙红色，远处的玻璃幕墙反射着金光。拿出一罐啤酒，安静地享受这独属于自己的黄昏时刻。这可能是我收藏过最美的一场落日。",
        location: "酒店屋顶",
        date: "2025 年 8 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "海滩落日",
        story:
          "赤脚走在沙滩上，海浪温柔地拍打着脚踝。夕阳把整片海面染成金色，远处的帆船变成一个个剪影。情侣们在沙滩上写下彼此的名字，然后看着海浪把它们抹去，但那份浪漫却永远留在了照片里。",
        location: "海滩",
        date: "2025 年 8 月",
      },
      {
        src: "/cat-01.png",
        alt: "大桥落日",
        story:
          "站在大桥上，看着太阳从城市的天际线缓缓落下。桥上的车流不息，河面上的船只在落日余晖中穿梭。这座城市从不休息，但此刻的黄昏给了它片刻的温柔。",
        location: "跨江大桥",
        date: "2025 年 8 月",
      },
      {
        src: "/cat-02.jpg",
        alt: "沙漠落日",
        story:
          "骑着骆驼深入沙漠，就是为了看这一场落日。当太阳沉入沙丘背后，天空上演了一场惊人的色彩秀——从金黄到紫红，再到深邃的蓝。沙漠的夜晚冷得很快，但那几分钟的壮丽，值得所有的寒冷。",
        location: "沙漠",
        date: "2025 年 8 月",
      },
      {
        src: "/cat-01.png",
        alt: "城市天台",
        story:
          "朋友带我去了一家隐秘的天台酒吧，他说这里有全城最好的落日视角。果然，当太阳缓缓下沉，整座城市都安静了下来。我们举起酒杯，为这美好的一天干杯，也为下一次相聚许下约定。",
        location: "天台酒吧",
        date: "2025 年 8 月",
      },
    ],
  },
};

const ALL_SLUGS = Object.keys(CATEGORIES_DATA);

// ============================================================
// 页面组件
// ============================================================

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = CATEGORIES_DATA[slug];
  if (!data) return { title: "未找到" };

  return {
    title: `${data.title} | 旅行分类`,
    description: data.subtitle,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = CATEGORIES_DATA[slug];

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-16 pb-16 md:pb-20">
      {/* 顶部导航 */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <ShareButton title={data.title} text={data.subtitle} />
        </div>

        {/* 分类标题 */}
        <div className="mb-2">
          <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-2">
            {slug}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {data.title}
          </h1>
          <p className="text-white/50 text-sm md:text-base">
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* 画廊 + 故事 */}
      <div className="max-w-4xl mx-auto px-4">
        <SwipeableGallery photos={data.photos} />
      </div>

      {/* 底部提示 */}
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <p className="text-white/20 text-xs">
          ← 左右滑动切换照片 · 点击照片全屏查看 →
        </p>
      </div>
    </div>
  );
}
