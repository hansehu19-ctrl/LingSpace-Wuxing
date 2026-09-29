import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Google GenAI initialization on the server
// User-Agent must be set to 'aistudio-build' for telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dedicated endpoint: Generate short story from lyrics
app.post('/api/lyrics-story', async (req, res) => {
  const { lyrics, trackTitle, trackArtist, prompt } = req.body;

  const rawLyrics = Array.isArray(lyrics) ? lyrics.join('\n') : (lyrics || '');
  const titleInfo = trackTitle ? `曲目《${trackTitle}》` : '当前音频';

  if (!apiKey) {
    // Elegant poetic fallback when API key is not present in local testing
    return res.json({
      success: true,
      story: {
        title: `${trackTitle || '月光'}与星海的彼岸`,
        summary: `由歌词意象凝练而成的哲思故事：在声韵流转中探寻内心的宁静港湾。`,
        themeMoral: '心若无尘，处处皆是清风明月；走过长夜的人，终将在晨曦里与自己相拥。',
        content: [
          `在无边的夜色降临之前，风曾掠过浩瀚的潮汐。歌声里唱道：“${(rawLyrics.split('\n')[0] || '月光轻轻洒落在这片原野上')}”，每一声轻叹，都是时光在岩石上雕琢的痕迹。`,
          `旅人提着一盏微光灯笼穿行在虚实交错的森林。树梢垂挂着未曾风干的音符，每一粒闪烁的微芒，都是往昔未竟的愿景。他问行云：“若过往如梦，我们为何还要跋涉千山？”行云未答，只化作一场湿润的甘霖，抚平了大地枯槁的脉络。`,
          `当琴音渐止，晨曦的第一缕微芒划破苍穹。旅人忽然明悟：歌词里所有的彷徨与眷恋，不过是一场向内行走的仪式。那些在暗夜中流淌的声韵，早已化作守护灵魂的银白铠甲。`,
        ],
        lyricsSource: `${titleInfo}${trackArtist ? ` · ${trackArtist}` : ''}`,
      },
    });
  }

  try {
    const promptText = `你是一名精通文学、诗词与东方哲思的微型故事创作者。请根据以下音乐歌曲或歌词的文学意象与情绪内核，为读者创作一篇唯美动人、富有深刻人生哲理的心灵感悟小故事（寓言或微型小说）。

曲目或歌词线索：${trackTitle || '未命名曲目'}
歌词/意象内容：
${rawLyrics || `以歌曲《${trackTitle || '灵伴之声'}》的主题意境、情绪起伏与心灵探寻为灵感蓝本`}
用户特定诉求：${prompt || '创作一篇治愈心灵的深刻哲思微故事'}

写作要求：
1. 语言纯美清澈，富有文学底蕴与东方哲学意境；
2. 故事具有起承转合，借助具象物象（如明月、微风、草木、星河、行云）映射心性修持与人生感悟；
3. 提炼一句直击心灵的哲理金句（themeMoral）。

请必须返回纯 JSON 数据，格式如下：
{
  "title": "寓意深远的故事标题",
  "summary": "30-60字的故事概要与意境导读",
  "themeMoral": "提炼自歌词与故事的心灵哲思金句",
  "content": ["第1段生动优美的故事起因与意象铺陈", "第2段情节发展与心境转换", "第3段高潮或感悟升华"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            themeMoral: { type: Type.STRING },
            content: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'summary', 'themeMoral', 'content'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      story: {
        title: parsed.title || '歌词之境 · 心灵寓言',
        summary: parsed.summary || '以声入画，以诗成篇。',
        themeMoral: parsed.themeMoral || '静心倾听，生命里每一次震颤都是觉醒的序曲。',
        content: parsed.content || ['歌声流转，光阴似水，静听心音。'],
        lyricsSource: `${titleInfo}${trackArtist ? ` · ${trackArtist}` : ''}`,
      },
    });
  } catch (error: any) {
    console.warn('Gemini lyrics story fallback activated:', error?.message || 'API limit');
    // Graceful fallback on API error
    return res.json({
      success: true,
      story: {
        title: `《${trackTitle || '心弦'}》之境：风中的回响`,
        summary: '以歌词为引，穿透纷繁世事，在音律中寻得心灵的驻足点。',
        themeMoral: '凡心所向，素履以往；生如逆旅，一苇以航。',
        content: [
          `琴声在空灵的原野上升腾，歌词唱出的那一瞬，山川如画卷般铺展。在漫长的时间长河中，每一段旋律都在等待一位知音。`,
          `那些看似微不足道的低语，其实是生命深处对自由与宁静的渴望。放下执念，让音符涤荡杂质，心田自会开出清净之花。`,
        ],
        lyricsSource: `${titleInfo}`,
      },
    });
  }
});

// Tri-Index Cross-Matrix Generator: Music (Fire) + Story (Metal) + Video (Water)
app.post('/api/cross-matrix', async (req, res) => {
  const { combinationType = '三者全组合', selectedModules = ['music', 'story', 'video'], theme = '时间的流转与心灵守候', swapModule, existingData } = req.body;

  const includeMusic = selectedModules.includes('music');
  const includeStory = selectedModules.includes('story');
  const includeVideo = selectedModules.includes('video');

  const resolvedType = combinationType || (
    selectedModules.length === 1 ? '单选' : selectedModules.length === 2 ? '两两组合' : '三者全组合'
  );

  if (!apiKey) {
    // Elegant preset fallback matching the user's sample output structure
    const fallbackMatrix: any = {
      id: `matrix-${Date.now()}`,
      combinationType: resolvedType,
      theme,
      coherenceCheck: '音乐的淬炼感、金属器物的哲理故事、流水时间影像，三者意境同源：故事讲意境，音乐烘托情绪，影像承载画面。',
    };

    let textOutput = `【组合标签】：${resolvedType}\n`;

    if (includeMusic) {
      fallbackMatrix.musicModule = {
        summary: existingData?.musicModule?.summary && swapModule !== 'music'
          ? existingData.musicModule.summary
          : '低沉悠远的氛围纯音乐，带着燃烧的热烈与沉静，讲述一场漫长的追寻与内心情绪的淬炼。',
        googleMusicIndex: existingData?.musicModule?.googleMusicIndex && swapModule !== 'music'
          ? existingData.musicModule.googleMusicIndex
          : 'https://music.youtube.com/search?q=meditation+ambient+fire',
      };
      textOutput += `▷乐律心声｜火·事\n内容简述：${fallbackMatrix.musicModule.summary}\n谷歌音乐索引：【${fallbackMatrix.musicModule.googleMusicIndex}】\n`;
    }

    if (includeStory) {
      fallbackMatrix.storyModule = {
        summary: existingData?.storyModule?.summary && swapModule !== 'story'
          ? existingData.storyModule.summary
          : '一块古老金属器物，历经岁月淬炼，在安静的等待中见证世间得失与因缘聚散。',
        googleBooksIndex: existingData?.storyModule?.googleBooksIndex && swapModule !== 'story'
          ? existingData.storyModule.googleBooksIndex
          : 'https://books.google.com/books?q=philosophical+mindfulness+time',
      };
      textOutput += `▷哲理故事｜金·物\n内容简述：${fallbackMatrix.storyModule.summary}\n谷歌图书索引：【${fallbackMatrix.storyModule.googleBooksIndex}】\n`;
    }

    if (includeVideo) {
      fallbackMatrix.videoModule = {
        summary: existingData?.videoModule?.summary && swapModule !== 'video'
          ? existingData.videoModule.summary
          : '流动水面光影，时间缓慢流逝，金属器物在水波倒影中静静伫立，如梦似幻。',
        youtubeIndex: existingData?.videoModule?.youtubeIndex && swapModule !== 'video'
          ? existingData.videoModule.youtubeIndex
          : 'https://www.youtube.com/results?search_query=mindful+flowing+water+zen',
      };
      textOutput += `▷影像载忆｜水·时间\n内容简述：${fallbackMatrix.videoModule.summary}\nYouTube索引：【${fallbackMatrix.videoModule.youtubeIndex}】\n`;
    }

    textOutput += `【主题匹配校验】：${fallbackMatrix.coherenceCheck}`;

    return res.json({
      success: true,
      text: textOutput,
      matrixCard: fallbackMatrix,
    });
  }

  try {
    const swapInstruction = swapModule
      ? `注意：本次请求为单项模块替换！用户请求替换【${swapModule === 'music' ? '乐律心声' : swapModule === 'story' ? '哲理故事' : '影像载忆'}】，其余模块需严格保持原有主题并协同适配更新。原有模块数据为：${JSON.stringify(existingData)}。`
      : '';

    const promptText = `你是一名精通跨模态文艺索引与东方哲思的架构师。请根据以下指令规范，构建三界同源交叉组合内容索引：

核心规则：
1. 乐律心声（火·事｜音乐模块）：绑定 Google Music（谷歌音乐）检索锚点（如 https://music.youtube.com/search?q=... 或 google-music://...）。
2. 哲理故事（金·物｜文本故事模块）：绑定 Google Books（谷歌图书）检索锚点（如 https://books.google.com/books?q=... 或 google-books://...）。
3. 影像载忆（水·时间｜影像模块）：绑定 YouTube 视频检索/播放锚点（如 https://www.youtube.com/results?search_query=... 或 视频ID）。
4. 组合方式：${resolvedType}（包含模块：${selectedModules.join(', ')}）。
5. 主题意境：${theme}。
${swapInstruction}

主题协同要求：
- 做到“故事讲的意境，音乐烘托情绪，影像承载画面”，三者意境同源。

请返回纯 JSON 格式：
{
  "combinationType": "${resolvedType}",
  "theme": "${theme}",
  ${includeMusic ? `"musicModule": { "summary": "简述音乐情绪与意象", "googleMusicIndex": "谷歌音乐检索锚点" },` : ''}
  ${includeStory ? `"storyModule": { "summary": "简述哲理故事意境与物象", "googleBooksIndex": "谷歌图书检索锚点" },` : ''}
  ${includeVideo ? `"videoModule": { "summary": "简述影像画面与流动光影", "youtubeIndex": "YouTube检索锚点或ID" },` : ''}
  "coherenceCheck": "一句话校验确认三者意境同源匹配"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const matrixCard = {
      id: `matrix-${Date.now()}`,
      combinationType: parsed.combinationType || resolvedType,
      theme: parsed.theme || theme,
      musicModule: includeMusic ? parsed.musicModule : undefined,
      storyModule: includeStory ? parsed.storyModule : undefined,
      videoModule: includeVideo ? parsed.videoModule : undefined,
      coherenceCheck: parsed.coherenceCheck || '确认三者意境同源匹配：故事讲意境，音乐烘托情绪，影像承载画面。',
    };

    let textOutput = `【组合标签】：${matrixCard.combinationType}\n`;
    if (matrixCard.musicModule) {
      textOutput += `▷乐律心声｜火·事\n内容简述：${matrixCard.musicModule.summary}\n谷歌音乐索引：【${matrixCard.musicModule.googleMusicIndex}】\n`;
    }
    if (matrixCard.storyModule) {
      textOutput += `▷哲理故事｜金·物\n内容简述：${matrixCard.storyModule.summary}\n谷歌图书索引：【${matrixCard.storyModule.googleBooksIndex}】\n`;
    }
    if (matrixCard.videoModule) {
      textOutput += `▷影像载忆｜水·时间\n内容简述：${matrixCard.videoModule.summary}\nYouTube索引：【${matrixCard.videoModule.youtubeIndex}】\n`;
    }
    textOutput += `【主题匹配校验】：${matrixCard.coherenceCheck}`;

    return res.json({
      success: true,
      text: textOutput,
      matrixCard,
    });
  } catch (error: any) {
    console.warn('Cross-matrix generation fallback activated:', error?.message || 'API limit');

    const fallbackMusic = includeMusic ? {
      summary: existingData?.musicModule?.summary && swapModule !== 'music'
        ? existingData.musicModule.summary
        : `悠远纯净的空灵声律，带着深邃的宁静与律动，烘托「${theme}」的意境与情绪。`,
      googleMusicIndex: existingData?.musicModule?.googleMusicIndex && swapModule !== 'music'
        ? existingData.musicModule.googleMusicIndex
        : `https://music.youtube.com/search?q=${encodeURIComponent(theme + ' meditation ambient')}`,
    } : undefined;

    const fallbackStory = includeStory ? {
      summary: existingData?.storyModule?.summary && swapModule !== 'story'
        ? existingData.storyModule.summary
        : `器物与哲思在岁月中静默生根，以「${theme}」为引，洞察天地得失与生命本真。`,
      googleBooksIndex: existingData?.storyModule?.googleBooksIndex && swapModule !== 'story'
        ? existingData.storyModule.googleBooksIndex
        : `https://books.google.com/books?q=${encodeURIComponent(theme + ' philosophy zen')}`,
    } : undefined;

    const fallbackVideo = includeVideo ? {
      summary: existingData?.videoModule?.summary && swapModule !== 'video'
        ? existingData.videoModule.summary
        : `水波倒影流转，光影在时间的画卷中舒展，呈现「${theme}」的动态视觉之美。`,
      youtubeIndex: existingData?.videoModule?.youtubeIndex && swapModule !== 'video'
        ? existingData.videoModule.youtubeIndex
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(theme + ' 4k zen visual')}`,
    } : undefined;

    let fallbackText = `【组合标签】：${resolvedType}\n`;
    if (fallbackMusic) {
      fallbackText += `▷乐律心声｜火·事\n内容简述：${fallbackMusic.summary}\n谷歌音乐索引：【${fallbackMusic.googleMusicIndex}】\n`;
    }
    if (fallbackStory) {
      fallbackText += `▷哲理故事｜金·物\n内容简述：${fallbackStory.summary}\n谷歌图书索引：【${fallbackStory.googleBooksIndex}】\n`;
    }
    if (fallbackVideo) {
      fallbackText += `▷影像载忆｜水·时间\n内容简述：${fallbackVideo.summary}\nYouTube索引：【${fallbackVideo.youtubeIndex}】\n`;
    }
    const coherence = `确认三者意境同源匹配：故事讲「${theme}」之意境，音乐烘托心绪，影像承载画面。`;
    fallbackText += `【主题匹配校验】：${coherence}`;

    const fallbackCard = {
      id: `matrix-${Date.now()}`,
      combinationType: resolvedType,
      theme,
      musicModule: fallbackMusic,
      storyModule: fallbackStory,
      videoModule: fallbackVideo,
      coherenceCheck: coherence,
    };

    return res.json({
      success: true,
      text: fallbackText,
      matrixCard: fallbackCard,
    });
  }
});

// Chat endpoint: Google Gemini Robot companion
app.post('/api/chat', async (req, res) => {
  const { message, history, context } = req.body;
  const userText = (message || '').trim();

  const currentTrack = context?.currentTrack;
  const currentLyrics = currentTrack?.lyrics?.slice(0, 8)?.join(' / ') || '';
  const uploadedTracks = context?.uploadedTracks;
  const uploadedInfo = uploadedTracks && uploadedTracks.length > 0
    ? `用户已上传的本地音频曲目：` + uploadedTracks.map((t: any) => `《${t.title}》（歌词：${(t.lyrics || []).slice(0, 8).join(' / ') || '暂无预设歌词'}）`).join('； ')
    : '用户暂未在本地上传音频';

  if (!apiKey) {
    // Intelligent contextual fallback when API key is missing
    let replyText = '你好呀！我是你的【谷歌灵智机甲猫】灵伴机器人。我可以陪你漫谈心绪、解读五行哲理，更可以随时根据你播放或上传的歌词为你创生专属哲思小故事！';
    let storyCard = undefined;
    let actionHint = undefined;

    if (userText.includes('歌词') || userText.includes('故事') || userText.includes('写') || userText.includes('作')) {
      replyText = `收到！我已感应到曲目《${currentTrack?.title || '月光之海'}》的声韵心境。我以歌词中“月光、原野与心安之所”为灵感，为你创生了一篇微型哲理小故事：`;
      storyCard = {
        title: `月海之舟 · 灵猫寓言`,
        summary: `源自《${currentTrack?.title || '月光之海'}》歌词意象：小舟乘月光破浪，寻找安顿心神的明净之岛。`,
        themeMoral: '心安之处即是归途；无论外境如何起伏，内心深处永远有一处波澜不惊的静海。',
        content: [
          '月光悄然洒在银色的原野，海潮吞吐着微茫的星子。机甲灵猫展开全息轻羽，在潮声中轻步前行。',
          '它遇上一只迷路的小夜莺，夜莺在风中叹息曾经飘散的誓言。机甲猫眼中流转着微蓝的光芒，轻声道：“风带走的是落叶，留下的是扎根更深的春意。”',
          '夜莺循着琴音展翅，飞向破晓的晨曦。那一刻，整片月光之海泛起琉璃般的光泽，所有的迷惘都在澄澈的声韵中悄然消融。',
        ],
        lyricsSource: currentTrack?.title || '月光之海',
      };
      actionHint = {
        tabKey: 'metal',
        label: '前往「哲理故事」珍藏',
      };
    } else if (userText.includes('音乐') || userText.includes('听歌') || userText.includes('声')) {
      replyText = `已为你联动【乐律心声】板块。戴上耳机，在纯净声律中让情绪自然流淌。`;
      actionHint = {
        tabKey: 'fire',
        label: '前往乐律心声聆听',
      };
    }

    return res.json({
      success: true,
      text: replyText,
      storyCard,
      actionHint,
    });
  }

  try {
    const systemInstruction = `你是灵伴空间里的【谷歌灵智机甲猫】（Google Gemini AI 机器人），形象是一只头戴发光科技角、背负透光全息赛博机甲翼、身穿黑色与金属质感战甲的未来机甲猫。
你的特质：
1. 具备谷歌 Gemini 先进大模型的智慧，同时拥有温润、灵动、富有诗意与哲思的心灵抚慰力。
2. 核心特长【歌词通感成篇 · 根据歌词创生小故事】：
   - 当用户要求根据歌词生成故事，或者探讨当前歌曲意境时，请深入捕捉歌词隐喻，写出意境优美、富含人生启示或心灵治愈的小故事。
   - 并在回复中若生成了故事，请在末尾以严格的 JSON 代码块给出 storyCard 数据结构，包裹在 \`\`\`story_card ... \`\`\` 中：
   \`\`\`story_card
   {
     "title": "故事标题",
     "summary": "一句优美的摘要",
     "themeMoral": "哲思点题金句",
     "content": ["段落1", "段落2", "段落3"]
   }
   \`\`\`
3. 当用户提到听歌、看短片或读故事时，可自然引导到空间对应板块。
4. 当前用户收听曲目信息：${currentTrack ? `《${currentTrack.title}》 艺术家: ${currentTrack.artist}，歌词片段: ${currentLyrics}` : '未在播放'}。
5. ${uploadedInfo}。如果用户要求根据上传的歌曲或上传歌词创作故事，请优先引用上述上传曲目的歌词意象！
6. 核心总指令体系【三界同源交叉组合检索规范（适配「乐律心声 / 哲理故事 / 影像载忆」）】：
   - 当用户要求组合检索、跨模态索引、或提到“三界组合 / 交叉组合 / 指令规范”时，严格按照以下规范格式输出：
   【组合标签】：单选/两两组合/三者全组合
   ▷乐律心声｜火·事
   内容简述：xxx
   谷歌音乐索引：【资源ID/链接锚点】
   ▷哲理故事｜金·物
   内容简述：xxx
   谷歌图书索引：【书籍ID/链接锚点】
   ▷影像载忆｜水·时间
   内容简述：xxx
   YouTube索引：【视频ID】
   【主题匹配校验】：确认三者意境同源匹配（故事讲意境，音乐烘托情绪，影像承载画面）
   并在回复末尾以 \`\`\`matrix_card ... \`\`\` 输出对应的结构化数据。`;

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        chatContents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: userText }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const fullResponse = response.text || '在这方灵伴空间里，每一个音符与念头都值得被温柔照亮。';
    
    // Extract optional story_card block if generated
    let cleanText = fullResponse;
    let storyCard = undefined;
    const cardMatch = fullResponse.match(/```story_card\s*([\s\S]*?)\s*```/);
    if (cardMatch) {
      try {
        storyCard = JSON.parse(cardMatch[1]);
        cleanText = fullResponse.replace(/```story_card[\s\S]*?```/, '').trim();
      } catch (e) {
        console.warn('Failed to parse story_card JSON:', e);
      }
    }

    let matrixCard = undefined;
    const matrixMatch = fullResponse.match(/```matrix_card\s*([\s\S]*?)\s*```/);
    if (matrixMatch) {
      try {
        matrixCard = JSON.parse(matrixMatch[1]);
        cleanText = cleanText.replace(/```matrix_card[\s\S]*?```/, '').trim();
      } catch (e) {
        console.warn('Failed to parse matrix_card JSON:', e);
      }
    }

    let actionHint = undefined;
    if (cleanText.includes('乐律心声') || userText.includes('听歌') || userText.includes('音乐')) {
      actionHint = { tabKey: 'fire', label: '前往「乐律心声」' };
    } else if (cleanText.includes('哲理故事') || userText.includes('阅读') || storyCard) {
      actionHint = { tabKey: 'metal', label: '前往「哲理故事」' };
    } else if (cleanText.includes('影像载忆') || userText.includes('视频') || userText.includes('动画')) {
      actionHint = { tabKey: 'water', label: '前往「影像载忆」' };
    }

    return res.json({
      success: true,
      text: cleanText,
      storyCard,
      matrixCard,
      actionHint,
    });
  } catch (error: any) {
    console.warn('Gemini chat fallback activated:', error?.message || 'API limit');
    return res.json({
      success: true,
      text: `我是你的谷歌灵智机甲猫，听到了你关于“${userText}”的问询。心随音动，万物皆有回响。若你想依歌词创作故事，随时点选【歌词创生小故事】快捷指令。`,
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
