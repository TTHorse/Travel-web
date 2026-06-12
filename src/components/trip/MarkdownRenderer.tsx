import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Image from "next/image";
import type { Components } from "react-markdown";

const components: Components = {
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold mt-10 mb-4 text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-8 mb-3 text-white/90" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p
      className="text-white/70 leading-relaxed mb-4 text-base"
      {...props}
    >
      {children}
    </p>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;
    return (
      <div className="relative aspect-video my-6 rounded-lg overflow-hidden">
        <Image
          src={src}
          alt={alt || ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
    );
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-orange-500 pl-4 my-4 text-white/60 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-1 mb-4 text-white/70" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal list-inside space-y-1 mb-4 text-white/70"
      {...props}
    >
      {children}
    </ol>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-white/10 rounded px-1.5 py-0.5 text-sm text-orange-300 font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="block bg-white/5 rounded-lg p-4 text-sm overflow-x-auto"
        {...props}
      >
        {children}
      </code>
    );
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
