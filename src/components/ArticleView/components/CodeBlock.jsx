import { codeToHtml } from "shiki";
import { useEffect, useState } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function CodeBlock({ code, language }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    async function highlight() {
      const highlighted = await codeToHtml(code, {
        lang: language || "text",
        theme: "github-dark",
      });
      setHtml(highlighted);
    }

    highlight();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("已复制");
    } catch (err) {
      console.error("复制失败:", err);
      toast.error("复制失败");
    }
  };

  return (
    <div className="code-block relative group">
      <span className="text-xs absolute right-2 top-1 text-white/70 opacity-100 group-hover:opacity-0 transition-opacity">
        {language}
      </span>
      <Tooltip size="sm" closeDelay="0" content="复制">
        <Button
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          size="sm"
          variant="light"
          isIconOnly
          onPress={handleCopy}
        >
          <Copy className="size-4 text-white" />
        </Button>
      </Tooltip>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
