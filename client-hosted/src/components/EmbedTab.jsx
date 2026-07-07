import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { BASE } from '../api';
import { Card } from './ui.jsx';

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function EmbedTab() {
  const pageUrl = `${window.location.origin}${BASE || '/'}`;
  const embedCode = `<iframe id="link-in-bio-embed" src="${pageUrl}" style="width:100%;max-width:640px;border:0;display:block;margin:0 auto;height:800px" loading="lazy" title="Link in bio"></iframe>
<script>
(function () {
  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.source === 'link-in-bio') {
      var f = document.getElementById('link-in-bio-embed');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
})();
</script>`;

  return (
    <div className="space-y-4">
      <Card title="Embed this page anywhere">
        <p className="text-sm text-zinc-400 mb-4">
          Paste this snippet into any site (Netlify, Squarespace, WordPress — anywhere HTML is allowed). The
          page auto-resizes to fit its content, so there's no fixed height to fight with.
        </p>
        <CodeBlock code={embedCode} />
      </Card>
      <Card title="Direct link">
        <p className="text-sm text-zinc-400 mb-3">Or just link straight to the hosted page:</p>
        <CodeBlock code={pageUrl} />
      </Card>
    </div>
  );
}
