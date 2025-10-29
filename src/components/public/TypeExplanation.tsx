import React from "react";
import { typeColorMap } from "../lib/constants";

const typeDescriptions: Record<string, string> = {
  原创: "河图原创作品。",
  翻唱: "翻唱他人作品，非原创。",
  合作: "与其他歌手或音乐人合作完成的作品。",
  商业: "为商业项目或品牌创作的作品。",
  墨宝: "与墨明棋妙相关的作品。",
  参与: "以非主创身份参与的作品。",
};

const TypeExplanation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative text-white">
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">类型标签说明</h2>
        <ul className="space-y-4">
          {Object.entries(typeColorMap).map(([type, colorClass]) => (
            <li
              key={type}
              className={`flex items-center border rounded-lg px-4 py-3 ${colorClass}`}
            >
              <span className="font-semibold text-lg mr-4 min-w-[3em]">
                {type}
              </span>
              <span className="text-base">
                {typeDescriptions[type] || "暂无说明"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TypeExplanation;
