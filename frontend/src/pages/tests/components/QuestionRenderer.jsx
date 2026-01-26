import React, { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

const QuestionRenderer = React.memo(({ content }) => {
    const containerRef = useRef(null);

    // 1. Pre-process content to strip newlines and forced breaks
    // We replace $$ with $ to hint inline, but the delimiter config below is the real enforcer.
    // We also kill <br> and \n.
    const processedContent = React.useMemo(() => {
        if (!content) return "";
        return content
            .replace(/<br\s*\/?>/gi, " ") // Remove br
            .replace(/\n/g, " ")          // Remove newlines
            .replace(/\r/g, " ");
    }, [content]);

    useEffect(() => {
        if (containerRef.current && processedContent) {
            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        {left: "$$", right: "$$", display: false},   // FORCE INLINE (was display: true)
                        {left: "\\[", right: "\\]", display: false}, // FORCE INLINE (was display: true)
                        {left: "$", right: "$", display: false},
                        {left: "\\(", right: "\\)", display: false}
                    ],
                    macros: {
                        "\\matrix": "\\begin{matrix}#1\\end{matrix}",
                        "\\cr": "\\\\"
                    },
                    throwOnError: false,
                    output: "html" 
                });
            } catch (error) {
                console.error("KaTeX Auto-Render Error:", error);
            }
        }
    }, [processedContent]);

    // Check if content is a standalone image URL
    // Heuristic: Starts with http/https AND (ends with image extension OR contains typical image path chars)
    // We treat it as image if it looks like a URL and doesn't contain spaces (URLs usually don't have spaces unless encoded)
    // Actually, simple regex for extension is safest for now, or just try to instantiate Image? No, regex is faster.
    const isImageURL = (str) => {
        if (!str || typeof str !== 'string') return false;
        const trimmed = str.trim();
        // Check for common extensions
        if (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(trimmed)) return true;
        // Check for specific CDNs seen in user data (imagex.cdn.examgoal.net)
        if (trimmed.startsWith('http') && trimmed.includes('/image')) return true; 
        return false;
    };

    if (isImageURL(processedContent)) {
         return (
             <img 
                src={processedContent.trim()} 
                alt="Option" 
                className="max-h-32 object-contain rounded-lg border border-gray-200 mt-2"
                onError={(e) => { e.target.style.display = 'none'; }} // Hide if fail
             />
         );
    }

    if (!processedContent) return null;

    return (
        <span className="question-content block">
            <style>{`
                .question-content p { margin: 0; display: inline; } /* Force p tags to be inline */
                .question-content div { display: inline; } /* Force divs to be inline */
                .question-content span { display: inline; }
                .katex-display { margin: 0 !important; display: inline-block !important; } /* Kill KaTeX display margins */
            `}</style>
            <span 
                ref={containerRef} 
                dangerouslySetInnerHTML={{ __html: processedContent }} 
            />
        </span>
    );
});

export default QuestionRenderer;
