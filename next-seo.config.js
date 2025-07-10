export default {
  title: 'Legal AI SaaS – 법률 자동화의 미래',
  description: 'AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요. 법률 업무 효율성을 극대화하는 차세대 솔루션.',
  canonical: process.env.NEXT_PUBLIC_APP_URL,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Legal AI SaaS',
    title: 'Legal AI SaaS – 법률 자동화의 미래',
    description: 'AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Legal AI SaaS',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    handle: '@legalaisaas',
    site: '@legalaisaas',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: '법률 AI, 계약서 분석, 컴플라이언스, 규제 준수, 법률 자동화, Legal AI, SaaS',
    },
    {
      name: 'author',
      content: 'Legal AI SaaS Team',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
};
