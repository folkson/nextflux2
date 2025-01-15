import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "@nanostores/react";
import { PhotoProvider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import "./ArticleView.css";
import ActionButtons from "@/components/ArticleView/components/ActionButtons.jsx";
import { generateReadableDate } from "@/lib/format.js";
import { activeArticle, filteredArticles } from "@/stores/articlesStore.js";
import { Chip, Divider, ScrollShadow } from "@nextui-org/react";
import EmptyPlaceholder from "@/components/ArticleList/components/EmptyPlaceholder";
import { cleanTitle, getFontSizeClass } from "@/lib/utils";
import ArticleImage from "@/components/ArticleView/components/ArticleImage.jsx";
import parse from "html-react-parser";
import { settingsState } from "@/stores/settingsStore";
import { AnimatePresence, motion } from "framer-motion";
import VideoPlayer from "@/components/ArticleView/components/VideoPlayer.jsx";
import PlayAndPause from "@/components/ArticleView/components/PlayAndPause.jsx";
import { currentThemeMode, themeState } from "@/stores/themeStore.js";
import CodeBlock from "@/components/ArticleView/components/CodeBlock.jsx";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { useIsMobile } from "@/hooks/use-mobile.jsx";

const ArticleView = () => {
  const { t } = useTranslation();
  const { articleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const $filteredArticles = useStore(filteredArticles);
  const $activeArticle = useStore(activeArticle);
  const {
    lineHeight,
    fontSize,
    maxWidth,
    alignJustify,
    fontFamily,
    titleFontSize,
    titleAlignType,
  } = useStore(settingsState);
  const { lightTheme } = useStore(themeState);
  const $currentThemeMode = useStore(currentThemeMode);
  const scrollAreaRef = useRef(null);
  const { isMedium } = useIsMobile();
  // 判断当前是否实际使用了stone主题
  const isStoneTheme = () => {
    return lightTheme === "stone" && $currentThemeMode === "light";
  };

  // 监听文章ID变化,滚动到顶部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current;
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({
            top: 0,
            behavior: "instant", // 使用 instant 避免与动画冲突
          });
        }, 300);
      }
    }
  }, [articleId]);

  useEffect(() => {
    const loadArticleByArticleId = async () => {
      if (!articleId) {
        activeArticle.set(null);
        return;
      }

      if (articleId && $filteredArticles.length > 0) {
        setLoading(true);
        setError(null);
        try {
          const loadedArticle = $filteredArticles.find(
            (article) => article.id === parseInt(articleId),
          );
          if (loadedArticle) {
            // 保存原始内容
            loadedArticle.originalContent = loadedArticle.content;
            activeArticle.set(loadedArticle);
          } else {
            setError("请选择要阅读的文章");
          }
        } catch (err) {
          console.error("加载文章失败:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    loadArticleByArticleId();
  }, [$filteredArticles, articleId]);

  const handleLinkWithImg = (domNode) => {
    const imgNode = domNode.children.find(
      (child) => child.type === "tag" && child.name === "img",
    );

    if (imgNode) {
      const hostname =
        new URL(domNode.attribs.href).hostname || domNode.attribs.href;
      return (
        <>
          <ArticleImage imgNode={imgNode} />
          <div className="flex justify-center">
            <Chip
              color="primary"
              variant="flat"
              size="sm"
              classNames={{ base: "cursor-pointer my-2" }}
              endContent={<ExternalLink className="size-4 text-primary pr-1" />}
            >
              <a
                href={domNode.attribs.href}
                className="!border-none"
                rel="noopener noreferrer"
                target="_blank"
              >
                {hostname}
              </a>
            </Chip>
          </div>
        </>
      );
    }
    return domNode;
  };

  // 检查是否有音频附件
  const audioEnclosure = $activeArticle?.enclosures?.find((enclosure) =>
    enclosure.mime_type?.startsWith("audio/"),
  );

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={articleId || "empty"}
        className={cn(
          "flex-1 bg-content2 p-0 md:pr-2 md:py-2 h-screen fixed md:static inset-0 z-50",
          !articleId ? "hidden md:flex md:flex-1" : "",
        )}
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={isMedium ? {} : { opacity: 1, x: 0, scale: 0.8 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0 }}
      >
        {loading || !$activeArticle || error ? (
          <EmptyPlaceholder />
        ) : (
          <ScrollShadow
            ref={scrollAreaRef}
            isEnabled={false}
            className="article-scroll-area h-full bg-background rounded-none md:rounded-lg shadow-none md:shadow-custom"
          >
            <ActionButtons parentRef={scrollAreaRef} />
            <div
              className="article-view-content px-5 pt-5 pb-20 w-full mx-auto"
              style={{
                maxWidth: `${maxWidth}ch`,
                fontFamily: fontFamily,
              }}
            >
              <header
                className="article-header"
                style={{ textAlign: titleAlignType }}
              >
                <div className="text-default-500 text-sm">
                  {$activeArticle?.feed?.title}
                </div>
                <h1
                  className="font-semibold my-2 hover:cursor-pointer leading-tight"
                  style={{
                    fontSize: `${titleFontSize * fontSize}px`,
                  }}
                >
                  <a
                    href={$activeArticle?.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {cleanTitle($activeArticle?.title)}
                  </a>
                </h1>
                <div className="text-default-400 text-sm">
                  <time
                    dateTime={$activeArticle?.published_at}
                    key={t.language}
                  >
                    {generateReadableDate($activeArticle?.published_at)}
                  </time>
                </div>
              </header>
              <Divider className="my-4" />
              {audioEnclosure && <PlayAndPause source={audioEnclosure} />}
              <PhotoProvider
                bannerVisible={false}
                maskOpacity={0.8}
                loop={false}
                speed={() => 300}
                easing={(type) =>
                  type !== 2
                    ? "cubic-bezier(0.34, 1.3, 0.64, 1)"
                    : "cubic-bezier(0.25, 0.8, 0.25, 1)"
                }
              >
                <div
                  className={cn(
                    "article-content prose dark:prose-invert max-w-none prose-pre:rounded-lg prose-pre:shadow-small",
                    getFontSizeClass(fontSize),
                    isStoneTheme() ? "prose-stone" : "",
                  )}
                  style={{
                    lineHeight: lineHeight + "em",
                    textAlign: alignJustify ? "justify" : "left",
                  }}
                >
                  {parse($activeArticle?.content, {
                    replace(domNode) {
                      if (domNode.type === "tag" && domNode.name === "img") {
                        return <ArticleImage imgNode={domNode} />;
                      }
                      if (domNode.type === "tag" && domNode.name === "a") {
                        return domNode.children.length > 0
                          ? handleLinkWithImg(domNode)
                          : domNode;
                      }
                      if (domNode.type === "tag" && domNode.name === "video") {
                        // 获取视频的 src 属性
                        const videoSrc =
                          domNode.attribs?.src ||
                          domNode.children?.find(
                            (child) =>
                              child.type === "tag" && child.name === "source",
                          )?.attribs?.src;

                        if (videoSrc) {
                          return (
                            <VideoPlayer src={videoSrc} provider="video" />
                          );
                        }
                        return domNode;
                      }
                      if (domNode.type === "tag" && domNode.name === "iframe") {
                        const { src } = domNode.attribs;

                        // 判断是否为 YouTube iframe
                        const isYouTube =
                          src &&
                          (src.includes("youtube.com/embed") ||
                            src.includes("youtu.be") ||
                            src.includes("youtube-nocookie.com/embed"));

                        // 判断是否为 Bilibili iframe
                        const isBilibili = src && src.includes("bilibili");

                        // 如果不是 YouTube iframe,直接返回原始节点
                        if (!isYouTube && !isBilibili) {
                          return domNode;
                        }

                        // 如果是 Bilibili iframe, 组装新的iframe，不使用VideoPlayer组件
                        if (isBilibili) {
                          // 获取bilibili视频 bvid
                          const bvid = src.match(/bvid=([^&]+)/)?.[1];
                          if (bvid) {
                            return (
                              <iframe
                                src={`//bilibili.com/blackboard/html5mobileplayer.html?isOutside=true&bvid=${bvid}&p=1&hideCoverInfo=1&danmaku=0`}
                                allowFullScreen={true}
                              ></iframe>
                            );
                          }
                          return domNode;
                        }

                        // YouTube iframe 显示打开链接的按钮
                        return <VideoPlayer src={src} provider="youtube" />;
                      }
                      if (domNode.type === "tag" && domNode.name === "pre") {
                        // 1. 首先检查是否有code子节点
                        const codeNode = domNode.children.find(
                          (child) =>
                            child.type === "tag" && child.name === "code",
                        );

                        if (codeNode) {
                          // 2. 处理带有code标签的情况
                          const className = codeNode.attribs?.class || "";
                          const language =
                            className
                              .split(/\s+/)
                              .find(
                                (cls) =>
                                  cls.startsWith("language-") ||
                                  cls.startsWith("lang-"),
                              )
                              ?.replace(/^(language-|lang-)/, "") || "text";

                          const code = codeNode.children[0].data;
                          return <CodeBlock code={code} language={language} />;
                        } else {
                          // 3. 处理直接在pre标签中的文本
                          const code = domNode.children
                            .map((child) => {
                              if (child.type === "text") {
                                return child.data;
                              } else if (
                                child.type === "tag" &&
                                child.name === "br"
                              ) {
                                return "\n";
                              }
                              return "";
                            })
                            .join("");

                          // 如果内容为空则不处理
                          if (!code.trim()) {
                            return domNode;
                          }

                          return <CodeBlock code={code} language="text" />;
                        }
                      }
                    },
                  })}
                </div>
              </PhotoProvider>
            </div>
          </ScrollShadow>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ArticleView;
