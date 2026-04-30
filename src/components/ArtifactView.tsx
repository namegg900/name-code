import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ChevronRight, Copy, Check, Download, PackageOpen, 
  FolderOpen, Save, FileCode
} from 'lucide-react';
import { Artifact, Theme, FileEntry } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ArtifactViewProps {
  artifact: Artifact;
  onClose: () => void;
  theme: Theme;
}

export default function ArtifactView({ artifact, onClose, theme }: ArtifactViewProps) {
  const [localFiles, setLocalFiles] = useState<FileEntry[]>(artifact.files || [{ 
    name: artifact.title || 'main.txt', 
    language: artifact.language || 'text', 
    content: artifact.code 
  }]);

  useEffect(() => {
    const files = artifact.files?.length ? artifact.files : [{ 
      name: artifact.title || 'main.txt', 
      language: artifact.language || 'text', 
      content: artifact.code 
    }];
    setLocalFiles(files);
    setSelectedFileIndex(0);
    setEditedCode(files[0]?.content || '');
    setEditMode(false);
  }, [artifact.id, artifact.files]);

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>(artifact.type === 'web' ? 'preview' : 'code');
  const [isCopied, setIsCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCode, setEditedCode] = useState(localFiles[0]?.content || '');

  const isDark = theme === 'dark';
  const currentFile = localFiles[selectedFileIndex];

  useEffect(() => {
    setEditedCode(currentFile?.content || '');
  }, [selectedFileIndex, localFiles]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    const updated = [...localFiles];
    updated[selectedFileIndex] = { ...currentFile, content: editedCode };
    setLocalFiles(updated);
    setEditMode(false);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([editedCode], { type: 'text/plain' });
    const ext = currentFile.language ? `.${currentFile.language}` : '.txt';
    saveAs(blob, `${currentFile.name.replace(/\s+/g, '_').toLowerCase()}${ext}`);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      localFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.zip`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  const isWeb = artifact.type === 'web' || localFiles.some(f => ['html', 'css', 'javascript', 'typescript', 'jsx', 'tsx'].includes(f.language || ''));

  return (
    <div className={`h-full flex flex-col border-l relative transition-all duration-500 overflow-hidden ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-[#fff] border-[#E5E5E1]'}`}>
      {/* VSCode Header */}
      <div className={`h-9 border-b flex items-center justify-between px-2 grow-0 shrink-0 ${isDark ? 'border-[#2a2a2a] bg-[#252526]' : 'border-[#E5E5E1] bg-[#f3f3f3]'}`}>
        <div className="flex items-center gap-1 overflow-hidden h-full">
          <button onClick={onClose} className={`p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <ChevronRight size={14} className="rotate-180" />
          </button>
          
          <div className="flex items-center h-full ml-1">
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-3 h-full text-[11px] font-medium transition-all flex items-center gap-2 border-t-2 ${
                activeTab === 'code' 
                  ? (isDark ? 'bg-[#1e1e1e] text-[#D97757] border-[#D97757]' : 'bg-white text-[#D97757] border-[#D97757]') 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileCode size={13} />
              Editor
            </button>
            {isWeb && (
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 h-full text-[11px] font-medium transition-all flex items-center gap-2 border-t-2 ${
                  activeTab === 'preview' 
                    ? (isDark ? 'bg-[#1e1e1e] text-[#D97757] border-[#D97757]' : 'bg-white text-[#D97757] border-[#D97757]') 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ChevronRight size={13} />
                Preview
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1">
          {editMode ? (
            <button onClick={handleSave} className="flex items-center gap-1 px-2 py-0.5 bg-[#D97757] text-white rounded text-[10px] font-bold uppercase transition-transform active:scale-95">
              <Save size={10} /> Save
            </button>
          ) : (
            <button onClick={() => setEditMode(true)} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}>
               Edit
            </button>
          )}
          <button onClick={handleCopy} className={`p-1.5 rounded transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-black/10'}`}>
            {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* VSCode Sidebar */}
        <div className={`w-11 border-r flex flex-col items-center py-3 gap-5 shrink-0 grow-0 ${isDark ? 'border-[#2a2a2a] bg-[#333333]' : 'border-[#E5E5E1] bg-[#f8f8f8]'}`}>
          <div className="text-[#D97757]"><FolderOpen size={22} className="cursor-pointer" /></div>
          <div className="text-gray-500 opacity-30"><PackageOpen size={22} /></div>
        </div>

        {/* File Explorer */}
        <div className={`w-40 border-r overflow-y-auto shrink-0 flex flex-col ${isDark ? 'border-[#2a2a2a] bg-[#252526]' : 'border-[#E5E5E1] bg-[#fdfdfc]'}`}>
          <div className="p-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 flex justify-between items-center opacity-70">
            <span>Explorer</span>
            <span className="bg-[#D97757]/10 text-[#D97757] px-1 rounded-sm">{localFiles.length}</span>
          </div>
          <div className="p-1 space-y-0.5">
            {localFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedFileIndex(idx);
                  setEditedCode(file.content);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-all text-left group ${
                  selectedFileIndex === idx 
                    ? (isDark ? 'bg-[#37373d] text-white' : 'bg-[#e4e6f1] text-[#D97757] font-semibold')
                    : (isDark ? 'text-[#cccccc] hover:bg-[#2a2d2e]' : 'text-gray-500 hover:bg-black/5')
                }`}
              >
                <FileCode size={12} className={selectedFileIndex === idx ? 'text-[#D97757]' : 'text-gray-500 opacity-60 group-hover:opacity-100'} />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Editor Header / Breadcrumbs */}
          <div className={`h-8 flex items-center px-3 text-[10px] gap-2 border-b grow-0 shrink-0 ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a] text-gray-400' : 'bg-white border-[#f3f3f3] text-gray-500'}`}>
            <span className="opacity-50">src</span>
            <span className="opacity-50">/</span>
            <span className="text-[#D97757] font-bold">{currentFile?.name}</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'code' ? (
              editMode ? (
                <textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  className="w-full h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-none outline-none border-none focus:ring-0 selection:bg-[#264f78]"
                  spellCheck={false}
                  autoFocus
                />
              ) : (
                <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-white/10 selection:bg-[#264f78]">
                  <SyntaxHighlighter
                    language={currentFile?.language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', height: '100%', fontSize: '13px', lineHeight: '1.5' }}
                    showLineNumbers
                  >
                    {currentFile?.content || ''}
                  </SyntaxHighlighter>
                </div>
              )
            ) : (
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #000; margin: 0; padding: 0; min-height: 100vh; overflow-x: hidden; }
                        ::-webkit-scrollbar { width: 8px; }
                        ::-webkit-scrollbar-track { background: transparent; }
                        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                      </style>
                    </head>
                    <body>
                      ${(() => {
                        // Gather styles and scripts from other files
                        const styles = localFiles
                          .filter(f => (f.language === 'css' || f.name.endsWith('.css')) && f !== currentFile)
                          .map(f => `<style>${f.content}</style>`)
                          .join('\n');
                        
                        const scripts = localFiles
                          .filter(f => (f.language === 'javascript' || f.name.endsWith('.js')) && f !== currentFile)
                          .map(f => `<script>${f.content}</script>`)
                          .join('\n');

                        let html = '';
                        if (currentFile?.language === 'html' || currentFile?.name.endsWith('.html')) {
                          html = editedCode;
                        } else {
                          const indexFile = localFiles.find(f => f.name.toLowerCase() === 'index.html') || localFiles.find(f => f.language === 'html');
                          html = indexFile?.content || '<!-- No HTML file found -->';
                        }

                        // Inject local edits if current file is CSS or JS
                        let injectedStyles = styles;
                        let injectedScripts = scripts;

                        if (currentFile?.language === 'css' || currentFile?.name.endsWith('.css')) {
                          injectedStyles += `<style>${editedCode}</style>`;
                        }
                        if (currentFile?.language === 'javascript' || currentFile?.name.endsWith('.js')) {
                          injectedScripts += `<script>${editedCode}</script>`;
                        }

                        return `
                          ${injectedStyles}
                          ${html}
                          ${injectedScripts}
                        `;
                      })()}
                    </body>
                  </html>
                `}
                className="w-full h-full bg-white"
                title="artifact-preview"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* VSCode Status Bar */}
      <div className={`h-5 flex items-center justify-between px-3 text-[9px] font-medium shrink-0 grow-0 ${isDark ? 'bg-[#007acc] text-white' : 'bg-[#007acc] text-white'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 cursor-default">
             <ChevronRight size={10} className="rotate-90" />
             <span>Main</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={handleDownloadZip} disabled={isZipping} className="hover:bg-white/10 px-1 rounded flex items-center gap-1">
              <PackageOpen size={9} /> {isZipping ? 'Zipping...' : 'Project.zip'}
            </button>
            <button onClick={handleDownloadFile} className="hover:bg-white/10 px-1 rounded flex items-center gap-1">
              <Download size={9} /> Export
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln ${editedCode.split('\n').length}, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="bg-white/10 px-1 rounded tracking-widest">{currentFile?.name?.split('.').pop()?.toUpperCase() || 'TEXT'}</span>
        </div>
      </div>
    </div>
  );
}
