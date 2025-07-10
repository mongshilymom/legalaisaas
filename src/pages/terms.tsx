import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft } from 'lucide-react';

const TermsOfService: NextPage = () => {
  const { t, i18n } = useTranslation();

  const getContent = () => {
    switch (i18n.language) {
      case 'ja':
        return {
          title: '利用規約',
          lastUpdated: '最終更新日: 2024年7月10日',
          sections: [
            {
              title: '1. サービスの概要',
              content: 'Legal AI SaaS（以下「本サービス」）は、AI技術を活用した法律文書の分析、契約書生成、コンプライアンス支援を提供するクラウドベースのサービスです。'
            },
            {
              title: '2. 利用資格',
              content: '本サービスは以下の条件を満たす方がご利用いただけます：\n\n• 18歳以上の個人または法人\n• 有効なメールアドレスを所有している\n• 本規約に同意している\n• 適用される法律に従ってサービスを利用する'
            },
            {
              title: '3. アカウント作成と管理',
              content: 'ユーザーは以下の責任を負います：\n\n• アカウント情報の正確性の維持\n• ログイン認証情報の機密保持\n• アカウントで行われるすべての活動に対する責任\n• 不正使用の疑いがある場合の即座の通知'
            },
            {
              title: '4. サービスの利用',
              content: 'ユーザーは本サービスを以下の目的でのみ利用できます：\n\n• 合法的な法律業務の支援\n• 契約書の分析と生成\n• コンプライアンスの確認\n• その他当社が許可する用途'
            },
            {
              title: '5. 禁止事項',
              content: '以下の行為は禁止されています：\n\n• 違法または不正な目的での利用\n• 第三者の知的財産権の侵害\n• システムやセキュリティの妨害\n• 虚偽または誤解を招く情報の提供\n• マルウェアやウイルスの送信'
            },
            {
              title: '6. 知的財産権',
              content: '本サービスに関するすべての知的財産権は当社に帰属します。ユーザーが作成したコンテンツについては、ユーザーが所有権を保持します。'
            },
            {
              title: '7. 料金と支払い',
              content: '有料プランの料金は事前に明示され、選択したプランに応じて請求されます。支払いはStripeを通じて安全に処理されます。'
            },
            {
              title: '8. サービスの変更と終了',
              content: '当社は事前通知により、サービスの内容を変更または終了する権利を留保します。重要な変更については、30日前に通知いたします。'
            },
            {
              title: '9. 免責事項',
              content: '本サービスは「現状のまま」提供され、当社は明示的または黙示的な保証を行いません。法的アドバイスの提供を意図するものではありません。'
            },
            {
              title: '10. 責任の制限',
              content: '当社の責任は、法律で許可される範囲内で、ユーザーが支払った料金の範囲内に制限されます。'
            },
            {
              title: '11. 準拠法と管轄',
              content: '本規約は日本国法に準拠し、東京地方裁判所を第一審の専属管轄裁判所とします。'
            },
            {
              title: '12. 規約の変更',
              content: '当社は本規約を随時変更することができます。重要な変更については、メールまたはサービス内で通知いたします。'
            }
          ]
        };
      case 'zh':
        return {
          title: '服务条款',
          lastUpdated: '最后更新：2024年7月10日',
          sections: [
            {
              title: '1. 服务概述',
              content: 'Legal AI SaaS（以下简称"本服务"）是一个基于云的服务，利用AI技术提供法律文档分析、合同生成和合规支持。'
            },
            {
              title: '2. 使用资格',
              content: '本服务适用于满足以下条件的用户：\n\n• 18岁以上的个人或法人\n• 拥有有效的电子邮件地址\n• 同意本条款\n• 按照适用法律使用服务'
            },
            {
              title: '3. 账户创建和管理',
              content: '用户有以下责任：\n\n• 维护账户信息的准确性\n• 保持登录凭据的机密性\n• 对账户进行的所有活动负责\n• 如怀疑有未经授权的使用，立即通知我们'
            },
            {
              title: '4. 服务使用',
              content: '用户只能将本服务用于以下目的：\n\n• 合法的法律业务支持\n• 合同分析和生成\n• 合规检查\n• 我们授权的其他用途'
            },
            {
              title: '5. 禁止行为',
              content: '以下行为被禁止：\n\n• 用于非法或欺诈目的\n• 侵犯第三方知识产权\n• 干扰系统或安全\n• 提供虚假或误导性信息\n• 传输恶意软件或病毒'
            },
            {
              title: '6. 知识产权',
              content: '与本服务相关的所有知识产权归我们所有。用户创建的内容仍属于用户所有。'
            },
            {
              title: '7. 费用和付款',
              content: '付费计划的费用预先明确列出，并根据所选计划收费。付款通过Stripe安全处理。'
            },
            {
              title: '8. 服务变更和终止',
              content: '我们保留在提前通知的情况下修改或终止服务内容的权利。重大变更将提前30天通知。'
            },
            {
              title: '9. 免责声明',
              content: '本服务按"现状"提供，我们不提供明示或暗示的保证。它不旨在提供法律建议。'
            },
            {
              title: '10. 责任限制',
              content: '在法律允许的范围内，我们的责任仅限于用户支付的费用金额。'
            },
            {
              title: '11. 适用法律和管辖权',
              content: '本条款受中华人民共和国法律管辖，由北京市朝阳区人民法院享有专属管辖权。'
            },
            {
              title: '12. 条款变更',
              content: '我们可能会不时修改这些条款。重大变更将通过电子邮件或服务内通知告知您。'
            }
          ]
        };
      case 'en':
        return {
          title: 'Terms of Service',
          lastUpdated: 'Last updated: July 10, 2024',
          sections: [
            {
              title: '1. Service Overview',
              content: 'Legal AI SaaS ("the Service") is a cloud-based service that provides legal document analysis, contract generation, and compliance support using AI technology.'
            },
            {
              title: '2. Eligibility',
              content: 'The Service is available to users who meet the following criteria:\n\n• Individuals or entities 18 years or older\n• Have a valid email address\n• Agree to these terms\n• Use the service in accordance with applicable laws'
            },
            {
              title: '3. Account Creation and Management',
              content: 'Users are responsible for:\n\n• Maintaining the accuracy of account information\n• Keeping login credentials confidential\n• All activities that occur under their account\n• Immediately notifying us of suspected unauthorized use'
            },
            {
              title: '4. Service Usage',
              content: 'Users may only use the Service for:\n\n• Legitimate legal business support\n• Contract analysis and generation\n• Compliance checking\n• Other purposes we authorize'
            },
            {
              title: '5. Prohibited Activities',
              content: 'The following activities are prohibited:\n\n• Use for illegal or fraudulent purposes\n• Infringing third-party intellectual property rights\n• Interfering with systems or security\n• Providing false or misleading information\n• Transmitting malware or viruses'
            },
            {
              title: '6. Intellectual Property',
              content: 'All intellectual property rights related to the Service belong to us. Content created by users remains owned by the users.'
            },
            {
              title: '7. Fees and Payment',
              content: 'Fees for paid plans are clearly stated in advance and charged according to the selected plan. Payments are processed securely through Stripe.'
            },
            {
              title: '8. Service Changes and Termination',
              content: 'We reserve the right to modify or terminate the Service content with advance notice. Significant changes will be notified 30 days in advance.'
            },
            {
              title: '9. Disclaimers',
              content: 'The Service is provided "as is" and we make no express or implied warranties. It is not intended to provide legal advice.'
            },
            {
              title: '10. Limitation of Liability',
              content: 'To the extent permitted by law, our liability is limited to the amount of fees paid by the user.'
            },
            {
              title: '11. Governing Law and Jurisdiction',
              content: 'These terms are governed by the laws of the United States, with disputes resolved in the courts of Delaware.'
            },
            {
              title: '12. Terms Changes',
              content: 'We may modify these terms from time to time. Significant changes will be communicated via email or in-service notification.'
            }
          ]
        };
      default:
        return {
          title: '서비스 이용약관',
          lastUpdated: '최종 업데이트: 2024년 7월 10일',
          sections: [
            {
              title: '1. 서비스 개요',
              content: 'Legal AI SaaS(이하 "서비스")는 AI 기술을 활용하여 법률 문서 분석, 계약서 생성, 컴플라이언스 지원을 제공하는 클라우드 기반 서비스입니다.'
            },
            {
              title: '2. 이용 자격',
              content: '다음 조건을 충족하는 사용자가 서비스를 이용할 수 있습니다:\n\n• 만 18세 이상의 개인 또는 법인\n• 유효한 이메일 주소 보유\n• 본 약관에 동의\n• 관련 법률에 따른 서비스 이용'
            },
            {
              title: '3. 계정 생성 및 관리',
              content: '사용자는 다음에 대한 책임을 집니다:\n\n• 계정 정보의 정확성 유지\n• 로그인 정보의 기밀 유지\n• 계정에서 발생하는 모든 활동\n• 무단 사용 의심 시 즉시 신고'
            },
            {
              title: '4. 서비스 이용',
              content: '사용자는 다음 목적으로만 서비스를 이용할 수 있습니다:\n\n• 합법적인 법률 업무 지원\n• 계약서 분석 및 생성\n• 컴플라이언스 확인\n• 당사가 승인한 기타 용도'
            },
            {
              title: '5. 금지 행위',
              content: '다음 행위는 금지됩니다:\n\n• 불법적이거나 사기적인 목적의 사용\n• 제3자 지적재산권 침해\n• 시스템이나 보안 방해\n• 허위 또는 오해의 소지가 있는 정보 제공\n• 악성 소프트웨어나 바이러스 전송'
            },
            {
              title: '6. 지적재산권',
              content: '서비스와 관련된 모든 지적재산권은 당사에 귀속됩니다. 사용자가 생성한 콘텐츠는 사용자가 소유권을 유지합니다.'
            },
            {
              title: '7. 요금 및 결제',
              content: '유료 플랜의 요금은 사전에 명시되며, 선택한 플랜에 따라 청구됩니다. 결제는 Stripe를 통해 안전하게 처리됩니다.'
            },
            {
              title: '8. 서비스 변경 및 종료',
              content: '당사는 사전 통지를 통해 서비스 내용을 수정하거나 종료할 권리를 보유합니다. 중요한 변경사항은 30일 전에 통지합니다.'
            },
            {
              title: '9. 면책사항',
              content: '서비스는 "있는 그대로" 제공되며, 당사는 명시적이거나 묵시적인 보증을 하지 않습니다. 법률 자문 제공을 목적으로 하지 않습니다.'
            },
            {
              title: '10. 책임 제한',
              content: '법률이 허용하는 범위 내에서, 당사의 책임은 사용자가 지불한 요금 금액으로 제한됩니다.'
            },
            {
              title: '11. 준거법 및 관할',
              content: '본 약관은 대한민국 법률에 따라 규율되며, 서울중앙지방법원을 관할 법원으로 합니다.'
            },
            {
              title: '12. 약관 변경',
              content: '당사는 수시로 본 약관을 수정할 수 있습니다. 중요한 변경사항은 이메일 또는 서비스 내 알림을 통해 공지합니다.'
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
                <p className="text-blue-800 mb-2">
                  {i18n.language === 'ja' ? '利用規約に関するご質問がございましたら、お気軽にお問い合わせください。' :
                   i18n.language === 'zh' ? '如果您对服务条款有任何疑问，请随时联系我们。' :
                   i18n.language === 'en' ? 'If you have any questions about these terms, please feel free to contact us.' :
                   '서비스 이용약관에 관한 문의사항이 있으시면 언제든지 연락주세요.'}
                </p>
                <a href="mailto:legal@legalaisaas.com" className="text-blue-600 hover:text-blue-700 font-medium">
                  legal@legalaisaas.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;