import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Tag,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Check,
  X,
  Plus,
  Eye,
  Save,
  FolderInput,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { LabelDesignData, StickerProjectFolder, SavedStickerTemplate } from '../LabelDesignerView';

interface Props {
  folders: StickerProjectFolder[];
  setFolders: React.Dispatch<React.SetStateAction<StickerProjectFolder[]>>;
  savedTemplates: SavedStickerTemplate[];
  setSavedTemplates: React.Dispatch<React.SetStateAction<SavedStickerTemplate[]>>;
  activeFolderId: string;
  setActiveFolderId: (id: string) => void;
  currentLabelData: LabelDesignData;
  onLoadTemplate: (template: SavedStickerTemplate) => void;
  activeTemplateId?: string | null;
  onClose?: () => void;
  lang?: 'uz' | 'ru';
}

export default function StickerFileExplorer({
  folders,
  setFolders,
  savedTemplates,
  setSavedTemplates,
  activeFolderId,
  setActiveFolderId,
  currentLabelData,
  onLoadTemplate,
  activeTemplateId,
  onClose,
  lang = 'uz'
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    folders.forEach(f => { map[f.id] = true; });
    return map;
  });

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderRenameText, setFolderRenameText] = useState('');

  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [fileRenameText, setFileRenameText] = useState('');

  const [movingFile, setMovingFile] = useState<SavedStickerTemplate | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  const [showSaveCurrentModal, setShowSaveCurrentModal] = useState(false);
  const [saveFileNameInput, setSaveFileNameInput] = useState('');
  const [saveToFolderId, setSaveToFolderId] = useState(activeFolderId);

  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const toggleAllFolders = (expand: boolean) => {
    const map: Record<string, boolean> = {};
    folders.forEach(f => { map[f.id] = expand; });
    setExpandedFolderIds(map);
  };

  const startRenamingFolder = (folder: StickerProjectFolder) => {
    setRenamingFolderId(folder.id);
    setFolderRenameText(folder.name);
  };

  const saveFolderRename = (folderId: string) => {
    if (!folderRenameText.trim()) {
      setRenamingFolderId(null);
      return;
    }
    const cleanName = folderRenameText.trim();
    setFolders(prev => {
      const next = prev.map(f => {
        if (f.id === folderId) {
          return {
            ...f,
            name: cleanName,
            path: `ERP Xotirasi / ${cleanName}`
          };
        }
        return f;
      });
      try {
        localStorage.setItem('tex_erp_hangtag_folders', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    setRenamingFolderId(null);
    showToast(lang === 'uz' ? `Papka nomi "${cleanName}"ga o'zgartirildi` : `Папка переименована в "${cleanName}"`);
  };

  const startRenamingFile = (file: SavedStickerTemplate) => {
    setRenamingFileId(file.id);
    setFileRenameText(file.name);
    setActiveMenuFileId(null);
  };

  const saveFileRename = (fileId: string) => {
    if (!fileRenameText.trim()) {
      setRenamingFileId(null);
      return;
    }
    let cleanName = fileRenameText.trim();
    if (!cleanName.endsWith('.lbl')) {
      cleanName = `${cleanName}.lbl`;
    }

    setSavedTemplates(prev => {
      const next = prev.map(t => {
        if (t.id === fileId) {
          return {
            ...t,
            name: cleanName,
            savedAt: `${new Date().toLocaleDateString()} (tahrirlandi)`
          };
        }
        return t;
      });
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    setRenamingFileId(null);
    showToast(lang === 'uz' ? `Fayl nomi "${cleanName}"ga o'zgartirildi` : `Файл переименован в "${cleanName}"`);
  };

  const handleMoveFileConfirm = () => {
    if (!movingFile || !targetFolderId) return;
    setSavedTemplates(prev => {
      const next = prev.map(t => {
        if (t.id === movingFile.id) {
          return {
            ...t,
            folderId: targetFolderId,
            savedAt: `${new Date().toLocaleDateString()} (ko'chirildi)`
          };
        }
        return t;
      });
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    const targetFolder = folders.find(f => f.id === targetFolderId);
    showToast(
      lang === 'uz'
        ? `"${movingFile.name}" stikeri "${targetFolder?.name || ''}" papkasiga ko'chirildi`
        : `Этикетка "${movingFile.name}" перемещена в папку "${targetFolder?.name || ''}"`
    );
    setMovingFile(null);
  };

  const handleDuplicateFile = (file: SavedStickerTemplate) => {
    const rawName = file.name.replace(/\.lbl$/, '');
    const copyName = `${rawName}_Nusxa.lbl`;

    const newTemplate: SavedStickerTemplate = {
      id: `tmpl-${Date.now()}`,
      folderId: file.folderId,
      name: copyName,
      data: { ...file.data },
      savedAt: new Date().toLocaleDateString(),
      fileSizeKb: file.fileSizeKb || 2.1
    };

    setSavedTemplates(prev => {
      const next = [newTemplate, ...prev];
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    setActiveMenuFileId(null);
    showToast(lang === 'uz' ? `Nusxa saqlandi: ${copyName}` : `Создана копия: ${copyName}`);
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setSavedTemplates(prev => {
      const next = prev.filter(t => t.id !== fileId);
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    setActiveMenuFileId(null);
    showToast(lang === 'uz' ? `"${fileName}" stikeri o'chirildi` : `Этикетка "${fileName}" удалена`);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (folders.length <= 1) {
      showToast(lang === 'uz' ? 'Oxirgi papkani o\'chirib bo\'lmaydi' : 'Нельзя удалить последнюю папку');
      return;
    }
    const remainingFolders = folders.filter(f => f.id !== folderId);
    const fallbackFolderId = remainingFolders[0].id;

    setSavedTemplates(prev => {
      const next = prev.map(t => (t.folderId === folderId ? { ...t, folderId: fallbackFolderId } : t));
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    setFolders(remainingFolders);
    if (activeFolderId === folderId) {
      setActiveFolderId(fallbackFolderId);
    }
    try {
      localStorage.setItem('tex_erp_hangtag_folders', JSON.stringify(remainingFolders));
    } catch (e) {
      console.warn(e);
    }
    showToast(lang === 'uz' ? `"${folderName}" papkasi o'chirildi` : `Папка "${folderName}" удалена`);
  };

  const handleCreateFolder = () => {
    if (!newFolderNameInput.trim()) return;
    const cleanName = newFolderNameInput.trim();
    const newFolder: StickerProjectFolder = {
      id: `f-${Date.now()}`,
      name: cleanName,
      path: `ERP Xotirasi / ${cleanName}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    const next = [...folders, newFolder];
    setFolders(next);
    setActiveFolderId(newFolder.id);
    setExpandedFolderIds(prev => ({ ...prev, [newFolder.id]: true }));
    setNewFolderNameInput('');
    setShowNewFolderModal(false);
    try {
      localStorage.setItem('tex_erp_hangtag_folders', JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
    showToast(lang === 'uz' ? `Yangi papka qo'shildi: ${cleanName}` : `Создана папка: ${cleanName}`);
  };

  const handleSaveCurrentAsFile = () => {
    const defaultName = `${currentLabelData.productName.slice(0, 18).trim().replace(/\s+/g, '_')}_${currentLabelData.sizeTitle.replace(/\s+/g, '')}.lbl`;
    const cleanName = (saveFileNameInput.trim() || defaultName).replace(/\.lbl$/, '') + '.lbl';
    const folder = folders.find(f => f.id === saveToFolderId) || folders[0];

    const newTemplate: SavedStickerTemplate = {
      id: `tmpl-${Date.now()}`,
      folderId: folder.id,
      name: cleanName,
      data: { ...currentLabelData },
      savedAt: new Date().toLocaleDateString(),
      fileSizeKb: parseFloat((JSON.stringify(currentLabelData).length / 1024).toFixed(1))
    };

    setSavedTemplates(prev => {
      const next = [newTemplate, ...prev];
      try {
        localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    setExpandedFolderIds(prev => ({ ...prev, [folder.id]: true }));
    setShowSaveCurrentModal(false);
    setSaveFileNameInput('');
    showToast(lang === 'uz' ? `Stiker saqlandi: ${folder.name} / ${cleanName}` : `Этикетка сохранена: ${folder.name} / ${cleanName}`);
  };

  const handleExportFileJson = (file: SavedStickerTemplate) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(file, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', file.name.endsWith('.lbl') ? file.name : `${file.name}.lbl`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setActiveMenuFileId(null);
    showToast(lang === 'uz' ? `Fayl yuklab olindi: ${file.name}` : `Файл скачан: ${file.name}`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data || parsed.barcode) {
          const importedData = parsed.data || parsed;
          const cleanName = file.name.endsWith('.lbl') ? file.name : `${file.name.replace(/\.[^/.]+$/, '')}.lbl`;
          const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0];

          const newTemplate: SavedStickerTemplate = {
            id: `tmpl-${Date.now()}`,
            folderId: activeFolder.id,
            name: cleanName,
            data: importedData,
            savedAt: `${new Date().toLocaleDateString()} (import)`,
            fileSizeKb: parseFloat((file.size / 1024).toFixed(1))
          };

          setSavedTemplates(prev => {
            const next = [newTemplate, ...prev];
            try {
              localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(next));
            } catch (err) {
              console.warn(err);
            }
            return next;
          });

          showToast(lang === 'uz' ? `Stiker muvaffaqiyatli import qilindi: ${cleanName}` : `Этикетка успешно импортирована: ${cleanName}`);
        }
      } catch (err) {
        showToast(lang === 'uz' ? 'Fayl formati noto\'g\'ri (.lbl yoki .json kerak)' : 'Неверный формат файла');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return savedTemplates;
    const q = searchQuery.toLowerCase().trim();
    return savedTemplates.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.data.sizeTitle.toLowerCase().includes(q) ||
      t.data.productName.toLowerCase().includes(q) ||
      t.data.barcode.includes(q) ||
      t.data.artikul.toLowerCase().includes(q)
    );
  }, [savedTemplates, searchQuery]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-full overflow-hidden text-xs select-none">
      
      {/* 1. EXPLORER HEADER */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs truncate flex items-center gap-1.5">
              <span>Stikerlar Papkalari</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                ERP Xotirasi
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {folders.length} ta papka • {savedTemplates.length} ta stiker
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSaveFileNameInput(`${currentLabelData.productName.slice(0, 15)}_${currentLabelData.sizeTitle.replace(/\s+/g, '')}.lbl`);
              setSaveToFolderId(activeFolderId);
              setShowSaveCurrentModal(true);
            }}
            className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
            title="Joriy stikerni saqlash"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
            title="Yangi papka qo'shish"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          <label 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
            title="Stiker faylini import qilish"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".lbl,.json" onChange={handleImportFile} className="hidden" />
          </label>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Yopish"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/90 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Stikerlarni qidirish (model, rang, o'lcham)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleAllFolders(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Barchasini ochish
            </button>
            <span>•</span>
            <button
              onClick={() => toggleAllFolders(false)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
          <span className="font-mono text-cyan-400 font-semibold">Tizim xotirasi</span>
        </div>
      </div>

      {/* Toast Notice */}
      {noticeMessage && (
        <div className="px-3 py-1.5 bg-cyan-950 border-b border-cyan-800/80 text-cyan-300 text-[10px] flex items-center gap-1.5 font-medium animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">{noticeMessage}</span>
        </div>
      )}

      {/* 3. FOLDERS AND STICKERS LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {folders.map(folder => {
          const isExpanded = !!expandedFolderIds[folder.id];
          const folderFiles = filteredTemplates.filter(t => t.folderId === folder.id);
          const isActiveFolder = folder.id === activeFolderId;
          const isRenamingThisFolder = renamingFolderId === folder.id;

          return (
            <div key={folder.id} className="space-y-0.5">
              
              {/* FOLDER ROW */}
              <div
                onClick={() => setActiveFolderId(folder.id)}
                className={`group px-2 py-1.5 rounded-lg flex items-center justify-between gap-1.5 cursor-pointer transition-colors ${
                  isActiveFolder
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(folder.id);
                    }}
                    className="p-0.5 text-slate-400 hover:text-white rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  )}

                  {isRenamingThisFolder ? (
                    <div 
                      className="flex items-center gap-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={folderRenameText}
                        onChange={(e) => setFolderRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveFolderRename(folder.id);
                          if (e.key === 'Escape') setRenamingFolderId(null);
                        }}
                        autoFocus
                        className="w-full px-1.5 py-0.5 bg-slate-950 border border-cyan-500 rounded text-white text-xs font-semibold focus:outline-none"
                      />
                      <button
                        onClick={() => saveFolderRename(folder.id)}
                        className="p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setRenamingFolderId(null)}
                        className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span 
                      onDoubleClick={() => startRenamingFolder(folder)}
                      className="font-bold truncate text-xs text-slate-200 group-hover:text-white"
                      title="Nomini o'zgartirish uchun 2 marta bosing"
                    >
                      {folder.name}
                    </span>
                  )}
                </div>

                {!isRenamingThisFolder && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-950 text-slate-400 rounded border border-slate-800">
                      {folderFiles.length}
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenamingFolder(folder);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                        title="Papka nomini o'zgartirish"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSaveFileNameInput(`${currentLabelData.productName.slice(0, 15)}_${currentLabelData.sizeTitle.replace(/\s+/g, '')}.lbl`);
                          setSaveToFolderId(folder.id);
                          setShowSaveCurrentModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        title="Shu papkaga saqlash"
                      >
                        <Save className="w-3 h-3" />
                      </button>

                      {folders.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id, folder.name);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Papkani o'chirish"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FILES INSIDE FOLDER */}
              {isExpanded && (
                <div className="pl-6 pr-1 space-y-1 border-l-2 border-slate-800/80 ml-3 py-0.5">
                  {folderFiles.length === 0 ? (
                    <div className="py-2 px-2 text-[10.5px] text-slate-500 italic">
                      Papkada stikerlar yo'q (Hozirgi stikerni saqlash uchun «+» bosing)
                    </div>
                  ) : (
                    folderFiles.map(file => {
                      const isSelected = activeTemplateId === file.id;
                      const isRenamingThisFile = renamingFileId === file.id;
                      const isMenuOpen = activeMenuFileId === file.id;

                      return (
                        <div
                          key={file.id}
                          className={`group/file relative rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/50 shadow-xs'
                              : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div
                            onClick={() => onLoadTemplate(file)}
                            onDoubleClick={() => startRenamingFile(file)}
                            className="p-2 flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[9px] font-black shrink-0 ${
                                isSelected 
                                  ? 'bg-cyan-500 text-slate-950 shadow-xs' 
                                  : 'bg-slate-800 text-cyan-300'
                              }`}>
                                <Tag className="w-3 h-3" />
                              </div>

                              <div className="min-w-0 flex-1">
                                {isRenamingThisFile ? (
                                  <div 
                                    className="flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={fileRenameText}
                                      onChange={(e) => setFileRenameText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveFileRename(file.id);
                                        if (e.key === 'Escape') setRenamingFileId(null);
                                      }}
                                      autoFocus
                                      className="w-full px-1.5 py-0.5 bg-slate-900 border border-cyan-500 rounded text-white text-[11px] font-semibold focus:outline-none"
                                    />
                                    <button
                                      onClick={() => saveFileRename(file.id)}
                                      className="p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer"
                                    >
                                      <Check className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => setRenamingFileId(null)}
                                      className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-semibold text-slate-200 group-hover/file:text-white truncate text-[11px] flex items-center gap-1">
                                      <span className="truncate">{file.name}</span>
                                      {isSelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.5">
                                      <span className="font-mono text-cyan-300 font-bold">{file.data.sizeTitle}</span>
                                      <span>•</span>
                                      <span className="font-mono">{file.data.barcode.slice(-6)}</span>
                                      <span>•</span>
                                      <span>{file.data.color}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {!isRenamingThisFile && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLoadTemplate(file);
                                  }}
                                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                                  title="Konstruktorga yuklash"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRenamingFile(file);
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                                  title="Nomini o'zgartirish"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id, file.name);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* 4. FOOTER: SYSTEM MEMORY STATUS */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-300 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>ERP Ichki Xotirasi (Doimiy)</span>
          </div>
          <div className="text-[9.5px] text-slate-500 truncate">
            Faol papka: {folders.find(f => f.id === activeFolderId)?.name}
          </div>
        </div>

        <button
          onClick={() => {
            setSaveFileNameInput(`${currentLabelData.productName.slice(0, 15)}_${currentLabelData.sizeTitle.replace(/\s+/g, '')}.lbl`);
            setSaveToFolderId(activeFolderId);
            setShowSaveCurrentModal(true);
          }}
          className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Save className="w-3 h-3" />
          <span>Saqlash</span>
        </button>
      </div>

      {/* MODAL: YANGI PAPKA QO'SHISH */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>Yangi Papka Qo'shish</span>
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Papka nomi (masalan: Bolalar kolleksiyasi, Sport kiyimlari):</label>
                <input
                  type="text"
                  placeholder="Sport_Kiyimlari"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  autoFocus
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STIKERNI SAQLASH */}
      {showSaveCurrentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Stikerni Xotiraga Saqlash</span>
              </h3>
              <button
                onClick={() => setShowSaveCurrentModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Qaysi papkaga joylashtirilsin:</label>
                <select
                  value={saveToFolderId}
                  onChange={(e) => setSaveToFolderId(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Stiker fayl nomi:</label>
                <input
                  type="text"
                  placeholder="Futbolka_Oq_S.lbl"
                  value={saveFileNameInput}
                  onChange={(e) => setSaveFileNameInput(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold font-mono"
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block">{currentLabelData.productName}</span>
                <span>{currentLabelData.sizeTitle} • EAN-13: {currentLabelData.barcode}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveCurrentModal(false)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsFile}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOSHQA PAPKAGA KO'CHIRISH */}
      {movingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-blue-400" />
                <span>Papkaga Ko'chirish</span>
              </h3>
              <button
                onClick={() => setMovingFile(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tanlangan stiker:</div>
                <div className="font-bold text-white mt-0.5 text-xs font-mono">{movingFile.name}</div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mo'ljaldagi papka:</label>
                <select
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id} disabled={f.id === movingFile.folderId}>
                      {f.name} {f.id === movingFile.folderId ? '(Hozirgi joyi)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMovingFile(null)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleMoveFileConfirm}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Ko'chirish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
