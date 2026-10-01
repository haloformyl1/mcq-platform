import os
import re

files = [
    'src/components/StudyMaterialRepository.tsx',
    'src/components/curriculum/CurriculumLevelPage.tsx',
    'src/components/curriculum/CurriculumCategoryPage.tsx',
    'src/app/dashboard/pdf-viewer/[id]/PdfViewerClient.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove import DownloadLimitModal
        content = content.replace('import DownloadLimitModal from "./DownloadLimitModal";\n', '')
        content = content.replace('import DownloadLimitModal from "@/components/DownloadLimitModal";\n', '')

        # Add import useDownloadTracker
        if 'import { useDownloadTracker }' not in content:
            if 'import { useRouter' in content:
                content = content.replace('import { useRouter', 'import { useDownloadTracker } from "@/hooks/useDownloadTracker";\nimport { useRouter')
            else:
                content = content.replace('import React', 'import { useDownloadTracker } from "@/hooks/useDownloadTracker";\nimport React')

        # Add hook usage inside component
        if 'const { handleDownload, isProcessing } = useDownloadTracker();' not in content:
            content = content.replace('  const [upgradeItem, setUpgradeItem]', '  const { handleDownload, isProcessing } = useDownloadTracker();\n  const [upgradeItem, setUpgradeItem]')
            content = content.replace('  const [zoom, setZoom]', '  const { handleDownload, isProcessing } = useDownloadTracker();\n  const [zoom, setZoom]')

        # Remove downloadTarget state
        content = content.replace('  const [downloadTarget, setDownloadTarget] = useState<{ id: string, url: string } | null>(null);\n', '')
        content = content.replace('  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);\n', '')

        # Fix button onClick
        content = content.replace('onClick={() => setDownloadTarget({ id: item.id.replace("db-", ""), url: item.url })}', 'onClick={(e) => { e.preventDefault(); handleDownload(item.id.replace("db-", ""), item.url); }}')
        content = content.replace('onClick={() => setIsDownloadModalOpen(true)}', 'onClick={(e) => { e.preventDefault(); handleDownload(material.id.replace("db-", ""), downloadUrl); }}')

        # Add opacity-50 if isProcessing SAFELY
        content = content.replace('className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors"', 'disabled={isProcessing}\n                            className={`p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}')
        
        content = content.replace('className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"', 'disabled={isProcessing}\n            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 shrink-0 ${isProcessing ? "opacity-50 cursor-not-allowed" : "active:scale-95 cursor-pointer"}`}')

        # Remove DownloadLimitModal JSX
        content = re.sub(r'<DownloadLimitModal\s+isOpen=\{.*?\n\s+onClose=\{.*?\n\s+studyMaterialId=\{.*?\n\s+downloadUrl=\{.*?\n\s+isPremiumUser=\{.*?\n\s+/>', '', content, flags=re.MULTILINE | re.DOTALL)
        content = re.sub(r'<DownloadLimitModal[\s\S]*?/>', '', content)
        content = re.sub(r'\{/\* Download Limit Modal \*/\}', '', content)

        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

os.remove('src/components/DownloadLimitModal.tsx')
