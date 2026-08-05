'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import './editor.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import('react-quill-new');

    const ImageResize = (await import('quill-image-resize-module-react')).default;
    Quill.register('modules/imageResize', ImageResize);

    // Register Custom Image Blot untuk mempertahankan atribut width, style, class, & alt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  'image', // Cukup 'image', atribut internalnya otomatis diproses oleh AttributedImage
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

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: '', // Tambahkan state description jika ada input terpisah
          pubDate: new Date().toISOString().split('T')[0],
          heroImage: '', // URL gambar hero jika ada
          content,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mempublikasikan artikel.');
      }

      alert('Artikel berhasil dipublikasikan ke GitHub!');
      setTitle('');
      setContent('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
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