import { useState, useRef } from 'react';
import Head from 'next/head';

// ── 工具函数 ──────────────────────────────────────────

// 压缩图片到最大 1200px，转为 jpeg，避免超出 Vercel 4.5MB 限制
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const previewUrl = reader.result;
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round(height * MAX / width);
            width = MAX;
          } else {
            width = Math.round(width * MAX / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        resolve({
          base64: compressed.split(",")[1],
          mimeType: "image/jpeg",
          previewUrl,
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

const copyText = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
};

// ── 子组件：图片上传区 ────────────────────────────────
function ImageUploader({ label, badge, accentColor, image, onChange, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file) => {
    if (file && file.type.startsWith('image/')) {
      const data = await fileToBase64(file);
      onChange(data);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 标签 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: accentColor,
          color: '#000',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 20,
          fontFamily: 'var(--font-display)',
          letterSpacing: 1,
        }}>{badge}</span>
        <span style={{ fontSize: 13, color: '#aaa', fontWeight: 500 }}>{label}</span>
      </div>

      {/* 上传框 */}
      <div
        onClick={() => !image && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          borderRadius: 24,
          border: `2px dashed ${dragging ? accentColor : image ? 'transparent' : '#2a2a3a'}`,
          background: image ? 'transparent' : dragging ? 'rgba(139,92,246,0.05)' : '#0f0f1a',
          cursor: image ? 'default' : 'pointer',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          boxShadow: dragging ? `0 0 30px ${accentColor}30` : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {image ? (
          <>
            <img
              src={image.previewUrl}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* 悬浮清除按钮 */}
            <div className="img-overlay" style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44, height: 44,
                  fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}
              >✕</button>
            </div>
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: 24, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 16,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {badge === 'PRODUCT' ? '🖼' : '✦'}
            </div>
            <div>
              <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>点击或拖拽上传</p>
              <p style={{ color: '#555', fontSize: 11 }}>JPG · PNG · WEBP</p>
            </div>
          </div>
        )}
      </div>

      <style>{`.img-overlay:hover { opacity: 1 !important; }`}</style>
    </div>
  );
}

// ── 子组件：结果卡片 ─────────────────────────────────
function ResultCard({ title, icon, content, isEmpty, delay = 0 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (isEmpty || !content) return;
    copyText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: '#0f0f1a',
        border: '1px solid #1e1e30',
        borderRadius: 20,
        padding: '20px 22px',
        opacity: isEmpty ? 0.4 : 1,
        filter: isEmpty ? 'grayscale(0.5)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            color: '#ccc',
            letterSpacing: 0.3,
          }}>{title}</span>
        </div>
        {!isEmpty && (
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#1a3a1a' : '#1a1a2a',
              border: `1px solid ${copied ? '#2a5a2a' : '#2a2a3a'}`,
              color: copied ? '#4ade80' : '#666',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: isEmpty ? '#444' : '#aaa', lineHeight: 1.75, minHeight: 72 }}>
        {isEmpty
          ? <em>未上传对应图片 — 跳过此板块</em>
          : <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        }
      </div>
    </div>
  );
}

