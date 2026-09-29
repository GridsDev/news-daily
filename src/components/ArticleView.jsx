import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ArticleView({ article, onBack }) {
  return (
    <article className="article">
      <button className="btn-back" onClick={onBack}>
        ← กลับหน้ารายการ
      </button>

      <header className="article-head">
        <h1>{article.title}</h1>
        <p className="article-meta">
          {article.weekday} {article.dateLabel}
          {article.sourceCount > 0 && ` · สรุปจาก ${article.sourceCount} ข่าว`}
        </p>
        {article.tags.length > 0 && (
          <div className="tags">
            {article.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
            table: ({ node, ...props }) => (
              <div className="table-wrap">
                <table {...props} />
              </div>
            ),
          }}
        >
          {article.body}
        </ReactMarkdown>
      </div>

      <footer className="article-foot">
        <button className="btn-back" onClick={onBack}>
          ← กลับหน้ารายการ
        </button>
      </footer>
    </article>
  )
}
