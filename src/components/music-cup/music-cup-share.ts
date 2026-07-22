import type { Song } from "@/lib/types";
import { getCupCoverUrls } from "./music-cup-cover";
import type { TournamentState } from "./music-cup-types";
import { getCupResult } from "./music-cup-utils";

const WIDTH = 1800;
const HEIGHT = 2800;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (
    result.length > 1 &&
    context.measureText(`${result}…`).width > maxWidth
  ) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function loadFirstAvailableImage(urls: string[]) {
  for (const url of urls) {
    const image = await loadImage(url);
    if (image) return image;
  }
  return null;
}

async function drawChampionCover(
  context: CanvasRenderingContext2D,
  champion: Song,
) {
  const image = await loadFirstAvailableImage(getCupCoverUrls(champion));
  const x = 104;
  const y = 242;
  const size = 300;

  context.save();
  roundedRect(context, x, y, size, size, 28);
  context.clip();
  if (image) {
    const scale = Math.max(size / image.width, size / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(
      image,
      x + (size - width) / 2,
      y + (size - height) / 2,
      width,
      height,
    );
  } else {
    const gradient = context.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, "#294c50");
    gradient.addColorStop(1, "#b64b39");
    context.fillStyle = gradient;
    context.fillRect(x, y, size, size);
    context.fillStyle = "rgba(255,255,255,.9)";
    context.font = '700 82px "Songti SC", serif';
    context.textAlign = "center";
    context.fillText(champion.title.slice(0, 2), x + size / 2, y + 178);
  }
  context.restore();

  context.strokeStyle = "rgba(99,64,43,.34)";
  context.lineWidth = 5;
  roundedRect(context, x, y, size, size, 28);
  context.stroke();
}

function drawPaper(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#f4efdf");
  gradient.addColorStop(0.48, "#eee7d4");
  gradient.addColorStop(1, "#e3d9c3");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  let seed = 9487;
  for (let index = 0; index < 1800; index += 1) {
    seed = (seed * 48271) % 2147483647;
    const x = (seed / 2147483647) * WIDTH;
    seed = (seed * 48271) % 2147483647;
    const y = (seed / 2147483647) * HEIGHT;
    const alpha = 0.018 + (seed % 13) / 1000;
    context.fillStyle = `rgba(73, 58, 39, ${alpha})`;
    context.fillRect(x, y, 1 + (seed % 4), 1);
  }

  const wash = context.createRadialGradient(1550, 290, 20, 1550, 290, 560);
  wash.addColorStop(0, "rgba(39,73,73,.16)");
  wash.addColorStop(1, "rgba(39,73,73,0)");
  context.fillStyle = wash;
  context.fillRect(900, 0, 900, 900);

  context.strokeStyle = "rgba(111,45,35,.3)";
  context.lineWidth = 3;
  context.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);
  context.strokeStyle = "rgba(111,45,35,.12)";
  context.strokeRect(66, 66, WIDTH - 132, HEIGHT - 132);
}

