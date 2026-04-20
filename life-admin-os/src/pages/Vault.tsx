import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../context/DocumentContext';
import { documentService, DocType } from '../services/documentService';
import { toast } from 'react-hot-toast';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { UploadCloud, Download, Trash2, File as FileIcon, X, AlertTriangle } from 'lucide-react';

export const Vault = () => {
  const { user } = useAuth();
  const { documents, vaultUsedBytes, loading } = useDocuments();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>('Other');
  const [expiryDate, setExpiryDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const today = startOfDay(new Date());
  
  const MAX_BYTES = 500 * 1024 * 1024; // 500MB
  const quotaPercent = Math.min(100, Math.round((vaultUsedBytes / MAX_BYTES) * 100));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const parsedTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

      await documentService.uploadDocument(
        user.uid,
        selectedFile,
        docType,
        expiryDate ? new Date(expiryDate) : null,
        parsedTags,
        (progress) => setUploadProgress(progress)
      );
      
      toast.success('Asset secured in vault');
      setIsUploadPanelOpen(false);
      setSelectedFile(null);
      setDocType('Other');
      setExpiryDate('');
      setTagsInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const url = await documentService.getDownloadUrl(storagePath);
      // Fetch the file and trigger download via blob to force download behavior
      const response = await fetch(url.replace('http://', 'https://'), { mode: 'cors' }); // Simple hack sometimes needed if using native fetch
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      toast.error('Failed to download asset');
      console.error(err);
    }
  };

  const handleDelete = async (docId: string, storagePath: string, sizeBytes: number, name: string) => {
    if (!user) {
      toast.error('Please log in to delete documents');
      return;
    }
    try {
      await documentService.deleteDocument(user.uid, docId, storagePath, sizeBytes, name);
      toast.success('Asset purged');
    } catch (err) {
      toast.error('Failed to purge asset');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="mb-6 p-6 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <span className="text-[11px] uppercase tracking-widest text-[#1C1C1E] font-bold mb-2 block">Secure Storage</span>
           <h1 className="text-4xl font-bold tracking-tight uppercase">Document Vault</h1>
           <p className="text-sm font-bold text-gray-500 mt-2 max-w-xl">
             Your architectural ledger for identities, insurances, and critical assets. Encrypted and organized.
           </p>
        </div>
        
        {/* Quota display */}
        <div className="bg-[#F2F2F7] border-2 border-black p-4 rounded-2xl md:w-64 shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
              <span>Vault Quota</span>
              <span>{formatSize(vaultUsedBytes)} / 500 MB</span>
           </div>
           <div className="h-3 w-full bg-white border border-black rounded-full overflow-hidden">
              <div 
                className={`h-full border-r border-black ${quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 70 ? 'bg-amber-400' : 'bg-green-500'}`} 
                style={{ width: `${quotaPercent}%` }}
              ></div>
           </div>
        </div>
      </div>

      {!isUploadPanelOpen ? (
         <button 
           onClick={() => setIsUploadPanelOpen(true)}
           className="w-full mb-8 bg-[#1C1C1E] text-white py-4 border-2 border-black rounded-3xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] flex justify-center items-center gap-3 uppercase tracking-widest text-sm"
         >
           <UploadCloud className="w-5 h-5" /> Secure New Asset
         </button>
      ) : (
         <form onSubmit={handleUpload} className="mb-8 bg-[#FEF3C7] border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  Asset Deposit Protocol
               </h2>
               <button type="button" onClick={() => setIsUploadPanelOpen(false)} className="text-gray-500 hover:text-black">
                  <X className="w-6 h-6 border-2 border-transparent hover:border-black rounded-full hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all" />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="md:col-span-2 relative">
                  <input 
                    type="file" 
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                    required
                  />
                  <div className={`p-8 border-2 border-black border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors ${selectedFile ? 'bg-white' : 'bg-[#F2F2F7] hover:bg-white'}`}>
                     <UploadCloud className="w-10 h-10 mb-3 text-[#1C1C1E]" />
                     <p className="font-bold uppercase tracking-widest text-sm text-center">
                        {selectedFile ? selectedFile.name : 'Drag & Drop or Click to Select File'}
                     </p>
                     <p className="text-[10px] uppercase font-bold text-gray-500 mt-2 tracking-widest">
                        PDF, JPG, PNG, WEBP (MAX 10MB)
                     </p>
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Document Geometry</label>
                  <select 
                    value={docType} 
                    onChange={e => setDocType(e.target.value as DocType)} 
                    disabled={isUploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans uppercase tracking-widest"
                  >
                     <option value="ID">Identity Document (ID)</option>
                     <option value="Certificate">Certificate / License</option>
                     <option value="Insurance">Insurance Policy</option>
                     <option value="Financial">Financial Statement</option>
                     <option value="Other">Other Asset</option>
                  </select>
               </div>

               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Expiration Protocol (Optional)</label>
                  <input 
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    disabled={isUploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-mono font-bold"
                  />
               </div>

               <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Tags (Comma Separated)</label>
                  <input 
                     type="text" 
                     value={tagsInput}
                     onChange={e => setTagsInput(e.target.value)}
                     disabled={isUploading}
                     className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-medium font-sans"
                     placeholder="e.g., #insurance, #car, 2024"
                  />
               </div>
            </div>

            {isUploading && (
               <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                     <span>Transferring Payload...</span>
                     <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 w-full bg-white border-2 border-black rounded-full overflow-hidden">
                     <div className="h-full bg-[#1C1C1E] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
               </div>
            )}

            <div className="flex justify-end">
               <button disabled={isUploading || !selectedFile} type="submit" className="bg-[#1C1C1E] text-white px-8 py-3 border-2 border-black rounded-xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] uppercase tracking-widest disabled:opacity-50">
                  {isUploading ? 'Securing...' : 'Encrypt & Store'}
               </button>
            </div>

         </form>
      )}

      {/* Document Grid */}
      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
               <div key={i} className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 bg-gray-200 rounded-xl border-2 border-transparent shrink-0"></div>
                     <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                        <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                     </div>
                  </div>
                  <div className="flex-1 mt-2">
                     <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                     <div className="flex justify-between mt-3">
                        <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                        <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                     </div>
                  </div>
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 border-dashed flex justify-between">
                     <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                     <div className="w-1/4 h-5 bg-gray-200 rounded"></div>
                  </div>
               </div>
            ))}
         </div>
      ) : documents.length === 0 ? (
         <div className="py-16 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center text-[#1C1C1E]">
            <span className="text-5xl mb-4 opacity-50">🗄️</span>
            <h3 className="font-bold uppercase tracking-widest text-lg">Vault is Empty</h3>
            <p className="text-sm font-bold text-gray-500 mt-2 max-w-md text-center">Deposit critical documents above to securely store and track their expiration lifecycle.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map(doc => {
               const isExpiringSoon = doc.expiryDate && isBefore(new Date(doc.expiryDate.toMillis()), addDays(today, 30)) && !isBefore(new Date(doc.expiryDate.toMillis()), today);
               const isExpired = doc.expiryDate && isBefore(new Date(doc.expiryDate.toMillis()), today);

               return (
                 <div key={doc.id} className="bg-white border-2 border-black rounded-3xl p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col group">
                    
                    <div className="flex items-start justify-between mb-4">
                       <div className="w-12 h-12 bg-[#F2F2F7] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0">
                          {doc.mimeType.includes('pdf') ? (
                            <span className="font-bold text-sm text-red-600 uppercase tracking-tighter">PDF</span>
                          ) : (
                            <FileIcon className="w-5 h-5 text-blue-600" />
                          )}
                       </div>
                       
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDownload(doc.storagePath, doc.name)}
                            className="w-8 h-8 flex items-center justify-center bg-[#E0E7FF] border-2 border-black rounded-lg hover:bg-indigo-300 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            title="Download Asset"
                          >
                            <Download className="w-4 h-4 text-indigo-900" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id, doc.storagePath, doc.sizeBytes, doc.name)}
                            className="w-8 h-8 flex items-center justify-center bg-[#FEE2E2] border-2 border-black rounded-lg hover:bg-red-300 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            title="Purge Asset"
                          >
                            <Trash2 className="w-4 h-4 text-red-900" />
                          </button>
                       </div>
                    </div>

                    <div className="flex-1">
                       <h4 className="font-bold text-sm truncate mb-1" title={doc.name}>{doc.name}</h4>
                       <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          <span>{doc.docType}</span>
                          <span>{formatSize(doc.sizeBytes)}</span>
                       </div>
                       {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                             {doc.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded border-2 border-black bg-[#F2F2F7] shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[8px] uppercase tracking-widest text-[#1C1C1E]">
                                   #{tag.replace(/^#/, '')}
                                </span>
                             ))}
                          </div>
                       )}
                    </div>

                    {(doc.expiryDate || isExpiringSoon || isExpired) && (
                       <div className={`mt-4 pt-4 border-t-2 border-black border-dashed flex items-center justify-between`}>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#1C1C1E]">Valid Until</span>
                          {doc.expiryDate ? (
                            <span className={`flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${isExpired ? 'bg-red-500 text-white' : isExpiringSoon ? 'bg-amber-400 text-black' : 'bg-[#D1FAE5] text-black'}`}>
                               {(isExpired || isExpiringSoon) && <AlertTriangle className="w-3 h-3" />}
                               {format(doc.expiryDate.toMillis(), 'yyyy-MM-dd')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">PERMANENT</span>
                          )}
                       </div>
                    )}

                 </div>
               );
            })}
         </div>
      )}

    </Layout>
  );
};
