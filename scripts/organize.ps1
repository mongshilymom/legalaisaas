# Legal_AI_SaaS 폴더 자동 정리 스크립트
Write-Host "🚀 Legal_AI_SaaS 프로젝트 자동 정리 시작..." -ForegroundColor Green

# 1. 폴더 구조 생성
$folders = @("components", "hooks", "services", "types", "pages", "translations", "utils", "test")
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Name $folder
        Write-Host "✅ $folder 폴더 생성" -ForegroundColor Yellow
    }
}

# 2. 파일 자동 분류 이동
# Components (UI 컴포넌트)
Get-ChildItem "*Chat*.tsx" | Move-Item -Destination "components\"
Get-ChildItem "*Alert*.tsx" | Move-Item -Destination "components\"
Get-ChildItem "*Score*.tsx" | Move-Item -Destination "components\"
Get-ChildItem "*Selector*.tsx" | Move-Item -Destination "components\"
Get-ChildItem "*Switcher*.tsx" | Move-Item -Destination "components\"
Get-ChildItem "*ScrollBox*.tsx" | Move-Item -Destination "components\"

# Hooks (React 훅)
Get-ChildItem "use*.ts" | Move-Item -Destination "hooks\"

# Services (비즈니스 로직)
Get-ChildItem "*engine*.ts" | Move-Item -Destination "services\"
Get-ChildItem "callAI.ts" | Move-Item -Destination "services\"
Get-ChildItem "gpt.ts" | Move-Item -Destination "services\"
Get-ChildItem "validate*.ts" | Move-Item -Destination "services\"
Get-ChildItem "sanitize*.ts" | Move-Item -Destination "services\"
Get-ChildItem "getCompliance*.ts" | Move-Item -Destination "services\"
Get-ChildItem "create-checkout*.ts" | Move-Item -Destination "services\"

# Types (타입 정의)
Get-ChildItem "*.json" | Move-Item -Destination "types\"
Get-ChildItem "contractTypes*" | Move-Item -Destination "types\"

# Pages (라우트 페이지)
Get-ChildItem "success.tsx" | Move-Item -Destination "pages\"
Get-ChildItem "cancel.tsx" | Move-Item -Destination "pages\"

# Translations (다국어)
Get-ChildItem "translation*.json" | Move-Item -Destination "translations\"

# Utils (유틸리티)
Get-ChildItem "savePurchase.ts" | Move-Item -Destination "utils\"
Get-ChildItem "env.example" | Move-Item -Destination "utils\"

# Test (테스트)
Get-ChildItem "example-usage.ts" | Move-Item -Destination "test\"

Write-Host "🎉 정리 완료! 모든 파일이 새로운 구조로 이동되었습니다." -ForegroundColor Green