export async function createShareImage(
  state: TournamentState,
  songsById: Map<number, Song>,
  locale: string,
) {
  const result = getCupResult(state, songsById);
  if (!result) throw new Error("赛事结果尚未完成");

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持 Canvas");

  drawPaper(context);
  await drawChampionCover(context, result.champion);

  context.textAlign = "left";
  context.fillStyle = "#273f3f";
  context.font = '500 38px "Kaiti SC", "STKaiti", serif';
  context.fillText("河图作品勘鉴 · 私人问鼎帖", 470, 278);
  context.fillStyle = "#9c3d31";
  context.font = '700 104px "Songti SC", "STSong", serif';
  context.fillText(fitText(context, result.champion.title, 1140), 468, 410);
  context.fillStyle = "#665848";
  context.font = '400 32px "Kaiti SC", "STKaiti", serif';
  context.fillText(`魁首 · ${result.champion.title}`, 470, 476);
  context.fillText(`次席 · ${result.runnerUp.title}`, 470, 524);
  context.fillStyle = "rgba(102,88,72,.74)";
  context.font = '400 26px "Kaiti SC", "STKaiti", serif';
  context.fillText(
    `四席 · ${result.semifinalists.map((song) => song.title).join(" / ")}`,
    470,
    568,
  );

  context.strokeStyle = "rgba(110,65,47,.28)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(104, 634);
  context.lineTo(WIDTH - 104, 634);
  context.stroke();

  const completeRounds = state.rounds.filter(
    (round) => round.winners.length === round.entrants.length / 2,
  );
  const stages = [
    completeRounds[0]?.entrants ?? [],
    ...completeRounds.map((round) => round.winners),
  ];
  const headers = ["三十二强", "十六强", "八强", "四席", "终局", "魁首"];
  const left = 108;
  const top = 750;
  const bottom = 2534;
  const nodeWidth = 238;
  const columnGap = (WIDTH - left * 2 - nodeWidth) / (headers.length - 1);
  const nodeHeight = 43;
  const positions: number[][] = [];
  const firstGap = (bottom - top) / 32;
  positions[0] = Array.from(
    { length: 32 },
    (_, index) => top + firstGap * (index + 0.5),
  );
  for (let stage = 1; stage < stages.length; stage += 1) {
    positions[stage] = Array.from(
      { length: stages[stage].length },
      (_, index) => {
        const previous = positions[stage - 1];
        return (previous[index * 2] + previous[index * 2 + 1]) / 2;
      },
    );
  }

  context.textAlign = "center";
  for (let stage = 0; stage < headers.length; stage += 1) {
    const x = left + stage * columnGap + nodeWidth / 2;
    context.fillStyle = stage === headers.length - 1 ? "#9c3d31" : "#405758";
    context.font = '600 28px "Songti SC", "STSong", serif';
    context.fillText(headers[stage], x, 700);
  }

  context.strokeStyle = "rgba(58,78,76,.34)";
  context.lineWidth = 2.5;
  for (let stage = 1; stage < stages.length; stage += 1) {
    const previousX = left + (stage - 1) * columnGap + nodeWidth;
    const nextX = left + stage * columnGap;
    positions[stage].forEach((y, index) => {
      const firstY = positions[stage - 1][index * 2];
      const secondY = positions[stage - 1][index * 2 + 1];
      const elbow = previousX + (nextX - previousX) / 2;
      context.beginPath();
      context.moveTo(previousX, firstY);
      context.lineTo(elbow, firstY);
      context.lineTo(elbow, secondY);
      context.lineTo(nextX, y);
      context.stroke();
    });
  }

  stages.forEach((ids, stage) => {
    const x = left + stage * columnGap;
    ids.forEach((id, index) => {
      const y = positions[stage][index];
      const song = songsById.get(id);
      const isChampion = stage === stages.length - 1;
      context.fillStyle = isChampion
        ? "rgba(156,61,49,.94)"
        : stage === 0
          ? "rgba(250,247,238,.86)"
          : "rgba(237,232,216,.96)";
      roundedRect(context, x, y - nodeHeight / 2, nodeWidth, nodeHeight, 9);
      context.fill();
      context.strokeStyle = isChampion
        ? "rgba(116,38,31,.9)"
        : "rgba(74,83,75,.26)";
      context.lineWidth = 1.5;
      context.stroke();
      context.fillStyle = isChampion ? "#fff8ea" : "#3f4039";
      context.font = `${isChampion ? 600 : 400} 20px "Songti SC", "STSong", serif`;
      context.textAlign = "center";
      context.fillText(
        fitText(context, song?.title ?? `曲目 ${id}`, nodeWidth - 18),
        x + nodeWidth / 2,
        y + 7,
      );
    });
  });

  context.textAlign = "left";
  context.fillStyle = "rgba(71,64,54,.72)";
  context.font = '400 25px "Kaiti SC", "STKaiti", serif';
  context.fillText("十二支分席 · 八席遗珠归来 · 五重问鼎", 106, 2648);
  context.textAlign = "right";
  context.fillText(`hetu-music.com/${locale}/music-cup`, WIDTH - 106, 2648);
  context.fillStyle = "#9c3d31";
  context.fillRect(WIDTH - 174, 2690, 68, 68);
  context.fillStyle = "#f4efdf";
  context.font = '700 32px "Songti SC", serif';
  context.textAlign = "center";
  context.fillText("图", WIDTH - 140, 2736);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("分享图生成失败"));
    }, "image/png");
  });
}
