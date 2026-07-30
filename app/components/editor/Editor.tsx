'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import './editor.css'; // Import file CSS biasa

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="editor-skeleton">
      Memuat Editor...
    </div>
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list', // <-- Cukup gunakan 'list' untuk menangani bullet & ordered
  'link',
  'image',
];

export default function ArticleEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Judul dan konten tidak boleh kosong.');
      return;
    }

    setIsPublishing(true);
    console.log({ title, content });

    setTimeout(() => {
      setIsPublishing(false);
      alert('Artikel berhasil disimpan!');
    }, 1000);
  };

  return (
    <div className="editor-container">
      {/* Header Controls */}
      <div className="editor-header">
        <span className="draft-badge">Draft</span>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="publish-btn"
        >
          {isPublishing ? 'Menyimpan...' : 'Publikasikan'}
        </button>
      </div>

      {/* Title Input */}
      <input
        type="text"
        placeholder="Judul Artikel..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input"
      />

      {/* Quill Editor Wrapper */}
      <div className="quill-minimal-wrapper">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Mulai menulis cerita Anda..."
        />
      </div>

    </div>
  );
}