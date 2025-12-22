
// 格式化时间
export function formatTime(seconds: number | null): string {
    if (!seconds || isNaN(seconds)) return "未知";
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
}

// 格式化日期为"年月日"格式
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "未知";
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    } catch {
        return dateStr;
    }
}

// Admin 页面函数
// 通用防抖函数（适用于回调/输入等场景）
export function debounce<Args extends unknown[]>(
    func: (...args: Args) => void,
    wait: number,
): (...args: Args) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// 工具函数：将对象中的空字符串转为 null
export function convertEmptyStringToNull<T>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map(convertEmptyStringToNull) as T;
    } else if (obj && typeof obj === "object") {
        const newObj: Record<string, unknown> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const val = (obj as Record<string, unknown>)[key];
                if (val === "") {
                    newObj[key] = null;
                } else if (Array.isArray(val)) {
                    newObj[key] = val.map((item) => (item === "" ? null : item));
                } else {
                    newObj[key] = val;
                }
            }
        }
        return newObj as T;
    }
    return obj;
}

// 字段格式化工具（用于表格/详情展示）
export function formatField(
    val: unknown,
    type: "text" | "number" | "array" | "boolean" | "date" | "textarea",
): string {
    if (val == null) return "-";
    if (type === "array")
        return Array.isArray(val) ? (val as string[]).join(", ") : String(val);
    if (type === "boolean") return val ? "是" : "否";
    if (type === "date") return val ? String(val).slice(0, 10) : "-";
    if (type === "textarea" && typeof val === "string" && val.length > 50) {
        return val.substring(0, 50) + "...";
    }
    return String(val);
}
