'use client';
import { useState } from 'react';

function generateMultilangEmailContent(email: string, plan: string, lang: string) {
  switch (lang) {
    case 'en':
      return \`
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello, <strong>\${email}</strong>!</h2>
          <p>✅ Your <strong>\${plan}</strong> plan has been successfully activated.</p>
          <p>💼 Enjoy enhanced legal support with Legal AI Pro.</p>
          <br/>
          <p style="color: #888;">Thank you.<br/>- Legal AI Pro Team</p>
        </div>
      \`;
    case 'ja':
      return \`
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>\${email} 様、こんにちは！</h2>
          <p>✅ <strong>\${plan}</strong> プランが正常に適用されました。</p>
          <p>💼 Legal AI Pro でさらに強力な法務サポートをご利用ください。</p>
          <br/>
          <p style="color: #888;">ありがとうございます。<br/>- Legal AI Pro チーム</p>
        </div>
      \`;
    default:
      return \`
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>안녕하세요, <strong>\${email}</strong> 님!</h2>
          <p>✅ <strong>\${plan}</strong> 요금제가 성공적으로 적용되었습니다.</p>
          <p>💼 Legal AI Pro 서비스를 통해 더 강력한 법률 지원을 경험하세요.</p>
          <br/>
          <p style="color: #888;">감사합니다.<br/>- Legal AI Pro Team</p>
        </div>
      \`;
  }
}

export default function MultiLangEmailTemplatePreview() {
  const [email, setEmail] = useState('user@example.com');
  const [plan, setPlan] = useState('premium');
  const [lang, setLang] = useState('ko');

  const htmlContent = generateMultilangEmailContent(email, plan, lang);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">🌐 이메일 템플릿 다국어 미리보기</h1>

      <div className="mb-6 space-y-4 flex flex-col max-w-md">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 입력"
          className="border border-gray-300 px-4 py-2 rounded"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded"
        >
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded"
        >
          <option value="ko">🇰🇷 한국어</option>
          <option value="en">🇺🇸 English</option>
          <option value="ja">🇯🇵 日本語</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded shadow border text-sm">
        <iframe
          title="email-preview"
          srcDoc={htmlContent}
          className="w-full h-72 border rounded"
        />
      </div>
    </div>
  );
}
