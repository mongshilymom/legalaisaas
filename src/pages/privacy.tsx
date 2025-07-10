import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft } from 'lucide-react';

const PrivacyPolicy: NextPage = () => {
  const { t, i18n } = useTranslation();

  const getContent = () => {
    switch (i18n.language) {
      case 'ja':
        return {
          title: 'プライバシーポリシー',
          lastUpdated: '最終更新日: 2024年7月10日',
          sections: [
            {
              title: '1. 収集する情報',
              content: 'Legal AI SaaS（以下「当社」）は、サービス提供のために以下の情報を収集します：\n\n• 個人識別情報：氏名、メールアドレス、電話番号\n• 技術情報：IPアドレス、ブラウザタイプ、デバイス情報\n• 使用データ：サービス利用履歴、契約書分析履歴\n• 支払い情報：クレジットカード情報（Stripeにより安全に処理）'
            },
            {
              title: '2. 情報の利用目的',
              content: '収集した情報は以下の目的で利用します：\n\n• サービスの提供と運営\n• ユーザーサポートの提供\n• サービスの改善と新機能の開発\n• 法的要件の遵守\n• セキュリティとプライバシーの保護'
            },
            {
              title: '3. 情報の共有',
              content: '当社は、法的要求がある場合を除き、お客様の個人情報を第三者と共有しません。ただし、以下のサービスプロバイダーと必要最小限の情報を共有する場合があります：\n\n• Stripe（支払い処理）\n• Vercel（ホスティング）\n• Anthropic（AI処理）'
            },
            {
              title: '4. データセキュリティ',
              content: '当社は業界標準のセキュリティ対策を実装しています：\n\n• データの暗号化（転送時・保存時）\n• アクセス制御と認証\n• 定期的なセキュリティ監査\n• インシデント対応手順'
            },
            {
              title: '5. お客様の権利',
              content: 'お客様には以下の権利があります：\n\n• データアクセス権：保存されているデータの確認\n• データ修正権：不正確なデータの修正\n• データ削除権：アカウント削除時のデータ削除\n• データポータビリティ権：データの移行'
            },
            {
              title: '6. Cookieの使用',
              content: '当社は、サービスの向上とユーザー体験の改善のためにCookieを使用します。必要に応じてブラウザの設定でCookieを無効にできます。'
            },
            {
              title: '7. 子どものプライバシー',
              content: '当社のサービスは13歳未満の児童を対象としていません。13歳未満の児童の個人情報を故意に収集することはありません。'
            },
            {
              title: '8. 国際データ転送',
              content: 'お客様のデータは、適切な保護措置が講じられた上で、日本国外のサーバーで処理される場合があります。'
            },
            {
              title: '9. プライバシーポリシーの変更',
              content: '当社は、本プライバシーポリシーを随時更新する場合があります。重要な変更については、メールまたはサービス内での通知を行います。'
            },
            {
              title: '10. お問い合わせ',
              content: 'プライバシーに関するご質問は、privacy@legalaisaas.comまでお問い合わせください。'
            }
          ]
        };
      case 'zh':
        return {
          title: '隐私政策',
          lastUpdated: '最后更新：2024年7月10日',
          sections: [
            {
              title: '1. 信息收集',
              content: 'Legal AI SaaS（以下简称"我们"）为提供服务会收集以下信息：\n\n• 个人识别信息：姓名、电子邮件地址、电话号码\n• 技术信息：IP地址、浏览器类型、设备信息\n• 使用数据：服务使用历史、合同分析历史\n• 支付信息：信用卡信息（由Stripe安全处理）'
            },
            {
              title: '2. 信息使用目的',
              content: '我们收集的信息用于以下目的：\n\n• 提供和运营服务\n• 提供用户支持\n• 改进服务和开发新功能\n• 遵守法律要求\n• 保护安全和隐私'
            },
            {
              title: '3. 信息共享',
              content: '除法律要求外，我们不会与第三方共享您的个人信息。但我们可能与以下服务提供商共享必要的最少信息：\n\n• Stripe（支付处理）\n• Vercel（托管服务）\n• Anthropic（AI处理）'
            },
            {
              title: '4. 数据安全',
              content: '我们实施行业标准的安全措施：\n\n• 数据加密（传输和存储时）\n• 访问控制和身份验证\n• 定期安全审计\n• 事件响应程序'
            },
            {
              title: '5. 用户权利',
              content: '您拥有以下权利：\n\n• 数据访问权：查看存储的数据\n• 数据修正权：修正不准确的数据\n• 数据删除权：删除账户时删除数据\n• 数据可移植权：数据迁移'
            },
            {
              title: '6. Cookie使用',
              content: '我们使用Cookie来改进服务和提升用户体验。您可以在浏览器设置中禁用Cookie。'
            },
            {
              title: '7. 儿童隐私',
              content: '我们的服务不面向13岁以下儿童。我们不会故意收集13岁以下儿童的个人信息。'
            },
            {
              title: '8. 国际数据传输',
              content: '您的数据可能在适当保护措施下在中国境外的服务器上处理。'
            },
            {
              title: '9. 隐私政策变更',
              content: '我们可能会不时更新本隐私政策。重要变更将通过电子邮件或服务内通知告知您。'
            },
            {
              title: '10. 联系我们',
              content: '如有隐私相关问题，请联系：privacy@legalaisaas.com'
            }
          ]
        };
      case 'en':
        return {
          title: 'Privacy Policy',
          lastUpdated: 'Last updated: July 10, 2024',
          sections: [
            {
              title: '1. Information We Collect',
              content: 'Legal AI SaaS ("we", "our", or "us") collects the following information to provide our services:\n\n• Personal Identification Information: Name, email address, phone number\n• Technical Information: IP address, browser type, device information\n• Usage Data: Service usage history, contract analysis history\n• Payment Information: Credit card information (securely processed by Stripe)'
            },
            {
              title: '2. How We Use Information',
              content: 'We use the collected information for the following purposes:\n\n• Providing and operating our services\n• Providing user support\n• Improving our services and developing new features\n• Complying with legal requirements\n• Protecting security and privacy'
            },
            {
              title: '3. Information Sharing',
              content: 'We do not share your personal information with third parties except as required by law. However, we may share minimal necessary information with the following service providers:\n\n• Stripe (payment processing)\n• Vercel (hosting)\n• Anthropic (AI processing)'
            },
            {
              title: '4. Data Security',
              content: 'We implement industry-standard security measures:\n\n• Data encryption (in transit and at rest)\n• Access controls and authentication\n• Regular security audits\n• Incident response procedures'
            },
            {
              title: '5. Your Rights',
              content: 'You have the following rights:\n\n• Data access rights: View stored data\n• Data correction rights: Correct inaccurate data\n• Data deletion rights: Delete data when account is deleted\n• Data portability rights: Data migration'
            },
            {
              title: '6. Cookie Usage',
              content: 'We use cookies to improve our services and enhance user experience. You can disable cookies in your browser settings if needed.'
            },
            {
              title: '7. Children\'s Privacy',
              content: 'Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.'
            },
            {
              title: '8. International Data Transfers',
              content: 'Your data may be processed on servers outside your country of residence with appropriate safeguards in place.'
            },
            {
              title: '9. Privacy Policy Changes',
              content: 'We may update this privacy policy from time to time. We will notify you of significant changes via email or in-service notification.'
            },
            {
              title: '10. Contact Us',
              content: 'For privacy-related questions, please contact us at: privacy@legalaisaas.com'
            }
          ]
        };
      default:
        return {
          title: '개인정보처리방침',
          lastUpdated: '최종 업데이트: 2024년 7월 10일',
          sections: [
            {
              title: '1. 수집하는 개인정보',
              content: 'Legal AI SaaS(이하 "회사")는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:\n\n• 개인식별정보: 성명, 이메일 주소, 전화번호\n• 기술정보: IP 주소, 브라우저 종류, 기기 정보\n• 이용정보: 서비스 이용기록, 계약서 분석 기록\n• 결제정보: 신용카드 정보 (Stripe를 통해 안전하게 처리)'
            },
            {
              title: '2. 개인정보 이용목적',
              content: '수집된 개인정보는 다음 목적으로 이용됩니다:\n\n• 서비스 제공 및 운영\n• 고객 지원 서비스 제공\n• 서비스 개선 및 신기능 개발\n• 법적 요구사항 준수\n• 보안 및 개인정보 보호'
            },
            {
              title: '3. 개인정보 제3자 제공',
              content: '회사는 법적 요구가 있는 경우를 제외하고 고객의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 서비스 제공업체와 필요 최소한의 정보를 공유할 수 있습니다:\n\n• Stripe (결제 처리)\n• Vercel (호스팅)\n• Anthropic (AI 처리)'
            },
            {
              title: '4. 개인정보 보안',
              content: '회사는 업계 표준의 보안 조치를 구현합니다:\n\n• 데이터 암호화 (전송 및 저장 시)\n• 접근 제어 및 인증\n• 정기적인 보안 감사\n• 사고 대응 절차'
            },
            {
              title: '5. 정보주체의 권리',
              content: '정보주체는 다음과 같은 권리를 가집니다:\n\n• 개인정보 열람권: 저장된 개인정보 확인\n• 개인정보 정정·삭제권: 부정확한 정보의 수정 및 삭제\n• 개인정보 처리정지권: 개인정보 처리 중단 요구\n• 손해배상청구권: 개인정보 침해로 인한 손해배상'
            },
            {
              title: '6. 쿠키 사용',
              content: '회사는 서비스 향상과 사용자 경험 개선을 위해 쿠키를 사용합니다. 필요시 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.'
            },
            {
              title: '7. 아동의 개인정보 보호',
              content: '회사의 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.'
            },
            {
              title: '8. 개인정보의 국외이전',
              content: '고객의 개인정보는 적절한 보호조치가 마련된 상태에서 국외 서버에서 처리될 수 있습니다.'
            },
            {
              title: '9. 개인정보처리방침의 변경',
              content: '회사는 본 개인정보처리방침을 수시로 변경할 수 있으며, 중요한 변경사항에 대해서는 이메일 또는 서비스 내 공지를 통해 알려드립니다.'
            },
            {
              title: '10. 연락처',
              content: '개인정보 관련 문의사항은 privacy@legalaisaas.com으로 연락주시기 바랍니다.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <>
      <Head>
        <title>{content.title} | Legal AI SaaS</title>
        <meta name="description" content={`Legal AI SaaS ${content.title}`} />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t('home', 'Home')}
              </Link>
              <div className="flex items-center ml-4">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">Legal AI SaaS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
              <p className="text-gray-600">{content.lastUpdated}</p>
            </div>

            <div className="prose max-w-none">
              {content.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {i18n.language === 'ja' ? 'お問い合わせ' : 
                   i18n.language === 'zh' ? '联系我们' :
                   i18n.language === 'en' ? 'Contact Us' : '문의하기'}
                </h3>
                <p className="text-blue-800">
                  {i18n.language === 'ja' ? 'プライバシーに関するご質問がございましたら、お気軽にお問い合わせください。' :
                   i18n.language === 'zh' ? '如果您对隐私有任何疑问，请随时联系我们。' :
                   i18n.language === 'en' ? 'If you have any questions about privacy, please feel free to contact us.' :
                   '개인정보보호에 관한 문의사항이 있으시면 언제든지 연락주세요.'}
                </p>
                <a href="mailto:privacy@legalaisaas.com" className="text-blue-600 hover:text-blue-700 font-medium">
                  privacy@legalaisaas.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;