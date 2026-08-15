/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import './editor.css';
import Toast from '../UI/Toast/Toast';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import('react-quill-new');

    const ImageResize = (await import('quill-image-resize-module-react')).default;
    Quill.register('modules/imageResize', ImageResize);

    const ImageBlot = Quill.import('formats/image') as any;

    class AttributedImage extends ImageBlot {
      static create(value: string | Record<string, string>) {
        const node = super.create(typeof value === 'string' ? value : value.src);
        if (typeof value === 'object') {
          if (value.alt) node.setAttribute('alt', value.alt);
          if (value.width) node.setAttribute('width', value.width);
          if (value.style) node.setAttribute('style', value.style);
          if (value.class) node.setAttribute('class', value.class);
        }
        return node;
      }

      static value(node: HTMLElement) {
        return {
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt'),
          width: node.getAttribute('width'),
          style: node.getAttribute('style'),
          class: node.getAttribute('class'),
        };
      }
    }

    AttributedImage.blotName = 'image';
    AttributedImage.tagName = 'IMG';
    Quill.register(AttributedImage, true);

    return RQ;
  },
  {
    ssr: false,
    loading: () => <div className="editor-skeleton">Memuat Editor...</div>,
  }
);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
  imageResize: {
    parchment: null,
    modules: ['Resize', 'DisplaySize', 'Toolbar'],
  },
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'link',
  'image',
];

export default function ArticleEditor() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ show: true, type, title, message });
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !content.trim()) {
      showToast('error', 'Validasi Gagal', 'Judul, deskripsi, dan konten artikel tidak boleh kosong.');
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          pubDate: new Date().toISOString().split('T')[0],
          heroImage,
          content,
        }),
      });

      const rawText = await response.text();
      let result;

      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Server Error (${response.status}). Silakan periksa log server.`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mempublikasikan artikel.');
      }

      showToast(
        'success',
        'Artikel Dipublikasikan',
        'File markdown berhasil di-commit dan dikirim ke repository GitHub.'
      );

      setTitle('');
      setDescription('');
      setHeroImage('');
      setContent('');
    } catch (err: any) {
      showToast('error', 'Gagal Mempublikasikan', err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="editor-container">
      {toast.show && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

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

      <input
        type="text"
        placeholder="Judul Artikel..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input"
      />

      <textarea
        placeholder="Deskripsi Singkat (Ringkasan Artikel)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="description-input"
        rows={2}
      />

      <input
        type="text"
        placeholder="URL Hero Image (Opsional, contoh: ../../assets/blog-placeholder-3.jpg)"
        value={heroImage}
        onChange={(e) => setHeroImage(e.target.value)}
        className="meta-input"
      />

      <div className="quill-minimal-wrapper">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Mulai menulis Artikel..."
        />
      </div>
    </div>
  );
}