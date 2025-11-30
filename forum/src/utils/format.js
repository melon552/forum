// 在 utils/format.js 中添加
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

export const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'k';
  }
  return num;
};

