import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // 新增 token 的 class 契约：即使组件还没引用，也保证产物 CSS 里存在（Day2/4/5 组件按这套名字写 class）
  safelist: [
    'bg-surface-2',
    'text-surface-2',
    'border-surface-2',
    'bg-zhu-glow',
    'text-star-miao',
    'text-star-xian',
    'text-display',
    'text-title',
    'text-star-major',
    'text-star-minor',
    'text-star-misc',
  ],
  theme: {
    extend: {
      colors: {
        // 冷白底与雾面板：深海蓝文字、蓝绿主色、低对比边框
        paper: '#F1F6F8',
        surface: '#FBFEFF',
        'surface-2': '#E8F1F5',
        line: '#C7D9E1',
        lineSoft: '#DFEBEF',
        ink: {
          DEFAULT: '#102B3A',
          2: '#496575',
          3: '#66818E',
        },
        zhu: {
          DEFAULT: '#0A7194',
          soft: '#DCF0F5',
          deep: '#064F6C',
          glow: 'rgba(10, 113, 148, 0.22)',
        },
        hua: {
          lu: '#167965',
          quan: '#675AA8',
          ke: '#176D9F',
          ji: '#B34155',
        },
        star: {
          miao: '#926324',
          xian: '#657B87',
        },
        danger: '#B34155',
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Songti SC"', '"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        display: ['1.75rem', { lineHeight: '1.15', letterSpacing: '0.14em' }],
        title: ['1.125rem', { lineHeight: '1.35', letterSpacing: '0.08em' }],
        'star-major': ['0.8125rem', { lineHeight: '1.3' }],
        'star-minor': ['0.6875rem', { lineHeight: '1.35' }],
        'star-misc': ['0.625rem', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        wide2: '0.18em',
      },
      maxWidth: {
        board: '58rem',
      },
    },
  },
  plugins: [],
};

export default config;