// ── 子组件：骨架屏 ───────────────────────────────────
function Skeleton() {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 20, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[100, 85, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}%`, height: 13, borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}

// ── 密码登录页 ───────────────────────────────────────
function LoginPage({ onLogin }) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setChecking(true);
    setWrong(false);
    try {
      const res = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem('pa_auth', '1');
        onLogin();
      } else {
        setWrong(true);
      }
    } catch {
      setWrong(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0a0f',
    }}>
      <div style={{
        background: '#0c0c18', border: '1px solid #1a1a2a',
        borderRadius: 28, padding: '48px 40px', width: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>✦</div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            fontWeight: 800, color: '#f0f0f8', marginBottom: 8,
          }}>Prompt Architect</h1>
          <p style={{ color: '#555', fontSize: 13 }}>请输入访问密码</p>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入密码…"
            style={{
              width: '100%', padding: '12px 16px',
              background: '#0f0f1a', border: ,
              borderRadius: 12, color: '#eee', fontSize: 15,
              outline: 'none', fontFamily: 'var(--font-body)',
              boxSizing: 'border-box',
            }}
          />
          {wrong && (
            <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center' }}>
              密码错误，请重试
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={checking || !input.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #db2777)' : '#1a1a2a',
              color: input.trim() ? '#fff' : '#444',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {checking ? '验证中…' : '进入'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────
export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [fullCopied, setFullCopied] = useState(false);

  // 检查 sessionStorage 里是否已经登录过（刷新页面不用重新输入）
  useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('pa_auth') === '1') {
      setAuthed(true);
    }
  });

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  const canAnalyze = !loading && (productImage || referenceImage);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // 调用我们自己的后端，而不是直接调 Gemini
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productImage, referenceImage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '请求失败，请重试。');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFull = () => {
    if (!results?.full_prompt) return;
    const finalPrompt = `${results.full_prompt}\n\n严格保持产品的一致性，图片尺寸为3:4`;
    copyText(finalPrompt);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2500);
  };

  return (
    <>
      <Head>
        <title>Prompt Architect — 反向解析引擎</title>
        <meta name="description" content="上传产品图或参考图，提取像素级AI生图提示词" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
      </Head>

      <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 1360, margin: '0 auto' }}>

        {/* ── 顶部标题 ── */}
        <header style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>✦</div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 800,
              color: '#f0f0f8',
              letterSpacing: -0.5,
            }}>
              Prompt Architect
              <span style={{ color: '#3a3a5a', margin: '0 12px', fontWeight: 300 }}>|</span>
              <span style={{ color: '#666', fontWeight: 400, fontSize: '0.6em' }}>反向解析引擎</span>
            </h1>
          </div>
          <p style={{ color: '#555', fontSize: 14, paddingLeft: 48 }}>
            上传产品图或参考主图 → 提取像素级生图提示词架构
          </p>
        </header>

        {/* ── 主体网格 ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 380px) 1fr',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* ── 左栏：上传区 ── */}
          <div style={{
            background: '#0c0c18',
            border: '1px solid #1a1a2a',
            borderRadius: 28,
            padding: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <ImageUploader
                label="产品图片"
                badge="PRODUCT"
                accentColor="#8b5cf6"
                image={productImage}
                onChange={setProductImage}
                onClear={() => setProductImage(null)}
              />
              <ImageUploader
                label="参考主图"
                badge="REF"
                accentColor="#ec4899"
                image={referenceImage}
                onChange={setReferenceImage}
                onClear={() => setReferenceImage(null)}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div style={{
                background: '#1a0a0a',
                border: '1px solid #3a1515',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 16,
                color: '#f87171',
                fontSize: 13,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* 解析按钮 */}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={canAnalyze ? 'glow-border' : ''}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 16,
                border: 'none',
                background: canAnalyze
                  ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                  : '#1a1a2a',
                color: canAnalyze ? '#fff' : '#444',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>
                  像素级深度解析中…
                </>
              ) : (
                <>✦ 解析全量提示词架构</>
              )}
            </button>

            {/* 说明文字 */}
            <p style={{ textAlign: 'center', color: '#333', fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
              两张图可单独上传 · 至少一张即可解析
            </p>
          </div>

          {/* ── 右栏：结果区 ── */}
          <div>
            {/* 空状态 */}
            {!loading && !results && (
              <div style={{
                background: '#0c0c18',
                border: '1px solid #1a1a2a',
                borderRadius: 28,
                padding: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 480,
                textAlign: 'center',
                gap: 16,
              }}>
                <div style={{
                  width: 80, height: 80,
                  borderRadius: 24,
                  background: '#0f0f1f',
                  border: '1px solid #1e1e30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  color: '#2a2a3a',
                }}>⬡</div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#3a3a5a',
                }}>等待执行反向工程</h2>
                <p style={{ color: '#333', fontSize: 13, maxWidth: 360, lineHeight: 1.7 }}>
                  在左侧上传图片后点击解析按钮<br />
                  系统将自动拆解主体特征、构图透视、布光材质及文字视觉系统
                </p>
              </div>
            )}

            {/* 加载骨架屏 */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Skeleton /><Skeleton /><Skeleton /><Skeleton />
              </div>
            )}

            {/* 结果 */}
            {!loading && results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 四个板块卡片 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <ResultCard title="产品主体解析" icon="🖼" content={results.subject} isEmpty={!results.subject?.trim()} delay={0} />
                  <ResultCard title="精细构图还原" icon="⊞" content={results.composition} isEmpty={!results.composition?.trim()} delay={80} />
                  <ResultCard title="场景与布光材质" icon="◈" content={results.style} isEmpty={!results.style?.trim()} delay={160} />
                  <ResultCard title="文字视觉系统" icon="T" content={results.text} isEmpty={!results.text?.trim()} delay={240} />
                </div>

                {/* 全量 Prompt 框 */}
                <div
                  className="animate-fade-up"
                  style={{
                    animationDelay: '320ms',
                    background: 'linear-gradient(135deg, #0d0d20 0%, #120a1a 100%)',
                    border: '1px solid #2a1a3a',
                    borderRadius: 24,
                    padding: 28,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: 18,
                      }}>✦</span>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#ddd',
                        letterSpacing: 0.3,
                      }}>全量整合提示词 — Ready for AI</h3>
                    </div>
                    <button
                      onClick={handleCopyFull}
                      disabled={!results.full_prompt}
                      style={{
                        background: fullCopied ? '#0d2a0d' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                        border: fullCopied ? '1px solid #1a4a1a' : 'none',
                        color: fullCopied ? '#4ade80' : '#fff',
                        borderRadius: 12,
                        padding: '8px 20px',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        cursor: results.full_prompt ? 'pointer' : 'not-allowed',
                        letterSpacing: 0.3,
                        transition: 'all 0.25s',
                      }}
                    >
                      {fullCopied ? '✓ 已复制' : '一键复制全文'}
                    </button>
                  </div>
                  <div style={{
                    background: '#08080f',
                    border: '1px solid #1a1a2a',
                    borderRadius: 16,
                    padding: '18px 20px',
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}>
                    <p style={{
                      fontSize: 13,
                      color: '#8a8aaa',
                      lineHeight: 1.85,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {results.full_prompt || <em style={{ color: '#333' }}>未生成有效内容…</em>}
                    </p>
                  </div>
                  <p style={{ color: '#2a2a3a', fontSize: 11, marginTop: 12 }}>
                    * 复制时自动附加：严格保持产品的一致性，图片尺寸为3:4
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 'minmax"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
